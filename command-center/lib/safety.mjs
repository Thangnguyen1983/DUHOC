// Lớp an toàn: phân loại lệnh (careful), ranh giới sửa file (freeze), che bí mật.
// Đây là rào chắn chống nhầm lẫn, không phải sandbox bảo mật tuyệt đối: vì vậy mọi lệnh
// không nằm trong danh sách chỉ-đọc đều phải qua duyệt của người dùng.
import fs from 'node:fs';
import path from 'node:path';

// ---------- Phân loại lệnh shell ----------
const SHELL_META = /[;&|<>`\n]|\$\(|\$\{/;

// Lệnh chỉ đọc, an toàn để chạy tự động (một lệnh đơn, không toán tử shell).
const READONLY_CMDS = new Set([
  'ls', 'cat', 'head', 'tail', 'wc', 'grep', 'rg', 'pwd', 'echo', 'file', 'stat', 'du', 'df',
  'which', 'tree', 'sort', 'uniq', 'diff', 'date', 'basename', 'dirname', 'realpath',
]);
const READONLY_GIT = new Set([
  'status', 'diff', 'log', 'show', 'branch', 'rev-parse', 'ls-files', 'blame', 'remote',
  'describe', 'merge-base', 'shortlog', 'rev-list', 'config',
]);

const HIGH_PATTERNS = [
  { name: 'rm_root', test: (c) => /\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+)+(--\s+)?(\/|~|~\/|\$HOME|\$\{HOME\}|\/\*)\s*$/.test(c) },
  { name: 'force_push_default', test: (c) => /\bgit\s+push\b/.test(c) && /(\s-f\b|--force(?!-with-lease)|\s\+[\w/.-]+)/.test(c) && /\b(main|master)\b/.test(c) },
];

const ASK_PATTERNS = [
  { name: 'shell_disguise', re: /\$\{?IFS\}?|base64\s+-d|\|\s*(ba)?sh\b/ },
  { name: 'rm_recursive', re: /\brm\s+(-[a-zA-Z]*[rR]|--recursive)/ },
  { name: 'sql_drop', re: /\bdrop\s+(table|database)\b/i },
  { name: 'sql_truncate', re: /\btruncate\b/i },
  { name: 'git_force_push', re: /\bgit\s+push\b.*(\s-f\b|--force\b|\s\+[\w/.-]+)/ },
  { name: 'git_reset_hard', re: /\bgit\s+reset\s+--hard\b/ },
  { name: 'git_discard_all', re: /\bgit\s+(checkout|restore)\s+\.(\s|$)/ },
  { name: 'kubectl_delete', re: /\bkubectl\s+delete\b/ },
  { name: 'docker_destructive', re: /\bdocker\s+(rm\s+-f|system\s+prune)\b/ },
  { name: 'git_push', re: /\bgit\s+push\b/ },
  { name: 'pr_or_merge', re: /\bgh\s+pr\s+(merge|create)\b/ },
  { name: 'deploy', re: /\b(vercel|wrangler|netlify|fly)\s+(deploy|publish)\b|\bsupabase\s+db\s+push\b/ },
  { name: 'install', re: /\b(npm|pnpm|yarn|bun|pip3?)\s+(i|install|add)\b/ },
  { name: 'network_fetch', re: /\b(curl|wget)\b/ },
];

export function classifyCommand(cmd) {
  const c = String(cmd || '').trim();
  if (!c) return { level: 'deny', rule: 'empty' };
  for (const h of HIGH_PATTERNS) if (h.test(c)) return { level: 'deny', rule: h.name };
  for (const a of ASK_PATTERNS) if (a.re.test(c)) return { level: 'ask', rule: a.name };
  if (!SHELL_META.test(c)) {
    const parts = c.split(/\s+/);
    const bin = parts[0];
    if (READONLY_CMDS.has(bin)) return { level: 'auto', rule: 'readonly' };
    if (bin === 'git' && READONLY_GIT.has(parts[1] || '')) {
      // git config / branch / remote có biến thể ghi: chỉ cho tự động khi là dạng đọc.
      const writeish = /\b(config\s+(?!--get|--list|-l\b)\S|branch\s+(-[dDmM]|--delete)|remote\s+(add|remove|rm|set-url))/.test(c);
      return writeish ? { level: 'ask', rule: 'git_write' } : { level: 'auto', rule: 'readonly_git' };
    }
    if (bin === 'find' && !/-(exec|delete|ok)\b/.test(c)) return { level: 'auto', rule: 'readonly' };
    if (bin === 'sed' && !/\s-i\b|--in-place/.test(c)) return { level: 'auto', rule: 'readonly' };
  }
  return { level: 'ask', rule: 'unrecognized' };
}

// ---------- Đường dẫn: workspace, freeze, file nhạy cảm ----------
const SENSITIVE_NAME = /(^|\/)(\.env(\..*)?|id_rsa|id_ed25519|.*\.pem|.*\.key|\.npmrc|\.netrc|credentials(\.json)?|\.git\/config|\.aws\/.*)$/i;

export function resolveInside(root, p, { followLast = true } = {}) {
  const base = fs.realpathSync(root);
  const abs = path.resolve(base, String(p || '.'));
  // realpath của phần tồn tại sâu nhất để chặn symlink chui ra ngoài
  let probe = abs;
  while (!fs.existsSync(probe)) {
    const up = path.dirname(probe);
    if (up === probe) break;
    probe = up;
  }
  const real = fs.existsSync(probe) ? fs.realpathSync(probe) : probe;
  const rest = path.relative(probe, abs);
  const final = followLast || probe !== abs ? path.join(real, rest) : abs;
  if (final !== base && !final.startsWith(base + path.sep)) {
    return { ok: false, reason: 'Đường dẫn nằm ngoài workspace.' };
  }
  return { ok: true, abs: final, rel: path.relative(base, final) || '.' };
}

export function isSensitivePath(rel) {
  return SENSITIVE_NAME.test(rel.split(path.sep).join('/'));
}

export function checkFreeze(freezeDir, abs) {
  if (!freezeDir) return { ok: true };
  const f = path.resolve(freezeDir);
  if (abs === f || abs.startsWith(f + path.sep)) return { ok: true };
  return { ok: false, reason: `Freeze đang bật: chỉ được sửa trong ${f}.` };
}

// ---------- Che bí mật trước khi ghi nhật ký / gửi ra ngoài ----------
const SECRET_RES = [
  /sk-ant-[A-Za-z0-9_-]{10,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[A-Za-z0-9_\-./+]{12,}/gi,
];

export function redact(text) {
  let out = String(text ?? '');
  let hits = 0;
  for (const re of SECRET_RES) {
    out = out.replace(re, () => { hits++; return '[ĐÃ CHE]'; });
  }
  return { text: out, hits };
}

// Bọc dữ liệu không tin cậy (nội dung repo, kết quả lệnh) để mô hình coi là dữ liệu.
export function wrapUntrusted(label, text) {
  const body = String(text).replaceAll('</untrusted_data>', '</untrusted_data_>');
  return `<untrusted_data source="${label}">\n${body}\n</untrusted_data>`;
}

export function scrubEnv(env) {
  const out = {};
  for (const [k, v] of Object.entries(env)) {
    if (/KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|^CC_/i.test(k)) continue;
    out[k] = v;
  }
  return out;
}
