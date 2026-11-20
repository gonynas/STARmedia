// 스타미디어 견적서 발행기 — 끌어서 순서 바꾸기 (거래처 등, v1.6.1)
// PC: 마우스로 눌러 끌기 · 휴대폰/태블릿: 꾹 눌러(0.35초) 끌기, 손잡이(.csgrip)는 바로 · 키보드 ↑↓.
// 순서는 화면(DOM)만 바꾸고, 「저장」 단추를 누른 쪽이 DOM 순서를 읽어 자료에 적는다.
// (품목 분류 순서는 items.mjs bindCatSort 가 같은 방식으로 따로 한다)
export function bindSortable(boxSel, rowSel) {
  let drag = null, timer = null, sx = 0, sy = 0;
  const box = () => document.querySelector(boxSel);
  const rowOf = (t) => t.closest && t.closest(boxSel + ' ' + rowSel);
  const moveTo = (y) => {
    const b = box(); if (!b || !drag) return;
    let before = null;
    for (const s of b.querySelectorAll(rowSel)) { if (s === drag) continue; const r = s.getBoundingClientRect(); if (y < r.top + r.height / 2) { before = s; break; } }
    if (drag.nextSibling !== before) b.insertBefore(drag, before);
  };
  const start = (row) => { drag = row; row.classList.add('dragging'); document.body.classList.add('cs-dragging'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* 무시 */ } };
  const end = () => { clearTimeout(timer); timer = null; if (drag) { drag.classList.remove('dragging'); drag = null; } document.body.classList.remove('cs-dragging'); };
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const row = rowOf(e.target); if (!row) return;
    e.preventDefault(); start(row);
    const mv = (ev) => moveTo(ev.clientY);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); end(); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
  document.addEventListener('touchstart', (e) => {
    const row = rowOf(e.target); if (!row || e.touches.length > 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    if (e.target.closest('.csgrip')) { start(row); return; }
    clearTimeout(timer); timer = setTimeout(() => start(row), 350);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (drag && drag.closest(boxSel)) { e.preventDefault(); moveTo(e.touches[0].clientY); return; }
    if (timer && (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8)) { clearTimeout(timer); timer = null; }
  }, { passive: false });
  document.addEventListener('touchend', end); document.addEventListener('touchcancel', end);
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest(boxSel)) e.preventDefault(); });
  document.addEventListener('keydown', (e) => {
    const row = rowOf(e.target); if (!row || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault(); const b = row.parentElement;
    if (e.key === 'ArrowUp' && row.previousElementSibling) b.insertBefore(row, row.previousElementSibling);
    else if (e.key === 'ArrowDown' && row.nextElementSibling) b.insertBefore(row.nextElementSibling, row);
    row.focus();
  });
}
/** 지금 화면에 보이는 순서(행의 data-id) */
export function sortedIds(boxSel, rowSel) { return [...document.querySelectorAll(boxSel + ' ' + rowSel)].map((r) => r.dataset.id); }
