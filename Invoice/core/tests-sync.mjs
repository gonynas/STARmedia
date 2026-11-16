// v1.2.0 시험: PC ↔ 휴대폰 자료 합치기 (세 갈래)
import { mergeList, mergeObject, mergeData } from './sync.mjs';
import { emptyData } from './datafile.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}
const doc = (id, t, extra = {}) => ({ id, updatedAt: t, ...extra });
const ids = (a) => a.map((x) => x.id + (x.v ? ':' + x.v : ''));

console.log('목록 합치기');
const base = [doc('a', '1', { v: 1 }), doc('b', '1', { v: 1 }), doc('c', '1', { v: 1 })];
eq('아무도 안 바꿈 → 그대로', ids(mergeList('docs', base, base, base)), ['a:1', 'b:1', 'c:1']);
eq('휴대폰에서 새 문서 → PC에도 생김', ids(mergeList('docs', base, base, [...base, doc('d', '2', { v: 1 })])), ['a:1', 'b:1', 'c:1', 'd:1']);
eq('PC · 휴대폰 둘 다 새 문서 → 둘 다 남음', ids(mergeList('docs', base, [...base, doc('p', '2')], [...base, doc('m', '2')])), ['a:1', 'b:1', 'c:1', 'p', 'm']);
eq('한쪽만 고침 → 고친 쪽', ids(mergeList('docs', base, base, [doc('a', '2', { v: 2 }), base[1], base[2]])), ['a:2', 'b:1', 'c:1']);
eq('둘 다 고침 → 나중에 고친 쪽', ids(mergeList('docs', base, [doc('a', '3', { v: 3 }), base[1], base[2]], [doc('a', '2', { v: 2 }), base[1], base[2]])), ['a:3', 'b:1', 'c:1']);
eq('둘 다 고침(휴대폰이 나중) → 휴대폰 것', ids(mergeList('docs', base, [doc('a', '2', { v: 2 }), base[1], base[2]], [doc('a', '4', { v: 4 }), base[1], base[2]])), ['a:4', 'b:1', 'c:1']);
eq('휴대폰에서 지움 + PC는 그대로 → 지워짐', ids(mergeList('docs', base, base, [base[0], base[2]])), ['a:1', 'c:1']);
eq('PC에서 지움 + 휴대폰은 그대로 → 지워짐', ids(mergeList('docs', base, [base[1], base[2]], base)), ['b:1', 'c:1']);
eq('휴대폰에서 지웠지만 PC가 그 사이 고침 → 남김(자료 안 잃음)', ids(mergeList('docs', base, [doc('a', '2', { v: 2 }), base[1], base[2]], [base[1], base[2]])), ['a:2', 'b:1', 'c:1']);
eq('처음 연결(base 없음) → 양쪽 다 남김', ids(mergeList('docs', null, [doc('a', '1')], [doc('b', '1')])), ['a', 'b']);
const tr = [{ kind: 'doc', item: { id: 'x' }, deletedAt: '5' }];
eq('휴지통은 종류+id 로 비교', mergeList('trash', [], tr, [{ kind: 'client', item: { id: 'x' }, deletedAt: '6' }]).length, 2);

console.log('내 정보 · 설정');
eq('칸마다: 휴대폰이 전화번호, PC가 주소를 고침 → 둘 다', mergeObject({ tel: '1', addr: 'A' }, { tel: '1', addr: 'B' }, { tel: '2', addr: 'A' }), { tel: '1', addr: 'B' } && { tel: '2', addr: 'B' });
eq('같은 칸을 둘 다 고침 → 이 기기 것', mergeObject({ tel: '1' }, { tel: 'PC' }, { tel: '폰' }), { tel: 'PC' });
eq('글자 크게 · 자동 잠금 시간은 기기마다 따로', mergeObject({}, { bigText: true, autoLockMin: 5, vat: 'excl' }, { bigText: false, autoLockMin: 1, vat: 'incl' }, ['bigText', 'autoLockMin']), { bigText: true, autoLockMin: 5, vat: 'excl' });
const pcLock = { salt: 's', hash: 'h', len: 6 };
eq('잠금 비밀번호는 PC → 휴대폰으로 맞춤 (휴대폰이 아직 없을 때)', mergeData(emptyData(), Object.assign(emptyData(), {}), Object.assign(emptyData(), { settings: { ...emptyData().settings, lock: pcLock } })).settings.lock, pcLock);

console.log('자료 전체');
const pc = emptyData(); pc.me.name = '스타미디어'; pc.me.bizNo = '120-81-47521'; pc.clients = [doc('c1', '1', { name: '○○군청' })]; pc.docs = [doc('q1', '1')];
const phone = emptyData();   // 휴대폰 처음: 비어 있음
const first = mergeData(null, phone, pc);
eq('휴대폰 처음 연결: 내 정보 · 거래처 · 문서를 드라이브에서 가져옴', [first.me.name, first.me.bizNo, first.clients.length, first.docs.length], ['스타미디어', '120-81-47521', 1, 1]);
const base2 = JSON.parse(JSON.stringify(first));
const phone2 = JSON.parse(JSON.stringify(first)); phone2.docs.push(doc('m1', '2', { device: 'phone' }));
const pc2 = JSON.parse(JSON.stringify(first)); pc2.clients[0] = doc('c1', '3', { name: '○○군청(수정)' });
const m = mergeData(base2, pc2, phone2);
eq('그다음: 휴대폰 새 문서 + PC 거래처 고침이 모두 반영', [m.docs.map((d) => d.id), m.clients[0].name], [['q1', 'm1'], '○○군청(수정)']);
eq('드라이브가 없으면 이 기기 자료 그대로', mergeData(null, pc, null) === pc, true);
const pcEmptyMe = emptyData(); pcEmptyMe.me.tel = '010';
eq('처음 연결 · 이 기기 내 정보가 있으면 빈 칸만 채움', mergeData(null, Object.assign(emptyData(), { me: { ...emptyData().me, name: 'A', bizNo: '1' } }), Object.assign(emptyData(), { me: { ...emptyData().me, name: 'B', tel: '9' } })).me.name + '/' + mergeData(null, Object.assign(emptyData(), { me: { ...emptyData().me, name: 'A', bizNo: '1' } }), Object.assign(emptyData(), { me: { ...emptyData().me, name: 'B', tel: '9' } })).me.tel, 'A/9');

console.log(`\n자료 합치기 시험: ${pass}개 통과, ${fail}개 실패`);
if (fail) process.exit(1);
