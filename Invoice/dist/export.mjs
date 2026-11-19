// 파일로 저장(PDF · 이미지 · 엑셀) · 보내기(카톡 · 메일) — 5단계
// 문서 그림은 미리보기와 똑같은 A4 화면을 그대로 찍는다(같은 renderPages · 같은 스타일 · 같은 글꼴).
// PDF · 엑셀 파일은 core/pdf.mjs · core/xlsx.mjs 가 외부 라이브러리 없이 만든다.
// 휴대폰 · 태블릿(손가락 화면)은 공유 창으로, PC 는 내려받기 · 클립보드 · Gmail 쓰기 창으로.
import { renderPages, won, fileTitle } from './docview.mjs?v=mwmwhfll';
import { docMoney } from './core/events.mjs?v=mwmwhfll';
import { DOC_TYPES, docNo, docTotals, dateKo, filterDocs, ymd } from './core/docs.mjs?v=mwmwhfll';
import { imagesToPdf } from './core/pdf.mjs?v=mwmwhfll';
import { buildXlsx } from './core/xlsx.mjs?v=mwmwhfll';
import { docSheet, listSheets, clientsSheet, itemsSheets } from './core/sheets.mjs?v=mwmwhfll';
import { logProblem } from './errors.mjs?v=mwmwhfll';

let C;
export function initExport(ctx) { C = ctx; }
/** 카톡 · 메일 보내기 창을 연 순간 「발송 완료」 (실제로 전송했는지는 프로그램이 알 수 없음 → 잘못 바뀌면 드롭다운으로 되돌림) */
function markSent(doc) { if (doc && doc.status !== 'sent' && C.setDocStatus) C.setDocStatus(doc, 'sent'); }

const A4W = 794, A4H = 1123;           // CSS 픽셀 (96dpi 기준 A4)
const DPI_SCALE = 200 / 96;            // 파일용: 200dpi (1654 × 2339)
const CLIP_SCALE = 1.5;                // 카톡 붙여넣기용: 1191 × 1685
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** 손가락으로 쓰는 기기(휴대폰 · 태블릿)인지 — 이때는 공유 창을 쓴다 */
export const isTouch = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches);
const canShareFiles = (files) => { try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files })); } catch (e) { return false; } };

/* ────────────────────────── 문서 → 그림 ────────────────────────── */
const cache = { css: null, vars: null, fontCss: null, faces: null, fontData: new Map(), img: new Map() };

/** 이 프로그램의 스타일(같은 출처 CSS)을 글자로 모은다 */
function appCss() {
  if (cache.css) return cache.css;
  let out = '';
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch (e) { continue; } // 다른 출처(글꼴 CSS)는 읽을 수 없다 → 아래에서 따로
    if (!rules || (sh.href && !sh.href.startsWith(location.origin))) continue;
    for (const r of rules) if (!(r.type === 5)) out += r.cssText + '\n'; // @font-face 는 빼고
  }
  return (cache.css = out);
}
/** 화면 맨 위에 정해 둔 색 변수(--primary 등)를 그대로 옮긴다 */
function rootVars() {
  if (cache.vars !== null) return cache.vars;
  const names = new Set(appCss().match(/--[\w-]+(?=\s*:)/g) || []);
  const cs = getComputedStyle(document.documentElement), bs = getComputedStyle(document.body);
  let s = '';
  for (const n of names) { const v = (cs.getPropertyValue(n) || bs.getPropertyValue(n)).trim(); if (v) s += n + ':' + v + ';'; }
  return (cache.vars = s);
}

function fetchWithTimeout(url, ms = 9000) {
  const ac = typeof AbortController === 'function' ? new AbortController() : null;
  const t = setTimeout(() => ac && ac.abort(), ms);
  return fetch(url, ac ? { signal: ac.signal, mode: 'cors', credentials: 'omit' } : {}).finally(() => clearTimeout(t));
}
const blobToDataUrl = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });

/** Pretendard 글꼴: 글자 묶음별 파일 중 이 문서에 쓰인 글자가 있는 것만 받아 그림 안에 넣는다 */
async function fontFaces() {
  if (cache.faces) return cache.faces;
  const link = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => /pretendard/i.test(l.href));
  if (!link) return (cache.faces = []);
  try {
    const css = await (await fetchWithTimeout(link.href)).text();
    const faces = [];
    for (const m of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
      const body = m[1], u = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(body);
      if (!u) continue;
      const ur = /unicode-range\s*:\s*([^;]+)/i.exec(body);
      const ranges = ur ? ur[1].split(',').map((x) => {
        const t = x.trim().replace(/^U\+/i, '');
        if (t.includes('?')) return [parseInt(t.replace(/\?/g, '0'), 16), parseInt(t.replace(/\?/g, 'F'), 16)];
        const [a, b] = t.split('-'); return [parseInt(a, 16), parseInt(b || a, 16)];
      }) : null;
      faces.push({ body, url: new URL(u[1], link.href).href, ranges });
    }
    return (cache.faces = faces);
  } catch (e) { return (cache.faces = []); } // 인터넷이 없으면 기본 글꼴(맑은 고딕)로
}
async function fontCssFor(text) {
  const faces = await fontFaces();
  const cps = new Set(); for (const ch of text + '0123456789,₩−-~() ') cps.add(ch.codePointAt(0));
  const need = faces.filter((f) => !f.ranges || f.ranges.some(([a, b]) => { for (const c of cps) if (c >= a && c <= b) return true; return false; }));
  const parts = await Promise.all(need.map(async (f) => {
    if (!cache.fontData.has(f.url)) cache.fontData.set(f.url, fetchWithTimeout(f.url).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(blobToDataUrl).catch(() => null));
    const data = await cache.fontData.get(f.url);
    if (!data) return '';
    return '@font-face{' + f.body.replace(/src\s*:[^;]+;?/i, 'src:url(' + data + ') format("woff2");') + '}';
  }));
  return parts.join('\n');
}
/** 그림 안의 사진(로고)은 데이터로 바꿔 넣는다. 큰 로고는 알맞게 줄인다 */
async function inlineImage(src) {
  if (/^data:/.test(src)) return src;
  const abs = new URL(src, location.href).href;
  if (!cache.img.has(abs)) {
    cache.img.set(abs, new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 900 / (im.naturalWidth || 900));
        const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(im.naturalWidth * s)); cv.height = Math.max(1, Math.round(im.naturalHeight * s));
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        try { res(cv.toDataURL('image/png')); } catch (e) { res(''); }
      };
      im.onerror = () => res('');
      im.src = abs;
    }));
  }
  return cache.img.get(abs);
}

const XHTML = 'http://www.w3.org/1999/xhtml';
/** A4 한 쪽(HTML) → 캔버스 */
async function pageCanvas(html, scale) {
  const holder = document.createElement('div'); holder.innerHTML = html;
  const page = holder.firstElementChild;
  for (const im of page.querySelectorAll('img')) { const d = await inlineImage(im.getAttribute('src') || ''); if (d) im.setAttribute('src', d); else im.remove(); }
  const fonts = await fontCssFor(page.textContent || '');
  const wrap = document.createElementNS(XHTML, 'div');
  wrap.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'a');
  wrap.setAttribute('class', 'in-app x-shot');
  // 크게 만들기는 SVG viewBox 가 아니라 안쪽 CSS zoom 으로 한다 (transform 은 일부 글자가 굵게 찍혀서 zoom).
  // (아이폰 사파리 · 카톡 안 브라우저(WebKit)는 foreignObject 에 viewBox 확대를 적용하지 않아, 그림이 왼쪽 위에 작게 찍히고 오른쪽 · 아래가 빈 여백이 됐다)
  const W = Math.round(A4W * scale), H = Math.round(A4H * scale);
  wrap.setAttribute('style', rootVars() + 'width:' + A4W + 'px;height:' + A4H + 'px;margin:0;padding:0;background:#fff;overflow:hidden;zoom:' + scale + '');
  const st = document.createElementNS(XHTML, 'style');
  st.textContent = fonts + '\n' + appCss() + '\n.x-shot .a4{width:' + A4W + 'px!important;height:' + A4H + 'px!important;min-height:' + A4H + 'px!important;margin:0!important;box-shadow:none!important;transform:none!important}';
  wrap.appendChild(st); wrap.appendChild(page);
  const outer = document.createElementNS(XHTML, 'div');
  outer.setAttribute('style', 'width:' + W + 'px;height:' + H + 'px;margin:0;padding:0;overflow:hidden;background:#fff');
  outer.appendChild(wrap);
  const cv = await drawSvg(new XMLSerializer().serializeToString(outer), W, H, W, H);
  if (!fillsPage(cv)) {
    // 안전장치: 문서가 왼쪽 위에 작게 찍혔으면(일부 아이폰 브라우저가 zoom 을 무시) 확대 없이 A4 크기로 그린 뒤 캔버스에서 늘린다
    wrap.style.zoom = '';
    const cv2 = await drawSvg(new XMLSerializer().serializeToString(wrap), A4W, A4H, W, H);
    logProblemOnce('문서 그림: 확대가 안 돼서 다른 방법으로 그림(아이폰 안전장치)');
    return cv2;
  }
  return cv;
}
/** SVG(안에 HTML) → 캔버스. 그림은 sw×sh 로 만들고 캔버스에는 W×H 로 그린다 */
async function drawSvg(xml, sw, sh, W, H) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + sw + '" height="' + sh + '"><foreignObject x="0" y="0" width="' + sw + '" height="' + sh + '">' + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('문서 그림을 만들지 못했어요')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  if (img.decode) await img.decode().catch(() => {});
  await new Promise((r) => setTimeout(r, 40)); // 그림 안 글꼴이 자리 잡을 시간
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H);
  return cv;
}
/** 문서가 쪽을 채웠나: 작게 줄여 그려서 흰색이 아닌 곳의 범위를 잰다.
 *  글자 · 선이 왼쪽 위 60% 안에만 있으면 「작게 찍힘」(A4 문서는 표 · 머리 줄이 오른쪽 끝까지 간다). 빈 쪽이거나 잴 수 없으면 채운 것으로 본다 */
function fillsPage(cv) {
  try {
    const w = 120, h = 170, s = document.createElement('canvas'); s.width = w; s.height = h;
    const g = s.getContext('2d'); g.drawImage(cv, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    let mx = -1, my = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4;
      if (d[k] < 248 || d[k + 1] < 248 || d[k + 2] < 248) { if (x > mx) mx = x; if (y > my) my = y; }
    }
    if (mx < 0) return true;
    return !(mx < w * 0.6 && my < h * 0.6);
  } catch (e) { return true; }
}
let warnedFill = false;
function logProblemOnce(msg) { if (!warnedFill) { warnedFill = true; try { logProblem('문서 그림 안전장치', msg); } catch (e) {} } }
const toBlob = (cv, type, q) => new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('그림 파일을 만들지 못했어요'))), type, q));

const pagesOf = (doc) => renderPages(doc, C.S.data.me, docMoney(doc, C.S.data));
async function docCanvases(doc, scale) { const out = []; for (const p of pagesOf(doc)) out.push(await pageCanvas(p, scale)); return out; }

export async function makeJpgs(doc) {
  const cvs = await docCanvases(doc, DPI_SCALE);
  const base = fileTitle(doc);
  return Promise.all(cvs.map(async (cv, i) => ({ blob: await toBlob(cv, 'image/jpeg', 0.92), name: base + (cvs.length > 1 ? '_' + (i + 1) + '쪽' : '') + '.jpg' })));
}
export async function makePdf(doc) {
  const cvs = await docCanvases(doc, DPI_SCALE);
  const pages = [];
  for (const cv of cvs) pages.push(new Uint8Array(await (await toBlob(cv, 'image/jpeg', 0.92)).arrayBuffer()));
  const bytes = imagesToPdf(pages, { title: fileTitle(doc) });
  return { blob: new Blob([bytes], { type: 'application/pdf' }), name: fileTitle(doc) + '.pdf', pages: pages.length };
}
/** 카톡 붙여넣기용: 여러 쪽이면 위아래로 이어 붙인 PNG 한 장 */
export async function makeClipPng(doc) {
  const cvs = await docCanvases(doc, CLIP_SCALE);
  if (cvs.length === 1) return toBlob(cvs[0], 'image/png');
  const gap = 24, W = cvs[0].width, H = cvs.reduce((s, c) => s + c.height, 0) + gap * (cvs.length - 1);
  const all = document.createElement('canvas'); all.width = W; all.height = H;
  const g = all.getContext('2d'); g.fillStyle = '#C9D3E1'; g.fillRect(0, 0, W, H);
  let y = 0; for (const c of cvs) { g.drawImage(c, 0, y); y += c.height + gap; }
  return toBlob(all, 'image/png');
}
export function makeDocXlsx(doc) {
  const bytes = buildXlsx([docSheet(doc, C.S.data.me, docMoney(doc, C.S.data))], { title: fileTitle(doc) });
  return { blob: new Blob([bytes], { type: XLSX_TYPE }), name: fileTitle(doc) + '.xlsx' };
}

/* ────────────────────────── 내보내기 · 공유 ────────────────────────── */
function download({ blob, name }) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
}
async function downloadAll(list) { for (let i = 0; i < list.length; i++) { download(list[i]); if (i < list.length - 1) await new Promise((r) => setTimeout(r, 400)); } }
const asFiles = (list) => list.map((x) => new File([x.blob], x.name, { type: x.blob.type }));

/** 공유 창 열기. 기다리는 동안 「누름」이 사라지면 버튼을 한 번 더 눌러 열게 한다 */
async function share(list, meta = {}) {
  const files = asFiles(list);
  const go = () => navigator.share({ files, title: meta.title || list[0].name, text: meta.text || '' })
    .then(() => C.toast(meta.done || '공유 창에서 고른 곳으로 넘겼어요'))
    .catch((e) => { if (e && e.name === 'AbortError') C.toast('보내기를 그만뒀어요'); else { C.toast('공유 창을 열지 못했어요. 파일로 저장할게요'); downloadAll(list); } });
  try { await navigator.share({ files, title: meta.title || list[0].name, text: meta.text || '' }); C.toast(meta.done || '공유 창에서 고른 곳으로 넘겼어요'); }
  catch (e) {
    if (e && e.name === 'AbortError') { C.toast('보내기를 그만뒀어요'); return; }
    // 파일을 만드는 사이에 「누름」 허락이 끝난 경우: 한 번 더 누르면 열린다
    C.openModal({ icon: 'share', title: '준비가 끝났어요', body: '<p><b>' + C.esc(list.map((x) => x.name).join(', ')) + '</b></p><p>아래 단추를 누르면 공유 창이 열려요. ' + C.esc(meta.hint || '') + '</p>', ok: '공유 창 열기', onOk: () => { go(); } });
  }
}
/** 저장: 손가락 기기에서 공유가 되면 공유 창(「파일에 저장」 · 「이미지 저장」), 아니면 내려받기 */
async function save(list, what) {
  if (isTouch() && canShareFiles(asFiles(list))) return share(list, { hint: '「파일에 저장」이나 「이미지 저장」을 고르세요.', done: what + ' 파일을 넘겼어요' });
  await downloadAll(list);
  C.toast(list.length > 1 ? what + ' 파일 ' + list.length + '개를 내려받았어요 (다운로드 폴더)' : what + ' 파일을 내려받았어요 (다운로드 폴더)');
}

let busy = false;
async function withBusy(msg, fn) {
  if (busy) { C.toast('앞의 파일을 만드는 중이에요. 잠시만요'); return; }
  busy = true; document.body.classList.add('x-busy'); C.toast(msg);
  try { return await fn(); }
  catch (e) { console.error(e); logProblem('파일 만들기 실패', e, msg); C.toast(String(e && e.message || '파일을 만들지 못했어요')); }
  finally { busy = false; document.body.classList.remove('x-busy'); }
}

/* ── 메일 내용 ── */
const firstLine = (s) => String(s || '').split('\n')[0].trim();
const josaEul = (w) => { const c = String(w).replace(/[^가-힣]/g, '').slice(-1); if (!c) return '를'; return (c.charCodeAt(0) - 0xAC00) % 28 ? '을' : '를'; };
function clientEmail(doc) {
  if (doc.client && doc.client.email) return doc.client.email;
  const c = doc.clientId && C.S.data.clients.find((x) => x.id === doc.clientId);
  if (c && c.email) return c.email;
  const byName = doc.client && doc.client.name && C.S.data.clients.find((x) => x.name === doc.client.name);
  return byName && byName.email || '';
}
export function mailParts(doc, me = C.S.data.me) {
  const T = DOC_TYPES[doc.type], t = docTotals(doc), c = doc.client || {}, ev = doc.event || {};
  const from = firstLine(me.name);
  const label = T.label;
  const subject = (from ? '[' + from + '] ' : '') + label + (ev.name || c.name ? ' — ' + (ev.name || c.name) : '');
  const money = docMoney(doc, C.S.data);
  const lines = [
    (c.person ? c.person + ' 님' : c.name ? c.name + ' 담당자님' : '담당자님') + ', 안녕하세요.',
    from ? from + '입니다.' : '',
    '',
    (ev.name ? '「' + ev.name + '」 ' : '') + label + josaEul(label) + ' 보내 드립니다.',
    doc.showNo ? '문서번호: ' + docNo(doc) : '',
    '합계금액: ₩' + won(t.total) + ' (부가세 포함)'
  ];
  if (doc.type === 'inv') {
    if (money.linked && money.received) lines.push('이번에 청구하는 금액: ₩' + won(money.remaining));
    if (doc.dueDate) lines.push('입금 기한: ' + dateKo(doc.dueDate) + '까지');
    const acct = [me.bankName, me.bankNo].filter(Boolean).join(' ');
    if (acct) lines.push('입금 계좌: ' + acct + (me.holder ? ' (예금주 ' + me.holder + ')' : ''));
  }
  lines.push('', '첨부한 PDF 파일을 확인해 주세요.', '감사합니다.', '', ...String(me.name || '').split('\n').map((x) => x.trim()).filter(Boolean));
  if (me.tel) lines.push(me.tel);
  const body = lines.filter((x, i, a) => !(x === '' && a[i - 1] === '') && x !== null).join('\n').replace(/^\n+/, '');
  return { to: clientEmail(doc), subject, body };
}
export const gmailUrl = (m) => 'https://mail.google.com/mail/?view=cm&fs=1&tf=1' + (m.to ? '&to=' + encodeURIComponent(m.to) : '') + '&su=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.body);
export const mailtoUrl = (m) => 'mailto:' + encodeURIComponent(m.to || '') + '?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.body);

/* ── 동작 ── */
function noLinesWarn(doc) { if (!doc.lines.length) C.toast('품목이 없는 문서예요. 그래도 만들어요'); }

function savePdf(doc) { noLinesWarn(doc); return withBusy('PDF 파일을 만드는 중이에요…', async () => save([await makePdf(doc)], 'PDF')); }
function saveJpg(doc) { noLinesWarn(doc); return withBusy('이미지 파일을 만드는 중이에요…', async () => save(await makeJpgs(doc), '이미지')); }
function saveXlsx(doc) { return withBusy('엑셀 파일을 만드는 중이에요…', async () => { download(makeDocXlsx(doc)); C.toast('엑셀 파일을 내려받았어요 (금액 칸은 수식이에요)'); }); }

function kakao(doc) {
  noLinesWarn(doc); markSent(doc);
  if (isTouch()) {
    return withBusy('카톡으로 보낼 그림을 만드는 중이에요…', async () => {
      const jpgs = await makeJpgs(doc);
      if (!canShareFiles(asFiles(jpgs))) { await downloadAll(jpgs); C.openModal({ icon: 'chat', title: '이미지를 저장했어요', body: '<p>이 기기는 공유 창으로 파일을 넘길 수 없어요. 저장한 이미지를 카카오톡 대화방에서 「사진」으로 골라 보내 주세요.</p>', ok: '알겠어요', cancel: false }); return; }
      await share(jpgs, { title: fileTitle(doc), hint: '목록에서 「카카오톡」을 고른 뒤 받는 사람을 고르세요.', done: '공유 창으로 넘겼어요. 카카오톡에서 받는 사람을 골라 보내 주세요' });
    });
  }
  // PC: 그림을 클립보드에 복사 → PC 카톡 대화창에 Ctrl+V. 누른 그 순간에 복사를 시작해야 브라우저가 허락한다
  if (busy) { C.toast('앞의 파일을 만드는 중이에요. 잠시만요'); return; }
  busy = true; document.body.classList.add('x-busy'); C.toast('카톡에 붙여 넣을 그림을 만드는 중이에요…');
  const done = () => { busy = false; document.body.classList.remove('x-busy'); };
  const png = makeClipPng(doc);
  const ok = () => C.openModal({ icon: 'chat', title: '문서 그림을 복사했어요', body: '<ol class="x-steps"><li>PC <b>카카오톡</b>에서 보낼 대화방을 여세요.</li><li>입력 칸을 누르고 <b>Ctrl + V</b>(붙여넣기)를 누르세요.</li><li>그림이 보이면 <b>전송</b>을 누르세요.</li></ol><p class="x-sub">PDF 파일로 보내려면 「파일로 저장 → PDF」로 저장한 뒤 대화방에 끌어다 놓으세요.</p>', ok: '알겠어요', cancel: '이미지 파일로도 저장', onCancel: () => saveJpg(doc) });
  const fallback = async (why) => {
    try { const jpgs = await makeJpgs(doc); await downloadAll(jpgs); } catch (e) { done(); C.toast('그림을 만들지 못했어요'); return; }
    done();
    C.openModal({ icon: 'chat', title: '이미지 파일로 저장했어요', body: '<p>' + C.esc(why) + '</p><ol class="x-steps"><li>PC <b>카카오톡</b>에서 보낼 대화방을 여세요.</li><li>방금 내려받은 이미지(다운로드 폴더)를 대화창에 <b>끌어다 놓으세요</b>.</li></ol>', ok: '알겠어요', cancel: false });
  };
  if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) { fallback('이 브라우저는 그림 복사를 지원하지 않아요.'); return; }
  let item;
  try { item = new ClipboardItem({ 'image/png': png }); } catch (e) { fallback('이 브라우저는 그림 복사를 지원하지 않아요.'); return; }
  navigator.clipboard.write([item]).then(() => { done(); ok(); }).catch(() => png.then(() => fallback('그림 복사가 허락되지 않아 파일로 저장했어요.'), () => { done(); C.toast('그림을 만들지 못했어요'); }));
}

function mail(doc) {
  noLinesWarn(doc); markSent(doc);
  const m = mailParts(doc);
  if (isTouch()) {
    return withBusy('메일에 붙일 PDF를 만드는 중이에요…', async () => {
      const pdf = await makePdf(doc);
      if (!canShareFiles(asFiles([pdf]))) { download(pdf); location.href = mailtoUrl(m); return; }
      await share([pdf], { title: m.subject, text: m.body, hint: '목록에서 메일 앱을 고르면 PDF가 붙은 채로 열려요.', done: '공유 창으로 넘겼어요. 메일 앱에서 받는 사람을 확인하고 보내 주세요' });
    });
  }
  // PC: 누른 순간 Gmail 쓰기 창을 열고(받는 사람 · 제목 · 본문), PDF 는 내려받아 끌어다 놓게 한다
  let w = null;
  try { w = window.open(gmailUrl(m), '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
  return withBusy('메일에 붙일 PDF를 만드는 중이에요…', async () => {
    const pdf = await makePdf(doc);
    download(pdf);
    C.openModal({
      icon: 'mail', title: 'PDF를 저장하고 Gmail을 열었어요', wide: true,
      body: (m.to ? '' : '<p class="warnbox">' + C.ic('alert') + '<span>거래처 이메일이 없어서 받는 사람 칸이 비어 있어요. Gmail에서 직접 넣어 주세요. (거래처 목록에서 이메일을 넣어 두면 다음부터 자동으로 들어가요)</span></p>') +
        '<ol class="x-steps"><li>' + (w ? '새로 열린 <b>Gmail 쓰기 창</b>' : '<a href="' + C.esc(gmailUrl(m)) + '" target="_blank" rel="noopener"><b>여기를 눌러 Gmail 쓰기 창</b></a>') + '에 받는 사람 · 제목 · 본문이 들어가 있어요.</li>' +
        '<li>방금 내려받은 <b>' + C.esc(pdf.name) + '</b> 파일을 Gmail 창에 <b>끌어다 놓으세요</b>. (다운로드 폴더에 있어요)</li><li>내용을 확인하고 <b>보내기</b>를 누르세요.</li></ol>' +
        '<p class="x-sub">Gmail이 아니라 PC의 메일 프로그램을 쓰신다면 <a href="' + C.esc(mailtoUrl(m)) + '">기본 메일 프로그램으로 쓰기</a></p>' +
        (w ? '<p class="x-sub">Gmail 창이 안 보이면 <a href="' + C.esc(gmailUrl(m)) + '" target="_blank" rel="noopener">다시 열기</a></p>' : ''),
      ok: '알겠어요', cancel: false
    });
  });
}

/* ── 목록 · 거래처 · 품목 엑셀 ── */
const today8 = () => ymd().replace(/-/g, '');
function listXlsx() {
  const S = C.S;
  const docs = filterDocs(S.data.docs, { type: S.listType || '', q: S.listQuery || '' })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.serial).localeCompare(String(b.serial)));
  if (!docs.length) { C.toast('내보낼 문서가 없어요'); return; }
  const bytes = buildXlsx(listSheets(docs), { title: '발행 목록' });
  download({ blob: new Blob([bytes], { type: XLSX_TYPE }), name: '발행목록_' + today8() + '.xlsx' });
  C.toast('문서 ' + docs.length + '건을 엑셀로 내려받았어요' + (S.listType || S.listQuery ? ' (지금 거른 목록만)' : ''));
}
function clientsXlsx() {
  const list = C.S.data.clients; if (!list.length) { C.toast('내보낼 거래처가 없어요'); return; }
  download({ blob: new Blob([buildXlsx([clientsSheet(list)], { title: '거래처' })], { type: XLSX_TYPE }), name: '거래처_' + today8() + '.xlsx' });
  C.toast('거래처 ' + list.length + '곳을 엑셀로 내려받았어요');
}
function itemsXlsx() {
  const { items, sets } = C.S.data; if (!items.length) { C.toast('내보낼 품목이 없어요'); return; }
  download({ blob: new Blob([buildXlsx(itemsSheets(items, sets || []), { title: '품목' })], { type: XLSX_TYPE }), name: '품목_' + today8() + '.xlsx' });
  C.toast('품목 ' + items.length + '개' + (sets && sets.length ? ' · 세트 ' + sets.length + '개' : '') + '를 엑셀로 내려받았어요');
}

/** 누르기: 처리했으면 true */
export function exportClick(act, a, doc) {
  switch (act) {
    case 'x-list-xlsx': listXlsx(); return true;
    case 'x-clients-xlsx': clientsXlsx(); return true;
    case 'x-items-xlsx': itemsXlsx(); return true;
  }
  if (!/^x-(pdf|jpg|xlsx|kakao|mail)$/.test(act)) return false;
  const m = a.closest('.menu'); if (m) m.classList.remove('open');
  if (!doc) { C.toast('문서를 찾지 못했어요'); return true; }
  if (act === 'x-pdf') savePdf(doc);
  else if (act === 'x-jpg') saveJpg(doc);
  else if (act === 'x-xlsx') saveXlsx(doc);
  else if (act === 'x-kakao') kakao(doc);
  else if (act === 'x-mail') mail(doc);
  return true;
}
