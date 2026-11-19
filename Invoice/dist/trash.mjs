// 화면: 휴지통 (#trash) — 지운 문서 · 거래처 · 품목 · 세트 · 장비를 30일 동안 보관, 되살리기 · 완전히 지우기
// 휴지통 한 칸: { kind: 'doc'|'client'|'item'|'set'|'equip', item, deletedAt, gearOf? }
// 30일 지난 것은 프로그램을 열 때 비운다 (core/reports.mjs purgeTrash, node 시험 통과).
import { daysLeft, TRASH_DAYS } from './core/reports.mjs?v=mwmznjx6';
import { docNo, DOC_TYPES, docTotals } from './core/docs.mjs?v=mwmznjx6';
import { won } from './docview.mjs?v=mwmznjx6';

let C;
export function initTrash(ctx) { C = ctx; }

const KINDS = { doc: ['문서', 'fileText'], client: ['거래처', 'users'], item: ['품목', 'layers'], set: ['세트', 'layers'], equip: ['장비', 'tent'] };
const ARR = { doc: 'docs', client: 'clients', item: 'items', set: 'sets', equip: 'equipment' };

function describe(t) {
  const it = t.item || {};
  if (t.kind === 'doc') return [(DOC_TYPES[it.type] || DOC_TYPES.quote).label + ' ' + docNo(it), [it.client && it.client.name, it.event && it.event.name, '₩' + won(docTotals(it).total)].filter(Boolean).join(' · ')];
  if (t.kind === 'client') return [it.name, [it.person, it.tel].filter(Boolean).join(' · ')];
  if (t.kind === 'item') return [it.name, [it.cat, it.spec, it.price ? won(it.price) + '원' : ''].filter(Boolean).join(' · ')];
  if (t.kind === 'set') return [it.name, (it.lines || []).length + '개 품목'];
  if (t.kind === 'equip') return [it.name, [it.cat, it.spec, '총 ' + (it.total || 0) + '개'].filter(Boolean).join(' · ')];
  return [it.name || '알 수 없음', ''];
}

export function trashPage() {
  const S = C.S, tr = S.data.trash || [];
  const f = S.trashKind || '';
  const counts = Object.keys(KINDS).map((k) => [k, tr.filter((t) => t.kind === k).length]).filter(([, n]) => n);
  const chips = '<div class="fchips">' + [['', '전체', tr.length], ...counts.map(([k, n]) => [k, KINDS[k][0], n])].map(([k, l, n]) => '<button type="button" class="fchip' + (f === k ? ' on' : '') + '" data-act="trash-kind" data-k="' + k + '">' + l + ' <small>' + n + '</small></button>').join('') + '</div>';
  const shown = tr.map((t, i) => ({ t, i })).filter(({ t }) => !f || t.kind === f).sort((a, b) => String(b.t.deletedAt).localeCompare(String(a.t.deletedAt)));
  const rows = shown.map(({ t, i }) => {
    const [title, sub] = describe(t), k = KINDS[t.kind] || ['기타', 'trash'], left = daysLeft(t);
    return '<li class="trow"><span class="tk">' + C.ic(k[1]) + '<small>' + k[0] + '</small></span><span class="tn"><b>' + C.esc(title) + '</b><small>' + C.esc(sub) + '</small></span>' +
      '<span class="td"><small>' + new Date(t.deletedAt).toLocaleDateString('ko-KR') + ' 지움</small><em class="' + (left <= 3 ? 'soon' : '') + '">' + left + '일 뒤 완전히 지워짐</em></span>' +
      '<span class="ta"><button type="button" class="btn sm primary" data-act="trash-restore" data-i="' + i + '">' + C.ic('left') + '되살리기</button><button type="button" class="btn sm danger-o" data-act="trash-purge" data-i="' + i + '">' + C.ic('trash') + '완전히 지우기</button></span></li>';
  }).join('');
  return '<section class="card"><div class="card-h"><h2>' + C.ic('trash') + '휴지통</h2><span class="hint">지운 것은 ' + TRASH_DAYS + '일 동안 여기 있다가 저절로 지워져요</span>' +
    (tr.length ? '<div class="tools"><button type="button" class="btn danger-o" data-act="trash-empty">' + C.ic('trash') + '휴지통 비우기</button></div>' : '') + '</div>' +
    (tr.length ? chips + '<ul class="tlist">' + rows + '</ul>' : '<div class="empty">휴지통이 비어 있어요.<br>문서 · 거래처 · 품목 · 장비를 지우면 여기에 ' + TRASH_DAYS + '일 동안 보관돼요.</div>') + '</section>';
}

function restore(i) {
  const S = C.S, t = S.data.trash[i]; if (!t) return;
  const arr = S.data[ARR[t.kind]]; if (!arr) return;
  if (arr.some((x) => x.id === t.item.id)) { S.data.trash.splice(i, 1); C.changed(); C.render(); C.toast('이미 되살린 항목이라 휴지통에서만 뺐어요'); return; }
  arr.push(t.item);
  if (t.kind === 'equip' && Array.isArray(t.gearOf)) {   // 장비를 지울 때 행사에서 뺀 수량도 되돌린다
    for (const g of t.gearOf) { const e = S.data.events.find((x) => x.id === g.eventId); if (e && !(e.gear || []).some((x) => x.equipId === t.item.id)) e.gear = (e.gear || []).concat([{ equipId: t.item.id, qty: g.qty }]); }
  }
  S.data.trash.splice(i, 1); C.changed(); C.render();
  const [title] = describe(t);
  C.toast('「' + title + '」을(를) 되살렸어요');
}

export function trashClick(act, a) {
  const S = C.S;
  if (act === 'trash-kind') { S.trashKind = a.dataset.k; C.render(); return true; }
  if (act === 'trash-restore') { restore(Number(a.dataset.i)); return true; }
  if (act === 'trash-purge') {
    const i = Number(a.dataset.i), t = S.data.trash[i]; if (!t) return true;
    C.openModal({ tone: 'danger', icon: 'trash', title: '완전히 지울까요?', body: '<p><b>' + C.esc(describe(t)[0]) + '</b></p><p>지우면 되살릴 수 없어요. (백업에는 남아 있을 수 있어요)</p>', ok: '완전히 지우기',
      onOk: () => { S.data.trash.splice(i, 1); C.changed(); C.render(); C.toast('완전히 지웠어요'); } });
    return true;
  }
  if (act === 'trash-empty') {
    const n = S.data.trash.length;
    C.openModal({ tone: 'danger', icon: 'trash', title: '휴지통을 비울까요?', body: '<p>' + n + '개를 모두 완전히 지워요. 되살릴 수 없어요.</p><p class="note">' + C.ic('copy') + '<span>지우기 전에 백업을 하나 만들어 둬요.</span></p>', ok: '모두 지우기',
      onOk: async () => { await C.saveNow(); await C.S.store.backup('휴지통비우기전_보관'); S.data.trash = []; C.changed(); C.render(); C.toast('휴지통을 비웠어요 (비우기 전 백업을 만들었어요)'); } });
    return true;
  }
  return false;
}
