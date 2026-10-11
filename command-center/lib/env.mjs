// Đọc/ghi tệp .env.local (khoá API). Khoá không bao giờ được trả lại qua API, chỉ trả 4 ký tự cuối.
import fs from 'node:fs';

export function parseEnv(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

// Nạp vào process.env nhưng không ghi đè biến đã đặt sẵn từ bên ngoài.
export function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const [k, v] of Object.entries(parseEnv(fs.readFileSync(file, 'utf8')))) if (v && process.env[k] == null) process.env[k] = v;
}

export function setEnvVar(file, key, value) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  const kept = lines.filter((l) => !new RegExp(`^\\s*${key}\\s*=`).test(l) && l !== '');
  if (value) kept.push(`${key}=${value}`);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${kept.join('\n')}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file);
  fs.chmodSync(file, 0o600);
}

export const keyHint = (k) => (k ? `…${String(k).slice(-4)}` : null);
export const validKey = (k) => typeof k === 'string' && /^[\w-]{20,300}$/.test(k);
export const validWorkspaceId = (w) => typeof w === 'string' && /^[\w-]{3,100}$/.test(w);
