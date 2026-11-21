// 스타미디어 견적서 발행기 — 문서 규칙 (1단계 셋째 묶음: 견적서 작성 · 인쇄)
// 화면과 상관없는 순수 규칙만 둔다.
// 문서: { id, type, serial, showNo, date, validDays, status, clientId, client:{name,person,tel,email,bizNo,addr},
//         event:{name,date,place}, lines:[줄], vat, deposit:{on,amount}, agreed, notes:{valid,bank,phrases:[],text},
//         fillRows, eventId, device, lastDevice, createdAt, updatedAt }
// 줄: { id, itemId, name, spec, days, qty, price, memo, taxFree }
import { settle } from './money.mjs?v=mwqgvo9m';
import { toNum } from './catalog.mjs?v=mwqgvo9m';

export const DOC_TYPES = {
  quote: { label: '견적서', short: '견적', title: '견 적 서', en: 'QUOTATION' },
  stmt: { label: '거래명세서', short: '명세', title: '거 래 명 세 서', en: 'TRANSACTION STATEMENT' },
  inv: { label: '납품ㆍ청구서', short: '청구', title: '납품ㆍ청구서', en: 'DELIVERY & INVOICE' },
  rcpt: { label: '영수증', short: '영수', title: '영 수 증', en: 'RECEIPT' }
};
/** 이번 묶음에서 직접 고를 수 있는 진행 상태 (입금 관련 상태는 행사 · 입금 묶음에서 입금 내역으로 정해짐) */
// 문서 진행 상태 3단계 (v1.3.0, 사용자 결정): 작성 중 → 작성 완료(단추) → 발송 완료(카톡 · 메일 보내기 때 저절로). 드롭다운으로 언제든 바꿀 수 있다.
// 계약 · 계약 취소는 문서가 아니라 행사(event.contract · event.status)에 표시한다.
export const DOC_STATUS = { draft: '작성 중', done: '작성 완료', sent: '발송 완료' };
export const DEFAULT_PHRASES = [
  '우천 시 행사 일정은 협의하여 조정합니다.',
  '설치 · 철수 인건비가 포함된 금액입니다.',
  '전기 사용료는 별도입니다.',
  '계약금 입금 후 일정이 확정됩니다.'
];

/* ── 날짜 ── */
const pad2 = (n) => String(n).padStart(2, '0');
/** 이 기기 시간 기준 YYYY-MM-DD */
export function ymd(d = new Date()) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
/** YYYY-MM-DD 에 n일 더하기 (달 · 해 넘김 포함) */
export function addDays(s, n) {
  const [y, m, d] = String(s).split('-').map(Number);
  const t = new Date(y, m - 1, d + (Number(n) || 0));
  return ymd(t);
}
/** 2026-11-15 → 2026년 11월 15일 */
export function dateKo(s) {
  if (!s) return '';
  const [y, m, d] = String(s).split('-').map(Number);
  return y + '년 ' + m + '월 ' + d + '일';
}
/** 2026-11-15 → 11월 15일 */
export function dateShort(s) { if (!s) return ''; const [, m, d] = String(s).split('-').map(Number); return m + '월 ' + d + '일'; }

/* ── 문서 번호: 「견적 261115-01」 — 같은 날 · 같은 종류에서 1씩 증가 ── */
export function serialFor(docs, type, date, exceptId = null) {
  const p = String(date).slice(2).replace(/-/g, '');
  let max = 0;
  for (const d of docs) {
    if (d.id === exceptId || d.type !== type || !d.serial || !d.serial.startsWith(p + '-')) continue;
    const n = Number(d.serial.slice(p.length + 1)); if (n > max) max = n;
  }
  return p + '-' + pad2(max + 1);
}
export function docNo(doc) { return (DOC_TYPES[doc.type] || DOC_TYPES.quote).short + ' ' + doc.serial + (doc.version > 1 ? '-' + doc.version : ''); }

/* ── 줄 ── */
let seq = 0;
const lid = () => 'l' + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5);
export function newLine(src = {}) {
  return {
    id: lid(), itemId: src.itemId || null, name: String(src.name || ''), spec: String(src.spec || ''),
    days: toNum(src.days) ?? 1, qty: toNum(src.qty) ?? 1, price: toNum(src.price) ?? 0,
    memo: String(src.memo || ''), taxFree: !!src.taxFree
  };
}
/** 등록한 품목 → 문서 줄 (기본 일수 · 기본 단가 · 비고를 그대로) */
export function itemToLine(item) {
  return newLine({ itemId: item.id, name: item.name, spec: item.spec, days: toNum(item.days) ?? 1, qty: 1, price: item.price, memo: item.memo, taxFree: item.taxFree });
}

/* ── 새 문서 · 복사 ── */
export function newDoc(type, data, { today = ymd(), device = 'pc', id, now = new Date().toISOString() } = {}) {
  const st = data.settings || {};
  return {
    id: id || 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type, serial: serialFor(data.docs || [], type, today), showNo: true,
    date: today, validDays: toNum(st.validDays) ?? 15, status: 'draft',
    clientId: null, client: { name: '', person: '', tel: '', email: '', bizNo: '', addr: '' },
    event: { name: '', date: '', place: '' },
    lines: [], vat: st.vat || 'excl', deposit: { on: false, amount: 0 }, agreed: null,
    notes: { valid: true, bank: true, phrases: [], text: '' },
    fillRows: !!st.fillRows, eventId: null,
    device, lastDevice: device, createdAt: now, updatedAt: now
  };
}
/** 복사해서 새로: 오늘 날짜 · 새 번호 · 작성 중. 줄은 새 id */
export function copyDoc(doc, docs, { today = ymd(), device = 'pc', id, now = new Date().toISOString(), type } = {}) {
  const c = JSON.parse(JSON.stringify(doc));
  c.id = id || 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  c.type = type || doc.type;
  c.date = today; c.serial = serialFor(docs, c.type, today); c.status = 'draft';
  c.lines = c.lines.map((l) => ({ ...l, id: lid() }));
  c.device = device; c.lastDevice = device; c.createdAt = now; c.updatedAt = now;
  return c;
}
/** 문서 날짜를 바꾸면 번호도 그 날짜로 (같은 날짜면 그대로) */
export function renumberIfDateChanged(doc, docs) {
  const p = String(doc.date).slice(2).replace(/-/g, '');
  if (doc.serial && doc.serial.startsWith(p + '-')) return false;
  doc.serial = serialFor(docs, doc.type, doc.date, doc.id);
  return true;
}

/* ── 합계 ── */
/** 끝자리 정리(최종 합의금액) · 예상 선금까지 반영한 합계 */
export function docTotals(doc) {
  const agreed = toNum(doc.agreed);
  const s = settle(doc.lines || [], doc.vat, agreed && agreed > 0 ? agreed : null);
  const dep = doc.deposit && doc.deposit.on ? Math.max(0, Math.min(Math.round(toNum(doc.deposit.amount) || 0), s.final.total)) : 0;
  return { supply: s.final.supply, tax: s.final.tax, total: s.final.total, base: s.base, adjust: s.adjust, deposit: dep, balance: s.final.total - dep };
}
/** 선금 빠른 버튼(10 · 30 · 50%): 원 아래 버림 */
export function depositFromRate(total, rate) { return Math.floor((Number(total) || 0) * rate + 1e-6); }
export function validUntil(doc) { return addDays(doc.date, toNum(doc.validDays) ?? 15); }

/** 특이사항 목록 (자동 문구 → 자주 쓰는 문구 → 직접 쓴 줄) */
export function notesList(doc, me = {}) {
  const out = [];
  const n = doc.notes || {};
  if (doc.type === 'quote' && n.valid !== false) out.push({ auto: 'valid', text: '견적 유효기간은 발행일로부터 ' + (toNum(doc.validDays) ?? 15) + '일입니다. (' + dateKo(validUntil(doc)) + '까지)' });
  if (doc.type === 'inv' && doc.dueDate) out.push({ auto: 'due', text: '입금 기한은 ' + dateKo(doc.dueDate) + '까지입니다.' });
  // 납품ㆍ청구서는 아래 「입금 계좌」 상자가 따로 있어 계좌 문구를 넣지 않고, 영수증 · 거래명세서도 넣지 않는다
  if (n.bank !== false && (doc.type || 'quote') === 'quote' && (me.bankName || me.bankNo)) out.push({ auto: 'bank', text: '결제 계좌 : ' + [me.bankName, me.bankNo].filter(Boolean).join(' ') + (me.holder ? ' (예금주 ' + me.holder + ')' : '') });
  for (const p of n.phrases || []) if (String(p).trim()) out.push({ text: String(p).trim() });
  for (const l of String(n.text || '').split('\n')) if (l.trim()) out.push({ text: l.trim() });
  return out;
}

/* ── 쪽 나누기 ── */
/**
 * 품목 줄 n개를 A4 쪽으로 나눈다. 돌려주는 값: [[시작, 끝], ...]
 * 한 장: single 줄까지 / 여러 장: 첫 쪽 first(머리 · 받는 곳 포함), 가운데 쪽 middle, 마지막 쪽 last(합계 · 특이사항 포함)
 */
export const PAGE = { single: 12, first: 20, middle: 30, last: 20 };
export function paginate(n, p = PAGE) {
  if (n <= p.single) return [[0, n]];
  // 마지막 쪽에도 품목이 1줄 이상 남도록 (합계만 덩그러니 넘어가지 않게)
  const pages = [[0, Math.min(p.first, n - 1)]];
  let at = pages[0][1];
  while (n - at > p.last) {
    const rest = n - at;
    const take = rest > p.middle ? p.middle : Math.ceil(rest / 2);
    pages.push([at, at + take]); at += take;
  }
  pages.push([at, n]);
  return pages;
}
/** 특이사항이 많거나 끝자리 정리 줄이 있으면 합계가 들어가는 쪽의 줄 수를 줄인다 */
export function pageLimits(notesCount, hasAdjust, p = PAGE) {
  const extra = Math.ceil(Math.max(0, notesCount - 3) * 0.6) + (hasAdjust ? 1 : 0);
  return { ...p, single: Math.max(4, p.single - extra), last: Math.max(6, p.last - extra) };
}
/** 쪽마다 빈 줄을 채울 때 그 쪽이 담을 수 있는 줄 수 */
export function pageCapacity(i, count, p = PAGE) {
  if (count === 1) return p.single;
  if (i === 0) return p.first;
  if (i === count - 1) return p.last;
  return p.middle;
}

/* ── 엑셀에서 복사한 품목 표 → 문서 줄 ── */
const HEAD = {
  name: /^(품목|품명|품목명|항목|내용|이름)$/, spec: /^(규격|사양|크기|사이즈)$/, days: /^(일수|기간)$/,
  qty: /^(수량|개수)$/, price: /^(단가|가격|대여료)$/, memo: /^(비고|메모)$/
};
/**
 * 첫 줄이 머리글이면 그 순서대로(금액 · 단위 · 세액 같은 칸은 무시), 아니면 칸 수로 짐작:
 *   1칸 품목 / 2칸 품목 · 단가 / 3칸 품목 · 규격 · 단가 / 4칸 품목 · 규격 · 수량 · 단가 /
 *   5칸 품목 · 규격 · 일수 · 수량 · 단가 / 6칸 이상 + 비고
 * 합계 · 소계 줄과 품목 이름이 없는 줄은 건너뛴다.
 */
export function parseLinePaste(text) {
  const rowsIn = String(text || '').replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (!rowsIn.length) return { rows: [], skipped: 0, header: false };
  const split = (l) => (l.includes('\t') ? l.split('\t') : l.split(/\s{2,}/)).map((c) => c.trim());
  const first = split(rowsIn[0]).map((c) => c.replace(/\s/g, ''));
  const mapped = first.map((c) => Object.keys(HEAD).find((k) => HEAD[k].test(c)) || null);
  const cols = mapped.includes('name') ? mapped : null;
  const rows = []; let skipped = 0;
  for (const l of rowsIn.slice(cols ? 1 : 0)) {
    const c = split(l); let r;
    if (cols) { r = {}; cols.forEach((k, i) => { if (k && c[i] !== undefined) r[k] = c[i]; }); }
    else if (c.length >= 6) r = { name: c[0], spec: c[1], days: c[2], qty: c[3], price: c[4], memo: c[5] };
    else if (c.length === 5) r = { name: c[0], spec: c[1], days: c[2], qty: c[3], price: c[4] };
    else if (c.length === 4) r = { name: c[0], spec: c[1], qty: c[2], price: c[3] };
    else if (c.length === 3) r = { name: c[0], spec: c[1], price: c[2] };
    else if (c.length === 2) r = { name: c[0], price: c[1] };
    else r = { name: c[0] };
    const name = String(r.name || '').trim();
    if (!name || toNum(name) !== null || /^(합|소|총)?\s*계$|^합계금액$/.test(name.replace(/\s/g, ''))) { skipped++; continue; }
    rows.push({ name, spec: String(r.spec || '').trim(), days: toNum(r.days) ?? 1, qty: toNum(r.qty) ?? 1, price: toNum(r.price) ?? 0, memo: String(r.memo || '').trim() });
  }
  return { rows, skipped, header: !!cols };
}

/* ── 목록 ── */
const squash = (s) => String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase();
/** 발행 목록 거르기: 종류 · 검색어(받는 곳 · 담당자 · 행사명 · 번호 · 품목) · 최근 고친 순 */
/** 문서 품목 줄에 새 줄들을 넣을 때 같은 품목(이름 + 규격, 띄어쓰기 · 대소문자 무시)이 이미 있으면:
 *  mode 'qty' = 그 줄 수량에 더함(수량 +), 'skip' = 빼고 넣음(삭제). 새로 넣는 줄끼리 겹쳐도 같게. 원래 목록은 바꾸지 않는다.
 *  돌려주는 값: { lines: 합친 새 목록, added: 새로 붙인 줄 수, dups: 겹친 줄 수, dupNames: 겹친 품목 이름들 } */
export function mergeLines(existing, incoming, mode = 'qty') {
  const sq = (v) => String(v == null ? '' : v).replace(/\s+/g, '').toLowerCase();
  const key = (l) => sq(l.name) + '|' + sq(l.spec);
  const out = existing.map((l) => ({ ...l })), idx = new Map(), names = [];
  let added = 0, dups = 0;
  for (const l of out) if (sq(l.name)) idx.set(key(l), l);
  for (const l of incoming) {
    const hit = sq(l.name) ? idx.get(key(l)) : null;
    if (hit) {
      dups++; if (!names.includes(l.name)) names.push(l.name);
      if (mode === 'qty') hit.qty = (toNum(hit.qty) ?? 1) + (toNum(l.qty) ?? 1);
      continue;
    }
    const nl = { ...l }; out.push(nl); added++;
    if (sq(l.name)) idx.set(key(l), nl);
  }
  return { lines: out, added, dups, dupNames: names };
}
export function filterDocs(docs, { type = '', q = '', status = '' } = {}) {
  const k = squash(q);
  return docs.filter((d) => !d.pending && (!type || d.type === type) && (!status || (d.status || 'draft') === status) &&
    (!k || squash([docNo(d), d.client && d.client.name, d.client && d.client.person, d.event && d.event.name, (d.lines || []).map((l) => l.name).join(' ')].join(' ')).includes(k)))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
