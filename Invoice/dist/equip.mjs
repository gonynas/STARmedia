// 화면: 장비 관리 (#equip) + 행사 화면의 「장비」 카드
// 장비: { id, cat, name, spec, total, price, memo, createdAt, updatedAt }   (S.data.equipment)
// 행사에 넣은 장비: event.gear = [{ equipId, qty }], 반출 event.out · 반납 event.back, 부족 사유 event.gearNote
// 3차 시안 요구: 수정 · 삭제 버튼, 체크해서 여러 개 한꺼번에 삭제, − + 로 바꾼 총 수량은 「변경 저장」을 눌러야 반영, 할 때마다 확인 창.
// 부족은 숨기지 않고 「N개 부족」으로 보여 준다. 계산은 core/reports.mjs (node 시험 통과).
import { equipmentOn, equipState, gearShortage, gearRange, usageOn } from './core/reports.mjs?v=mwnja3le';
import { toNum } from './core/catalog.mjs?v=mwnja3le';
import { ymd, dateKo, dateShort } from './core/docs.mjs?v=mwnja3le';
import { won } from './docview.mjs?v=mwnja3le';

let C;
export function initEquip(ctx) { C = ctx; }
const UI = { sel: {}, pending: {} };      // 체크한 장비 · 아직 저장 안 한 총 수량
const list = () => C.S.data.equipment || (C.S.data.equipment = []);
const byId = (id) => list().find((q) => q.id === id);
const day = () => C.S.equipDay || ymd();
const label = (q) => C.esc(q.name) + (q.spec ? ' ' + C.esc(q.spec) : '');
const totalOf = (q) => (UI.pending[q.id] !== undefined ? UI.pending[q.id] : Number(q.total) || 0);
const cats = () => [...new Set(list().map((q) => q.cat).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));

function stepper(id, value, changedFrom) {
  return '<div class="stepper' + (changedFrom !== undefined ? ' changed' : '') + '" data-eqid="' + id + '"><button type="button" class="stp" data-act="eq-step" data-d="-1" aria-label="1개 줄이기">' + C.ic('minus') + '</button>' +
    '<input class="in num" data-eqtotal="' + id + '" value="' + value + '" inputmode="numeric" aria-label="총 보유 수량"><button type="button" class="stp" data-act="eq-step" data-d="1" aria-label="1개 늘리기">' + C.ic('plus') + '</button></div>' +
    (changedFrom !== undefined ? '<small class="was">원래 ' + changedFrom + '개 · 저장 전</small>' : '');
}
function bar(total, left) {
  const st = equipState(total, left), pct = total ? Math.max(0, Math.round(left / total * 100)) : 0;
  const head = left < 0 ? '<b class="num">' + (-left) + '</b><span>개 모자람</span>' : '<b class="num">' + left + '</b><span>개 남음</span>';
  return '<div class="eqbar ' + st[0] + '"><div class="eqbar-t">' + head + '<em>' + st[1] + '</em></div><i><b style="width:' + (left < 0 ? 100 : pct) + '%"></b></i></div>';
}
function rowsAndCards() {
  const S = C.S, on = equipmentOn(S.data, day());
  const shown = on.filter((x) => !S.equipCat || x.equip.cat === S.equipCat).sort((a, b) => String(a.equip.cat).localeCompare(String(b.equip.cat), 'ko') || a.equip.name.localeCompare(b.equip.name, 'ko'));
  const acts = (q) => '<div class="eqacts"><button type="button" class="btn sm" data-act="eq-edit" data-id="' + q.id + '">' + C.ic('sliders') + '수정</button><button type="button" class="btn sm danger-o" data-act="eq-del" data-id="' + q.id + '">' + C.ic('trash') + '삭제</button></div>';
  const rows = shown.map(({ equip: q, out }) => {
    const tot = totalOf(q), sel = !!UI.sel[q.id];
    return '<tr class="' + (sel ? 'sel' : '') + '"><td class="c"><input type="checkbox" class="chk" data-eqsel="' + q.id + '"' + (sel ? ' checked' : '') + ' aria-label="' + label(q) + ' 선택"></td>' +
      '<td class="eqnm">' + (q.cat ? '<span class="eqcat">' + C.esc(q.cat) + '</span>' : '') + '<b>' + C.esc(q.name) + '</b><small>' + C.esc([q.spec, q.memo].filter(Boolean).join(' · ')) + (q.price ? ' · ' + won(q.price) + '원' : '') + '</small></td>' +
      '<td class="eqst">' + stepper(q.id, tot, UI.pending[q.id] !== undefined ? q.total : undefined) + '</td><td class="c num eqout"><b>' + out + '</b>개</td><td class="eqleft">' + bar(tot, tot - out) + '</td><td>' + acts(q) + '</td></tr>';
  }).join('');
  const cards = shown.map(({ equip: q, out }) => {
    const tot = totalOf(q), sel = !!UI.sel[q.id];
    return '<li class="eqcard' + (sel ? ' sel' : '') + '"><div class="eqc-top"><input type="checkbox" class="chk" data-eqsel="' + q.id + '"' + (sel ? ' checked' : '') + ' aria-label="' + label(q) + ' 선택">' + (q.cat ? '<span class="eqcat">' + C.esc(q.cat) + '</span>' : '') + '<b>' + C.esc(q.name) + '</b><small>' + C.esc(q.spec || '') + '</small></div>' +
      '<div class="eqc-mid"><div><span class="eqc-l">총 보유</span>' + stepper(q.id, tot, UI.pending[q.id] !== undefined ? q.total : undefined) + '</div><div class="eqc-out"><span class="eqc-l">이 날 나감</span><b class="num">' + out + '개</b></div></div>' + bar(tot, tot - out) + acts(q) + '</li>';
  }).join('');
  const none = list().length ? '선택한 분류에 장비가 없어요.' : '등록된 장비가 없어요. 「장비 등록」에서 먼저 넣어 주세요.';
  return { rows: rows || '<tr><td colspan="6" class="c empty-msg">' + none + '</td></tr>', cards: cards || '<li class="empty-msg">' + none + '</li>', shown };
}
function summary() {
  const on = equipmentOn(C.S.data, day());
  const total = on.reduce((s, x) => s + x.total, 0), out = on.reduce((s, x) => s + x.out, 0), warn = on.filter((x) => equipState(x.total, x.left)[0] !== 'ok').length;
  return '<div class="eqsum">' +
    '<div class="eqk"><span>' + C.ic('tent') + '등록한 장비</span><b class="num">' + on.length + '<small>종류</small></b></div>' +
    '<div class="eqk"><span>' + C.ic('layers') + '총 보유 수량</span><b class="num">' + won(total) + '<small>개</small></b></div>' +
    '<div class="eqk"><span>' + C.ic('truck') + dateShort(day()) + ' 나가는 장비</span><b class="num">' + won(out) + '<small>개</small></b></div>' +
    '<div class="eqk warn"><span>' + C.ic('alert') + '부족하거나 얼마 안 남음</span><b class="num">' + warn + '<small>종류</small></b></div></div>';
}
function bulkBar(shown) {
  const n = Object.keys(UI.sel).length, allOn = shown.length > 0 && shown.every((x) => UI.sel[x.equip.id]);
  return '<label class="chkall"><input type="checkbox" class="chk" id="eqAll"' + (allOn ? ' checked' : '') + '><span>보이는 장비 모두 선택</span></label><span class="seln"><b>' + n + '</b>개 선택</span>' +
    '<button type="button" class="btn sm danger" data-act="eq-delsel"' + (n ? '' : ' disabled') + '>' + C.ic('trash') + '선택한 장비 삭제</button>';
}
function pendBar() {
  return '<span class="pmsg">' + C.ic('alert') + '<span>수량을 바꾼 장비 <b>' + Object.keys(UI.pending).length + '</b>개 — <b>변경 저장</b>을 눌러야 반영돼요</span></span>' +
    '<button type="button" class="btn sm ghost" data-act="eq-revert">되돌리기</button><button type="button" class="btn sm primary" data-act="eq-save">' + C.ic('check') + '변경 저장</button>';
}

export function equipPage() {
  const S = C.S, r = rowsAndCards(), t = ymd();
  const quick = [[t, '오늘'], [addD(t, 1), '내일'], [addD(t, 7), '일주일 뒤']].map(([d, l]) => '<button type="button" class="fchip' + (day() === d ? ' on' : '') + '" data-act="eq-day" data-day="' + d + '">' + l + ' <small>' + dateShort(d) + '</small></button>').join('');
  const catChips = ['', ...cats()].map((c) => '<button type="button" class="fchip' + ((S.equipCat || '') === c ? ' on' : '') + '" data-act="eq-cat" data-cat="' + C.esc(c) + '">' + (c ? C.esc(c) : '전체') + '</button>').join('');
  return '<div class="eqpage">' +
    '<section class="card eq-sumcard">' + summary() + '</section>' +
    '<div class="eq-cols">' +
    '<section class="card eq-list"><div class="card-h"><h2>' + C.ic('tent') + '장비 목록</h2><span class="hint">− + 로 수량을 바꾸고 「변경 저장」 · 다른 내용은 「수정」</span></div>' +
    '<div class="eq-filter"><span class="ol">날짜</span><div class="fchips">' + quick + '<label class="eq-date"><input class="in" type="date" id="eqDay" value="' + day() + '" aria-label="날짜 고르기"></label></div></div>' +
    (cats().length ? '<div class="eq-filter"><span class="ol">분류</span><div class="fchips">' + catChips + '</div></div>' : '') +
    '<div class="eq-bulk" id="eqBulk">' + bulkBar(r.shown) + '</div>' +
    '<div class="tbl-wrap"><table class="tbl eqtbl"><thead><tr><th class="c">선택</th><th>장비 · 규격 · 기본 단가</th><th>총 보유 수량</th><th class="c">이 날 나감</th><th>남은 수량</th><th>관리</th></tr></thead><tbody id="eqrows">' + r.rows + '</tbody></table></div>' +
    '<ul class="eqcards" id="eqcards">' + r.cards + '</ul>' +
    '<div class="eq-pend" id="eqPend"' + (Object.keys(UI.pending).length ? '' : ' hidden') + '>' + pendBar() + '</div>' +
    '<p class="note eqnote">' + C.ic('calendar') + '<span>「이 날 나감」은 그날 <b>반출 ~ 반납</b> 기간에 걸친 행사의 장비를 더한 값이에요(취소한 행사 빼고). 행사에 장비를 넣는 곳은 <b>행사 · 입금 → 행사 한 건 → 장비</b>예요.</span></p>' +
    '</section>' +
    '<section class="card eq-form"><div class="card-h"><h2>' + C.ic('plus') + '장비 등록</h2></div>' + formHtml({}, 'n') +
    '<button type="button" class="btn primary big wide" data-act="eq-add">' + C.ic('plus') + '장비 등록하기</button>' +
    '<p class="note">' + C.ic('layers') + '<span>「품목에도 넣기」를 켜 두면 품목 · 세트에도 들어가서 견적서에서 바로 골라 쓸 수 있어요.</span></p></section></div></div>';
}
const addD = (s, n) => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); };

function formHtml(q, p) {
  const f = (lab, k, val, extra = '') => '<label class="fld"><span>' + lab + '</span><input class="in" id="' + p + k + '" value="' + C.esc(val == null ? '' : val) + '"' + extra + '></label>';
  return '<div class="fgrid one">' + f('장비 이름 <em class="req">*</em>', 'Name', q.name, ' placeholder="예: 몽골텐트"') +
    f('분류', 'Cat', q.cat, ' list="eqCats" placeholder="예: 천막" autocomplete="off"') + '<datalist id="eqCats">' + cats().map((c) => '<option value="' + C.esc(c) + '">').join('') + '</datalist>' +
    f('규격', 'Spec', q.spec, ' placeholder="예: 5×5m"') +
    '<div class="fld"><span>총 보유 수량</span><div class="stepper big" data-eqid="' + p + '"><button type="button" class="stp" data-act="eq-step" data-d="-1" aria-label="1개 줄이기">' + C.ic('minus') + '</button><input class="in num" id="' + p + 'Total" value="' + (q.total == null ? 1 : q.total) + '" inputmode="numeric" aria-label="총 보유 수량"><button type="button" class="stp" data-act="eq-step" data-d="1" aria-label="1개 늘리기">' + C.ic('plus') + '</button></div></div>' +
    f('기본 대여 단가 (원)', 'Price', q.price ? won(q.price) : '', ' inputmode="numeric" placeholder="예: 170,000"') +
    f('메모', 'Memo', q.memo, ' placeholder="예: 흰색 12 · 파랑 8"') +
    (p === 'n' ? '<label class="chkrow"><input type="checkbox" id="nToItem" checked><span><b>품목에도 넣기</b> — 견적서에서 바로 골라 쓰기</span></label>' : '') +
    '</div><p class="note" id="' + p + 'Msg" style="display:none;margin:6px 0 0"></p>';
}
function readForm(p) {
  const g = (k) => (document.getElementById(p + k) || {}).value || '';
  return { name: g('Name').trim(), cat: g('Cat').trim(), spec: g('Spec').trim(), total: Math.max(0, Math.round(toNum(g('Total')) || 0)), price: Math.max(0, Math.round(toNum(g('Price')) || 0)), memo: g('Memo').trim() };
}
const say = (p, t) => { const m = document.getElementById(p + 'Msg'); if (m) { m.style.display = 'flex'; m.innerHTML = C.ic('alert') + '<span>' + t + '</span>'; } };

function addEquip() {
  const v = readForm('n');
  if (!v.name) { say('n', '장비 이름을 넣어 주세요.'); document.getElementById('nName').focus(); return; }
  if (list().some((q) => q.name === v.name && (q.spec || '') === v.spec)) { say('n', '같은 이름 · 규격의 장비가 이미 있어요. 그 장비의 수량을 바꿔 주세요.'); return; }
  const toItem = document.getElementById('nToItem') && document.getElementById('nToItem').checked;
  C.openModal({
    icon: 'tent', title: '장비를 등록할까요?', body: '<p><b>' + C.esc(v.name) + (v.spec ? ' ' + C.esc(v.spec) : '') + '</b> · 총 ' + v.total + '개' + (v.price ? ' · 기본 단가 ' + won(v.price) + '원' : '') + '</p>' + (toItem ? '<p>품목 · 세트에도 같이 넣어요.</p>' : ''), ok: '등록',
    onOk: () => {
      const now = new Date().toISOString();
      list().push({ id: C.uid('g'), ...v, createdAt: now, updatedAt: now });
      if (toItem && !C.S.data.items.some((it) => it.name === v.name && (it.spec || '') === v.spec)) C.S.data.items.push({ id: C.uid('i'), cat: v.cat, name: v.name, spec: v.spec, price: v.price, days: 1, memo: v.memo, taxFree: false, createdAt: now, updatedAt: now });
      C.changed(); C.render(); C.toast('「' + v.name + '」을(를) 등록했어요');
    }
  });
}
function editEquip(id) {
  const q = byId(id); if (!q) return;
  C.openModal({
    icon: 'sliders', title: '장비 수정', body: formHtml(q, 'm'), ok: '수정 저장', wide: true,
    onOk: () => {
      const v = readForm('m');
      if (!v.name) { say('m', '장비 이름을 넣어 주세요.'); return false; }
      Object.assign(q, v, { updatedAt: new Date().toISOString() }); delete UI.pending[id];
      C.changed(); C.render(); C.toast('장비를 수정했어요');
    }
  });
}
function usedBy(id) { return C.S.data.events.filter((e) => e.status !== 'cancel' && (e.gear || []).some((g) => g.equipId === id)); }
function deleteEquip(ids) {
  const qs = ids.map(byId).filter(Boolean); if (!qs.length) return;
  const used = qs.filter((q) => usedBy(q.id).length);
  C.openModal({
    tone: 'danger', icon: 'trash', title: qs.length > 1 ? '장비 ' + qs.length + '개를 삭제할까요?' : '장비를 삭제할까요?',
    body: '<p><b>' + qs.map((q) => C.esc(q.name)).join(', ') + '</b></p>' + (used.length ? '<p class="warnbox">' + C.ic('alert') + '<span>' + used.map((q) => C.esc(q.name)).join(', ') + '은(는) 행사에 들어가 있어요. 삭제하면 그 행사들의 장비 목록에서도 빠져요.</span></p>' : '') + '<p>휴지통으로 옮겨 30일 동안 보관해요.</p>',
    ok: '삭제',
    onOk: () => {
      const now = new Date().toISOString();
      for (const q of qs) {
        C.S.data.equipment = list().filter((x) => x.id !== q.id);
        const gearOf = C.S.data.events.filter((e) => (e.gear || []).some((g) => g.equipId === q.id)).map((e) => ({ eventId: e.id, qty: e.gear.find((g) => g.equipId === q.id).qty }));
        C.S.data.events.forEach((e) => { if (e.gear) e.gear = e.gear.filter((g) => g.equipId !== q.id); });
        C.S.data.trash.push({ kind: 'equip', item: q, gearOf, deletedAt: now });
        delete UI.sel[q.id]; delete UI.pending[q.id];
      }
      C.changed(); C.render(); C.toast('휴지통으로 옮겼어요');
    }
  });
}
function savePending() {
  const ids = Object.keys(UI.pending); if (!ids.length) return;
  C.openModal({
    icon: 'check', title: '바꾼 수량을 저장할까요?', body: '<ul class="x-steps">' + ids.map((id) => { const q = byId(id); return q ? '<li><b>' + C.esc(q.name) + '</b> ' + q.total + '개 → <b>' + UI.pending[id] + '개</b></li>' : ''; }).join('') + '</ul>', ok: '변경 저장',
    onOk: () => { const now = new Date().toISOString(); for (const id of ids) { const q = byId(id); if (q) { q.total = UI.pending[id]; q.updatedAt = now; } } UI.pending = {}; C.changed(); C.render(); C.toast('수량을 저장했어요'); }
  });
}
function redraw() {
  const r = rowsAndCards(), $ = (s) => document.querySelector(s);
  if ($('#eqrows')) $('#eqrows').innerHTML = r.rows;
  if ($('#eqcards')) $('#eqcards').innerHTML = r.cards;
  if ($('.eq-sumcard')) $('.eq-sumcard').innerHTML = summary();
  if ($('#eqBulk')) $('#eqBulk').innerHTML = bulkBar(r.shown);
  const pd = $('#eqPend'); if (pd) { pd.innerHTML = pendBar(); pd.hidden = !Object.keys(UI.pending).length; }
}
function setPending(id, n) {
  const q = byId(id); if (!q) return;
  n = Math.max(0, Math.round(n));
  if (n === Number(q.total)) delete UI.pending[id]; else UI.pending[id] = n;
}

/* ── 행사 화면의 장비 카드 ── */
export function gearCardHtml(e) {
  const S = C.S, eq = list();
  const r = gearRange(e), shortList = gearShortage(e, S.data);
  const rows = (e.gear || []).map((g) => {
    const q = byId(g.equipId); if (!q) return '';
    const sh = shortList.find((x) => x.equipId === q.id);
    const others = r ? Math.max(...rangeDays(r).map((d) => usageOn(S.data, q.id, d, e.id))) : 0;
    return '<tr><td><b>' + C.esc(q.name) + '</b><small>' + C.esc([q.spec, '총 ' + q.total + '개', others ? '다른 행사 최대 ' + others + '개' : ''].filter(Boolean).join(' · ')) + '</small></td>' +
      '<td><div class="stepper" data-gear="' + q.id + '"><button type="button" class="stp" data-act="gear-step" data-d="-1" aria-label="1개 줄이기">' + C.ic('minus') + '</button><input class="in num" data-gearqty="' + q.id + '" value="' + g.qty + '" inputmode="numeric" aria-label="' + C.esc(q.name) + ' 수량"><button type="button" class="stp" data-act="gear-step" data-d="1" aria-label="1개 늘리기">' + C.ic('plus') + '</button></div></td>' +
      '<td>' + (sh ? '<em class="eqs short">' + dateShort(sh.day) + ' ' + sh.short + '개 부족</em>' : '<em class="eqs ok">넉넉함</em>') + '</td>' +
      '<td class="c"><button type="button" class="icbtn danger-i" data-act="gear-del" data-id="' + q.id + '" aria-label="' + C.esc(q.name) + ' 빼기">' + C.ic('x') + '</button></td></tr>';
  }).join('');
  const opts = eq.filter((q) => !(e.gear || []).some((g) => g.equipId === q.id)).map((q) => '<option value="' + q.id + '">' + C.esc((q.cat ? '[' + q.cat + '] ' : '') + q.name + (q.spec ? ' ' + q.spec : '')) + ' · 총 ' + q.total + '개</option>').join('');
  return '<section class="card ev-gear"><div class="card-h"><h2>' + C.ic('tent') + '장비</h2><span class="hint">반출 ~ 반납 기간 동안 나가 있는 것으로 셈해요</span></div>' +
    '<div class="gear-dates"><label class="fld"><span>반출 날짜</span><input class="in" type="date" id="gOut" value="' + (e.out || '') + '" placeholder="' + (e.start || '') + '"></label>' +
    '<label class="fld"><span>반납 날짜</span><input class="in" type="date" id="gBack" value="' + (e.back || '') + '"></label>' +
    '<p class="gear-range">' + (r ? C.ic('calendar') + '<span>' + dateKo(r[0]) + (r[1] !== r[0] ? ' ~ ' + dateKo(r[1]) : '') + (e.out || e.back ? '' : ' (행사 날짜)') + '</span>' : C.ic('alert') + '<span>날짜가 없어서 부족한지 셀 수 없어요. 행사 날짜나 반출 날짜를 넣어 주세요.</span>') + '</p></div>' +
    (rows ? '<div class="tbl-scroll"><table class="tbl geartbl"><thead><tr><th>장비</th><th>수량</th><th>남는지</th><th class="c">빼기</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="empty-msg">아직 넣은 장비가 없어요.</p>') +
    (eq.length ? (opts ? '<div class="gear-add"><select class="in" id="gPick" aria-label="넣을 장비">' + opts + '</select><input class="in num" id="gQty" value="1" inputmode="numeric" aria-label="수량"><button type="button" class="btn" data-act="gear-add">' + C.ic('plus') + '장비 넣기</button></div>' : '<p class="hint">등록한 장비를 모두 넣었어요.</p>')
      : '<p class="note">' + C.ic('tent') + '<span>등록한 장비가 없어요. <a href="#equip">장비 관리</a>에서 먼저 등록해 주세요.</span></p>') +
    (shortList.length ? '<div class="warnbox gear-short">' + C.ic('alert') + '<span><b>장비가 모자라요</b> — ' + shortList.map((x) => C.esc(x.name) + ' ' + x.short + '개').join(', ') + '. 빌려 오거나 다른 행사와 나눌 계획을 적어 두면 그대로 계약해도 돼요.</span></div>' +
      '<label class="fld"><span>부족 사유 · 계획</span><input class="in" id="gNote" value="' + C.esc(e.gearNote || '') + '" placeholder="예: 난로 3개는 ○○렌탈에서 빌림"></label>' : '') +
    '</section>';
}
function rangeDays(r) { const out = []; for (let d = r[0], i = 0; d <= r[1] && i < 400; d = addD(d, 1), i++) out.push(d); return out; }
const touch = (e) => { e.updatedAt = new Date().toISOString(); C.changed(); };

/* ── 누르기 · 입력 ── */
export function equipClick(act, a, ev) {
  const S = C.S;
  switch (act) {
    case 'eq-day': S.equipDay = a.dataset.day; C.render(); return true;
    case 'eq-cat': S.equipCat = a.dataset.cat; C.render(); return true;
    case 'eq-add': addEquip(); return true;
    case 'eq-edit': editEquip(a.dataset.id); return true;
    case 'eq-del': deleteEquip([a.dataset.id]); return true;
    case 'eq-delsel': deleteEquip(Object.keys(UI.sel)); return true;
    case 'eq-save': savePending(); return true;
    case 'eq-revert': UI.pending = {}; redraw(); C.toast('바꾼 수량을 되돌렸어요'); return true;
    case 'eq-step': {
      const box = a.closest('[data-eqid]'), id = box.dataset.eqid, inp = box.querySelector('input'), n = Math.max(0, (Math.round(toNum(inp.value)) || 0) + Number(a.dataset.d));
      inp.value = n;
      if (id !== 'n' && id !== 'm') { setPending(id, n); redraw(); }
      return true;
    }
    case 'gear-add': {
      if (!ev) return true;
      const id = document.getElementById('gPick').value, qty = Math.max(1, Math.round(toNum(document.getElementById('gQty').value) || 1));
      if (!id) return true;
      ev.gear = (ev.gear || []).concat([{ equipId: id, qty }]); touch(ev); C.render();
      const sh = gearShortage(ev, S.data).find((x) => x.equipId === id);
      C.toast(sh ? '넣었어요 · ' + sh.short + '개 부족해요' : '장비를 넣었어요');
      return true;
    }
    case 'gear-del': if (ev) { ev.gear = (ev.gear || []).filter((g) => g.equipId !== a.dataset.id); touch(ev); C.render(); } return true;
    case 'gear-step': {
      if (!ev) return true;
      const id = a.closest('[data-gear]').dataset.gear, g = (ev.gear || []).find((x) => x.equipId === id); if (!g) return true;
      g.qty = Math.max(1, (Number(g.qty) || 1) + Number(a.dataset.d)); touch(ev); C.render(); return true;
    }
  }
  return false;
}
export function equipInput(t, ev) {
  if (t.dataset.eqsel !== undefined) return true;
  if (t.dataset.eqtotal) { setPending(t.dataset.eqtotal, toNum(t.value) || 0); const pd = document.getElementById('eqPend'); if (pd) { pd.innerHTML = pendBar(); pd.hidden = !Object.keys(UI.pending).length; } return true; }
  if (t.id === 'gNote' && ev) { ev.gearNote = t.value; touch(ev); return true; }
  return false;
}
export function equipChange(t, ev) {
  const S = C.S;
  if (t.dataset.eqsel !== undefined) { if (t.checked) UI.sel[t.dataset.eqsel] = true; else delete UI.sel[t.dataset.eqsel]; redraw(); return true; }
  if (t.id === 'eqAll') { const shown = rowsAndCards().shown; shown.forEach((x) => { if (t.checked) UI.sel[x.equip.id] = true; else delete UI.sel[x.equip.id]; }); redraw(); return true; }
  if (t.id === 'eqDay') { if (t.value) { S.equipDay = t.value; C.render(); } return true; }
  if (t.dataset.eqtotal) { redraw(); return true; }
  if ((t.id === 'gOut' || t.id === 'gBack') && ev) {
    ev[t.id === 'gOut' ? 'out' : 'back'] = t.value;
    if (ev.out && ev.back && ev.back < ev.out) { ev.back = ev.out; }
    touch(ev); C.render(); return true;
  }
  if (t.dataset.gearqty && ev) { const g = (ev.gear || []).find((x) => x.equipId === t.dataset.gearqty); if (g) { g.qty = Math.max(1, Math.round(toNum(t.value) || 1)); touch(ev); C.render(); } return true; }
  return false;
}
