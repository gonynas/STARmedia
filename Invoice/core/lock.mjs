// 화면 잠금 규칙 — 숫자 4~10자리 비밀번호 + 초기화 코드(영어 대문자 · 숫자 5자리)
// 비밀번호 · 초기화 코드 자체는 저장하지 않고, 소금(무작위 글자)을 섞은 SHA-256 값만 settings.lock 에 저장한다.
//   settings.lock = { salt, hash, len(비밀번호 자릿수: 잠금 화면 동그라미 개수), rsalt, rhash(초기화 코드), setAt }
// 비밀번호를 잊으면 2단계: ① 초기화(사업자등록번호 + 초기화 코드) → ② 재설정(새 비밀번호 두 번) → 새 초기화 코드 발급.
// 이 잠금은 「남이 화면을 못 보게 하는 문」이다(자료 파일을 암호화하지는 않는다).

export const PIN_MIN = 4, PIN_MAX = 10;
export const validPin = (pin) => new RegExp('^\\d{' + PIN_MIN + ',' + PIN_MAX + '}$').test(String(pin || ''));
export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

// 헷갈리는 글자(0 · O · 1 · I)는 빼고 만든다 — 메모하거나 캡처를 보고 옮겨 적을 때 틀리지 않게
export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LEN = 5;
export function newRecoveryCode() {
  const a = new Uint32Array(CODE_LEN); crypto.getRandomValues(a);
  return [...a].map((n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
}
export const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export function newSalt() { const a = new Uint8Array(12); crypto.getRandomValues(a); return hex(a); }
export async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(salt + ':' + String(pin));
  return hex(await crypto.subtle.digest('SHA-256', data));
}
/** 새 잠금 정보 + 새 초기화 코드. 돌려주는 값: { lock, code } (code 는 화면에 한 번만 보여 준다) */
export async function makeLock(pin, now = new Date().toISOString()) {
  const salt = newSalt(), rsalt = newSalt(), code = newRecoveryCode();
  return { lock: { salt, hash: await hashPin(pin, salt), len: String(pin).length, rsalt, rhash: await hashPin(code, rsalt), setAt: now }, code };
}
export async function checkPin(lock, pin) { return !!(lock && lock.hash && validPin(pin) && (await hashPin(pin, lock.salt)) === lock.hash); }
export const hasRecovery = (lock) => !!(lock && lock.rhash && lock.rsalt);

/** 초기화 1단계: 사업자등록번호가 내 정보와 같고, 초기화 코드가 맞는가 */
export async function checkReset(lock, me, bizNo, code) {
  const a = onlyDigits(me && me.bizNo), b = onlyDigits(bizNo);
  const bizOk = a.length === 10 && a === b;
  if (!hasRecovery(lock)) return { ok: bizOk, bizOk, codeOk: null };   // 초기화 코드가 생기기 전(v1.0.0)에 정한 비밀번호
  const codeOk = normCode(code).length === CODE_LEN && (await hashPin(normCode(code), lock.rsalt)) === lock.rhash;
  return { ok: bizOk && codeOk, bizOk, codeOk };
}

/** 마지막으로 손댄 뒤 minutes 분이 지났으면 잠글 때 (0 = 자동 잠금 끔) */
export function shouldAutoLock(lastActive, nowMs, minutes) { return Number(minutes) > 0 && nowMs - Number(lastActive || 0) >= Number(minutes) * 60000; }

/* ── 사업자등록번호 (XXX-XX-XXXXX) ── */
/** 치는 동안: 숫자만 남기고 10자리까지, 자리에 맞춰 - 를 넣는다 */
export function formatBizNo(s) {
  const d = onlyDigits(s).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return d.slice(0, 3) + '-' + d.slice(3);
  return d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5);
}
/** 국세청 검증 규칙(마지막 자리 = 검증 숫자)으로 번호가 맞게 생겼는지 */
export function bizNoChecksumOk(s) {
  const d = onlyDigits(s); if (d.length !== 10) return false;
  const w = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0; for (let i = 0; i < 9; i++) sum += Number(d[i]) * w[i];
  sum += Math.floor(Number(d[8]) * 5 / 10);
  return (10 - (sum % 10)) % 10 === Number(d[9]);
}
/** 입력을 마쳤을 때: '' (비었음) · 'short'(10자리 아님) · 'check'(검증 숫자 안 맞음) · 'ok' */
export function bizNoState(s) { const d = onlyDigits(s); if (!d) return ''; if (d.length !== 10) return 'short'; return bizNoChecksumOk(d) ? 'ok' : 'check'; }
