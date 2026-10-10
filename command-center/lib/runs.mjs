// Vòng lặp agent + quản lý lượt chạy. Mỗi lượt chạy: lệnh -> skill -> agent dùng công cụ ->
// các điểm chờ duyệt/hỏi -> báo cáo. Sự kiện lưu JSONL để xem lại và phát qua SSE.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildSystemPrompt } from './skills.mjs';
import { toolDefs, executeTool } from './tools.mjs';
import { redact } from './safety.mjs';

const MAX_TURNS = 40;
const MAX_TOKENS_OUT = 4096;

export class RunManager {
  constructor({ dataDir, skills, provider, getSafety }) {
    this.dataDir = dataDir;
    this.runsDir = path.join(dataDir, 'runs');
    fs.mkdirSync(this.runsDir, { recursive: true });
    this.auditFile = path.join(dataDir, 'audit.jsonl');
    this.skills = skills;
    this.provider = provider;
    this.getSafety = getSafety; // () => { freezeDir }
    this.runs = new Map();
    this.#loadExisting();
  }

  #loadExisting() {
    for (const id of fs.readdirSync(this.runsDir)) {
      const f = path.join(this.runsDir, id, 'run.json');
      if (!fs.existsSync(f)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (meta.status === 'running' || meta.status === 'waiting') meta.status = 'stopped';
        const evf = path.join(this.runsDir, id, 'events.jsonl');
        const events = fs.existsSync(evf) ? fs.readFileSync(evf, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
        this.runs.set(id, { ...meta, events, listeners: new Set(), pending: null });
      } catch { /* bỏ qua bản ghi hỏng */ }
    }
  }

  audit(runId, kind, data = {}) {
    const rec = { t: new Date().toISOString(), run: runId, kind, ...data };
    fs.appendFileSync(this.auditFile, `${JSON.stringify(rec)}\n`);
  }

  list() {
    return [...this.runs.values()]
      .map(({ id, skill, prompt, status, workspace, createdAt, verdict, pipeline }) => ({ id, skill, prompt, status, workspace, createdAt, verdict, pipeline }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id) { return this.runs.get(id); }

  #persistMeta(run) {
    const { events, listeners, pending, abort, ...meta } = run;
    fs.writeFileSync(path.join(this.runsDir, run.id, 'run.json'), JSON.stringify(meta, null, 2));
  }

  #emit(run, type, data = {}) {
    const ev = { i: run.events.length, t: new Date().toISOString(), type, ...data };
    run.events.push(ev);
    fs.appendFileSync(path.join(this.runsDir, run.id, 'events.jsonl'), `${JSON.stringify(ev)}\n`);
    for (const l of run.listeners) l(ev);
    return ev;
  }

  start({ skillName, prompt, workspace, mode = 'ask', priorRunId = null, pipeline = null }) {
    const skill = this.skills.get(skillName);
    if (!skill) throw new Error(`Không có skill "${skillName}".`);
    if (!skill.executable) throw new Error(skill.unavailableReason || 'Skill này không chạy được ở đây.');
    if (!fs.existsSync(workspace) || !fs.statSync(workspace).isDirectory()) throw new Error('Workspace không tồn tại.');
    const realWs = fs.realpathSync(workspace);
    const id = `r${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
    fs.mkdirSync(path.join(this.runsDir, id), { recursive: true });
    const run = {
      id, skill: skillName, prompt, workspace: realWs, mode, status: 'running', verdict: null,
      createdAt: new Date().toISOString(), priorRunId, pipeline, events: [], listeners: new Set(),
      pending: null, abort: new AbortController(),
    };
    this.runs.set(id, run);
    this.#persistMeta(run);
    this.#emit(run, 'start', { skill: skillName, prompt, workspace: realWs, mode });
    this.audit(id, 'run_start', { skill: skillName, mode });
    this.#loop(run, skill).catch((e) => this.#finish(run, 'error', null, e.message));
    return run;
  }

  #finish(run, status, verdict, message) {
    if (['done', 'error', 'stopped'].includes(run.status)) return;
    run.status = status;
    run.verdict = verdict;
    run.pending = null;
    this.#emit(run, 'end', { status, verdict, message });
    this.#persistMeta(run);
    this.audit(run.id, 'run_end', { status, verdict });
  }

  stop(id) {
    const run = this.runs.get(id);
    if (!run || ['done', 'error', 'stopped'].includes(run.status)) return false;
    run.abort.abort();
    if (run.pending) run.pending.resolve({ stopped: true });
    this.#finish(run, 'stopped', null, 'Người dùng dừng.');
    return true;
  }

  // Chờ người dùng: trả Promise, giải quyết khi /respond được gọi.
  #waitUser(run, request) {
    return new Promise((resolve) => {
      const pendingId = crypto.randomBytes(4).toString('hex');
      run.pending = { id: pendingId, request, resolve: (v) => { run.pending = null; if (run.status === 'waiting') run.status = 'running'; resolve(v); } };
      run.status = 'waiting';
      this.#emit(run, 'pending', { pendingId, request });
      this.#persistMeta(run);
    });
  }

  respond(id, pendingId, payload) {
    const run = this.runs.get(id);
    if (!run?.pending || run.pending.id !== pendingId) return false;
    const { request } = run.pending;
    this.#emit(run, 'answered', { pendingId, type: request.type, payload });
    this.audit(id, 'user_response', { type: request.type, allow: payload.allow ?? null });
    run.pending.resolve(payload);
    return true;
  }

  async #loop(run, skill) {
    const safety = () => this.getSafety();
    const priorReport = run.priorRunId ? this.report(run.priorRunId) : null;
    const system = buildSystemPrompt(skill, { workspace: run.workspace, mode: run.mode, freezeDir: safety().freezeDir, priorReport });
    const tools = toolDefs(skill);
    const messages = [{ role: 'user', content: run.prompt || `Chạy /${skill.name} cho workspace hiện tại.` }];

    const ctx = {
      workspace: run.workspace,
      mode: run.mode,
      skill,
      signal: run.abort.signal,
      get freezeDir() { return safety().freezeDir; },
      audit: (kind, data) => this.audit(run.id, kind, data),
      approve: async (req) => {
        const r = await this.#waitUser(run, { ...req, command: req.command && redact(req.command).text });
        return r.stopped ? { allow: false, reason: 'dừng' } : { allow: !!r.allow, reason: r.reason };
      },
      ask: async (q) => {
        const r = await this.#waitUser(run, { type: 'question', ...q });
        return r.stopped ? '(đã dừng)' : String(r.answer ?? '');
      },
    };

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      if (run.abort.signal.aborted) return;
      let resp;
      try {
        this.audit(run.id, 'model_call', { turn, messages: messages.length });
        resp = await this.provider.complete({ system, tools, messages, maxTokens: MAX_TOKENS_OUT, signal: run.abort.signal });
      } catch (e) {
        if (run.abort.signal.aborted) return;
        return this.#finish(run, 'error', null, `Lỗi gọi mô hình: ${e.message}`);
      }
      messages.push({ role: 'assistant', content: resp.content });
      for (const b of resp.content) {
        if (b.type === 'text' && b.text.trim()) this.#emit(run, 'assistant', { text: redact(b.text).text });
      }
      const uses = resp.content.filter((b) => b.type === 'tool_use');
      if (!uses.length) {
        // Không gọi công cụ và không finish: coi là báo cáo cuối dạng văn bản.
        const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        this.#saveReport(run, text);
        return this.#finish(run, 'done', 'DONE_WITH_CONCERNS', 'Agent kết thúc mà không gọi finish.');
      }
      const results = [];
      for (const u of uses) {
        if (run.abort.signal.aborted) return;
        if (u.name === 'finish') {
          this.#saveReport(run, u.input.report || '');
          this.#emit(run, 'report', { status: u.input.status, report: redact(u.input.report || '').text });
          return this.#finish(run, 'done', u.input.status, null);
        }
        this.#emit(run, 'tool', { id: u.id, name: u.name, input: redact(JSON.stringify(u.input)).text.slice(0, 4000) });
        let r;
        try { r = await executeTool(u.name, u.input, ctx); } catch (e) { r = { content: `Lỗi công cụ: ${e.message}`, isError: true }; }
        if (run.abort.signal.aborted) return;
        const shown = redact(r.content);
        this.#emit(run, 'tool_result', { id: u.id, isError: !!r.isError, text: shown.text.slice(0, 6000), redacted: shown.hits });
        results.push({ type: 'tool_result', tool_use_id: u.id, content: shown.text, is_error: !!r.isError });
      }
      messages.push({ role: 'user', content: results });
    }
    this.#finish(run, 'done', 'BLOCKED', `Đạt giới hạn ${MAX_TURNS} lượt.`);
  }

  #saveReport(run, text) {
    fs.writeFileSync(path.join(this.runsDir, run.id, 'report.md'), redact(text).text);
  }

  report(id) {
    const f = path.join(this.runsDir, id, 'report.md');
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  }
}
