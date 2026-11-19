// 구글 드라이브 파일 다루기 + 한 번 맞추기 — 화면 · 구글 로그인 없이(fetch 와 토큰을 받아서) 동작 → node 에서 가짜 드라이브로 시험
// 드라이브 안 모양:
//   01_견적서 발행기/                    (프로그램이 만든 폴더. 권한 drive.file = 이 프로그램이 만든 파일만 보고 고친다)
//                                       예전 이름(01_스타미디어 견적서) 폴더가 있으면 새 이름으로 바꿔서 그대로 쓴다
//     견적서발행기.json                  (자료 한 파일: PC · 휴대폰이 같이 씀)
//     백업/견적서발행기_YYYY-MM-DD.json   (하루 한 번, 최근 10개)
import { wrap, load } from './datafile.mjs?v=mwmxoxka';
import { mergeData, sameData } from './sync.mjs?v=mwmxoxka';

export const FOLDER_NAME = '01_견적서 발행기';
export const OLD_FOLDER_NAMES = ['01_스타미디어 견적서'];   // v1.2.x 에서 쓰던 이름
export const FILE_NAME = '견적서발행기.json';
export const BACKUP_FOLDER = '백업';
export const BACKUP_KEEP = 10;
const API = 'https://www.googleapis.com/drive/v3/files';
const UP = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const META = 'id,name,modifiedTime,version';
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

export class DriveError extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }

/** fetch: 브라우저 fetch (또는 시험용 가짜), getToken: () => 지금 토큰 */
export function createDrive({ fetch, getToken }) {
  async function call(url, opts = {}) {
    const token = getToken(); if (!token) throw new DriveError('auth', '구글 연결이 필요해요');
    const res = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + token, ...(opts.headers || {}) } });
    if (res.status === 401 || res.status === 403) throw new DriveError(res.status === 401 ? 'auth' : 'forbidden', '구글 권한이 없어요 (' + res.status + ')');
    if (!res.ok) throw new DriveError('http', '드라이브 오류 ' + res.status);
    return res;
  }
  const json = async (url, opts) => (await call(url, opts)).json();
  async function find(query) {
    const r = await json(API + '?q=' + encodeURIComponent(query + ' and trashed=false') + '&fields=' + encodeURIComponent('files(' + META + ')') + '&orderBy=modifiedTime%20desc&pageSize=100&spaces=drive');
    return r.files || [];
  }
  async function createFolder(name, parent) {
    return json(API + '?fields=' + META, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: FOLDER_MIME, ...(parent ? { parents: [parent] } : {}) }) });
  }
  async function folder(name, parent) {
    const found = await find('name=' + q(name) + ' and mimeType=' + q(FOLDER_MIME) + (parent ? ' and ' + q(parent) + ' in parents' : ''));
    return found[0] || createFolder(name, parent);
  }
  async function createFile(parent, name, text) {
    const b = 'smq' + Math.random().toString(36).slice(2);
    const body = '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name, parents: [parent], mimeType: 'application/json' }) +
      '\r\n--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + text + '\r\n--' + b + '--';
    return json(UP + '?uploadType=multipart&fields=' + META, { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body });
  }
  /** 우리 폴더: 새 이름 → 없으면 예전 이름 폴더를 새 이름으로 바꿈 → 그것도 없으면 새로 만듦 */
  async function mainFolder() {
    const found = await find('name=' + q(FOLDER_NAME) + ' and mimeType=' + q(FOLDER_MIME));
    if (found[0]) return found[0];
    for (const old of OLD_FOLDER_NAMES) {
      const o = (await find('name=' + q(old) + ' and mimeType=' + q(FOLDER_MIME)))[0];
      if (o) return json(API + '/' + encodeURIComponent(o.id) + '?fields=' + META, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: FOLDER_NAME }) });
    }
    return createFolder(FOLDER_NAME);
  }
  return {
    ensureFolder: mainFolder,
    findFile: async (folderId) => (await find('name=' + q(FILE_NAME) + ' and ' + q(folderId) + ' in parents'))[0] || null,
    meta: (id) => json(API + '/' + encodeURIComponent(id) + '?fields=' + META),
    download: async (id) => (await call(API + '/' + encodeURIComponent(id) + '?alt=media')).text(),
    create: (folderId, text) => createFile(folderId, FILE_NAME, text),
    update: (id, text) => json(UP + '/' + encodeURIComponent(id) + '?uploadType=media&fields=' + META, { method: 'PATCH', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: text }),
    /** 하루 한 번 백업 (같은 날 이미 있으면 건너뜀), 최근 BACKUP_KEEP 개만 남김 */
    async dailyBackup(folderId, text, day) {
      const bk = await folder(BACKUP_FOLDER, folderId);
      const name = FILE_NAME.replace('.json', '_' + day + '.json');
      const all = await find(q(bk.id) + ' in parents and mimeType!=' + q(FOLDER_MIME));
      if (!all.some((f) => f.name === name)) await createFile(bk.id, name, text);
      const list = (await find(q(bk.id) + ' in parents and mimeType!=' + q(FOLDER_MIME))).sort((a, b) => String(b.name).localeCompare(String(a.name)));
      for (const f of list.slice(BACKUP_KEEP)) await call(API + '/' + encodeURIComponent(f.id), { method: 'DELETE' });
      return name;
    }
  };
}

/**
 * 한 번 맞추기.
 * state: { folderId, fileId, version, base(지난번에 맞춘 자료 or null) }  ← 이 기기에 보관
 * local: 이 기기 자료, appVersion, day(YYYY-MM-DD), migrations
 * 돌려주는 값: { data(맞춘 자료), localChanged, uploaded, state(새 상태), remoteFound }
 */
export async function syncOnce(drive, state, local, { appVersion = '1.0.0', day = new Date().toISOString().slice(0, 10), migrations, now = new Date().toISOString() } = {}) {
  const st = { ...state };
  if (!st.folderId) st.folderId = (await drive.ensureFolder()).id;
  let meta = st.fileId ? await drive.meta(st.fileId).catch((e) => { if (e.code === 'http') return null; throw e; }) : null;
  if (!meta) { meta = await drive.findFile(st.folderId); st.fileId = meta ? meta.id : null; }
  let remote = null;
  if (meta && (String(meta.version) !== String(st.version) || !st.base)) {
    const r = load(await drive.download(meta.id), migrations ? { migrations } : {});
    if (r.ok) remote = r.data;
    else if (r.reason === 'newer-version') throw new DriveError('newer', '드라이브 자료가 더 새 버전 프로그램에서 저장됐어요. 새로 고침해 주세요');
  }
  const data = remote ? mergeData(st.base, local, remote) : (local || null);
  const localChanged = !!(local && data && !sameData(data, local)) || (!local && !!data);
  // 올릴지: 드라이브에 파일이 없음 · 방금 받은 드라이브 자료와 다름 · (드라이브가 그대로일 때) 지난번 맞춘 뒤 이 기기에서 바뀜
  const remoteNow = remote || st.base;
  const needUpload = !!data && (!meta || !remoteNow || !sameData(data, remoteNow));
  let uploaded = false;
  if (needUpload) {
    const text = JSON.stringify(wrap(data, appVersion, now));
    meta = meta ? await drive.update(meta.id, text) : await drive.create(st.folderId, text);
    st.fileId = meta.id; uploaded = true;
    try { await drive.dailyBackup(st.folderId, text, day); } catch (e) { /* 백업 실패는 맞추기를 막지 않는다 */ }
  }
  if (meta) st.version = meta.version;
  st.base = data ? JSON.parse(JSON.stringify(data)) : st.base;
  st.lastSync = now;
  return { data, localChanged, uploaded, state: st, remoteFound: !!remote };
}

/** 휴대폰 처음: 드라이브에 자료가 있는지만 보기 (불러오기 전에 확인 창에 보여 줄 것) */
export async function peekRemote(drive) {
  const f = await drive.ensureFolder(); const meta = await drive.findFile(f.id);
  if (!meta) return { folderId: f.id, found: false };
  const r = load(await drive.download(meta.id));
  return { folderId: f.id, fileId: meta.id, version: meta.version, found: r.ok, data: r.ok ? r.data : null, savedAt: meta.modifiedTime, reason: r.reason };
}
