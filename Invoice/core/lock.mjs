// 화면 잠금 규칙 — 숫자 4~6자리 비밀번호.
// 비밀번호 자체는 저장하지 않고, 소금(무작위 글자)을 섞은 SHA-256 값만 settings.lock 에 저장한다.
// 이 잠금은 「남이 화면을 못 보게 하는 문」이다(자료 파일을 암호화하지는 않는다).

export const validPin = (pin) => /^\d{4,6}$/.test(String(pin || ''));
export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export function newSalt() { const a = new Uint8Array(12); crypto.getRandomValues(a); return hex(a); }
export async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(salt + ':' + String(pin));
  return hex(await crypto.subtle.digest('SHA-256', data));
}
/** 새 잠금 정보 { salt, hash, setAt } */
export async function makeLock(pin, now = new Date().toISOString()) { const salt = newSalt(); return { salt, hash: await hashPin(pin, salt), setAt: now }; }
export async function checkPin(lock, pin) { return !!(lock && lock.hash && validPin(pin) && (await hashPin(pin, lock.salt)) === lock.hash); }

/** 비밀번호를 잊었을 때: 내 정보의 사업자등록번호(숫자만)가 맞으면 새로 정할 수 있다 */
export function canResetWith(me, bizNo) { const a = onlyDigits(me && me.bizNo), b = onlyDigits(bizNo); return a.length >= 10 && a === b; }

/** 마지막으로 손댄 뒤 minutes 분이 지났으면 잠글 때 (0 = 자동 잠금 끔) */
export function shouldAutoLock(lastActive, nowMs, minutes) { return Number(minutes) > 0 && nowMs - Number(lastActive || 0) >= Number(minutes) * 60000; }
