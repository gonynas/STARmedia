// 스타미디어 견적서 발행기 — 하위 메뉴 디자인 시험 (v1.6.0, 2026-11-20)
// 사용자가 「시안 A(탭 정리형)」 · 「시안 B(목록 · 상세형)」를 직접 써 보고 고르도록, 품목 · 세트 / 발행 목록 / 설정 · 백업 화면에
// 「디자인: 기본 · A · B」 전환 단추를 둔다. 고른 값은 이 기기에만 저장(localStorage) — 자료 · 드라이브에는 들어가지 않는다.
// 화면 파일(items · editor · settings)은 uxMode() 를 보고 A · B 모양을 그리고, 단추 이름(data-act)은 원래 것을 그대로 쓴다.
const KEY = 'starmedia-quote:ux';
export const UX_ROUTES = ['items', 'list', 'set'];
let C = null;
let lvl = 1;          // 시안 B 휴대폰: 1 = 하위 메뉴 목록, 2 = 들어간 화면
export function initUx(ctx) {
  C = ctx; applyUx();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
}
/** '' (기본) · 'a' · 'b' */
export function uxMode() { try { const v = localStorage.getItem(KEY) || ''; return v === 'a' || v === 'b' ? v : ''; } catch (e) { return ''; } }
export function uxOn(route) { return !!uxMode() && UX_ROUTES.includes(route); }
export function applyUx() { const m = uxMode(); if (m) document.documentElement.dataset.ux = m; else delete document.documentElement.dataset.ux; applyCard(); }
/* 영역 제목 모양(v1.6.4 시험): 각 상자(카드) 맨 위 제목 줄 — '' 기본 · 'band' 1 파란 띠(흰 글자) · 'soft' 2 연한 파란 띠. 이 기기에만 저장 */
const CKEY = 'starmedia-quote:cardh';
export function cardMode() { try { const v = localStorage.getItem(CKEY) || ''; return v === 'band' || v === 'soft' ? v : ''; } catch (e) { return ''; } }
export function applyCard() { const m = cardMode(); if (m) document.documentElement.dataset.cardh = m; else delete document.documentElement.dataset.cardh; }
export const isPhone = () => matchMedia('(max-width:767px)').matches;
export function uxLvl() { return lvl; }
export function setLvl(n) { lvl = n; }

/** 페이지 머리 오른쪽: (A · B 일 때) 설명 보기 ⓘ. 디자인 고르기는 설정 · 백업 → 화면 → 「화면 디자인 (UI · UX)」 (v1.6.1) */
export function uxHeadHtml(route) {
  if (!uxOn(route)) return '';
  return '<button type="button" class="icbtn ux-info" data-act="ux-tip" aria-label="이 화면 설명 보기">' + C.ic('info') + '</button>';
}
/** 밑줄 탭 (시안 A) */
export function uxTabs(list, cur, act) {
  return '<nav class="uxtabs" role="tablist">' + list.map(([k, l, n]) => '<button type="button" role="tab" aria-selected="' + (k === cur) + '" class="' + (k === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + k + '">' + l + (n !== undefined ? '<em>' + n + '</em>' : '') + '</button>').join('') + '</nav>';
}
/** 하위 메뉴 한 줄 (시안 B 왼쪽 목록) */
export function uxNavBtn(attrs, on, label, right) {
  return '<button type="button" class="uxnav' + (on ? ' on' : '') + '" ' + attrs + '><span class="uxnav-l">' + label + '</span>' + (right || '') + '<span class="uxnav-go">' + C.ic('right') + '</span></button>';
}
/** 줄 오른쪽 ⋯ 단추 (원래 있던 .menu 부품을 그대로 씀) */
export function uxMore(label, items) {
  return '<div class="menu ux-more"><button type="button" class="icbtn" data-act="menu" aria-haspopup="menu" aria-label="' + C.esc(label) + ' 더보기">' + C.ic('more') + '</button><div class="menu-pop right" role="menu">' +
    items.map(([act, id, l, icon, danger]) => '<button type="button" role="menuitem" class="' + (danger ? 'danger-i' : '') + '" data-act="' + act + '" data-id="' + id + '">' + C.ic(icon) + l + '</button>').join('') + '</div></div>';
}
/* ── 메뉴 분류 규칙 (v1.6.2): 대분류 = 상자(선 아이콘 + 굵은 제목) · 중분류 = 꺾쇠 › / ⌄ + 굵게 + 개수 ·
      소분류 = 한 글자 들여쓰기 + └ + 보통 굵기. 처음 펼침: 사용자가 늘리는 목록(분류 · 세트)은 접힘, 정해진 짧은 목록(문서 종류 · 상태 · 설정)은 펼침,
      고른 항목이 든 묶음은 늘 펼침. 접힘 상태는 이 화면을 쓰는 동안만 기억(S.navOpen). 규칙 문서: D:\…\v1.6.2_메뉴 분류 · 앱 아이콘 시안 ── */
const FOLD_DEF = { items: false, sets: false, types: true, sts: true, sg: true };
export function isOpen(k, forced) {
  // 사용자가 직접 펼치거나 접었으면 그대로(v1.6.4: 고른 묶음이 늘 펼쳐져 「품목 세트」를 다시 눌러도 안 접히던 것 고침), 아니면 고른 묶음은 펼침, 그 밖은 기본값
  const o = C.S.navOpen || {};
  if (k in o) return o[k];
  return forced || (FOLD_DEF[k.split(':')[0]] ?? true);
}
export function uxGroup(icon, title, inner) {
  return '<section class="card uxg"><h3 class="uxg-h"><span class="uxg-i">' + C.ic(icon) + '</span>' + title + '</h3>' + inner + '</section>';
}
export function uxMid(k, label, count, on, forced) {
  const op = isOpen(k, forced);
  return '<button type="button" class="uxmid' + (on ? ' on' : '') + '" data-act="ux-fold" data-k="' + k + '" aria-expanded="' + op + '"><span class="uxmid-c">' + C.ic('right') + '</span><span class="uxmid-l">' + label + '</span>' +
    (count !== undefined && count !== '' ? '<em class="uxmid-n num">' + count + '</em>' : '') + '</button>';
}
export function uxKids(k, inner, forced) { return '<div class="uxkids"' + (isOpen(k, forced) ? '' : ' hidden') + ' role="group">' + inner + '</div>'; }
export function uxLeaf(attrs, on, label, right) {
  return '<button type="button" class="uxleaf' + (on ? ' on' : '') + '" ' + attrs + '><span class="uxleaf-l">' + label + '</span>' + (right || '') + '<span class="uxnav-go">' + C.ic('right') + '</span></button>';
}
/** 중분류를 누르면 펼침/접힘 + (휴대폰 시안 B 가 아니면) 그 묶음 전체 보기 */
const FOLD_SELECT = {
  items: (S) => { S.itemTab = 'item'; S.itemCat = ''; },
  sets: (S) => { S.itemTab = 'set'; },
  types: (S) => { S.listType = ''; },
  sts: (S) => { S.listStatus = ''; },
  sg: (S, k) => { S.setGroup = k.split(':')[1]; S.setSec = 0; }
};
/** 휴대폰에서 아래에서 올라오는 「자세히」 창 */
export function uxSheetHtml() { return '<div class="uxscrim" data-act="ux-sheet-close"></div><div class="uxsheet" id="uxSheet" role="dialog" aria-label="자세히"><div class="uxgrab"></div><div id="uxSheetBody"></div></div>'; }
export function openSheet(html) {
  const s = document.getElementById('uxSheet'), b = document.getElementById('uxSheetBody'); if (!s || !b) return false;
  b.innerHTML = html; s.classList.add('on'); s.previousElementSibling.classList.add('on'); return true;
}
export function closeSheet() { const s = document.getElementById('uxSheet'); if (s) { s.classList.remove('on'); s.previousElementSibling.classList.remove('on'); } }
export function uxBackHtml(label) { return '<button type="button" class="ux-back" data-act="ux-back">' + C.ic('left') + label + '</button>'; }

/** 누르기 (main.mjs 가 먼저 불러 줌) */
export function uxClick(act, a) {
  switch (act) {
    case 'ux-set': {
      try { if (a.dataset.v) localStorage.setItem(KEY, a.dataset.v); else localStorage.removeItem(KEY); } catch (e) { /* 무시 */ }
      lvl = 1; applyUx();
      if (C.S.route === 'set') { C.S.setGroup = 'screen'; lvl = 2; }   // 설정에서 바꾸면 A · B 에서도 「화면」 묶음을 그대로 보여 줌
      C.render();
      C.toast(a.dataset.v ? '시안 ' + a.dataset.v.toUpperCase() + ' 모양으로 바꿨어요 (품목 · 세트 · 발행 목록 · 설정 · 백업)' : '원래 모양으로 돌아왔어요');
      return true;
    }
    case 'ux-cardh': {
      try { if (a.dataset.v) localStorage.setItem(CKEY, a.dataset.v); else localStorage.removeItem(CKEY); } catch (e) { /* 무시 */ }
      applyCard(); a.parentElement.querySelectorAll('button').forEach((b) => { const on = b === a; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      C.toast(a.dataset.v === 'band' ? '영역 제목을 「파란 띠」로 바꿨어요' : a.dataset.v === 'soft' ? '영역 제목을 「연한 띠」로 바꿨어요' : '영역 제목을 원래 모양으로 돌렸어요');
      return true;
    }
    case 'ux-tip': { const h = a.closest('.top'); if (h) h.classList.toggle('tip'); return true; }
    case 'ux-back': lvl = 1; C.render(); window.scrollTo(0, 0); return true;
    case 'ux-sheet-close': closeSheet(); return true;
    case 'ux-fold': {
      const k = a.dataset.k, o = C.S.navOpen || (C.S.navOpen = {});
      o[k] = a.getAttribute('aria-expanded') !== 'true';
      if (!(isPhone() && uxMode() === 'b')) { const f = FOLD_SELECT[k.split(':')[0]]; if (f) f(C.S, k); }
      C.render(); return true;
    }
  }
  return false;
}
