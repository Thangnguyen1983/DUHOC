// Phiên trình duyệt headless cho skill QA/duyệt web. Ngữ cảnh mới (không cookie, không đăng nhập)
// cho mỗi lượt chạy; đóng khi lượt chạy kết thúc. Nội dung trang luôn là dữ liệu không tin cậy.
import fs from 'node:fs';
import path from 'node:path';

const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]']);

export function parseUrl(raw) {
  let u;
  try { u = new URL(String(raw)); } catch { return { ok: false, reason: 'URL không hợp lệ.' }; }
  if (!['http:', 'https:'].includes(u.protocol)) return { ok: false, reason: `Giao thức ${u.protocol} không được phép.` };
  if (/^(169\.254\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname) || u.hostname === '0.0.0.0') {
    return { ok: false, reason: 'Địa chỉ mạng nội bộ/metadata bị chặn.' };
  }
  return { ok: true, url: u, origin: u.origin, local: LOCAL.has(u.hostname) };
}

async function loadPlaywright() {
  const tries = [process.env.CC_PLAYWRIGHT, 'playwright-core', 'playwright', '/opt/node-tools/node_modules/playwright-core/index.mjs'].filter(Boolean);
  for (const t of tries) {
    try { const m = await import(t); return m.chromium ? m : m.default; } catch { /* thử tiếp */ }
  }
  throw new Error('Không tìm thấy Playwright. Cài playwright-core hoặc đặt CC_PLAYWRIGHT=/đường/dẫn/tới/playwright-core.');
}

export class BrowserSession {
  constructor({ shotsDir }) {
    this.shotsDir = shotsDir;
    this.approved = new Set();
    this.console = [];
    this.failed = [];
    this.shotN = 0;
    this.browser = null;
    this.page = null;
  }

  async #ensure() {
    if (this.page) return;
    const pw = await loadPlaywright();
    this.browser = await pw.chromium.launch({
      executablePath: process.env.CC_CHROMIUM || undefined,
      args: ['--no-sandbox'],
    });
    const ctx = await this.browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: false, serviceWorkers: 'block' });
    // Chặn mọi yêu cầu tới giao thức/mạng nội bộ không được phép, kể cả do trang tự gọi.
    await ctx.route('**/*', (route) => {
      const p = parseUrl(route.request().url());
      if (route.request().url().startsWith('data:') || route.request().url().startsWith('blob:')) return route.continue();
      return p.ok ? route.continue() : route.abort();
    });
    this.page = await ctx.newPage();
    this.page.setDefaultTimeout(15000);
    this.page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) this.console.push(`[${m.type()}] ${m.text()}`.slice(0, 300)); });
    this.page.on('pageerror', (e) => this.console.push(`[pageerror] ${e.message}`.slice(0, 300)));
    this.page.on('requestfailed', (r) => this.failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText || ''}`.slice(0, 300)));
    this.page.on('response', (r) => { if (r.status() >= 400) this.failed.push(`${r.status()} ${r.request().method()} ${r.url()}`.slice(0, 300)); });
  }

  originAllowed(origin, local) { return local || this.approved.has(origin); }
  approve(origin) { this.approved.add(origin); }
  currentOrigin() { try { return new URL(this.page.url()).origin; } catch { return null; } }
  currentLocal() { try { return LOCAL.has(new URL(this.page.url()).hostname); } catch { return false; } }

  async goto(url) {
    await this.#ensure();
    const resp = await this.page.goto(url, { waitUntil: 'load' });
    return { status: resp?.status() ?? null, title: await this.page.title(), url: this.page.url() };
  }

  // Ảnh chụp cấu trúc truy cập được: tên, vai trò, văn bản; kèm danh sách phần tử tương tác có chỉ số.
  async snapshot() {
    await this.#ensure();
    const items = await this.page.evaluate(() => {
      const sel = 'a,button,input,select,textarea,[role=button],[role=link],[onclick]';
      return [...document.querySelectorAll(sel)].slice(0, 80).map((el, i) => {
        el.setAttribute('data-cc-i', String(i));
        const label = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.value || el.getAttribute('name') || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        return `[${i}] <${el.tagName.toLowerCase()}${el.type ? ` type=${el.type}` : ''}${el.getAttribute('href') ? ` href=${el.getAttribute('href').slice(0, 80)}` : ''}> ${label}`;
      });
    });
    const text = (await this.page.evaluate(() => document.body?.innerText || '')).replace(/\n{3,}/g, '\n\n').slice(0, 6000);
    return `URL: ${this.page.url()}\nTiêu đề: ${await this.page.title()}\n\nPHẦN TỬ TƯƠNG TÁC:\n${items.join('\n') || '(không có)'}\n\nVĂN BẢN:\n${text}`;
  }

  #target(index) { return this.page.locator(`[data-cc-i="${Number(index)}"]`).first(); }
  async click(index) { await this.#ensure(); await this.#target(index).click(); await this.page.waitForLoadState('load').catch(() => {}); return this.page.url(); }
  async fill(index, value) { await this.#ensure(); await this.#target(index).fill(String(value)); }

  async screenshot() {
    await this.#ensure();
    fs.mkdirSync(this.shotsDir, { recursive: true });
    const name = `shot${++this.shotN}.jpg`;
    const buf = await this.page.screenshot({ type: 'jpeg', quality: 60 });
    fs.writeFileSync(path.join(this.shotsDir, name), buf);
    return { name, base64: buf.toString('base64') };
  }

  consoleReport() {
    return `Lỗi console (${this.console.length}):\n${this.console.slice(-30).join('\n') || '(không có)'}\n\nYêu cầu lỗi (${this.failed.length}):\n${this.failed.slice(-30).join('\n') || '(không có)'}`;
  }

  async close() { try { await this.browser?.close(); } catch { /* đã đóng */ } this.browser = null; this.page = null; }
}
