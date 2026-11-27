// 엑셀로 내보낼 표 만들기 — 문서 한 장 · 발행 목록 · 거래처 · 품목 (5단계)
// 금액 칸은 수식으로 넣고, 미리 계산한 값도 같이 넣는다(엑셀 없이 미리보기만 해도 금액이 보이게).
// 수식은 core/money.mjs 의 계산 규칙과 똑같다:
//   공급가액(별도 · 없음) = INT(일수 × 수량 × 단가 + 0.000001)          … 원 아래 버림 (P02)
//   세액(별도)          = INT(공급가액 × 0.1)                           … 원 아래 버림
//   포함               : 공급가액 = ROUND(줄 금액 ÷ 1.1, 0), 세액 = 줄 금액 − 공급가액
//   없음 · 면세 줄      : 세액 0
import { lineAmount, lineTax, hangul } from './money.mjs?v=mwybydwd';
import { DOC_TYPES, DOC_STATUS, docNo, docTotals, dateKo, validUntil, notesList } from './docs.mjs?v=mwybydwd';
import { colName } from './xlsx.mjs?v=mwybydwd';
import { expandSet } from './catalog.mjs?v=mwybydwd';

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
 * 문서 한 장 → 시트 (v1.11.0: 앱의 A4 문서와 같은 모양 — 파란 띠 · 큰 제목 · 받는 곳/보내는 곳 · 파란 합계 띠 · 표 · 특이사항/합계 · 맨 아래 로고)
 * money: 행사에 묶인 문서면 { linked, received, remaining } (미리보기와 같은 값)
 * pics: { logo: PNG 바이트, stamp: PNG 바이트 } — 있으면 그림으로 넣는다(없어도 된다)
 * 열: A NO · B 품목 · C 규격 · D 일수 · E 수량 · F 단가 · G 공급가액 · H 세액 · I 비고
 * 거래명세서(stmt)는 앱처럼 위 · 아래 2부(공급받는자 · 공급자 보관용, doc.copies === 1 이면 1부)
 */
export function docSheet(doc, me = {}, money = null, pics = {}) {
  const Ty = DOC_TYPES[doc.type] || DOC_TYPES.quote;
  const t = docTotals(doc);
  const c = doc.client || {}, ev = doc.event || {};
  const rows = [], merges = [], images = [];
  const add = (cells, h, hidden) => { const r = { cells }; if (h) r.h = h; if (hidden) r.hidden = true; rows.push(r); return rows.length; };
  const M = (a, b) => merges.push(a + ':' + b);
  const E = (s) => T('', s);
  const hideAdj = doc.showRound === false;
  const memoOn = doc.showMemo !== false;
  const cols = { days: 'D', qty: 'E', price: 'F', supply: 'G', tax: 'H' };
  const COLW = [8, 24, 12, 6, 6, 12, 13, 11, 14];
  const stamp = (row) => { if (pics.stamp) images.push({ name: 'stamp', data: pics.stamp, col: 8, row: row - 1, colOff: 52, rowOff: 0, w: 44, h: 44 }); };

  // 품목 표 (머리 · 줄 · 끝자리 정리). 끝나면 { first, last, adjRow }
  const itemTable = () => {
    add(['NO', '품목', '규격', '일수', '수량', '단가', '공급가액', '세액', memoOn ? '비고' : ''].map((h) => T(h, 'th')), 22);
    const first = rows.length + 1;
    (doc.lines || []).forEach((l, i) => {
      const r = rows.length + 1;
      const f = lineFormulas(l, doc.vat, cols, r);
      f.supply.s = 'tdNB'; f.tax.s = 'tdN';
      add([Q(i + 1, 'tdQ'), T(l.name + (l.taxFree && doc.vat !== 'none' ? ' (면세)' : ''), 'tdT'), T(l.spec, 'tdC'), Q(l.days, 'tdQ'), Q(l.qty, 'tdQ'), N(l.price, 'tdN'), f.supply, f.tax, T(memoOn ? l.memo : '', 'tdM')], 20);
    });
    const last = rows.length;
    let adjRow = 0;
    if (t.adjust) {
      // 숨김(showRound 꺼짐)이어도 줄은 남겨 둔다 → 합계 수식이 그대로 맞고, 엑셀에서 「숨기기 취소」로 볼 수 있다
      adjRow = add([T('-', 'adjC'), T('끝자리 정리 (최종 합의금액 ₩' + t.total.toLocaleString('ko-KR') + ' 기준)', 'adjT'), E('adjT'), E('adjT'), E('adjT'), E('adjT'), N(t.adjust.supply, 'adjN'), N(t.adjust.tax, 'adjN'), E('adjT')], 20, hideAdj);
      M('B' + adjRow, 'F' + adjRow);
    }
    return { first, last, adjRow };
  };
  const sumF = (col, tb) => (tb.last >= tb.first ? 'SUM(' + col + tb.first + ':' + col + tb.last + ')' : '0') + (tb.adjRow ? '+' + col + tb.adjRow : '');

  // 공급자 칸(오른쪽 E~I): E 세로 「공급자」, F 이름, G 값, H 이름, I 값
  const supplier = (startRow, list) => {
    list.forEach(([l1, v1, l2, v2], i) => {
      const r = startRow + i;
      const row = rows[r - 1].cells;
      row[4] = T(i === 0 ? '공\n급\n자' : '', 'supV'); row[5] = T(l1, 'supL'); row[6] = T(v1, 'supT');
      if (l1 === '상호' && String(v1).length > 9) rows[r - 1].h = 30;
      if (l2 !== undefined) { row[7] = T(l2, 'supL'); row[8] = T(v2, 'supT'); } else { row[7] = E('supT'); row[8] = E('supT'); M('G' + r, 'I' + r); }
    });
    M('E' + startRow, 'E' + (startRow + list.length - 1));
  };
  const supList = [['등록번호', me.bizNo || ''], ['상호', oneLine(me.name), '대표', me.ceo || ''], ['주소', me.addr || ''], ['업태', me.bizType || '', '종목', me.bizItem || ''], ['전화', me.tel || '', '팩스', me.fax || '']];

  if (doc.type === 'stmt') return stmtSheet();

  /* ── 견적서 · 청구서 · 영수증 ── */
  add([0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => E('barBlue')), 5);
  add([], 10);
  const meta = [];
  if (doc.showNo) meta.push(['문서번호', docNo(doc)]);
  meta.push(['발행일', dateKo(doc.date)]);
  if (doc.type === 'quote') meta.push(['유효기간', dateKo(validUntil(doc)) + '까지']);
  if (doc.type === 'inv' && doc.dueDate) meta.push(['입금 기한', dateKo(doc.dueDate) + '까지']);
  if (doc.type === 'rcpt') meta.push(['받은 날짜', dateKo(doc.paidDate || doc.date)]);
  const top = rows.length + 1;
  for (let i = 0; i < Math.max(3, meta.length); i++) {
    const m = meta[i];
    const cells = [null, null, null, null, null, null, m ? T(m[0], 'metaL') : null, m ? T(m[1], 'metaV') : null, m ? E('metaV') : null];
    const r = add(cells, 18); if (m) M('H' + r, 'I' + r);
  }
  rows[top - 1].cells[0] = T(Ty.en.split('').join(' '), 'eyebrow'); M('A' + top, 'D' + top);
  rows[top].cells[0] = T(Ty.title, 'bigTitle'); M('A' + (top + 1), 'D' + (top + 2));
  rows[top].h = 22; rows[top + 1].h = 22;
  add([0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => E('ruleNavy')), 6);
  add([], 10);
  // 받는 곳 · 보내는 곳
  const capR = add([T('받는 곳', 'blueCap'), null, null, null, T('보내는 곳', 'blueCap')], 16);
  const s0 = rows.length + 1;
  for (let i = 0; i < 5; i++) add([], 20);
  const L = (i, cell, style) => { rows[s0 - 1 + i].cells[0] = T(cell, style); };
  L(0, (c.name || '') + (c.name ? ' 귀하' : ''), 'clientName'); M('A' + s0, 'D' + s0); rows[s0 - 1].h = 22;
  L(1, [c.person ? c.person + ' 님' : '', c.tel].filter(Boolean).join(' · '), 'clientSub'); M('A' + (s0 + 1), 'D' + (s0 + 1));
  const evs = [['행사명', ev.name], ['일정', ev.date], ['장소', ev.place]].filter((x) => x[1]);
  if (doc.type === 'rcpt') evs.push(['결제', doc.payMethod || '']);
  evs.slice(0, 3).forEach(([k, v], i) => { const r = s0 + 2 + i; rows[r - 1].cells[0] = T(k, 'evL'); rows[r - 1].cells[1] = T(v, 'evV'); rows[r - 1].cells[2] = E('evV'); rows[r - 1].cells[3] = E('evV'); M('B' + r, 'D' + r); });
  supplier(s0, supList);
  stamp(s0 + 1);
  if (doc.type === 'quote' || doc.type === 'inv') {
    const r = add([T(doc.type === 'inv' ? '의뢰 받은 것에 대하여 아래와 같이 납품하고 청구하오니 검토 바랍니다.' : '의뢰 받은 것에 대하여 아래와 같이 견적하오니 검토 바랍니다.', 'intro')], 20); M('A' + r, 'D' + r);
  }
  void capR;
  add([], 10);
  // 파란 합계 띠
  const band = add([T('합계금액 (부가세 포함)', 'bandL'), E('bandL'), T('일금 ' + hangul(t.total) + ' 원정', 'bandC'), E('bandC'), E('bandC'), E('bandC'), null, E('bandN'), E('bandN')], 34);
  M('A' + band, 'B' + band); M('C' + band, 'F' + band); M('G' + band, 'I' + band);
  add([], 8);
  const tb = itemTable();
  add([], 10);

  // 특이사항(왼쪽 A~D) · 합계(오른쪽 E~I)
  const tots = [];
  const tot = (label, cell, grand) => tots.push({ label, cell, grand });
  tot('공급가액 합계', { f: sumF('G', tb), v: t.supply, s: 'totN' });
  tot(doc.vat === 'incl' ? '부가세 (포함 금액에서)' : doc.vat === 'none' ? '부가세 (없음)' : '부가세 합계', { f: sumF('H', tb), v: t.tax, s: 'totN' });
  tot('총 합계 (부가세 포함)', 'GRAND', true);
  const notes = notesList(doc, me);
  const noteRows = notes.length ? [T('특이사항', 'noteT'), ...notes.map((x, i) => T((i + 1) + '. ' + x.text, 'noteL'))] : [];
  const extra = [];
  if (doc.type === 'inv') {
    const got = money && money.linked ? money.received : 0;
    if (got) { extra.push(['이미 받은 금액', got, false]); extra.push(['이번에 청구하는 금액', -got, true]); } else extra.push(['이번에 청구하는 금액', 0, true]);
  } else if (doc.type === 'quote' && t.deposit) { extra.push(['예상 선금', t.deposit, false]); extra.push(['잔금', -t.deposit, true]); }
  const totRows = tots.length + extra.length;
  const n = Math.max(totRows, noteRows.length);
  const tStart = rows.length + 1;
  let rS = 0, rT = 0, rG = 0, rPrev = 0;
  for (let i = 0; i < n; i++) {
    const r = tStart + i;
    const cells = [noteRows[i] || null, null, null, null, null, null, null, null, null];
    if (noteRows[i]) M('A' + r, 'D' + r);
    if (i < tots.length) {
      const x = tots[i];
      if (x.grand) { rG = r; cells[4] = T(x.label, 'grandL'); cells[5] = E('grandL'); cells[6] = { f: 'G' + rS + '+G' + rT, v: t.total, s: 'grandN' }; cells[7] = E('grandN'); cells[8] = E('grandN'); }
      else { if (!rS) rS = r; else rT = r; cells[4] = T(x.label, 'totL'); cells[5] = E('totL'); cells[6] = x.cell; cells[7] = E('totN'); cells[8] = E('totN'); }
      M('E' + r, 'F' + r); M('G' + r, 'I' + r);
    } else if (i < totRows) {
      const [label, amt, grand] = extra[i - tots.length];
      if (grand) { cells[4] = T(label, 'grandL'); cells[5] = E('grandL'); cells[6] = rPrev ? { f: 'G' + rG + '-G' + rPrev, v: t.total + amt, s: 'grandN' } : { f: 'G' + rG, v: t.total, s: 'grandN' }; cells[7] = E('grandN'); cells[8] = E('grandN'); }
      else { rPrev = r; cells[4] = T(label, 'totL'); cells[5] = E('totL'); cells[6] = N(amt, 'totN'); cells[7] = E('totN'); cells[8] = E('totN'); }
      M('E' + r, 'F' + r); M('G' + r, 'I' + r);
    }
    const noteH = noteRows[i] && String(noteRows[i].v).length > 34 ? 32 : 0;
    add(cells, noteH || (i < tots.length && tots[i].grand) || (i >= tots.length && i < totRows && extra[i - tots.length][2]) ? 26 : 20);
  }
  rows[band - 1].cells[6] = { f: 'G' + rG, v: t.total, s: 'bandN' };
  if (doc.type === 'inv') {
    add([], 10);
    const acct = [me.bankName, me.bankNo].filter(Boolean).join(' ');
    const r = add([T('입금 계좌', 'supL'), E('supL'), T(acct + (me.holder ? '  (예금주 ' + me.holder + ')' : ''), 'supT'), E('supT'), E('supT'), E('supT'), E('supT'), E('supT'), E('supT')], 22);
    M('A' + r, 'B' + r); M('C' + r, 'I' + r);
  }
  if (doc.type === 'rcpt') { add([], 12); const r = add([T('위 금액을 정히 영수합니다.', 'rcptLine')], 24); M('A' + r, 'I' + r); }
  footerLogo(LOGO_AT);
  return { name: Ty.label.replace('ㆍ', '·'), cols: COLW, rows, merges, grid: false, onePage: true, center: true, margins: 0.4, images };

  // 남은 칸을 채워 로고를 A4 맨 아래쯤에 둔다 (줄 높이 합 = target pt)
  function footerLogo(target) {
    const used = rows.reduce((s, r) => s + (r.hidden ? 0 : (r.h || 18)), 0);
    let gap = Math.max(16, target - used - 30);
    while (gap > 0) { const h = Math.min(60, gap); add([], h); gap -= h; }
    const r = add([], 30);
    if (pics.logo) images.push({ name: 'logo', data: pics.logo, col: 3, row: r - 1, colOff: 25, rowOff: 2, w: 105, h: 35 });
  }

  /* ── 거래명세서: 위 · 아래 2부 ── */
  function stmtSheet() {
    const two = Number(doc.copies) !== 1;
    const got = money && money.linked ? money.received : 0;
    const block = (tag, red) => {
      add([0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => E('barBlue')), 4);
      const tr = add([T(Ty.title, 'stTitle'), null, null, T('(' + tag + ')', red ? 'copyTagR' : 'copyTagB'), null, null, null, doc.showNo ? T(docNo(doc), 'metaL') : null, null], 32);
      M('A' + tr, 'C' + tr); M('D' + tr, 'F' + tr); if (doc.showNo) M('H' + tr, 'I' + tr);
      const s = rows.length + 1;
      const buyer = [['상호', (c.name || '') + (c.name ? ' 귀하' : '')], ['담당자', c.person || ''], ['연락처', c.tel || ''], ['거래일자', dateKo(doc.tradeDate || doc.date)]];
      buyer.forEach(([k, v]) => { const r = add([T(k, 'supL'), T(v, 'supT'), E('supT'), E('supT')], 20); M('B' + r, 'D' + r); });
      supplier(s, [['등록번호', me.bizNo || ''], ['상호', oneLine(me.name), '대표', me.ceo || ''], ['주소', me.addr || ''], ['업태', me.bizType || '', '종목', me.bizItem || '']]);
      stamp(s + 1);
      add([], 6);
      const band = add([T('합계금액', 'bandL'), E('bandL'), null, E('bandNL'), T('일금 ' + hangul(t.total) + ' 원정 · 공급가액 ' + won0(t.supply) + ' + 세액 ' + won0(t.tax), 'bandS'), E('bandS'), E('bandS'), E('bandS'), E('bandS')], 30);
      M('A' + band, 'B' + band); M('C' + band, 'D' + band); M('E' + band, 'I' + band);
      add([], 6);
      const tb = itemTable();
      const sr = add([T('계', 'sumL'), E('sumL'), E('sumL'), E('sumL'), E('sumL'), E('sumL'), { f: sumF('G', tb), v: t.supply, s: 'sumN' }, { f: sumF('H', tb), v: t.tax, s: 'sumN' }, E('sumL')], 22);
      M('A' + sr, 'F' + sr);
      rows[band - 1].cells[2] = { f: 'G' + sr + '+H' + sr, v: t.total, s: 'bandNL' };
      const mr = add([T('이번 거래 합계', 'mL'), E('mL'), { f: 'G' + sr + '+H' + sr, v: t.total, s: 'mN' }, E('mN'), T('받은 금액', 'mL'), E('mL'), N(got, 'mN'), T('남은 금액', 'mL'), { f: 'C' + (rows.length + 1) + '-G' + (rows.length + 1), v: t.total - got, s: 'mNBlue' }], 22);
      M('A' + mr, 'B' + mr); M('C' + mr, 'D' + mr); M('E' + mr, 'F' + mr);
      const cr = add([T('위 품목과 수량을 확인하고 받았습니다.', 'confirm'), E('confirm'), E('confirm'), E('confirm'), E('confirm'), E('confirm'), T('인수자', 'confirmR'), E('confirm'), T('(인)', 'confirmR')], 26);
      M('A' + cr, 'F' + cr);
    };
    block('공급받는자 보관용', false);
    if (two) {
      add([], 10);
      const r = add([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (i === 0 ? T('- - - - - - - - - -   ✂  자르는 선   - - - - - - - - - -', 'cut') : E('cut'))), 14); M('A' + r, 'I' + r);
      add([], 14);
      block('공급자 보관용', true);
    }
    if (!two) footerLogo(LOGO_AT);   // v1.11.2: 2부짜리는 로고 없음, 1부짜리는 견적서와 같은 맨 아래
    return { name: Ty.label, cols: COLW, rows, merges, grid: false, onePage: true, center: true, margins: 0.4, images };
  }
}
// 로고 줄이 A4 인쇄 영역 맨 아래에 오도록 그 위 줄 높이의 합(pt). 폭 106자 시트를 한 장에 맞출 때 기준
const LOGO_AT = 1010;
const won0 = (n) => Math.round(Number(n) || 0).toLocaleString('ko-KR');

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
