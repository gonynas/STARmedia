// 스타미디어 견적서 발행기 — 품목 · 세트 규칙 (1단계)
// 화면과 상관없는 순수 규칙만 둔다. 품목: { id, cat, name, spec, price, days, taxFree, memo, createdAt, updatedAt }
// 세트: { id, name, memo, lines:[{ itemId, qty, days, name, spec, price, taxFree }] (name · spec · price 는 지운 품목 대비 사본) }
import { lineAmount } from './money.mjs?v=mwnja3le';

export const NO_CAT = '분류 없음';
const squash = (s) => String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase();

/** 숫자 칸 읽기: "170,000원" → 170000, "0.5" → 0.5, 못 읽으면 null */
export function toNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v == null ? '' : v).replace(/[,\s원₩]/g, '');
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** 분류 순서 정하기: 사용자가 정한 순서(order = settings.catOrder, 분류 이름 목록)대로, 거기 없는 분류는 그 뒤에 가나다순, 「분류 없음」은 맨 끝 */
export function catRank(order) {
  const m = new Map((Array.isArray(order) ? order : []).map((n, i) => [n, i]));
  return (name) => (name === NO_CAT ? 1e9 : m.has(name) ? m.get(name) : 1e6);
}
/** 분류 목록과 품목 수. 정한 순서(order) → 나머지 가나다순, 「분류 없음」은 맨 끝 */
export function categories(items, order = []) {
  const m = new Map(), r = catRank(order);
  for (const it of items) { const c = (it.cat || '').trim() || NO_CAT; m.set(c, (m.get(c) || 0) + 1); }
  return [...m.entries()].map(([name, count]) => ({ name, count }))
    .sort((a, b) => r(a.name) - r(b.name) || a.name.localeCompare(b.name, 'ko'));
}
/** 분류 이름을 바꾸거나 지울 때 정한 순서도 같이 고친다 (to 가 없으면 지움, 이미 있는 이름이면 합침) */
export function renameInOrder(order, from, to) {
  if (!Array.isArray(order)) return order;
  const i = order.indexOf(from); if (i < 0) return order;
  const out = order.slice();
  if (!to || out.includes(to)) out.splice(i, 1); else out[i] = to;
  return out;
}

/** 분류 · 검색어로 거르기 (검색: 분류 · 품목 · 규격 · 비고). 분류 → 품목 → 규격 순 정렬 */
export function filterItems(items, { cat = '', q = '', order = [] } = {}) {
  const k = squash(q), r = catRank(order), cn = (it) => (it.cat || '').trim() || NO_CAT;
  return items.filter((it) => {
    const c = cn(it);
    if (cat && c !== cat) return false;
    return !k || squash([it.cat, it.name, it.spec, it.memo].join(' ')).includes(k);
  }).sort((a, b) => r(cn(a)) - r(cn(b)) || ((a.cat || '').trim() || '힣').localeCompare((b.cat || '').trim() || '힣', 'ko') ||
    a.name.localeCompare(b.name, 'ko') || String(a.spec || '').localeCompare(String(b.spec || ''), 'ko'));
}

/** 같은 품목(이름 + 규격, 띄어쓰기 · 대소문자 무시)이 이미 있으면 그 품목 */
/** 품목 칸에 쓴 글자로 등록한 품목 찾기(실시간 목록): 품목 이름(또는 규격)에 그 글자가 들어 있으면 나온다(띄어쓰기 · 대소문자 무시).
 *  분류 이름으로는 찾지 않는다(「천막」을 쓰면 이름에 천막이 든 품목만). 이름이 그 글자로 시작하는 것 → 이름에 들어 있는 것 → 규격에만 있는 것 순,
 *  같은 순위는 이름 · 규격 가나다순. 예: 「텐」 → 몽골텐트, 천막텐트 */
export function searchItems(items, q, limit = 8) {
  const n = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, '');
  const k = n(q); if (!k) return [];
  const rank = (it) => (n(it.name).startsWith(k) ? 0 : n(it.name).includes(k) ? 1 : 2);
  return items.filter((it) => n(it.name).includes(k) || n(it.spec).includes(k))
    .sort((a, b) => rank(a) - rank(b) || String(a.name || '').localeCompare(String(b.name || ''), 'ko') || String(a.spec || '').localeCompare(String(b.spec || ''), 'ko'))
    .slice(0, limit);
}
/** 칸이 밀려 들어간 것 같은 품목: 규격이 비었고, 품목 칸에 크기 · 모양 같은 값(숫자가 있거나 「~형 · ~식 · ~용 · ~급」으로 끝남)이 있고, 분류가 따로 있는 것.
 *  예: 분류 「천막텐트」 · 품목 「3mx6m」 · 규격 없음 → 품목 「천막텐트」 · 규격 「3mx6m」 이 맞을 가능성이 크다 (사용자가 확인한 뒤에만 바꾼다) */
export function misplacedItems(items) {
  const looksSpec = (s) => /\d/.test(s) || /(형|식|용|급)$/.test(s);
  return items.filter((it) => {
    const nm = String(it.name || '').trim(), cat = String(it.cat || '').trim();
    return !String(it.spec || '').trim() && cat && nm && squash(cat) !== squash(nm) && looksSpec(nm);
  });
}
/** 고른 품목을 바로잡기: 분류 → 품목 이름, 품목 이름 → 규격 (분류는 그대로). 그 품목을 쓰는 세트 사본과 「작성 중」 문서 줄도 같이 고친다.
 *  돌려주는 값: { items, sets, lines } 고친 개수 */
export function fixMisplaced(data, ids, now = new Date().toISOString()) {
  const out = { items: 0, sets: 0, lines: 0 };
  for (const it of data.items) {
    if (!ids.includes(it.id)) continue;
    const oldName = it.name, cat = String(it.cat || '').trim();
    it.spec = String(oldName || '').trim(); it.name = cat; it.updatedAt = now; out.items++;
    for (const s of data.sets || []) for (const l of s.lines || []) if (l.itemId === it.id) { l.name = it.name; l.spec = it.spec; out.sets++; }
    for (const d of data.docs || []) {
      if (d.status && d.status !== 'draft') continue;   // 다 만든 · 보낸 문서는 그대로 둔다
      for (const l of d.lines || []) if (l.itemId === it.id && l.name === oldName && !String(l.spec || '').trim()) { l.name = it.name; l.spec = it.spec; out.lines++; d.updatedAt = now; }
    }
  }
  return out;
}
export function findDuplicate(items, { name, spec }, exceptId = null) {
  return items.find((it) => it.id !== exceptId && squash(it.name) === squash(name) && squash(it.spec) === squash(spec)) || null;
}

/** 분류 이름 바꾸기 (같은 이름이 있으면 합쳐짐). 바뀐 품목 수 */
export function renameCategory(items, from, to, now = new Date().toISOString()) {
  const t = String(to || '').trim(); let n = 0;
  for (const it of items) {
    if (((it.cat || '').trim() || NO_CAT) === from) { it.cat = t === NO_CAT ? '' : t; it.updatedAt = now; n++; }
  }
  return n;
}

/** 분류 지우기: 품목은 지우지 않고 「분류 없음」으로 */
export function removeCategory(items, name, now = new Date().toISOString()) { return renameCategory(items, name, '', now); }

/** 이 품목을 쓰는 세트 이름들 */
export function setsUsing(sets, itemId) { return sets.filter((s) => s.lines.some((l) => l.itemId === itemId)).map((s) => s.name); }

/** 세트 한 줄을 문서 품목 줄로: 품목이 있으면 지금 품목 정보(단가 등), 지워졌으면 세트에 남긴 사본 */
export function setLineToDocLine(line, items) {
  const it = items.find((x) => x.id === line.itemId);
  const src = it || line;
  return {
    itemId: line.itemId || null, name: src.name || '', spec: src.spec || '',
    days: toNum(line.days) ?? 1, qty: toNum(line.qty) ?? 1, price: toNum(src.price) ?? 0,
    taxFree: !!src.taxFree, memo: it ? (it.memo || '') : '', missing: !it
  };
}

/** 세트를 문서 품목 줄 여러 개로 펼치기 (설계서 9-8: 한 줄씩 펼쳐 넣고, 넣은 뒤 고칠 수 있음) */
export function expandSet(set, items) { return set.lines.map((l) => setLineToDocLine(l, items)); }

/** 세트 금액 (부가세 전 공급가액 합계) */
export function setAmount(set, items) { return expandSet(set, items).reduce((s, l) => s + lineAmount(l), 0); }

/** 세트에 넣을 때 품목 사본을 함께 적어 둔다 (품목을 지워도 세트가 깨지지 않게) */
export function snapshotLine(item, qty = 1, days = null) {
  return { itemId: item.id, qty: toNum(qty) ?? 1, days: toNum(days) ?? (toNum(item.days) ?? 1), name: item.name, spec: item.spec || '', price: toNum(item.price) ?? 0, taxFree: !!item.taxFree };
}

/* ── 엑셀에서 복사한 품목 표 읽기 ── */
const HEAD = {
  cat: /^(분류|구분|종류|카테고리)$/, name: /^(품목|품명|품목명|항목|이름|내용)$/, spec: /^(규격|사양|크기|사이즈)$/,
  price: /^(단가|기본단가|가격|금액|대여료)$/, days: /^(일수|기본일수|기간)$/, memo: /^(비고|메모)$/
};

/**
 * 탭으로 나뉜 글자(엑셀 복사)를 품목 목록으로.
 * 첫 줄이 머리글(분류 · 품목 · 규격 · 단가 …)이면 그 순서대로, 아니면 칸 수로 짐작:
 *   4칸 이상: 분류 · 품목 · 규격 · 단가 (· 일수 · 비고) / 3칸: 품목 · 규격 · 단가 / 2칸: 품목 · 단가 / 1칸: 품목
 * 돌려주는 값: { rows:[{cat,name,spec,price,days,memo}], skipped: 읽지 못한 줄 수, header: 머리글을 썼는지 }
 */
export function parsePaste(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (!lines.length) return { rows: [], skipped: 0, header: false };
  const split = (l) => (l.includes('\t') ? l.split('\t') : l.split(/\s{2,}/)).map((c) => c.trim());
  let cols = null, start = 0;
  const first = split(lines[0]).map((c) => c.replace(/\s/g, ''));
  const mapped = first.map((c) => Object.keys(HEAD).find((k) => HEAD[k].test(c)) || null);
  if (mapped.includes('name')) { cols = mapped; start = 1; }
  const rows = []; let skipped = 0;
  for (const l of lines.slice(start)) {
    const c = split(l);
    let r;
    if (cols) {
      r = {}; cols.forEach((k, i) => { if (k && c[i] !== undefined) r[k] = c[i]; });
    } else if (c.length >= 4) {
      // 숫자(단가)가 셋째 칸이면 「품목 · 규격 · 단가 (· 일수/비고)」, 아니면 「분류 · 품목 · 규격 · 단가 …」 (분류 칸에 품목이 들어가지 않게)
      if (toNum(c[2]) !== null && toNum(c[3]) === null) r = { name: c[0], spec: c[1], price: c[2], memo: c[3] };
      else if (toNum(c[2]) !== null && toNum(c[3]) !== null && toNum(c[1]) === null && c.length <= 5 && toNum(c[4] ?? '') === null) r = { name: c[0], spec: c[1], price: c[2], days: c[3], memo: c[4] };
      else r = { cat: c[0], name: c[1], spec: c[2], price: c[3], days: c[4], memo: c[5] };
    }
    else if (c.length === 3) r = { name: c[0], spec: c[1], price: c[2] };
    else if (c.length === 2) r = { name: c[0], price: c[1] };
    else r = { name: c[0] };
    const name = String(r.name || '').trim();
    if (!name || toNum(name) !== null || /^(합|소|총)?\s*계$/.test(name)) { skipped++; continue; }
    rows.push({
      cat: String(r.cat || '').trim(), name, spec: String(r.spec || '').trim(),
      price: toNum(r.price) ?? 0, days: toNum(r.days) ?? 1, memo: String(r.memo || '').trim()
    });
  }
  return { rows, skipped, header: !!cols };
}
