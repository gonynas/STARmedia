// 품목 · 세트 규칙 시험 (실행: npm test · 빌드할 때도 먼저 실행된다)
import { renameInOrder, searchItems, misplacedItems, fixMisplaced, categories, filterItems, findDuplicate, renameCategory, removeCategory, setsUsing, expandSet, setAmount, snapshotLine, parsePaste, toNum, NO_CAT } from './catalog.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}
const mk = () => [
  { id: 'i1', cat: '천막', name: '몽골텐트', spec: '5×5m', price: 170000, days: 1 },
  { id: 'i2', cat: '천막', name: '몽골텐트', spec: '3×3m', price: 90000, days: 1 },
  { id: 'i3', cat: '테이블 · 의자', name: '의자', spec: '접이식', price: 1000, days: 1 },
  { id: 'i4', cat: '', name: '영상촬영', spec: '현장 스케치', price: 600000, days: 0.5, taxFree: false, memo: '편집본 1편' }
];

console.log('품목 · 분류');
eq('숫자 칸 읽기 (쉼표 · 원)', [toNum('170,000원'), toNum('0.5'), toNum(''), toNum('abc')], [170000, 0.5, null, null]);
eq('분류 목록 · 개수 (분류 없음은 맨 끝)', categories(mk()), [{ name: '천막', count: 2 }, { name: '테이블 · 의자', count: 1 }, { name: NO_CAT, count: 1 }]);
eq('분류로 거르기', filterItems(mk(), { cat: '천막' }).map((i) => i.id), ['i2', 'i1']);
eq('분류 없음 거르기', filterItems(mk(), { cat: NO_CAT }).map((i) => i.id), ['i4']);
eq('검색 (띄어쓰기 무시 · 비고 포함)', filterItems(mk(), { q: '편집 본' }).map((i) => i.id), ['i4']);
eq('같은 품목 찾기 (이름 + 규격)', findDuplicate(mk(), { name: '몽골 텐트', spec: '5×5M' })?.id, 'i1');
eq('규격이 다르면 다른 품목', findDuplicate(mk(), { name: '몽골텐트', spec: '6×6m' }), null);
eq('수정할 때 자기 자신은 중복 아님', findDuplicate(mk(), { name: '몽골텐트', spec: '5×5m' }, 'i1'), null);
const a = mk();
eq('분류 이름 바꾸기 → 바뀐 수', renameCategory(a, '천막', '천막 · 텐트', 'T'), 2);
eq('바꾼 분류가 품목에 들어감', [a[0].cat, a[0].updatedAt], ['천막 · 텐트', 'T']);
eq('분류 지우기 → 품목은 남고 분류 없음', [removeCategory(a, '테이블 · 의자'), a.length, categories(a).find((c) => c.name === NO_CAT).count], [1, 4, 2]);

console.log('세트');
const items = mk();
const set = { id: 's1', name: '몽골텐트 기본 세트', lines: [snapshotLine(items[0], 4), snapshotLine(items[2], 40, 2)] };
eq('세트 줄 사본 (일수 기본값은 품목 기본 일수)', set.lines[0], { itemId: 'i1', qty: 4, days: 1, name: '몽골텐트', spec: '5×5m', price: 170000, taxFree: false });
eq('세트를 품목 줄로 펼치기', expandSet(set, items).map((l) => [l.name, l.days, l.qty, l.price]), [['몽골텐트', 1, 4, 170000], ['의자', 2, 40, 1000]]);
eq('세트 금액 = 4×170,000 + 2×40×1,000', setAmount(set, items), 760000);
items[0].price = 180000;
eq('품목 단가를 바꾸면 세트도 새 단가', setAmount(set, items), 800000);
const left = items.filter((i) => i.id !== 'i3');
eq('품목을 지워도 세트는 사본으로 남음', expandSet(set, left)[1].missing && expandSet(set, left)[1].name, '의자');
eq('이 품목을 쓰는 세트', setsUsing([set], 'i3'), ['몽골텐트 기본 세트']);

console.log('엑셀 붙여넣기');
const p1 = parsePaste('분류\t품목\t규격\t단가\n천막\t몽골텐트\t5×5m\t170,000\n\t의자\t접이식\t1000\n');
eq('머리글 있는 표', [p1.header, p1.rows.length, p1.rows[0], p1.rows[1].cat], [true, 2, { cat: '천막', name: '몽골텐트', spec: '5×5m', price: 170000, days: 1, memo: '' }, '']);
const p2 = parsePaste('품명\t단가\t규격\n난로\t50,000원\t등유식');
eq('머리글 순서가 달라도 이름으로 맞춤', [p2.rows[0].name, p2.rows[0].spec, p2.rows[0].price], ['난로', '등유식', 50000]);
const p3 = parsePaste('몽골텐트\t5×5m\t170000\n발전차\t100kW\t1,000,000\n\n합계\t\t\n12345\t\t');
eq('머리글 없는 3칸 = 품목 · 규격 · 단가', p3.rows.map((r) => [r.name, r.spec, r.price]), [['몽골텐트', '5×5m', 170000], ['발전차', '100kW', 1000000]]);
eq('합계 줄 · 숫자만 있는 줄은 건너뜀', p3.skipped, 2);
eq('4칸 이상 = 분류 · 품목 · 규격 · 단가 · 일수', parsePaste('냉난방\t난로\t등유식\t50000\t0.5').rows[0].days, 0.5);
eq('빈 글자는 0줄', parsePaste('  \n ').rows.length, 0);

console.log('품목 칸 실시간 찾기');
const sx = [...mk(), { id: 'i5', cat: '천막', name: '천막텐트', spec: '3×6m', price: 120000, days: 1 }];
eq('「텐」 → 몽골텐트 두 개 · 천막텐트', searchItems(sx, '텐').map((i) => i.id), ['i2', 'i1', 'i5']);
eq('「천막」 → 이름에 천막이 든 품목만 (분류 이름으로는 안 찾음)', searchItems(sx, '천막').map((i) => i.id), ['i5']);
eq('띄어쓰기 · 대소문자 무시, 규격으로도 찾음', searchItems(sx, '5 ×5M').map((i) => i.id), ['i1']);
eq('빈 글자는 목록 없음', searchItems(sx, '  ').length, 0);
eq('없는 글자는 목록 없음', searchItems(sx, '발전차').length, 0);
eq('최대 개수', searchItems(sx, '텐', 2).length, 2);

console.log('분류 순서 (사용자가 정함)');
const co = [...mk(), { id: 'i6', cat: '음향', name: '음향세트', spec: '기본', price: 1500000, days: 1 }];
eq('정한 순서 없으면 가나다순 · 분류 없음 맨 끝', categories(co).map((c) => c.name), ['음향', '천막', '테이블 · 의자', NO_CAT]);
eq('정한 순서대로, 순서에 없는 분류는 그 뒤 가나다순', categories(co, ['테이블 · 의자', '천막']).map((c) => c.name), ['테이블 · 의자', '천막', '음향', NO_CAT]);
eq('품목 목록도 분류 순서대로', filterItems(co, { order: ['테이블 · 의자', '음향'] }).map((i) => i.id), ['i3', 'i6', 'i2', 'i1', 'i4']);
eq('분류 이름 바꾸기 · 합치기 · 지우기 때 순서도', [renameInOrder(['a', 'b', 'c'], 'b', 'x'), renameInOrder(['a', 'b', 'c'], 'b', 'c'), renameInOrder(['a', 'b'], 'a', ''), renameInOrder(undefined, 'a', 'b')], [['a', 'x', 'c'], ['a', 'c'], ['b'], undefined]);
console.log('칸이 밀린 품목 바로잡기');
const mis = () => ({
  items: [
    { id: 'm1', cat: '천막텐트', name: '3mx6m', spec: '', price: 30000 },
    { id: 'm2', cat: '의자', name: '등받이형', spec: '', price: 1000 },
    { id: 'm3', cat: '테이블', name: '1800×750', spec: '', price: 10000 },
    { id: 'm4', cat: '진행용품', name: '무전기', spec: '', price: 20000 },
    { id: 'm5', cat: '몽골텐트', name: '몽골텐트-3M', spec: '3×3M', price: 150000 }
  ],
  sets: [{ id: 's1', name: '천막세트', lines: [{ itemId: 'm1', name: '3mx6m', spec: '', qty: 1 }, { itemId: 'm5', name: '몽골텐트-3M', spec: '3×3M', qty: 1 }] }],
  docs: [
    { id: 'd1', status: 'draft', lines: [{ itemId: 'm1', name: '3mx6m', spec: '' }, { itemId: 'm2', name: '등받이형', spec: '' }] },
    { id: 'd2', status: 'sent', lines: [{ itemId: 'm1', name: '3mx6m', spec: '' }] }
  ]
});
eq('찾기: 천막텐트/3mx6m · 의자/등받이형 · 테이블/1800×750 (무전기 · 몽골텐트는 아님)', misplacedItems(mis().items).map((i) => i.id), ['m1', 'm2', 'm3']);
const md = mis(); const mr = fixMisplaced(md, ['m1', 'm2', 'm3'], 'T');
eq('바로잡기: 품목 ← 분류, 규격 ← 품목', md.items.slice(0, 3).map((i) => [i.cat, i.name, i.spec]), [['천막텐트', '천막텐트', '3mx6m'], ['의자', '의자', '등받이형'], ['테이블', '테이블', '1800×750']]);
eq('세트 사본 · 작성 중 문서 줄도 같이 (보낸 문서는 그대로)', [md.sets[0].lines[0].name + '/' + md.sets[0].lines[0].spec, md.docs[0].lines.map((l) => l.name + '/' + l.spec).join(','), md.docs[1].lines[0].name], ['천막텐트/3mx6m', '천막텐트/3mx6m,의자/등받이형', '3mx6m']);
eq('고친 개수', mr, { items: 3, sets: 1, lines: 2 });
eq('바로잡은 뒤에는 더 안 나옴', misplacedItems(md.items).length, 0);
eq('세트 펼치기: 품목 · 규격 칸이 맞게', expandSet(md.sets[0], md.items).map((l) => l.name + '/' + l.spec), ['천막텐트/3mx6m', '몽골텐트-3M/3×3M']);
console.log('엑셀 붙여넣기: 머리글 없는 4칸');
eq('품목 · 규격 · 단가 · 비고', parsePaste('천막텐트\t3m×6m\t30000\t기사 포함').rows.map((r) => [r.cat, r.name, r.spec, r.price, r.memo]), [['', '천막텐트', '3m×6m', 30000, '기사 포함']]);
eq('품목 · 규격 · 단가 · 일수', parsePaste('천막텐트\t3m×6m\t30000\t2').rows.map((r) => [r.cat, r.name, r.spec, r.price, r.days]), [['', '천막텐트', '3m×6m', 30000, 2]]);
eq('분류 · 품목 · 규격 · 단가 (그대로)', parsePaste('천막\t천막텐트\t3m×6m\t30000').rows.map((r) => [r.cat, r.name, r.spec, r.price]), [['천막', '천막텐트', '3m×6m', 30000]]);

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
if (fail) process.exit(1);
