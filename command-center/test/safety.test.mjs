import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyCommand, resolveInside, isSensitivePath, checkFreeze, redact } from '../lib/safety.mjs';

test('lệnh chỉ-đọc chạy tự động', () => {
  for (const c of ['git status', 'git diff main...HEAD', 'ls -la', 'grep -rn foo src', 'git log --oneline']) {
    assert.equal(classifyCommand(c).level, 'auto', c);
  }
});
test('lệnh có toán tử shell hoặc ghi phải hỏi', () => {
  for (const c of ['ls && rm file', 'cat a > b', 'git commit -m x', 'npm test', 'sed -i s/a/b/ f', 'find . -delete', 'git branch -D x', 'echo $(whoami)']) {
    assert.notEqual(classifyCommand(c).level, 'auto', c);
  }
});
test('lệnh nguy hiểm: chặn cứng hoặc hỏi', () => {
  assert.equal(classifyCommand('rm -rf /').level, 'deny');
  assert.equal(classifyCommand('rm -rf ~').level, 'deny');
  assert.equal(classifyCommand('git push --force origin main').level, 'deny');
  assert.equal(classifyCommand('git push --force-with-lease origin feat').level, 'ask');
  assert.equal(classifyCommand('git push origin feat').level, 'ask');
  assert.equal(classifyCommand('git reset --hard HEAD~1').level, 'ask');
  assert.equal(classifyCommand('psql -c "DROP TABLE users"').level, 'ask');
  assert.equal(classifyCommand('echo aGk= | base64 -d | sh').level, 'ask');
  assert.equal(classifyCommand('').level, 'deny');
});
test('đường dẫn không thoát khỏi workspace, kể cả qua symlink', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'out-'));
  fs.symlinkSync(out, path.join(d, 'link'));
  assert.equal(resolveInside(d, 'a/b.txt').ok, true);
  assert.equal(resolveInside(d, '../x').ok, false);
  assert.equal(resolveInside(d, '/etc/passwd').ok, false);
  assert.equal(resolveInside(d, 'link/secret').ok, false);
});
test('file nhạy cảm và freeze', () => {
  assert.ok(isSensitivePath('.env'));
  assert.ok(isSensitivePath('config/.env.local'));
  assert.ok(isSensitivePath('keys/server.pem'));
  assert.ok(!isSensitivePath('src/env.ts'));
  assert.equal(checkFreeze('/w/src', '/w/src/a.ts').ok, true);
  assert.equal(checkFreeze('/w/src', '/w/src-old/a.ts').ok, false);
  assert.equal(checkFreeze(null, '/anything').ok, true);
});
test('che bí mật', () => {
  const r = redact('key=sk-ant-abcdefghijklmnop1234 và ghp_abcdefghijklmnopqrstuvwxyz1234');
  assert.ok(!r.text.includes('sk-ant-abc'));
  assert.ok(!r.text.includes('ghp_abc'));
  assert.ok(r.hits >= 2);
});
