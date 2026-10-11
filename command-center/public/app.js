// Giao diện: chỉ dùng textContent để nội dung từ repo/mô hình không thể chèn HTML.
const $ = (s) => document.querySelector(s);
const h = (tag, props = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
};

const api = async (path, body) => {
  const res = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data;
};

let state;
let current = null; // { id, source, run }
let priorForNext = null;

async function refresh() {
  state = await api('/api/state');
  renderHeader();
  renderSkills();
  renderRuns();
  renderPipelines();
}

function renderHeader() {
  const p = $('#provider');
  p.textContent = state.provider.model ? `Mô hình: ${state.provider.model}` : 'Chưa có ANTHROPIC_API_KEY';
  p.className = `pill ${state.provider.model ? 'ok' : 'warn'}`;
  const f = $('#freeze');
  f.textContent = state.safety.freezeDir ? `Freeze: ${state.safety.freezeDir}` : 'Freeze: tắt';
  f.className = `pill ${state.safety.freezeDir ? 'warn' : ''}`;
  if (!$('#workspace').value) $('#workspace').value = state.roots[0];
}

function renderSkills() {
  const q = $('#skill-search').value.toLowerCase();
  const box = $('#skill-list');
  box.replaceChildren();
  const groups = new Map();
  for (const s of state.skills) {
    if (q && !(`${s.name} ${s.purposeVi}`.toLowerCase().includes(q))) continue;
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group).push(s);
  }
  for (const [g, list] of [...groups].sort()) {
    box.append(h('div', { class: 'group' }, g));
    for (const s of list) {
      const usable = s.executable;
      box.append(h('button', {
        class: 'skill', type: 'button', disabled: !usable, title: usable ? s.whenToUse : s.unavailableReason,
        onclick: () => { $('#cmd').value = `/${s.name} `; $('#cmd').focus(); },
      }, `/${s.name}`, h('small', {}, usable ? s.purposeVi.slice(0, 90) : `Không chạy: ${s.unavailableReason}`)));
    }
  }
}

function renderRuns() {
  const box = $('#run-list');
  box.replaceChildren(...state.runs.slice(0, 30).map((r) => h('button', {
    class: 'run-item', type: 'button', onclick: () => openRun(r.id),
  }, `/${r.skill}`, h('small', {}, `${r.status}${r.verdict ? ` · ${r.verdict}` : ''} · ${(r.prompt || '').slice(0, 40)}`))));
}

function renderPipelines() {
  const box = $('#pipelines');
  box.replaceChildren(h('span', { class: 'pill' }, 'Quy trình:'), ...state.pipelines.map((p) => h('button', {
    class: 'chip', type: 'button', title: p.steps.join(' → '),
    onclick: () => { $('#cmd').value = `/${p.steps[0]} `; startPipeline = p; $('#cmd').focus(); },
  }, p.title)));
}
let startPipeline = null;

// ---- Gửi lệnh ----
$('#cmd-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#form-msg');
  msg.textContent = '';
  $('#suggestions').replaceChildren();
  const text = $('#cmd').value.trim();
  if (!text) return;
  try {
    const sug = await api('/api/suggest', { text });
    if (!sug.command) {
      if (sug.error) throw new Error(sug.error);
      if (!sug.suggestions.length) throw new Error('Chưa rõ skill. Gõ /ten-skill hoặc chọn ở danh sách bên trái.');
      $('#suggestions').replaceChildren(h('span', {}, 'Bạn muốn chạy skill nào?'), ...sug.suggestions.map((s) => h('button', {
        type: 'button', class: 'chip', title: s.purposeVi, onclick: () => launch({ skill: s.name, prompt: text }),
      }, `/${s.name}`)));
      return;
    }
    await launch({ skill: sug.command.skill, prompt: sug.command.args });
  } catch (err) { msg.textContent = err.message; }
});

async function launch({ skill, prompt, priorRunId = null }) {
  const msg = $('#form-msg');
  try {
    const r = await api('/api/runs', {
      skill, prompt, workspace: $('#workspace').value, mode: $('#mode').value, priorRunId,
      pipeline: startPipeline ? startPipeline.id : null,
    });
    startPipeline = null;
    $('#suggestions').replaceChildren();
    $('#cmd').value = '';
    await refresh();
    openRun(r.id);
  } catch (err) { msg.textContent = err.message; }
}
$('#skill-search').addEventListener('input', () => renderSkills());

// ---- Xem một lượt chạy ----
function openRun(id) {
  if (current?.source) current.source.close();
  $('#run-view').hidden = false;
  $('#timeline').replaceChildren();
  $('#next-steps').replaceChildren();
  current = { id, source: null, count: 0 };
  const src = new EventSource(`/api/runs/${id}/stream`);
  current.source = src;
  src.onmessage = (m) => { renderEvent(JSON.parse(m.data)); };
}

function renderEvent(ev) {
  const tl = $('#timeline');
  current.count++;
  switch (ev.type) {
    case 'start':
      $('#run-title').textContent = `/${ev.skill} — ${ev.workspace}`;
      $('#stop').hidden = false;
      tl.append(h('div', { class: 'ev' }, h('b', {}, 'Lệnh: '), ev.prompt || '(không có nội dung)'));
      break;
    case 'assistant':
      tl.append(h('div', { class: 'ev assistant' }, ev.text));
      break;
    case 'tool':
      tl.append(h('div', { class: 'ev', 'data-tool': ev.id }, h('details', {}, h('summary', {}, `Công cụ: ${ev.name}`), h('pre', {}, ev.input))));
      break;
    case 'tool_result': {
      const t = tl.querySelector(`[data-tool="${CSS.escape(ev.id)}"]`) || tl;
      t.append(h('details', { class: ev.isError ? 'error' : '' }, h('summary', {}, ev.isError ? 'Kết quả (lỗi)' : 'Kết quả', ev.redacted ? ` · đã che ${ev.redacted} bí mật` : ''), h('pre', {}, ev.text), ev.image ? h('img', { src: `/api/runs/${current.id}/shots/${ev.image}`, alt: 'Ảnh chụp trang', style: 'max-width:100%;border:1px solid var(--line);border-radius:6px' }) : null));
      break;
    }
    case 'pending': tl.append(renderPending(ev)); break;
    case 'answered': {
      const c = tl.querySelector(`[data-pending="${ev.pendingId}"]`);
      if (c) c.replaceWith(h('div', { class: 'ev' }, ev.payload.answer != null ? `Bạn trả lời: ${ev.payload.answer}` : (ev.payload.allow ? 'Bạn đã DUYỆT.' : `Bạn đã TỪ CHỐI.${ev.payload.reason ? ` ${ev.payload.reason}` : ''}`)));
      break;
    }
    case 'report':
      tl.append(h('div', { class: 'ev' }, h('div', { class: `verdict ${ev.status}` }, `Kết quả: ${ev.status}`), h('pre', {}, ev.report)));
      break;
    case 'end':
      $('#stop').hidden = true;
      tl.append(h('div', { class: `ev ${ev.status === 'error' ? 'error' : ''}` }, `Kết thúc: ${ev.status}${ev.message ? ` — ${ev.message}` : ''}`));
      showNext();
      refresh();
      break;
    default: break;
  }
}

function renderPending(ev) {
  const r = ev.request;
  const respond = (payload) => api(`/api/runs/${current.id}/respond`, { pendingId: ev.pendingId, ...payload }).catch((e) => alert(e.message));
  if (r.type === 'question') {
    return h('div', { class: 'card question', 'data-pending': ev.pendingId },
      h('b', {}, 'Cần quyết định của bạn'), h('p', {}, r.question), r.recommendation ? h('p', {}, `Khuyến nghị: ${r.recommendation}`) : null,
      h('div', { class: 'row' }, ...(r.options || []).map((o) => h('button', { class: 'opt', type: 'button', onclick: () => respond({ answer: o }) }, o))));
  }
  const body = (r.type === 'command' || r.type === 'browser')
    ? [h('pre', {}, r.command), h('p', {}, `Lý do: ${r.reason || '—'} · luật: ${r.rule}`)]
    : [h('p', {}, `${r.path} — ${r.reason || ''}`), h('div', { class: 'diff' }, h('pre', {}, r.before == null ? '(file mới)' : r.before.slice(0, 4000)), h('pre', {}, (r.after || '').slice(0, 4000)))];
  const why = h('input', { placeholder: 'Lý do từ chối (không bắt buộc)' });
  return h('div', { class: 'card', 'data-pending': ev.pendingId }, h('b', {}, `Cần duyệt: ${r.title}`), body, why,
    h('div', { class: 'row' },
      h('button', { type: 'button', onclick: () => respond({ allow: true }) }, 'Duyệt'),
      h('button', { type: 'button', class: 'danger', onclick: () => respond({ allow: false, reason: why.value }) }, 'Từ chối')));
}

async function showNext() {
  const run = await api(`/api/runs/${current.id}`);
  const skill = state.skills.find((s) => s.name === run.skill);
  const pipe = run.pipeline && state.pipelines.find((p) => p.id === run.pipeline);
  const names = new Set(skill?.next || []);
  if (pipe) { const i = pipe.steps.indexOf(run.skill); if (i >= 0 && pipe.steps[i + 1]) names.add(pipe.steps[i + 1]); }
  const box = $('#next-steps');
  box.replaceChildren();
  if (run.status !== 'done' || run.verdict === 'BLOCKED') return;
  box.append(h('span', {}, 'Bước tiếp (bạn bấm mới chạy):'));
  for (const n of names) {
    const s = state.skills.find((x) => x.name === n);
    if (!s?.executable) continue;
    box.append(h('button', {
      class: 'chip', type: 'button', title: s.purposeVi,
      onclick: () => { startPipeline = pipe || null; launch({ skill: n, prompt: `Tiếp nối kết quả của /${run.skill}.`, priorRunId: run.id }); },
    }, `/${n}`));
  }
}

$('#stop').addEventListener('click', () => current && api(`/api/runs/${current.id}/stop`, {}));

// ---- Freeze & chọn thư mục ----
const dlg = $('#dir-dialog');
let dirMode = 'workspace';
let dirPath = '';
async function loadDir(p) {
  const d = await api(`/api/dirs?path=${encodeURIComponent(p)}`);
  dirPath = d.path;
  $('#dir-path').textContent = d.path;
  $('#dir-list').replaceChildren(...d.dirs.map((n) => h('button', { class: 'chip', type: 'button', onclick: () => loadDir(`${d.path}/${n}`).catch((e) => alert(e.message)) }, n)));
}
$('#browse').addEventListener('click', () => { dirMode = 'workspace'; loadDir($('#workspace').value).then(() => dlg.showModal()).catch((e) => alert(e.message)); });
$('#freeze-btn').addEventListener('click', () => { dirMode = 'freeze'; loadDir($('#workspace').value).then(() => dlg.showModal()).catch((e) => alert(e.message)); });
$('#dir-up').addEventListener('click', () => loadDir(`${dirPath}/..`).catch((e) => alert(e.message)));
$('#dir-close').addEventListener('click', () => dlg.close());
$('#dir-pick').addEventListener('click', async () => {
  try {
    if (dirMode === 'workspace') $('#workspace').value = dirPath;
    else await api('/api/safety', { freezeDir: dirPath });
    dlg.close();
    await refresh();
  } catch (e) { alert(e.message); }
});
$('#freeze').addEventListener('click', async () => { if (state.safety.freezeDir && confirm('Tắt freeze?')) { await api('/api/safety', { freezeDir: null }); refresh(); } });

refresh().catch((e) => { $('#form-msg').textContent = e.message; });

// ---- Nhà máy ứng dụng ----
const STAGE = { planning: ['Đang lập kế hoạch', 'warn'], planned: ['Chờ bạn duyệt kế hoạch', 'warn'], building: ['Đang sản xuất', 'warn'], ready: ['Sẵn sàng giao (chưa đẩy/deploy)', 'ok'], blocked: ['Dừng/cần xử lý', 'bad'] };
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
let facTimer = null;

function showTab(name) {
  const fac = name === 'fac';
  $('#factory').hidden = !fac;
  $('#main').hidden = fac;
  $('#tab-fac').classList.toggle('active', fac);
  $('#tab-cmd').classList.toggle('active', !fac);
  clearInterval(facTimer);
  if (fac) { loadFactory(); facTimer = setInterval(loadFactory, 4000); }
}
$('#tab-cmd').addEventListener('click', () => showTab('cmd'));
$('#tab-fac').addEventListener('click', () => showTab('fac'));

const openRunFromFactory = (id) => { showTab('cmd'); refresh().then(() => openRun(id)); };

function renderOp(o) {
  return h('div', { class: 'op' },
    h('div', { class: 'row spread' }, h('b', {}, o.title), h('span', { class: `tag ${o.verified ? 'ok' : 'warn'}` }, o.verified ? 'Đã kiểm chứng (≥2 nguồn)' : 'Chưa kiểm chứng')),
    h('div', {}, o.problem),
    h('div', { class: 'scores' }, h('span', {}, 'Nhu cầu ', h('b', {}, o.demandScore)), h('span', {}, 'Ít cạnh tranh ', h('b', {}, o.competitionScore)), h('span', {}, 'Khả thi ', h('b', {}, o.feasibilityScore))),
    o.mvpScope ? h('div', {}, h('small', {}, `MVP: ${o.mvpScope}`)) : null,
    h('details', {}, h('summary', {}, `Bằng chứng (${o.evidence.length}) · đối thủ (${o.competitors.length}) · rủi ro (${o.risks.length})`),
      h('ul', {}, ...o.evidence.map((e) => h('li', {}, `${e.claim} — `, h('a', { href: e.url, target: '_blank', rel: 'noopener noreferrer' }, e.url)))),
      o.competitors.length ? h('ul', {}, ...o.competitors.map((c) => h('li', {}, `${c.name}: ${c.weakness}`))) : null,
      o.risks.length ? h('ul', {}, ...o.risks.map((r) => h('li', {}, `Rủi ro: ${r}`))) : null),
    h('div', { class: 'row' }, h('button', { type: 'button', onclick: async () => { try { await api('/api/factory/projects', { opportunityId: o.id }); loadFactory(); } catch (e) { $('#fac-msg').textContent = e.message; } } }, 'Lập kế hoạch sản xuất')));
}

function renderProject(p) {
  const [label, tone] = STAGE[p.stage] || [p.stage, ''];
  const act = [];
  if (p.stage === 'planned') {
    const fb = h('input', { placeholder: 'Phản hồi nếu từ chối (vd: cắt bớt phạm vi)' });
    act.push(
      h('p', {}, `Hash kế hoạch: ${p.planHash}. Duyệt nghĩa là cho phép hệ thống tự build trong thư mục dự án, tự chạy test/commit cục bộ; push, deploy, publish vẫn cần bạn duyệt riêng.`),
      h('div', { class: 'row' },
        h('button', { type: 'button', onclick: async () => { if (!confirm('Duyệt kế hoạch này và bắt đầu sản xuất tự động?')) return; try { await api(`/api/factory/projects/${p.id}/approve`, { planHash: p.planHash }); loadFactory(); } catch (e) { alert(e.message); } } }, 'Duyệt và sản xuất'),
        fb, h('button', { type: 'button', class: 'danger', onclick: async () => { try { await api(`/api/factory/projects/${p.id}/reject`, { feedback: fb.value }); loadFactory(); } catch (e) { alert(e.message); } } }, 'Từ chối, lập lại')));
  }
  if (['planning', 'building'].includes(p.stage)) act.push(h('button', { type: 'button', class: 'danger', onclick: async () => { await api(`/api/factory/projects/${p.id}/stop`, {}); loadFactory(); } }, 'Dừng'));
  return h('div', { class: 'proj' },
    h('div', { class: 'row spread' }, h('b', {}, p.title), h('span', { class: `tag ${tone}` }, label)),
    p.note ? h('div', { class: 'tag bad' }, p.note) : null,
    p.waiting ? h('div', { class: 'tag warn' }, 'Đang chờ bạn duyệt một thao tác: mở lượt chạy bên dưới') : null,
    h('div', { class: 'stages' }, ...p.runs.map((r) => h('button', { class: 'chip', type: 'button', onclick: () => openRunFromFactory(r.runId) }, r.stage))),
    p.plan ? h('details', { open: p.stage === 'planned' }, h('summary', {}, 'Kế hoạch'), h('pre', { class: 'plan' }, p.plan)) : null,
    p.stage === 'ready' ? h('p', {}, `Thư mục dự án: ${p.dir}. Xem lại bằng review/cso rồi tự quyết định đẩy lên GitHub hoặc deploy.`) : null,
    ...act);
}

async function loadFactory() {
  try {
    const f = await api('/api/factory');
    $('#fac-budget').textContent = `Ngân sách token: ${fmt(f.tokensUsed)} / ${fmt(f.tokenCap)}`;
    $('#fac-budget').className = `pill ${f.tokensUsed > f.tokenCap * 0.8 ? 'warn' : ''}`;
    if (document.activeElement?.id !== 'sch-hours' && document.activeElement?.id !== 'sch-max') {
      $('#sch-on').checked = f.schedule.enabled; $('#sch-hours').value = f.schedule.everyHours; $('#sch-max').value = f.schedule.maxPerDay;
    }
    const ops = $('#ops');
    ops.replaceChildren(...(f.opportunities.length ? f.opportunities.map(renderOp) : [h('p', {}, 'Chưa có cơ hội. Bấm "Nghiên cứu ngay".')]));
    const typing = document.activeElement && $('#projects').contains(document.activeElement);
    if (!typing) $('#projects').replaceChildren(...(f.projects.length ? f.projects.map(renderProject) : [h('p', {}, 'Chưa có dự án.')]));
  } catch (e) { $('#fac-msg').textContent = e.message; }
}
$('#fac-research').addEventListener('click', async () => {
  $('#fac-msg').textContent = '';
  try { const r = await api('/api/factory/research', { focus: $('#fac-focus').value }); $('#fac-msg').textContent = 'Đang nghiên cứu… xem tiến trình ở tab Lệnh.'; await refresh(); void r; } catch (e) { $('#fac-msg').textContent = e.message; }
});
$('#sch-save').addEventListener('click', async () => {
  try { await api('/api/factory/schedule', { enabled: $('#sch-on').checked, everyHours: Number($('#sch-hours').value), maxPerDay: Number($('#sch-max').value), focus: $('#fac-focus').value }); $('#fac-msg').textContent = 'Đã lưu lịch (chỉ chạy khi máy chủ đang mở).'; } catch (e) { $('#fac-msg').textContent = e.message; }
});
