// 셋째 묶음 시험: 문서 번호 · 합계 · 선금 · 끝자리 정리 · 쪽 나누기 · 붙여넣기 · 복사
import { pageLimits, serialFor, docNo, newDoc, copyDoc, renumberIfDateChanged, docTotals, depositFromRate, addDays, validUntil, notesList, paginate, parseLinePaste, itemToLine, filterDocs, dateKo } from './docs.mjs';
import { emptyData } from './datafile.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}

console.log('문서 번호 · 날짜');
const docs = [{ id: 'a', type: 'quote', serial: '261115-01' }, { id: 'b', type: 'quote', serial: '261115-02' }, { id: 'c', type: 'inv', serial: '261115-01' }, { id: 'e', type: 'quote', serial: '261114-07' }];
eq('같은 날 · 같은 종류 다음 번호', serialFor(docs, 'quote', '2026-11-15'), '261115-03');
eq('다른 종류는 따로 셈', serialFor(docs, 'inv', '2026-11-15'), '261115-02');
eq('새 날짜는 01부터', serialFor(docs, 'quote', '2026-11-16'), '261116-01');
eq('문서 번호 표시', docNo({ type: 'quote', serial: '261115-03' }), '견적 261115-03');
eq('날짜 더하기 (달 넘김)', addDays('2026-11-25', 15), '2026-12-10');
eq('날짜 더하기 (해 넘김)', addDays('2026-12-20', 15), '2027-01-04');
eq('한글 날짜', dateKo('2026-11-05'), '2026년 11월 5일');

console.log('새 문서 · 복사');
const data = emptyData(); data.docs = docs.slice();
const d = newDoc('quote', data, { today: '2026-11-15', id: 'n1', now: 'T' });
eq('새 견적서 번호', d.serial, '261115-03');
eq('설정의 유효기간 · 부가세 기본값', [d.validDays, d.vat, d.status], [15, 'excl', 'draft']);
eq('유효기간 끝나는 날', validUntil(d), '2026-11-30');
d.lines.push(itemToLine({ id: 'i1', name: '몽골텐트', spec: '5×5m', price: 170000, days: 1, memo: '', taxFree: false }));
data.docs.push(d);
const c = copyDoc(d, data.docs, { today: '2026-11-16', id: 'n2', now: 'T2' });
eq('복사본: 새 번호 · 오늘 날짜 · 작성 중', [c.serial, c.date, c.status, c.id], ['261116-01', '2026-11-16', 'draft', 'n2']);
eq('복사본 줄은 새 id, 내용은 같음', [c.lines[0].id !== d.lines[0].id, c.lines[0].name, c.lines[0].price], [true, '몽골텐트', 170000]);
const c2 = copyDoc(d, data.docs, { today: '2026-11-15', type: 'inv' });
eq('견적서 → 납품ㆍ청구서로 바꿔 만들기', [c2.type, c2.serial], ['inv', '261115-02']);
d.date = '2026-11-20';
eq('날짜를 바꾸면 번호도 그 날짜로', [renumberIfDateChanged(d, data.docs), d.serial], [true, '261120-01']);
eq('같은 날짜면 번호 그대로', renumberIfDateChanged(d, data.docs), false);

console.log('합계 · 선금 · 끝자리 정리');
const q = { vat: 'excl', lines: [{ days: 1, qty: 2, price: 170000 }, { days: 2, qty: 1, price: 800000 }], deposit: { on: false, amount: 0 }, agreed: null };
eq('부가세 별도 합계', docTotals(q).total, 2134000);
q.deposit = { on: true, amount: 500000 };
eq('예상 선금 · 잔금', [docTotals(q).deposit, docTotals(q).balance], [500000, 2134000 - 500000]);
q.deposit = { on: true, amount: 9999999 };
eq('선금은 합계를 넘지 않음', docTotals(q).balance, 0);
q.deposit = { on: false, amount: 500000 };
eq('선금 꺼짐이면 0', docTotals(q).deposit, 0);
eq('선금 30% (원 아래 버림)', depositFromRate(2425285, 0.3), 727585);
q.agreed = 2100000;
const t = docTotals(q);
eq('합의금액 기준 공급가액 · 세액 (÷1.1)', [t.supply, t.tax, t.total], [1909091, 190909, 2100000]);
eq('끝자리 정리 줄 = 합의금액 − 원래 합계', t.adjust.total, 2100000 - 2134000);
q.agreed = '';
eq('합의금액을 비우면 정리 없음', docTotals(q).adjust, null);

console.log('특이사항');
const nd = { type: 'quote', date: '2026-11-15', validDays: 15, notes: { valid: true, bank: true, phrases: ['전기 사용료는 별도입니다.'], text: '설치는 전날 오후\n\n철수는 당일 밤' } };
const me = { bankName: '농협', bankNo: '000-0000-0000-00', holder: '홍길동' };
eq('자동 문구 + 자주 쓰는 문구 + 직접 쓴 줄', notesList(nd, me).map((x) => x.text), ['견적 유효기간은 발행일로부터 15일입니다. (2026년 11월 30일까지)', '결제 계좌 : 농협 000-0000-0000-00 (예금주 홍길동)', '전기 사용료는 별도입니다.', '설치는 전날 오후', '철수는 당일 밤']);
eq('계좌가 없으면 계좌 문구 없음', notesList({ ...nd, notes: { valid: false, bank: true } }, {}).length, 0);

console.log('쪽 나누기');
eq('12줄 이하는 한 장', paginate(12), [[0, 12]]);
eq('15줄은 두 장 (둘째 쪽에도 1줄 이상)', paginate(15), [[0, 14], [14, 15]]);
eq('특이사항 6개 + 끝자리 정리면 한 장 줄 수가 줄어듦', pageLimits(6, true).single, 9);
eq('특이사항 3개 이하 · 정리 없음이면 그대로', pageLimits(3, false).single, 12);
eq('30줄: 20 + 10', paginate(30), [[0, 20], [20, 30]]);
eq('45줄: 20 + 13 + 12', paginate(45), [[0, 20], [20, 33], [33, 45]]);
eq('90줄: 20 + 30 + 30 + 10', paginate(90), [[0, 20], [20, 50], [50, 80], [80, 90]]);
const pg = paginate(77); eq('모든 줄이 빠짐없이 한 번씩', pg.reduce((s, [a, b]) => s + b - a, 0), 77);

console.log('엑셀 붙여넣기 (문서 줄)');
const p1 = parseLinePaste('품목\t규격\t수량\t단위\t단가\t금액\n몽골텐트\t5×5m\t2\t동\t170,000\t340,000\n합계\t\t\t\t\t340,000');
eq('머리글 순서대로 · 단위 · 금액 칸 무시 · 합계 줄 제외', [p1.header, p1.rows, p1.skipped], [true, [{ name: '몽골텐트', spec: '5×5m', days: 1, qty: 2, price: 170000, memo: '' }], 1]);
const p2 = parseLinePaste('무대 트러스\t6m\t2\t1\t1200000\n음향\t\t1\t1\t800000\t기본');
eq('머리글 없이 5칸 · 6칸', p2.rows.map((r) => [r.name, r.days, r.qty, r.price, r.memo]), [['무대 트러스', 2, 1, 1200000, ''], ['음향', 1, 1, 800000, '기본']]);
eq('2칸: 품목 · 단가', parseLinePaste('발전차\t1,000,000원').rows[0].price, 1000000);

console.log('발행 목록 거르기');
const list = [{ id: 1, type: 'quote', serial: '261115-01', client: { name: '○○군청', person: '김주무관' }, event: { name: '가을축제' }, lines: [{ name: '몽골텐트' }], updatedAt: '2026-11-15T01' },
  { id: 2, type: 'inv', serial: '261115-01', client: { name: '한빛건설' }, event: { name: '준공식' }, lines: [], updatedAt: '2026-11-15T02' }];
eq('최근 고친 순', filterDocs(list).map((x) => x.id), [2, 1]);
eq('담당자 이름으로 찾기', filterDocs(list, { q: '김주무관' }).map((x) => x.id), [1]);
eq('품목 이름으로 찾기', filterDocs(list, { q: '몽골' }).map((x) => x.id), [1]);
eq('종류로 거르기', filterDocs(list, { type: 'inv' }).map((x) => x.id), [2]);
eq('상태로 거르기 (상태 없으면 작성 중)', [filterDocs([{ ...list[0], status: 'sent' }, list[1]], { status: 'sent' }).map((x) => x.id), filterDocs(list, { status: 'draft' }).map((x) => x.id)], [[1], [2, 1]]);

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
if (fail) process.exit(1);
