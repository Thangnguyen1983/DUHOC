import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.mjs';
import { scriptedProvider } from '../lib/provider.mjs';
import { loadSkills } from '../lib/skills.mjs';

const tu = (name, input, id = `t_${Math.random().toString(36).slice(2)}`) => ({ type: 'tool_use', id, name, input });

async function setup(script) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-root-'));
  const ws = path.join(root, 'proj');
  fs.mkdirSync(ws);
  fs.writeFileSync(path.join(ws, 'a.txt'), 'xin chào');
  fs.writeFileSync(path.join(ws, '.env'), 'SECRET=sk-ant-abcdefghijklmnop1234');
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-data-'));
  const app = createApp({ dataDir: data, provider: scriptedProvider(script), roots: [root], token: 'tok'.repeat(10) });
  const port = await app.listen();
  const base = `http://127.0.0.1:${port}`;
  const call = (p, body, opts = {}) => fetch(base + p, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { cookie: `cc=${app.token}`, origin: base, 'content-type': 'application/json', ...opts.headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  return { app, ws, root, call, base };
}
const waitFor = async (fn, ms = 3000) => { const t = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t > ms) throw new Error('timeout'); await new Promise((r) => setTimeout(r, 20)); } };

test('catalog nạp đủ skill và đánh dấu skill không chạy được', () => {
  const s = loadSkills();
  assert.ok(s.size >= 50);
  assert.equal(s.get('review').executable, true);
  assert.equal(s.get('browse').executable, false);
  assert.equal(s.get('careful').kind, 'safety');
  assert.equal(s.get('cso').readOnly, true);
});

test('API từ chối khi thiếu token, sai Host hoặc sai Origin', async () => {
  const { app, base } = await setup([]);
  assert.equal((await fetch(`${base}/api/state`)).status, 401);
  const spoof = await new Promise((resolve) => {
    const r = http.request({ host: '127.0.0.1', port: new URL(base).port, path: '/api/state', headers: { cookie: `cc=${app.token}`, host: 'evil.com' } }, (res) => { res.resume(); resolve(res.statusCode); });
    r.end();
  });
  assert.equal(spoof, 403);
  const bad = await fetch(`${base}/api/runs`, { method: 'POST', headers: { cookie: `cc=${app.token}`, origin: 'http://evil.com', 'content-type': 'application/json' }, body: '{}' });
  assert.equal(bad.status, 403);
  await app.close();
});

test('ghi file cần duyệt: duyệt thì ghi, từ chối thì không', async () => {
  const { app, ws, call } = await setup([
    [tu('write_file', { path: 'out.txt', content: 'A', reason: 'thử' }, 'w1')],
    [tu('write_file', { path: 'out2.txt', content: 'B', reason: 'thử' }, 'w2')],
    [tu('finish', { status: 'DONE', report: 'xong' })],
  ]);
  const { body: { id } } = await call('/api/runs', { skill: 'review', prompt: 'x', workspace: ws });
  let run = await waitFor(async () => { const r = (await call(`/api/runs/${id}`)).body; return r.pending && r; });
  assert.equal(run.pending.request.path, 'out.txt');
  assert.ok(!fs.existsSync(path.join(ws, 'out.txt')), 'chưa duyệt thì chưa ghi');
  await call(`/api/runs/${id}/respond`, { pendingId: run.pending.id, allow: true });
  run = await waitFor(async () => { const r = (await call(`/api/runs/${id}`)).body; return r.pending && r.pending.request.path === 'out2.txt' && r; });
  assert.equal(fs.readFileSync(path.join(ws, 'out.txt'), 'utf8'), 'A');
  await call(`/api/runs/${id}/respond`, { pendingId: run.pending.id, allow: false, reason: 'không' });
  const done = await waitFor(async () => { const r = (await call(`/api/runs/${id}`)).body; return r.status === 'done' && r; });
  assert.equal(done.verdict, 'DONE');
  assert.ok(!fs.existsSync(path.join(ws, 'out2.txt')));
  await app.close();
});

test('chặn: file .env, ra ngoài workspace, lệnh phá hủy, skill chỉ đọc không có công cụ ghi', async () => {
  const results = [];
  const { app, ws, call } = await setup([
    [tu('read_file', { path: '.env' }, 'a'), tu('read_file', { path: '../../etc/passwd' }, 'b'), tu('run_command', { command: 'rm -rf /', reason: 'x' }, 'c'), tu('write_file', { path: 'z', content: '1', reason: 'x' }, 'd')],
    (msgs) => { results.push(...msgs.at(-1).content); return [tu('finish', { status: 'DONE', report: 'ok' })]; },
  ]);
  const { body: { id } } = await call('/api/runs', { skill: 'cso', prompt: 'x', workspace: ws });
  await waitFor(async () => (await call(`/api/runs/${id}`)).body.status === 'done');
  assert.equal(results.length, 4);
  assert.ok(results.every((r) => r.is_error), JSON.stringify(results));
  assert.match(results[0].content, /bí mật/);
  assert.match(results[1].content, /ngoài workspace/);
  assert.match(results[2].content, /chặn cứng/);
  assert.ok(!fs.existsSync(path.join(ws, 'z')));
  await app.close();
});

test('lệnh chỉ-đọc chạy ngay, lệnh khác chờ duyệt; kết quả được che bí mật', async () => {
  const { app, ws, call } = await setup([
    [tu('run_command', { command: 'ls', reason: 'xem' }, 'a')],
    [tu('run_command', { command: 'echo token=sk-ant-abcdefghijklmnop1234 > leak.txt', reason: 'x' }, 'b')],
    [tu('finish', { status: 'DONE_WITH_CONCERNS', report: 'báo cáo' })],
  ]);
  const { body: { id } } = await call('/api/runs', { skill: 'review', prompt: 'x', workspace: ws });
  const run = await waitFor(async () => { const r = (await call(`/api/runs/${id}`)).body; return r.pending && r; });
  assert.match(run.pending.request.command, /ĐÃ CHE/);
  assert.ok(run.events.some((e) => e.type === 'tool_result' && /a\.txt/.test(e.text)));
  await call(`/api/runs/${id}/respond`, { pendingId: run.pending.id, allow: false });
  const done = await waitFor(async () => { const r = (await call(`/api/runs/${id}`)).body; return r.status === 'done' && r; });
  assert.equal(done.verdict, 'DONE_WITH_CONCERNS');
  assert.ok(!fs.existsSync(path.join(ws, 'leak.txt')));
  await app.close();
});

test('ask_user chờ trả lời thật; workspace ngoài phạm vi và skill không chạy được bị từ chối', async () => {
  const { app, ws, call, root } = await setup([
    [tu('ask_user', { question: 'Chọn?', options: ['A', 'B'] }, 'q')],
    (msgs) => [tu('finish', { status: 'DONE', report: JSON.stringify(msgs.at(-1).content) })],
  ]);
  assert.equal((await call('/api/runs', { skill: 'review', workspace: os.tmpdir() })).status, 400);
  assert.equal((await call('/api/runs', { skill: 'browse', workspace: ws })).status, 400);
  const { body: { id } } = await call('/api/runs', { skill: 'office-hours', prompt: 'x', workspace: ws });
  const run = await waitFor(async () => { const r = (await call(`/api/runs/${id}`)).body; return r.pending && r; });
  assert.equal(run.pending.request.type, 'question');
  assert.equal((await call(`/api/runs/${id}/respond`, { pendingId: 'sai', answer: 'A' })).status, 409);
  await call(`/api/runs/${id}/respond`, { pendingId: run.pending.id, answer: 'B' });
  await waitFor(async () => (await call(`/api/runs/${id}`)).body.status === 'done');
  const rep = (await call(`/api/runs/${id}/report`)).body.report;
  assert.match(rep, /Người dùng trả lời: B/);
  await app.close();
});

test('freeze chặn sửa ngoài thư mục; dừng lượt chạy khi đang chờ duyệt', async () => {
  const { app, ws, call } = await setup([
    [tu('write_file', { path: 'outside.txt', content: '1', reason: 'x' }, 'a')],
    [tu('write_file', { path: 'src/in.txt', content: '1', reason: 'x' }, 'b')],
  ]);
  fs.mkdirSync(path.join(ws, 'src'));
  assert.equal((await call('/api/safety', { freezeDir: ws + '/src' })).status, 200);
  const { body: { id } } = await call('/api/runs', { skill: 'review', prompt: 'x', workspace: ws });
  await waitFor(async () => (await call(`/api/runs/${id}`)).body.pending);
  // outside.txt đã bị chặn trước khi hỏi duyệt; thứ đang chờ là src/in.txt
  const r = (await call(`/api/runs/${id}`)).body;
  assert.equal(r.pending.request.path, 'src/in.txt');
  assert.ok(!fs.existsSync(path.join(ws, 'outside.txt')));
  assert.equal((await call(`/api/runs/${id}/stop`, {})).body.stopped, true);
  assert.equal((await call(`/api/runs/${id}`)).body.status, 'stopped');
  assert.ok(!fs.existsSync(path.join(ws, 'src/in.txt')));
  await app.close();
});
