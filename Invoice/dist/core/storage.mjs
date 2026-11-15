// 스타미디어 견적서 발행기 — 저장 장치 (1단계)
// 저장 위치마다 따로 성공/실패를 기록한다(최종확정 v1.0 8절): '이 기기' · 'PC 폴더' (· 2단계 '구글 드라이브')
// 백업: 최근 10개 + 하루 전 사본. 되돌리기 전에는 항상 지금 자료를 자동 백업(P07), 실패하면 원상복구.
// 저장소는 '어댑터'로 갈아 끼운다: 시험은 메모리, 브라우저는 IndexedDB · PC 폴더(File System Access).
import { wrap, load, APP_ID } from './datafile.mjs?v=mwh60llr';

export const BACKUP_KEEP = 10;
const MAIN = 'main';           // 현재 자료
const DAYCOPY = 'daycopy';     // 하루 전 사본
const BK = 'backup:';          // 백업 이름 앞머리

/** 시험용 메모리 저장소 (브라우저 저장소와 같은 모양) */
export function memoryAdapter(name = 'memory', { failWrites = false } = {}) {
  const m = new Map();
  return {
    name,
    failWrites,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async set(k, v) { if (this.failWrites) throw new Error(name + ' write failed'); m.set(k, v); },
    async del(k) { m.delete(k); },
    async keys() { return [...m.keys()]; }
  };
}

/** 브라우저: IndexedDB 저장소 (실제 브라우저에서만 동작 · 브라우저 시험 필요) */
export function idbAdapter(dbName = 'starmedia-quote') {
  const open = () => new Promise((ok, no) => {
    const r = indexedDB.open(dbName, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
  const tx = async (mode, fn) => { const db = await open(); return new Promise((ok, no) => { const t = db.transaction('kv', mode); const s = t.objectStore('kv'); const req = fn(s); t.oncomplete = () => ok(req && req.result); t.onerror = () => no(t.error); }); };
  return {
    name: '이 기기',
    get: (k) => tx('readonly', (s) => s.get(k)).then((v) => (v === undefined ? null : v)),
    set: (k, v) => tx('readwrite', (s) => s.put(v, k)),
    del: (k) => tx('readwrite', (s) => s.delete(k)),
    keys: () => tx('readonly', (s) => s.getAllKeys())
  };
}

/** 브라우저: PC 폴더 저장소 — 형님이 고른 폴더(예: D:\견적서발행기)에 파일로 저장 (크롬 · 브라우저 시험 필요) */
export function folderAdapter(dirHandle) {
  const file = (k) => (k === MAIN ? '견적서발행기.json' : k === DAYCOPY ? '견적서발행기_하루전.json' : '백업/' + k.slice(BK.length) + '.json');
  async function dirFor(path, create) {
    const parts = path.split('/'); let d = dirHandle;
    for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create });
    return { d, name: parts[parts.length - 1] };
  }
  return {
    name: 'PC 폴더',
    async get(k) { try { const { d, name } = await dirFor(file(k), false); const f = await (await d.getFileHandle(name)).getFile(); return await f.text(); } catch (e) { return null; } },
    async set(k, v) { const { d, name } = await dirFor(file(k), true); const w = await (await d.getFileHandle(name, { create: true })).createWritable(); await w.write(v); await w.close(); },
    async del(k) { try { const { d, name } = await dirFor(file(k), false); await d.removeEntry(name); } catch (e) { /* 없으면 그냥 넘어감 */ } },
    async keys() {
      const out = [];
      try { await dirHandle.getFileHandle('견적서발행기.json'); out.push(MAIN); } catch (e) {}
      try { await dirHandle.getFileHandle('견적서발행기_하루전.json'); out.push(DAYCOPY); } catch (e) {}
      try { const b = await dirHandle.getDirectoryHandle('백업'); for await (const [n] of b.entries()) if (n.endsWith('.json')) out.push(BK + n.slice(0, -5)); } catch (e) {}
      return out;
    }
  };
}

const day = (iso) => iso.slice(0, 10);
const stamp = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', '-');

/**
 * 저장 장치. targets[0]이 '주 저장소'(이 기기), 나머지는 사본(PC 폴더 …).
 * opts.now: 시각 함수(시험용), opts.appVersion
 */
export function createStore(targets, { appVersion = '1.0.0', now = () => new Date().toISOString(), migrations = {}, target } = {}) {
  const status = {};  // 저장소 이름 → { ok, at, error }
  const loadOpts = { migrations, ...(target ? { target } : {}) };

  async function writeAll(key, text) {
    const result = {};
    for (const t of targets) {
      try { await t.set(key, text); result[t.name] = { ok: true, at: now() }; }
      catch (e) { result[t.name] = { ok: false, at: now(), error: String(e && e.message || e) }; }
    }
    return result;
  }

  async function backupNames(t = targets[0]) { return (await t.keys()).filter((k) => k.startsWith(BK)).sort(); }

  async function prune() {
    for (const t of targets) {
      const names = await backupNames(t);
      const auto = names.filter((n) => !n.includes('_보관'));
      for (const n of auto.slice(0, Math.max(0, auto.length - BACKUP_KEEP))) await t.del(n);
    }
  }

  const store = {
    status,
    /** 자동 저장: 모든 저장소에 쓰고, 날짜가 바뀌었으면 어제 자료를 '하루 전 사본'으로 남긴다 */
    async save(data) {
      const prev = await targets[0].get(MAIN);
      const t = now();
      if (prev) { try { const p = JSON.parse(prev); if (p.savedAt && day(p.savedAt) !== day(t)) await writeAll(DAYCOPY, prev); } catch (e) {} }
      const r = await writeAll(MAIN, JSON.stringify(wrap(data, appVersion, t)));
      Object.assign(status, r);
      return r;
    },
    /** 열기: 주 저장소 → 없으면 null (그때 화면에서 'PC 폴더에서 자료 찾기'를 권함) */
    async open() {
      const raw = await targets[0].get(MAIN);
      if (!raw) return { ok: false, reason: 'empty' };
      return load(raw, { ...loadOpts, backup: (env) => store.backup('업데이트전', env) });
    },
    /** 백업 만들기 (reason: 수동 · 자동 · 업데이트전 · 되돌리기전 …) */
    async backup(reason = '수동', env = null) {
      const text = env ? JSON.stringify(env) : await targets[0].get(MAIN);
      if (!text) return null;
      const name = BK + stamp(now()) + '_' + reason;
      await writeAll(name, text);
      await prune();
      return name;
    },
    async listBackups() { return (await backupNames()).map((n) => n.slice(BK.length)); },
    /** 되돌리기(P07): 지금 자료를 먼저 백업 → 선택한 백업을 현재로. 읽을 수 없는 백업이면 아무것도 바꾸지 않음 */
    async restore(name) {
      const text = await targets[0].get(BK + name);
      const check = text ? load(text, loadOpts) : { ok: false, reason: 'missing' };
      if (!check.ok) return { ok: false, reason: check.reason };
      const before = await store.backup('되돌리기전');
      const saved = await store.save(check.data);
      if (!saved[targets[0].name].ok) return { ok: false, reason: 'write-failed', before };
      return { ok: true, before, data: check.data };
    }
  };
  return store;
}

/**
 * 'PC 폴더에서 자료 찾기': 폴더 안 여러 파일(이름 → 내용) 중 읽을 수 있는 가장 최근 자료를 고른다.
 * 새 노트북 · 브라우저 기록 삭제 뒤 버튼 한 번으로 불러오기에 쓴다.
 */
export function pickLatest(files, loadOpts = {}) {
  let best = null;
  for (const [name, text] of Object.entries(files)) {
    let env; try { env = JSON.parse(text); } catch (e) { continue; }
    if (!env || env.app !== APP_ID) continue;
    const r = load(env, loadOpts);
    if (!r.ok) continue;
    if (!best || String(env.savedAt) > String(best.savedAt)) best = { name, savedAt: env.savedAt, data: r.data, migrated: r.migrated };
  }
  return best;
}
