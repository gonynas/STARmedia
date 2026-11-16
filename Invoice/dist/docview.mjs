// A4 문서 그리기 (미리보기와 인쇄 · PDF가 똑같은 그림을 쓴다) — 시안 A 블루 모던
// 견적서 · 납품ㆍ청구서(입금 기한 · 입금 계좌 상자 · 이번에 청구하는 금액) · 거래명세서(A4에 2부 또는 1부) · 영수증(무효 표시)
// money: 행사에 묶인 문서면 { linked, received, remaining, valid } — 받은 금액 · 남은 금액은 이 행사 것만 보여 준다
import { DOC_TYPES, docNo, docTotals, dateKo, validUntil, notesList, paginate, pageCapacity, pageLimits } from './core/docs.mjs?v=mwj79qfo';
import { lineTax } from './core/money.mjs?v=mwj79qfo';
import { hangul } from './core/money.mjs?v=mwj79qfo';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
export const won = (n) => { n = Math.round(Number(n) || 0); return (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('ko-KR'); };
const num = (n) => { const v = Number(n) || 0; return Number.isInteger(v) ? v.toLocaleString('ko-KR') : String(v); };

function metaRow(k, v) { return '<div><span>' + k + '</span><b>' + v + '</b></div>'; }

function head(doc) {
  const T = DOC_TYPES[doc.type];
  let m = '';
  if (doc.showNo) m += metaRow('문서번호', esc(docNo(doc)));
  m += metaRow('발행일', dateKo(doc.date));
  if (doc.type === 'quote') m += metaRow('유효기간', dateKo(validUntil(doc)) + '까지');
  if (doc.type === 'inv' && doc.dueDate) m += metaRow('입금 기한', dateKo(doc.dueDate) + '까지');
  return '<header class="d-head"><div class="d-title"><span class="en">' + T.en + '</span><h1>' + T.title + '</h1></div><div class="d-meta">' + m + '</div></header>';
}
function contHead(doc, i, n) {
  const T = DOC_TYPES[doc.type];
  return '<header class="d-head d-cont"><div class="d-title"><h1>' + T.title + '</h1><span class="cont">(계속 · ' + (i + 1) + '/' + n + '쪽)</span></div>' +
    '<div class="d-meta">' + (doc.showNo ? metaRow('문서번호', esc(docNo(doc))) : '') + metaRow('받는 곳', esc(doc.client.name || '-')) + '</div></header>';
}

export function stampImg(me, cls = 'stamp') {
  if (!me.stamp) return '';
  const s = Math.max(30, Math.min(90, Number(me.stampSize) || 54));
  return '<img class="' + cls + '" src="' + me.stamp + '" alt="" style="width:' + s + 'px;height:' + s + 'px">';
}

function supplier(me) {
  const v = (x) => esc(x || '');
  return '<table class="d-from"><colgroup><col class="fv"><col class="fl"><col><col class="fl2"><col></colgroup><tbody>' +
    '<tr><th class="v" rowspan="5"><span>공급자</span></th><th>등록번호</th><td colspan="3" class="b num">' + v(me.bizNo) + '</td></tr>' +
    '<tr><th>상호</th><td class="b nm2">' + nl2br(me.name || '') + '</td><th>대표</th><td class="stamp-cell">' + v(me.ceo) + ' <span class="in">(인)</span>' + stampImg(me) + '</td></tr>' +
    '<tr><th>주소</th><td colspan="3">' + v(me.addr) + '</td></tr>' +
    '<tr><th>업태</th><td>' + v(me.bizType) + '</td><th>종목</th><td>' + v(me.bizItem) + '</td></tr>' +
    '<tr><th>전화</th><td class="num">' + v(me.tel) + '</td><th>팩스</th><td class="num">' + v(me.fax) + '</td></tr>' +
    '</tbody></table>';
}

function toBlock(doc) {
  const c = doc.client || {}, ev = doc.event || {};
  const sub = [c.person && esc(c.person) + ' 님', c.tel && '<span class="num">' + esc(c.tel) + '</span>'].filter(Boolean).join(' · ');
  const evRows = [['행사명', ev.name, true], ['행사 일정', ev.date], ['행사 장소', ev.place]].filter((r) => String(r[1] || '').trim());
  const evh = evRows.length ? '<dl class="d-event">' + evRows.map(([k, v, b]) => '<dt>' + k + '</dt><dd>' + (b ? '<b>' + esc(v) + '</b>' : esc(v)) + '</dd>').join('') + '</dl>' : '';
  return '<div class="d-to"><div class="d-label l-to">받는 곳</div>' +
    '<div class="d-to-name"><b>' + (c.name ? esc(c.name) : '<span class="ph">받는 곳</span>') + '</b><span>귀하</span></div>' +
    (sub ? '<div class="d-to-sub">' + sub + '</div>' : '') + evh +
    '<p class="d-greet">' + (doc.type === 'inv' ? '의뢰 받은 것에 대하여 아래와 같이 납품하고 청구하오니 검토 바랍니다.' : '의뢰 받은 것에 대하여 아래와 같이 견적하오니 검토 바랍니다.') + '</p></div>';
}

function sumBar(t) {
  return '<div class="d-sum"><span class="lbl">합계금액<small>' + '부가세 포함' + '</small></span><span class="han">일금 ' + hangul(t.total) + ' 원정</span><span class="amt num">₩' + won(t.total) + '</span></div>';
}

const COLS = '<colgroup><col class="w-no"><col><col class="w-spec"><col class="w-d"><col class="w-q"><col class="w-p"><col class="w-s"><col class="w-t"><col class="w-m"></colgroup>';
const THEAD = '<thead><tr><th>NO</th><th>품목</th><th>규격</th><th>일수</th><th>수량</th><th>단가</th><th>공급가액</th><th>세액</th><th>비고</th></tr></thead>';

function rows(doc, a, b, fillTo) {
  let h = '';
  for (let i = a; i < b; i++) {
    const l = doc.lines[i], r = lineTax(l, doc.vat);
    h += '<tr><td class="c">' + (i + 1) + '</td><td class="nm">' + esc(l.name) + (l.taxFree && doc.vat !== 'none' ? ' <small class="tfree">면세</small>' : '') + '</td><td class="c">' + esc(l.spec) + '</td>' +
      '<td class="c num">' + num(l.days) + '</td><td class="c num">' + num(l.qty) + '</td><td class="r num">' + won(l.price) + '</td>' +
      '<td class="r num b">' + won(r.supply) + '</td><td class="r num">' + won(r.tax) + '</td><td class="memo">' + esc(l.memo) + '</td></tr>';
  }
  for (let k = b - a; k < fillTo; k++) h += '<tr class="empty"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
  return h;
}

function pageSub(doc, a, b) {
  let s = 0, t = 0;
  for (let i = a; i < b; i++) { const r = lineTax(doc.lines[i], doc.vat); s += r.supply; t += r.tax; }
  return '<tr class="d-pagesub"><td colspan="6">이 쪽 소계 <small>— 다음 쪽에 이어집니다</small></td><td class="r num b">' + won(s) + '</td><td class="r num">' + won(t) + '</td><td></td></tr>';
}
function adjustRow(t) {
  const sg = (n) => (n > 0 ? '+' : '') + won(n);
  return '<tr class="d-adjust"><td class="c">-</td><td class="nm" colspan="5">끝자리 정리 <small>(최종 합의금액 ₩' + won(t.total) + ' 기준)</small></td><td class="r num b">' + sg(t.adjust.supply) + '</td><td class="r num">' + sg(t.adjust.tax) + '</td><td></td></tr>';
}

function totals(doc, t, money) {
  const vatLabel = doc.vat === 'incl' ? '부가세 <small>포함 금액에서</small>' : doc.vat === 'none' ? '부가세 <small>없음</small>' : '부가세 합계';
  let h = '<div class="d-totals">' +
    '<div class="tr"><span>공급가액 합계</span><b class="num">' + won(t.supply) + '</b></div>' +
    '<div class="tr"><span>' + vatLabel + '</span><b class="num">' + won(t.tax) + '</b></div>' +
    '<div class="tr grand"><span>총 합계<small>부가세 포함</small></span><b class="num">₩' + won(t.total) + '</b></div>';
  if (doc.type === 'inv') {
    const got = money && money.linked ? money.received : 0;
    if (got) h += '<div class="tr dep"><span>이미 받은 금액</span><b class="num">− ' + won(got) + '</b></div>';
    h += '<div class="tr bal"><span>이번에 청구하는 금액</span><b class="num">₩' + won(got ? money.remaining : t.total) + '</b></div>';
  } else if (t.deposit) {
    h += '<div class="tr dep"><span>예상 선금</span><b class="num">− ' + won(t.deposit) + '</b></div>' +
      '<div class="tr bal"><span>잔금</span><b class="num">₩' + won(t.balance) + '</b></div>';
  }
  return h + '</div>';
}
function notes(doc, me) {
  const list = notesList(doc, me);
  if (!list.length) return '<div class="d-notes empty-n"></div>';
  return '<div class="d-notes"><h4 class="d-label l-note">특이사항</h4><ol>' + list.map((x) => '<li>' + esc(x.text) + '</li>').join('') + '</ol></div>';
}

function bankBox(doc, me, t, money) {
  const amt = money && money.linked && money.received ? money.remaining : t.total;
  const acct = [me.bankName, me.bankNo].filter(Boolean).join(' ');
  return '<div class="d-bank"><span class="bk-lbl">입금 계좌</span><b class="num">' + (acct ? esc(acct) : '<span class="ph">내 정보에 계좌를 넣어 주세요</span>') + '</b>' + (me.holder ? '<span>예금주 ' + esc(me.holder) + '</span>' : '') +
    '<span class="bk-amt">입금하실 금액 <b class="num">₩' + won(amt) + '</b></span></div>';
}

/* ── 거래명세서: A4 한 장에 2부(공급받는자 · 공급자 보관용) 또는 1부 ── */
function stmtBlock(doc, me, t, money, a, b, cap, last, copy, mine, full) {
  const c = doc.client || {};
  let body = rows(doc, a, b, cap);
  let foot;
  if (last) {
    foot = (t.adjust ? adjustRow(t) : '') + '<tr class="s-total"><td colspan="6">계</td><td class="r num b">' + won(t.supply) + '</td><td class="r num b">' + won(t.tax) + '</td><td></td></tr>';
  } else foot = pageSub(doc, a, b).replace('— 다음 쪽에 이어집니다', '— 다음 장에 이어집니다');
  const got = money && money.linked ? money.received : 0;
  const left = money && money.linked ? money.remaining : t.total;
  return '<div class="half' + (mine ? ' mine' : '') + (full ? ' full' : '') + '">' +
    '<div class="s-top"><h2>거 래 명 세 서</h2><span class="s-copy">(' + copy + ')</span>' + (doc.showNo ? '<span class="s-no">' + esc(docNo(doc)) + '</span>' : '') + '</div>' +
    '<table class="s-par"><colgroup><col class="sv"><col class="sl"><col><col class="sv"><col class="sl"><col><col class="sl"><col></colgroup><tbody>' +
    '<tr><th class="v" rowspan="4"><span>공급받는자</span></th><th>상호</th><td class="b">' + esc(c.name) + ' 귀하</td>' +
    '<th class="v" rowspan="4"><span>공급자</span></th><th>등록번호</th><td colspan="3" class="b num">' + esc(me.bizNo) + '</td></tr>' +
    '<tr><th>담당자</th><td>' + esc(c.person) + '</td><th>상호</th><td class="nm2">' + nl2br(me.name || '') + '</td><th>대표</th><td class="stamp-cell">' + esc(me.ceo) + ' <span class="in">(인)</span>' + stampImg(me) + '</td></tr>' +
    '<tr><th>연락처</th><td class="num">' + esc(c.tel) + '</td><th>주소</th><td colspan="3">' + esc(me.addr) + '</td></tr>' +
    '<tr><th>거래일자</th><td>' + dateKo(doc.tradeDate || doc.date) + '</td><th>업태</th><td>' + esc(me.bizType) + '</td><th>종목</th><td>' + esc(me.bizItem) + '</td></tr>' +
    '</tbody></table>' +
    '<div class="s-sum"><span class="lbl">합계금액</span><b class="num">₩' + won(t.total) + '</b><em>일금 ' + hangul(t.total) + ' 원정 · 공급가액 ' + won(t.supply) + ' + 세액 ' + won(t.tax) + '</em></div>' +
    '<table class="d-items s-items">' + COLS + THEAD + '<tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table>' +
    (last ? '<table class="s-bal"><tbody><tr><th>이번 거래 합계</th><td class="num">' + won(t.total) + '</td><th>받은 금액</th><td class="num">' + won(got) + '</td><th>남은 금액</th><td class="num b">' + won(left) + '</td></tr></tbody></table>' : '') +
    '<div class="s-sign"><span>위 품목과 수량을 확인하고 받았습니다.</span><span class="s-recv">인수자<i></i>(인)</span></div>' +
    '</div>';
}
export const STMT_ROWS = { half: 8, full: 18 };
function renderStmt(doc, me, t, money) {
  const two = Number(doc.copies) !== 1;
  const per = (two ? STMT_ROWS.half : STMT_ROWS.full) - (t.adjust ? 1 : 0);
  const n = doc.lines.length, chunks = [];
  for (let a = 0; a < Math.max(n, 1); a += per) chunks.push([a, Math.min(n, a + per)]);
  return chunks.map(([a, b], i) => {
    const last = i === chunks.length - 1;
    const pno = chunks.length > 1 ? '<span class="s-pno">' + (i + 1) + ' / ' + chunks.length + '</span>' : '';
    const inner = two
      ? stmtBlock(doc, me, t, money, a, b, per, last, '공급받는자 보관용', false, false) + '<div class="cut"><span>✂ 자르는 선</span></div>' + stmtBlock(doc, me, t, money, a, b, per, last, '공급자 보관용', true, false)
      : stmtBlock(doc, me, t, money, a, b, per, last, '공급받는자 보관용', false, true);
    return '<div class="a4 doc doc--a k-stmt' + (two ? '' : ' one') + '">' + inner + pno + '</div>';
  });
}

/* ── 영수증 (완납 뒤) ── */
export const RCPT_ROWS = 14;
function renderRcpt(doc, me, t, money) {
  const c = doc.client || {}, ev = doc.event || {};
  const n = doc.lines.length, shown = Math.min(n, RCPT_ROWS);
  const more = n > shown ? '<tr class="d-pagesub"><td colspan="9">외 ' + (n - shown) + '개 품목 (위 금액에 포함)</td></tr>' : '';
  const foot = (t.adjust ? adjustRow(t) : '') + more;
  const voidMark = money && money.linked && money.valid === false ? '<div class="r-void" aria-label="무효">무 효<small>입금이 취소되어 완납이 아니에요</small></div>' : '';
  return ['<div class="a4 doc doc--a k-rcpt">' + head(doc) +
    '<section class="r-hero"><div class="r-lbl">받은 금액</div><div class="r-amt num">₩' + won(t.total) + '</div><div class="r-han">일금 ' + hangul(t.total) + ' 원정</div></section>' +
    '<dl class="r-info"><dt>받은 분</dt><dd><b>' + (c.name ? esc(c.name) : '<span class="ph">받는 곳</span>') + '</b> 귀하' + (c.person ? ' <small>' + esc(c.person) + ' 님</small>' : '') + '</dd>' +
    '<dt>받은 날짜</dt><dd>' + dateKo(doc.paidDate || doc.date) + '</dd>' +
    '<dt>결제 방법</dt><dd>' + esc(doc.payMethod || '') + '</dd>' +
    '<dt>관련 문서</dt><dd>' + esc([doc.baseLabel, ev.name].filter(Boolean).join(' · ') || '-') + '</dd></dl>' +
    '<table class="d-items r-items">' + COLS + THEAD + '<tbody>' + rows(doc, 0, shown, n ? 0 : 3) + '</tbody>' + (foot ? '<tfoot>' + foot + '</tfoot>' : '') + '</table>' +
    '<p class="r-state">위 금액을 정히 영수합니다.</p>' +
    '<div class="r-sign"><div class="r-date">' + dateKo(doc.date) + '</div>' + supplier(me) + '</div>' + voidMark +
    '<footer class="d-foot"><img src="assets/starmedia-logo.png" alt=""></footer></div>'];
}

/** 문서 → A4 쪽 HTML 배열 */
export function renderPages(doc, me, money = null) {
  const t = docTotals(doc);
  if (doc.type === 'stmt') return renderStmt(doc, me, t, money);
  if (doc.type === 'rcpt') return renderRcpt(doc, me, t, money);
  const n = doc.lines.length;
  const lim = pageLimits(notesList(doc, me).length + (doc.type === 'inv' ? 3 : 0), !!t.adjust);
  const pages = paginate(n, lim);
  const cls = 'a4 doc doc--a k-' + doc.type;
  return pages.map(([a, b], i) => {
    const last = i === pages.length - 1;
    const fill = doc.fillRows ? pageCapacity(i, pages.length, lim) : (n === 0 ? 3 : 0);
    let h = i === 0 ? head(doc) + '<section class="d-parties">' + toBlock(doc) + '<div class="d-fromwrap"><div class="d-label l-from">보내는 곳</div>' + supplier(me) + '</div></section>' + sumBar(t)
      : contHead(doc, i, pages.length);
    let foot = '';
    if (!last) foot = pageSub(doc, a, b);
    else if (t.adjust) foot = adjustRow(t);
    h += '<table class="d-items">' + COLS + THEAD + '<tbody>' + rows(doc, a, b, fill) + '</tbody>' + (foot ? '<tfoot>' + foot + '</tfoot>' : '') + '</table>';
    if (last) h += '<section class="d-bottom">' + notes(doc, me) + totals(doc, t, money) + '</section>' + (doc.type === 'inv' ? bankBox(doc, me, t, money) : '');
    h += '<footer class="d-foot">' + (last ? '<img src="assets/starmedia-logo.png" alt="">' : '') + (pages.length > 1 ? '<span class="d-pno">' + (i + 1) + ' / ' + pages.length + '</span>' : '') + '</footer>';
    return '<div class="' + cls + '">' + h + '</div>';
  });
}

/** PDF로 저장할 때 브라우저가 쓰는 파일 이름 (문서 제목) */
export function fileTitle(doc) {
  const name = String(doc.client && doc.client.name || '').replace(/[\\/:*?"<>|\s]+/g, '');
  return [DOC_TYPES[doc.type].label.replace('ㆍ', ''), name, doc.serial + (doc.version > 1 ? '-' + doc.version : '')].filter(Boolean).join('_');
}
