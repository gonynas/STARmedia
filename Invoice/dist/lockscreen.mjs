// 화면 잠금 — 숫자 4~6자리. 잠금 버튼 + 정해 둔 시간(기본 5분) 동안 손대지 않으면 자동 잠금.
// 휴대폰에서 다른 앱을 쓰다 그 시간 넘게 지나 돌아와도 잠긴다. 프로그램을 다시 열 때도 그 시간이 지났으면 잠긴다.
// 비밀번호는 S.data.settings.lock = { salt, hash } 로만 저장(규칙: core/lock.mjs). 잊으면 사업자등록번호로 다시 정한다.
// 「남이 화면을 못 보게 하는 문」이며, 자료 파일을 암호화하지는 않는다.
import { validPin, onlyDigits, makeLock, checkPin, canResetWith, shouldAutoLock } from './core/lock.mjs?v=mwh60llr';

let C;
const LAST = 'starmedia-quote:lastActive';
const st = { locked: false, typed: '', mode: 'unlock', tries: 0 };   // mode: unlock · reset

const lockInfo = () => (C.S.data && C.S.data.settings && C.S.data.settings.lock) || null;
export const hasLock = () => !!(lockInfo() && lockInfo().hash);
export const isLocked = () => st.locked;
const minutes = () => Number(C.S.data && C.S.data.settings && C.S.data.settings.autoLockMin) || 0;
const now = () => Date.now();
function touch() { if (!st.locked) try { localStorage.setItem(LAST, String(now())); } catch (e) {} }
const lastActive = () => { try { return Number(localStorage.getItem(LAST)) || 0; } catch (e) { return 0; } };

export function initLock(ctx) {
  C = ctx;
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => document.addEventListener(t, () => { if (!st.locked) touchThrottled(); }, { passive: true, capture: true }));
  setInterval(() => { if (hasLock() && !st.locked && shouldAutoLock(lastActive(), now(), minutes())) lockNow(); }, 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && hasLock() && !st.locked && shouldAutoLock(lastActive(), now(), minutes())) lockNow();
    if (document.visibilityState === 'hidden') touch();
  });
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
}
let tt = 0;
function touchThrottled() { const n = now(); if (n - tt > 5000) { tt = n; touch(); } }

/** 프로그램을 열 때: 비밀번호가 있고 정한 시간이 지났으면 잠근 채로 시작 */
export function lockOnBoot() { if (hasLock() && (minutes() === 0 ? false : shouldAutoLock(lastActive(), now(), minutes()))) lockNow(); else touch(); }

export function lockNow() {
  if (!hasLock()) return false;
  st.locked = true; st.typed = ''; st.mode = 'unlock'; st.tries = 0;
  paint(); return true;
}
function unlock() { st.locked = false; st.typed = ''; touch(); const el = document.getElementById('lockScreen'); if (el) el.remove(); document.body.classList.remove('is-locked'); }

function dots() { return '<div class="lk-dots" aria-hidden="true">' + Array.from({ length: 6 }, (_, i) => '<i class="' + (i < st.typed.length ? 'on' : '') + (i >= 4 ? ' lk-opt' : '') + '"></i>').join('') + '</div>'; }
function paint(msg = '') {
  let el = document.getElementById('lockScreen');
  if (!el) { el = document.createElement('div'); el.id = 'lockScreen'; el.className = 'lockscreen'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '화면 잠금'); document.body.appendChild(el); }
  document.body.classList.add('is-locked');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((k) => k === '' ? '<span></span>' : '<button type="button" class="lk-key" data-lk="' + k + '" aria-label="' + (k === 'back' ? '한 글자 지우기' : k) + '">' + (k === 'back' ? C.ic('backspace') : k) + '</button>').join('');
  if (st.mode === 'reset') {
    el.innerHTML = '<div class="lk-card"><img class="lk-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><h2>비밀번호 다시 정하기</h2>' +
      '<p>내 정보에 넣은 <b>사업자등록번호</b>(숫자만)와 새 비밀번호를 넣어 주세요.</p>' +
      '<label class="fld"><span>사업자등록번호</span><input class="in" id="lkBiz" inputmode="numeric" autocomplete="off"></label>' +
      '<label class="fld"><span>새 비밀번호 (숫자 4~6자리)</span><input class="in" id="lkNew" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password"></label>' +
      '<p class="lk-msg" role="alert">' + C.esc(msg) + '</p>' +
      '<div class="lk-btns"><button type="button" class="btn big ghost" data-lk="cancel-reset">돌아가기</button><button type="button" class="btn big primary" data-lk="do-reset">새로 정하고 열기</button></div></div>';
    setTimeout(() => { const f = document.getElementById('lkBiz'); if (f) f.focus(); }, 30);
    return;
  }
  el.innerHTML = '<div class="lk-card"><img class="lk-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><h2>' + C.ic('lock') + '화면이 잠겨 있어요</h2><p>비밀번호를 눌러 주세요</p>' + dots() +
    '<p class="lk-msg" role="alert">' + C.esc(msg) + '</p><div class="lk-pad">' + keys + '</div>' +
    '<div class="lk-foot"><button type="button" class="lk-ok btn primary" data-lk="ok"' + (st.typed.length >= 4 ? '' : ' disabled') + '>열기</button><button type="button" class="lk-forgot" data-lk="forgot">비밀번호를 잊었어요</button></div></div>';
}
async function tryOpen() {
  if (!validPin(st.typed)) return;
  if (await checkPin(lockInfo(), st.typed)) { unlock(); C.toast('잠금을 풀었어요'); return; }
  st.tries++; st.typed = '';
  paint(st.tries >= 5 ? '여러 번 틀렸어요. 잊었다면 아래 「비밀번호를 잊었어요」를 눌러 주세요' : '비밀번호가 맞지 않아요');
  const card = document.querySelector('.lk-card'); if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
}
async function press(k) {
  if (k === 'back') st.typed = st.typed.slice(0, -1);
  else if (k === 'ok') return tryOpen();
  else if (k === 'forgot') { st.mode = 'reset'; return paint(); }
  else if (k === 'cancel-reset') { st.mode = 'unlock'; return paint(); }
  else if (k === 'do-reset') {
    const biz = (document.getElementById('lkBiz') || {}).value, pin = onlyDigits((document.getElementById('lkNew') || {}).value);
    if (!canResetWith(C.S.data.me, biz)) return paint('사업자등록번호가 내 정보와 맞지 않아요' + (onlyDigits(C.S.data.me.bizNo).length < 10 ? ' (내 정보에 사업자등록번호가 없으면 이 방법을 쓸 수 없어요)' : ''));
    if (!validPin(pin)) return paint('새 비밀번호는 숫자 4~6자리로 넣어 주세요');
    C.S.data.settings.lock = await makeLock(pin); C.changed(); unlock(); C.toast('비밀번호를 새로 정했어요'); return;
  } else if (/^\d$/.test(k) && st.typed.length < 6) st.typed += k;
  paint();
  if (st.typed.length === 6) tryOpen();
}
function onClick(e) {
  if (!st.locked) return;
  const b = e.target.closest('[data-lk]');
  if (!e.target.closest('#lockScreen')) { e.stopPropagation(); e.preventDefault(); return; }
  if (b) { e.stopPropagation(); e.preventDefault(); press(b.dataset.lk); }
}
function onKey(e) {
  if (!st.locked) return;
  if (st.mode === 'reset') { if (e.key === 'Enter') { e.preventDefault(); press('do-reset'); } e.stopPropagation(); return; }
  e.stopPropagation();
  if (/^\d$/.test(e.key)) { e.preventDefault(); press(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); press('back'); }
  else if (e.key === 'Enter') { e.preventDefault(); press('ok'); }
  else if (!(e.ctrlKey || e.metaKey)) e.preventDefault();
}

/* ── 설정 화면에서 쓰는 것 ── */
export async function setPin(pin) { if (!validPin(pin)) return false; C.S.data.settings.lock = await makeLock(pin); C.changed(); touch(); return true; }
export async function verifyPin(pin) { return checkPin(lockInfo(), pin); }
export function removePin() { delete C.S.data.settings.lock; C.changed(); }
