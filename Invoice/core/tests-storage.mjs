// 저장 장치 시험 (T15 · T16 · P07 · U01 일부). 브라우저 저장소 대신 메모리 저장소로 규칙을 검증한다.
import { createStore, memoryAdapter, pickLatest, BACKUP_KEEP } from './storage.mjs';
import { emptyData, wrap } from './datafile.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}

let clock = new Date('2026-11-14T09:00:00.000Z').getTime();
const now = () => new Date(clock).toISOString();
const tick = (ms) => { clock += ms; };
const H = 3600e3;

console.log('저장 장치');
const device = memoryAdapter('이 기기');
const folder = memoryAdapter('PC 폴더');
const store = createStore([device, folder], { now });
const d1 = { ...emptyData(), docs: [{ id: 'd1' }] };

let r = await store.save(d1);
eq('두 곳 모두 저장됨', [r['이 기기'].ok, r['PC 폴더'].ok], [true, true]);

// T15: PC 폴더 실패 — 기기 저장은 성공, 실패한 곳만 따로 표시
folder.failWrites = true; tick(60e3);
r = await store.save({ ...d1, docs: [{ id: 'd1' }, { id: 'd2' }] });
eq('T15 PC 폴더 실패를 따로 표시', [r['이 기기'].ok, r['PC 폴더'].ok, store.status['PC 폴더'].ok], [true, false, false]);
folder.failWrites = false;
r = await store.save({ ...d1, docs: [{ id: 'd1' }, { id: 'd2' }] });
eq('T15 다시 시도하면 PC 폴더도 성공', r['PC 폴더'].ok, true);

const o = await store.open();
eq('다시 열면 자료 그대로', [o.ok, o.data.docs.length], [true, 2]);

// 하루 전 사본: 날짜가 바뀐 뒤 첫 저장 때 어제 자료를 남김
tick(24 * H);
await store.save({ ...d1, docs: [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }] });
const dc = JSON.parse(await device.get('daycopy'));
eq('하루 전 사본 = 어제 자료', dc.data.docs.length, 2);

console.log('백업 · 되돌리기');
const first = await store.backup('수동');
eq('백업 이름에 날짜와 이유', /_수동$/.test(first), true);
for (let i = 0; i < 12; i++) { tick(60e3); await store.backup('자동'); }
eq('백업은 최근 ' + BACKUP_KEEP + '개만 남김', (await store.listBackups()).length, BACKUP_KEEP);
eq('PC 폴더에도 같은 수의 백업', (await folder.keys()).filter((k) => k.startsWith('backup:')).length, BACKUP_KEEP);

// T16 · P07: 실수로 지운 뒤 되돌리기 → 되돌리기 직전 자료도 자동 백업
const goodName = (await store.listBackups()).slice(-1)[0];   // 문서 3개 시점
tick(60e3);
await store.save({ ...d1, docs: [] });                         // 실수로 다 지움
tick(60e3);
const rs = await store.restore(goodName);
eq('T16 되돌리기 성공 · 문서 복구', [rs.ok, rs.data.docs.length], [true, 3]);
eq('P07 되돌리기 직전 자료를 자동 백업', /_되돌리기전$/.test(rs.before), true);
const undo = await store.restore(rs.before.slice('backup:'.length));
eq('P07 되돌린 것도 다시 되돌릴 수 있음', [undo.ok, undo.data.docs.length], [true, 0]);
await store.restore(goodName);
eq('없는 백업으로 되돌리면 아무것도 안 바뀜', [(await store.restore('없음')).ok, (await store.open()).data.docs.length], [false, 3]);

console.log('PC 폴더에서 자료 찾기 · 업데이트');
const files = {
  '견적서발행기.json': JSON.stringify(wrap({ ...emptyData(), docs: [{ id: 'a' }, { id: 'b' }] }, '1.0.0', '2026-11-20T10:00:00Z')),
  '견적서발행기_하루전.json': JSON.stringify(wrap({ ...emptyData(), docs: [{ id: 'a' }] }, '1.0.0', '2026-11-19T10:00:00Z')),
  '메모.txt': '다른 파일',
  '깨진.json': '{broken'
};
const pk = pickLatest(files);
eq('가장 최근 자료 파일을 고름', [pk.name, pk.data.docs.length], ['견적서발행기.json', 2]);
// 옛 형식 자료를 새 프로그램(형식 2)이 열면: 변환 전 '업데이트전' 백업이 자동으로 생김
const dev2 = memoryAdapter('이 기기');
await dev2.set('main', JSON.stringify({ ...wrap({ ...emptyData(), docs: [{ id: 'x' }] }, '1.0.0', now()), schema: 1 }));   // 옛 형식 1 자료
const store2 = createStore([dev2], { now, target: 2, migrations: { 1: (d) => ({ ...d, settings: { ...d.settings, startPage: 'home' } }) } });
const o2 = await store2.open();
eq('U01 업데이트 후 열면 자동 변환', [o2.ok, o2.migrated, o2.data.docs.length, o2.data.settings.startPage], [true, true, 1, 'home']);
eq('U01 변환 직전 업데이트전 백업 생김', (await store2.listBackups()).some((n) => n.endsWith('_업데이트전')), true);

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
if (fail) process.exit(1);
