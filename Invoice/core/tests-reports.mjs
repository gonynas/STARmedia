// 1.0 완성본 시험: 매출 · 미수금 · 장비 부족 · 달력 · 오늘 챙길 일 · 휴지통 · 잠금
import { isContracted, salesByMonth, salesByClient, receivables, yearSummary, salesYears, usageOn, gearShortage, equipmentOn, equipState, monthGrid, undatedEvents, todo, purgeTrash, daysLeft, gearRange } from './reports.mjs';
import { validPin, makeLock, checkPin, canResetWith, shouldAutoLock } from './lock.mjs';
import { eventFromDoc, newPayment } from './events.mjs';
import { newDoc, newLine } from './docs.mjs';
import { emptyData } from './datafile.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}

const data = emptyData();
function quote(id, date, client, price, status = 'draft') {
  const q = newDoc('quote', data, { today: date, id, now: date + 'T01' });
  q.client = { name: client, person: '', tel: '', email: '', bizNo: '', addr: '' };
  q.event = { name: client + ' 행사', date: '', place: '' };
  q.lines = [newLine({ name: '텐트', qty: 1, price })];   // 부가세 별도 → 합계 = price × 1.1
  q.status = status; data.docs.push(q); return q;
}
function event(q, id, start, end) { const e = eventFromDoc(q, { id, now: q.date + 'T01' }); e.start = start; e.end = end; q.eventId = id; data.events.push(e); return e; }

// 행사 A: 계약(문서 상태), 11월, 1,100,000 · 입금 500,000 → 미수 600,000, 청구서 기한 11/10 지남
const qa = quote('qa', '2026-11-01', '○○군청', 1000000, 'contract');
const ea = event(qa, 'ea', '2026-11-21', '2026-11-22');
data.payments.push(newPayment('ea', { date: '2026-11-05', amount: 500000 }, { id: 'p1', now: '2026-11-05T01' }));
const inv = newDoc('inv', data, { today: '2026-11-03', id: 'ia', now: '2026-11-03T01' }); inv.eventId = 'ea'; inv.dueDate = '2026-11-10'; data.docs.push(inv);
// 행사 B: 견적만(작성 중), 입금 없음 → 매출 아님
const qb = quote('qb', '2026-11-02', '한빛건설', 2000000, 'draft');
event(qb, 'eb', '2026-11-28', '2026-11-28');
// 행사 C: 상태는 보냄이지만 입금 있음 → 계약으로 봄, 12월, 완납
const qc = quote('qc', '2026-11-04', '○○군청', 300000, 'sent');
event(qc, 'ec', '2026-12-05', '');
data.payments.push(newPayment('ec', { date: '2026-11-20', amount: 330000 }, { id: 'p2', now: '2026-11-20T01' }));
// 행사로 안 묶은 계약 문서 D: 10월 220,000
quote('qd', '2026-10-10', '농협', 200000, 'contract');
// 취소 표시한 입금은 세지 않음
data.payments.push(Object.assign(newPayment('ea', { date: '2026-11-06', amount: 999 }, { id: 'p3', now: '2026-11-06T01' }), { cancelled: true }));

console.log('매출 · 미수금');
eq('계약 상태 문서 → 계약된 행사', isContracted(ea, data), true);
eq('견적만 있는 행사 → 아직 계약 아님', isContracted(data.events[1], data), false);
eq('입금이 있으면 계약으로 봄', isContracted(data.events[2], data), true);
const ms = salesByMonth(data, 2026);
eq('10월 매출 = 묶지 않은 계약 문서', ms[9].sales, 220000);
eq('11월 매출 = 행사 A (시작일 기준)', ms[10].sales, 1100000);
eq('12월 매출 = 행사 C', ms[11].sales, 330000);
eq('11월 받은 돈 = 입금일 기준, 취소 표시 제외', ms[10].received, 830000);
const cl = salesByClient(data, 2026);
eq('거래처별: ○○군청 2건 합계', [cl[0].name, cl[0].count, cl[0].sales, cl[0].remaining], ['○○군청', 2, 1430000, 600000]);
const rec = receivables(data, '2026-11-15');
eq('미수금은 남은 돈 있는 계약 행사만', rec.map((r) => [r.event.id, r.remaining, r.due, r.overdue]), [['ea', 600000, '2026-11-10', true]]);
const ys = yearSummary(data, 2026, '2026-11-15');
eq('한 해 요약', [ys.sales, ys.received, ys.remaining, ys.overdue, ys.pendingCount, ys.pendingTotal], [1650000, 830000, 600000, 600000, 1, 2200000]);
eq('매출 있는 해 목록(올해 포함)', salesYears(data, '2027-01-02'), ['2027', '2026']);
data.events[0].status = 'cancel';
eq('취소한 행사는 매출 · 미수금에서 빠짐', [salesByMonth(data, 2026)[10].sales, receivables(data, '2026-11-15').length], [0, 0]);
data.events[0].status = 'active';

console.log('장비');
data.equipment.push({ id: 'g1', name: '난로', total: 10 }, { id: 'g2', name: '몽골텐트', total: 5 });
ea.gear = [{ equipId: 'g1', qty: 6 }, { equipId: 'g2', qty: 2 }];
ea.out = '2026-11-20'; ea.back = '2026-11-23';
const eb = data.events[1]; eb.gear = [{ equipId: 'g1', qty: 6 }];          // 11/28 하루
const ec = data.events[2]; ec.gear = [{ equipId: 'g1', qty: 7 }]; ec.start = '2026-11-22'; ec.end = '2026-11-22';  // A와 22일 겹침
eq('반출 · 반납 기간 = 따로 정한 날짜', gearRange(ea), ['2026-11-20', '2026-11-23']);
eq('반출 날짜가 없으면 행사 날짜', gearRange(eb), ['2026-11-28', '2026-11-28']);
eq('반출일(20일)에도 나가 있음', usageOn(data, 'g1', '2026-11-20'), 6);
eq('겹치는 날(22일) 합계', usageOn(data, 'g1', '2026-11-22'), 13);
eq('부족: 「3개 부족」 (가장 모자란 날)', gearShortage(ea, data), [{ equipId: 'g1', name: '난로', short: 3, day: '2026-11-22' }]);
eq('겹치지 않는 행사는 부족 없음', gearShortage(eb, data), []);
const on22 = equipmentOn(data, '2026-11-22');
eq('그날 장비별 남음(음수 = 부족)', on22.map((x) => [x.equip.name, x.out, x.left]), [['난로', 13, -3], ['몽골텐트', 2, 3]]);
eq('상태 낱말', [equipState(10, -3)[1], equipState(10, 0)[1], equipState(10, 1)[1], equipState(10, 5)[1]], ['3개 부족', '모두 나감', '얼마 안 남음', '넉넉함']);
ec.status = 'cancel';
eq('취소한 행사의 장비는 세지 않음', [usageOn(data, 'g1', '2026-11-22'), gearShortage(ea, data).length], [6, 0]);
ec.status = 'active';

console.log('달력');
const g = monthGrid(data, 2026, 11);
eq('11월 1일은 일요일 → 첫 칸', g[0][0].day, '2026-11-01');
const c21 = g.flat().find((c) => c && c.day === '2026-11-21');
eq('21일 칸에 행사 A', c21.events.map((e) => e.id), ['ea']);
const c22 = g.flat().find((c) => c && c.day === '2026-11-22');
eq('22일: 행사 2개 · 장비 15개 나감 · 부족 표시', [c22.events.map((e) => e.id).sort(), c22.gearOut, c22.short], [['ea', 'ec'], 15, true]);
eq('주마다 7칸', g.every((w) => w.length === 7), true);
eq('날짜 없는 행사 목록', undatedEvents({ events: [{ id: 'x', status: 'active', start: '' }, { id: 'y', status: 'cancel', start: '' }] }).map((e) => e.id), ['x']);

console.log('오늘 챙길 일');
const t = todo(data, '2026-11-15');
eq('유효기간 3일 안에 끝나는 견적 (한빛건설 11/17까지)', t.expiring.map((x) => [x.doc.id, x.until]), [['qb', '2026-11-17']]);
eq('입금 기한 지난 청구', t.overdue.map((r) => r.event.id), ['ea']);
eq('이번 주(7일 안) 행사', t.week.map((e) => e.id), ['ea', 'ec']);
eq('장비 모자란 행사', t.short.map((x) => x.event.id).sort(), ['ea', 'ec']);

console.log('휴지통');
const trash = [{ kind: 'doc', item: { id: 'a' }, deletedAt: '2026-10-01T00:00:00.000Z' }, { kind: 'doc', item: { id: 'b' }, deletedAt: '2026-11-10T00:00:00.000Z' }];
eq('30일 지난 것은 비움', purgeTrash(trash, '2026-11-15T00:00:00.000Z').map((x) => x.item.id), ['b']);
eq('남은 날수', daysLeft(trash[1], '2026-11-15T00:00:00.000Z'), 25);

console.log('잠금');
eq('비밀번호는 숫자 4~6자리', [validPin('123'), validPin('1234'), validPin('123456'), validPin('1234567'), validPin('12a4')], [false, true, true, false, false]);
const lk = await makeLock('2580', '2026-11-15T00');
eq('비밀번호 자체는 저장하지 않음', JSON.stringify(lk).includes('2580'), false);
eq('맞는 비밀번호', await checkPin(lk, '2580'), true);
eq('틀린 비밀번호', await checkPin(lk, '0000'), false);
eq('잊었을 때: 사업자등록번호가 맞으면 다시 정함', [canResetWith({ bizNo: '123-45-67890' }, '1234567890'), canResetWith({ bizNo: '123-45-67890' }, '1234567891'), canResetWith({ bizNo: '' }, '')], [true, false, false]);
eq('5분 지나면 자동 잠금, 0이면 끔', [shouldAutoLock(0, 5 * 60000, 5), shouldAutoLock(0, 4 * 60000, 5), shouldAutoLock(0, 99 * 60000, 0)], [true, false, false]);

console.log(`\n매출 · 장비 · 잠금 시험: ${pass}개 통과, ${fail}개 실패`);
if (fail) process.exit(1);
