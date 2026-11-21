// 스타미디어 견적서 발행기 — 매출 · 미수금 · 행사 달력 · 장비 · 오늘 챙길 일 규칙 (1.0 완성본)
// 화면 없이 자료(data)만 받아 계산한다 → node 로 시험(core/tests-reports.mjs).
//
// 낱말 정리
//  · 계약된 행사: 취소되지 않았고, 행사 화면에서 「계약 확정」했거나(event.contract), 입금이 한 번이라도 있거나,
//                 거래명세서 · 납품ㆍ청구서 · 영수증을 만든 행사.
//  · 매출: 계약된 행사의 계약 금액(행사 시작일의 달). 행사로 묶지 않은 문서는 매출에 넣지 않는다(v1.3.0: 계약은 행사에 표시).
//  · 받은 돈: 취소 표시하지 않은 입금(환불은 빼기), 입금한 날의 달.
//  · 미수금: 계약된 행사의 계약 금액 − 받은 돈 (0보다 클 때만). 행사로 묶지 않은 문서는 입금을 셀 수 없어 넣지 않는다.
//  · 장비: 행사에 넣은 장비(gear)는 반출일(out)부터 반납일(back)까지 나가 있다고 본다. 없으면 행사 시작 · 끝 날짜.
import { eventMoney, eventDocs } from './events.mjs?v=mwqo0jnd';
import { docTotals, addDays, validUntil } from './docs.mjs?v=mwqo0jnd';

const inYear = (s, y) => !!s && String(s).slice(0, 4) === String(y);
const monthOf = (s) => Number(String(s).slice(5, 7));

/* ── 행사 ── */
export function isContracted(e, data) {
  if (!e || e.status === 'cancel') return false;
  if (e.contract) return true;
  const m = eventMoney(e, data);
  if (m.received > 0) return true;
  return eventDocs(e, data.docs).some((d) => d.type === 'stmt' || d.type === 'inv' || d.type === 'rcpt');
}
/** 매출로 셀 날짜: 행사 시작일 → 계약 기준 문서 날짜 → 만든 날 */
export function saleDate(e, data) {
  if (e.start) return e.start;
  const m = eventMoney(e, data);
  if (m.base && m.base.date) return m.base.date;
  return String(e.createdAt || '').slice(0, 10);
}
const looseDocs = () => [];   // v1.3.0: 계약은 행사에만 — 묶지 않은 문서는 매출에 넣지 않음
const validPays = (data) => data.payments.filter((p) => !p.cancelled);

/** 매출이 생긴 해 목록 (최근 해 먼저, 올해는 늘 포함) */
export function salesYears(data, today) {
  const ys = new Set([String(today).slice(0, 4)]);
  for (const e of data.events) if (isContracted(e, data)) ys.add(saleDate(e, data).slice(0, 4));
  for (const d of looseDocs(data)) ys.add(String(d.date).slice(0, 4));
  for (const p of validPays(data)) ys.add(String(p.date).slice(0, 4));
  return [...ys].filter((y) => /^\d{4}$/.test(y)).sort().reverse();
}

/** 달마다 매출 · 받은 돈 (1월~12월) */
export function salesByMonth(data, year) {
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, sales: 0, received: 0, count: 0 }));
  for (const e of data.events) {
    if (!isContracted(e, data)) continue;
    const d = saleDate(e, data); if (!inYear(d, year)) continue;
    const r = months[monthOf(d) - 1]; r.sales += eventMoney(e, data).total; r.count++;
  }
  for (const doc of looseDocs(data)) {
    if (!inYear(doc.date, year)) continue;
    const r = months[monthOf(doc.date) - 1]; r.sales += docTotals(doc).total; r.count++;
  }
  for (const p of validPays(data)) {
    if (!inYear(p.date, year)) continue;
    const e = data.events.find((x) => x.id === p.eventId);
    if (e && e.status === 'cancel' && p.amount > 0) { /* 취소된 행사의 입금도 실제로 받은 돈이라 센다 */ }
    months[monthOf(p.date) - 1].received += p.amount;
  }
  return months;
}

/** 거래처마다 매출 · 받은 돈 · 남은 돈 (매출 큰 순) */
export function salesByClient(data, year) {
  const map = new Map();
  const row = (name) => { const k = (name || '받는 곳 없음').trim() || '받는 곳 없음'; if (!map.has(k)) map.set(k, { name: k, count: 0, sales: 0, received: 0, remaining: 0 }); return map.get(k); };
  for (const e of data.events) {
    if (!isContracted(e, data) || !inYear(saleDate(e, data), year)) continue;
    const m = eventMoney(e, data), r = row(e.client && e.client.name);
    r.count++; r.sales += m.total; r.received += m.received; r.remaining += Math.max(0, m.remaining);
  }
  for (const doc of looseDocs(data)) {
    if (!inYear(doc.date, year)) continue;
    const r = row(doc.client && doc.client.name); r.count++; r.sales += docTotals(doc).total;
  }
  return [...map.values()].sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name, 'ko'));
}

/** 미수금: 계약된 행사 중 남은 돈이 있는 것 (입금 기한 지난 것 먼저) */
export function receivables(data, today) {
  const out = [];
  for (const e of data.events) {
    if (!isContracted(e, data)) continue;
    const m = eventMoney(e, data);
    if (!(m.remaining > 0)) continue;
    const dues = eventDocs(e, data.docs).filter((d) => d.type === 'inv' && d.dueDate).map((d) => d.dueDate).sort();
    const due = dues.length ? dues[dues.length - 1] : '';
    out.push({ event: e, total: m.total, received: m.received, remaining: m.remaining, due, overdue: !!due && due < today, date: saleDate(e, data) });
  }
  return out.sort((a, b) => (b.overdue - a.overdue) || String(a.due || '9999').localeCompare(String(b.due || '9999')) || String(a.date).localeCompare(String(b.date)));
}

/** 한 해 요약 숫자 */
export function yearSummary(data, year, today) {
  const ms = salesByMonth(data, year);
  const sales = ms.reduce((s, m) => s + m.sales, 0), received = ms.reduce((s, m) => s + m.received, 0);
  const rec = receivables(data, today);
  const pending = data.docs.filter((d) => d.type === 'quote' && inYear(d.date, year) && !(d.eventId && isContracted(data.events.find((e) => e.id === d.eventId), data)));
  return {
    sales, received, count: ms.reduce((s, m) => s + m.count, 0),
    remaining: rec.reduce((s, r) => s + r.remaining, 0), overdue: rec.filter((r) => r.overdue).reduce((s, r) => s + r.remaining, 0),
    pendingCount: pending.length, pendingTotal: pending.reduce((s, d) => s + docTotals(d).total, 0)
  };
}

/* ── 장비 ── */
/** 행사의 장비 반출 · 반납 기간 [시작, 끝] (날짜가 하나도 없으면 null) */
export function gearRange(e) {
  const a = e.out || e.start || '', b = e.back || e.end || e.out || e.start || '';
  if (!a) return null;
  return b && b >= a ? [a, b] : [a, a];
}
/** 그날 그 장비가 몇 개 나가 있나 (취소된 행사 제외) */
export function usageOn(data, equipId, day, exceptEventId = null) {
  let n = 0;
  for (const e of data.events) {
    if (e.status === 'cancel' || e.id === exceptEventId || !Array.isArray(e.gear)) continue;
    const r = gearRange(e); if (!r || day < r[0] || day > r[1]) continue;
    for (const g of e.gear) if (g.equipId === equipId) n += Math.max(0, Number(g.qty) || 0);
  }
  return n;
}
/** 그날 장비마다 총 수량 · 나감 · 남음(음수면 부족) */
export function equipmentOn(data, day) {
  return (data.equipment || []).map((q) => { const out = usageOn(data, q.id, day); const total = Math.max(0, Number(q.total) || 0); return { equip: q, total, out, left: total - out }; });
}
/** 장비 상태 낱말: 부족 · 모두 나감 · 얼마 안 남음 · 넉넉함 */
export function equipState(total, left) {
  if (left < 0) return ['short', (-left) + '개 부족'];
  if (left === 0 && total > 0) return ['none', '모두 나감'];
  if (total > 0 && left / total < 0.2) return ['low', '얼마 안 남음'];
  return ['ok', '넉넉함'];
}
/** 이 행사의 장비가 기간 중 가장 모자라는 날과 개수 (모자라지 않으면 빈 목록) */
export function gearShortage(e, data) {
  const r = gearRange(e); if (!r || !Array.isArray(e.gear) || e.status === 'cancel') return [];
  const out = [];
  for (const g of e.gear) {
    const q = (data.equipment || []).find((x) => x.id === g.equipId); if (!q) continue;
    let worst = 0, worstDay = '';
    for (let d = r[0], i = 0; d <= r[1] && i < 400; d = addDays(d, 1), i++) {
      const short = usageOn(data, q.id, d) - (Number(q.total) || 0);
      if (short > worst) { worst = short; worstDay = d; }
    }
    if (worst > 0) out.push({ equipId: q.id, name: q.name, short: worst, day: worstDay });
  }
  return out;
}

/* ── 달력 ── */
/** 한 달 달력: 주(일~토)마다 날짜 칸, 칸마다 그날 행사 · 나가는 장비 수 */
export function monthGrid(data, year, month) {
  const first = year + '-' + String(month).padStart(2, '0') + '-01';
  const startDow = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const day = addDays(first, d - 1);
    const evs = data.events.filter((e) => e.status !== 'cancel' && e.start && day >= e.start && day <= (e.end && e.end >= e.start ? e.end : e.start));
    const gearOut = (data.equipment || []).reduce((s, q) => s + usageOn(data, q.id, day), 0);
    const short = (data.equipment || []).some((q) => usageOn(data, q.id, day) > (Number(q.total) || 0));
    cells.push({ day, d, events: evs, gearOut, short });
  }
  while (cells.length % 7) cells.push(null);
  const weeks = []; for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
/** 날짜를 안 정한 행사 (달력에 못 올림) */
export const undatedEvents = (data) => data.events.filter((e) => e.status !== 'cancel' && !e.start);

/* ── 오늘 챙길 일 ── */
export function todo(data, today, { soonDays = 3, weekDays = 7 } = {}) {
  const expiring = data.docs.filter((d) => d.type === 'quote' && !(d.eventId && isContracted(data.events.find((e) => e.id === d.eventId), data)))
    .map((d) => ({ doc: d, until: validUntil(d) })).filter((x) => x.until >= today && x.until <= addDays(today, soonDays))
    .sort((a, b) => a.until.localeCompare(b.until));
  const overdue = receivables(data, today).filter((r) => r.overdue);
  const week = data.events.filter((e) => e.status !== 'cancel' && e.start && e.start >= today && e.start <= addDays(today, weekDays))
    .sort((a, b) => a.start.localeCompare(b.start));
  const short = data.events.filter((e) => e.status !== 'cancel' && (gearRange(e) || ['', ''])[1] >= today)
    .map((e) => ({ event: e, list: gearShortage(e, data) })).filter((x) => x.list.length);
  return { expiring, overdue, week, short, count: expiring.length + overdue.length + week.length + short.length };
}

/* ── 휴지통 ── */
export const TRASH_DAYS = 30;
/** 30일 지난 것은 비운다 */
export function purgeTrash(trash, now = new Date().toISOString(), days = TRASH_DAYS) {
  const limit = new Date(new Date(now).getTime() - days * 86400000).toISOString();
  return (trash || []).filter((t) => String(t.deletedAt) >= limit);
}
/** 며칠 뒤 완전히 지워지나 */
export function daysLeft(t, now = new Date().toISOString(), days = TRASH_DAYS) {
  return Math.max(0, days - Math.floor((new Date(now) - new Date(t.deletedAt)) / 86400000));
}
