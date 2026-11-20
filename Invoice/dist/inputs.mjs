// 입력 도우미 — 사업자등록번호 칸(내 정보 · 거래처)
//  · 치는 동안: 숫자만 남기고 10자리까지, 자리에 맞춰 - 를 저절로 넣는다 (123-45-67890). - 는 칠 필요 없음.
//  · 다 친 뒤(칸을 떠날 때): 10자리가 아니거나 국세청 검증 숫자가 안 맞으면 다시 확인하게 한다.
//    내 정보: 확인 창(「지우고 다시 입력」 · 「이대로 둘게요」). 거래처 창 안: 창 아래 안내 글(창이 하나뿐이라).
// 규칙은 core/lock.mjs 의 formatBizNo · bizNoState (node 시험 통과).
import { formatBizNo, bizNoState } from './core/lock.mjs?v=mwoc7ot1';

let C;
const isBiz = (t) => t && t.tagName === 'INPUT' && (t.dataset.me === 'bizNo' || t.dataset.cf === 'bizNo');
const MSG = { short: '사업자등록번호는 숫자 10자리예요 (예: 123-45-67890).', check: '번호를 다시 확인해 주세요. 사업자등록번호 끝자리(검증 숫자)가 맞지 않아요.' };

export function initInputs(ctx) {
  C = ctx;
  // 다른 처리보다 먼저(capture) 고쳐 놓아야 저장되는 값도 형식이 맞는다
  document.addEventListener('input', (e) => {
    const t = e.target; if (!isBiz(t)) return;
    const pos = t.selectionStart, before = t.value, f = formatBizNo(before);
    if (f !== before) {
      const digitsBefore = before.slice(0, pos).replace(/\D/g, '').length;
      t.value = f;
      let p = 0, n = 0; while (p < f.length && n < digitsBefore) { if (/\d/.test(f[p])) n++; p++; }
      try { t.setSelectionRange(p, p); } catch (err) { /* 일부 브라우저는 숫자 칸 커서를 못 옮김 */ }
    }
  }, true);
  document.addEventListener('focusout', (e) => {
    const t = e.target; if (!isBiz(t)) return;
    const state = bizNoState(t.value); if (state === '' || state === 'ok') { hideInline(t); return; }
    if (t.dataset.cf) { showInline(t, MSG[state]); return; }
    if (document.querySelector('#modal.on')) return;
    C.openModal({
      icon: 'alert', title: '사업자등록번호를 확인해 주세요', body: '<p><b>' + C.esc(t.value) + '</b></p><p>' + MSG[state] + '</p>',
      ok: '지우고 다시 입력', cancel: '이대로 둘게요',
      onOk: () => { t.value = ''; t.dispatchEvent(new Event('input', { bubbles: true })); setTimeout(() => t.focus(), 60); }
    });
  }, true);
}
function showInline(t, msg) {
  let m = t.parentElement.querySelector('.biz-msg');
  if (!m) { m = document.createElement('small'); m.className = 'biz-msg'; t.parentElement.appendChild(m); }
  m.textContent = msg;
}
function hideInline(t) { const m = t.parentElement && t.parentElement.querySelector('.biz-msg'); if (m) m.remove(); }
