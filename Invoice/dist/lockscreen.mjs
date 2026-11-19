// 화면 잠금 — 숫자 4~10자리. 잠금 단추 + 정해 둔 시간(기본 5분) 동안 손대지 않으면 자동 잠금.
// 휴대폰에서 다른 앱을 쓰다 그 시간 넘게 지나 돌아와도 잠긴다. 프로그램을 다시 열 때도 그 시간이 지났으면 잠긴다.
// 잠금 화면 동그라미는 정한 비밀번호 자릿수만큼(settings.lock.len), 그만큼 누르면 저절로 열어 본다.
// 비밀번호를 잊었을 때: ① 비밀번호 초기화(사업자등록번호 + 초기화 코드 5자리) → ② 비밀번호 재설정(새 비밀번호 두 번) → 새 초기화 코드.
// 규칙(해시 · 코드 · 사업자번호 형식)은 core/lock.mjs. 「남이 화면을 못 보게 하는 문」이며 자료 파일을 암호화하지는 않는다.
import { validPin, onlyDigits, makeLock, checkPin, checkReset, hasRecovery, shouldAutoLock, formatBizNo, normCode, PIN_MIN, PIN_MAX, CODE_LEN } from './core/lock.mjs?v=mwmwhfll';

let C;
const LAST = 'starmedia-quote:lastActive';
const st = { locked: false, typed: '', mode: 'unlock', tries: 0, code: '' };   // mode: unlock · reset1 · reset2 · code

const lockInfo = () => (C.S.data && C.S.data.settings && C.S.data.settings.lock) || null;
export const hasLock = () => !!(lockInfo() && lockInfo().hash);
export const isLocked = () => st.locked;
const pinLen = () => Number(lockInfo() && lockInfo().len) || 0;   // 0 = 모름(v1.0.0 에서 정한 비밀번호)
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
  document.addEventListener('input', onInput, true);
}
let tt = 0;
function touchThrottled() { const n = now(); if (n - tt > 5000) { tt = n; touch(); } }

/** 프로그램을 열 때: 비밀번호가 있고 정한 시간이 지났으면 잠근 채로 시작 */
export function lockOnBoot() { if (hasLock() && minutes() > 0 && shouldAutoLock(lastActive(), now(), minutes())) lockNow(); else touch(); }

export function lockNow() {
  if (!hasLock()) return false;
  st.locked = true; st.typed = ''; st.mode = 'unlock'; st.tries = 0;
  paint(); return true;
}
function unlock() { st.locked = false; st.typed = ''; st.mode = 'unlock'; touch(); const el = document.getElementById('lockScreen'); if (el) el.remove(); document.body.classList.remove('is-locked'); }

const WARN = '이 코드는 <b>지금 한 번만</b> 보여 드려요. 비밀번호를 잊었을 때 사업자등록번호와 함께 있어야 초기화할 수 있어요. <b>화면을 캡처해 두거나 따로 적어 두세요.</b>';
/** 초기화 코드 안내 (설정 화면 · 잠금 화면 같은 모양) */
export function codeBoxHtml(code) {
  return '<div class="rc-box"><span class="rc-l">비밀번호 초기화 코드</span><b class="rc-code" aria-label="초기화 코드 ' + code.split('').join(' ') + '">' + code + '</b></div><p class="warnbox">' + C.ic('alert') + '<span>' + WARN + '</span></p>';
}
/** 설정 화면에서: 새 비밀번호를 정한 뒤 코드 창 (확인을 눌러야 닫힘) */
export function showCodeModal(code, title = '비밀번호를 정했어요', onDone = null) {
  C.openModal({ icon: 'lock', title, body: codeBoxHtml(code), ok: '확인 (캡처 · 메모했어요)', cancel: false, onOk: onDone || undefined });
  const m = document.getElementById('modal'); if (m) m.dataset.sticky = '1';
}

function dots() {
  const n = pinLen() || Math.max(PIN_MIN, st.typed.length);
  return '<div class="lk-dots" aria-label="' + st.typed.length + '자리 눌렀어요">' + Array.from({ length: n }, (_, i) => '<i class="' + (i < st.typed.length ? 'on' : '') + '"></i>').join('') + '</div>';
}
function shell(inner) {
  let el = document.getElementById('lockScreen');
  if (!el) { el = document.createElement('div'); el.id = 'lockScreen'; el.className = 'lockscreen'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '화면 잠금'); document.body.appendChild(el); }
  document.body.classList.add('is-locked');
  el.innerHTML = '<div class="lk-card"><img class="lk-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사">' + inner + '</div>';
}
function paint(msg = '') {
  const focus = (id) => setTimeout(() => { const f = document.getElementById(id); if (f) f.focus(); }, 30);
  const msgP = '<p class="lk-msg" role="alert">' + C.esc(msg) + '</p>';
  if (st.mode === 'reset1') {
    shell('<span class="lk-step">1 / 2단계</span><h2>비밀번호 초기화</h2>' +
      '<p>내 정보에 넣은 <b>사업자등록번호</b>와, 비밀번호를 정할 때 받은 <b>초기화 코드 5자리</b>를 넣어 주세요.</p>' +
      '<label class="fld"><span>사업자등록번호 <small>숫자 10자리만 치면 - 는 저절로 들어가요</small></span><input class="in" id="lkBiz" inputmode="numeric" autocomplete="off" placeholder="000-00-00000" maxlength="12"></label>' +
      (hasRecovery(lockInfo()) ? '<label class="fld"><span>초기화 코드 <small>영어 대문자 · 숫자 5자리</small></span><input class="in lk-codein" id="lkCode" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="' + CODE_LEN + '" placeholder="예: K7P2Q"></label>'
        : '<p class="note">' + C.ic('alert') + '<span>이 비밀번호는 초기화 코드가 생기기 전에 정한 것이라 사업자등록번호만 확인해요.</span></p>') +
      msgP + '<div class="lk-btns"><button type="button" class="btn big ghost" data-lk="back-unlock">돌아가기</button><button type="button" class="btn big primary" data-lk="do-reset1">다음</button></div>');
    return focus('lkBiz');
  }
  if (st.mode === 'reset2') {
    shell('<span class="lk-step">2 / 2단계</span><h2>비밀번호 재설정</h2><p>새 비밀번호를 두 번 넣어 주세요. <b>숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리</b>예요.</p>' +
      '<label class="fld"><span>새 비밀번호</span><input class="in" id="lkNew" type="password" inputmode="numeric" maxlength="' + PIN_MAX + '" autocomplete="new-password"></label>' +
      '<label class="fld"><span>새 비밀번호 다시 입력</span><input class="in" id="lkNew2" type="password" inputmode="numeric" maxlength="' + PIN_MAX + '" autocomplete="new-password"></label>' +
      msgP + '<div class="lk-btns"><button type="button" class="btn big ghost" data-lk="back-unlock">처음으로</button><button type="button" class="btn big primary" data-lk="do-reset2">확인</button></div>');
    return focus('lkNew');
  }
  if (st.mode === 'code') {
    shell('<h2>' + C.ic('check') + '새 비밀번호를 정했어요</h2>' + codeBoxHtml(st.code) +
      '<div class="lk-btns"><button type="button" class="btn big primary" data-lk="code-done">확인 (캡처 · 메모했어요)</button></div>');
    return;
  }
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((k) => k === '' ? '<span></span>' : '<button type="button" class="lk-key" data-lk="' + k + '" aria-label="' + (k === 'back' ? '한 글자 지우기' : k) + '">' + (k === 'back' ? C.ic('backspace') : k) + '</button>').join('');
  shell('<h2>' + C.ic('lock') + '화면이 잠겨 있어요</h2><p>비밀번호를 눌러 주세요</p>' + dots() + msgP + '<div class="lk-pad">' + keys + '</div>' +
    '<div class="lk-foot">' + (pinLen() ? '' : '<button type="button" class="lk-ok btn primary" data-lk="ok"' + (st.typed.length >= PIN_MIN ? '' : ' disabled') + '>열기</button>') +
    '<button type="button" class="lk-forgot" data-lk="forgot">비밀번호를 잊었어요</button></div>');
}
async function tryOpen() {
  if (!validPin(st.typed)) return;
  const typed = st.typed;
  if (await checkPin(lockInfo(), typed)) {
    const L = lockInfo();
    if (!L.len) L.len = typed.length;                       // v1.0.0 비밀번호: 자릿수를 이제 기억
    if (!hasRecovery(L)) {                                 // 초기화 코드가 없던 비밀번호면 지금 발급
      const r = await makeLock(typed); C.S.data.settings.lock = r.lock; C.changed();
      st.code = r.code; st.mode = 'code'; st.typed = ''; paint(); return;
    }
    C.changed(); unlock(); C.toast('잠금을 풀었어요'); return;
  }
  st.tries++; st.typed = '';
  paint(st.tries >= 5 ? '여러 번 틀렸어요. 잊었다면 아래 「비밀번호를 잊었어요」를 눌러 주세요' : '비밀번호가 맞지 않아요');
  const card = document.querySelector('.lk-card'); if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
}
const val = (id) => (document.getElementById(id) || {}).value || '';
async function press(k) {
  if (k === 'back') st.typed = st.typed.slice(0, -1);
  else if (k === 'ok') return tryOpen();
  else if (k === 'forgot') { st.mode = 'reset1'; return paint(); }
  else if (k === 'back-unlock') { st.mode = 'unlock'; st.typed = ''; return paint(); }
  else if (k === 'do-reset1') {
    if (onlyDigits(val('lkBiz')).length !== 10) return paint('사업자등록번호는 숫자 10자리예요');
    const r = await checkReset(lockInfo(), C.S.data.me, val('lkBiz'), val('lkCode'));
    if (!r.ok) { st.tries++; return paint(r.bizOk === false ? '사업자등록번호가 내 정보와 맞지 않아요' : '초기화 코드가 맞지 않아요'); }
    st.mode = 'reset2'; return paint();
  } else if (k === 'do-reset2') {
    const a = onlyDigits(val('lkNew')), b = onlyDigits(val('lkNew2'));
    if (!validPin(a)) return paint('새 비밀번호는 숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리로 넣어 주세요');
    if (a !== b) return paint('두 번 넣은 비밀번호가 달라요');
    const r = await makeLock(a); C.S.data.settings.lock = r.lock; C.changed();
    st.code = r.code; st.mode = 'code'; return paint();
  } else if (k === 'code-done') { st.code = ''; unlock(); C.toast('새 비밀번호로 열었어요'); return; }
  else if (/^\d$/.test(k) && st.typed.length < (pinLen() || PIN_MAX)) st.typed += k;
  paint();
  if (pinLen() ? st.typed.length === pinLen() : st.typed.length === PIN_MAX) tryOpen();
}
function onClick(e) {
  if (!st.locked) return;
  const b = e.target.closest('[data-lk]');
  if (!e.target.closest('#lockScreen')) { e.stopPropagation(); e.preventDefault(); return; }
  if (b) { e.stopPropagation(); e.preventDefault(); press(b.dataset.lk); }
}
function onInput(e) {
  if (!st.locked) return;
  const t = e.target;
  if (t.id === 'lkBiz') { const f = formatBizNo(t.value); if (f !== t.value) t.value = f; }
  if (t.id === 'lkCode') { const f = normCode(t.value).slice(0, CODE_LEN); if (f !== t.value) t.value = f; }
  if (t.id === 'lkNew' || t.id === 'lkNew2') { const f = onlyDigits(t.value).slice(0, PIN_MAX); if (f !== t.value) t.value = f; }
  e.stopPropagation();
}
function onKey(e) {
  if (!st.locked) return;
  e.stopPropagation();
  if (st.mode !== 'unlock') {
    if (e.key === 'Enter') { e.preventDefault(); press(st.mode === 'reset1' ? 'do-reset1' : st.mode === 'reset2' ? 'do-reset2' : 'code-done'); }
    return;
  }
  if (/^\d$/.test(e.key)) { e.preventDefault(); press(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); press('back'); }
  else if (e.key === 'Enter') { e.preventDefault(); press('ok'); }
  else if (!(e.ctrlKey || e.metaKey)) e.preventDefault();
}

/* ── 설정 화면에서 쓰는 것 ── */
/** 새 비밀번호 정하기 · 재설정: 성공하면 새 초기화 코드를 돌려준다 (화면에 한 번 보여 줄 것) */
export async function setPin(pin) { if (!validPin(pin)) return null; const r = await makeLock(pin); C.S.data.settings.lock = r.lock; C.changed(); touch(); return r.code; }
export async function verifyPin(pin) { return checkPin(lockInfo(), pin); }
export function removePin() { delete C.S.data.settings.lock; C.changed(); }
