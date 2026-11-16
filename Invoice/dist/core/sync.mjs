// PC ↔ 휴대폰 자료 맞추기 규칙 (구글 드라이브) — 「세 갈래 합치기」
//  base   = 지난번에 맞춘 자료 (이 기기에 보관)
//  local  = 이 기기의 지금 자료
//  remote = 드라이브의 지금 자료 (다른 기기가 올린 것)
// 목록(문서 · 거래처 · 품목 · 세트 · 장비 · 행사 · 입금 · 휴지통)은 하나씩(id) 비교한다.
//  · 한쪽만 바꿨으면 바꾼 쪽, 둘 다 바꿨으면 나중에 고친 쪽(updatedAt), 같으면 그대로
//  · base 에 있던 것을 한쪽이 지웠고 다른 쪽은 안 바꿨으면 → 지운다. 다른 쪽이 그 사이 고쳤으면 → 남긴다(자료를 잃지 않게)
//  · 새로 생긴 것은 양쪽 모두 남긴다
// 내 정보 · 설정은 칸(키)마다 같은 규칙. 화면 잠금 비밀번호(settings.lock)도 맞춘다. 글자 크게 · 자동 잠금 시간만 기기마다 따로.
// 화면 없이 계산만 한다 → node 시험(core/tests-sync.mjs).

export const LISTS = ['clients', 'items', 'sets', 'equipment', 'events', 'docs', 'payments', 'trash'];
export const DEVICE_ONLY_SETTINGS = ['bigText', 'autoLockMin'];   // 이 기기에서만 쓰는 설정 (화면 잠금 비밀번호는 PC · 휴대폰 같은 번호로 맞춘다 — 사용자 결정 v1.3.0)

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keyOf = (list, x) => (list === 'trash' ? (x.kind + ':' + (x.item && x.item.id)) : x.id);
const stampOf = (x) => String((x && (x.updatedAt || x.deletedAt || x.createdAt)) || '');

/** 한 목록 합치기 */
export function mergeList(list, base, local, remote) {
  const B = new Map((base || []).filter(Boolean).map((x) => [keyOf(list, x), x]));
  const Lm = new Map((local || []).filter(Boolean).map((x) => [keyOf(list, x), x]));
  const Rm = new Map((remote || []).filter(Boolean).map((x) => [keyOf(list, x), x]));
  const order = [...Lm.keys(), ...[...Rm.keys()].filter((k) => !Lm.has(k))];
  const out = [];
  for (const k of order) {
    const b = B.get(k), l = Lm.get(k), r = Rm.get(k);
    if (l && r) {
      if (same(l, r) || same(r, b)) out.push(l);
      else if (same(l, b)) out.push(r);
      else out.push(stampOf(r) > stampOf(l) ? r : l);       // 둘 다 고침: 나중에 고친 쪽 (같으면 이 기기)
    } else if (l) {
      if (b && same(l, b)) continue;                        // 저쪽에서 지움 + 이쪽은 그대로 → 지움
      out.push(l);                                          // 새로 생김, 또는 이쪽이 그 사이 고침 → 남김
    } else if (r) {
      if (b && same(r, b)) continue;                        // 이쪽에서 지움 + 저쪽은 그대로 → 지움
      out.push(r);
    }
  }
  return out;
}

/** 내 정보 · 설정 같은 묶음: 칸마다 합치기 */
export function mergeObject(base, local, remote, skip = []) {
  const b = base || {}, l = local || {}, r = remote || {};
  const out = {};
  for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
    if (skip.includes(k)) { if (k in l) out[k] = l[k]; continue; }
    if (!(k in r)) { out[k] = l[k]; continue; }
    if (!(k in l)) { out[k] = r[k]; continue; }
    if (same(l[k], r[k]) || same(r[k], b[k])) out[k] = l[k];
    else if (same(l[k], b[k])) out[k] = r[k];
    else out[k] = l[k];                                     // 둘 다 같은 칸을 고침: 이 기기 것을 남긴다
  }
  return out;
}

/** 자료 전체 합치기. base 가 없으면(처음 연결) 양쪽을 모두 남기는 합치기 */
export function mergeData(base, local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  const b = base || {};
  const out = { ...remote, ...local };
  for (const list of LISTS) out[list] = mergeList(list, b[list], local[list], remote[list]);
  out.me = base ? mergeObject(b.me, local.me, remote.me) : firstMe(local.me, remote.me);
  out.settings = mergeObject(b.settings, local.settings, remote.settings, DEVICE_ONLY_SETTINGS);
  return out;
}
/** 처음 연결할 때 내 정보: 이 기기가 비어 있으면(휴대폰 첫 사용) 드라이브 것, 아니면 칸마다 빈 칸만 채움 */
function firstMe(l = {}, r = {}) {
  const empty = !(l.name || l.bizNo);
  if (empty) return { ...l, ...r };
  const out = { ...l };
  for (const k of Object.keys(r)) if ((out[k] == null || out[k] === '') && r[k] != null && r[k] !== '') out[k] = r[k];
  return out;
}
export const sameData = same;

/** 자료 개수 요약 (확인 창에 보여 줄 것) */
export function countData(d) {
  return { docs: (d && d.docs || []).length, clients: (d && d.clients || []).length, items: (d && d.items || []).length, events: (d && d.events || []).length };
}
