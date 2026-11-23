// 효과음 (v1.10.0, 사용자가 sian/sound/ 에서 고른 대로)
//  설정 · 백업 → 「효과음」 상자(화면 다음): ① 센스 효과음(기본, + 소희 목소리) · ② 깔끔 효과음 · ③ 무음 모드 — 이 기기에만(localStorage). v1.10.1 에 순서 · 기본값 바꿈
//  규칙: 소리는 「눌렀을 때 생기는 일」로 정한다(같은 일 = 늘 같은 소리). 좋은 일 = 밝은 소리, 위험 = 낮은 경고음.
//   · 단추(data-act) → ACT 표. 팝업을 여는 단추는 팝업 소리가 먼저 나고, 팝업의 확인을 눌렀을 때 그 단추의 결과 소리가 난다(취소 = 소리 없음).
//   · 팝업이 열릴 때: 빨간 창 = 위험, 단추 둘 = 확인, 단추 하나 = 안내.
//   · 화면 아래 알림(toast): 입금 · 완납 · 드라이브 맞춤 · 실패는 늘 소리, 그 밖의 「잘 됨」은 바로 앞에 소리가 없을 때만.
//   · 마우스 올림: 왼쪽 메뉴 · 새 문서 · 홈 큰 카드 · 파란 단추만(마우스가 있는 기기에서만).
//   · 0.15초 안에 또 나면 앞의 것만. (① 센스 = 'sense', ② 깔끔 = 'clean' — 저장 값 이름은 그대로) 그날 처음 나는 목소리는 인사(하루 한 번).
//  소리 파일: assets/sound/sfx/*.mp3 (Kenney CC0, LICENSE-Kenney-CC0.txt) · assets/sound/voice/*.mp3 (Qwen3 TTS 「소희 · 밝고 상냥하게」로 만듦)
const K = { mode: 'starmedia-quote:sound', vol: 'starmedia-quote:soundvol', hover: 'starmedia-quote:soundhover', hello: 'starmedia-quote:soundhello' };
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 무시 */ } };
export const sndMode = () => { const v = get(K.mode, 'sense'); return v === 'clean' || v === 'mute' ? v : 'sense'; };
export const sndVol = () => { const v = get(K.vol, '0.35'); return ['0.35', '0.6', '0.9'].includes(v) ? v : '0.35'; };
export const sndHover = () => get(K.hover, 'on') !== 'off';

// 소리 묶음 → 고른 파일
const SFX = {
  hover: 'rollover2', nav: 'click_001', toggle: 'switch_002', add: 'drop_002', save: 'confirmation_001', send: 'maximize_006', file: 'bookFlip1', copy: 'select_003',
  trash: 'cloth2', restore: 'maximize_002', money: 'handleCoins', lock: 'metalLatch', unlock: 'metalClick', wrong: 'error_004',
  pop_info: 'glass_001', pop_ask: 'question_001', pop_danger: 'error_006', purge: 'bookClose', ok: 'glass_002', err: 'error_002', sync: 'confirmation_003'
};
// 단추 이름(data-act) → [소리 묶음, 목소리(② 센스일 때)]
const ACT = {
  'doc-new': ['add', 'newdoc'], 'ev-new': ['add'], 'client-add': ['add'], 'item-add': ['add'], 'eq-add': ['add'], 'set-add': ['add'], 'line-add': ['add'], 'sl-add': ['add'], 'gear-add': ['add'],
  'pick-items': ['add'], 'pick-set': ['add'], 'paste-lines': ['add'], 'item-paste': ['add'], 'conv': ['add'], 'revise': ['add'], 'ev-mk': ['add'], 'doc-to-event': ['add'], 'client-from-doc': ['add'],
  'doc-save': ['save', 'save'], 'doc-done': ['save', 'done'], 'ev-contract': ['save', 'contract'], 'eq-save': ['save'], 'cat-sort-save': ['save'], 'client-sort-save': ['save'], 'wz-me-save': ['save'], 'prob-save': ['save'], 'ev-base': ['save'],
  'x-kakao': ['send', 'kakao'], 'x-mail': ['send', 'mail'],
  'x-pdf': ['file', 'file'], 'x-jpg': ['file', 'file'], 'doc-print': ['file'], 'x-xlsx': ['file', 'excel'], 'x-list-xlsx': ['file', 'excel'], 'x-items-xlsx': ['file', 'excel'], 'x-clients-xlsx': ['file', 'excel'], 'set-export': ['file', 'excel'],
  'backup-now': ['file', 'backup'], 'ev-rcpt': ['file'],
  'doc-copy': ['copy', 'copy'], 'set-copy': ['copy', 'copy'], 'prob-copy': ['copy', 'copy'],
  'doc-del': ['trash', 'trash'], 'client-del': ['trash', 'trash'], 'item-del': ['trash', 'trash'], 'eq-del': ['trash', 'trash'], 'eq-delsel': ['trash', 'trash'], 'set-del': ['trash', 'trash'], 'cat-del': ['trash', 'trash'],
  'line-del': ['trash'], 'sl-del': ['trash'], 'gear-del': ['trash'], 'stamp-del': ['trash'], 'pay-cancel': ['trash'], 'prob-clear': ['trash'], 'ev-cancel': ['trash'], 'ev-uncontract': ['trash'], 'gd-off': ['trash'], 'set-pin-remove': ['trash'],
  'trash-restore': ['restore', 'restore'], 'bk-restore': ['restore', 'restore'], 'ev-uncancel': ['restore', 'restore'], 'eq-revert': ['restore'],
  'trash-purge': ['purge', 'purge'], 'trash-empty': ['purge', 'purge'],
  'lock-now': ['lock', 'lock'], 'set-lock-now': ['lock', 'lock'],
  'pay-add': [null], 'snd-test': [null], 'gd-sync': ['nav'], 'gd-connect': ['nav'], 'gd-login': ['nav'], 'gd-load': ['nav']
};
const TOGGLE = /^(ux-set|ux-cardh|set-vat|set-autolock|snd-|list-type|list-status|trash-kind|item-tab|eq-cat|dep-rate|money-year)/;

let ctx = null;
const cache = new Map();
let voiceEl = null, last = 0, actNow = null, pending = null, modalByAct = false;
const audio = (src) => { let a = cache.get(src); if (!a) { a = new Audio(src); a.preload = 'auto'; cache.set(src, a); } return a; };
function playSrc(src, vol) {
  try { const a = audio(src); if (!a.paused) { a.pause(); } a.currentTime = 0; a.volume = vol; const p = a.play(); if (p && p.catch) p.catch(() => {}); return a; } catch (e) { return null; }
}
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
function voice(key, noHello) {
  if (!key || sndMode() !== 'sense') return;
  if (!noHello && get(K.hello, '') !== today()) { put(K.hello, today()); key = 'hello'; }   // 그날 처음 나는 목소리 = 인사(미리 듣기는 빼고)
  if (voiceEl) { try { voiceEl.pause(); } catch (e) { /* 무시 */ } }
  const v = Number(sndVol());
  setTimeout(() => { voiceEl = playSrc('assets/sound/voice/' + key + '.mp3', Math.min(1, v + 0.15)); }, 160);
}
/** 소리 내기: 묶음 이름 + (② 센스면) 목소리. force = 0.15초 막기 무시 */
export function snd(kind, line, force, noHello) {
  if (!kind || sndMode() === 'mute') return;
  const now = Date.now();
  if (!force && now - last < 150) return;
  last = now;
  const f = SFX[kind]; if (f) playSrc('assets/sound/sfx/' + f + '.mp3', Number(sndVol()) * (kind === 'hover' ? 0.55 : 1));
  voice(line, noHello);
}

/* ── main.mjs 가 부르는 곳 ── */
/** 단추를 누른 순간(처리 전). 처리 중에 팝업이 열리면 소리는 팝업 쪽으로 넘긴다 */
export function sndActStart(act) {
  actNow = act; modalByAct = false;
  setTimeout(() => {
    const m = ACT[act] || (TOGGLE.test(act) ? ['toggle'] : ['nav']);
    if (modalByAct) pending = m[0] ? m : null;   // 팝업 확인 때 낼 소리
    else if (m[0]) snd(m[0], m[1]);
    actNow = null;
  }, 0);
}
/** 팝업이 열릴 때 */
//  빨간 창이라도 휴지통으로 옮기는 삭제(30일 안에 되살릴 수 있음)는 「확인」 소리. 「되돌릴 수 없어요」 목소리는 정말 되돌릴 수 없는 일(완전히 지우기 · 휴지통 비우기)에만.
const IRREVERSIBLE = new Set(['trash-purge', 'trash-empty']);
export function sndModal(o) {
  if (actNow) modalByAct = true; else pending = null;
  const m = actNow ? ACT[actNow] : null;
  if (m && m[0] === 'trash') snd('pop_ask', null, true);
  else if (o.tone === 'danger') snd('pop_danger', actNow && IRREVERSIBLE.has(actNow) ? 'danger' : null, true);
  else snd(o.cancel === false ? 'pop_info' : 'pop_ask', null, true);
}
/** 팝업 확인 · 취소 */
export function sndModalOk() { const p = pending; pending = null; if (p) snd(p[0], p[1], true); }
export function sndModalCancel() { pending = null; }
/** 화면 아래 알림 */
export function sndToast(msg) {
  const m = String(msg || '');
  if (/완납!/.test(m)) return snd('money', 'paid', true);
  if (/^입금 .*적었어요/.test(m)) return snd('money', 'pay', true);
  if (/^환불 .*적었어요/.test(m)) return snd('money', null, true);
  if (/(드라이브|자료를) .*맞췄어요|저절로 맞춰져요/.test(m)) return snd('sync', 'sync', true);
  if (/(못했|못 했|못 만들|못 찾|못 읽|실패|오류|안 돼요|할 수 없)/.test(m)) return snd('err', 'error', true);
  if (Date.now() - last > 700) snd('ok');
}
/** 잠금 화면 */
export function sndUnlock() { snd('unlock', 'unlock', true); }
export function sndWrong() { snd('wrong', 'wrong', true); }

/** 설정 화면의 효과음 단추 */
export function sndClick(act, a) {
  // 고른 소리는 sndActStart 가 「켜고 끄기」 소리로 들려준다(③ 무음이면 조용)
  if (act === 'snd-mode') { put(K.mode, a.dataset.v); ctx.render(); return true; }
  if (act === 'snd-vol') { put(K.vol, a.dataset.v); ctx.render(); return true; }
  if (act === 'snd-hover') { put(K.hover, a.dataset.v); ctx.render(); return true; }
  if (act === 'snd-test') { if (sndMode() === 'mute') ctx.toast('③ 무음 모드라 소리가 나지 않아요'); else setTimeout(() => { snd('send', 'kakao', true, true); }, 20); return true; }
  return false;
}
function seg(act, opts, cur) {
  return '<div class="seg" role="radiogroup">' + opts.map(([v, l]) => '<button type="button" data-act="' + act + '" data-v="' + v + '" class="' + (String(cur) === String(v) ? 'on' : '') + '" aria-checked="' + (String(cur) === String(v)) + '" role="radio">' + l + '</button>').join('') + '</div>';
}
/** 설정 · 백업 → 화면 의 효과음 줄 3개 */
export function soundRowsHtml() {
  return '<div class="set-row set-ux"><span class="sl"><b>효과음 종류</b><small>① 센스는 특별한 순간(카톡 보내기 · 계약 확정 · 입금 등)에 소희 목소리가 같이 나와요 · ② 깔끔은 짧은 소리만</small></span>' +
    seg('snd-mode', [['sense', '① 센스 효과음 (기본)'], ['clean', '② 깔끔 효과음'], ['mute', '③ 무음 모드']], sndMode()) + '</div>' +
    '<div class="set-row set-ux"><span class="sl"><b>효과음 크기</b><small>' + (sndMode() === 'mute' ? '지금은 ③ 무음 모드라 소리가 나지 않아요' : '아이폰은 기기 소리 크기를 따라가요') + '</small></span>' +
    '<span class="set-btns">' + seg('snd-vol', [['0.35', '작게'], ['0.6', '보통'], ['0.9', '크게']], sndVol()) + '<button type="button" class="btn sm" data-act="snd-test">' + ctx.ic('bell') + '미리 듣기</button></span></div>' +
    '<div class="set-row set-ux"><span class="sl"><b>마우스 올렸을 때 소리</b><small>왼쪽 메뉴 · 홈 큰 카드 · 파란 단추에서만 · 휴대폰 · 태블릿은 누를 때만 소리가 나요</small></span>' +
    seg('snd-hover', [['on', '켜기'], ['off', '끄기']], sndHover() ? 'on' : 'off') + '</div>';
}

export function initSound(c) {
  ctx = c;
  const fine = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)') : { matches: true };
  const HOVER = '.nav a, .side-new, .tile, .btn.primary, .lockbtn';
  let hovEl = null;
  document.addEventListener('mouseover', (e) => {
    if (!fine.matches || !sndHover() || sndMode() === 'mute') return;
    const el = e.target.closest(HOVER);
    if (el === hovEl) return; hovEl = el;
    if (el && !el.disabled) snd('hover', null, true);
  });
  // 메뉴 링크(#home 등, data-act 없음) = 이동, 스위치 · 체크 = 켜고 끄기, 칸 고르기(data-seg) = 켜고 끄기
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest && t.closest('[data-act]')) return;
    if (t.closest && t.closest('a[href^="#"]')) snd('nav');
    else if (t.closest && t.closest('[data-seg] button')) snd('toggle');
  }, true);
  document.addEventListener('change', (e) => { const t = e.target; if (t.type === 'checkbox' || t.type === 'radio') snd('toggle'); }, true);
}
