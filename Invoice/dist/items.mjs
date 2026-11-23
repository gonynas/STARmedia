// 스타미디어 견적서 발행기 — 품목 · 세트 화면 (1단계 둘째 묶음)
// 규칙(분류 · 중복 · 세트 펼치기 · 엑셀 붙여넣기)은 core/catalog.mjs (node 시험 통과한 것)를 쓴다.
import { renameInOrder, misplacedItems, fixMisplaced, categories, filterItems, findDuplicate, renameCategory, removeCategory, setsUsing, expandSet, setAmount, snapshotLine, parsePaste, toNum, NO_CAT } from './core/catalog.mjs?v=mwtf14zz';
import { lineAmount } from './core/money.mjs?v=mwtf14zz';
import { uxMode, uxLvl, setLvl, isPhone, uxTabs, uxNavBtn, uxMore, uxSheetHtml, openSheet, uxBackHtml, uxGroup, uxMid, uxKids, uxLeaf } from './ux.mjs?v=mwtf14zz';

let C = null;   // main.mjs 가 넘겨주는 도구 { S, $, esc, ic, uid, toast, openModal, changed, render }
export function initItems(ctx) { C = ctx; bindCatSort(); }
const catOrder = () => (C.S.data.settings.catOrder || []);

const won = (n) => (Math.round(Number(n) || 0)).toLocaleString('ko-KR');
const dayTxt = (d) => (d === 1 ? '1일' : String(d).replace(/\.0+$/, '') + '일');

/* ── 화면 ── */
function catListHtml() {
  const { S, esc, ic } = C;
  const cats = categories(S.data.items, catOrder());
  if (S.catSort) {
    // 순서 바꾸기: 꾹 눌러(마우스는 눌러서) 끌기 · 손잡이는 바로 끌기 · 키보드 ↑↓
    return '<div class="cat-sort" id="catSort" role="list">' + cats.filter((c) => c.name !== NO_CAT).map((c) =>
      '<div class="csrow" role="listitem" tabindex="0" data-cat="' + esc(c.name) + '" aria-label="' + esc(c.name) + ' — 끌거나 위 · 아래 화살표로 순서 바꾸기"><span class="csgrip" aria-hidden="true">' + ic('grip') + '</span><span class="csname">' + esc(c.name) + '</span><em>' + c.count + '</em></div>').join('') +
      (cats.some((c) => c.name === NO_CAT) ? '<div class="csrow fixed" aria-disabled="true"><span class="csname">' + NO_CAT + '</span><em>맨 끝 고정</em></div>' : '') + '</div>';
  }
  const m = uxMode(), sortable = cats.filter((c) => c.name !== NO_CAT).length > 1;
  if (m === 'a') {   // 시안 A: 분류 칩 한 줄 + 순서 단추
    const chip = (key, label, n) => '<button type="button" class="uxchip' + (S.itemCat === key ? ' on' : '') + '" data-act="cat-pick" data-cat="' + esc(key) + '" aria-pressed="' + (S.itemCat === key) + '">' + esc(label) + ' <em>' + n + '</em></button>';
    return '<div class="uxchips" role="group" aria-label="분류">' + chip('', '전체', S.data.items.length) + cats.map((c) => chip(c.name, c.name, c.count)).join('') +
      (sortable ? '<button type="button" class="uxchip sort" data-act="cat-sort">' + ic('sort') + '순서</button>' : '') + '</div>';
  }
  {   // 시안 B · 기본: 「품목」 상자 안 — 중분류 「전체 품목」(처음 접힘) + 소분류(분류, 한 글자 들여쓰기 + └) + 도구 줄 (v1.6.2 메뉴 분류 규칙)
    const ph = isPhone() && m === 'b', onItem = S.itemTab !== 'set' && !ph, forced = onItem && !!S.itemCat;
    return uxMid('items', '전체 품목', S.data.items.length, onItem && !S.itemCat, forced) +
      uxKids('items', (ph ? uxLeaf('data-act="cat-pick" data-cat=""', false, '전체 보기', '<em class="num">' + S.data.items.length + '</em>') : '') +
        cats.map((c) => uxLeaf('data-act="cat-pick" data-cat="' + esc(c.name) + '"', onItem && S.itemCat === c.name, esc(c.name), '<em class="num">' + c.count + '</em>')).join(''), forced) +
      (sortable ? '<button type="button" class="uxtoolrow" data-act="cat-sort">' + ic('sort') + '분류 순서 바꾸기</button>' : '');
  }
  const btn = (key, label, n) => '<button class="catb' + (S.itemCat === key ? ' on' : '') + '" data-act="cat-pick" data-cat="' + esc(key) + '"' + (S.itemCat === key ? ' aria-pressed="true"' : '') + '><span>' + esc(label) + '</span><em>' + n + '</em></button>';
  return btn('', '전체', S.data.items.length) + cats.map((c) => btn(c.name, c.name, c.count)).join('');
}
function catToolsHtml() {
  const { S, esc, ic } = C;
  if (S.catSort) return '<p class="cat-help">분류를 <mark class="hl-g"><b>꾹 눌러</b></mark>(PC는 마우스로 눌러서) 위 · 아래로 끌어 순서를 바꾼 뒤 <mark class="hl-y"><b>저장</b></mark>을 누르세요. 품목 목록 · 문서의 품목 고르기도 이 순서로 보여요.</p>' +
    '<div class="cat-tools cs-tools"><button class="btn primary" data-act="cat-sort-save">' + ic('check') + '저장</button><button class="btn" data-act="cat-sort-cancel">취소</button></div>';
  if (uxMode() && S.itemTab === 'set') return '';   // 시안 A · B: 세트를 볼 때는 분류 고치기 단추를 숨김
  if (!S.itemCat || S.itemCat === NO_CAT || !S.data.items.some((i) => (i.cat || '').trim() === S.itemCat)) {
    if (uxMode() || S.data.items.length) return '';
    return '<p class="cat-help">분류는 품목을 넣을 때 「분류」 칸에 이름을 쓰면 저절로 생겨요.</p>';
  }
  return '<div class="cat-tools"><b>' + esc(S.itemCat) + '</b><button class="btn sm" data-act="cat-rename">' + ic('type') + '이름 바꾸기</button>' +
    '<button class="btn sm danger-o" data-act="cat-del">' + ic('trash') + '분류 지우기</button></div>';
}

function itemRowsHtml() {
  if (uxMode()) return uxItemRows();
  const { S, esc, ic } = C;
  if (!S.data.items.length) return '<div class="empty">아직 등록한 품목이 없어요.<br><b>품목 추가</b>를 누르거나, 지금 쓰는 엑셀 견적서의 품목 칸을 복사해 <b>엑셀에서 붙여넣기</b>로 한 번에 넣어 보세요.</div>';
  const list = filterItems(S.data.items, { cat: S.itemCat, q: S.itemQuery, order: catOrder() });
  if (!list.length) return '<div class="empty">' + (S.itemQuery ? '「' + esc(S.itemQuery) + '」에 맞는 품목이 없어요.' : '이 분류에는 품목이 없어요.') + '</div>';
  const rows = list.map((it) =>
    '<tr data-id="' + it.id + '">' +
    '<td class="c-cat" data-l="분류">' + (it.cat ? esc(it.cat) : '<span class="dim">-</span>') + '</td>' +
    '<td class="c-nm" data-l="품목"><b>' + esc(it.name) + '</b>' + (it.taxFree ? '<span class="tf">면세</span>' : '') + '</td>' +
    '<td class="c-sp" data-l="규격">' + (it.spec ? esc(it.spec) : '<span class="dim">-</span>') + '</td>' +
    '<td class="c-pr num" data-l="기본 단가">' + won(it.price) + '<small>원</small></td>' +
    '<td class="c-dy num" data-l="기본 일수">' + dayTxt(toNum(it.days) ?? 1) + '</td>' +
    '<td class="c-mm" data-l="비고">' + (it.memo ? esc(it.memo) : '<span class="dim">-</span>') + '</td>' +
    '<td class="c-act"><button class="btn sm" data-act="item-edit" data-id="' + it.id + '">' + ic('fileText') + '수정</button>' +
    '<button class="btn sm danger-o" data-act="item-del" data-id="' + it.id + '" aria-label="' + esc(it.name) + ' 삭제">' + ic('trash') + '삭제</button></td></tr>').join('');
  return '<table class="itable"><thead><tr><th>분류</th><th>품목</th><th>규격</th><th class="num">기본 단가</th><th class="num">기본 일수</th><th>비고</th><th><span class="sr-only">고치기</span></th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function setCardsHtml() {
  const { S, esc, ic } = C;
  if (!S.data.sets.length) return '<div class="empty">아직 만든 세트가 없어요.<br>「몽골텐트 기본 세트(텐트 + 테이블 + 의자)」처럼 <b>자주 같이 나가는 품목</b>을 묶어 두면, 문서 만들 때 한 번에 넣을 수 있어요.</div>';
  return '<div class="setgrid">' + S.data.sets.map((s) => {
    const lines = expandSet(s, S.data.items);
    const shown = lines.slice(0, 5).map((l) => '<li' + (l.missing ? ' class="miss"' : '') + '><span>' + esc(l.name) + (l.spec ? ' <small>' + esc(l.spec) + '</small>' : '') + (l.missing ? ' <em>지운 품목</em>' : '') + '</span><b class="num">' + (l.days !== 1 ? dayTxt(l.days) + ' × ' : '') + l.qty + '개</b></li>').join('');
    return '<article class="setc"><div class="setc-h"><span class="setc-ic">' + ic('layers') + '</span><div><h3>' + esc(s.name) + '</h3><small>품목 ' + lines.length + '개' + (s.memo ? ' · ' + esc(s.memo) : '') + '</small></div></div>' +
      '<ul>' + shown + (lines.length > 5 ? '<li class="more-l">외 ' + (lines.length - 5) + '개</li>' : '') + '</ul>' +
      '<div class="setc-sum"><span>세트 금액 <small>(부가세 전)</small></span><b class="num">' + won(setAmount(s, S.data.items)) + '<small>원</small></b></div>' +
      '<div class="setc-act"><button class="btn sm" data-act="set-edit" data-id="' + s.id + '">' + ic('fileText') + '수정</button>' +
      '<button class="btn sm" data-act="set-copy" data-id="' + s.id + '">' + ic('copy') + '복사</button>' +
      '<button class="btn sm danger-o" data-act="set-del" data-id="' + s.id + '">' + ic('trash') + '삭제</button></div></article>';
  }).join('') + '</div>';
}

/* ── 시안 A · B (v1.6.0 시험): 단추 이름(data-act)은 원래 것을 그대로 쓴다 ── */
const curList = () => filterItems(C.S.data.items, { cat: C.S.itemCat, q: C.S.itemQuery, order: catOrder() });
function curItem() { const l = curList(); return l.find((i) => i.id === C.S.itemSel) || l[0] || null; }
function curSet() { return C.S.data.sets.find((s) => s.id === C.S.setSel) || C.S.data.sets[0] || null; }
function uxItemRows() {
  const { S, esc, ic } = C, m = uxMode();
  if (!S.data.items.length) return '<div class="empty">아직 등록한 품목이 없어요. <b>품목 추가</b>나 <b>붙여넣기</b>로 넣어 보세요.</div>';
  const list = curList();
  if (!list.length) return '<div class="empty">' + (S.itemQuery ? '「' + esc(S.itemQuery) + '」에 맞는 품목이 없어요.' : '이 분류에는 품목이 없어요.') + '</div>';
  const tf = (it) => (it.taxFree ? '<span class="tf">면세</span>' : '');
  if (m === 'b') {
    const sel = curItem();
    return '<div class="uxrows">' + list.map((it) => '<button type="button" class="uxrow pick' + (!isPhone() && sel && it.id === sel.id ? ' on' : '') + '" data-act="item-pick" data-id="' + it.id + '">' +
      '<span class="uxt"><b>' + esc(it.name) + tf(it) + '</b><small>' + (it.spec ? esc(it.spec) : '규격 없음') + '</small></span>' +
      '<span class="uxv num">' + won(it.price) + '원<small>' + dayTxt(toNum(it.days) ?? 1) + '</small></span><span class="uxgo">' + ic('right') + '</span></button>').join('') + '</div>';
  }
  return '<div class="uxrows"><div class="uxrow uxhead" aria-hidden="true"><span>품목 · 규격</span><span>분류</span><span class="r">기본 단가</span><span class="r">일수</span><span></span></div>' + list.map((it) => '<div class="uxrow item">' +
    '<span class="uxt"><b>' + esc(it.name) + tf(it) + '</b><small>' + (it.spec ? esc(it.spec) : '<span class="dim">규격 없음</span>') + (it.cat ? '<span class="uxcat in">' + esc(it.cat) + '</span>' : '') + '</small></span>' +
    '<span class="uxc">' + (it.cat ? '<span class="uxcat">' + esc(it.cat) + '</span>' : '<span class="dim">-</span>') + '</span>' +
    '<span class="uxpr num">' + won(it.price) + '<small>원</small></span><span class="uxd num">' + dayTxt(toNum(it.days) ?? 1) + '</span>' +
    uxMore(it.name, [['item-edit', it.id, '수정', 'edit'], ['item-del', it.id, '삭제', 'trash', true]]) + '</div>').join('') + '</div>';
}
function uxSetRows() {
  const { S, esc, ic } = C, m = uxMode();
  if (!S.data.sets.length) return '<div class="empty">아직 만든 세트가 없어요. 자주 같이 나가는 품목을 묶어 두면 문서에 한 번에 넣을 수 있어요.</div>';
  const sel = curSet();
  return '<div class="uxrows">' + S.data.sets.map((s) => {
    const lines = expandSet(s, S.data.items);
    const sum = lines.slice(0, 3).map((l) => esc(l.name)).join(' · ') + (lines.length > 3 ? ' 외 ' + (lines.length - 3) + '개' : '');
    const amt = '<span class="uxv num">' + won(setAmount(s, S.data.items)) + '원<small>품목 ' + lines.length + '개</small></span>';
    if (m === 'b') return '<button type="button" class="uxrow pick' + (!isPhone() && sel && sel.id === s.id ? ' on' : '') + '" data-act="set-pick" data-id="' + s.id + '"><span class="uxt"><b>' + esc(s.name) + '</b><small>' + sum + '</small></span>' + amt + '<span class="uxgo">' + ic('right') + '</span></button>';
    return '<div class="uxrow set"><span class="uxt"><b>' + esc(s.name) + '</b><small>' + sum + '</small></span>' + amt +
      uxMore(s.name, [['set-edit', s.id, '수정', 'edit'], ['set-copy', s.id, '복사', 'copy'], ['set-del', s.id, '삭제', 'trash', true]]) + '</div>';
  }).join('') + '</div>';
}
function itemDetailHtml(it) {
  const { S, esc, ic } = C;
  if (!it) return '<div class="empty">품목을 고르면 여기에 자세히 보여요.</div>';
  const used = setsUsing(S.data.sets, it.id);
  return '<h2 class="uxdet-h">' + esc(it.name) + '</h2><p class="uxk">' + [it.cat, it.spec].filter(Boolean).map(esc).join(' · ') + '</p>' +
    '<dl class="uxdl"><dt>분류</dt><dd>' + (it.cat ? esc(it.cat) : '분류 없음') + '</dd><dt>규격</dt><dd>' + (it.spec ? esc(it.spec) : '-') + '</dd>' +
    '<dt>기본 단가</dt><dd class="num">' + won(it.price) + '원</dd><dt>기본 일수</dt><dd>' + dayTxt(toNum(it.days) ?? 1) + '</dd>' +
    (it.taxFree ? '<dt>부가세</dt><dd>면세 품목</dd>' : '') + (it.memo ? '<dt>비고</dt><dd>' + esc(it.memo) + '</dd>' : '') +
    '<dt>쓰는 세트</dt><dd>' + (used.length ? esc(used.join(', ')) : '없음') + '</dd></dl>' +
    '<div class="uxacts"><button type="button" class="btn primary wide" data-act="item-edit" data-id="' + it.id + '">' + ic('edit') + '수정</button>' +
    '<button type="button" class="btn danger-o wide" data-act="item-del" data-id="' + it.id + '">' + ic('trash') + '삭제</button></div>';
}
function setDetailHtml(s) {
  const { S, esc, ic } = C;
  if (!s) return '<div class="empty">세트를 고르면 여기에 자세히 보여요.</div>';
  const lines = expandSet(s, S.data.items);
  return '<h2 class="uxdet-h">' + esc(s.name) + '</h2><p class="uxk">품목 ' + lines.length + '개' + (s.memo ? ' · ' + esc(s.memo) : '') + '</p>' +
    '<ul class="uxsetl">' + lines.map((l) => '<li' + (l.missing ? ' class="miss"' : '') + '><span>' + esc(l.name) + (l.spec ? ' <small>' + esc(l.spec) + '</small>' : '') + '</span><b class="num">' + (l.days !== 1 ? dayTxt(l.days) + ' × ' : '') + l.qty + '개</b></li>').join('') + '</ul>' +
    '<p class="uxsum"><span>세트 금액 (부가세 전)</span><b class="num">' + won(setAmount(s, S.data.items)) + '원</b></p>' +
    '<div class="uxacts"><button type="button" class="btn primary wide" data-act="set-edit" data-id="' + s.id + '">' + ic('edit') + '수정</button>' +
    '<button type="button" class="btn" data-act="set-copy" data-id="' + s.id + '">' + ic('copy') + '복사</button><button type="button" class="btn danger-o" data-act="set-del" data-id="' + s.id + '">' + ic('trash') + '삭제</button></div>';
}
/** 「세트」 상자: 중분류 「품목 세트」(처음 접힘) + 소분류(세트 이름) */
function setNavHtml() {
  const { S, esc } = C, ph = isPhone(), on = S.itemTab === 'set' && !ph;
  return uxMid('sets', '품목 세트', S.data.sets.length, on && !S.setSel, on) +
    uxKids('sets', (ph ? uxLeaf('data-act="item-tab" data-v="set"', false, '전체 보기', '<em class="num">' + S.data.sets.length + '</em>') : '') +
      (S.data.sets.length ? S.data.sets.map((s) => uxLeaf('data-act="set-pick" data-id="' + s.id + '"', on && S.setSel === s.id, esc(s.name), '')).join('') : '<p class="uxkids-empty">아직 만든 세트가 없어요</p>'), on);
}
function uxItemsPage(m) {
  const { S, esc, ic } = C;
  const tab = S.itemTab === 'set' ? 'set' : 'item', nI = S.data.items.length, nS = S.data.sets.length;
  const tools = tab === 'set' ? '<button type="button" class="btn primary" data-act="set-add">' + ic('plus') + '<span>세트 만들기</span></button>'
    : (nI ? '<button type="button" class="btn" data-act="x-items-xlsx" title="엑셀로 저장">' + ic('download') + '<span>엑셀 저장</span></button>' : '') +
      '<button type="button" class="btn" data-act="item-paste" title="엑셀에서 붙여넣기">' + ic('table') + '<span>붙여넣기</span></button>' +
      '<button type="button" class="btn primary" data-act="item-add">' + ic('plus') + '<span>품목 추가</span></button>';
  const search = '<input class="in uxsearch" type="search" id="iq" placeholder="품목 · 규격으로 찾기" value="' + esc(S.itemQuery) + '" aria-label="품목 찾기">';
  const body = tab === 'set' ? '<div id="slist">' + uxSetRows() + '</div>' : misHtml() + '<div id="ilist">' + itemRowsHtml() + '</div>';
  if (m === 'a') {
    return '<div class="uxp ux-a ux-items">' + uxTabs([['item', '품목', nI], ['set', '세트', nS]], tab, 'item-tab') +
      '<section class="card uxpanel"><div class="uxtool">' + (tab === 'item' ? search : '<span class="uxtool-t">자주 같이 나가는 품목 묶음</span>') + '<div class="uxtools">' + tools + '</div></div>' +
      (tab === 'item' ? '<div id="catlist" class="uxcatbar">' + catListHtml() + '</div><div id="cattools">' + catToolsHtml() + '</div>' : '') + body +
      (tab === 'item' && nI ? '<p class="uxfoot">단가는 기본값이에요. 문서마다 바꿀 수 있어요.</p>' : '') + '</section></div>';
  }
  const title = tab === 'set' ? '품목 세트' : (S.itemCat || '전체 품목');
  return '<div class="uxp ux-b ux-items lvl' + uxLvl() + '">' +
    '<aside class="uxsub2" aria-label="품목 하위 메뉴">' + uxGroup('layers', '품목', '<div id="catlist">' + catListHtml() + '</div><div id="cattools">' + catToolsHtml() + '</div>') + uxGroup('grid', '세트', setNavHtml()) + '</aside>' +
    '<section class="card uxlist">' + uxBackHtml('품목 · 세트') + '<div class="uxtool"><h2 class="uxlist-h">' + esc(title) + '</h2><div class="uxtools">' + tools + '</div></div>' +
    (tab === 'item' ? '<div class="uxtool">' + search + '</div>' : '') + body + '</section>' +
    '<aside class="card uxdet" aria-label="자세히">' + (tab === 'set' ? setDetailHtml(curSet()) : itemDetailHtml(curItem())) + '</aside>' + uxSheetHtml() + '</div>';
}

export function itemsPage() {
  const { S, esc, ic } = C;
  if (uxMode()) return uxItemsPage(uxMode());
  return '<div class="itempage">' +
    '<aside class="card catcard uxg"><h3 class="uxg-h"><span class="uxg-i">' + ic('layers') + '</span>품목</h3><div class="catlist uxtree" id="catlist">' + catListHtml() + '</div><div id="cattools">' + catToolsHtml() + '</div></aside>' +
    '<section class="card itemcard"><div class="card-h"><h2>' + ic('layers') + '품목 목록</h2><span class="hint">' + S.data.items.length + '개</span>' +
    '<div class="tools">' + (S.data.items.length ? '<button class="btn" data-act="x-items-xlsx">' + ic('table') + '엑셀로 저장</button>' : '') + '<button class="btn" data-act="item-paste">' + ic('table') + '엑셀에서 붙여넣기</button><button class="btn primary" data-act="item-add">' + ic('plus') + '품목 추가</button></div></div>' +
    misHtml() +
    '<div class="searchrow"><input class="in" type="search" id="iq" placeholder="품목 · 규격 · 분류 · 비고로 찾기" value="' + esc(S.itemQuery) + '" aria-label="품목 찾기"></div>' +
    '<div class="iwrap" id="ilist">' + itemRowsHtml() + '</div>' +
    '<p class="note" style="margin:12px 0 0">' + C.ic('check') + '<span>여기 단가는 <mark class="hl-y"><b>기본값</b></mark>이에요. 문서마다 단가 · 일수 · 수량을 <mark class="hl-g">따로 고칠 수 있어요</mark>.</span></p></section>' +
    '<section class="card setcard"><div class="card-h"><h2>' + ic('layers') + '품목 세트</h2><span class="hint">자주 같이 나가는 품목을 한 번에 넣어요</span>' +
    '<div class="tools"><button class="btn primary" data-act="set-add">' + ic('plus') + '세트 만들기</button></div></div>' +
    '<div id="slist">' + setCardsHtml() + '</div></section>' +
    '</div>';
}

function repaint() {
  const { $ } = C;
  const a = $('#catlist'), b = $('#cattools'), c = $('#ilist');
  if (a) a.innerHTML = catListHtml();
  if (b) b.innerHTML = catToolsHtml();
  if (c) c.innerHTML = itemRowsHtml();
}

/* ── 분류 순서 끌기 (PC: 마우스로 눌러 끌기 · 휴대폰/태블릿: 꾹 눌러(0.35초) 끌기 · 손잡이는 바로) ── */
function bindCatSort() {
  let drag = null, timer = null, sx = 0, sy = 0;
  const box = () => document.getElementById('catSort');
  const moveTo = (y) => {
    const b = box(); if (!b || !drag) return;
    let before = b.querySelector('.csrow.fixed');
    for (const s of b.querySelectorAll('.csrow[data-cat]')) { if (s === drag) continue; const r = s.getBoundingClientRect(); if (y < r.top + r.height / 2) { before = s; break; } }
    if (drag.nextSibling !== before) b.insertBefore(drag, before);
  };
  const start = (row) => { drag = row; row.classList.add('dragging'); document.body.classList.add('cs-dragging'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* 무시 */ } };
  const end = () => { clearTimeout(timer); timer = null; if (drag) { drag.classList.remove('dragging'); drag = null; } document.body.classList.remove('cs-dragging'); };
  // 마우스
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const row = e.target.closest && e.target.closest('#catSort .csrow[data-cat]'); if (!row) return;
    e.preventDefault(); start(row);
    const mv = (ev) => moveTo(ev.clientY);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); end(); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
  // 손가락: 꾹 누르면 끌기 시작, 그 전에 움직이면(화면 넘기기) 취소
  document.addEventListener('touchstart', (e) => {
    const row = e.target.closest && e.target.closest('#catSort .csrow[data-cat]'); if (!row || e.touches.length > 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    if (e.target.closest('.csgrip')) { start(row); return; }
    clearTimeout(timer); timer = setTimeout(() => start(row), 350);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (drag) { e.preventDefault(); moveTo(e.touches[0].clientY); return; }
    if (timer && (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8)) { clearTimeout(timer); timer = null; }
  }, { passive: false });
  document.addEventListener('touchend', end); document.addEventListener('touchcancel', end);
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('#catSort')) e.preventDefault(); });
  // 키보드
  document.addEventListener('keydown', (e) => {
    const row = e.target.closest && e.target.closest('#catSort .csrow[data-cat]'); if (!row || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault(); const b = row.parentElement;
    if (e.key === 'ArrowUp' && row.previousElementSibling) b.insertBefore(row, row.previousElementSibling);
    else if (e.key === 'ArrowDown' && row.nextElementSibling && row.nextElementSibling.dataset.cat) b.insertBefore(row.nextElementSibling, row);
    row.focus();
  });
}

/* ── 품목 추가 · 수정 ── */
/** 칸이 밀린 것 같은 품목 안내 (분류에 품목 이름, 품목에 크기가 들어간 것) */
function misHtml() {
  const list = misplacedItems(C.S.data.items); if (!list.length) return '';
  const ex = list[0];
  return '<div class="mis-note">' + C.ic('alert') + '<span><b>칸이 밀린 것 같은 품목 ' + list.length + '개</b> — 예: 분류 「' + C.esc(ex.cat) + '」 · 품목 「' + C.esc(ex.name) + '」 · 규격 없음. 문서에는 <b>품목</b> 칸 = 「' + C.esc(ex.name) + '」, <b>규격</b> 칸 = 빈칸으로 들어가요.</span><button type="button" class="btn sm primary" data-act="item-fixmis">확인하고 바로잡기</button></div>';
}
function openFixMis() {
  const { S, esc, openModal, toast, changed } = C;
  const list = misplacedItems(S.data.items); if (!list.length) return;
  openModal({
    icon: 'layers', title: '칸이 밀린 품목 바로잡기', ok: '바로잡기', cancel: '그대로 두기',
    body: '<p>아래 품목은 <b>분류</b> 칸에 품목 이름이, <b>품목</b> 칸에 크기 · 모양이 들어간 것 같아요. 체크한 품목을 <mark class="hl-y"><b>품목 ← 분류</b>, <b>규격 ← 품목</b></mark>으로 옮겨요. (분류는 그대로, 세트 · 작성 중 문서의 그 품목 줄도 같이 고쳐요)</p>' +
      '<div class="mis-list">' + list.map((it) => '<label class="pk-row"><input type="checkbox" data-mis="' + it.id + '" checked><span class="pk-nm"><b>' + esc(it.cat) + ' / ' + esc(it.name) + '</b><small>→ 품목 「' + esc(it.cat) + '」 · 규격 「' + esc(it.name) + '」</small></span></label>').join('') + '</div>',
    onOk: () => {
      const ids = [...document.querySelectorAll('[data-mis]:checked')].map((x) => x.dataset.mis);
      if (!ids.length) return;
      const r = fixMisplaced(S.data, ids);
      changed(); C.render();
      toast('품목 ' + r.items + '개를 바로잡았어요' + (r.sets ? ' · 세트 줄 ' + r.sets + '개' : '') + (r.lines ? ' · 작성 중 문서 줄 ' + r.lines + '개' : ''));
    }
  });
}
function itemForm(it) {
  const { S, esc } = C;
  const cats = categories(S.data.items, catOrder()).filter((c) => c.name !== NO_CAT).map((c) => '<option value="' + esc(c.name) + '">').join('');
  const f = (k, label, v, extra = '', cls = '') => '<label class="fld ' + cls + '"><span>' + label + '</span><input class="in" data-if="' + k + '" value="' + esc(v) + '"' + extra + '></label>';
  return '<div class="fgrid">' +
    f('cat', '분류 <small class="dim">(묶음 이름)</small>', it.cat || '', ' list="catOpts" placeholder="예: 천막"') + '<datalist id="catOpts">' + cats + '</datalist>' +
    f('name', '품목 <em class="req">*</em> <small class="dim">(문서 「품목」 칸)</small>', it.name || '', ' placeholder="예: 천막텐트"') +
    f('spec', '규격 <small class="dim">(문서 「규격」 칸)</small>', it.spec || '', ' placeholder="예: 3m×6m"') +
    f('price', '기본 단가 (원)', it.price != null ? won(it.price) : '', ' inputmode="numeric" placeholder="0" data-money') +
    f('days', '기본 일수', it.days != null ? it.days : 1, ' inputmode="decimal"') +
    f('memo', '비고', it.memo || '', ' placeholder="예: 기사 포함"') +
    '<label class="chkrow span2"><input type="checkbox" data-if="taxFree"' + (it.taxFree ? ' checked' : '') + '><span><b>면세 품목</b> — 부가세를 받지 않는 품목이에요 (문서에서 세액 0)</span></label>' +
    '</div><p class="note" id="ifMsg" style="margin:4px 0 0;display:none"></p>';
}

function openItem(id) {
  const { S, $, ic, uid, toast, openModal, changed } = C;
  const old = id ? S.data.items.find((x) => x.id === id) : null;
  let dupOk = false;
  const seed = old || { cat: S.itemCat && S.itemCat !== NO_CAT ? S.itemCat : '', days: 1 };
  openModal({
    icon: 'layers', title: old ? '품목 수정' : '품목 추가', body: itemForm(seed), ok: old ? '수정 저장' : '추가', cancel: '취소',
    onOk: () => {
      const v = {}; document.querySelectorAll('[data-if]').forEach((el) => { v[el.dataset.if] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
      const msg = $('#ifMsg');
      const say = (t) => { msg.style.display = 'flex'; msg.innerHTML = ic('alert') + '<span>' + t + '</span>'; };
      if (!v.name) { say('품목 이름을 넣어 주세요.'); $('[data-if="name"]').focus(); return false; }
      const price = v.price === '' ? 0 : toNum(v.price);
      if (price === null || price < 0) { say('기본 단가는 숫자로 넣어 주세요. (예: 170,000)'); $('[data-if="price"]').focus(); return false; }
      const days = v.days === '' ? 1 : toNum(v.days);
      if (days === null || days <= 0) { say('기본 일수는 0보다 큰 숫자로 넣어 주세요. (예: 1, 0.5)'); $('[data-if="days"]').focus(); return false; }
      const dup = findDuplicate(S.data.items, v, id);
      if (dup && !dupOk) { dupOk = true; say('같은 품목(이름 + 규격)이 이미 있어요. 그래도 저장하려면 한 번 더 누르세요.'); return false; }
      const now = new Date().toISOString();
      const rec = { cat: v.cat === NO_CAT ? '' : v.cat, name: v.name, spec: v.spec, price, days, memo: v.memo, taxFree: !!v.taxFree };
      if (old) Object.assign(old, rec, { updatedAt: now });
      else S.data.items.push({ id: uid('i'), ...rec, createdAt: now, updatedAt: now });
      changed(); C.render();
      toast(old ? '품목을 수정했어요' : '「' + v.name + '」를 추가했어요');
    }
  });
}

function deleteItem(id) {
  const { S, esc, toast, openModal, changed } = C;
  const it = S.data.items.find((x) => x.id === id); if (!it) return;
  const used = setsUsing(S.data.sets, id);
  openModal({
    tone: 'danger', icon: 'trash', title: '품목을 삭제할까요?',
    body: '<p><b>' + esc(it.name) + (it.spec ? ' · ' + esc(it.spec) : '') + '</b></p>' +
      (used.length ? '<p class="warnbox">세트 ' + used.length + '개에 들어 있어요: ' + used.map(esc).join(', ') + '<br>세트에는 지금 정보(이름 · 규격 · 단가)가 그대로 남아요.</p>' : '') +
      '<p><mark class="hl-g">이미 만든 문서는 바뀌지 않아요</mark>. 휴지통에 <mark class="hl-g">30일 동안 보관</mark>해요.</p>', ok: '삭제', cancel: '취소',
    onOk: () => {
      S.data.items = S.data.items.filter((x) => x.id !== id);
      S.data.trash.push({ kind: 'item', item: it, deletedAt: new Date().toISOString() });
      changed(); C.render();
      toast('휴지통으로 옮겼어요', { label: '되돌리기', fn: () => restore('item', id) });
    }
  });
}

function restore(kind, id) {
  const { S, toast, changed } = C;
  const i = S.data.trash.findIndex((t) => t.kind === kind && t.item.id === id); if (i < 0) return;
  (kind === 'item' ? S.data.items : S.data.sets).push(S.data.trash[i].item); S.data.trash.splice(i, 1);
  changed(); C.render(); toast('되돌렸어요');
}

/* ── 분류 ── */
function renameCat() {
  const { S, $, esc, ic, toast, openModal, changed } = C;
  const from = S.itemCat;
  openModal({
    icon: 'type', title: '분류 이름 바꾸기',
    body: '<label class="fld"><span>새 이름</span><input class="in" id="catNew" value="' + esc(from) + '"></label><p class="note" id="cnMsg" style="margin:4px 0 0;display:none"></p>' +
      '<p class="note" style="margin:0">' + ic('check') + '<span>이미 있는 분류 이름을 쓰면 <mark class="hl-p">두 분류가 합쳐져요</mark>.</span></p>',
    ok: '바꾸기', cancel: '취소',
    onOk: () => {
      const to = $('#catNew').value.trim();
      if (!to) { const m = $('#cnMsg'); m.style.display = 'flex'; m.innerHTML = ic('alert') + '<span>이름을 넣어 주세요.</span>'; return false; }
      if (to === from) return;
      const n = renameCategory(S.data.items, from, to);
      if (S.data.settings.catOrder) S.data.settings.catOrder = renameInOrder(S.data.settings.catOrder, from, to === NO_CAT ? '' : to);
      S.itemCat = to === NO_CAT ? NO_CAT : to; changed(); C.render();
      toast('품목 ' + n + '개의 분류를 「' + to + '」로 바꿨어요');
    }
  });
}
function deleteCat() {
  const { S, esc, toast, openModal, changed } = C;
  const name = S.itemCat;
  const n = S.data.items.filter((i) => (i.cat || '').trim() === name).length;
  openModal({
    tone: 'danger', icon: 'trash', title: '분류를 지울까요?',
    body: '<p><b>' + esc(name) + '</b> (품목 ' + n + '개)</p><p>품목은 지우지 않고 「분류 없음」으로 옮겨요.</p>', ok: '분류 지우기', cancel: '취소',
    onOk: () => { removeCategory(S.data.items, name); S.itemCat = ''; changed(); C.render(); toast('분류를 지웠어요. 품목 ' + n + '개는 「분류 없음」으로 옮겼어요'); }
  });
}

/* ── 엑셀에서 붙여넣기 ── */
function pastePreview() {
  const { S, $, esc } = C;
  const box = $('#pvPaste'); if (!box) return;
  const r = parsePaste($('#pasteIn').value);
  const upd = $('#pasteUpd') && $('#pasteUpd').checked;
  if (!r.rows.length) { box.innerHTML = '<p class="dim">엑셀에서 품목 칸을 복사(Ctrl+C)한 뒤 위 칸에 붙여넣기(Ctrl+V) 하세요.</p>'; $('#mOk').textContent = '넣기'; return; }
  let add = 0, up = 0, same = 0;
  const seen = [];
  const rows = r.rows.map((x) => {
    const dup = findDuplicate(S.data.items, x) || findDuplicate(seen, x);
    seen.push({ id: 'p' + seen.length, ...x });
    let st;
    if (!dup) { st = '<em class="st-new">새 품목</em>'; add++; }
    else if (upd && dup.id[0] !== 'p' && dup.price !== x.price) { st = '<em class="st-up">단가 바꿈 ' + won(dup.price) + ' → ' + won(x.price) + '</em>'; up++; }
    else { st = '<em class="st-skip">이미 있음 · 건너뜀</em>'; same++; }
    return '<tr><td>' + esc(x.cat || '-') + '</td><td><b>' + esc(x.name) + '</b></td><td>' + esc(x.spec || '-') + '</td><td class="num">' + won(x.price) + '</td><td>' + st + '</td></tr>';
  }).join('');
  box.innerHTML = '<p class="pv-sum">' + (r.header ? '첫 줄 머리글을 읽어 칸을 맞췄어요. ' : '') + '새 품목 <b>' + add + '</b>개' + (up ? ' · 단가 바꿈 <b>' + up + '</b>개' : '') + (same ? ' · 건너뜀 ' + same + '개' : '') + (r.skipped ? ' · 읽지 못한 줄 ' + r.skipped + '개' : '') + '</p>' +
    '<div class="pv-scroll"><table class="itable mini"><thead><tr><th>분류</th><th>품목</th><th>규격</th><th class="num">단가</th><th>처리</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  $('#mOk').textContent = add + up ? (add + up) + '개 넣기' : '넣기';
}

function openPaste() {
  const { S, $, ic, toast, openModal, changed, uid } = C;
  openModal({
    wide: true, icon: 'table', title: '엑셀에서 품목 붙여넣기',
    body: '<p>엑셀에서 <b>분류 · 품목 · 규격 · 단가</b> 칸을 <mark class="hl-y">드래그해 복사한 뒤</mark> 아래에 붙여넣으세요. 첫 줄에 <mark class="hl-g">머리글</mark>이 있으면 순서가 달라도 알아서 맞춰요.</p>' +
      '<textarea class="in ta-paste" id="pasteIn" rows="6" placeholder="분류&#9;품목&#9;규격&#9;단가&#10;천막&#9;몽골텐트&#9;5×5m&#9;170,000" aria-label="붙여넣을 표"></textarea>' +
      '<label class="chkrow"><input type="checkbox" id="pasteUpd"><span>이미 있는 품목(이름 + 규격이 같은 것)은 <b>단가를 새 값으로 바꾸기</b></span></label>' +
      '<div id="pvPaste"></div>',
    ok: '넣기', cancel: '취소',
    onOk: () => {
      const r = parsePaste($('#pasteIn').value);
      if (!r.rows.length) { toast('붙여넣은 품목이 없어요'); return false; }
      const upd = $('#pasteUpd').checked, now = new Date().toISOString();
      let add = 0, up = 0;
      for (const x of r.rows) {
        const dup = findDuplicate(S.data.items, x);
        if (!dup) { S.data.items.push({ id: uid('i'), cat: x.cat, name: x.name, spec: x.spec, price: x.price, days: x.days, memo: x.memo, taxFree: false, createdAt: now, updatedAt: now }); add++; }
        else if (upd && dup.price !== x.price) { dup.price = x.price; dup.updatedAt = now; up++; }
      }
      if (!add && !up) { toast('새로 넣을 품목이 없어요 (모두 이미 있어요)'); return false; }
      changed(); C.render();
      toast('품목 ' + add + '개를 넣었어요' + (up ? ' · 단가 ' + up + '개 바꿈' : ''));
    }
  });
  pastePreview();
}

/* ── 세트 만들기 · 수정 ── */
function itemOptions(selId) {
  const { S, esc } = C;
  const groups = categories(S.data.items, catOrder()).map((c) => {
    const its = filterItems(S.data.items, { cat: c.name, order: catOrder() });
    return '<optgroup label="' + esc(c.name) + '">' + its.map((i) => '<option value="' + i.id + '"' + (i.id === selId ? ' selected' : '') + '>' + esc(i.name) + (i.spec ? ' · ' + esc(i.spec) : '') + ' (' + won(i.price) + '원)</option>').join('') + '</optgroup>';
  }).join('');
  return '<option value="">품목 고르기</option>' + groups;
}
function setLineHtml(l, n) {
  const { esc, ic, S } = C;
  const gone = l.itemId && !S.data.items.some((i) => i.id === l.itemId);
  const sel = gone
    ? '<select class="in" data-sl="item" aria-label="품목"><option value="' + esc(l.itemId) + '" selected data-gone="1">' + esc(l.name) + ' (지운 품목)</option>' + itemOptions('') + '</select>'
    : '<select class="in" data-sl="item" aria-label="품목">' + itemOptions(l.itemId || '') + '</select>';
  return '<div class="sline" data-n="' + n + '"' + (gone ? ' data-gone=\'' + esc(JSON.stringify({ itemId: l.itemId, name: l.name, spec: l.spec, price: l.price, taxFree: l.taxFree })) + '\'' : '') + '>' +
    '<span class="sl-no">' + (n + 1) + '</span>' + sel +
    '<label class="sl-n"><span>일수</span><input class="in" data-sl="days" inputmode="decimal" value="' + esc(l.days ?? 1) + '"></label>' +
    '<label class="sl-n"><span>수량</span><input class="in" data-sl="qty" inputmode="decimal" value="' + esc(l.qty ?? 1) + '"></label>' +
    '<b class="sl-amt num" data-sl-amt>0원</b>' +
    '<button class="icbtn" data-act="sl-del" aria-label="이 줄 빼기">' + ic('x') + '</button></div>';
}
function readSetLines() {
  const { S } = C;
  return [...document.querySelectorAll('.sline')].map((row) => {
    const id = row.querySelector('[data-sl="item"]').value;
    const it = S.data.items.find((i) => i.id === id);
    const days = toNum(row.querySelector('[data-sl="days"]').value), qty = toNum(row.querySelector('[data-sl="qty"]').value);
    if (it) return { row, line: snapshotLine(it, qty ?? 0, days ?? 0) };
    if (id && row.dataset.gone) { const g = JSON.parse(row.dataset.gone); if (g.itemId === id) return { row, line: { ...g, qty: qty ?? 0, days: days ?? 0 } }; }
    return { row, line: null };
  });
}
function setTotals() {
  const { $ } = C;
  let sum = 0;
  readSetLines().forEach(({ row, line }, i) => {
    row.querySelector('.sl-no').textContent = i + 1;
    const a = line ? lineAmount(line) : 0; sum += a;
    row.querySelector('[data-sl-amt]').textContent = line ? won(a) + '원' : '-';
  });
  const t = $('#setSum'); if (t) t.textContent = won(sum) + '원';
}

function openSet(id, copyFrom) {
  const { S, $, esc, ic, uid, toast, openModal, changed } = C;
  if (!S.data.items.length) {
    openModal({ icon: 'layers', title: '먼저 품목을 넣어 주세요', body: '<p>세트는 등록한 품목으로 만들어요. 위쪽 <b>품목 추가</b> 또는 <b>엑셀에서 붙여넣기</b>로 품목부터 넣어 주세요.</p>', ok: '품목 추가하기', cancel: '닫기', onOk: () => { setTimeout(() => openItem(null), 0); } });
    return;
  }
  const old = id ? S.data.sets.find((s) => s.id === id) : null;
  const base = old || copyFrom || { name: '', memo: '', lines: [{ itemId: '', qty: 1, days: 1 }] };
  openModal({
    wide: true, icon: 'layers', title: old ? '세트 수정' : '세트 만들기',
    body: '<div class="fgrid"><label class="fld"><span>세트 이름 <em class="req">*</em></span><input class="in" id="setName" value="' + esc(copyFrom ? base.name + ' (복사)' : base.name) + '" placeholder="예: 몽골텐트 기본 세트"></label>' +
      '<label class="fld"><span>메모</span><input class="in" id="setMemo" value="' + esc(base.memo || '') + '" placeholder="예: 소규모 행사용"></label></div>' +
      '<div class="slines" id="slines">' + base.lines.map(setLineHtml).join('') + '</div>' +
      '<button class="addline" data-act="sl-add">' + ic('plus') + '품목 더하기</button>' +
      '<div class="setsum"><span>세트 금액 <small>(부가세 전 · 일수 × 수량 × 기본 단가)</small></span><b class="num" id="setSum">0원</b></div>' +
      '<p class="note" id="sfMsg" style="margin:0;display:none"></p>' +
      '<p class="note" style="margin:0">' + ic('check') + '<span>문서에 세트를 넣으면 품목이 한 줄씩 펼쳐져 들어가고, 넣은 뒤에 고칠 수 있어요.</span></p>',
    ok: old ? '수정 저장' : '세트 저장', cancel: '취소',
    onOk: () => {
      const msg = $('#sfMsg');
      const say = (t) => { msg.style.display = 'flex'; msg.innerHTML = ic('alert') + '<span>' + t + '</span>'; };
      const name = $('#setName').value.trim();
      if (!name) { say('세트 이름을 넣어 주세요.'); $('#setName').focus(); return false; }
      const read = readSetLines();
      const lines = read.map((r) => r.line).filter(Boolean);
      if (!lines.length) { say('품목을 하나 이상 골라 주세요.'); return false; }
      if (lines.some((l) => !(l.qty > 0) || !(l.days > 0))) { say('일수와 수량은 0보다 큰 숫자로 넣어 주세요.'); return false; }
      const now = new Date().toISOString();
      if (old) Object.assign(old, { name, memo: $('#setMemo').value.trim(), lines, updatedAt: now });
      else S.data.sets.push({ id: uid('s'), name, memo: $('#setMemo').value.trim(), lines, createdAt: now, updatedAt: now });
      changed(); C.render();
      toast(old ? '세트를 수정했어요' : '「' + name + '」 세트를 만들었어요' + (read.length > lines.length ? ' (품목을 고르지 않은 줄은 뺐어요)' : ''));
    }
  });
  setTotals();
}

function deleteSet(id) {
  const { S, esc, toast, openModal, changed } = C;
  const s = S.data.sets.find((x) => x.id === id); if (!s) return;
  openModal({
    tone: 'danger', icon: 'trash', title: '세트를 삭제할까요?',
    body: '<p><b>' + esc(s.name) + '</b> (품목 ' + s.lines.length + '개)</p><p>품목은 그대로 남아요. 세트만 휴지통에 30일 동안 보관해요.</p>', ok: '삭제', cancel: '취소',
    onOk: () => {
      S.data.sets = S.data.sets.filter((x) => x.id !== id);
      S.data.trash.push({ kind: 'set', item: s, deletedAt: new Date().toISOString() });
      changed(); C.render();
      toast('휴지통으로 옮겼어요', { label: '되돌리기', fn: () => restore('set', id) });
    }
  });
}

/* ── 움직임 (main.mjs 가 먼저 불러 줌. 처리했으면 true) ── */
export function itemsClick(act, a) {
  const { S } = C;
  switch (act) {
    case 'cat-pick': S.itemCat = a.dataset.cat; if (uxMode()) { S.itemTab = 'item'; if (uxMode() === 'b') setLvl(2); C.render(); } else repaint(); return true;
    case 'item-tab': S.itemTab = a.dataset.v; S.catSort = false; if (uxMode() === 'b') setLvl(2); C.render(); return true;
    case 'item-pick': { S.itemSel = a.dataset.id; const it = S.data.items.find((i) => i.id === S.itemSel); if (isPhone() && it && openSheet(itemDetailHtml(it))) return true; C.render(); return true; }
    case 'set-pick': { S.setSel = a.dataset.id; if (!isPhone()) S.itemTab = 'set'; const st = S.data.sets.find((x) => x.id === S.setSel); if (isPhone() && st && openSheet(setDetailHtml(st))) return true; C.render(); return true; }
    case 'cat-rename': renameCat(); return true;
    case 'cat-del': deleteCat(); return true;
    case 'item-add': openItem(null); return true;
    case 'item-fixmis': openFixMis(); return true;
    case 'cat-sort': S.catSort = true; S.itemCat = ''; C.render(); return true;
    case 'cat-sort-cancel': S.catSort = false; C.render(); return true;
    case 'cat-sort-save': {
      const order = [...document.querySelectorAll('#catSort .csrow[data-cat]')].map((r) => r.dataset.cat);
      S.data.settings.catOrder = order; S.catSort = false; C.changed(); C.render();
      C.toast('분류 순서를 저장했어요'); return true;
    }
    case 'item-edit': openItem(a.dataset.id); return true;
    case 'item-del': deleteItem(a.dataset.id); return true;
    case 'item-paste': openPaste(); return true;
    case 'set-add': openSet(null); return true;
    case 'set-edit': openSet(a.dataset.id); return true;
    case 'set-copy': { const s = S.data.sets.find((x) => x.id === a.dataset.id); if (s) openSet(null, JSON.parse(JSON.stringify(s))); return true; }
    case 'set-del': deleteSet(a.dataset.id); return true;
    case 'sl-add': {
      const box = C.$('#slines'); const n = box.children.length;
      box.insertAdjacentHTML('beforeend', setLineHtml({ itemId: '', qty: 1, days: 1 }, n));
      box.lastElementChild.querySelector('select').focus(); setTotals(); return true;
    }
    case 'sl-del': {
      const box = C.$('#slines'); const row = a.closest('.sline');
      if (box.children.length <= 1) { row.querySelector('select').value = ''; } else row.remove();
      setTotals(); return true;
    }
  }
  return false;
}

export function itemsInput(t) {
  const { S } = C;
  if (t.id === 'iq') { S.itemQuery = t.value; C.$('#ilist').innerHTML = itemRowsHtml(); return true; }
  if (t.id === 'pasteIn' || t.id === 'pasteUpd') { pastePreview(); return true; }
  if (t.dataset && t.dataset.sl) {
    if (t.dataset.sl === 'item' && t.value) {   // 품목을 고르면 일수를 그 품목의 기본 일수로
      const it = S.data.items.find((i) => i.id === t.value);
      const d = t.closest('.sline').querySelector('[data-sl="days"]');
      if (it && d && (d.value === '' || d.value === '1')) d.value = toNum(it.days) ?? 1;
    }
    setTotals(); return true;
  }
  return false;
}

/** 단가 칸: 칸을 떠날 때 쉼표 넣기 */
export function itemsBlur(t) {
  if (t.dataset && t.dataset.money !== undefined && t.value) { const n = toNum(t.value); if (n !== null) t.value = won(n); return true; }
  return false;
}
