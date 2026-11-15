(function () {
"use strict";
/* icons.js */
// 선 아이콘 모음 (24x24, 직접 그린 단순 도형)
var ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14 M5 12h14',
  list: 'M9 6h12 M9 12h12 M9 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  layers: 'M12 2 2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  tent: 'M21 8 12 3 3 8v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8 M7.5 5.5l9 5',
  minus: 'M5 12h14',
  upload: 'M12 15V3 M7 8l5-5 5 5 M5 21h14',
  building: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16 M15 9h4a1 1 0 0 1 1 1v11 M3 21h18 M8 8h3 M8 12h3 M8 16h3',
  bank: 'M3 10 12 4l9 6 M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 21h18',
  chart: 'M3 3v18h18 M7 16v-4 M12 16V8 M17 16V5',
  calendar: 'M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M3 10h18 M8 3v4 M16 3v4',
  trash: 'M3 6h18 M8 6V4h8v2 M6 6l1 14h10l1-14 M10 11v6 M14 11v6',
  user: 'M20 21a8 8 0 0 0-16 0 M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  sliders: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4 M12 15v2',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
  print: 'M6 9V3h12v6 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v7H6z',
  download: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
  share: 'M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8 M16 6l-4-4-4 4 M12 2v13',
  chat: 'M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 5.9l-.7 3.6 4-2.6c.5.1 1 .1 1.5.1 5 0 9-3.1 9-7s-4-7-9-7z',
  mail: 'M3 6h18v12H3z M3 7l9 6 9-6',
  monitor: 'M3 4h18v12H3z M8 20h8 M12 16v4',
  phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M11 18h2',
  tablet: 'M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M11 18h2',
  grip: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
  down: 'M6 9l6 6 6-6',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 18l6-6-6-6',
  alert: 'M12 3 2 21h20z M12 10v4 M12 17h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  check: 'M20 6 9 17l-5-5',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z M9 8h6 M9 12h6 M9 16h4',
  truck: 'M2 6h12v10H2z M14 10h4l3 3v3h-7 M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  fileText: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M9 13h6 M9 17h6',
  clipboard: 'M9 3h6v3H9z M7 5H5v16h14V5h-2 M9 12h6 M9 16h6',
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  grid: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
  cloud: 'M7 18a5 5 0 0 1-.9-9.9A6 6 0 0 1 17.7 7 4.5 4.5 0 0 1 17.5 18z',
  x: 'M18 6 6 18 M6 6l12 12',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  type: 'M4 7V5h16v2 M9 19h6 M12 5v14',
  table: 'M3 4h18v16H3z M3 10h18 M3 15h18 M9 4v16',
  image: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 9.5h.01',
  pdf: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M8.5 16v-4h1.5a1.2 1.2 0 0 1 0 2.4H8.5 M13 12v4h1a2 2 0 0 0 0-4z',
  copy: 'M8 8h12v12H8z M4 16V4h12',
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  won: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M7.5 9l1.8 6.5L12 10l2.7 5.5L16.5 9 M7 12.2h10',
  tax: 'M9 14l6-6 M9.5 8.5h.01 M14.5 13.5h.01 M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z',
  google: 'M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5c-.2 1.2-.9 2.2-2 2.8v2.3h3.2C20 17.4 21 15 21 12.2z M12 21c2.6 0 4.8-.9 6.3-2.3L15 16.4c-.8.6-1.9.9-3 .9-2.4 0-4.4-1.6-5.1-3.7H3.5V16C5 19 8.3 21 12 21z M6.9 13.6a5.4 5.4 0 0 1 0-3.4V7.9H3.5a9 9 0 0 0 0 8.1z M12 6.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 3.5 7.9l3.4 2.6C7.6 8.3 9.6 6.6 12 6.6z',
  backspace: 'M21 5H8l-6 7 6 7h13z M12 9l6 6 M18 9l-6 6'
};

function ic(name, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICONS[name] || '') + '"/></svg>';
}

/* data.js */
// 시안용 예시 자료. 실제 사업자번호·계좌는 넣지 않는다(프로그램에서 처음 한 번 입력).
// 업체명(상호)은 엔터로 줄을 바꿔 2줄까지 쓸 수 있다.
var ME = {
  name: '스타미디어\n(STARmedia)', ceo: '이○○',
  bizNo: '123-45-67890', addr: '경상남도 ○○군 ○○읍 ○○대로 0000',
  bizType: '서비스업', bizItem: '이벤트 · 영상촬영 · 천막대여',
  tel: '055-000-0000', fax: '055-000-0001',
  bankName: '○○은행', bankNo: '000-00-000000', holder: '스타미디어',
  get bank() { return this.bankName + ' ' + this.bankNo; }
};

// 장비 관리: 가진 장비와 총 수량. outs = 날짜별(EQUIP_DAYS 순서)로 계약된 행사에 나가는 수량
var EQUIP = [
  { cat: '천막', name: '몽골텐트', spec: '5×5m', total: 20, outs: [8, 8, 4], price: 170000, memo: '흰색 12 · 파랑 8' },
  { cat: '천막', name: '몽골텐트', spec: '3×3m', total: 12, outs: [0, 0, 6], price: 90000, memo: '' },
  { cat: '천막', name: '천막', spec: '3×6m', total: 10, outs: [5, 5, 2], price: 30000, memo: '' },
  { cat: '천막', name: '가림막', spec: 'H 1.8m', total: 30, outs: [10, 10, 0], price: 20000, memo: '' },
  { cat: '테이블 · 의자', name: '테이블', spec: '1800×600', total: 60, outs: [20, 20, 30], price: 10000, memo: '' },
  { cat: '테이블 · 의자', name: '의자', spec: '접이식', total: 300, outs: [250, 250, 120], price: 1000, memo: '' },
  { cat: '냉난방', name: '난로', spec: '등유식', total: 6, outs: [4, 4, 8], price: 50000, memo: '등유 별도' },
  { cat: '냉난방', name: '대형 선풍기', spec: '산업용', total: 8, outs: [0, 0, 0], price: 40000, memo: '' },
  { cat: '전기 · 음향', name: '발전차', spec: '100kW', total: 1, outs: [1, 1, 0], price: 1000000, memo: '기사 포함' },
  { cat: '전기 · 음향', name: '음향 시스템', spec: '기본 세트', total: 2, outs: [0, 0, 1], price: 800000, memo: '' }
];
var EQUIP_CATS = ['천막', '테이블 · 의자', '냉난방', '전기 · 음향', '무대', '기타'];
var EQUIP_DAYS = [['11/21(토)', '가을 별빛축제'], ['11/22(일)', '가을 별빛축제 2일차'], ['11/28(토)', '신사옥 준공식']];

var DOC = {
  type: 'quote', serial: '261112-01', showNo: true,
  date: '2026-11-12', valid: 15, due: '2026-11-30', stmtDate: '2026-11-22',
  client: { name: '○○군 가을축제 추진위원회', person: '김민수 주무관', tel: '010-0000-1234' },
  event: { name: '2026 가을 별빛축제', date: '11월 21일(토) ~ 22일(일) · 2일', place: '○○공원 잔디광장' },
  vat: 'excl',
  depositOn: false, deposit: 1000000, depositDate: '2026-11-14',
  paidDate: '2026-11-28', payMethod: '계좌이체',
  notes: ['우천 시 행사 일정은 협의하여 조정합니다.', '설치 · 철수 인건비가 포함된 금액입니다.'],
  status: 'sent', fill: false,
  lines: [
    { name: '몽골텐트', spec: '5×5m', days: 2, qty: 8, price: 170000, memo: '' },
    { name: '천막', spec: '3×6m', days: 2, qty: 5, price: 30000, memo: '' },
    { name: '가림막', spec: 'H 1.8m', days: 2, qty: 10, price: 20000, memo: '' },
    { name: '테이블', spec: '1800×600', days: 2, qty: 20, price: 10000, memo: '' },
    { name: '의자', spec: '접이식', days: 2, qty: 250, price: 1000, memo: '' },
    { name: '난로', spec: '등유식', days: 2, qty: 4, price: 50000, memo: '' },
    { name: '발전차', spec: '100kW', days: 1, qty: 1, price: 1000000, memo: '기사 포함' },
    { name: '영상촬영', spec: '현장 스케치', days: 0.5, qty: 1, price: 600000, memo: '편집본 1편' }
  ]
};

var TYPES = {
  quote: { label: '견적서', short: '견적', icon: 'fileText', desc: '행사 견적 보내기' },
  stmt: { label: '거래명세서', short: '명세', icon: 'clipboard', desc: '물품 건넬 때 · A4에 2부' },
  inv: { label: '납품ㆍ청구서', short: '청구', icon: 'truck', desc: '납품 후 대금 청구' },
  rcpt: { label: '영수증', short: '영수', icon: 'receipt', desc: '돈 받은 뒤 확인증' }
};

var STATUS = {
  draft: '작성 중', sent: '보냄', contract: '계약', deposit: '선금 입금',
  paid: '입금 완료', cancel: '취소', overdue: '입금 기한 지남'
};

var RECENT = [
  { dev: 'pc', type: 'quote', no: '견적 261112-01', client: '○○군 가을축제 추진위원회', event: '가을 별빛축제', when: '11/21', amount: 6622000, status: 'sent', tax: false },
  { dev: 'phone', type: 'quote', no: '견적 261110-02', client: '(주)한빛건설', event: '신사옥 준공식', when: '11/28', amount: 2420000, status: 'contract', tax: false },
  { dev: 'pc', type: 'inv', no: '청구 261105-01', client: '○○초등학교', event: '가을 운동회', when: '11/01', amount: 1320000, status: 'overdue', tax: true },
  { dev: 'pc>phone', type: 'stmt', no: '명세 261103-01', client: '○○농협', event: '농업인 한마당', when: '11/08', amount: 3850000, status: 'deposit', tax: true },
  { dev: 'phone', type: 'rcpt', no: '영수 261028-01', client: '○○교회', event: '나눔 바자회', when: '10/25', amount: 880000, status: 'paid', tax: true },
  { dev: 'tablet', type: 'quote', no: '견적 261025-03', client: '○○리조트', event: '기업 송년회', when: '12/19', amount: 5500000, status: 'draft', tax: false },
  { dev: 'pc', type: 'quote', no: '견적 261020-01', client: '○○체육회', event: '군민 걷기대회', when: '11/02', amount: 1980000, status: 'cancel', tax: false }
];

// 월별 매출 (단위: 만 원)
var MONTHS = [
  { m: '6월', v: 820 }, { m: '7월', v: 1160 }, { m: '8월', v: 940 },
  { m: '9월', v: 1480 }, { m: '10월', v: 1830 }, { m: '11월', v: 1243 }
];

var TOP_CLIENTS = [
  { name: '○○군청', v: 2860 }, { name: '○○농협', v: 1540 }, { name: '(주)한빛건설', v: 980 }
];

var PHRASES = [
  '우천 시 행사 일정은 협의하여 조정합니다.',
  '설치 · 철수 인건비가 포함된 금액입니다.',
  '전기 사용료는 별도입니다.',
  '계약금 입금 후 일정이 확정됩니다.'
];

/* calc.js */
// 금액 계산 규칙 (2차 답변 반영)
// 공급가액 = 일수 × 수량 × 단가, 원 아래는 버림 (P02 확정: 0.5일 × 1 × 101원 = 50원)
// 부가세: 별도 = 줄마다 10%에서 원 아래 버림 / 포함 = 금액÷1.1 반올림이 공급가액, 나머지가 세액 / 없음 = 0
var Calc = {
  amount: function (l) {
    // 부동소수 오차(예: 0.1×3)로 1원이 빠지지 않도록 아주 작은 값을 더한 뒤 버림
    return Math.floor((Number(l.days) || 0) * (Number(l.qty) || 0) * (Number(l.price) || 0) + 1e-6);
  },
  line: function (l, vat) {
    var a = Calc.amount(l);
    if (vat === 'none') return { supply: a, tax: 0 };
    if (vat === 'incl') { var s = Math.round(a / 1.1); return { supply: s, tax: a - s }; }
    return { supply: a, tax: Math.floor(a * 0.1) };
  },
  totals: function (doc) {
    var s = 0, t = 0;
    doc.lines.forEach(function (l) { var r = Calc.line(l, doc.vat); s += r.supply; t += r.tax; });
    // 선금은 「선금 받기」를 켰을 때만 계산에 넣는다 (기본은 꺼짐)
    var total = s + t, dep = doc.depositOn ? (Number(doc.deposit) || 0) : 0;
    return { supply: s, tax: t, total: total, deposit: dep, balance: total - dep };
  },
  won: function (n) { return (Math.round(Number(n)) || 0).toLocaleString('ko-KR'); },
  num: function (n) { var v = Number(n) || 0; return v % 1 ? String(Math.round(v * 10) / 10) : v.toLocaleString('ko-KR'); },
  hangul: function (n) {
    n = Math.floor(Number(n) || 0);
    if (!n) return '영';
    var d = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    var u = ['', '십', '백', '천'], b = ['', '만', '억', '조'];
    var s = '', i = 0;
    while (n > 0) {
      var chunk = n % 10000; n = Math.floor(n / 10000);
      if (chunk) {
        var c = '';
        for (var j = 0; j < 4; j++) {
          var dig = chunk % 10; chunk = Math.floor(chunk / 10);
          if (dig) c = (dig === 1 && j > 0 ? '' : d[dig]) + u[j] + c;
        }
        s = c + b[i] + s;
      }
      i++;
    }
    return s;
  },
  date: function (iso) { var p = iso.split('-'); return p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일'; },
  md: function (iso) { var p = iso.split('-'); return (+p[1]) + '/' + (+p[2]); },
  addDays: function (iso, n) {
    var d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  parse: function (v) { var x = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(x) ? 0 : x; }
};

// 업체명처럼 2줄까지 쓰는 글자: 줄바꿈을 그대로 보여 준다
function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/* docs.js */
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

/* appui.js */
// 프로그램 화면 시안: 첫 화면(home) · 문서 작성(editor) · 잠금(lock)
var UI = { kind: 'quote', theme: 'a' };

function devIcon(d) {
  if (d === 'pc>phone') return '<span class="dev-ic" title="PC에서 만들고 폰에서 고침">' + ic('monitor') + '<i>›</i>' + ic('phone', 'sm') + '</span>';
  var map = { pc: ['monitor', 'PC'], phone: ['phone', '폰'], tablet: ['tablet', '태블릿'] }[d];
  return '<span class="dev-ic" title="' + map[1] + '에서 만듦">' + ic(map[0]) + '<em>' + map[1] + '</em></span>';
}

function typeChip(type) { return '<span class="tchip t-' + type + '">' + ic(TYPES[type].icon) + TYPES[type].label + '</span>'; }
function statusChip(s) { return '<span class="schip s-' + s + '">' + STATUS[s] + '</span>'; }

function appSidebar(page) {
  // [화면 이름, 메뉴 글자, 아이콘, 시안에서 열리는 화면인지]
  var items = [
    ['home', '홈', 'home', true], ['list', '발행 목록', 'list'], ['event', '행사 · 입금', 'won', true], ['users', '거래처', 'users'],
    ['items', '품목 · 세트', 'layers'], ['equip', '장비 관리', 'tent', true], ['money', '매출 · 미수금', 'chart'],
    ['cal', '행사 달력', 'calendar'], ['trash', '휴지통', 'trash'], ['me', '내 정보 · 도장', 'user', true], ['set', '설정 · 백업', 'sliders']
  ];
  var cur = page === 'editor' ? '' : page;
  var nav = items.map(function (it, i) {
    var href = it[3] ? '?frame=1&t=' + UI.theme + '&page=' + it[0] : '#';
    return '<a href="' + href + '" class="' + (it[0] === cur ? 'on' : '') + '"' + (it[3] ? '' : ' data-toast') + (it[0] === cur ? ' aria-current="page"' : '') + '><span class="nchip n' + (i % 3) + '">' + ic(it[2]) + '</span><span class="lbl">' + it[1] + '</span>' + (it[0] === 'list' ? '<em class="cnt">7</em>' : '') + (it[0] === 'equip' ? '<em class="cnt new">NEW</em>' : '') + '</a>';
  }).join('');
  return '<aside class="side">' +
    '<div class="side-logo"><img class="full" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><img class="mark" src="assets/star-icon.svg" alt=""></div>' +
    '<a href="?frame=1&t=' + UI.theme + '&page=editor" class="side-new">' + ic('plus') + '<span class="lbl">새 문서 만들기</span></a>' +
    '<nav class="nav">' + nav + '</nav>' +
    '<div class="side-bottom"><div class="sync">' + ic('cloud') + '<span class="lbl"><b>구글 드라이브</b><small>이 기기에 저장됨 · 구글 연결은 2단계</small></span></div>' +
    '<button class="lockbtn" data-act="lock">' + ic('lock') + '<span class="lbl">화면 잠금</span></button></div>' +
    '</aside>';
}

function appTop(page) {
  var back = '<a class="back" href="?frame=1&t=' + UI.theme + '&page=home" aria-label="홈으로">' + ic('left') + '</a>';
  var titles = {
    editor: back + '<div><h1>새 문서 만들기</h1><p>입력하면 오른쪽 미리보기가 바로 바뀌고, 저절로 저장돼요</p></div>',
    equip: back + '<div><h1>장비 관리</h1><p>가진 장비와 총 수량을 등록하고, 날짜별로 몇 개가 나가는지 확인해요</p></div>',
    event: back + '<div><h1>행사 · 입금</h1><p>행사 한 건에 묶인 문서와 입금을 한곳에서 봐요 (보완 시안)</p></div>',
    me: back + '<div><h1>내 정보 · 도장</h1><p>여기 넣은 정보가 모든 문서의 「보내는 곳」에 들어가요</p></div>'
  };
  var title = titles[page] || '<div><h1>안녕하세요, 대표님</h1><p>2026년 11월 12일 목요일 · 확인할 일이 <b>3건</b> 있어요</p></div>';
  return '<header class="top"><img class="top-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><div class="top-title">' + title + '</div>' +
    '<label class="search">' + ic('search') + '<input type="search" placeholder="문서 · 거래처 · 받는 사람 이름 검색"></label>' +
    '<div class="top-tools">' +
    '<button class="tool txt" data-act="font">' + ic('type') + '<span>글자 크게</span></button>' +
    '<button class="tool" data-toast aria-label="알림">' + ic('bell') + '<i class="dot">3</i></button>' +
    '<button class="tool" data-act="lock" aria-label="화면 잠금">' + ic('lock') + '</button>' +
    '</div></header>';
}

function homeNewDocs() {
  var tiles = ['quote', 'stmt', 'inv', 'rcpt'].map(function (k) {
    return '<a class="tile t-' + k + '" href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + k + '"><span class="tile-ic">' + ic(TYPES[k].icon) + '</span><b>' + TYPES[k].label + '</b><small>' + TYPES[k].desc + '</small><span class="tile-go">' + ic('arrowRight') + '</span></a>';
  }).join('');
  return '<section class="card c-new"><div class="card-h"><h2>새 문서 만들기</h2><span class="hint">만들 문서를 누르세요</span></div><div class="tiles">' + tiles + '</div></section>';
}

function homeTodo() {
  return '<section class="todo">' +
    '<article class="card tcard warn"><div class="tc-h"><span class="tc-ic">' + ic('clock') + '</span><h3>만료가 가까운 견적</h3></div><div class="tc-big"><b>2</b>건</div>' +
    '<ul><li><span>(주)한빛건설 · 준공식</span><em>3일 남음</em></li><li><span>○○리조트 · 송년회</span><em>5일 남음</em></li></ul><button class="mini" data-toast>견적 다시 보내기</button></article>' +
    '<article class="card tcard danger"><div class="tc-h"><span class="tc-ic">' + ic('alert') + '</span><h3>입금 기한 지난 청구서</h3></div><div class="tc-big"><b>1</b>건 <small class="num">1,320,000원</small></div>' +
    '<ul><li><span>○○초등학교 · 가을 운동회</span><em>11일 지남</em></li></ul><button class="mini" data-toast>' + ic('check') + '입금 확인했어요</button></article>' +
    '<article class="card tcard info"><div class="tc-h"><span class="tc-ic">' + ic('calendar') + '</span><h3>이번 주 행사</h3></div><div class="tc-big"><b>2</b>건</div>' +
    '<ul><li><span>11/21(토) 가을 별빛축제</span><em>천막 13동</em></li><li><span>11/22(일) 가을 별빛축제</span><em>2일차</em></li></ul><button class="mini" data-toast>달력으로 보기</button></article>' +
    '</section>';
}

function homeMoney() {
  var max = Math.max.apply(null, MONTHS.map(function (m) { return m.v; }));
  var bars = MONTHS.map(function (m, i) {
    return '<div class="bar' + (i === MONTHS.length - 1 ? ' now' : '') + '"><em class="num">' + Calc.won(m.v) + '</em><i style="height:' + Math.round(m.v / max * 100) + '%"></i><span>' + m.m + '</span></div>';
  }).join('');
  var top = TOP_CLIENTS.map(function (c, i) {
    return '<li><span class="rk">' + (i + 1) + '</span><span class="nm">' + c.name + '</span><b class="num">' + Calc.won(c.v) + '만</b></li>';
  }).join('');
  return '<section class="card c-money"><div class="card-h"><h2>이번 달 돈 흐름</h2><span class="hint">11월 1일 ~ 오늘</span></div>' +
    '<div class="kpis">' +
    '<div class="kpi k1"><div class="kl"><span>' + ic('won') + '이번 달 매출</span><em>입금 완료 기준 · 11월 진행 중</em></div><b class="num">12,430,000<small>원</small></b></div>' +
    '<div class="kpi k2"><div class="kl"><span>' + ic('clock') + '받을 돈 (미수금)</span><em>4건 · 선금 1,155,000원 받음</em></div><b class="num">8,640,000<small>원</small></b></div>' +
    '<div class="kpi k3"><div class="kl"><span>' + ic('tax') + '세금계산서 안 끊은 문서</span><em>홈택스에서 발행하면 체크</em></div><b class="num">2<small>건</small></b></div>' +
    '</div></section>' +
    '<section class="card c-chart"><div class="card-h"><h2>월별 매출</h2><span class="hint">단위: 만 원</span></div><div class="bars">' + bars + '</div>' +
    '<div class="topc"><h4>거래처별 매출 (올해)</h4><ol>' + top + '</ol></div></section>';
}

function homeRecent() {
  var rows = RECENT.map(function (r) {
    return '<tr class="' + (r.status === 'cancel' ? 'is-cancel' : '') + '"><td>' + devIcon(r.dev) + '</td><td>' + typeChip(r.type) + '</td><td class="no num">' + r.no + '</td>' +
      '<td class="cl"><b>' + r.client + '</b><small>' + r.event + '</small></td><td class="num">' + r.when + '</td><td class="r num amt">' + Calc.won(r.amount) + '</td>' +
      '<td>' + statusChip(r.status) + '</td><td class="c">' + (r.tax ? '<span class="taxok">' + ic('check') + '발행</span>' : '<span class="taxno">미발행</span>') + '</td>' +
      '<td class="c"><button class="icbtn" data-toast aria-label="더보기">' + ic('more') + '</button></td></tr>';
  }).join('');
  var cards = RECENT.map(function (r) {
    return '<li class="rc ' + (r.status === 'cancel' ? 'is-cancel' : '') + '"><div class="rc-top">' + devIcon(r.dev) + typeChip(r.type) + statusChip(r.status) + '</div>' +
      '<div class="rc-mid"><b>' + r.client + '</b><span class="num amt">' + Calc.won(r.amount) + '원</span></div>' +
      '<div class="rc-bot"><span>' + r.event + ' · ' + r.when + '</span><span class="num">' + r.no + '</span></div></li>';
  }).join('');
  var filters = ['전체', '견적서', '거래명세서', '납품ㆍ청구서', '영수증'].map(function (f, i) { return '<button class="fchip' + (i ? '' : ' on') + '" data-toast>' + f + '</button>'; }).join('');
  return '<section class="card c-recent"><div class="card-h"><h2>최근 문서</h2><div class="fchips">' + filters + '</div><a class="more" href="#" data-toast>전체 보기' + ic('right') + '</a></div>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>만든 곳</th><th>종류</th><th>문서번호</th><th>받는 곳 · 행사</th><th>행사일</th><th class="r">합계금액</th><th>진행 상태</th><th class="c">세금계산서</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<ul class="rcards">' + cards + '</ul></section>';
}

function homePage() {
  return '<div class="home">' + homeNewDocs() + homeRecent() + homeTodo() + homeMoney() + '</div>';
}

/* ── 문서 작성 ── */
function field(label, value, cls, extra) {
  return '<label class="fld ' + (cls || '') + '"><span>' + label + '</span><input class="in" value="' + esc(value) + '"' + (extra || '') + '></label>';
}

function lineCard(l, i) {
  var r = Calc.line(l, DOC.vat);
  return '<div class="line" data-i="' + i + '">' +
    '<button class="grip" aria-label="꾹 눌러 끌어서 순서 바꾸기" title="꾹 눌러 끌어서 순서 바꾸기">' + ic('grip') + '</button>' +
    '<div class="line-main">' +
    '<div class="line-top"><span class="line-no">' + (i + 1) + '</span><input class="in nm" data-f="name" value="' + esc(l.name) + '" aria-label="품목"><input class="in sp" data-f="spec" value="' + esc(l.spec) + '" placeholder="규격" aria-label="규격"><input class="in mm" data-f="memo" value="' + esc(l.memo || '') + '" placeholder="비고" aria-label="비고"></div>' +
    '<div class="line-nums">' +
    '<label class="nb"><span>일수</span><input class="in num" data-f="days" inputmode="decimal" value="' + Calc.num(l.days) + '"></label><span class="op">×</span>' +
    '<label class="nb"><span>수량</span><input class="in num" data-f="qty" inputmode="numeric" value="' + Calc.num(l.qty) + '"></label><span class="op">×</span>' +
    '<label class="nb w"><span>단가</span><input class="in num" data-f="price" inputmode="numeric" value="' + Calc.won(l.price) + '"></label>' +
    '</div></div>' +
    '<div class="line-amt"><span>공급가액</span><b class="num">' + Calc.won(r.supply) + '</b><small>세액 <span class="num">' + Calc.won(r.tax) + '</span></small></div>' +
    '<button class="del" aria-label="이 줄 지우기" data-toast>' + ic('x') + '</button>' +
    '</div>';
}

function edTotals() {
  var t = Calc.totals(DOC);
  return '<div class="ed-sum"><div><span>공급가액</span><b class="num">' + Calc.won(t.supply) + '</b></div><div><span>부가세</span><b class="num">' + Calc.won(t.tax) + '</b></div><div class="g"><span>총 합계</span><b class="num">₩' + Calc.won(t.total) + '</b></div>' +
    (DOC.depositOn ? '<div class="bal"><span>선금 뺀 잔금</span><b class="num">₩' + Calc.won(t.balance) + '</b></div>' : '') + '</div>';
}

function seg(name, opts, cur) {
  return '<div class="seg" role="radiogroup" data-seg="' + name + '">' + opts.map(function (o) {
    return '<button role="radio" aria-checked="' + (o[0] === cur) + '" class="' + (o[0] === cur ? 'on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>';
  }).join('') + '</div>';
}

function editorPage(step) {
  var kinds = [['quote', '견적서'], ['stmt', '거래명세서'], ['inv', '납품ㆍ청구서'], ['rcpt', '영수증']];
  var statusOpts = Object.keys(STATUS).filter(function (k) { return k !== 'overdue'; }).map(function (k) { return '<option' + (k === DOC.status ? ' selected' : '') + '>' + STATUS[k] + '</option>'; }).join('');
  var lines = DOC.lines.map(lineCard).join('');
  var phrases = PHRASES.map(function (p, i) { return '<button class="pchip' + (i < 2 ? ' on' : '') + '" data-toast>' + (i < 2 ? ic('check') : ic('plus')) + p + '</button>'; }).join('');
  var steps = [['1', '받는 곳'], ['2', '품목 넣기'], ['3', '확인 · 보내기']].map(function (s) {
    return '<a href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + UI.kind + '&step=' + s[0] + '" class="' + (+s[0] === step ? 'on' : (+s[0] < step ? 'done' : '')) + '"><i>' + (+s[0] < step ? '✓' : s[0]) + '</i><span>' + s[1] + '</span></a>';
  }).join('');
  var next = step < 3
    ? '<a class="btn primary big" href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + UI.kind + '&step=' + (step + 1) + '">다음 : ' + (step === 1 ? '품목 넣기' : '확인 · 보내기') + ic('arrowRight') + '</a>'
    : '<button class="btn primary big" data-toast>' + ic('chat') + '카톡 보내기</button>';
  var prev = step > 1 ? '<a class="btn ghost big" href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + UI.kind + '&step=' + (step - 1) + '">' + ic('left') + '이전</a>' : '';

  return '<div class="ed" data-step="' + step + '">' +
    '<nav class="steps" aria-label="작성 단계">' + steps + '</nav>' +
    '<div class="ed-bar card">' +
    '<div class="ed-bar-l">' + seg('kind', kinds, UI.kind) + '</div>' +
    '<div class="ed-bar-r"><label class="status-sel"><span>진행 상태</span><select class="in">' + statusOpts + '</select></label>' +
    '<div class="menu"><button class="btn" data-menu>' + ic('download') + '파일로 저장' + ic('down') + '</button><div class="menu-pop"><button data-toast>' + ic('table') + '엑셀 (.xlsx)</button><button data-toast>' + ic('pdf') + 'PDF</button><button data-toast>' + ic('image') + '이미지 (JPG)</button></div></div>' +
    '<button class="btn" data-toast>' + ic('print') + '인쇄</button>' +
    '<div class="menu"><button class="btn primary" data-menu>' + ic('share') + '보내기' + ic('down') + '</button><div class="menu-pop right"><button data-toast>' + ic('chat') + '카톡 (이미지 복사)</button><button data-toast>' + ic('mail') + '메일 (Gmail 쓰기 창)</button></div></div>' +
    '</div></div>' +
    '<div class="ed-cols"><div class="ed-form">' +
    '<section class="card" data-s="1"><div class="card-h"><h2><span class="sn">1</span>받는 곳</h2><span class="hint">거래처를 고르면 담당자·연락처가 채워져요</span></div><div class="fgrid">' +
    '<label class="fld span2"><span>거래처 (받는 곳)</span><div class="combo"><input class="in" value="' + esc(DOC.client.name) + '">' + ic('down') + '</div></label>' +
    field('담당자', DOC.client.person) + field('연락처', DOC.client.tel, 'num') + field('문서 날짜', '2026-11-12', '', ' type="date"') + field('유효기간 (일)', DOC.valid, '', ' inputmode="numeric"') +
    '</div></section>' +
    '<section class="card" data-s="1"><div class="card-h"><h2><span class="sn ev">' + ic('star') + '</span>행사 정보</h2><span class="hint">비워 두면 문서에서 자동으로 숨겨요</span></div><div class="fgrid">' +
    field('행사명', DOC.event.name, 'span2') + field('행사 일정', DOC.event.date) + field('행사 장소', DOC.event.place) +
    '</div></section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn">2</span>품목</h2><div class="tools"><button class="btn sm" data-toast>' + ic('layers') + '세트 넣기</button><button class="btn sm" data-toast>' + ic('list') + '목록에서 고르기</button><button class="btn sm" data-toast>' + ic('table') + '엑셀 붙여넣기</button></div></div>' +
    '<p class="note">' + ic('grip') + '왼쪽 손잡이를 꾹 누른 채 위아래로 끌면 순서가 바뀌어요. 공급가액 = 일수 × 수량 × 단가</p>' +
    '<div class="lines">' + lines + '</div><button class="addline" data-toast>' + ic('plus') + '품목 추가</button>' + edTotals() + '</section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn won">₩</span>부가세 · 선금</h2></div>' +
    '<div class="opt-row"><span class="ol">부가세</span>' + seg('vat', [['excl', '별도 (10% 더하기)'], ['incl', '포함'], ['none', '없음']], DOC.vat) + '</div>' +
    '<div class="opt-row dep-row"><span class="ol">선금 (계약금)</span>' +
    '<label class="sw"><input type="checkbox" data-opt="depositOn"' + (DOC.depositOn ? ' checked' : '') + '><i></i><span>선금 받기</span></label>' +
    '<div class="dep" id="depBox"' + (DOC.depositOn ? '' : ' hidden') + '><input class="in num" id="depAmt" value="' + Calc.won(DOC.deposit) + '" inputmode="numeric" aria-label="선금 금액"><span class="won-s">원</span>' +
    '<button class="pchip" data-dep="0.1">10%</button><button class="pchip" data-dep="0.3">30%</button><button class="pchip" data-dep="0.5">50%</button></div>' +
    '<p class="dep-hint" id="depHint">' + (DOC.depositOn ? '문서에 <b>선금 · 잔금</b> 줄이 들어가요.' : '꺼져 있으면 문서에 선금 · 잔금 줄이 나오지 않아요.') + '</p></div>' +
    '<div class="opt-row"><span class="ol">끝자리 정리</span><label class="sw"><input type="checkbox"><i></i><span>합계 끝자리 깎기 (네고)</span></label></div>' +
    '</section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn">3</span>특이사항 · 문서 설정</h2></div>' +
    '<div class="autos"><span class="auto">' + ic('check') + '견적 유효기간 15일 (자동)</span><span class="auto">' + ic('check') + '결제 계좌 (자동)</span></div>' +
    '<div class="pchips">' + phrases + '</div><textarea class="in ta" rows="2" placeholder="직접 쓰기 — 예: 무대 설치는 전날 오후에 진행합니다."></textarea>' +
    '<div class="opt-row"><label class="sw"><input type="checkbox" data-opt="showNo"' + (DOC.showNo ? ' checked' : '') + '><i></i><span>문서번호 보이기</span></label>' +
    '<label class="sw"><input type="checkbox" data-opt="fill"' + (DOC.fill ? ' checked' : '') + '><i></i><span>빈 줄 채우기 (표를 끝까지)</span></label></div>' +
    '</section>' +
    '</div>' +
    '<aside class="ed-preview card" data-s="3"><div class="card-h"><h2>' + ic('eye') + '미리보기</h2><span class="hint pv-kind">' + TYPES[UI.kind].label + ' · A4</span></div>' +
    '<div class="pv-box"><div class="fit" data-w="794" data-h="auto"><div class="fit-inner" style="width:794px" id="pv">' + renderDoc(UI.kind, UI.theme) + '</div></div></div>' +
    '<div class="share-big"><button class="sb" data-toast>' + ic('pdf') + 'PDF 저장</button><button class="sb" data-toast>' + ic('image') + '이미지 저장</button><button class="sb kakao" data-toast>' + ic('chat') + '카톡 보내기</button><button class="sb" data-toast>' + ic('mail') + '메일 보내기</button></div>' +
    '</aside>' +
    '</div>' +
    '<div class="ed-next">' + prev + next + '</div>' +
    '</div>';
}

function lockScreen() {
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(function (k) {
    if (k === 'del') return '<button class="key fn" data-key="del" aria-label="지우기">' + ic('backspace') + '</button>';
    if (k === 'ok') return '<button class="key fn ok" data-key="ok">확인</button>';
    return '<button class="key" data-key="' + k + '">' + k + '</button>';
  }).join('');
  return '<div class="lock" id="lock" role="dialog" aria-label="화면 잠금"><div class="lock-card">' +
    '<img class="lock-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사">' +
    '<span class="lock-ic">' + ic('lock') + '</span><h2>화면이 잠겼어요</h2><p>숫자 비밀번호를 누르면<br>쓰던 화면 그대로 이어서 작성해요</p>' +
    '<div class="pins" id="pins"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="pad">' + keys + '</div>' +
    '<button class="forgot" data-toast>' + ic('google') + '비밀번호를 잊었어요 · 구글 계정으로 확인</button>' +
    '<small class="lock-tip">시안: 숫자 4개 이상 누르고 확인을 누르면 풀려요 · 5분 동안 손대지 않으면 자동으로 잠겨요</small>' +
    '</div></div>';
}

/* 장비 관리는 equip.js */

/* ── 내 정보 · 도장 ── */
function meField(label, key, extra) {
  return '<label class="fld"><span>' + label + '</span><input class="in" data-me="' + key + '" value="' + esc(ME[key]) + '"' + (extra || '') + '></label>';
}

function mePage() {
  return '<div class="mepage"><div class="me-form">' +
    '<section class="card"><div class="card-h"><h2>' + ic('building') + '사업자 정보</h2><span class="hint">처음 한 번만 넣으면 돼요</span></div><div class="fgrid">' +
    '<label class="fld span2 nmfld"><span>상호 (업체명) <em class="tag2">최대 2줄</em></span>' +
    '<textarea class="in ta2" data-me="name" rows="2" aria-describedby="nmHint">' + esc(ME.name) + '</textarea>' +
    '<small id="nmHint" class="fhint">' + ic('check') + '<span><b>엔터</b>를 누르면 다음 줄로 넘어가요. 예: 스타미디어 ↵ (STARmedia)</span></small></label>' +
    meField('대표자', 'ceo') + meField('사업자등록번호', 'bizNo', ' inputmode="numeric"') +
    '<div class="span2">' + meField('주소', 'addr') + '</div>' +
    meField('업태', 'bizType') + meField('종목', 'bizItem') + meField('전화', 'tel', ' inputmode="tel"') + meField('팩스', 'fax', ' inputmode="tel"') +
    '</div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('bank') + '입금 계좌</h2><span class="hint">견적서 특이사항과 납품ㆍ청구서 입금 계좌 상자에 들어가요</span></div><div class="fgrid three">' +
    meField('은행', 'bankName') + meField('계좌번호', 'bankNo', ' inputmode="numeric"') + meField('예금주', 'holder') +
    '</div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('user') + '도장</h2><span class="hint">문서의 「대표」 칸에 찍혀요</span></div>' +
    '<div class="stampbox"><div class="stamp-pv"><img src="assets/stamp-sample.svg" alt="도장 미리보기" id="stampImg" style="width:72px;height:72px"></div>' +
    '<div class="stamp-act"><div class="stamp-btns"><button class="btn" data-toast>' + ic('image') + '도장 사진 넣기 <small>(JPG · 흰 배경 자동 지우기)</small></button>' +
    '<button class="btn" data-toast>' + ic('upload') + '투명 PNG 그대로 넣기</button></div>' +
    '<label class="range"><span>크기</span><input type="range" min="12" max="24" value="17" id="stampSize" aria-label="도장 크기"><b id="stampSizeV">17mm</b></label>' +
    '<p class="note">' + ic('check') + '크기를 키워도 도장이 잘리지 않도록 칸 밖으로 넘쳐도 그대로 보여요.</p></div></div>' +
    '</section></div>' +
    '<aside class="card me-pv"><div class="card-h"><h2>' + ic('eye') + '문서에 이렇게 보여요</h2></div>' +
    '<div class="me-sample doc--a" id="meSample">' + supplierTable(true) + '</div>' +
    '<p class="note">' + ic('fileText') + '견적서 · 거래명세서 · 납품ㆍ청구서 · 영수증에 똑같이 들어가요.</p></aside>' +
    '</div>';
}

/* ── 휴대폰 아래 메뉴 + 더보기 ── */
function bottomNav(page) {
  var it = [['home', '홈', 'home', page === 'home'], ['new', '새 문서', 'plus', page === 'editor'], ['list', '목록', 'list'], ['users', '거래처', 'users'], ['more', '더보기', 'grid', page === 'equip' || page === 'me' || page === 'event']];
  var more = [['event', '행사 · 입금', 'won', true], ['equip', '장비 관리', 'tent', true], ['me', '내 정보 · 도장', 'user', true], ['items', '품목 · 세트', 'layers'], ['money', '매출 · 미수금', 'chart'], ['cal', '행사 달력', 'calendar'], ['trash', '휴지통', 'trash'], ['set', '설정 · 백업', 'sliders']];
  return '<nav class="bnav">' + it.map(function (x) {
    var href = x[0] === 'new' ? '?frame=1&t=' + UI.theme + '&page=editor' : x[0] === 'home' ? '?frame=1&t=' + UI.theme + '&page=home' : '#';
    var attr = x[0] === 'more' ? ' data-act="more"' : (href === '#' ? ' data-toast' : '');
    return '<a href="' + href + '" class="' + (x[3] ? 'on ' : '') + (x[0] === 'new' ? 'bnew' : '') + '"' + attr + '><span class="bi">' + ic(x[2]) + '</span><span>' + x[1] + '</span></a>';
  }).join('') + '</nav>' +
    '<div class="sheet" id="moreSheet" role="dialog" aria-label="더보기 메뉴"><div class="sheet-card"><div class="sheet-h"><b>더보기</b><button class="icbtn" data-act="more" aria-label="닫기">' + ic('x') + '</button></div>' +
    '<div class="sheet-grid">' + more.map(function (m) {
      return '<a href="' + (m[3] ? '?frame=1&t=' + UI.theme + '&page=' + m[0] : '#') + '" class="' + (m[0] === page ? 'on' : '') + '"' + (m[3] ? '' : ' data-toast') + '><span class="bi">' + ic(m[2]) + '</span><span>' + m[1] + '</span></a>';
    }).join('') + '</div></div></div>';
}

function credit() {
  return '<footer class="credit"><img src="assets/gonynas-logo.jpg" alt=""><span>Developed by <b>GONYNAS</b> · v1.0</span></footer>';
}

function renderApp(opt) {
  UI.theme = opt.theme; UI.kind = opt.kind || 'quote';
  var page = opt.page || 'home', step = opt.step || 1;
  var body = page === 'editor' ? editorPage(step) : page === 'equip' ? equipPage() : page === 'event' ? eventPage() : page === 'me' ? mePage() : homePage();
  return '<div class="app" data-page="' + page + '">' + appSidebar(page) +
    '<div class="main">' + appTop(page) + '<main class="page">' + body + '</main>' + credit() + '</div>' +
    bottomNav(page) + '</div>' + lockScreen() + modalBox() + '<div class="toast" id="toast" role="status"></div>';
}

/* ── 움직임 ── */
function toast(msg) {
  var t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg || '시안 화면이라 실제로 저장·발송되지는 않아요';
  t.classList.add('on'); clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 2200);
}

var pvTimer = null;
function refreshPreview(root) {
  clearTimeout(pvTimer);
  pvTimer = setTimeout(function () {
    var pv = root.querySelector('#pv'); if (!pv) return;
    pv.innerHTML = renderDoc(UI.kind, UI.theme);
    var k = root.querySelector('.pv-kind'); if (k) k.textContent = TYPES[UI.kind].label + ' · A4';
    var sum = root.querySelector('.ed-sum'); if (sum) sum.outerHTML = edTotals();
    fitAll();
  }, 80);
}

function updateLineView(lineEl, l) {
  var r = Calc.line(l, DOC.vat);
  lineEl.querySelector('.line-amt b').textContent = Calc.won(r.supply);
  lineEl.querySelector('.line-amt small .num').textContent = Calc.won(r.tax);
}

function renumber(root) {
  root.querySelectorAll('.lines .line').forEach(function (el, i) { el.dataset.i = i; el.querySelector('.line-no').textContent = i + 1; });
}

function bindDrag(root) {
  var box = root.querySelector('.lines'); if (!box) return;
  box.addEventListener('pointerdown', function (e) {
    var g = e.target.closest('.grip'); if (!g) return;
    e.preventDefault();
    var item = g.closest('.line'); item.classList.add('dragging');
    g.setPointerCapture(e.pointerId);
    var move = function (ev) {
      var others = Array.prototype.filter.call(box.children, function (c) { return c !== item; });
      var before = null;
      for (var i = 0; i < others.length; i++) { var r = others[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { before = others[i]; break; } }
      if (before) box.insertBefore(item, before); else box.appendChild(item);
    };
    var up = function () {
      item.classList.remove('dragging');
      g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
      var order = Array.prototype.map.call(box.children, function (c) { return +c.dataset.i; });
      DOC.lines = order.map(function (i) { return DOC.lines[i]; });
      renumber(root); refreshPreview(root);
    };
    g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  });
}

function bindApp(root) {
  root.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a && a.dataset.act === 'lock') { e.preventDefault(); openLock(); return; }
    if (a && a.dataset.act === 'font') { e.preventDefault(); document.documentElement.classList.toggle('big'); a.querySelector('span').textContent = document.documentElement.classList.contains('big') ? '글자 보통' : '글자 크게'; fitAll(); return; }
    var m = e.target.closest('[data-menu]');
    root.querySelectorAll('.menu.open').forEach(function (x) { if (!m || x !== m.parentElement) x.classList.remove('open'); });
    if (m) { e.preventDefault(); m.parentElement.classList.toggle('open'); return; }
    var sb = e.target.closest('[data-seg] button');
    if (sb) {
      var segEl = sb.parentElement, name = segEl.dataset.seg;
      segEl.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === sb); b.setAttribute('aria-checked', b === sb); });
      if (name === 'kind') { UI.kind = sb.dataset.v; root.querySelectorAll('a[href*="page=editor"]').forEach(function (l) { l.href = l.getAttribute('href').replace(/kind=\w+/, 'kind=' + UI.kind); }); }
      if (name === 'vat') { DOC.vat = sb.dataset.v; root.querySelectorAll('.lines .line').forEach(function (el) { updateLineView(el, DOC.lines[+el.dataset.i]); }); }
      refreshPreview(root); return;
    }
    var k = e.target.closest('[data-key]'); if (k) { pinKey(k.dataset.key); return; }
    if (a && a.dataset.act === 'more') { e.preventDefault(); var sh = root.querySelector('#moreSheet'); if (sh) sh.classList.toggle('on'); return; }
    if (e.target.id === 'moreSheet') { e.target.classList.remove('on'); return; }
    // 확인 창 · 장비 관리 (equip.js)
    if (modalClick(e)) return;
    if (equipClick(e, root, a)) return;
    if (eventClick(e, root, a)) return;
    // 선금 빠른 입력 10% · 30% · 50% (견적서에 보이는 예상 선금)
    var dp = e.target.closest('[data-dep]');
    if (dp) { DOC.deposit = Math.round(Calc.totals({ lines: DOC.lines, vat: DOC.vat }).total * +dp.dataset.dep); var di = root.querySelector('#depAmt'); if (di) di.value = Calc.won(DOC.deposit); refreshPreview(root); return; }
    var tt = e.target.closest('[data-toast]'); if (tt) { e.preventDefault(); toast(); }
  });
  root.addEventListener('input', function (e) {
    var inp = e.target, f = inp.dataset.f;
    if (f) {
      var lineEl = inp.closest('.line'), l = DOC.lines[+lineEl.dataset.i];
      l[f] = (f === 'name' || f === 'spec' || f === 'memo') ? inp.value : Calc.parse(inp.value);
      updateLineView(lineEl, l); refreshPreview(root);
    }
    // 내 정보: 고치는 대로 「문서에 이렇게 보여요」에 반영. 업체명은 2줄까지
    var mk = inp.dataset.me;
    if (mk) {
      if (mk === 'name') {
        var parts = inp.value.split('\n');
        // 붙여넣기로 3줄 이상이 들어오면 둘째 줄 뒤를 한 줄로 합친다
        if (parts.length > 2) { inp.value = parts[0] + '\n' + parts.slice(1).join(' '); toast('업체명은 2줄까지 쓸 수 있어요'); }
      }
      ME[mk] = inp.value;
      var smp = root.querySelector('#meSample'); if (smp) { smp.innerHTML = supplierTable(true); applyStampSize(root); }
    }
    if (inp.id === 'stampSize') applyStampSize(root);
  });
  root.addEventListener('keydown', function (e) {
    if (e.target.dataset.me === 'name' && e.key === 'Enter' && e.target.value.indexOf('\n') !== -1) { e.preventDefault(); toast('업체명은 2줄까지 쓸 수 있어요'); }
  });
  root.addEventListener('change', function (e) {
    var o = e.target.dataset.opt;
    if (o) {
      DOC[o] = e.target.checked;
      if (o === 'depositOn') {
        var box0 = root.querySelector('#depBox'), hint = root.querySelector('#depHint');
        if (box0) box0.hidden = !DOC.depositOn;
        if (hint) hint.innerHTML = DOC.depositOn ? '문서에 <b>선금 · 잔금</b> 줄이 들어가요.' : '꺼져 있으면 문서에 선금 · 잔금 줄이 나오지 않아요.';
      }
      refreshPreview(root);
    }
    equipChange(e, root);
  });
  root.addEventListener('input', function (e) {
    if (e.target.id === 'depAmt') { DOC.deposit = Calc.parse(e.target.value); refreshPreview(root); }
    if (e.target.id === 'mTotal') eqDiffHint();
    eventInput(e, root);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  bindDrag(root);
  var idle; var resetIdle = function () { clearTimeout(idle); idle = setTimeout(openLock, 5 * 60 * 1000); };
  ['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, resetIdle); }); resetIdle();
}

// 도장 크기(12~24mm)를 미리보기에 반영 (A4 기준 약 3px = 1mm)
function applyStampSize(root) {
  var r = root.querySelector('#stampSize'); if (!r) return;
  var v = +r.value, lbl = root.querySelector('#stampSizeV'), pv = root.querySelector('#stampImg');
  if (lbl) lbl.textContent = v + 'mm';
  if (pv) { pv.style.width = pv.style.height = Math.round(v * 4.2) + 'px'; }
  root.querySelectorAll('#meSample .stamp').forEach(function (s) { s.style.width = s.style.height = Math.round(v * 3) + 'px'; });
}

var PIN = '';
function openLock() { PIN = ''; drawPins(); var l = document.getElementById('lock'); if (l) l.classList.add('on'); }
function drawPins() { document.querySelectorAll('#pins i').forEach(function (d, i) { d.classList.toggle('on', i < PIN.length); }); }
function pinKey(k) {
  if (k === 'del') PIN = PIN.slice(0, -1);
  else if (k === 'ok') { if (PIN.length >= 4) { document.getElementById('lock').classList.remove('on'); toast('잠금이 풀렸어요 (시안)'); } else toast('숫자를 4개 이상 눌러 주세요'); PIN = ''; }
  else if (PIN.length < 6) PIN += k;
  drawPins();
}

/* equip.js */
// 장비 관리 (3차 시안): 수정 · 삭제(여러 개 선택) · 수량 변경 저장 · 확인 창
// sel = 체크한 장비, pending = − + 로 바꿨지만 아직 저장하지 않은 총 수량
var EQ = { day: 0, cat: '전체', sel: {}, pending: {}, next: 1 };
EQUIP.forEach(function (e) { if (!e.id) e.id = 'e' + (EQ.next++); });

function eqById(id) { for (var i = 0; i < EQUIP.length; i++) if (EQUIP[i].id === id) return EQUIP[i]; return null; }
function eqTotal(e) { return EQ.pending[e.id] !== undefined ? EQ.pending[e.id] : e.total; }
function eqOut(e) { return e.outs ? (e.outs[EQ.day] || 0) : 0; }
function eqLeft(e) { return eqTotal(e) - eqOut(e); }
// 부족하면 음수를 0으로 숨기지 않고 「N개 부족」으로 보여 준다
function eqState(e) {
  var left = eqLeft(e), tot = eqTotal(e);
  if (left < 0) return ['short', (-left) + '개 부족'];
  if (left === 0) return ['none', '모두 예약됨'];
  if (left / tot < 0.2) return ['low', '얼마 안 남음'];
  return ['ok', '넉넉함'];
}
function eqLabel(e) { return esc(e.name) + (e.spec ? ' ' + esc(e.spec) : ''); }

function eqStepper(e) {
  var ch = EQ.pending[e.id] !== undefined;
  return '<div class="stepper' + (ch ? ' changed' : '') + '" data-id="' + e.id + '"><button class="stp" data-stp="-1" aria-label="총 수량 1개 줄이기">' + ic('minus') + '</button>' +
    '<input class="in num" value="' + eqTotal(e) + '" inputmode="numeric" aria-label="' + eqLabel(e) + ' 총 보유 수량"><button class="stp" data-stp="1" aria-label="총 수량 1개 늘리기">' + ic('plus') + '</button></div>' +
    (ch ? '<small class="was">원래 ' + e.total + '개 · 저장 전</small>' : '');
}

function eqBar(e) {
  var st = eqState(e), tot = eqTotal(e), left = eqLeft(e);
  var pct = tot ? Math.max(0, Math.round(left / tot * 100)) : 0;
  var head = left < 0 ? '<b class="num">' + (-left) + '</b><span>개 모자람</span>' : '<b class="num">' + left + '</b><span>개 남음</span>';
  return '<div class="eqbar ' + st[0] + '"><div class="eqbar-t">' + head + '<em>' + st[1] + '</em></div><i><b style="width:' + (left < 0 ? 100 : pct) + '%"></b></i></div>';
}

function eqActs(e) {
  return '<div class="eqacts"><button class="btn sm" data-eqedit="' + e.id + '">' + ic('sliders') + '수정</button><button class="btn sm danger-o" data-eqdel="' + e.id + '">' + ic('trash') + '삭제</button></div>';
}

function eqList() { return EQUIP.filter(function (e) { return EQ.cat === '전체' || e.cat === EQ.cat; }); }

function eqRows() {
  var list = eqList();
  var rows = list.map(function (e) {
    var on = !!EQ.sel[e.id];
    return '<tr class="' + (on ? 'sel' : '') + '"><td class="c"><input type="checkbox" class="chk" data-eqsel="' + e.id + '"' + (on ? ' checked' : '') + ' aria-label="' + eqLabel(e) + ' 선택"></td>' +
      '<td class="eqnm"><span class="eqcat">' + e.cat + '</span><b>' + esc(e.name) + '</b><small>' + esc(e.spec) + (e.memo ? ' · ' + esc(e.memo) : '') + ' · ' + Calc.won(e.price) + '원</small></td>' +
      '<td class="eqst">' + eqStepper(e) + '</td>' +
      '<td class="c num eqout"><b>' + eqOut(e) + '</b>개</td>' +
      '<td class="eqleft">' + eqBar(e) + '</td>' +
      '<td>' + eqActs(e) + '</td></tr>';
  }).join('');
  var cards = list.map(function (e) {
    var on = !!EQ.sel[e.id];
    return '<li class="eqcard' + (on ? ' sel' : '') + '"><div class="eqc-top"><input type="checkbox" class="chk" data-eqsel="' + e.id + '"' + (on ? ' checked' : '') + ' aria-label="' + eqLabel(e) + ' 선택"><span class="eqcat">' + e.cat + '</span><b>' + esc(e.name) + '</b><small>' + esc(e.spec) + '</small></div>' +
      '<div class="eqc-mid"><div><span class="eqc-l">총 보유</span>' + eqStepper(e) + '</div><div class="eqc-out"><span class="eqc-l">이 날 나감</span><b class="num">' + eqOut(e) + '개</b></div></div>' +
      eqBar(e) + eqActs(e) + '</li>';
  }).join('');
  if (!list.length) rows = '<tr><td colspan="6" class="c empty-msg">등록된 장비가 없어요. 오른쪽에서 장비를 등록해 주세요.</td></tr>';
  return { rows: rows, cards: cards || '<li class="empty-msg">등록된 장비가 없어요.</li>' };
}

function eqSummary() {
  var kinds = EQUIP.length, total = 0, out = 0, short = 0;
  EQUIP.forEach(function (e) { total += eqTotal(e); out += eqOut(e); if (eqState(e)[0] !== 'ok') short++; });
  return '<div class="eqsum">' +
    '<div class="eqk"><span>' + ic('tent') + '등록한 장비</span><b class="num">' + kinds + '<small>종류</small></b></div>' +
    '<div class="eqk"><span>' + ic('layers') + '총 보유 수량</span><b class="num">' + Calc.won(total) + '<small>개</small></b></div>' +
    '<div class="eqk"><span>' + ic('truck') + EQUIP_DAYS[EQ.day][0] + ' 나가는 장비</span><b class="num">' + Calc.won(out) + '<small>개</small></b></div>' +
    '<div class="eqk warn"><span>' + ic('alert') + '부족하거나 얼마 안 남음</span><b class="num">' + short + '<small>종류</small></b></div>' +
    '</div>';
}

function eqBulkBar() {
  var list = eqList(), n = Object.keys(EQ.sel).length;
  var allOn = list.length > 0 && list.every(function (e) { return EQ.sel[e.id]; });
  return '<label class="chkall"><input type="checkbox" class="chk" id="eqAll"' + (allOn ? ' checked' : '') + '><span>보이는 장비 모두 선택</span></label>' +
    '<span class="seln"><b>' + n + '</b>개 선택</span>' +
    '<button class="btn sm danger" data-act="eqdelsel"' + (n ? '' : ' disabled') + '>' + ic('trash') + '선택한 장비 삭제</button>';
}

function eqPendBar() {
  var n = Object.keys(EQ.pending).length;
  return '<span class="pmsg">' + ic('alert') + '<span>수량을 바꾼 장비 <b>' + n + '</b>개 — <b>변경 저장</b>을 눌러야 반영돼요</span></span>' +
    '<button class="btn sm ghost" data-act="eqrevert">되돌리기</button><button class="btn sm primary" data-act="eqsave">' + ic('check') + '변경 저장</button>';
}

function equipPage() {
  var r = eqRows();
  var days = EQUIP_DAYS.map(function (d, i) { return '<button class="fchip' + (i === EQ.day ? ' on' : '') + '" data-eqday="' + i + '">' + d[0] + ' <small>' + d[1] + '</small></button>'; }).join('');
  var cats = ['전체'].concat(EQUIP_CATS.slice(0, 4)).map(function (c) { return '<button class="fchip' + (c === EQ.cat ? ' on' : '') + '" data-eqcat="' + c + '">' + c + '</button>'; }).join('');
  var catOpts = EQUIP_CATS.map(function (c) { return '<option>' + c + '</option>'; }).join('');
  return '<div class="eqpage">' +
    '<section class="card eq-sumcard">' + eqSummary() + '</section>' +
    '<div class="eq-cols">' +
    '<section class="card eq-list"><div class="card-h"><h2>' + ic('tent') + '장비 목록</h2><span class="hint">− + 로 수량을 바꾸고 「변경 저장」 · 다른 내용은 「수정」</span></div>' +
    '<div class="eq-filter"><span class="ol">날짜</span><div class="fchips">' + days + '</div></div>' +
    '<div class="eq-filter"><span class="ol">분류</span><div class="fchips">' + cats + '</div></div>' +
    '<div class="eq-bulk" id="eqBulk">' + eqBulkBar() + '</div>' +
    '<div class="tbl-wrap"><table class="tbl eqtbl"><thead><tr><th class="c">선택</th><th>장비 · 규격 · 기본 단가</th><th>총 보유 수량</th><th class="c">이 날 나감</th><th>남은 수량</th><th>관리</th></tr></thead><tbody id="eqrows">' + r.rows + '</tbody></table></div>' +
    '<ul class="eqcards" id="eqcards">' + r.cards + '</ul>' +
    '<div class="eq-pend" id="eqPend"' + (Object.keys(EQ.pending).length ? '' : ' hidden') + '>' + eqPendBar() + '</div>' +
    '<p class="note eqnote">' + ic('calendar') + '<span>「이 날 나감」은 그날 행사로 <b>계약</b>된 수량을 더한 값이에요. 날짜별 예약 계산 · 부족 경고는 3단계에서 실제로 작동해요(지금은 예시 숫자).</span></p>' +
    '</section>' +
    '<section class="card eq-form"><div class="card-h"><h2>' + ic('plus') + '장비 등록</h2></div><div class="fgrid one">' +
    '<label class="fld"><span>장비 이름</span><input class="in" id="eqName" placeholder="예: 몽골텐트"></label>' +
    '<label class="fld"><span>분류</span><select class="in" id="eqCat">' + catOpts + '</select></label>' +
    '<label class="fld"><span>규격</span><input class="in" id="eqSpec" placeholder="예: 5×5m"></label>' +
    '<div class="fld"><span>총 보유 수량</span><div class="stepper big" data-id="new"><button class="stp" data-stp="-1" aria-label="1개 줄이기">' + ic('minus') + '</button><input class="in num" id="eqTotal" value="1" inputmode="numeric" aria-label="총 보유 수량"><button class="stp" data-stp="1" aria-label="1개 늘리기">' + ic('plus') + '</button></div></div>' +
    '<label class="fld"><span>기본 대여 단가 (원)</span><input class="in num" id="eqPrice" inputmode="numeric" placeholder="예: 170,000"></label>' +
    '<label class="fld"><span>메모</span><input class="in" id="eqMemo" placeholder="예: 흰색 12 · 파랑 8"></label>' +
    '</div><button class="btn primary big wide" data-act="eqadd">' + ic('plus') + '장비 등록하기</button>' +
    '<p class="note">' + ic('layers') + '<span>등록한 장비는 「품목」에도 들어가서 견적서에서 바로 골라 쓸 수 있어요.</span></p>' +
    '</section></div></div>';
}

function redrawEquip(root) {
  var r = eqRows();
  var tb = root.querySelector('#eqrows'), cd = root.querySelector('#eqcards'), sm = root.querySelector('.eq-sumcard');
  var bk = root.querySelector('#eqBulk'), pd = root.querySelector('#eqPend');
  if (tb) tb.innerHTML = r.rows;
  if (cd) cd.innerHTML = r.cards;
  if (sm) sm.innerHTML = eqSummary();
  if (bk) bk.innerHTML = eqBulkBar();
  if (pd) { pd.innerHTML = eqPendBar(); pd.hidden = !Object.keys(EQ.pending).length; }
}

function eqEditForm(e) {
  var catOpts = EQUIP_CATS.map(function (c) { return '<option' + (c === e.cat ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  return '<div class="fgrid m-form">' +
    '<label class="fld span2"><span>장비 이름</span><input class="in" id="mName" value="' + esc(e.name) + '"></label>' +
    '<label class="fld"><span>분류</span><select class="in" id="mCat">' + catOpts + '</select></label>' +
    '<label class="fld"><span>규격</span><input class="in" id="mSpec" value="' + esc(e.spec) + '"></label>' +
    '<div class="fld span2"><span>총 보유 수량 <small class="was-l">지금 ' + e.total + '개</small></span>' +
    '<div class="qty-row"><div class="stepper big" data-id="modal"><button class="stp" data-stp="-1" aria-label="1개 줄이기">' + ic('minus') + '</button><input class="in num" id="mTotal" value="' + eqTotal(e) + '" data-orig="' + e.total + '" inputmode="numeric" aria-label="총 보유 수량"><button class="stp" data-stp="1" aria-label="1개 늘리기">' + ic('plus') + '</button></div>' +
    '<div class="qbtns"><button class="pchip" data-qadd="-5">−5</button><button class="pchip" data-qadd="5">+5</button><button class="pchip" data-qadd="10">+10</button></div></div>' +
    '<small class="qdiff" id="mDiff"></small></div>' +
    '<label class="fld"><span>기본 대여 단가 (원)</span><input class="in num" id="mPrice" inputmode="numeric" value="' + Calc.won(e.price) + '"></label>' +
    '<label class="fld"><span>메모</span><input class="in" id="mMemo" value="' + esc(e.memo || '') + '"></label>' +
    '</div>';
}

function eqDiffHint() {
  var t = document.getElementById('mTotal'), d = document.getElementById('mDiff'); if (!t || !d) return;
  var v = Math.max(0, Math.round(Calc.parse(t.value))), o = +t.dataset.orig, k = v - o;
  d.textContent = k === 0 ? '수량은 그대로예요' : (o + '개 → ' + v + '개 (' + (k > 0 ? '+' : '') + k + '개)');
  d.className = 'qdiff' + (k > 0 ? ' up' : k < 0 ? ' down' : '');
}

/* ── 확인 창 (팝업) ── */
var MODAL = { onOk: null, gen: 0 };

function modalBox() {
  return '<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="modal-card">' +
    '<div class="modal-h"><span class="modal-ic" id="mIcon"></span><h3 id="mTitle"></h3></div>' +
    '<div class="modal-body" id="mBody"></div>' +
    '<div class="modal-act"><button class="btn big ghost" data-modal="cancel" id="mCancel">취소</button><button class="btn big primary" data-modal="ok" id="mOk">확인</button></div>' +
    '</div></div>';
}

function openModal(o) {
  var m = document.getElementById('modal'); if (!m) return;
  MODAL.gen++; MODAL.onOk = o.onOk || null;
  m.className = 'modal on ' + (o.tone || 'primary');
  document.getElementById('mIcon').innerHTML = ic(o.icon || 'alert');
  document.getElementById('mTitle').textContent = o.title;
  document.getElementById('mBody').innerHTML = o.body || '';
  var ok = document.getElementById('mOk'), cc = document.getElementById('mCancel');
  ok.textContent = o.ok || '확인';
  ok.className = 'btn big ' + (o.tone === 'danger' ? 'danger' : 'primary');
  cc.textContent = o.cancel || '취소';
  setTimeout(function () { var f = m.querySelector('.modal-body input'); (f || ok).focus(); }, 30);
}

function closeModal() { var m = document.getElementById('modal'); if (m) m.className = 'modal'; MODAL.onOk = null; }

function modalClick(e) {
  var b = e.target.closest('[data-modal]');
  if (e.target.id === 'modal') { closeModal(); return true; }
  if (!b) {
    var q = e.target.closest('[data-qadd]');
    if (q) { var t = document.getElementById('mTotal'); t.value = Math.max(0, Math.round(Calc.parse(t.value)) + (+q.dataset.qadd)); eqDiffHint(); return true; }
    return false;
  }
  if (b.dataset.modal === 'cancel') { closeModal(); return true; }
  var gen = MODAL.gen, fn = MODAL.onOk;
  var keep = fn ? fn() : undefined;
  // 확인을 누른 뒤 다른 확인 창을 열었거나 입력이 잘못됐으면 닫지 않는다
  if (keep !== false && MODAL.gen === gen) closeModal();
  return true;
}

function diffRow(k, a, b) { return '<li><span class="dk">' + k + '</span><s>' + a + '</s>' + ic('arrowRight') + '<b>' + b + '</b></li>'; }
function nameList(arr) {
  var shown = arr.slice(0, 6).map(function (e) { return '<li><b>' + eqLabel(e) + '</b><span>총 ' + e.total + '개</span></li>'; }).join('');
  return '<ul class="mlist">' + shown + (arr.length > 6 ? '<li class="more">외 ' + (arr.length - 6) + '개</li>' : '') + '</ul>';
}

/* ── 장비 관리 버튼 동작 ── */
function eqConfirmDelete(root, arr) {
  openModal({
    tone: 'danger', icon: 'trash', title: arr.length > 1 ? '장비 ' + arr.length + '개를 지울까요?' : '이 장비를 지울까요?',
    body: nameList(arr) + '<p class="mnote">지운 장비는 <b>휴지통에 30일</b> 동안 보관돼요. 이미 만든 문서는 그대로 남지만, 새 견적서에서는 고를 수 없어요.</p>',
    ok: '삭제', onOk: function () {
      arr.forEach(function (e) { var i = EQUIP.indexOf(e); if (i >= 0) EQUIP.splice(i, 1); delete EQ.sel[e.id]; delete EQ.pending[e.id]; });
      redrawEquip(root); toast('장비 ' + arr.length + '개를 휴지통으로 옮겼어요 (시안)');
    }
  });
}

function eqOpenEdit(root, e) {
  openModal({
    icon: 'sliders', title: '장비 수정 — ' + e.name, body: eqEditForm(e), ok: '저장', cancel: '닫기',
    onOk: function () {
      var nm = document.getElementById('mName').value.trim();
      if (!nm) { toast('장비 이름을 넣어 주세요'); return false; }
      var nv = { name: nm, cat: document.getElementById('mCat').value, spec: document.getElementById('mSpec').value.trim(),
        total: Math.max(0, Math.round(Calc.parse(document.getElementById('mTotal').value))),
        price: Calc.parse(document.getElementById('mPrice').value), memo: document.getElementById('mMemo').value.trim() };
      var rows = '';
      if (nv.name !== e.name) rows += diffRow('장비 이름', esc(e.name), esc(nv.name));
      if (nv.cat !== e.cat) rows += diffRow('분류', e.cat, nv.cat);
      if (nv.spec !== e.spec) rows += diffRow('규격', esc(e.spec) || '(없음)', esc(nv.spec) || '(없음)');
      if (nv.total !== e.total) rows += diffRow('총 보유 수량', e.total + '개', nv.total + '개 (' + (nv.total > e.total ? '+' : '') + (nv.total - e.total) + ')');
      if (nv.price !== e.price) rows += diffRow('기본 단가', Calc.won(e.price) + '원', Calc.won(nv.price) + '원');
      if (nv.memo !== (e.memo || '')) rows += diffRow('메모', esc(e.memo) || '(없음)', esc(nv.memo) || '(없음)');
      if (!rows) { toast('바뀐 내용이 없어요'); return; }
      openModal({
        icon: 'check', title: '이대로 고칠까요?', body: '<p class="msub">' + eqLabel(e) + '</p><ul class="mdiff">' + rows + '</ul><p class="mnote">이미 보낸 문서의 금액 · 품목은 바뀌지 않아요.</p>',
        ok: '네, 고칠게요', cancel: '다시 보기', onOk: function () {
          Object.keys(nv).forEach(function (k) { e[k] = nv[k]; });
          delete EQ.pending[e.id];
          redrawEquip(root); toast('「' + e.name + '」을(를) 고쳤어요 (시안)');
        }
      });
    }
  });
  eqDiffHint();
}

function equipClick(ev, root, a) {
  var stp = ev.target.closest('[data-stp]');
  if (stp) {
    var box = stp.closest('.stepper'), inp = box.querySelector('input');
    var n = Math.max(0, Math.round(Calc.parse(inp.value)) + (+stp.dataset.stp)), id = box.dataset.id;
    if (id === 'new') { inp.value = Math.max(1, n); return true; }
    if (id === 'modal') { inp.value = n; eqDiffHint(); return true; }
    var e = eqById(id); if (!e) return true;
    if (n === e.total) delete EQ.pending[id]; else EQ.pending[id] = n;
    redrawEquip(root); return true;
  }
  var dd = ev.target.closest('[data-eqday]'); if (dd) { EQ.day = +dd.dataset.eqday; root.querySelectorAll('[data-eqday]').forEach(function (b) { b.classList.toggle('on', b === dd); }); redrawEquip(root); return true; }
  var cc = ev.target.closest('[data-eqcat]'); if (cc) { EQ.cat = cc.dataset.eqcat; root.querySelectorAll('[data-eqcat]').forEach(function (b) { b.classList.toggle('on', b === cc); }); redrawEquip(root); return true; }
  var ed = ev.target.closest('[data-eqedit]'); if (ed) { var e1 = eqById(ed.dataset.eqedit); if (e1) eqOpenEdit(root, e1); return true; }
  var dl = ev.target.closest('[data-eqdel]'); if (dl) { var e2 = eqById(dl.dataset.eqdel); if (e2) eqConfirmDelete(root, [e2]); return true; }
  if (!a) return false;
  var act = a.dataset.act;
  if (act === 'eqdelsel') { var arr = EQUIP.filter(function (e) { return EQ.sel[e.id]; }); if (arr.length) eqConfirmDelete(root, arr); return true; }
  if (act === 'eqrevert') { EQ.pending = {}; redrawEquip(root); toast('바꾼 수량을 되돌렸어요'); return true; }
  if (act === 'eqsave') {
    var ch = EQUIP.filter(function (e) { return EQ.pending[e.id] !== undefined; });
    if (!ch.length) return true;
    openModal({
      icon: 'check', title: '수량 변경을 저장할까요?',
      body: '<ul class="mdiff">' + ch.map(function (e) { var nv = EQ.pending[e.id]; return diffRow(eqLabel(e), e.total + '개', nv + '개 (' + (nv > e.total ? '+' : '') + (nv - e.total) + ')'); }).join('') + '</ul>',
      ok: '변경 저장', onOk: function () { ch.forEach(function (e) { e.total = EQ.pending[e.id]; }); EQ.pending = {}; redrawEquip(root); toast('장비 ' + ch.length + '개의 수량을 저장했어요 (시안)'); }
    });
    return true;
  }
  if (act === 'eqadd') {
    var nm = root.querySelector('#eqName').value.trim();
    if (!nm) { toast('장비 이름을 넣어 주세요'); root.querySelector('#eqName').focus(); return true; }
    EQUIP.push({ id: 'e' + (EQ.next++), cat: root.querySelector('#eqCat').value, name: nm, spec: root.querySelector('#eqSpec').value.trim(), total: Math.max(1, Math.round(Calc.parse(root.querySelector('#eqTotal').value))), outs: [0, 0, 0], price: Calc.parse(root.querySelector('#eqPrice').value), memo: root.querySelector('#eqMemo').value.trim() });
    ['#eqName', '#eqSpec', '#eqPrice', '#eqMemo'].forEach(function (s) { root.querySelector(s).value = ''; });
    root.querySelector('#eqTotal').value = 1;
    EQ.cat = '전체'; root.querySelectorAll('[data-eqcat]').forEach(function (b) { b.classList.toggle('on', b.dataset.eqcat === '전체'); });
    redrawEquip(root); toast('「' + nm + '」을(를) 장비 목록에 넣었어요 (시안)'); return true;
  }
  return false;
}

function equipChange(ev, root) {
  var t = ev.target;
  if (t.dataset.eqsel) { if (t.checked) EQ.sel[t.dataset.eqsel] = 1; else delete EQ.sel[t.dataset.eqsel]; redrawEquip(root); return; }
  if (t.id === 'eqAll') { eqList().forEach(function (e) { if (t.checked) EQ.sel[e.id] = 1; else delete EQ.sel[e.id]; }); redrawEquip(root); return; }
  var box = t.closest && t.closest('.stepper');
  if (box && box.dataset.id && box.dataset.id !== 'new' && box.dataset.id !== 'modal') {
    var e = eqById(box.dataset.id); if (!e) return;
    var n = Math.max(0, Math.round(Calc.parse(t.value)));
    if (n === e.total) delete EQ.pending[e.id]; else EQ.pending[e.id] = n;
    redrawEquip(root);
  }
}

/* event.js */
// 보완 시안: 행사 한 건 묶음 · 최종 합의금액(P01) · 여러 번 입금(Q02, P03) · 완납 영수증(Q03) · 저장 상태 · 충돌(Q09)
var EVT = {
  name: '2026 가을 별빛축제',
  start: '2026-11-21', end: '2026-11-22', out: '2026-11-20', back: '2026-11-23',
  agreed: 6600000,
  docs: [
    { type: 'quote', no: '견적 261112-01', ver: '처음 견적', status: 'sent', base: false, date: '11/12' },
    { type: 'quote', no: '견적 261112-01-2', ver: '수정 2차 · 계약 기준', status: 'contract', base: true, date: '11/13' },
    { type: 'stmt', no: '명세 261122-01', ver: '', status: 'sent', base: false, date: '11/22' },
    { type: 'inv', no: '청구 261122-01', ver: '', status: 'sent', base: false, date: '11/22' }
  ],
  pays: [
    { date: '2026-11-14', amt: 1000000, method: '계좌이체', memo: '계약금', cancel: false },
    { date: '2026-11-20', amt: 500000, method: '현금', memo: '금액 잘못 적음', cancel: true },
    { date: '2026-11-22', amt: 3000000, method: '계좌이체', memo: '중도금', cancel: false }
  ]
};

// P01: 최종 합의금액(VAT 포함)을 ÷1.1로 다시 나누고, 원래 합계와의 차이를 「끝자리 정리」 한 줄로
function evMoney() {
  var t = Calc.totals({ lines: DOC.lines, vat: DOC.vat });
  var agreed = EVT.agreed || t.total, s, x;
  if (DOC.vat === 'none') { s = agreed; x = 0; } else { s = Math.round(agreed / 1.1); x = agreed - s; }
  var got = EVT.pays.reduce(function (a, p) { return a + (p.cancel ? 0 : p.amt); }, 0);
  return { orig: t, agreed: agreed, supply: s, tax: x, dSupply: s - t.supply, dTax: x - t.tax, disc: agreed - t.total, got: got, left: agreed - got };
}

function evMoneyBox() {
  var m = evMoney();
  var leftTxt = m.left > 0 ? '₩' + Calc.won(m.left) : m.left === 0 ? '완납' : '−₩' + Calc.won(-m.left) + ' <small>(더 받음)</small>';
  return '<div class="evm">' +
    '<div class="evm-row"><span>원래 합계 <small>VAT 포함</small></span><b class="num">₩' + Calc.won(m.orig.total) + '</b></div>' +
    '<div class="evm-row agreed"><label for="evAgreed">최종 합의금액</label><div class="evm-in"><input class="in num" id="evAgreed" inputmode="numeric" value="' + Calc.won(m.agreed) + '"><span>원</span></div></div>' +
    '<div class="evm-row disc"><span>끝자리 정리 <small>자동 계산</small></span><b class="num">' + (m.disc ? '−' + Calc.won(-m.disc) : '0') + '원</b></div>' +
    '<p class="evm-split">문서에는 품목표 맨 아래에 <b>「끝자리 정리」 한 줄</b>로 들어가요 — 공급가액 <b class="num">' + Calc.won(m.dSupply) + '</b> / 세액 <b class="num">' + Calc.won(m.dTax) + '</b>. 품목 단가는 그대로예요.</p>' +
    '<div class="evm-big"><div><span>받은 금액 (누적)</span><b class="num">₩' + Calc.won(m.got) + '</b></div><div class="' + (m.left < 0 ? 'over' : m.left === 0 ? 'done' : '') + '"><span>남은 금액</span><b class="num">' + leftTxt + '</b></div></div>' +
    (m.left < 0 ? '<p class="evm-warn">' + ic('alert') + '<span>더 받은 금액이 있어요. 돌려주면 입금 내역에 <b>「환불 −' + Calc.won(-m.left) + '원」</b>을 한 줄 적어 주세요.</span></p>' : '') +
    '</div>';
}

function evPayRows() {
  return EVT.pays.map(function (p, i) {
    return '<tr class="' + (p.cancel ? 'cancel' : '') + (p.amt < 0 ? ' refund' : '') + '"><td class="num">' + Calc.md(p.date) + '</td><td class="r num"><b>' + (p.amt < 0 ? '−' + Calc.won(-p.amt) : Calc.won(p.amt)) + '원</b></td><td>' + p.method + '</td><td>' + esc(p.memo) + (p.cancel ? ' <span class="schip s-cancel">취소됨</span>' : '') + '</td>' +
      '<td class="c">' + (p.cancel ? '<span class="muted">기록만 남음</span>' : '<button class="btn sm danger-o" data-paycancel="' + i + '">' + ic('x') + '취소 표시</button>') + '</td></tr>';
  }).join('');
}

function evDocs() {
  var m = evMoney(), full = m.left <= 0;
  var rows = EVT.docs.map(function (d) {
    return '<li class="' + (d.base ? 'base' : '') + '">' + typeChip(d.type) + '<span class="evd-no num">' + d.no + '</span><span class="evd-ver">' + (d.ver || '') + '</span>' + statusChip(d.status) + (d.base ? '<span class="evd-base">' + ic('check') + '계약 기준</span>' : '') + '<span class="evd-date num">' + d.date + '</span></li>';
  }).join('');
  return '<ul class="evdocs">' + rows +
    '<li class="rcpt ' + (full ? 'ok' : 'locked') + '">' + typeChip('rcpt') + '<span class="evd-no">완납 영수증</span>' +
    (full ? '<button class="btn sm primary" data-toast>' + ic('plus') + '완납 영수증 만들기</button>' : '<span class="evd-lock">' + ic('lock') + '아직 ' + Calc.won(m.left) + '원 남아서 만들 수 없어요</span>') + '</li></ul>';
}

function eventPage() {
  return '<div class="evpage">' +
    '<section class="card ev-head"><div class="evh-l"><span class="evh-tag">행사 한 건</span><h2>' + EVT.name + '</h2>' +
    '<p>' + esc(DOC.client.name) + ' · ' + esc(DOC.client.person) + '</p></div>' +
    '<dl class="evh-dates"><dt>행사 일정</dt><dd class="num">' + Calc.md(EVT.start) + ' ~ ' + Calc.md(EVT.end) + '</dd><dt>장비 반출 · 반납</dt><dd class="num">' + Calc.md(EVT.out) + ' → ' + Calc.md(EVT.back) + '</dd><dt>과금 일수</dt><dd>품목마다 따로 (일정과 별개)</dd></dl>' +
    '<p class="evh-note">' + ic('layers') + '<span>이 행사의 견적서 · 수정본 · 거래명세서 · 청구서 · 영수증은 <b>하나로 묶여</b> 있어서, 문서를 여러 장 만들어도 매출 · 미수금 · 장비 예약은 <b>한 번만</b> 계산돼요.</span></p></section>' +
    '<div class="ev-cols">' +
    '<section class="card"><div class="card-h"><h2>' + ic('fileText') + '이 행사의 문서</h2><span class="hint">계약 기준은 수정본 중 하나만</span></div>' + evDocs() +
    '<div class="ev-docbtns"><button class="btn" data-toast>' + ic('plus') + '같은 행사로 다른 문서 만들기</button><button class="btn ghost" data-toast>' + ic('copy') + '복사해서 새 거래 만들기 <small>(입금 내역은 안 따라가요)</small></button></div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('won') + '금액 · 입금</h2></div><div id="evMoney">' + evMoneyBox() + '</div></section>' +
    '</div>' +
    '<section class="card"><div class="card-h"><h2>' + ic('list') + '입금 내역</h2><span class="hint">선금 · 중도금 · 잔금을 몇 번이든 적어요. 잘못 적은 건 지우지 않고 「취소 표시」</span></div>' +
    '<div class="tbl-wrap"><table class="tbl evpay"><thead><tr><th>날짜</th><th class="r">금액</th><th>방법</th><th>메모</th><th class="c">관리</th></tr></thead><tbody id="evPays">' + evPayRows() + '</tbody></table></div>' +
    '<div class="evadd"><label class="fld"><span>입금 날짜</span><input class="in" type="date" id="pDate" value="2026-11-28"></label>' +
    '<label class="fld"><span>금액 (환불은 − 붙여서)</span><input class="in num" id="pAmt" inputmode="numeric" placeholder="예: 2,600,000"></label>' +
    '<label class="fld"><span>방법</span><select class="in" id="pMethod"><option>계좌이체</option><option>현금</option><option>카드</option><option>환불</option></select></label>' +
    '<label class="fld"><span>메모</span><input class="in" id="pMemo" placeholder="예: 잔금"></label>' +
    '<button class="btn primary big" data-act="payadd">' + ic('plus') + '입금 추가</button></div>' +
    '<p class="note">' + ic('alert') + '<span>견적서의 「선금 받기」 스위치는 견적서에 <b>예상 선금</b>을 보여 주는 것이고, 실제로 받은 돈은 여기 <b>입금 내역</b>에만 적어요.</span></p></section>' +
    '<div class="ev-cols">' +
    '<section class="card"><div class="card-h"><h2>' + ic('cloud') + '저장 상태</h2><span class="hint">곳마다 따로 보여 줘요 (예시)</span></div><ul class="savest">' +
    '<li class="ok">' + ic('check') + '<b>이 기기</b><span>저장됨 · 방금</span></li>' +
    '<li class="fail">' + ic('alert') + '<b>PC 폴더</b><span>접근 실패 — 폴더 연결이 끊겼어요</span><button class="btn sm" data-toast>다시 시도</button><button class="btn sm ghost" data-toast>폴더 다시 고르기</button></li>' +
    '<li class="off">' + ic('cloud') + '<b>구글 드라이브</b><span>연결 안 됨 (2단계에서 연결)</span></li></ul></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('copy') + '두 기기에서 같이 고쳤을 때</h2><span class="hint">2단계 · 예시</span></div>' +
    '<p class="cf-msg">PC와 아이폰에서 같은 견적서를 따로 고쳤어요. 쓸 것을 골라 주세요. <b>고르지 않은 쪽도 지우지 않고 보관</b>해요.</p>' +
    '<div class="cf"><div class="cf-v">' + ic('monitor') + '<b>PC 수정본</b><span>11/13 14:20 · 의자 250 → 300개</span><button class="btn sm primary" data-toast>이걸로 쓰기</button></div>' +
    '<div class="cf-v">' + ic('phone') + '<b>아이폰 수정본</b><span>11/13 14:35 · 행사 장소 변경</span><button class="btn sm" data-toast>이걸로 쓰기</button></div></div></section>' +
    '</div></div>';
}

function evRedraw(root) {
  var mb = root.querySelector('#evMoney'); if (mb) mb.innerHTML = evMoneyBox();
  var pr = root.querySelector('#evPays'); if (pr) pr.innerHTML = evPayRows();
  var dl = root.querySelector('.evdocs'); if (dl) dl.outerHTML = evDocs();
}

function eventClick(e, root, a) {
  var pc = e.target.closest('[data-paycancel]');
  if (pc) {
    var p = EVT.pays[+pc.dataset.paycancel];
    openModal({ tone: 'danger', icon: 'x', title: '이 입금을 취소로 표시할까요?',
      body: '<ul class="mlist"><li><b>' + Calc.md(p.date) + ' · ' + Calc.won(p.amt) + '원</b><span>' + p.method + '</span></li></ul><p class="mnote">기록은 지우지 않고 「취소됨」으로 남아요. 받은 금액 · 남은 금액이 다시 계산되고, 이미 만든 완납 영수증은 「무효」로 표시돼요.</p>',
      ok: '취소로 표시', onOk: function () { p.cancel = true; evRedraw(root); toast('입금을 취소로 표시했어요 (시안)'); } });
    return true;
  }
  if (a && a.dataset.act === 'payadd') {
    var amt = Calc.parse(root.querySelector('#pAmt').value), neg = /^\s*[-−]/.test(root.querySelector('#pAmt').value);
    if (!amt) { toast('금액을 넣어 주세요'); return true; }
    var method = root.querySelector('#pMethod').value;
    if (neg || method === '환불') amt = -Math.abs(amt);
    EVT.pays.push({ date: root.querySelector('#pDate').value || '2026-11-28', amt: amt, method: method, memo: root.querySelector('#pMemo').value.trim(), cancel: false });
    root.querySelector('#pAmt').value = ''; root.querySelector('#pMemo').value = '';
    evRedraw(root); toast('입금 ' + Calc.won(amt) + '원을 적었어요 (시안)'); return true;
  }
  return false;
}

function eventInput(e, root) {
  if (e.target.id === 'evAgreed') {
    EVT.agreed = Calc.parse(e.target.value);
    var m = evMoney(), box = root.querySelector('#evMoney');
    // 입력 중인 칸은 그대로 두고 나머지 숫자만 다시 그린다
    var tmp = document.createElement('div'); tmp.innerHTML = evMoneyBox();
    box.querySelectorAll('.evm-row.disc, .evm-split, .evm-big, .evm-warn').forEach(function (n) { n.remove(); });
    tmp.querySelectorAll('.evm-row.disc, .evm-split, .evm-big, .evm-warn').forEach(function (n) { box.querySelector('.evm').appendChild(n); });
    var dl = root.querySelector('.evdocs'); if (dl) dl.outerHTML = evDocs();
    return m;
  }
}

/* hub.js */
// 시안 보는 첫 화면 (한눈에 비교 + 시안별 자세히 보기)
var THEMES = {
  a: {
    name: '블루 모던', tag: '시안 A',
    line: '흰 바탕에 스타미디어 파랑으로 선과 버튼만 짚어 주는, 깔끔하고 요즘 느낌의 시안',
    sw: [['#3A83F7', '스타 블루'], ['#172B46', '네이비'], ['#F3F6FB', '바탕'], ['#FFFFFF', '상자']],
    points: ['파랑은 버튼 · 선택된 메뉴 · 합계에만 사용', '얇은 테두리 + 부드러운 그림자로 떠 있는 상자', '문서: 위쪽 파란 띠 + 연한 파랑 표 머리', '여백이 넉넉해 가장 차분하게 읽힘'],
    chosen: true,
    changes: [
      ['장비 수정 · 삭제', '장비마다 <b>수정 · 삭제</b> 버튼, 체크해서 <b>여러 개 한꺼번에 삭제</b>. −+ 로 바꾼 수량은 <b>변경 저장</b>을 눌러야 반영되고, 수정 · 삭제 · 저장 때마다 <b>확인 창</b>이 떠요', 'pc-equip'],
      ['문서 종류 버튼', '새 문서 만들기의 견적서 · 거래명세서 · 납품ㆍ청구서 · 영수증 버튼을 고르면 <b>파란 바탕 + 흰 글자</b>', 'pc-editor'],
      ['단계 버튼 (휴대폰 · 태블릿)', '받는 곳 → 품목 넣기 → 확인 · 보내기 중 고른 단계가 <b>파란 바탕 + 흰 글자</b>. 단계를 옮겨도 문서 종류가 그대로 유지돼요', 'mobile'],
      ['선금(계약금) 켜고 끄기', '처음엔 <b>꺼짐</b>. 「선금 받기」를 켜야 금액을 넣을 수 있고, 끄면 문서에서 <b>선금 · 잔금 줄이 자동으로 빠져요</b>', 'pc-editor'],
      ['요구사항 문서 반영 (일부)', '홈 순서(새 문서 → 최근 문서 → 오늘 챙길 일 → 돈 흐름), 장비 <b>「N개 부족」</b> 표시, 품목 <b>비고</b> 칸, 휴대폰 ②단계에 특이사항, 태블릿 메뉴 이름', 'pc-home']
    ]
  },
  b: {
    name: '트리컬러 포인트', tag: '시안 B',
    line: '개발자(GONYNAS) 로고의 파랑 · 주황 · 민트를 포인트로, 문서 종류마다 색이 달라 한눈에 구분되는 시안',
    sw: [['#2B63F0', '블루'], ['#FF6A3D', '오렌지'], ['#16B985', '민트'], ['#172B46', '네이비']],
    points: ['견적서 = 파랑, 거래명세서 = 민트, 납품ㆍ청구서 = 주황, 영수증 = 네이비', '더 둥근 상자 + 색이 살짝 비치는 그림자', '문서: 위쪽 3색 띠 + 파란 표 머리 + 주황 합계', '메뉴 아이콘도 색 칩이라 찾기 쉬움']
  },
  c: {
    name: '네이비 & 골드', tag: '시안 C', rec: true,
    line: '로고의 남색으로 메뉴와 문서 머리를 잡고, 파랑은 버튼, 금색은 돈과 확인할 일에만 쓰는 추천 시안',
    sw: [['#172B46', '네이비'], ['#3A83F7', '스타 블루'], ['#F2B33D', '골드'], ['#ECF0F6', '바탕']],
    points: ['어두운 남색 메뉴라 글자 대비가 가장 커서 50대 눈에 잘 보임', '금색은 「돈 · 확인할 일」에만 → 어디를 봐야 할지 바로 앎', '겹친 그림자로 세 시안 중 가장 입체적인 상자', '문서: 로고의 기울어진 모양을 남색 머리 띠로 · 관공서 제출용 무게감']
  }
};

var VIEWS = [
  ['pc-home', 'PC 첫 화면'], ['pc-editor', 'PC 문서 작성'], ['pc-event', '행사 · 입금 (보완)'], ['pc-equip', '장비 관리'], ['pc-me', '내 정보 · 업체명 2줄'], ['mobile', '휴대폰 · 태블릿'],
  ['quote', '견적서'], ['stmt', '거래명세서'], ['inv', '납품ㆍ청구서'], ['rcpt', '영수증']
];

function fr(theme, page, extra) { return 'index.html?frame=1&t=' + theme + '&page=' + page + (extra || ''); }

function browserFrame(src, w, h, title) {
  return '<div class="fit" data-w="' + w + '" data-h="' + (h + 38) + '"><div class="fit-inner" style="width:' + w + 'px">' +
    '<div class="browser"><div class="br-bar"><i></i><i></i><i></i><span>스타미디어 견적서 발행기</span></div>' +
    '<iframe src="' + src + '" width="' + w + '" height="' + h + '" loading="lazy" title="' + title + '"></iframe></div></div></div>';
}

function phoneFrame(src, title, label) {
  return '<figure class="dev-cell"><div class="fit" data-w="414" data-h="868" data-max="0.62"><div class="fit-inner" style="width:414px">' +
    '<div class="phone"><span class="notch"></span><iframe src="' + src + '" width="390" height="844" loading="lazy" title="' + title + '"></iframe></div></div></div>' +
    '<figcaption>' + label + '</figcaption></figure>';
}

function tabletFrame(src, title) {
  return '<figure class="dev-cell wide"><div class="fit" data-w="844" data-h="1204" data-max="0.5"><div class="fit-inner" style="width:844px">' +
    '<div class="tablet"><iframe src="' + src + '" width="820" height="1180" loading="lazy" title="' + title + '"></iframe></div></div></div>' +
    '<figcaption>태블릿 (세로) · 첫 화면 — 메뉴가 아이콘 줄로 접혀요</figcaption></figure>';
}

function docFrame(kind, theme, max) {
  return '<div class="fit doc-fit" data-w="794" data-h="auto"' + (max ? ' data-max="' + max + '"' : '') + '><div class="fit-inner" style="width:794px">' + renderDoc(kind, theme) + '</div></div>';
}

function swatches(t) {
  return '<ul class="swatch">' + t.sw.map(function (s) { return '<li><i style="background:' + s[0] + '"></i><span>' + s[1] + '<small>' + s[0] + '</small></span></li>'; }).join('') + '</ul>';
}

function hubHeader(route) {
  var on = function (k) { return route.charAt(0) === k && route !== 'overview'; };
  var nav = '<a href="#a/pc-home" class="' + (on('a') ? 'on' : '') + '"><i class="dotc d-a"></i>시안 A 블루 모던 <em class="sel">선택 · 3차</em></a>' +
    '<a href="#overview" class="' + (route === 'overview' ? 'on' : '') + '">1차 3가지 비교</a>' +
    ['b', 'c'].map(function (k) {
      return '<a href="#' + k + '/pc-home" class="old ' + (on(k) ? 'on' : '') + '"><i class="dotc d-' + k + '"></i>' + THEMES[k].tag + ' ' + THEMES[k].name + ' <small>(1차)</small></a>';
    }).join('');
  return '<header class="hub-top"><div class="hub-in"><img class="hub-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사">' +
    '<div class="hub-tt"><h1>견적서 발행기 디자인 시안 <span>3차</span></h1><p>고르신 <b>시안 A 블루 모던</b>에 3차 수정사항을 반영했어요 — 예시 자료로 채운 화면이에요</p></div>' +
    '<div class="hub-date">2026. 11. 13<br><small>Claude Code 작성</small></div></div>' +
    '<nav class="hub-nav"><div class="hub-in">' + nav + '</div></nav></header>';
}

function overview() {
  var cards = ['a', 'b', 'c'].map(function (k) {
    var t = THEMES[k];
    return '<article class="ov-card ov-' + k + (t.rec ? ' rec' : '') + '">' +
      '<div class="ov-h"><span class="ov-tag">' + t.tag + '</span>' + (t.rec ? '<span class="ov-rec">' + ic('star') + '추천</span>' : '') + '<h2>' + t.name + '</h2><p>' + t.line + '</p>' + swatches(t) + '</div>' +
      '<div class="ov-shot"><h3>프로그램 첫 화면</h3>' + browserFrame(fr(k, 'home'), 1280, 820, t.tag + ' 첫 화면') + '</div>' +
      '<div class="ov-shot"><h3>견적서</h3>' + docFrame('quote', k) + '</div>' +
      '<a class="ov-go" href="#' + k + '/pc-home">' + t.tag + ' 자세히 보기' + ic('arrowRight') + '</a></article>';
  }).join('');
  return '<section class="hub-intro"><div class="hub-in">' +
    '<div class="howto"><h2>보시는 방법</h2><ol>' +
    '<li><b>한눈에 비교</b>에서 세 시안의 분위기를 먼저 봐 주세요.</li>' +
    '<li>위쪽 <b>시안 A · B · C</b>를 누르면 PC 화면, 문서 작성, 휴대폰 · 태블릿, 문서 4가지를 하나씩 볼 수 있어요.</li>' +
    '<li>화면 속 버튼도 눌러 보세요. 품목 숫자를 고치면 미리보기와 합계가 바로 바뀌고, 왼쪽 손잡이로 줄 순서를 바꿀 수 있어요.</li>' +
    '<li><b>섞어서 골라도 돼요.</b> 예: 프로그램 화면은 C, 견적서는 A, 거래명세서는 B.</li></ol>' +
    '<p class="howto-note">' + ic('alert') + '<span>사업자번호 · 계좌 · 도장은 모두 <b>예시</b>예요. 실제 정보는 프로그램을 처음 열 때 한 번 넣어요.</span></p></div>' +
    '</div></section>' +
    '<section class="hub-in ov">' + cards + '</section>';
}

function themeView(k, view) {
  var t = THEMES[k], body = '';
  if (view === 'pc-home') body = '<p class="vh">PC(노트북) 첫 화면 — 새 문서 만들기, 오늘 챙길 일, 이번 달 돈 흐름, 최근 문서를 한 화면에. 화면 안에서 위아래로 넘겨 보세요.</p>' + browserFrame(fr(k, 'home'), 1280, 860, t.tag + ' PC 첫 화면');
  else if (view === 'pc-editor') body = '<p class="vh">PC 문서 작성 — 왼쪽에서 입력하면 오른쪽 A4 미리보기가 바로 바뀌어요. 위쪽에서 문서 종류를 바꿔 보세요.</p>' + browserFrame(fr(k, 'editor'), 1280, 900, t.tag + ' PC 문서 작성');
  else if (view === 'pc-event') body = '<p class="vh">보완 시안 — 행사 한 건에 묶인 문서(계약 기준 수정본 표시), 최종 합의금액과 끝자리 정리, 입금 여러 번 · 취소 표시, 완납해야 만들 수 있는 영수증, 저장 상태 · 충돌 예시. 금액을 바꾸거나 입금을 추가해 보세요.</p>' + browserFrame(fr(k, 'event'), 1280, 900, t.tag + ' 행사 · 입금');
  else if (view === 'pc-equip') body = '<p class="vh">장비 관리 — 천막 · 테이블 같은 장비를 등록하고 총수량을 − + 로 고쳐요. 위쪽에서 날짜를 고르면 그날 나가는 수량과 남는 수량이 바뀌어요. 오른쪽에서 새 장비를 등록해 보세요.</p>' + browserFrame(fr(k, 'equip'), 1280, 900, t.tag + ' 장비 관리');
  else if (view === 'pc-me') body = '<p class="vh">내 정보 · 도장 — 상호(업체명) 칸에서 <b>엔터</b>를 누르면 다음 줄로 넘어가요(2줄까지). 고치는 대로 오른쪽 「문서에 이렇게 보여요」가 바로 바뀌어요. 도장 크기도 조절해 보세요.</p>' + browserFrame(fr(k, 'me'), 1280, 900, t.tag + ' 내 정보');
  else if (view === 'mobile') body = '<p class="vh">아이폰 — 아래 큰 메뉴 5칸(장비 관리 · 내 정보는 「더보기」 안), 문서는 3단계(① 받는 곳 → ② 품목 → ③ 확인 · 보내기)로 만들어요. 각 화면 안에서 눌러 볼 수 있어요.</p>' +
    '<div class="devs">' + phoneFrame(fr(k, 'home'), '휴대폰 첫 화면', '① 첫 화면') + phoneFrame(fr(k, 'editor', '&step=1'), '휴대폰 문서 작성 1단계', '② 문서 만들기 · 받는 곳') +
    phoneFrame(fr(k, 'editor', '&step=2'), '휴대폰 문서 작성 2단계', '③ 품목 넣기 (손잡이로 순서 바꾸기)') + phoneFrame(fr(k, 'editor', '&step=3'), '휴대폰 문서 작성 3단계', '④ 확인 · PDF · 이미지 · 카톡') +
    phoneFrame(fr(k, 'equip'), '휴대폰 장비 관리', '⑤ 장비 관리 (더보기 안)') + phoneFrame(fr(k, 'me'), '휴대폰 내 정보', '⑥ 내 정보 · 업체명 2줄') +
    phoneFrame(fr(k, 'lock'), '휴대폰 잠금 화면', '⑦ 잠금 화면 (숫자 비밀번호)') + '</div>' +
    '<div class="devs">' + tabletFrame(fr(k, 'home'), '태블릿 첫 화면') + '</div>';
  else {
    var notes = {
      quote: '견적서 — 받는 곳 · 행사 정보 · 공급자 표 → 합계금액(한글) → 품목표 → 특이사항과 합계 → 맨 아래 가운데 로고',
      stmt: '거래명세서 — A4 한 장에 2부(공급받는자 / 공급자 보관용), 전잔액 · 입금액 · 잔액, 인수자 서명. 로고는 넣지 않아요.',
      inv: '납품ㆍ청구서 — 견적서 틀에 입금 기한과 입금 계좌 상자를 크게. 선금을 뺀 「이번에 청구하는 금액」을 강조해요.',
      rcpt: '영수증 — 「입금 완료」 문서에서 바로 만들어요. 받은 금액 · 받은 날짜 · 결제 방법 · 「위 금액을 정히 영수합니다」. (확정된 견적서 시안을 따라가요)'
    };
    body = '<p class="vh">' + notes[view] + '</p><div class="paper">' + docFrame(view, k, 1) + '</div>';
  }
  var tabs = VIEWS.map(function (v) { return '<a href="#' + k + '/' + v[0] + '" class="' + (v[0] === view ? 'on' : '') + '">' + v[1] + '</a>'; }).join('');
  var badge = t.chosen ? '<span class="ov-sel">' + ic('check') + '선택한 시안</span>' : (t.rec ? '<span class="ov-rec">' + ic('star') + '1차 추천</span>' : '');
  var changes = t.changes ? '<div class="tv-changes"><h3>' + ic('check') + '3차에서 고친 점 <small>(2차 시안 수정사항 + 최종 요구사항 문서)</small></h3><ol>' + t.changes.map(function (c) {
    return '<li><a href="#' + k + '/' + c[2] + '"><b>' + c[0] + '</b><span>' + c[1] + '</span></a></li>';
  }).join('') + '</ol></div>' : '';
  return '<section class="hub-in tv tv-' + k + '">' +
    '<div class="tv-head"><div><span class="ov-tag">' + t.tag + '</span>' + badge + '<h2>' + t.name + '</h2><p>' + t.line + '</p></div>' + swatches(t) + '</div>' +
    changes +
    '<ul class="tv-points">' + t.points.map(function (p) { return '<li>' + ic('check') + p + '</li>'; }).join('') + '</ul>' +
    '<nav class="tv-tabs" aria-label="보기 고르기">' + tabs + '</nav>' +
    '<div class="tv-body">' + body + '</div></section>';
}

function hubFoot() {
  return '<footer class="hub-foot"><div class="hub-in"><p>2차 시안을 보시고 고칠 점을 알려 주세요. 이대로 좋으면 「확정」이라고만 말씀해 주시면 1단계 코딩을 시작해요.</p>' +
    '<span class="credit-s"><img src="assets/gonynas-logo.jpg" alt="">Developed by <b>GONYNAS</b> · v1.0</span></div></footer>';
}

function renderHub(route) {
  if (route !== 'overview' && !THEMES[route.split('/')[0]]) route = 'a/pc-home';
  var parts = route.split('/'), k = parts[0], v = parts[1] || 'pc-home';
  var main = THEMES[k] ? themeView(k, VIEWS.some(function (x) { return x[0] === v; }) ? v : 'pc-home') : overview();
  return hubHeader(THEMES[k] ? route : 'overview') + '<main class="hub-main">' + main + '</main>' + hubFoot();
}

/* main.js */
// 시작: 주소에 frame=1 이 있으면 프로그램 화면(시안) 하나만, 없으면 시안 보는 첫 화면
function fitAll() {
  document.querySelectorAll('.fit').forEach(function (el) {
    var inner = el.firstElementChild; if (!inner) return;
    var w = +el.dataset.w, max = +(el.dataset.max || 1);
    var avail = el.parentElement.clientWidth || w;
    var s = Math.min(max, avail / w);
    var h = el.dataset.h === 'auto' ? inner.scrollHeight : +el.dataset.h;
    inner.style.transform = 'scale(' + s + ')';
    el.style.width = Math.floor(w * s) + 'px';
    el.style.height = Math.ceil(h * s) + 'px';
  });
}

function boot() {
  var q = new URLSearchParams(location.search);
  var root = document.getElementById('root');
  var resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(fitAll, 80); });

  if (q.get('frame')) {
    var theme = /^[abc]$/.test(q.get('t')) ? q.get('t') : 'a';
    var page = q.get('page') || 'home';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = 'in-app';
    root.innerHTML = renderApp({ theme: theme, page: page === 'lock' ? 'home' : page, step: Math.min(3, Math.max(1, +(q.get('step') || 1))), kind: TYPES[q.get('kind')] ? q.get('kind') : 'quote' });
    bindApp(root);
    if (page === 'lock') openLock();
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    return;
  }

  document.body.className = 'in-hub';
  var last = '';
  var go = function () {
    var route = (location.hash || '#a/pc-home').slice(1);
    root.innerHTML = renderHub(route);
    var themeNow = route.charAt(0);
    if (themeNow !== last.charAt(0) || route === 'overview') window.scrollTo(0, 0);
    last = route;
    fitAll();
    setTimeout(fitAll, 300);
  };
  window.addEventListener('hashchange', go);
  go();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

})();
