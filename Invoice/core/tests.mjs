// 1단계 핵심 시험: 최종확정 v1.0의 T 항목 + 업데이트 시험(U01~U03)
// 실행: npm test  (빌드할 때도 먼저 실행된다)
import { lineAmount, itemsTotal, settle, ledger, canIssueReceipt, refundOnCancel, hangul } from './money.mjs';
import { emptyData, wrap, load, CURRENT_SCHEMA } from './datafile.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}

console.log('금액 계산');
// T03: 2일 × 3개 × 100,000원, 부가세 별도
eq('T03 공급가액·세액·합계', itemsTotal([{ days: 2, qty: 3, price: 100000 }], 'excl'), { supply: 600000, tax: 60000, total: 660000 });
// P02: 0.5일 × 1개 × 101원 = 50원 (원 아래 버림)
eq('P02 소수 일수 원 아래 버림', lineAmount({ days: 0.5, qty: 1, price: 101 }), 50);
eq('P02 부동소수 오차 방지 (0.1일×3×1000)', lineAmount({ days: 0.1, qty: 3, price: 1000 }), 300);
eq('부가세 포함 (110,000 → 100,000 + 10,000)', itemsTotal([{ days: 1, qty: 1, price: 110000 }], 'incl'), { supply: 100000, tax: 10000, total: 110000 });
eq('부가세 없음', itemsTotal([{ days: 1, qty: 2, price: 50000 }], 'none'), { supply: 100000, tax: 0, total: 100000 });
eq('면세 품목은 세액 0', itemsTotal([{ days: 1, qty: 1, price: 100000 }, { days: 1, qty: 1, price: 30000, taxFree: true }], 'excl'), { supply: 130000, tax: 10000, total: 140000 });

// T06 · P01: 합의금액 2,400,000 → 공급가액 2,181,818 + 세액 218,182, 차이는 끝자리 정리 한 줄
const lines = [{ days: 1, qty: 1, price: 1000000 }, { days: 1, qty: 1, price: 1204800 }];
const st = settle(lines, 'excl', 2400000);
eq('T06 원래 합계', st.base.total, 2425280);
eq('T06 최종 공급가액·세액·합계', st.final, { supply: 2181818, tax: 218182, total: 2400000 });
eq('T06 끝자리 정리 줄 = 최종 − 원래', st.adjust.total, 2400000 - 2425280);
eq('T06 정리 줄의 공급가액+세액 = 정리 합계', st.adjust.supply + st.adjust.tax, st.adjust.total);
eq('P01 부가세 없음이면 공급가액만 차감', settle([{ days: 1, qty: 1, price: 2425300 }], 'none', 2400000).adjust, { supply: -25300, tax: 0, total: -25300 });
eq('합의금액을 안 넣으면 정리 없음', settle(lines, 'excl', null).adjust, null);

console.log('입금 · 영수증');
// T04: T03 행사(660,000)에 100,000 + 200,000 입금 → 누적 300,000, 잔금 360,000
const p1 = [{ amount: 100000 }, { amount: 200000 }];
eq('T04 누적 입금과 잔금', [ledger(660000, p1).received, ledger(660000, p1).remaining], [300000, 360000]);
// T05: 미완납이면 완납 영수증 불가, 잔금 입금 후 가능
eq('T05 미완납이면 영수증 불가', canIssueReceipt(660000, p1).ok, false);
eq('T05 완납하면 영수증 가능', canIssueReceipt(660000, [...p1, { amount: 360000 }]).ok, true);
// P03
eq('P03 취소 표시한 입금은 빼고 계산', ledger(660000, [{ amount: 660000, cancelled: true }, { amount: 100000 }]).received, 100000);
const over = ledger(660000, [{ amount: 665000 }]);
eq('P03 더 받으면 음수 잔금(숨기지 않음)', [over.remaining, over.state, over.overpaid], [-5000, 'overpaid', 5000]);
eq('P03 더 받은 상태면 영수증 대신 환불 먼저', canIssueReceipt(660000, [{ amount: 665000 }]).reason, 'overpaid');
eq('P03 환불(음수) 적으면 완납', ledger(660000, [{ amount: 665000 }, { amount: -5000, method: '환불' }]).state, 'paid');
eq('P03 계약 취소 시 돌려줄 금액', refundOnCancel([{ amount: 300000 }, { amount: 50000, cancelled: true }]), 300000);
eq('한글 금액', hangul(6622000), '육백육십이만이천');

console.log('업데이트 · 자료 보존');
const v1 = wrap({ ...emptyData(), docs: [{ id: 'd1', type: 'quote' }], payments: [{ id: 'p1', amount: 100000 }] }, '1.0.0', '2026-11-14T00:00:00Z');
// 같은 형식: 그대로 열림
eq('현재 형식 파일은 그대로 열림', load(JSON.stringify(v1)).migrated, false);
// U01/U02: 옛 형식(1) 파일을 새 형식(2) 프로그램이 열면 자동 변환 + 변환 전 자동 백업
const backups = [];
const migrations = { 1: (d) => ({ ...d, settings: { ...d.settings, startPage: 'home' }, docs: d.docs.map((x) => ({ ...x, venue: x.venue || '' })) }) };
const r = load(JSON.stringify(v1), { migrations, target: 2, backup: (env) => backups.push(env) });
eq('U01 자동 변환됨 (1 → 2)', [r.ok, r.migrated, r.from, r.schema], [true, true, 1, 2]);
eq('U01 기존 문서 · 입금 그대로', [r.data.docs.length, r.data.payments[0].amount], [1, 100000]);
eq('U01 새 칸은 기본값으로 추가', [r.data.docs[0].venue, r.data.settings.startPage], ['', 'home']);
eq('U01 변환 직전 원본 백업이 1개 생김', [backups.length, backups[0].schema], [1, 1]);
// U03: 변환이 실패하면 원본을 그대로 돌려줌
const bad = load(JSON.stringify(v1), { migrations: { 1: () => { throw new Error('test'); } }, target: 2 });
eq('U03 변환 실패 시 원본 보존', [bad.ok, bad.reason, bad.original.data.docs.length], [false, 'migration-failed', 1]);
// 더 새 버전 파일은 막음
eq('미래 버전 파일은 열지 않음', load(JSON.stringify({ ...v1, schema: CURRENT_SCHEMA + 5 })).reason, 'newer-version');
eq('다른 프로그램 파일은 거부', load('{"hello":1}').reason, 'not-our-file');
eq('깨진 파일은 거부', load('{broken').reason, 'broken-file');

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
if (fail) process.exit(1);
