// 넷째 묶음 시험: 행사 묶음 · 계약 기준 · 입금 여러 번 · 취소 표시 · 환불 · 완납 영수증 · 바꿔 만들기 · 수정본
import { eventFromDoc, blankEvent, baseDoc, eventMoney, parsePayment, newPayment, convertDoc, reviseDoc, receiptFor, receiptValid, docMoney, eventDateText, filterEvents, applyTypeDefaults } from './events.mjs';
import { newDoc, newLine, docNo, notesList } from './docs.mjs';
import { emptyData } from './datafile.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}

const data = emptyData();
const q = newDoc('quote', data, { today: '2026-11-12', id: 'q1', now: '2026-11-12T01' });
q.client = { name: '○○군청', person: '김주무관', tel: '010', email: '', bizNo: '', addr: '' };
q.event = { name: '가을 별빛축제', date: '11월 21일', place: '○○공원' };
q.lines = [newLine({ name: '몽골텐트', qty: 10, price: 170000 }), newLine({ name: '음향', price: 800000 })];   // 2,500,000 + 10% = 2,750,000
data.docs.push(q);

console.log('행사 묶음');
const e = eventFromDoc(q, { id: 'e1', now: '2026-11-12T01' });
q.eventId = e.id; data.events.push(e);
eq('문서의 행사명 · 받는 곳으로 행사 만들기', [e.name, e.client.name, e.place, e.baseDocId], ['가을 별빛축제', '○○군청', '○○공원', 'q1']);
eq('행사 이름이 없으면 「받는 곳 + 행사」', eventFromDoc({ client: { name: '한빛건설' }, event: {} }).name, '한빛건설 행사');
eq('행사 일정 글자', eventDateText({ start: '2026-11-21', end: '2026-11-22' }), '11월 21일 ~ 11월 22일');
eq('계약 기준 = 정해 둔 문서', baseDoc(e, data.docs).id, 'q1');
eq('계약 금액', eventMoney(e, data).total, 2750000);
eq('입금 없음 → 미입금', eventMoney(e, data).state, 'unpaid');

console.log('수정본 · 바꿔 만들기');
const r2 = reviseDoc(q, data, { today: '2026-11-13', id: 'q2', now: '2026-11-13T01' });
r2.agreed = 2700000; data.docs.push(r2);
eq('수정본 번호: 같은 번호 -2', docNo(r2), '견적 261112-01-2');
eq('수정본도 같은 행사', r2.eventId, 'e1');
e.baseDocId = 'q2';
eq('계약 기준을 수정본으로 → 합의금액 기준', eventMoney(e, data).total, 2700000);
const st = convertDoc(r2, 'stmt', data, { today: '2026-11-22', id: 's1', now: '2026-11-22T01' }); data.docs.push(st);
eq('거래명세서로 바꿔 만들기: 번호 · 거래일자 · 2부 · 같은 행사', [docNo(st), st.tradeDate, st.copies, st.eventId], ['명세 261122-01', '2026-11-22', 2, 'e1']);
const iv = convertDoc(r2, 'inv', data, { today: '2026-11-22', id: 'i1', now: '2026-11-22T02' }); data.docs.push(iv);
eq('청구서: 입금 기한 = 오늘 + 14일', [docNo(iv), iv.dueDate], ['청구 261122-01', '2026-12-06']);
eq('청구서 특이사항: 입금 기한 문구, 계좌 문구는 넣지 않음(계좌 상자가 따로)', notesList(iv, { bankName: '농협', bankNo: '1' }).map((x) => x.auto), ['due']);
eq('계약 기준 문서는 영수증이 아닌 정해 둔 문서', baseDoc(e, data.docs).id, 'q2');

console.log('입금 여러 번 · 취소 표시 · 환불');
eq('금액 읽기', parsePayment('1,000,000', '계좌이체'), 1000000);
eq('− 를 붙이면 환불(음수)', parsePayment('−5,000', '계좌이체'), -5000);
eq('방법이 환불이면 음수', parsePayment('5000', '환불'), -5000);
eq('빈 금액은 못 넣음', parsePayment('', '현금'), null);
data.payments.push(newPayment('e1', { date: '2026-11-14', amount: 1000000, memo: '계약금' }, { id: 'p1', now: 'a' }));
data.payments.push(newPayment('e1', { date: '2026-11-20', amount: 500000, method: '현금' }, { id: 'p2', now: 'b' }));
eq('일부 입금', [eventMoney(e, data).received, eventMoney(e, data).remaining, eventMoney(e, data).state], [1500000, 1200000, 'partial']);
eq('완납 전에는 영수증을 못 만듦', receiptFor(e, data).ok, false);
data.payments.find((p) => p.id === 'p2').cancelled = true;
eq('취소 표시한 입금은 빼고 셈 (기록은 남음)', [eventMoney(e, data).received, data.payments.length], [1000000, 2]);
data.payments.push(newPayment('e1', { date: '2026-11-22', amount: 1705000 }, { id: 'p3', now: 'c' }));
eq('더 받음 → 남은 금액 음수', [eventMoney(e, data).remaining, eventMoney(e, data).state, eventMoney(e, data).overpaid], [-5000, 'overpaid', 5000]);
eq('더 받은 상태에서는 영수증 못 만듦 (먼저 환불)', receiptFor(e, data).reason, 'overpaid');
data.payments.push(newPayment('e1', { date: '2026-11-23', amount: -5000, method: '환불' }, { id: 'p4', now: 'd' }));
eq('환불을 적으면 완납', eventMoney(e, data).state, 'paid');

console.log('완납 영수증');
const rc = receiptFor(e, data, { today: '2026-11-23', id: 'r1', now: '2026-11-23T01' });
eq('영수증: 번호 · 받은 날짜(마지막 입금) · 방법 · 관련 문서', [rc.ok, docNo(rc.doc), rc.doc.paidDate, rc.doc.payMethod, rc.doc.baseLabel], [true, '영수 261123-01', '2026-11-22', '계좌이체', '견적 261112-01-2']);
data.docs.push(rc.doc);
eq('영수증은 계약 기준이 되지 않음', baseDoc(e, data.docs).id, 'q2');
eq('영수증 유효', receiptValid(rc.doc, data), true);
eq('문서에 보일 받은 금액 · 남은 금액', [docMoney(iv, data).received, docMoney(iv, data).remaining], [2700000, 0]);
data.payments.find((p) => p.id === 'p3').cancelled = true;
eq('입금을 취소해 완납이 깨지면 영수증 「무효」', receiptValid(rc.doc, data), false);

console.log('계약 취소');
e.status = 'cancel';
eq('취소하면 돌려줄 금액 = 받은 금액', [eventMoney(e, data).state, eventMoney(e, data).refund], ['cancel', 995000]);

console.log('목록');
const e2 = blankEvent({ name: '송년회', clientName: '○○리조트' }, { id: 'e2', now: '2026-11-30' });
eq('진행 중인 행사 먼저', filterEvents([e, e2]).map((x) => x.id), ['e2', 'e1']);
eq('받는 곳으로 찾기', filterEvents([e, e2], '리조트').map((x) => x.id), ['e2']);
eq('기본 칸: 영수증 받은 날짜 · 방법', (() => { const d = applyTypeDefaults({ type: 'rcpt' }, data, '2026-12-01'); return [d.paidDate, d.payMethod]; })(), ['2026-12-01', '계좌이체']);

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
if (fail) process.exit(1);
