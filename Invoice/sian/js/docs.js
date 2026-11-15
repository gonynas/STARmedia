// A4 문서 그리기. theme: a(블루 모던) / b(트리컬러) / c(네이비 & 골드)
var DOC_TITLE = {
  quote: ['견 적 서', 'QUOTATION'],
  inv: ['납품ㆍ청구서', 'DELIVERY & INVOICE'],
  rcpt: ['영 수 증', 'RECEIPT'],
  stmt: ['거 래 명 세 서', 'TRANSACTION STATEMENT']
};

function docNo(doc, kind) { return TYPES[kind].short + ' ' + doc.serial; }

function metaRow(k, v) { return '<div><span>' + k + '</span><b>' + v + '</b></div>'; }

function dHead(doc, kind) {
  var T = DOC_TITLE[kind], m = '';
  if (doc.showNo) m += metaRow('문서번호', docNo(doc, kind));
  m += metaRow('발행일', Calc.date(kind === 'rcpt' ? doc.paidDate : doc.date));
  if (kind === 'quote') m += metaRow('유효기간', Calc.date(Calc.addDays(doc.date, doc.valid)) + '까지');
  if (kind === 'inv') m += metaRow('입금 기한', Calc.date(doc.due) + '까지');
  return '<header class="d-head"><div class="d-title"><span class="en">' + T[1] + '</span><h1>' + T[0] + '</h1></div><div class="d-meta">' + m + '</div><i class="d-slant" aria-hidden="true"></i></header>';
}

function supplierTable(stamp) {
  return '<table class="d-from"><colgroup><col class="fv"><col class="fl"><col><col class="fl2"><col></colgroup><tbody>' +
    '<tr><th class="v" rowspan="5"><span>공급자</span></th><th>등록번호</th><td colspan="3" class="b num">' + ME.bizNo + '</td></tr>' +
    '<tr><th>상호</th><td class="b nm2">' + nl2br(ME.name) + '</td><th>대표</th><td class="stamp-cell">' + ME.ceo + ' <span class="in">(인)</span>' + (stamp ? '<img class="stamp" src="assets/stamp-sample.svg" alt="">' : '') + '</td></tr>' +
    '<tr><th>주소</th><td colspan="3">' + ME.addr + '</td></tr>' +
    '<tr><th>업태</th><td>' + ME.bizType + '</td><th>종목</th><td>' + ME.bizItem + '</td></tr>' +
    '<tr><th>전화</th><td class="num">' + ME.tel + '</td><th>팩스</th><td class="num">' + ME.fax + '</td></tr>' +
    '</tbody></table>';
}

function toBlock(doc, kind) {
  var ev = doc.event, evh = '';
  if (ev && ev.name) {
    evh = '<dl class="d-event"><dt>행사명</dt><dd><b>' + esc(ev.name) + '</b></dd><dt>행사 일정</dt><dd>' + esc(ev.date) + '</dd><dt>행사 장소</dt><dd>' + esc(ev.place) + '</dd></dl>';
  }
  var greet = {
    quote: '의뢰 받은 것에 대하여 아래와 같이 견적하오니 검토 바랍니다.',
    inv: '의뢰 받은 것에 대하여 아래와 같이 납품하고 청구하오니 검토 바랍니다.'
  }[kind];
  return '<div class="d-to"><div class="d-label l-to">받는 곳</div>' +
    '<div class="d-to-name"><b>' + esc(doc.client.name) + '</b><span>귀하</span></div>' +
    '<div class="d-to-sub">' + esc(doc.client.person) + ' · <span class="num">' + esc(doc.client.tel) + '</span></div>' +
    evh + (greet ? '<p class="d-greet">' + greet + '</p>' : '') + '</div>';
}

function sumBar(t) {
  return '<div class="d-sum"><span class="lbl">합계금액<small>VAT 포함</small></span><span class="han">일금 ' + Calc.hangul(t.total) + ' 원정</span><span class="amt num">₩' + Calc.won(t.total) + '</span></div>';
}

function itemRows(doc, minRows, start) {
  var h = doc.lines.map(function (l, i) {
    var r = Calc.line(l, doc.vat);
    return '<tr><td class="c">' + ((start || 0) + i + 1) + '</td><td class="nm">' + esc(l.name) + '</td><td class="c">' + esc(l.spec) + '</td>' +
      '<td class="c num">' + Calc.num(l.days) + '</td><td class="c num">' + Calc.num(l.qty) + '</td><td class="r num">' + Calc.won(l.price) + '</td>' +
      '<td class="r num b">' + Calc.won(r.supply) + '</td><td class="r num">' + Calc.won(r.tax) + '</td><td class="memo">' + esc(l.memo) + '</td></tr>';
  }).join('');
  for (var k = doc.lines.length; k < (minRows || 0); k++) h += '<tr class="empty"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
  return h;
}

function itemsTable(doc, opt) {
  opt = opt || {};
  return '<table class="d-items' + (opt.cls ? ' ' + opt.cls : '') + '"><colgroup><col class="w-no"><col><col class="w-spec"><col class="w-d"><col class="w-q"><col class="w-p"><col class="w-s"><col class="w-t"><col class="w-m"></colgroup>' +
    '<thead><tr><th>NO</th><th>품목</th><th>규격</th><th>일수</th><th>수량</th><th>단가</th><th>공급가액</th><th>세액</th><th>비고</th></tr></thead>' +
    '<tbody>' + itemRows(doc, opt.minRows) + '</tbody>' + (opt.foot || '') + '</table>';
}

function totalsBlock(doc, kind, t) {
  var vatLabel = doc.vat === 'incl' ? '부가세 (포함 금액에서)' : doc.vat === 'none' ? '부가세 (없음)' : '부가세 합계';
  var h = '<div class="d-totals">' +
    '<div class="tr"><span>공급가액 합계</span><b class="num">' + Calc.won(t.supply) + '</b></div>' +
    '<div class="tr"><span>' + vatLabel + '</span><b class="num">' + Calc.won(t.tax) + '</b></div>' +
    '<div class="tr grand"><span>총 합계<small>VAT 포함</small></span><b class="num">₩' + Calc.won(t.total) + '</b></div>';
  if (t.deposit) {
    h += '<div class="tr dep"><span>선금 <small>' + Calc.md(doc.depositDate) + ' 입금</small></span><b class="num">− ' + Calc.won(t.deposit) + '</b></div>' +
      '<div class="tr bal"><span>' + (kind === 'inv' ? '이번에 청구하는 금액' : '잔금') + '</span><b class="num">₩' + Calc.won(t.balance) + '</b></div>';
  }
  return h + '</div>';
}

function notesBlock(doc, kind) {
  var items = [];
  if (kind === 'quote') items.push('견적 유효기간은 발행일로부터 <b>' + doc.valid + '일</b>입니다. (' + Calc.date(Calc.addDays(doc.date, doc.valid)) + '까지)');
  if (kind === 'quote') items.push('결제 계좌 : ' + ME.bank + ' (예금주 ' + ME.holder + ')');
  if (kind === 'inv') items.push('입금 기한은 <b>' + Calc.date(doc.due) + '</b>까지입니다.');
  items = items.concat(doc.notes.map(esc));
  return '<div class="d-notes"><h4 class="d-label l-note">특이사항</h4><ol>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol></div>';
}

function bankBox(t) {
  return '<div class="d-bank"><span class="bk-lbl">입금 계좌</span><b class="num">' + ME.bank + '</b><span>예금주 ' + ME.holder + '</span><span class="bk-amt">입금하실 금액 <b class="num">₩' + Calc.won(t.balance) + '</b></span></div>';
}

function footLogo() {
  return '<footer class="d-foot"><img src="assets/starmedia-logo.png" alt="스타미디어 기획사"></footer>';
}

function receiptBody(doc, t) {
  return '<section class="r-hero"><div class="r-lbl">받은 금액</div><div class="r-amt num">₩' + Calc.won(t.total) + '</div><div class="r-han">일금 ' + Calc.hangul(t.total) + ' 원정</div></section>' +
    '<dl class="r-info">' +
    '<dt>받은 분</dt><dd><b>' + esc(doc.client.name) + '</b> 귀하</dd>' +
    '<dt>받은 날짜</dt><dd>' + Calc.date(doc.paidDate) + '</dd>' +
    '<dt>결제 방법</dt><dd>' + doc.payMethod + (t.deposit ? ' <small>선금 ' + Calc.won(t.deposit) + '원 + 잔금 ' + Calc.won(t.balance) + '원</small>' : '') + '</dd>' +
    '<dt>관련 문서</dt><dd>' + docNo(doc, 'quote') + ' · ' + esc(doc.event.name) + '</dd>' +
    '</dl>' +
    itemsTable(doc, { cls: 'r-items' }) +
    '<p class="r-state">위 금액을 정히 영수합니다.</p>' +
    '<div class="r-sign"><div class="r-date">' + Calc.date(doc.paidDate) + '</div>' + supplierTable(true) + '</div>';
}

function stmtHalf(doc, t, copy, mine) {
  var foot = '<tfoot><tr class="s-total"><td colspan="6">계</td><td class="r num b">' + Calc.won(t.supply) + '</td><td class="r num b">' + Calc.won(t.tax) + '</td><td></td></tr></tfoot>';
  return '<div class="half' + (mine ? ' mine' : '') + '">' +
    '<div class="s-top"><h2>' + DOC_TITLE.stmt[0] + '</h2><span class="s-copy">(' + copy + ')</span>' + (doc.showNo ? '<span class="s-no">' + docNo(doc, 'stmt') + '</span>' : '') + '</div>' +
    '<table class="s-par"><colgroup><col class="sv"><col class="sl"><col><col class="sv"><col class="sl"><col><col class="sl"><col></colgroup><tbody>' +
    '<tr><th class="v" rowspan="4"><span>공급받는자</span></th><th>상호</th><td class="b">' + esc(doc.client.name) + '</td>' +
    '<th class="v" rowspan="4"><span>공급자</span></th><th>등록번호</th><td colspan="3" class="b num">' + ME.bizNo + '</td></tr>' +
    '<tr><th>담당자</th><td>' + esc(doc.client.person) + '</td><th>상호</th><td class="nm2">' + nl2br(ME.name) + '</td><th>대표</th><td class="stamp-cell">' + ME.ceo + ' <span class="in">(인)</span><img class="stamp" src="assets/stamp-sample.svg" alt=""></td></tr>' +
    '<tr><th>연락처</th><td class="num">' + esc(doc.client.tel) + '</td><th>주소</th><td colspan="3">' + ME.addr + '</td></tr>' +
    '<tr><th>거래일자</th><td>' + Calc.date(doc.stmtDate) + '</td><th>업태</th><td>' + ME.bizType + '</td><th>종목</th><td>' + ME.bizItem + '</td></tr>' +
    '</tbody></table>' +
    '<div class="s-sum"><span class="lbl">합계금액</span><b class="num">₩' + Calc.won(t.total) + '</b><em>공급가액 ' + Calc.won(t.supply) + ' + 세액 ' + Calc.won(t.tax) + '</em></div>' +
    itemsTable(doc, { cls: 's-items', minRows: 8, foot: foot }) +
    '<table class="s-bal"><tbody><tr><th>전잔액</th><td class="num">0</td><th>금일 합계</th><td class="num">' + Calc.won(t.total) + '</td><th>입금액</th><td class="num">' + Calc.won(t.deposit) + '</td><th>잔액</th><td class="num b">' + Calc.won(t.balance) + '</td></tr></tbody></table>' +
    '<div class="s-sign"><span>위 품목과 수량을 확인하고 받았습니다.</span><span class="s-recv">인수자<i></i>(인)</span></div>' +
    '</div>';
}

function renderDoc(kind, theme, doc) {
  doc = doc || DOC;
  var t = Calc.totals(doc);
  var cls = 'a4 doc doc--' + theme + ' k-' + kind;
  if (kind === 'stmt') {
    return '<div class="' + cls + '">' + stmtHalf(doc, t, '공급받는자 보관용', false) + '<div class="cut"><span>✂ 자르는 선</span></div>' + stmtHalf(doc, t, '공급자 보관용', true) + '</div>';
  }
  var body = dHead(doc, kind);
  if (kind === 'rcpt') {
    body += receiptBody(doc, t);
  } else {
    body += '<section class="d-parties">' + toBlock(doc, kind) + '<div class="d-fromwrap"><div class="d-label l-from">보내는 곳</div>' + supplierTable(true) + '</div></section>';
    body += sumBar(t);
    body += itemsTable(doc, { minRows: doc.fill ? 15 : 0 });
    body += '<section class="d-bottom">' + notesBlock(doc, kind) + totalsBlock(doc, kind, t) + '</section>';
    if (kind === 'inv') body += bankBox(t);
  }
  body += footLogo();
  return '<div class="' + cls + '">' + body + '</div>';
}
