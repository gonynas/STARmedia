// 엑셀로 내보낼 표 만들기 — 문서 한 장 · 발행 목록 · 거래처 · 품목 (5단계)
// 금액 칸은 수식으로 넣고, 미리 계산한 값도 같이 넣는다(엑셀 없이 미리보기만 해도 금액이 보이게).
// 수식은 core/money.mjs 의 계산 규칙과 똑같다:
//   공급가액(별도 · 없음) = INT(일수 × 수량 × 단가 + 0.000001)          … 원 아래 버림 (P02)
//   세액(별도)          = INT(공급가액 × 0.1)                           … 원 아래 버림
//   포함               : 공급가액 = ROUND(줄 금액 ÷ 1.1, 0), 세액 = 줄 금액 − 공급가액
//   없음 · 면세 줄      : 세액 0
import { lineAmount, lineTax, hangul } from './money.mjs?v=mwtejjn0';
import { DOC_TYPES, DOC_STATUS, docNo, docTotals, dateKo, validUntil, notesList } from './docs.mjs?v=mwtejjn0';
import { colName } from './xlsx.mjs?v=mwtejjn0';
import { expandSet } from './catalog.mjs?v=mwtejjn0';

const T = (v, s = 'text') => ({ v: v == null ? '' : String(v), s });
const N = (v, s = 'num') => ({ v: Math.round(Number(v) || 0), s });
const Q = (v, s = 'center') => ({ v: Number(v) || 0, s }); // 일수 · 수량 (0.5일 같은 소수 그대로)

/**
 * 줄 한 칸의 공급가액 · 세액 수식.
 * cols: { days, qty, price, supply, tax } — 열 문자(예: 'D'). r: 엑셀 줄 번호(1부터)
 */
export function lineFormulas(line, vat, cols, r) {
  const amt = 'INT(' + cols.days + r + '*' + cols.qty + r + '*' + cols.price + r + '+0.000001)';
  const v = lineTax(line, vat);
  if (vat === 'none' || line.taxFree) return { supply: { f: amt, v: v.supply, s: 'numB' }, tax: { v: 0, s: 'num' } };
  if (vat === 'incl') return { supply: { f: 'ROUND(' + amt + '/1.1,0)', v: v.supply, s: 'numB' }, tax: { f: amt + '-' + cols.supply + r, v: v.tax, s: 'num' } };
  return { supply: { f: amt, v: v.supply, s: 'numB' }, tax: { f: 'INT(' + cols.supply + r + '*0.1)', v: v.tax, s: 'num' } };
}

const oneLine = (s) => String(s || '').replace(/\s*\n\s*/g, ' ').trim();

/**
 * 문서 한 장 → 시트. money: 행사에 묶인 문서면 { linked, received, remaining } (미리보기와 같은 값)
 * 열: A NO · B 품목 · C 규격 · D 일수 · E 수량 · F 단가 · G 공급가액 · H 세액 · I 비고
 */
export function docSheet(doc, me = {}, money = null) {
  const Ty = DOC_TYPES[doc.type] || DOC_TYPES.quote;
  const t = docTotals(doc);
  const c = doc.client || {}, ev = doc.event || {};
  const rows = [], merges = [];
  const add = (cells, h) => { rows.push(h ? { cells, h } : cells); return rows.length; };
  const kv = (lk, lv, rk, rv, rNum) => {
    const r = add([T(lk, 'keyLabel'), T(lv, 'keyVal'), T('', 'keyVal'), T('', 'keyVal'), null, T(rk, 'keyLabel'), rNum ? N(rv, 'keyVal') : T(rv, 'keyVal'), T('', 'keyVal'), T('', 'keyVal')]);
    merges.push('B' + r + ':D' + r, 'G' + r + ':I' + r);
  };

  add([T(Ty.title, 'title')], 36); merges.push('A1:I1');
  add([T(Ty.en + (doc.showNo ? '   ·   ' + docNo(doc) : ''), 'sub')]); merges.push('A2:I2');
  add([]);
  // 왼쪽: 받는 곳 · 행사 / 오른쪽: 날짜 · 공급자
  const right = [['발행일', dateKo(doc.date)]];
  if (doc.type === 'quote') right.push(['유효기간', dateKo(validUntil(doc)) + '까지']);
  if (doc.type === 'inv' && doc.dueDate) right.push(['입금 기한', dateKo(doc.dueDate) + '까지']);
  if (doc.type === 'stmt') right.push(['거래일자', dateKo(doc.tradeDate || doc.date)]);
  if (doc.type === 'rcpt') right.push(['받은 날짜', dateKo(doc.paidDate || doc.date)]);
  right.push(['공급자 상호', oneLine(me.name)], ['등록번호', me.bizNo || ''], ['대표', me.ceo || ''], ['주소', me.addr || ''], ['전화', me.tel || '']);
  const left = [['받는 곳', (c.name || '') + (c.name ? ' 귀하' : '')], ['담당자', c.person || ''], ['연락처', c.tel || '']];
  if (ev.name) left.push(['행사명', ev.name]);
  if (ev.date) left.push(['행사 일정', ev.date]);
  if (ev.place) left.push(['행사 장소', ev.place]);
  if (doc.type === 'rcpt') left.push(['결제 방법', doc.payMethod || '']);
  const n = Math.max(left.length, right.length);
  for (let i = 0; i < n; i++) kv((left[i] || [])[0] || '', (left[i] || [])[1] || '', (right[i] || [])[0] || '', (right[i] || [])[1] || '');
  add([]);

  // 합계금액 줄 (총 합계 칸을 가리키는 수식은 아래에서 채운다)
  const sumRow = add([T('합계금액 (부가세 포함)', 'totalLabel'), T('', 'totalLabel'), T('일금 ' + hangul(t.total) + ' 원정', 'totalLabel'), T('', 'totalLabel'), T('', 'totalLabel'), T('', 'totalLabel'), null, T('', 'totalLabel'), T('', 'totalLabel')], 24);
  merges.push('A' + sumRow + ':B' + sumRow, 'C' + sumRow + ':F' + sumRow, 'G' + sumRow + ':I' + sumRow);
  add([]);

  add(['NO', '품목', '규격', '일수', '수량', '단가', '공급가액', '세액', '비고'].map((h) => T(h, 'head')), 22);
  const first = rows.length + 1;
  const cols = { days: 'D', qty: 'E', price: 'F', supply: 'G', tax: 'H' };
  (doc.lines || []).forEach((l, i) => {
    const r = rows.length + 1;
    const f = lineFormulas(l, doc.vat, cols, r);
    add([Q(i + 1), T(l.name + (l.taxFree && doc.vat !== 'none' ? ' (면세)' : '')), T(l.spec, 'center'), Q(l.days), Q(l.qty), N(l.price), f.supply, f.tax, T(l.memo)]);
  });
  const last = rows.length;
  let adjRow = 0;
  if (t.adjust) {
    adjRow = add([T('-', 'center'), T('끝자리 정리 (최종 합의금액 ₩' + t.total.toLocaleString('ko-KR') + ' 기준)'), T(''), T(''), T(''), T(''), N(t.adjust.supply, 'numB'), N(t.adjust.tax), T('')]);
    merges.push('B' + adjRow + ':F' + adjRow);
  }
  const has = last >= first;
  const sumOf = (col) => (has ? 'SUM(' + col + first + ':' + col + last + ')' : '0') + (adjRow ? '+' + col + adjRow : '');
  add([]);

  const tot = (label, cell, style = 'num') => { const r = add([null, null, null, null, T(label, style === 'totalNum' ? 'totalLabel' : 'keyLabel'), T('', style === 'totalNum' ? 'totalLabel' : 'keyLabel'), cell, T('', style), T('', style)]); merges.push('E' + r + ':F' + r, 'G' + r + ':I' + r); return r; };
  const rS = tot('공급가액 합계', { f: sumOf('G'), v: t.supply, s: 'keyNum' });
  const rT = tot(doc.vat === 'incl' ? '부가세 (포함 금액에서)' : doc.vat === 'none' ? '부가세 (없음)' : '부가세 합계', { f: sumOf('H'), v: t.tax, s: 'keyNum' });
  const rG = tot('총 합계 (부가세 포함)', { f: 'G' + rS + '+G' + rT, v: t.total, s: 'totalNum' }, 'totalNum');
  rows[sumRow - 1].cells[6] = { f: 'G' + rG, v: t.total, s: 'totalNum' };
  if (doc.type === 'inv') {
    const got = money && money.linked ? money.received : 0;
    if (got) {
      const rr = tot('이미 받은 금액', N(got, 'keyNum'));
      tot('이번에 청구하는 금액', { f: 'G' + rG + '-G' + rr, v: t.total - got, s: 'totalNum' }, 'totalNum');
    } else tot('이번에 청구하는 금액', { f: 'G' + rG, v: t.total, s: 'totalNum' }, 'totalNum');
  } else if (doc.type === 'stmt' && money && money.linked) {
    const rr = tot('받은 금액', N(money.received, 'keyNum'));
    tot('남은 금액', { f: 'G' + rG + '-G' + rr, v: t.total - money.received, s: 'totalNum' }, 'totalNum');
  } else if (doc.type === 'quote' && t.deposit) {
    const rd = tot('예상 선금', N(t.deposit, 'keyNum'));
    tot('잔금', { f: 'G' + rG + '-G' + rd, v: t.balance, s: 'totalNum' }, 'totalNum');
  }

  const notes = notesList(doc, me);
  if (notes.length) {
    add([]);
    add([T('특이사항', 'label')]);
    for (const x of notes) { const r = add([T('· ' + x.text, 'wrap')]); merges.push('A' + r + ':I' + r); }
  }
  if (doc.type === 'inv') {
    add([]);
    const acct = [me.bankName, me.bankNo].filter(Boolean).join(' ');
    const r = add([T('입금 계좌', 'keyLabel'), T(acct + (me.holder ? '  (예금주 ' + me.holder + ')' : ''), 'keyVal'), T('', 'keyVal'), T('', 'keyVal'), T('', 'keyVal'), T('', 'keyVal'), T('', 'keyVal'), T('', 'keyVal'), T('', 'keyVal')]);
    merges.push('B' + r + ':I' + r);
  }
  if (doc.type === 'rcpt') { add([]); const r = add([T('위 금액을 정히 영수합니다.', 'label')]); merges.push('A' + r + ':I' + r); }

  return { name: Ty.label.replace('ㆍ', '·'), cols: [6, 26, 14, 7, 7, 12, 14, 12, 16], rows, merges, grid: false };
}

/* ── 발행 목록: 문서마다 한 줄 + 품목마다 한 줄 ── */
export function listSheets(docs) {
  const head = (a) => a.map((h) => T(h, 'head'));
  const r1 = [{ cells: head(['날짜', '종류', '문서번호', '받는 곳', '담당자', '행사명', '진행 상태', '공급가액', '세액', '합계']), h: 22 }];
  for (const d of docs) {
    const t = docTotals(d), r = r1.length + 1;
    r1.push([T(d.date, 'center'), T(DOC_TYPES[d.type].label, 'center'), T(docNo(d), 'center'), T(d.client && d.client.name), T(d.client && d.client.person), T(d.event && d.event.name),
      T(DOC_STATUS[d.status] || '', 'center'), N(t.supply), N(t.tax), { f: 'H' + r + '+I' + r, v: t.total, s: 'numB' }]);
  }
  const n1 = r1.length;
  r1.push([T('합계 (' + docs.length + '건)', 'totalLabel'), T('', 'totalLabel'), T('', 'totalLabel'), T('', 'totalLabel'), T('', 'totalLabel'), T('', 'totalLabel'), T('', 'totalLabel'),
    ...['H', 'I', 'J'].map((c) => ({ f: n1 > 1 ? 'SUM(' + c + '2:' + c + n1 + ')' : '0', v: docs.reduce((s, d) => { const t = docTotals(d); return s + (c === 'H' ? t.supply : c === 'I' ? t.tax : t.total); }, 0), s: 'totalNum' }))]);

  const r2 = [{ cells: head(['날짜', '문서번호', '받는 곳', '행사명', '품목', '규격', '일수', '수량', '단가', '공급가액', '세액', '비고']), h: 22 }];
  const cols = { days: 'G', qty: 'H', price: 'I', supply: 'J', tax: 'K' };
  for (const d of docs) {
    const t = docTotals(d);
    for (const l of d.lines || []) {
      const r = r2.length + 1, f = lineFormulas(l, d.vat, cols, r);
      r2.push([T(d.date, 'center'), T(docNo(d), 'center'), T(d.client && d.client.name), T(d.event && d.event.name), T(l.name + (l.taxFree && d.vat !== 'none' ? ' (면세)' : '')), T(l.spec, 'center'), Q(l.days), Q(l.qty), N(l.price), f.supply, f.tax, T(l.memo)]);
    }
    if (t.adjust) r2.push([T(d.date, 'center'), T(docNo(d), 'center'), T(d.client && d.client.name), T(d.event && d.event.name), T('끝자리 정리'), T(''), T(''), T(''), T(''), N(t.adjust.supply, 'numB'), N(t.adjust.tax), T('최종 합의금액 기준')]);
  }
  return [
    { name: '발행 목록', cols: [11, 11, 14, 20, 10, 22, 9, 13, 11, 13], rows: r1, freeze: 'A2', landscape: true },
    { name: '품목별 내역', cols: [11, 14, 18, 18, 22, 12, 6, 6, 11, 12, 10, 16], rows: r2, freeze: 'A2', landscape: true }
  ];
}

/* ── 거래처 ── */
export function clientsSheet(clients) {
  const rows = [{ cells: ['상호', '담당자', '연락처', '이메일', '사업자등록번호', '주소', '메모'].map((h) => T(h, 'head')), h: 22 }];
  for (const c of [...clients].sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'))) rows.push([T(c.name), T(c.person), T(c.tel, 'center'), T(c.email), T(c.bizNo, 'center'), T(c.addr), T(c.memo)]);
  return { name: '거래처', cols: [22, 10, 15, 24, 15, 34, 22], rows, freeze: 'A2', landscape: true };
}

/* ── 품목 · 세트 ── */
export function itemsSheets(items, sets = []) {
  const NOC = '분류 없음';
  const rows = [{ cells: ['분류', '품목', '규격', '기본 일수', '기본 단가', '면세', '비고'].map((h) => T(h, 'head')), h: 22 }];
  const sorted = [...items].sort((a, b) => String(a.cat || '').localeCompare(String(b.cat || ''), 'ko') || String(a.name).localeCompare(String(b.name), 'ko'));
  for (const it of sorted) rows.push([T((it.cat || '').trim() || NOC, 'center'), T(it.name), T(it.spec, 'center'), Q(it.days == null ? 1 : it.days), N(it.price), T(it.taxFree ? '면세' : '', 'center'), T(it.memo)]);
  const out = [{ name: '품목', cols: [12, 26, 16, 9, 13, 7, 24], rows, freeze: 'A2' }];
  if (sets.length) {
    const r2 = [{ cells: ['세트', '품목', '규격', '일수', '수량', '단가', '금액'].map((h) => T(h, 'head')), h: 22 }];
    for (const s of sets) for (const line of expandSet(s, items)) {
      const r = r2.length + 1;
      r2.push([T(s.name), T(line.name), T(line.spec, 'center'), Q(line.days), Q(line.qty), N(line.price), { f: 'INT(D' + r + '*E' + r + '*F' + r + '+0.000001)', v: lineAmount(line), s: 'numB' }]);
    }
    out.push({ name: '세트', cols: [20, 26, 16, 7, 7, 13, 14], rows: r2, freeze: 'A2' });
  }
  return out;
}

export { colName };
