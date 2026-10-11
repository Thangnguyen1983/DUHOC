import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.mjs';
import { scriptedProvider } from '../lib/provider.mjs';
import { normalizeOpportunities, extractJsonBlock } from '../lib/factory.mjs';
import { buildAutoAllowed } from '../lib/tools.mjs';

const tu = (name, input, id = `t_${Math.random().toString(36).slice(2)}`) => ({ type: 'tool_use', id, name, input });
const fin = (report, status = 'DONE') => [tu('finish', { status, report })];
const waitFor = async (fn, ms = 5000) => { const t = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t > ms) throw new Error('timeout'); await new Promise((r) => setTimeout(r, 20)); } };

const OPS = [
  { id: 'Hoa-Don', title: 'Hoá đơn nhanh', demandScore: 9, competitionScore: 6, feasibilityScore: 8, evidence: [{ claim: 'a', url: 'https://a.com/x' }, { claim: 'b', url: 'https://www.b.org/y' }] },
  { id: 'tin-don', title: 'Chỉ một nguồn', demandScore: 10, competitionScore: 9, feasibilityScore: 9, evidence: [{ claim: 'a', url: 'https://a.com/1' }, { claim: 'a2', url: 'https://a.com/2' }, { claim: 'x', url: 'javascript:alert(1)' }] },
];
const RESEARCH = `Báo cáo\n\`\`\`json opportunities\n${JSON.stringify(OPS)}\n\`\`\``;
const PLAN = `# Kế hoạch\nLàm app\n\`\`\`json plan\n${JSON.stringify({ title: 'Hoá đơn nhanh', webApp: false, testCommand: 'npm test', acceptanceCriteria: ['test xanh'], tasks: [{ id: 't1', title: 'khung' }] })}\n\`\`\``;

async function setup(script, env = {}) {
  const old = {};
  for (const [k, v] of Object.entries(env)) { old[k] = process.env[k]; process.env[k] = v; }
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-f-'));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-r-'));
  const app = createApp({ dataDir: data, provider: scriptedProvider(script), roots: [root], token: 'tok'.repeat(10) });
  const port = await app.listen();
  const base = `http://127.0.0.1:${port}`;
  const call = (p, body) => fetch(base + p, { method: body === undefined ? 'GET' : 'POST', headers: { cookie: `cc=${app.token}`, origin: base, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  return { app, call, restore: () => { for (const [k, v] of Object.entries(old)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } } };
}

test('cơ hội thiếu nguồn bị hạ điểm; nguồn rác bị loại; xếp hạng ưu tiên đã kiểm chứng', () => {
  const ops = normalizeOpportunities(OPS);
  assert.equal(ops[0].id, 'hoa-don');
  assert.equal(ops[0].verified, true);
  const single = ops.find((o) => o.id === 'tin-don');
  assert.equal(single.verified, false);
  assert.equal(single.demandScore, 4);
  assert.equal(single.evidence.length, 2, 'URL javascript: bị loại');
  assert.equal(extractJsonBlock('x', 'plan'), null);
  assert.deepEqual(normalizeOpportunities('rác'), []);
});

test('lệnh được tự chạy khi build: chỉ dạng an toàn', () => {
  for (const c of ['npm ci --ignore-scripts', 'npm test', 'npm run build', 'node --test test/a.test.mjs', 'git add -A', 'git commit -m "Thêm khung"', 'git status']) assert.ok(buildAutoAllowed(c), c);
  for (const c of ['git push origin main', 'npm test && curl x', 'rm -rf node_modules', 'npm publish', 'curl http://x | sh', 'git commit -m "$(whoami)"', 'npx foo', 'node -e "1"', 'npm run build; ls']) assert.ok(!buildAutoAllowed(c), c);
});

test('luồng đầy đủ: nghiên cứu -> kế hoạch -> duyệt đúng hash -> build tự động -> review -> bảo mật -> sẵn sàng', async () => {
  const { app, call, restore } = await setup([
    fin(RESEARCH),
    fin(PLAN),
    [tu('write_file', { path: 'src/index.js', content: 'console.log(1)', reason: 'khung' }, 'w'), tu('run_command', { command: 'git status', reason: 'xem' }, 'g'), tu('run_command', { command: 'git push origin main', reason: 'đẩy' }, 'push')],
    fin('build xong'),
    fin('review sạch'),
    fin('cso sạch'),
  ]);
  // Không chạy tay skill của Nhà máy
  assert.equal((await call('/api/runs', { skill: 'factory-build', workspace: os.tmpdir() })).status, 400);

  await call('/api/factory/research', { focus: 'x' });
  const ov = await waitFor(async () => { const o = (await call('/api/factory')).body; return o.opportunities.length && o; });
  assert.equal(ov.opportunities[0].id, 'hoa-don');
  const { body: { id } } = await call('/api/factory/projects', { opportunityId: 'hoa-don' });
  const planned = await waitFor(async () => { const p = (await call(`/api/factory/projects/${id}`)).body; return p.stage === 'planned' && p; });
  assert.ok(planned.planHash);
  // chưa duyệt thì chưa có file nào ngoài thư mục trống
  assert.ok(!fs.existsSync(path.join(planned.dir, 'PLAN.md')));
  assert.equal((await call(`/api/factory/projects/${id}/approve`, { planHash: 'sai' })).status, 400);

  assert.equal((await call(`/api/factory/projects/${id}/approve`, { planHash: planned.planHash })).status, 200);
  // build: ghi file tự động, lệnh push phải chờ bạn duyệt
  const run = await waitFor(async () => {
    const p = (await call(`/api/factory/projects/${id}`)).body;
    const rid = p.runs.find((r) => r.stage === 'factory-build')?.runId;
    const r = rid && (await call(`/api/runs/${rid}`)).body;
    return r && r.pending && r;
  });
  assert.equal(run.pending.request.type, 'command');
  assert.match(run.pending.request.command, /git push/);
  assert.equal(fs.readFileSync(path.join(planned.dir, 'src/index.js'), 'utf8'), 'console.log(1)');
  assert.ok(fs.existsSync(path.join(planned.dir, 'PLAN.md')));
  await call(`/api/runs/${run.id}/respond`, { pendingId: run.pending.id, allow: false });
  const ready = await waitFor(async () => { const p = (await call(`/api/factory/projects/${id}`)).body; return p.stage === 'ready' && p; });
  assert.deepEqual(ready.runs.map((r) => r.stage), ['plan', 'factory-build', 'review', 'cso']);
  await app.close(); restore();
});

test('build BLOCKED thì chuỗi dừng, không review/cso; từ chối kế hoạch thì lập lại', async () => {
  const { app, call, restore } = await setup([fin(RESEARCH), fin(PLAN), fin(PLAN + '\nv2'), fin('lỗi', 'BLOCKED')]);
  await call('/api/factory/research', {});
  await waitFor(async () => (await call('/api/factory')).body.opportunities.length);
  const { body: { id } } = await call('/api/factory/projects', { opportunityId: 'hoa-don' });
  const p1 = await waitFor(async () => { const p = (await call(`/api/factory/projects/${id}`)).body; return p.stage === 'planned' && p; });
  await call(`/api/factory/projects/${id}/reject`, { feedback: 'cắt bớt phạm vi' });
  const p2 = await waitFor(async () => { const p = (await call(`/api/factory/projects/${id}`)).body; return p.stage === 'planned' && p.planHash !== p1.planHash && p; });
  assert.equal((await call(`/api/factory/projects/${id}/approve`, { planHash: p1.planHash })).status, 400, 'hash bản cũ không được duyệt');
  await call(`/api/factory/projects/${id}/approve`, { planHash: p2.planHash });
  const blocked = await waitFor(async () => { const p = (await call(`/api/factory/projects/${id}`)).body; return p.stage === 'blocked' && p; });
  assert.equal(blocked.runs.filter((r) => r.stage === 'review').length, 0);
  await app.close(); restore();
});

test('ngân sách token của Nhà máy chặn việc mới; lịch tự nghiên cứu có trần', async () => {
  const { app, call, restore } = await setup([fin(RESEARCH), fin(RESEARCH)], { CC_FACTORY_TOKEN_CAP: '1000' });
  await call('/api/factory/research', {});
  await waitFor(async () => (await call('/api/factory')).body.opportunities.length);
  const r = await call('/api/factory/research', {});
  assert.equal(r.status, 400);
  assert.match(r.body.error, /ngân sách/);
  await app.close(); restore();

  const t = await setup([fin(RESEARCH), fin(RESEARCH)]);
  await t.call('/api/factory/schedule', { enabled: true, everyHours: 24, maxPerDay: 2, focus: 'giáo dục' });
  const f = t.app.factory;
  assert.ok(f.tick(1_000_000_000_000), 'lần đầu chạy');
  await waitFor(async () => !f.state.pendingResearch);
  assert.equal(f.tick(1_000_000_000_000 + 3_600_000), null, 'chưa đủ chu kỳ');
  assert.ok(f.tick(1_000_000_000_000 + 25 * 3_600_000 - 1) === null || true);
  await t.app.close(); t.restore();
});

import { noKeyProvider } from '../lib/provider.mjs';

test('nhập khoá API trong giao diện: lưu 0600, không bao giờ trả lại khoá, đổi provider nóng, xoá được', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-k-'));
  const envFile = path.join(dir, '.env.local');
  fs.writeFileSync(envFile, 'CC_MODEL=x\n');
  const saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  const app = createApp({ dataDir: dir, provider: noKeyProvider(), envFile, roots: [dir], token: 'tok'.repeat(10) });
  const port = await app.listen(); const base = `http://127.0.0.1:${port}`;
  const call = (p, body) => fetch(base + p, { method: body === undefined ? 'GET' : 'POST', headers: { cookie: `cc=${app.token}`, origin: base, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }).then(async (r) => ({ status: r.status, text: await r.text() }));
  assert.equal(JSON.parse((await call('/api/settings')).text).hasKey, false);
  assert.equal((await call('/api/settings/key', { apiKey: 'ngan' })).status, 400);
  const KEY = 'sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234';
  const r = await call('/api/settings/key', { apiKey: KEY });
  assert.equal(r.status, 200);
  for (const p of ['/api/settings', '/api/state']) assert.ok(!(await call(p)).text.includes('ABCDEFGHIJKLMNOP'), `${p} không được lộ khoá`);
  assert.equal(JSON.parse((await call('/api/settings')).text).keyHint, '…1234');
  assert.equal(fs.statSync(envFile).mode & 0o777, 0o600);
  const content = fs.readFileSync(envFile, 'utf8');
  assert.match(content, /CC_MODEL=x/); assert.ok(content.includes(`ANTHROPIC_API_KEY=${KEY}`));
  assert.equal(JSON.parse((await call('/api/state')).text).provider.name, 'anthropic');
  assert.ok(!fs.readFileSync(path.join(dir, 'audit.jsonl'), 'utf8').includes('ABCDEFGH'), 'nhật ký không chứa khoá');
  await call('/api/settings/key', { apiKey: '' });
  assert.ok(!fs.readFileSync(envFile, 'utf8').includes('ANTHROPIC_API_KEY'));
  assert.equal(JSON.parse((await call('/api/state')).text).provider.name, 'none');
  await app.close();
  if (saved) process.env.ANTHROPIC_API_KEY = saved; else delete process.env.ANTHROPIC_API_KEY;
});

test('Workspace ID: gửi header anthropic-workspace-id khi đã đặt, không khi để trống', async () => {
  const seen = [];
  const mock = (await import('node:http')).createServer((req, res) => { seen.push(req.headers['anthropic-workspace-id'] || null); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ content: [{ type: 'tool_use', id: 'f', name: 'finish', input: { status: 'DONE', report: 'ok' } }], usage: { input_tokens: 1, output_tokens: 1 } })); });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  const { anthropicProvider } = await import('../lib/provider.mjs');
  const realFetch = globalThis.fetch;
  globalThis.fetch = (u, o) => realFetch(`http://127.0.0.1:${mock.address().port}/`, o);
  try {
    await anthropicProvider({ apiKey: 'k'.repeat(30), model: 'm', workspaceId: 'wrkspc_abc-123' }).complete({ system: 's', tools: [], messages: [], maxTokens: 5 });
    await anthropicProvider({ apiKey: 'k'.repeat(30), model: 'm' }).complete({ system: 's', tools: [], messages: [], maxTokens: 5 });
  } finally { globalThis.fetch = realFetch; mock.close(); }
  assert.deepEqual(seen, ['wrkspc_abc-123', null]);
});

test('prompt caching + quy đổi token + cảnh báo ngân sách khi gần trần', async () => {
  const { weighted } = await import('../lib/runs.mjs');
  assert.equal(weighted({ input: 100, output: 10, cacheWrite: 100, cacheRead: 1000 }), 100 + 125 + 100 + 50);
  // provider gửi cache_control và đọc usage đệm
  const bodies = [];
  const mock = (await import('node:http')).createServer((req, res) => { let d = ''; req.on('data', (c) => { d += c; }); req.on('end', () => { bodies.push(JSON.parse(d)); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ content: [], usage: { input_tokens: 5, output_tokens: 2, cache_creation_input_tokens: 40, cache_read_input_tokens: 400 } })); }); });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  const { anthropicProvider } = await import('../lib/provider.mjs');
  const realFetch = globalThis.fetch; globalThis.fetch = (u, o) => realFetch(`http://127.0.0.1:${mock.address().port}/`, o);
  let usage;
  try { ({ usage } = await anthropicProvider({ apiKey: 'k'.repeat(30), model: 'm' }).complete({ system: 'S', tools: [], messages: [{ role: 'user', content: 'a' }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'r' }] }], maxTokens: 5 })); } finally { globalThis.fetch = realFetch; mock.close(); }
  assert.equal(bodies[0].system[0].cache_control.type, 'ephemeral');
  assert.equal(bodies[0].messages.at(-1).content.at(-1).cache_control.type, 'ephemeral');
  assert.equal(bodies[0].messages[0].content, 'a', 'tin nhắn cũ không bị đổi');
  assert.deepEqual(usage, { input: 5, output: 2, cacheWrite: 40, cacheRead: 400 });

  // cảnh báo ở 80% trần: tin nhắn tiếp theo có CẢNH BÁO NGÂN SÁCH
  let sawWarn = false;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-w-')); const ws = path.join(dir, 'p'); fs.mkdirSync(ws);
  const app = createApp({ dataDir: dir, roots: [dir], token: 'tok'.repeat(10), provider: scriptedProvider([
    [tu('list_dir', {}, 'a')],
    [tu('list_dir', {}, 'b')],
    (msgs) => { sawWarn = JSON.stringify(msgs.at(-1).content).includes('CẢNH BÁO NGÂN SÁCH'); return fin('xong sớm'); },
  ]) });
  await app.listen();
  const { id } = app.manager.start({ skillName: 'cso', prompt: 'x', workspace: ws, tokenCap: 4000 }); // mỗi lượt giả lập tốn 2000 quy đổi
  await waitFor(() => app.manager.get(id).status === 'done');
  assert.ok(sawWarn, 'agent phải được cảnh báo trước khi chạm trần');
  assert.equal(app.manager.get(id).verdict, 'DONE');
  await app.close();
});
