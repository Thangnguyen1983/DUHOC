// Công cụ agent được dùng. Mọi công cụ đều qua kiểm tra workspace/freeze/bí mật;
// ghi file và lệnh không-chỉ-đọc cần duyệt (trừ chế độ tự-sửa cho file thường).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { classifyCommand, resolveInside, isSensitivePath, checkFreeze, wrapUntrusted, scrubEnv } from './safety.mjs';

const MAX_READ = 200_000;
const MAX_OUT = 30_000;
const CMD_TIMEOUT_MS = 120_000;

export function toolDefs(skill) {
  const defs = [
    { name: 'list_dir', description: 'Liệt kê thư mục trong workspace.', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: [] } },
    { name: 'read_file', description: 'Đọc file văn bản trong workspace (tối đa 200KB).', input_schema: { type: 'object', properties: { path: { type: 'string' }, start_line: { type: 'integer' }, end_line: { type: 'integer' } }, required: ['path'] } },
    { name: 'search', description: 'Tìm chuỗi/regex trong workspace (grep -rnE).', input_schema: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' } }, required: ['pattern'] } },
    { name: 'run_command', description: 'Chạy một lệnh shell trong workspace. Lệnh chỉ-đọc chạy ngay; lệnh khác cần người dùng duyệt; lệnh phá hủy bị chặn.', input_schema: { type: 'object', properties: { command: { type: 'string' }, reason: { type: 'string' } }, required: ['command', 'reason'] } },
    { name: 'ask_user', description: 'Hỏi người dùng một quyết định độc lập, kèm các lựa chọn. Dừng chờ trả lời thật.', input_schema: { type: 'object', properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, recommendation: { type: 'string' } }, required: ['question', 'options'] } },
    { name: 'finish', description: 'Kết thúc lượt chạy với báo cáo cuối.', input_schema: { type: 'object', properties: { status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED', 'NEEDS_CONTEXT'] }, report: { type: 'string' } }, required: ['status', 'report'] } },
  ];
  if (!skill.readOnly) {
    defs.push(
      { name: 'write_file', description: 'Tạo/ghi đè file trong workspace.', input_schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' }, reason: { type: 'string' } }, required: ['path', 'content', 'reason'] } },
      { name: 'edit_file', description: 'Thay đúng một đoạn văn bản duy nhất trong file.', input_schema: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' }, reason: { type: 'string' } }, required: ['path', 'old_string', 'new_string', 'reason'] } },
    );
  }
  return defs;
}

function clip(s, n = MAX_OUT) {
  s = String(s);
  return s.length > n ? `${s.slice(0, n)}\n…[cắt ${s.length - n} ký tự]` : s;
}

function runProcess(file, args, cwd, signal) {
  return new Promise((resolve) => {
    const p = spawn(file, args, { cwd, env: scrubEnv(process.env), signal, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    const take = (d) => { if (out.length < MAX_OUT * 2) out += d; };
    p.stdout.on('data', take);
    p.stderr.on('data', take);
    const timer = setTimeout(() => p.kill('SIGKILL'), CMD_TIMEOUT_MS);
    p.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, out: `${out}\n${e.message}` }); });
    p.on('close', (code, sig) => { clearTimeout(timer); resolve({ code: code ?? (sig ? 137 : -1), out }); });
  });
}

// ctx: { workspace, mode, freezeDir, skill, approve(request)->Promise<{allow,reason}>, ask(q)->Promise<string>, signal, audit }
export async function executeTool(name, input, ctx) {
  const ws = ctx.workspace;
  const pathCheck = (p, { write = false } = {}) => {
    const r = resolveInside(ws, p);
    if (!r.ok) return { error: r.reason };
    if (isSensitivePath(r.rel)) return { error: `Từ chối: "${r.rel}" có thể chứa bí mật. Thông tin đăng nhập không đi qua agent.` };
    if (write) {
      if (r.rel === '.git' || r.rel.startsWith(`.git${path.sep}`)) return { error: 'Không được ghi trong .git.' };
      const f = checkFreeze(ctx.freezeDir, r.abs);
      if (!f.ok) return { error: f.reason };
    }
    return r;
  };

  switch (name) {
    case 'list_dir': {
      const r = pathCheck(input.path || '.');
      if (r.error) return { content: r.error, isError: true };
      try {
        const items = fs.readdirSync(r.abs, { withFileTypes: true })
          .filter((d) => d.name !== '.git' && d.name !== 'node_modules')
          .map((d) => (d.isDirectory() ? `${d.name}/` : d.name));
        return { content: wrapUntrusted(`dir:${r.rel}`, items.join('\n') || '(trống)') };
      } catch (e) { return { content: e.message, isError: true }; }
    }
    case 'read_file': {
      const r = pathCheck(input.path);
      if (r.error) return { content: r.error, isError: true };
      try {
        const st = fs.statSync(r.abs);
        if (!st.isFile()) return { content: 'Không phải file.', isError: true };
        if (st.size > MAX_READ * 5) return { content: 'File quá lớn, dùng start_line/end_line hoặc search.', isError: true };
        const lines = fs.readFileSync(r.abs, 'utf8').split('\n');
        const a = Math.max(1, input.start_line || 1);
        const b = Math.min(lines.length, input.end_line || lines.length);
        const text = lines.slice(a - 1, b).map((l, i) => `${a + i}\t${l}`).join('\n');
        return { content: wrapUntrusted(`file:${r.rel}`, clip(text, MAX_READ)) };
      } catch (e) { return { content: e.message, isError: true }; }
    }
    case 'search': {
      const r = pathCheck(input.path || '.');
      if (r.error) return { content: r.error, isError: true };
      const res = await runProcess('grep', ['-rnIE', '--exclude-dir=.git', '--exclude-dir=node_modules', '--exclude=.env*', '-m', '50', '--', String(input.pattern), r.abs], ws, ctx.signal);
      return { content: wrapUntrusted('search', clip(res.out || '(không có kết quả)')) };
    }
    case 'write_file':
    case 'edit_file': {
      if (ctx.skill.readOnly) return { content: 'Skill này chỉ đọc.', isError: true };
      const r = pathCheck(input.path, { write: true });
      if (r.error) return { content: r.error, isError: true };
      let next;
      let before = null;
      if (name === 'write_file') {
        next = String(input.content);
        before = fs.existsSync(r.abs) ? fs.readFileSync(r.abs, 'utf8') : null;
      } else {
        try { before = fs.readFileSync(r.abs, 'utf8'); } catch (e) { return { content: e.message, isError: true }; }
        const count = before.split(input.old_string).length - 1;
        if (count !== 1) return { content: `old_string phải xuất hiện đúng 1 lần (hiện ${count}).`, isError: true };
        next = before.replace(input.old_string, () => input.new_string);
      }
      const autoOk = ctx.mode === 'auto-edit' && !ctx.skill.alwaysAsk;
      if (!autoOk) {
        const d = await ctx.approve({ type: 'file', title: `${name === 'write_file' ? 'Ghi' : 'Sửa'} ${r.rel}`, path: r.rel, reason: input.reason, before, after: next });
        if (!d.allow) return { content: `Người dùng từ chối.${d.reason ? ` Lý do: ${d.reason}` : ''}`, isError: true };
      }
      fs.mkdirSync(path.dirname(r.abs), { recursive: true });
      fs.writeFileSync(r.abs, next);
      ctx.audit('file_write', { path: r.rel, bytes: next.length, auto: autoOk });
      return { content: `Đã ghi ${r.rel} (${next.length} byte).` };
    }
    case 'run_command': {
      const cls = classifyCommand(input.command);
      if (cls.level === 'deny') {
        ctx.audit('command_denied', { rule: cls.rule });
        return { content: `Bị chặn cứng (${cls.rule}). Không thể chạy lệnh này; hãy đề xuất cách khác hoặc nhờ người dùng tự chạy.`, isError: true };
      }
      if (ctx.skill.readOnly && cls.level !== 'auto') {
        return { content: 'Skill chỉ đọc: chỉ chạy được lệnh chỉ-đọc.', isError: true };
      }
      if (cls.level === 'ask') {
        const d = await ctx.approve({ type: 'command', title: 'Chạy lệnh', command: input.command, reason: input.reason, rule: cls.rule });
        if (!d.allow) return { content: `Người dùng từ chối.${d.reason ? ` Lý do: ${d.reason}` : ''}`, isError: true };
      }
      const res = await runProcess('bash', ['-c', input.command], ws, ctx.signal);
      ctx.audit('command_run', { rule: cls.rule, code: res.code });
      return { content: wrapUntrusted(`cmd:${input.command.slice(0, 80)}`, `exit=${res.code}\n${clip(res.out)}`) };
    }
    case 'ask_user': {
      const ans = await ctx.ask({ question: input.question, options: input.options || [], recommendation: input.recommendation });
      return { content: `Người dùng trả lời: ${ans}` };
    }
    default:
      return { content: `Công cụ không tồn tại: ${name}`, isError: true };
  }
}
