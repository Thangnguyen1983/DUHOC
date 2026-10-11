#!/usr/bin/env node
// Máy chủ Trung tâm điều khiển. Chỉ lắng nghe 127.0.0.1, cần token, kiểm Host/Origin.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadSkills, suggest, parseCommand, PIPELINES } from './lib/skills.mjs';
import { RunManager } from './lib/runs.mjs';
import { Factory } from './lib/factory.mjs';
import { anthropicProvider, noKeyProvider } from './lib/provider.mjs';
import { loadEnvFile, setEnvVar, keyHint, validKey, validWorkspaceId } from './lib/env.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

export function createApp({ dataDir = path.join(HERE, 'data'), provider: initialProvider, envFile = path.join(HERE, '.env.local'), roots, token = crypto.randomBytes(24).toString('hex'), port = 0 } = {}) {
  // Nhà cung cấp mô hình có thể đổi nóng khi bạn nhập khoá trong giao diện.
  let inner = initialProvider;
  let currentKey = process.env.ANTHROPIC_API_KEY || null;
  let currentWs = process.env.ANTHROPIC_WORKSPACE_ID || null;
  const provider = { get name() { return inner.name; }, get model() { return inner.model; }, complete: (a) => inner.complete(a) };
  const skills = loadSkills();
  const allowedRoots = (roots || [path.resolve(HERE, '..')]).map((r) => fs.realpathSync(r));
  const safetyFile = path.join(dataDir, 'safety.json');
  let safety = { freezeDir: null };
  try { safety = { ...safety, ...JSON.parse(fs.readFileSync(safetyFile, 'utf8')) }; } catch { /* mặc định */ }
  const saveSafety = () => { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(safetyFile, JSON.stringify(safety)); };

  const manager = new RunManager({ dataDir, skills, provider, getSafety: () => safety });
  const factory = new Factory({ dataDir, manager, skills });
  const timer = setInterval(() => { try { if (provider.name !== 'none') factory.tick(); } catch { /* ngân sách/lỗi: bỏ qua lượt này */ } }, 10 * 60_000);
  timer.unref();

  const inRoots = (p) => {
    try {
      const real = fs.realpathSync(p);
      return allowedRoots.some((r) => real === r || real.startsWith(r + path.sep));
    } catch { return false; }
  };

  const json = (res, code, body) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };

  const readBody = (req) => new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (d) => { s += d; if (s.length > 1_000_000) { reject(new Error('Body quá lớn')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
  });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const addr = server.address();
      const okHosts = [`127.0.0.1:${addr.port}`, `localhost:${addr.port}`];
      if (!okHosts.includes(req.headers.host)) return json(res, 403, { error: 'Host không hợp lệ.' });

      const cookie = Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean).map((c) => { const i = c.indexOf('='); return [c.slice(0, i), c.slice(i + 1)]; }));
      const supplied = cookie.cc || (req.headers.authorization || '').replace(/^Bearer /, '');
      const authed = supplied.length === token.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(token));

      // Trang chủ: đổi ?token= thành cookie rồi chuyển hướng để token không nằm trong URL.
      if (req.method === 'GET' && url.pathname === '/') {
        if (url.searchParams.get('token') === token) {
          res.writeHead(302, { 'set-cookie': `cc=${token}; HttpOnly; SameSite=Strict; Path=/`, location: '/' });
          return res.end();
        }
        if (!authed) { res.writeHead(401, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Cần token. Mở đường dẫn in ra khi khởi động máy chủ.'); }
      }
      if (url.pathname.startsWith('/api/')) {
        if (!authed) return json(res, 401, { error: 'Chưa xác thực.' });
        if (req.method !== 'GET') {
          const origin = req.headers.origin;
          if (!origin || !okHosts.some((h) => origin === `http://${h}`)) return json(res, 403, { error: 'Origin không hợp lệ.' });
        }
      }

      // ---- API ----
      if (url.pathname === '/api/state' && req.method === 'GET') {
        return json(res, 200, {
          provider: { name: provider.name, model: provider.model },
          roots: allowedRoots,
          safety,
          pipelines: PIPELINES,
          skills: [...skills.values()].map(({ systemPromptCore, ...s }) => s),
          runs: manager.list(),
        });
      }
      if (url.pathname === '/api/suggest' && req.method === 'POST') {
        const b = await readBody(req);
        const cmd = parseCommand(skills, b.text);
        if (cmd?.skill) return json(res, 200, { command: { skill: cmd.skill.name, args: cmd.args }, suggestions: [] });
        return json(res, 200, { error: cmd?.error, suggestions: suggest(skills, b.text) });
      }
      if (url.pathname === '/api/runs' && req.method === 'POST') {
        const b = await readBody(req);
        let { skill, prompt } = b;
        if (!skill) {
          const cmd = parseCommand(skills, b.text);
          if (!cmd?.skill) return json(res, 400, { error: cmd?.error || 'Chọn một skill hoặc bắt đầu bằng /ten-skill.' });
          skill = cmd.skill.name; prompt = cmd.args;
        }
        if (!b.workspace || !inRoots(b.workspace)) return json(res, 400, { error: 'Workspace nằm ngoài các thư mục được phép.' });
        if (!['ask', 'auto-edit'].includes(b.mode || 'ask')) return json(res, 400, { error: 'Chế độ không hợp lệ.' });
        if (b.priorRunId && !manager.get(b.priorRunId)) return json(res, 400, { error: 'Lượt chạy trước không tồn tại.' });
        let run;
        try {
          run = manager.start({ skillName: skill, prompt, workspace: b.workspace, mode: b.mode || 'ask', priorRunId: b.priorRunId || null, pipeline: b.pipeline || null });
        } catch (e) { return json(res, 400, { error: e.message }); }
        return json(res, 201, { id: run.id });
      }
      const shot = url.pathname.match(/^\/api\/runs\/(\w+)\/shots\/(shot\d+\.jpg)$/);
      if (shot && req.method === 'GET') {
        const f = path.join(dataDir, 'runs', shot[1], 'shots', shot[2]);
        if (!manager.get(shot[1]) || !fs.existsSync(f)) return json(res, 404, { error: 'Không có ảnh.' });
        res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        return res.end(fs.readFileSync(f));
      }
      if (url.pathname.startsWith('/api/factory')) {
        const fail = (e) => json(res, 400, { error: e.message });
        const fp = url.pathname.slice('/api/factory'.length);
        if (fp === '' && req.method === 'GET') return json(res, 200, factory.overview());
        if (fp === '/research' && req.method === 'POST') {
          const b = await readBody(req);
          try { return json(res, 201, { runId: factory.startResearch({ focus: String(b.focus || '').slice(0, 300) }) }); } catch (e) { return fail(e); }
        }
        if (fp === '/schedule' && req.method === 'POST') return json(res, 200, factory.setSchedule(await readBody(req)));
        if (fp === '/projects' && req.method === 'POST') {
          const b = await readBody(req);
          try { const p = factory.startPlan(String(b.opportunityId || '')); return json(res, 201, { id: p.id }); } catch (e) { return fail(e); }
        }
        const pm = fp.match(/^\/projects\/(\w+)(?:\/(approve|reject|stop))?$/);
        if (pm) {
          const proj = factory.get(pm[1]);
          if (!proj) return json(res, 404, { error: 'Không có dự án.' });
          if (!pm[2] && req.method === 'GET') return json(res, 200, proj);
          if (req.method === 'POST') {
            const b = await readBody(req);
            try {
              if (pm[2] === 'approve') return json(res, 200, factory.approve(proj.id, String(b.planHash || '')));
              if (pm[2] === 'reject') { factory.rejectPlan(proj.id, String(b.feedback || '').slice(0, 2000)); return json(res, 200, { ok: true }); }
              if (pm[2] === 'stop') return json(res, 200, { stopped: factory.stop(proj.id) });
            } catch (e) { return fail(e); }
          }
        }
        return json(res, 404, { error: 'Không tìm thấy.' });
      }
      if (url.pathname === '/api/settings' && req.method === 'GET') return json(res, 200, { hasKey: provider.name !== 'none', keyHint: provider.name === 'none' ? null : keyHint(currentKey), model: provider.model, workspaceId: currentWs, envFile: path.basename(envFile) });
      if (url.pathname === '/api/settings/key' && req.method === 'POST') {
        const b = await readBody(req);
        if ('apiKey' in b) {
          const k = String(b.apiKey || '').trim();
          if (k && !validKey(k)) return json(res, 400, { error: 'Khoá không hợp lệ (20-300 ký tự chữ, số, - hoặc _).' });
          setEnvVar(envFile, 'ANTHROPIC_API_KEY', k);
          currentKey = k || null;
          if (k) process.env.ANTHROPIC_API_KEY = k; else delete process.env.ANTHROPIC_API_KEY;
          manager.audit('-', k ? 'api_key_set' : 'api_key_cleared', {});
        }
        if ('workspaceId' in b) {
          const w = String(b.workspaceId || '').trim();
          if (w && !validWorkspaceId(w)) return json(res, 400, { error: 'Workspace ID không hợp lệ (3-100 ký tự chữ, số, - hoặc _).' });
          setEnvVar(envFile, 'ANTHROPIC_WORKSPACE_ID', w);
          currentWs = w || null;
          if (w) process.env.ANTHROPIC_WORKSPACE_ID = w; else delete process.env.ANTHROPIC_WORKSPACE_ID;
          manager.audit('-', 'workspace_id_set', {});
        }
        inner = currentKey ? anthropicProvider({ apiKey: currentKey, model: process.env.CC_MODEL || 'claude-sonnet-5-5', workspaceId: currentWs }) : noKeyProvider();
        return json(res, 200, { hasKey: !!currentKey, keyHint: keyHint(currentKey), model: provider.model, workspaceId: currentWs });
      }
      let m = url.pathname.match(/^\/api\/runs\/([\w]+)(?:\/(stream|respond|stop|report))?$/);
      if (m) {
        const run = manager.get(m[1]);
        if (!run) return json(res, 404, { error: 'Không tìm thấy lượt chạy.' });
        const action = m[2];
        if (!action && req.method === 'GET') {
          const { listeners, abort, ...rest } = run;
          return json(res, 200, rest);
        }
        if (action === 'report' && req.method === 'GET') return json(res, 200, { report: manager.report(run.id) });
        if (action === 'stop' && req.method === 'POST') return json(res, 200, { stopped: manager.stop(run.id) });
        if (action === 'respond' && req.method === 'POST') {
          const b = await readBody(req);
          const ok = manager.respond(run.id, b.pendingId, { allow: b.allow === true, reason: b.reason, answer: b.answer });
          return json(res, ok ? 200 : 409, ok ? { ok } : { error: 'Yêu cầu chờ không còn hiệu lực.' });
        }
        if (action === 'stream' && req.method === 'GET') {
          res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
          const send = (ev) => res.write(`data: ${JSON.stringify(ev)}\n\n`);
          const from = Number(url.searchParams.get('from') || 0);
          for (const ev of run.events.slice(from)) send(ev);
          run.listeners.add(send);
          const ping = setInterval(() => res.write(': ping\n\n'), 20000);
          req.on('close', () => { run.listeners.delete(send); clearInterval(ping); });
          return;
        }
      }
      if (url.pathname === '/api/safety' && req.method === 'POST') {
        const b = await readBody(req);
        if (b.freezeDir == null || b.freezeDir === '') safety.freezeDir = null;
        else {
          if (!inRoots(b.freezeDir) || !fs.statSync(b.freezeDir).isDirectory()) return json(res, 400, { error: 'Thư mục freeze phải nằm trong workspace cho phép.' });
          safety.freezeDir = fs.realpathSync(b.freezeDir);
        }
        saveSafety();
        manager.audit('-', 'freeze_set', { dir: safety.freezeDir });
        return json(res, 200, safety);
      }
      if (url.pathname === '/api/dirs' && req.method === 'GET') {
        const base = url.searchParams.get('path') || allowedRoots[0];
        if (!inRoots(base)) return json(res, 400, { error: 'Ngoài phạm vi cho phép.' });
        const real = fs.realpathSync(base);
        const dirs = fs.readdirSync(real, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules').map((d) => d.name).sort();
        return json(res, 200, { path: real, dirs });
      }

      // ---- Tệp tĩnh ----
      if (req.method === 'GET') {
        const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const file = path.join(PUBLIC, rel);
        if (file.startsWith(PUBLIC + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
          res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'", 'x-content-type-options': 'nosniff' });
          return res.end(fs.readFileSync(file));
        }
      }
      json(res, 404, { error: 'Không tìm thấy.' });
    } catch (e) {
      json(res, 500, { error: e.message });
    }
  });

  return {
    server, manager, factory, token, skills,
    listen: () => new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server.address().port))),
    close: () => new Promise((resolve) => { clearInterval(timer); server.close(resolve); server.closeAllConnections(); }),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const envFile = path.join(HERE, '.env.local');
  loadEnvFile(envFile);
  const key = process.env.ANTHROPIC_API_KEY;
  const provider = key ? anthropicProvider({ apiKey: key, model: process.env.CC_MODEL || 'claude-sonnet-5-5', workspaceId: process.env.ANTHROPIC_WORKSPACE_ID || null }) : noKeyProvider();
  const roots = process.env.CC_ROOTS ? process.env.CC_ROOTS.split(path.delimiter) : undefined;
  // Token cố định (lưu trong data/token) để đường link luôn giống nhau và dùng được làm dấu trang.
  const tokenFile = path.join(HERE, 'data', 'token');
  let token = process.env.CC_TOKEN;
  if (!token) {
    try { token = fs.readFileSync(tokenFile, 'utf8').trim(); } catch { /* chưa có */ }
    if (!token || token.length < 32) { token = crypto.randomBytes(24).toString('hex'); fs.mkdirSync(path.dirname(tokenFile), { recursive: true }); fs.writeFileSync(tokenFile, token, { mode: 0o600 }); }
  }
  const app = createApp({ provider, roots, envFile, token, port: Number(process.env.PORT || 4577) });
  const port = await app.listen();
  const link = `http://127.0.0.1:${port}/?token=${app.token}`;
  fs.mkdirSync(path.join(HERE, 'data'), { recursive: true });
  fs.writeFileSync(path.join(HERE, 'data', '.url'), link, { mode: 0o600 });
  console.log(`\nTrung tâm điều khiển: ${link}\n`);
  console.log(key ? `Mô hình: ${provider.model}` : 'Chưa có khoá API: mở đường link trên, bấm "Khoá API" ở góc phải để nhập.');
}
