// 스타미디어 견적서 발행기 — 자료 파일 형식과 업데이트 때 자동 변환 (1단계)
// 목표: 프로그램을 업데이트해도 기존 자료를 손대지 않고 그대로 이어 쓴다.
//  1) 자료 파일마다 형식 번호(schema)를 적는다.
//  2) 새 버전이 옛 형식을 열면 변환 단계를 차례로 적용한다(1→2→3 …).
//  3) 변환 직전에 원본을 백업으로 남기고, 변환이 실패하면 원본을 그대로 돌려준다.
//  4) 더 새 형식(미래 버전이 만든 파일)은 열지 않고 알려 준다.

export const APP_ID = 'starmedia-quote';
export const CURRENT_SCHEMA = 2;

/** 빈 자료 (형식 1) */
export function emptyData() {
  return {
    me: { name: '', ceo: '', bizNo: '', addr: '', bizType: '', bizItem: '', tel: '', fax: '', bankName: '', bankNo: '', holder: '', stamp: null, stampSize: 54 },
    clients: [], items: [], sets: [], equipment: [],
    events: [],    // 행사 한 건: { id, name, clientId, start, end, out, back, agreed, baseDocId }
    docs: [],      // 문서: { id, eventId, type, serial, version, issued:{...발행 당시 사본}, lines, vat, ... }
    payments: [],  // 입금: { id, eventId, date, amount, method, memo, cancelled }
    trash: [],     // 지운 것(30일): { kind, item, deletedAt }
    settings: { vat: 'excl', validDays: 15, dueDays: 14, autoLockMin: 5, bigText: false, fillRows: false,
      phrases: ['우천 시 행사 일정은 협의하여 조정합니다.', '설치 · 철수 인건비가 포함된 금액입니다.', '전기 사용료는 별도입니다.', '계약금 입금 후 일정이 확정됩니다.'] }
  };
}

/**
 * 형식 바꾸기 (업데이트 때 저절로 적용, 바꾸기 전 원본은 백업으로 남는다)
 *  1 → 2 (v1.3.0): 문서 상태를 3단계로. 계약 → 발송 완료 + 그 행사에 「계약 확정」(행사가 없으면 문서로 행사를 만들어 계약 확정),
 *                  보냄 → 발송 완료, 취소 → 작성 완료, 그 밖 → 작성 중.
 */
export const MIGRATIONS = {
  1: (data) => {
    const d = JSON.parse(JSON.stringify(data));
    d.events = d.events || [];
    for (const doc of d.docs || []) {
      const s = doc.status;
      if (s === 'contract') {
        let e = doc.eventId && d.events.find((x) => x.id === doc.eventId);
        if (!e) {
          const c = doc.client || {}, ev = doc.event || {};
          e = { id: 'e' + String(doc.id || Math.random().toString(36).slice(2)) + 'm', name: (ev.name || '').trim() || ((c.name || '이름 없는') + ' 행사'), clientId: doc.clientId || null,
            client: { name: c.name || '', person: c.person || '', tel: c.tel || '' }, start: '', end: '', place: ev.place || '', dateText: ev.date || '',
            baseDocId: doc.id, status: 'active', memo: '', createdAt: doc.createdAt || '', updatedAt: doc.updatedAt || '' };
          d.events.push(e); doc.eventId = e.id;
        }
        e.contract = true; e.contractAt = e.contractAt || doc.updatedAt || '';
        if (!e.baseDocId) e.baseDocId = doc.id;
        doc.status = 'sent';
      } else if (s === 'sent') doc.status = 'sent';
      else if (s === 'cancel') doc.status = 'done';
      else if (s !== 'done') doc.status = 'draft';
    }
    return d;
  }
};

/** 저장할 때 감싸는 봉투 */
export function wrap(data, appVersion, now = new Date().toISOString()) {
  return { app: APP_ID, schema: CURRENT_SCHEMA, appVersion, savedAt: now, data };
}

/**
 * 파일 내용(문자열 또는 객체)을 읽어 현재 형식으로 맞춘다.
 * migrations: { 1: fn(data)→data(형식 2), 2: fn → 형식 3, ... } (앞으로 버전마다 추가)
 * backup: (봉투) => void  — 변환 직전에 원본을 보관하는 함수(기기 안 + PC 폴더)
 * 돌려주는 값: { ok, data, schema, migrated, from, reason }
 */
export function load(raw, { migrations = MIGRATIONS, target = CURRENT_SCHEMA, backup = null } = {}) {
  let env;
  try { env = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch (e) { return { ok: false, reason: 'broken-file' }; }
  if (!env || env.app !== APP_ID || typeof env.schema !== 'number' || !env.data) return { ok: false, reason: 'not-our-file' };
  if (env.schema > target) return { ok: false, reason: 'newer-version', from: env.schema };
  if (env.schema === target) return { ok: true, data: env.data, schema: target, migrated: false, from: env.schema };

  // 변환 전에 원본을 깊은 복사로 백업
  const original = JSON.parse(JSON.stringify(env));
  if (backup) backup(original);
  let data = JSON.parse(JSON.stringify(env.data));
  try {
    for (let s = env.schema; s < target; s++) {
      const step = migrations[s];
      if (typeof step !== 'function') throw new Error('missing step ' + s);
      data = step(data);
    }
  } catch (e) {
    // 실패하면 원본 자료를 그대로 돌려주고, 바뀐 것은 버린다
    return { ok: false, reason: 'migration-failed', detail: String(e && e.message || e), original };
  }
  return { ok: true, data, schema: target, migrated: true, from: env.schema };
}
