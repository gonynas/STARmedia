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
