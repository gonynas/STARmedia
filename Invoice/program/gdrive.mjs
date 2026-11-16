// 구글 드라이브 연결 (PC ↔ 휴대폰 자료 맞추기)
//  · 같은 구글 계정으로 PC · 휴대폰을 연결하면 드라이브 「01_스타미디어 견적서」 폴더의 자료 한 파일을 같이 쓴다.
//  · 입력하면 몇 초 뒤, 그리고 1분마다 · 화면으로 돌아올 때마다 드라이브와 맞춘다(core/drive.mjs syncOnce, core/sync.mjs 합치기).
//  · 휴대폰 처음 화면: 「구글 드라이브에서 불러오기」 → 사업자 정보를 다시 넣지 않고 바로 쓴다.
//  · 로그인은 구글 공식 로그인 창(Google Identity Services). 토큰은 1시간쯤 가고, 끝나면 「다시 연결」 단추가 나온다.
//  · 연결 상태(폴더 · 파일 id · 지난번 맞춘 자료)는 이 기기 저장소(IndexedDB 'gdrive')에 둔다. 화면 잠금 같은 기기 설정은 맞추지 않는다.
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPE } from './config.mjs';
import { createDrive, syncOnce, peekRemote, DriveError, FOLDER_NAME } from './core/drive.mjs';
import { countData } from './core/sync.mjs';
import { logProblem } from './errors.mjs';

let C;
const TOKEN_KEY = 'starmedia-quote:gtoken';
const G = { st: null, status: 'off', msg: '', busy: false, timer: null, again: false, tokenClient: null, pendingRender: false };
// status: off(연결 안 함) · ok · busy · login(다시 연결 필요) · error · nosetup(클라이언트 ID 없음)
export const driveConfigured = () => !!GOOGLE_CLIENT_ID;
export const driveConnected = () => !!(G.st && G.st.connected);

function token() { try { const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); return t && t.exp > Date.now() + 60000 ? t.token : null; } catch (e) { return null; } }
function saveToken(r) { try { localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 })); } catch (e) {} }
const drive = () => createDrive({ fetch: (u, o) => fetch(u, o), getToken: token });

export async function initDrive(ctx) {
  C = ctx;
  if (!driveConfigured()) { G.status = 'nosetup'; return; }
  try { G.st = await C.S.device.get('gdrive'); } catch (e) { G.st = null; }
  G.status = driveConnected() ? (token() ? 'ok' : 'login') : 'off';
  setInterval(() => { if (document.visibilityState === 'visible') syncSoon(0); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncSoon(0); });
  document.addEventListener('focusout', () => { if (G.pendingRender) setTimeout(renderIfIdle, 300); });
}
async function saveSt() { try { await C.S.device.set('gdrive', G.st); } catch (e) {} }

/* ── 구글 로그인 창 (누른 그 순간에 불러야 팝업이 막히지 않는다) ── */
let gisLoading = null;
function loadGis() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (!gisLoading) gisLoading = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ok; s.onerror = () => no(new Error('구글 로그인 파일을 받지 못했어요(인터넷 확인)')); document.head.appendChild(s); });
  return gisLoading;
}
/** 미리 불러 두기(설정 · 처음 화면이 열릴 때) — 누를 때 바로 창이 뜨게 */
export function preloadGis() { if (driveConfigured()) loadGis().catch(() => {}); }
function login(first) {
  return new Promise((ok, no) => {
    if (!(window.google && window.google.accounts && window.google.accounts.oauth2)) { no(new Error('구글 로그인 준비가 아직 안 됐어요. 잠시 뒤 다시 눌러 주세요')); loadGis().catch(() => {}); return; }
    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID, scope: GOOGLE_SCOPE,
      callback: (r) => { if (r && r.access_token) { saveToken(r); ok(r); } else no(new Error((r && r.error) || '구글 연결을 하지 못했어요')); },
      error_callback: (e) => no(new Error(e && e.type === 'popup_closed' ? '구글 창을 닫았어요' : '구글 창을 열지 못했어요(팝업 차단 확인)'))
    });
    tc.requestAccessToken({ prompt: first ? 'consent' : '' });
  });
}

/* ── 맞추기 ── */
export function syncSoon(ms = 4000) {
  if (!driveConnected() || !token()) { if (driveConnected() && G.status !== 'login') { G.status = 'login'; paint(); } return; }
  clearTimeout(G.timer); G.timer = setTimeout(syncNow, ms);
}
export async function syncNow() {
  if (!driveConnected() || !C.S.data) return;
  if (G.busy) { G.again = true; return; }
  if (!token()) { G.status = 'login'; paint(); return; }
  G.busy = true; G.status = 'busy'; paint();
  try {
    const r = await syncOnce(drive(), G.st, C.S.data, { appVersion: C.appInfo.version, day: today() });
    G.st = { ...r.state, connected: true }; await saveSt();
    if (r.localChanged) { C.replaceData(r.data); await C.saveNow(); renderIfIdle(); }
    G.status = 'ok'; G.msg = '';
  } catch (e) {
    if (e instanceof DriveError && e.code === 'auth') G.status = 'login';
    else { G.status = 'error'; G.msg = String(e && e.message || e); logProblem('구글 드라이브 맞추기 실패', e); }
  }
  G.busy = false; paint();
  if (G.again) { G.again = false; syncSoon(1500); }
}
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
/** 입력 중이면 화면을 다시 그리지 않고, 칸을 벗어나면 그린다 (치던 글자가 사라지지 않게) */
function renderIfIdle() {
  const a = document.activeElement;
  if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && !a.closest('.modal')) { G.pendingRender = true; return; }
  if (document.querySelector('#modal.on')) { G.pendingRender = true; return; }
  G.pendingRender = false; C.render();
}

/* ── 연결 · 불러오기 · 끊기 ── */
async function connect() {
  try {
    await login(!G.st);
    G.status = 'busy'; paint();
    const peek = await peekRemote(drive());
    const local = C.S.data, hasLocal = !!(local && (local.docs.length || local.clients.length || local.items.length || local.me.name));
    const go = async () => {
      if (hasLocal) { await C.saveNow(); await C.S.store.backup('구글연결전_보관'); }
      G.st = { connected: true, folderId: peek.folderId, fileId: peek.fileId || null, version: null, base: null }; await saveSt();
      await syncNow();
      C.render(); C.toast(peek.found ? '구글 드라이브와 연결하고 자료를 맞췄어요' : '구글 드라이브에 「' + FOLDER_NAME + '」 폴더를 만들고 자료를 올렸어요');
    };
    if (peek.found && hasLocal) {
      const a = countData(local), b = countData(peek.data);
      C.openModal({ icon: 'cloud', title: '드라이브에 자료가 이미 있어요', body: '<p>드라이브: 문서 ' + b.docs + ' · 거래처 ' + b.clients + ' · 품목 ' + b.items + '</p><p>이 기기: 문서 ' + a.docs + ' · 거래처 ' + a.clients + ' · 품목 ' + a.items + '</p>' +
        '<p class="note">' + C.ic('check') + '<span>두 자료를 <b>합쳐요</b>(어느 쪽도 지우지 않아요). 합치기 전에 이 기기 자료를 백업해 둬요.</span></p>', ok: '합치고 연결하기', onOk: go });
      G.status = 'off'; paint(); return;
    }
    await go();
  } catch (e) { G.status = driveConnected() ? 'login' : 'off'; paint(); C.toast(String(e && e.message || e)); if (!/닫았어요/.test(String(e && e.message))) logProblem('구글 연결 실패', e); }
}
/** 처음 화면(자료 없음): 드라이브 자료를 바로 불러와 시작 */
async function loadFromDrive() {
  try {
    await login(true);
    const peek = await peekRemote(drive());
    if (!peek.found) {
      C.openModal({ icon: 'cloud', title: '드라이브에 자료가 없어요', body: '<p>이 구글 계정의 드라이브에 「' + FOLDER_NAME + '」 자료가 아직 없어요.</p><p>PC에서 먼저 <b>설정 · 백업 → 구글 드라이브 연결</b>을 해 두었는지, 같은 구글 계정인지 확인해 주세요.</p>', ok: '알겠어요', cancel: false });
      return;
    }
    G.st = { connected: true, folderId: peek.folderId, fileId: peek.fileId, version: peek.version, base: JSON.parse(JSON.stringify(peek.data)) }; await saveSt();
    await C.adoptData(peek.data);
    G.status = 'ok'; paint(); location.hash = '#home';
    C.toast('구글 드라이브 자료를 불러왔어요 · 이제 PC와 자료가 저절로 맞춰져요');
  } catch (e) { C.toast(String(e && e.message || e)); if (!/닫았어요/.test(String(e && e.message))) logProblem('구글 불러오기 실패', e); }
}
async function disconnect() {
  C.openModal({ icon: 'cloud', title: '구글 드라이브 연결을 끊을까요?', body: '<p>이 기기는 더 이상 드라이브와 맞추지 않아요. <b>드라이브와 이 기기의 자료는 지우지 않아요.</b></p>', ok: '연결 끊기',
    onOk: async () => {
      const t = token(); try { if (t && window.google && google.accounts.oauth2.revoke) google.accounts.oauth2.revoke(t, () => {}); } catch (e) {}
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
      G.st = null; await saveSt(); G.status = 'off'; C.render(); C.toast('구글 드라이브 연결을 끊었어요');
    } });
}

/* ── 화면 조각 ── */
const hhmm = (iso) => { if (!iso) return ''; const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
/** 왼쪽 아래 · 휴대폰 위쪽 저장 상태 알약 */
export function drivePill() {
  if (!driveConfigured() || !driveConnected()) return '';
  if (G.status === 'busy') return '<div class="pill busy"><i></i><span>구글 드라이브</span><small>맞추는 중…</small></div>';
  if (G.status === 'login') return '<div class="pill fail"><i></i><span>구글 · 다시 연결</span><button data-act="gd-login">연결</button></div>';
  if (G.status === 'error') return '<div class="pill fail" title="' + C.esc(G.msg) + '"><i></i><span>구글 · 맞추기 실패</span><button data-act="gd-sync">다시</button></div>';
  return '<div class="pill ok"><i></i><span>구글 드라이브</span><small>' + (G.st.lastSync ? hhmm(G.st.lastSync) + ' 맞춤' : '연결됨') + '</small></div>';
}
/** 설정 · 저장 위치의 구글 드라이브 줄 */
export function driveRowHtml() {
  if (!driveConfigured()) return '<li class="gd-row"><b>' + C.ic('google') + '구글 드라이브</b><span>구글 설정 전이에요 · 사용자님 구글 클라우드에서 한 번 설정하면 PC · 휴대폰 자료가 저절로 맞춰져요</span><button class="btn sm" data-act="gd-howto">설정 방법</button></li>';
  if (!driveConnected()) return '<li class="gd-row"><b>' + C.ic('google') + '구글 드라이브</b><span>연결 안 됨 · 연결하면 드라이브 「' + FOLDER_NAME + '」 폴더에 저장 · 백업하고 PC · 휴대폰 자료를 맞춰요</span><button class="btn sm primary" data-act="gd-connect">' + C.ic('google') + '연결</button></li>';
  const s = G.status === 'busy' ? '맞추는 중…' : G.status === 'login' ? '다시 연결이 필요해요(1시간쯤 지나면 구글이 다시 확인해요)' : G.status === 'error' ? '맞추기 실패 · ' + C.esc(G.msg) : (G.st.lastSync ? new Date(G.st.lastSync).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' 맞춤' : '연결됨');
  return '<li class="gd-row"><b>' + C.ic('google') + '구글 드라이브</b><span>' + s + ' · 「' + FOLDER_NAME + '」 · 백업 하루 1개(최근 10개)</span>' +
    (G.status === 'login' ? '<button class="btn sm primary" data-act="gd-login">다시 연결</button>' : '<button class="btn sm" data-act="gd-sync">지금 맞추기</button>') +
    '<button class="btn sm danger-o" data-act="gd-off">연결 끊기</button></li>';
}
/** 처음 화면 선택지 */
export function setupOptionHtml() {
  if (!driveConfigured()) return '';
  return '<button class="opt" data-act="gd-load"><span class="opt-ic">' + C.ic('google') + '</span><b>구글 드라이브에서 불러오기</b><span>PC에서 이미 쓰고 있어요. 같은 구글 계정으로 연결하면 사업자 정보 · 거래처 · 문서를 그대로 가져와요.</span></button>';
}
export function howtoHtml() {
  return '<ol class="x-steps"><li><b>console.cloud.google.com</b>에 사용자님 구글 계정으로 들어가 새 프로젝트를 만들어요.</li><li><b>Google Drive API</b>를 「사용」으로 켜요.</li><li><b>OAuth 동의 화면</b>을 만들고(외부 · 앱 이름 · 이메일), 권한은 <b>drive.file</b>만 넣어요.</li><li><b>사용자 인증 정보 → OAuth 클라이언트 ID → 웹 애플리케이션</b>, 승인된 자바스크립트 원본에 <b>https://gonynas.github.io</b> 를 넣어요.</li><li>만들어진 <b>클라이언트 ID</b>(…apps.googleusercontent.com)를 AI에게 알려 주면 프로그램에 넣어 드려요.</li></ol>' +
    '<p class="note">' + C.ic('alert') + '<span>자세한 단계별 안내는 프로그램 폴더의 <b>GOOGLE_SETUP.md</b>에 있어요. 무료이고 10분쯤 걸려요.</span></p>';
}
function paint() { C.paintStatus(); const box = document.getElementById('gdRow'); if (box) box.outerHTML = '<ul class="savelist" id="gdRow">' + driveRowHtml() + '</ul>'; }

export function driveClick(act) {
  if (!/^gd-/.test(act)) return false;
  if (act === 'gd-connect') connect();
  else if (act === 'gd-load') loadFromDrive();
  else if (act === 'gd-login') login(false).then(() => { G.status = 'ok'; paint(); syncNow(); }).catch((e) => C.toast(String(e && e.message || e)));
  else if (act === 'gd-sync') { if (!token()) login(false).then(() => syncNow()).catch((e) => C.toast(String(e && e.message || e))); else syncNow(); }
  else if (act === 'gd-off') disconnect();
  else if (act === 'gd-howto') C.openModal({ icon: 'google', title: '구글 드라이브 설정 방법 (한 번만)', body: howtoHtml(), ok: '알겠어요', cancel: false, wide: true });
  return true;
}
