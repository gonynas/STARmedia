// 스타미디어 견적서 발행기 — 행사 · 입금 규칙 (1단계 넷째 묶음)
// 행사 한 건에 견적서 · 수정본 · 거래명세서 · 납품ㆍ청구서 · 영수증을 묶고, 돈은 「계약 기준 문서」 한 장으로만 센다.
// 행사: { id, name, clientId, client:{name,person,tel}, start, end, place, baseDocId, status:'active'|'cancel', memo, createdAt, updatedAt }
// 입금: { id, eventId, date, amount(환불은 음수), method, memo, cancelled, createdAt }
import { ledger, canIssueReceipt, refundOnCancel } from './money.mjs?v=mwn5py8q';
import { docTotals, copyDoc, serialFor, addDays, ymd, docNo } from './docs.mjs?v=mwn5py8q';
import { toNum } from './catalog.mjs?v=mwn5py8q';

const nid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** 문서의 받는 곳 · 행사 정보로 새 행사 */
export function eventFromDoc(doc, { id, now = new Date().toISOString() } = {}) {
  const c = doc.client || {}, ev = doc.event || {};
  return {
    id: id || nid('e'), name: (ev.name || '').trim() || ((c.name || '이름 없는') + ' 행사'),
    clientId: doc.clientId || null, client: { name: c.name || '', person: c.person || '', tel: c.tel || '' },
    start: '', end: '', place: ev.place || '', dateText: ev.date || '',
    baseDocId: doc.id, status: 'active', memo: '', createdAt: now, updatedAt: now
  };
}
export function blankEvent(v = {}, { id, now = new Date().toISOString() } = {}) {
  return {
    id: id || nid('e'), name: String(v.name || '').trim(), clientId: v.clientId || null,
    client: { name: v.clientName || '', person: v.person || '', tel: v.tel || '' },
    start: v.start || '', end: v.end || '', place: v.place || '', dateText: '',
    baseDocId: null, status: 'active', memo: '', createdAt: now, updatedAt: now
  };
}

/** 행사 일정 글자: 시작~끝 날짜가 있으면 그것, 없으면 직접 쓴 글자 */
export function eventDateText(e) {
  const md = (s) => { const [, m, d] = s.split('-').map(Number); return m + '월 ' + d + '일'; };
  if (e.start && e.end && e.end !== e.start) return md(e.start) + ' ~ ' + md(e.end);
  if (e.start) return md(e.start);
  return e.dateText || '';
}

export const eventDocs = (e, docs) => docs.filter((d) => d.eventId === e.id).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
export const eventPays = (e, pays) => pays.filter((p) => p.eventId === e.id).sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt).localeCompare(String(b.createdAt)));

/**
 * 계약 기준 문서: 정해 둔 문서(baseDocId) → 없으면 가장 최근 견적서(수정본) → 없으면 영수증이 아닌 가장 최근 문서
 */
export function baseDoc(e, docs) {
  const list = eventDocs(e, docs);
  const set = list.find((d) => d.id === e.baseDocId && d.type !== 'rcpt');
  if (set) return set;
  const quotes = list.filter((d) => d.type === 'quote');
  if (quotes.length) return quotes[quotes.length - 1];
  const others = list.filter((d) => d.type !== 'rcpt');
  return others.length ? others[others.length - 1] : null;
}

/** 행사의 돈: 계약 금액(계약 기준 문서의 최종 합계) · 받은 금액 · 남은 금액 · 상태 */
export function eventMoney(e, data) {
  const base = baseDoc(e, data.docs);
  const total = base ? docTotals(base).total : 0;
  const pays = eventPays(e, data.payments);
  const l = ledger(total, pays);
  let state = l.state;
  if (e.status === 'cancel') state = 'cancel';
  return { base, total, ...l, state, refund: e.status === 'cancel' ? refundOnCancel(pays) : 0, receipt: canIssueReceipt(total, pays) };
}
export const MONEY_STATE = { unpaid: '미입금', partial: '일부 입금', paid: '완납', overpaid: '더 받음', cancel: '취소' };

/** 입금 금액 읽기: "−500,000" 이나 방법이 「환불」이면 음수 */
export function parsePayment(text, method) {
  const neg = /^\s*[-−]/.test(String(text || ''));
  const n = toNum(String(text || '').replace(/^\s*[-−]/, ''));
  if (!n) return null;
  return neg || method === '환불' ? -Math.abs(n) : Math.abs(n);
}
export function newPayment(eventId, { date = ymd(), amount, method = '계좌이체', memo = '' }, { id, now = new Date().toISOString() } = {}) {
  return { id: id || nid('p'), eventId, date, amount: Math.round(amount), method, memo: String(memo || '').trim(), cancelled: false, createdAt: now };
}

/**
 * 문서를 다른 종류로 바꿔 만들기 (견적서 → 거래명세서 · 납품ㆍ청구서). 같은 행사로 묶는다.
 * 거래명세서: 거래일자 = 오늘, 2부 / 납품ㆍ청구서: 입금 기한 = 오늘 + dueDays
 */
export function convertDoc(src, type, data, { eventId, today = ymd(), device = 'pc', id, now } = {}) {
  const c = copyDoc(src, data.docs, { today, device, id, now, type });
  c.eventId = eventId || src.eventId || null;
  c.version = 1; c.deposit = { on: false, amount: 0 };
  applyTypeDefaults(c, data, today);
  return c;
}
/** 종류별 기본 칸 채우기 (이미 있으면 그대로) */
export function applyTypeDefaults(doc, data, today = ymd()) {
  const st = data.settings || {};
  if (doc.type === 'stmt') { if (!doc.tradeDate) doc.tradeDate = today; if (!doc.copies) doc.copies = 2; }
  if (doc.type === 'inv' && !doc.dueDate) doc.dueDate = addDays(today, toNum(st.dueDays) ?? 14);
  if (doc.type === 'rcpt') { if (!doc.paidDate) doc.paidDate = today; if (doc.payMethod == null) doc.payMethod = '계좌이체'; }
  return doc;
}

/** 견적 수정본: 같은 번호에 「-2, -3 …」, 같은 행사 */
export function reviseDoc(src, data, { today = ymd(), device = 'pc', id, now } = {}) {
  const c = copyDoc(src, data.docs, { today, device, id, now });
  c.serial = src.serial; c.date = src.date;
  const same = data.docs.filter((d) => d.type === src.type && d.serial === src.serial);
  c.version = Math.max(...same.map((d) => d.version || 1)) + 1;
  c.eventId = src.eventId || null;
  return c;
}
export function docLabel(doc) { return docNo(doc); }

/** 완납 영수증: 계약 기준 문서의 품목 · 금액, 받은 날짜 = 마지막 유효 입금일, 결제 방법 = 쓴 방법들 */
export function receiptFor(e, data, { today = ymd(), device = 'pc', id, now } = {}) {
  const m = eventMoney(e, data);
  if (!m.base || !m.receipt.ok) return { ok: false, reason: m.receipt.reason || 'no-base', money: m };
  const valid = eventPays(e, data.payments).filter((p) => !p.cancelled);
  const r = copyDoc(m.base, data.docs, { today, device, id, now, type: 'rcpt' });
  r.eventId = e.id; r.version = 1; r.deposit = { on: false, amount: 0 };
  const plus = valid.filter((p) => p.amount > 0);
  r.paidDate = plus.length ? plus[plus.length - 1].date : today;   // 환불 날짜가 아니라 마지막으로 받은 날
  r.payMethod = [...new Set(valid.filter((p) => p.amount > 0).map((p) => p.method))].join(' · ') || '계좌이체';
  r.baseLabel = docLabel(m.base);
  r.serial = serialFor(data.docs, 'rcpt', today);
  return { ok: true, doc: r, money: m };
}

/** 영수증이 아직 유효한가 (입금을 취소해 완납이 깨지면 「무효」) */
export function receiptValid(doc, data) {
  if (doc.type !== 'rcpt' || !doc.eventId) return true;
  const e = data.events.find((x) => x.id === doc.eventId); if (!e) return true;
  return eventMoney(e, data).state === 'paid';
}

/** 문서에 보여 줄 행사 돈 (청구서 · 거래명세서 · 영수증) */
export function docMoney(doc, data) {
  const t = docTotals(doc);
  const e = doc.eventId ? data.events.find((x) => x.id === doc.eventId) : null;
  if (!e) return { total: t.total, received: 0, remaining: t.total, linked: false };
  const pays = eventPays(e, data.payments);
  const l = ledger(t.total, pays);
  return { total: t.total, received: l.received, remaining: l.remaining, linked: true, valid: receiptValid(doc, data) };
}

/** 행사 목록: 진행 중 먼저, 최근 고친 순. 검색: 행사명 · 받는 곳 · 장소 */
export function filterEvents(events, q = '') {
  const k = String(q).replace(/\s+/g, '').toLowerCase();
  return events.filter((e) => !k || [e.name, e.client && e.client.name, e.place].join('').replace(/\s+/g, '').toLowerCase().includes(k))
    .sort((a, b) => (a.status === 'cancel') - (b.status === 'cancel') || String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
