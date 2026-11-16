// 스타미디어 견적서 발행기 — 품목 · 세트 화면 (1단계 둘째 묶음)
// 규칙(분류 · 중복 · 세트 펼치기 · 엑셀 붙여넣기)은 core/catalog.mjs (node 시험 통과한 것)를 쓴다.
import { categories, filterItems, findDuplicate, renameCategory, removeCategory, setsUsing, expandSet, setAmount, snapshotLine, parsePaste, toNum, NO_CAT } from './core/catalog.mjs?v=mwj79qfo';
import { lineAmount } from './core/money.mjs?v=mwj79qfo';

let C = null;   // main.mjs 가 넘겨주는 도구 { S, $, esc, ic, uid, toast, openModal, changed, render }
export function initItems(ctx) { C = ctx; }

const won = (n) => (Math.round(Number(n) || 0)).toLocaleString('ko-KR');
const dayTxt = (d) => (d === 1 ? '1일' : String(d).replace(/\.0+$/, '') + '일');

/* ── 화면 ── */
function catListHtml() {
  const { S, esc } = C;
  const cats = categories(S.data.items);
  const btn = (key, label, n) => '<button class="catb' + (S.itemCat === key ? ' on' : '') + '" data-act="cat-pick" data-cat="' + esc(key) + '"' + (S.itemCat === key ? ' aria-pressed="true"' : '') + '><span>' + esc(label) + '</span><em>' + n + '</em></button>';
  return btn('', '전체', S.data.items.length) + cats.map((c) => btn(c.name, c.name, c.count)).join('');
}
function catToolsHtml() {
  const { S, esc, ic } = C;
  if (!S.itemCat || S.itemCat === NO_CAT || !S.data.items.some((i) => (i.cat || '').trim() === S.itemCat)) {
    return '<p class="cat-help">분류는 품목을 넣을 때 「분류」 칸에 이름을 쓰면 저절로 생겨요.</p>';
  }
  return '<div class="cat-tools"><b>' + esc(S.itemCat) + '</b><button class="btn sm" data-act="cat-rename">' + ic('type') + '이름 바꾸기</button>' +
    '<button class="btn sm danger-o" data-act="cat-del">' + ic('trash') + '분류 지우기</button></div>';
}

function itemRowsHtml() {
  const { S, esc, ic } = C;
  if (!S.data.items.length) return '<div class="empty">아직 등록한 품목이 없어요.<br><b>품목 추가</b>를 누르거나, 지금 쓰는 엑셀 견적서의 품목 칸을 복사해 <b>엑셀에서 붙여넣기</b>로 한 번에 넣어 보세요.</div>';
  const list = filterItems(S.data.items, { cat: S.itemCat, q: S.itemQuery });
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

export function itemsPage() {
  const { S, esc, ic } = C;
  return '<div class="itempage">' +
    '<aside class="card catcard"><div class="card-h"><h2>' + ic('grid') + '분류</h2></div><div class="catlist" id="catlist">' + catListHtml() + '</div><div id="cattools">' + catToolsHtml() + '</div></aside>' +
    '<section class="card itemcard"><div class="card-h"><h2>' + ic('layers') + '품목 목록</h2><span class="hint">' + S.data.items.length + '개</span>' +
    '<div class="tools">' + (S.data.items.length ? '<button class="btn" data-act="x-items-xlsx">' + ic('table') + '엑셀로 저장</button>' : '') + '<button class="btn" data-act="item-paste">' + ic('table') + '엑셀에서 붙여넣기</button><button class="btn primary" data-act="item-add">' + ic('plus') + '품목 추가</button></div></div>' +
    '<div class="searchrow"><input class="in" type="search" id="iq" placeholder="품목 · 규격 · 분류 · 비고로 찾기" value="' + esc(S.itemQuery) + '" aria-label="품목 찾기"></div>' +
    '<div class="iwrap" id="ilist">' + itemRowsHtml() + '</div>' +
    '<p class="note" style="margin:12px 0 0">' + C.ic('check') + '<span>여기 단가는 <b>기본값</b>이에요. 문서마다 단가 · 일수 · 수량을 따로 고칠 수 있어요.</span></p></section>' +
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

/* ── 품목 추가 · 수정 ── */
function itemForm(it) {
  const { S, esc } = C;
  const cats = categories(S.data.items).filter((c) => c.name !== NO_CAT).map((c) => '<option value="' + esc(c.name) + '">').join('');
  const f = (k, label, v, extra = '', cls = '') => '<label class="fld ' + cls + '"><span>' + label + '</span><input class="in" data-if="' + k + '" value="' + esc(v) + '"' + extra + '></label>';
  return '<div class="fgrid">' +
    f('cat', '분류', it.cat || '', ' list="catOpts" placeholder="예: 천막"') + '<datalist id="catOpts">' + cats + '</datalist>' +
    f('name', '품목 <em class="req">*</em>', it.name || '', ' placeholder="예: 몽골텐트"') +
    f('spec', '규격', it.spec || '', ' placeholder="예: 5×5m"') +
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
      '<p>이미 만든 문서는 바뀌지 않아요. 휴지통에 30일 동안 보관해요.</p>', ok: '삭제', cancel: '취소',
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
      '<p class="note" style="margin:0">' + ic('check') + '<span>이미 있는 분류 이름을 쓰면 두 분류가 합쳐져요.</span></p>',
    ok: '바꾸기', cancel: '취소',
    onOk: () => {
      const to = $('#catNew').value.trim();
      if (!to) { const m = $('#cnMsg'); m.style.display = 'flex'; m.innerHTML = ic('alert') + '<span>이름을 넣어 주세요.</span>'; return false; }
      if (to === from) return;
      const n = renameCategory(S.data.items, from, to);
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
    body: '<p>엑셀에서 <b>분류 · 품목 · 규격 · 단가</b> 칸을 드래그해 복사한 뒤 아래에 붙여넣으세요. 첫 줄에 머리글이 있으면 순서가 달라도 알아서 맞춰요.</p>' +
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
  const groups = categories(S.data.items).map((c) => {
    const its = filterItems(S.data.items, { cat: c.name });
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
    case 'cat-pick': S.itemCat = a.dataset.cat; repaint(); return true;
    case 'cat-rename': renameCat(); return true;
    case 'cat-del': deleteCat(); return true;
    case 'item-add': openItem(null); return true;
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
