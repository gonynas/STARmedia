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
export function applyUx() { const m = uxMode(); if (m) document.documentElement.dataset.ux = m; else delete document.documentElement.dataset.ux; }
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
    case 'ux-tip': { const h = a.closest('.top'); if (h) h.classList.toggle('tip'); return true; }
    case 'ux-back': lvl = 1; C.render(); window.scrollTo(0, 0); return true;
    case 'ux-sheet-close': closeSheet(); return true;
  }
  return false;
}
