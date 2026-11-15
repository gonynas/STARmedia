// 스타미디어 견적서 발행기 — 프로그램의 중심 (처음 읽을 파일)
// 하는 일: 자료 불러오기 · 자동 저장 · 화면 틀(메뉴) · 주소(#home 등)에 맞는 화면 고르기 · 누르기/입력을 각 화면 파일로 넘기기
// 직접 그리는 화면: 처음 실행 · 홈 · 내 정보 · 거래처. 나머지 화면은 각자 파일(아래 import)에 있다.
// 계산 · 저장 규칙은 core/ (node 시험 통과한 것)을 그대로 쓴다. 전체 지도는 app/AGENTS.md.
import { createStore, idbAdapter, folderAdapter, pickLatest } from './core/storage.mjs';
import { emptyData, load } from './core/datafile.mjs';
import { ic } from './icons.mjs';
import { initItems, itemsPage, itemsClick, itemsInput, itemsBlur } from './items.mjs';
import { initEditor, editorPage, editorClick, editorInput, editorChange, editorBlur, editorSeg, editorAfterRender, homeRecentHtml, listPage, listInput, curDoc } from './editor.mjs';
import { docNo, DOC_TYPES } from './core/docs.mjs';
import { processStamp } from './stamp.mjs';
import { initEvents, eventListPage, eventPage, eventsClick, eventsInput, curEvent } from './events.mjs';
import { stampImg } from './docview.mjs';
import { initExport, exportClick } from './export.mjs';
import { initMoney, moneyPage, moneyClick, homeTodoHtml, homeMoneyHtml } from './money.mjs';
import { initCalendar, calendarPage, calendarClick } from './calendar.mjs';
import { initEquip, equipPage, equipClick, equipInput, equipChange } from './equip.mjs';
import { initTrash, trashPage, trashClick } from './trash.mjs';
import { initSettings, settingsPage, settingsAfterRender, settingsClick, settingsInput, settingsChange } from './settings.mjs';
import { initLock, lockNow, lockOnBoot, hasLock } from './lockscreen.mjs';
import { logProblem } from './errors.mjs';
import { purgeTrash } from './core/reports.mjs';

const APP_VERSION = '0.0.0';   // 빌드할 때 package.json 의 version 으로 바뀐다
const APP_BUILD = 'dev';       // 빌드할 때 빌드 번호로 바뀐다 (설정 → 업데이트 확인에 씀)
const HAS_FOLDER = typeof window.showDirectoryPicker === 'function';
const DEVICE = '이 기기', FOLDER = 'PC 폴더';

const S = {
  data: null,
  route: 'home',
  device: idbAdapter('starmedia-quote'),
  targets: [],
  store: null,
  folder: { handle: null, state: HAS_FOLDER ? 'none' : 'unsupported' },   // none · connected · needs-permission · unsupported
  saving: false, dirty: false, timer: null, lastError: null,
  clientQuery: '',
  itemCat: '', itemQuery: '',
  docId: null, eventId: null, eventQuery: '', edStep: 1, listType: '', listQuery: '', agreedOpen: null, hash: '',
  bootProblem: null,
  moneyYear: null, calYm: null, calDay: null, equipDay: null, equipCat: '', trashKind: ''
};
S.targets = [S.device];
S.store = createStore(S.targets, { appVersion: APP_VERSION });

/* ── 작은 도구 ── */
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const hhmm = (iso) => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const dateKo = (iso) => { const d = new Date(iso); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + hhmm(iso); };
const todayKo = () => { const d = new Date(); return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + '일월화수목금토'[d.getDay()] + '요일'; };

function toast(msg, action) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? ' <button class="toast-act" id="toastAct">' + esc(action.label) + '</button>' : '');
  t.style.pointerEvents = action ? 'auto' : '';
  t.classList.add('on'); clearTimeout(toast._t);
  if (action) $('#toastAct').onclick = () => { t.classList.remove('on'); action.fn(); };
  toast._t = setTimeout(() => t.classList.remove('on'), action ? 6000 : 2400);
}

/* ── 확인 창 ── */
const MODAL = { onOk: null };
function modalHtml() {
  return '<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="modal-card">' +
    '<div class="modal-h"><span class="modal-ic" id="mIcon"></span><h3 id="mTitle"></h3></div>' +
    '<div class="modal-body" id="mBody"></div>' +
    '<div class="modal-act"><button class="btn big ghost" data-modal="cancel" id="mCancel">취소</button><button class="btn big primary" data-modal="ok" id="mOk">확인</button></div>' +
    '</div></div>';
}
function openModal(o) {
  const m = $('#modal'); if (!m) return;
  MODAL.onOk = o.onOk || null; MODAL.onCancel = o.onCancel || null;
  m.className = 'modal on ' + (o.tone || 'primary') + (o.wide ? ' wide' : '');
  $('#mIcon').innerHTML = ic(o.icon || 'alert');
  $('#mTitle').textContent = o.title;
  $('#mBody').innerHTML = o.body || '';
  const ok = $('#mOk'), cc = $('#mCancel');
  ok.textContent = o.ok || '확인';
  ok.className = 'btn big ' + (o.tone === 'danger' ? 'danger' : 'primary');
  cc.textContent = o.cancel || '취소';
  cc.style.display = o.cancel === false ? 'none' : '';
  setTimeout(() => { const f = m.querySelector('.modal-body input, .modal-body textarea'); (f || ok).focus(); }, 30);
}
function closeModal() { const m = $('#modal'); if (m) m.className = 'modal'; MODAL.onOk = null; MODAL.onCancel = null; }
async function modalOk() {
  const fn = MODAL.onOk; const keep = fn ? await fn() : undefined;
  if (keep !== false && MODAL.onOk === fn) closeModal();
}

/* ── 자동 저장 ── */
function changed() {
  S.dirty = true;
  clearTimeout(S.timer);
  S.timer = setTimeout(saveNow, 700);
  paintStatus('busy');
}
async function saveNow() {
  clearTimeout(S.timer);
  if (!S.data) return;
  if (S.saving) { S.dirty = true; return; }
  S.saving = true; S.dirty = false;
  try { await S.store.save(S.data); }
  catch (e) { S.lastError = String(e && e.message || e); logProblem('저장 실패', e); }
  S.saving = false;
  paintStatus();
  if (S.dirty) saveNow();
}

function pillHtml(name) {
  const st = S.store.status[name];
  if (name === FOLDER) {
    if (S.folder.state === 'unsupported') return '';
    if (S.folder.state === 'none') return '<div class="pill"><i></i><span>PC 폴더 · 연결 안 됨</span><button data-act="folder-connect">연결</button></div>';
    if (S.folder.state === 'needs-permission') return '<div class="pill fail"><i></i><span>PC 폴더 · 허락 필요</span><button data-act="folder-permit">다시 연결</button></div>';
  }
  if (S.saving || S.dirty) return '<div class="pill busy" title="' + name + ' 저장 중"><i></i><span>' + name + '</span><small>저장 중…</small></div>';
  if (!st) return '<div class="pill ok" title="' + name + '"><i></i><span>' + name + '</span><small>준비됨</small></div>';
  if (st.ok) return '<div class="pill ok" title="' + name + ' ' + hhmm(st.at) + ' 저장됨"><i></i><span>' + name + '</span><small>' + hhmm(st.at) + ' 저장됨</small></div>';
  return '<div class="pill fail" title="' + name + ' 저장 실패"><i></i><span>' + name + ' · 저장 안 됨</span><button data-act="retry">다시 시도</button></div>';
}
function statusHtml() { return pillHtml(DEVICE) + pillHtml(FOLDER); }
function paintStatus() {
  document.querySelectorAll('[data-status]').forEach((el) => { el.innerHTML = statusHtml(); });
  const h = $('#homeSave'); if (h) h.innerHTML = homeSaveRows();
}

/* ── PC 폴더 ── */
async function readFolderFiles(handle) {
  const ad = folderAdapter(handle);
  const files = {};
  for (const k of await ad.keys()) { const t = await ad.get(k); if (t) files[k] = t; }
  return files;
}
const keyLabel = (k) => (k === 'main' ? '견적서발행기.json' : k === 'daycopy' ? '견적서발행기_하루전.json (하루 전 사본)' : '백업 ' + k.slice(7));

async function attachFolder(handle) {
  S.folder.handle = handle; S.folder.state = 'connected';
  if (!S.targets.some((t) => t.name === FOLDER)) S.targets.push(folderAdapter(handle));
  try { await S.device.set('folderHandle', handle); } catch (e) { /* 저장 못 해도 이번에는 씀 */ }
}

async function pickFolder() {
  try { return await window.showDirectoryPicker({ id: 'starmedia-quote', mode: 'readwrite', startIn: 'documents' }); }
  catch (e) { return null; }   // 취소
}

const summary = (d) => '문서 ' + (d.docs || []).length + '개 · 거래처 ' + (d.clients || []).length + '곳' + (d.me && d.me.name ? ' · ' + esc(d.me.name.split('\n')[0]) : '');

/** 지금 자료가 있는 상태에서 폴더를 연결: 폴더에 다른 자료가 있으면 보관(백업)한 뒤 지금 자료로 저장 */
async function connectFolderKeepCurrent(handle) {
  const files = await readFolderFiles(handle);
  if (files.main) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', '-');
    try { await folderAdapter(handle).set('backup:' + stamp + '_연결전_보관', files.main); } catch (e) { /* 보관 실패 시 연결하지 않음 */ toast('폴더에 쓸 수 없어요. 다른 폴더를 골라 주세요'); return false; }
  }
  await attachFolder(handle);
  await saveNow();
  render();
  toast(files.main ? 'PC 폴더 연결 · 폴더에 있던 자료는 백업 폴더에 보관했어요' : 'PC 폴더를 연결했어요. 이제 폴더에도 저절로 저장돼요');
  return true;
}

async function onFolderConnect() {
  const handle = await pickFolder(); if (!handle) return;
  const files = await readFolderFiles(handle);
  const found = pickLatest(files);
  if (found && S.data) {
    openModal({
      icon: 'cloud', title: '이 폴더에 자료가 이미 있어요',
      body: '<p>폴더 자료: <b>' + dateKo(found.savedAt) + '</b> 저장 · ' + summary(found.data) + '</p><p>지금 자료: ' + summary(S.data) + '</p>' +
        '<p class="note">' + ic('check') + '<span>어느 쪽을 골라도 다른 쪽은 백업으로 남아요.</span></p>',
      ok: '폴더 자료 불러오기', cancel: '지금 자료로 계속',
      onOk: () => adoptFound(handle, found),
      onCancel: () => connectFolderKeepCurrent(handle)
    });
    return;
  }
  await connectFolderKeepCurrent(handle);
}

async function onFolderPermit() {
  const h = S.folder.handle; if (!h) return onFolderConnect();
  let p = 'denied';
  try { p = await h.requestPermission({ mode: 'readwrite' }); } catch (e) {}
  if (p === 'granted') { await attachFolder(h); await saveNow(); render(); toast('PC 폴더에 다시 연결했어요'); }
  else toast('허락하지 않아 PC 폴더에는 저장하지 않아요. 이 기기에는 저장돼요');
}

/** 폴더에서 찾은 자료를 지금 자료로: 지금 자료가 있으면 먼저 백업 */
async function adoptFound(handle, found) {
  if (S.data) { await saveNow(); await S.store.backup('불러오기전_보관'); }
  S.data = normalize(found.data); applyBigText();
  if (handle) await attachFolder(handle);
  await saveNow();
  location.hash = '#home'; render();
  toast(dateKo(found.savedAt) + ' 자료를 불러왔어요' + (found.migrated ? ' (새 버전 형식으로 바꿨어요)' : ''));
}

async function onFindInFolder() {
  const handle = await pickFolder(); if (!handle) return;
  const files = await readFolderFiles(handle);
  const found = pickLatest(files);
  if (!found) {
    openModal({
      icon: 'alert', title: '이 폴더에서 자료를 찾지 못했어요',
      body: '<p>「견적서발행기.json」 파일이 있는 폴더를 골라 주세요. (예: D:\\견적서발행기)</p><p>처음 쓰는 거라면 이 폴더로 새로 시작할 수 있어요.</p>',
      ok: '이 폴더로 새로 시작', cancel: '다시 고르기',
      onOk: () => startFresh(handle)
    });
    return;
  }
  openModal({
    icon: 'cloud', title: '자료를 찾았어요',
    body: '<p><b>' + dateKo(found.savedAt) + '</b>에 저장된 자료예요.</p><p>' + summary(found.data) + '</p><p class="note">' + ic('fileText') + '<span>' + esc(keyLabel(found.name)) + '</span></p>',
    ok: '이 자료 불러오기', cancel: '취소',
    onOk: () => adoptFound(handle, found)
  });
}

/** 폴더 기능이 없는 기기(아이폰 등): 자료 파일 하나를 골라 불러오기 */
function onImportFile() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const text = await f.text();
    const found = pickLatest({ [f.name]: text });
    if (!found) { const r = load(text); toast(r.reason === 'newer-version' ? '더 새 버전에서 저장한 파일이에요. 프로그램을 새로 고침해 주세요' : '견적서 발행기 자료 파일이 아니에요'); return; }
    openModal({ icon: 'cloud', title: '자료를 찾았어요', body: '<p><b>' + dateKo(found.savedAt) + '</b> 저장 · ' + summary(found.data) + '</p>', ok: '이 자료 불러오기', onOk: () => adoptFound(null, found) });
  };
  inp.click();
}

async function startFresh(handle) {
  if (S.bootProblem) await S.store.backup('깨진자료_보관');
  S.data = emptyData(); S.bootProblem = null;
  if (handle) await connectFolderKeepCurrent(handle);
  await saveNow();
  location.hash = '#me'; render();
  if (!handle && HAS_FOLDER) {
    openModal({
      icon: 'cloud', title: 'PC 폴더에도 같이 저장할까요?',
      body: '<p>이 기기 말고 PC 폴더(예: <b>D:\\견적서발행기</b>)에도 저절로 저장해 두면, 노트북을 바꾸거나 브라우저 기록을 지워도 버튼 한 번으로 다시 불러올 수 있어요.</p><p class="note">' + ic('star') + '<span>추천: 폴더를 정해 두세요</span></p>',
      ok: '폴더 고르기', cancel: '나중에',
      onOk: async () => { const h = await pickFolder(); if (h) await connectFolderKeepCurrent(h); }
    });
  } else toast('새로 시작했어요. 먼저 내 정보를 넣어 주세요');
}

/* ── 화면: 처음 실행 ── */
function setupScreen() {
  const p = S.bootProblem;
  const warn = p ? '<p class="note" style="justify-content:center;color:#9B1C1C">' + ic('alert') + '<span>' +
    (p === 'newer-version' ? '더 새 버전에서 저장한 자료라 열지 않았어요. 화면을 새로 고침(업데이트)해 주세요.' : '저장된 자료를 읽지 못했어요. PC 폴더에서 자료를 찾아 주세요. (지금 자료는 지우지 않고 보관해요)') + '</span></p>' : '';
  const find = HAS_FOLDER
    ? '<button class="opt" data-act="find-folder"><span class="opt-ic">' + ic('download') + '</span><b>PC 폴더에서 자료 찾기</b><span>예전에 쓰던 자료가 있어요. 「견적서발행기」 폴더를 고르면 가장 최근 자료를 불러와요.</span></button>'
    : '<button class="opt" data-act="import-file"><span class="opt-ic">' + ic('download') + '</span><b>자료 파일 불러오기</b><span>예전에 쓰던 「견적서발행기.json」 파일을 골라 불러와요.</span></button>';
  return '<div class="setup"><div class="setup-card">' +
    '<div class="setup-head"><img src="assets/starmedia-logo.png" alt="스타미디어 기획사"><h1>견적서 발행기</h1><p>어떻게 시작할까요?</p></div>' + warn +
    '<div class="setup-opts">' +
    '<button class="opt primary" data-act="start-fresh"><span class="opt-ic">' + ic('plus') + '</span><b>처음 시작하기</b><span>처음 써요. 내 정보부터 넣고 시작해요.</span></button>' + find +
    '</div>' +
    '<p class="setup-note">자료는 이 기기에 저절로 저장되고, PC 폴더를 정하면 폴더에도 함께 저장돼요.</p>' +
    '</div></div>' + creditHtml();
}

/* ── 화면 틀 ── */
const NAV = [
  ['home', '홈', 'home', true], ['list', '발행 목록', 'list', true], ['event', '행사 · 입금', 'won', true], ['clients', '거래처', 'users', true],
  ['items', '품목 · 세트', 'layers', true], ['equip', '장비 관리', 'tent', true], ['money', '매출 · 미수금', 'chart', true],
  ['cal', '행사 달력', 'calendar', true], ['trash', '휴지통', 'trash', true], ['me', '내 정보 · 도장', 'user', true], ['set', '설정 · 백업', 'sliders', true]
];
const TITLES = {
  home: ['안녕하세요, 대표님', todayKo],
  me: ['내 정보 · 도장', () => '여기 넣은 정보가 모든 문서의 「보내는 곳」에 들어가요'],
  clients: ['거래처', () => '문서를 받을 곳을 등록해 두면 문서 만들 때 골라 쓸 수 있어요'],
  items: ['품목 · 세트', () => '자주 쓰는 품목과 기본 단가를 넣어 두면 문서 만들 때 골라 쓸 수 있어요'],
  event: ['행사 · 입금', () => '행사 한 건에 묶인 문서 · 입금 · 잔금 · 영수증을 한곳에서 봐요'],
  event1: [() => { const e = curEvent(); return e ? e.name : '행사'; }, () => '행사 · 입금 · 계약 기준 문서 한 장으로 돈을 셈해요'],
  list: ['발행 목록', () => '만든 문서를 찾고, 열고, 복사해서 새로 만들어요'],
  equip: ['장비 관리', () => '장비마다 총 수량과 그날 나가는 수량 · 부족한 개수를 봐요'],
  money: ['매출 · 미수금', () => '달마다 · 거래처마다 매출과 아직 못 받은 돈을 봐요'],
  cal: ['행사 달력', () => '행사 날짜와 그날 나가는 장비를 달력으로 봐요'],
  trash: ['휴지통', () => '지운 것을 30일 동안 보관해요. 그 안에는 되살릴 수 있어요'],
  set: ['설정 · 백업', () => '문서 기본값 · 잠금 · 저장 위치 · 백업 · 문제 기록'],
  doc: [() => { const d = curDoc(); return d ? DOC_TYPES[d.type].label + ' 작성' : '문서 작성'; }, () => { const d = curDoc(); return d ? docNo(d) + ' · 입력하면 저절로 저장돼요' : ''; }]
};
function creditHtml() { return '<footer class="credit"><img src="assets/gonynas-logo.jpg" alt=""><span>Developed by <b>GONYNAS</b>ㆍv' + APP_VERSION + '</span></footer>'; }

function shell(body) {
  const nav = NAV.map(([k, label, icon, ready]) =>
    '<a href="' + (ready ? '#' + k : '#') + '" class="' + (k === S.route || (k === 'event' && S.route === 'event1') ? 'on' : '') + (ready ? '' : ' soon') + '"' + (ready ? '' : ' data-soon="' + label + '"') + (k === S.route || (k === 'event' && S.route === 'event1') ? ' aria-current="page"' : '') + '><span class="nchip">' + ic(icon) + '</span><span class="lbl">' + label + '</span>' +
    (k === 'clients' && S.data.clients.length ? '<em class="cnt">' + S.data.clients.length + '</em>' : '') +
    (k === 'items' && S.data.items.length ? '<em class="cnt">' + S.data.items.length + '</em>' : '') + '</a>').join('');
  const [h1t, sub] = TITLES[S.route];
  const h1 = typeof h1t === 'function' ? h1t() : h1t;
  const back = S.route === 'home' ? '' : '<a class="back" href="' + (S.route === 'doc' ? (curDoc() && curDoc().eventId ? '#event/' + curDoc().eventId : '#list') : S.route === 'event1' ? '#event' : '#home') + '" aria-label="' + (S.route === 'doc' ? '발행 목록으로' : '홈으로') + '">' + ic('left') + '</a>';
  const inMore = !['home', 'clients', 'list', 'doc'].includes(S.route);
  const bnav = [['home', '홈', 'home'], ['new', '새 문서', 'plus'], ['list', '목록', 'list'], ['clients', '거래처', 'users'], ['more', '더보기', 'grid']].map(([k, l, i]) => {
    const on = k === S.route || (k === 'list' && S.route === 'doc') || (k === 'more' && inMore);
    return '<a href="' + (k === 'more' || k === 'new' ? '#' : '#' + k) + '" class="' + (on ? 'on ' : '') + (k === 'new' ? 'bnew' : '') + '"' + (k === 'new' ? ' data-act="doc-new" data-type="quote"' : '') + (k === 'more' ? ' data-act="more" aria-haspopup="dialog"' : '') + '><span class="bi">' + ic(i) + '</span><span>' + l + '</span></a>';
  }).join('');
  const sheet = '<div class="sheet" id="moreSheet" role="dialog" aria-label="더보기 메뉴"><div class="sheet-card"><div class="sheet-h"><b>더보기</b><button class="icbtn" data-act="more" aria-label="닫기">' + ic('x') + '</button></div><div class="sheet-grid">' +
    NAV.filter(([k]) => k !== 'home' && k !== 'clients' && k !== 'list').map(([k, label, icon, ready]) =>
      '<a href="' + (ready ? '#' + k : '#') + '" class="' + (k === S.route || (k === 'event' && S.route === 'event1') ? 'on' : '') + (ready ? '' : ' soon') + '"' + (ready ? '' : ' data-soon="' + label + '"') + '><span class="bi">' + ic(icon) + '</span><span>' + label + (ready ? '' : '<small>준비 중</small>') + '</span></a>').join('') +
    '</div></div></div>';
  return '<div class="app" data-page="' + S.route + '">' +
    '<aside class="side"><div class="side-logo"><img class="full" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><img class="mark" src="assets/star-icon.svg" alt=""></div>' +
    '<a href="#" class="side-new" data-act="doc-new" data-type="quote">' + ic('plus') + '<span class="lbl">새 문서 만들기</span></a>' +
    '<nav class="nav">' + nav + '</nav>' +
    '<div class="side-bottom"><div class="savepills" data-status aria-live="polite">' + statusHtml() + '</div>' +
    '<button type="button" class="lockbtn" data-act="lock-now">' + ic('lock') + '<span class="lbl">' + (hasLock() ? '화면 잠금' : '화면 잠금 정하기') + '</span></button></div></aside>' +
    '<div class="main"><header class="top"><img class="top-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><div class="top-title">' + back + '<div><h1>' + h1 + '</h1><p>' + sub() + '</p></div></div></header>' +
    '<main class="page"><div class="mstatus" data-status>' + statusHtml() + '</div>' + body + '</main>' + creditHtml() + '</div>' +
    '<nav class="bnav">' + bnav + '</nav>' + sheet + '</div>';
}

/* ── 홈 ── */
function homeSaveRows() {
  const rows = [DEVICE, FOLDER].map((n) => {
    if (n === FOLDER && S.folder.state === 'unsupported') return '<li><b>PC 폴더</b><span>이 기기(브라우저)에서는 쓸 수 없어요</span></li>';
    if (n === FOLDER && S.folder.state !== 'connected') return '<li><b>PC 폴더</b><span>' + (S.folder.state === 'none' ? '아직 연결 안 됨' : '허락이 필요해요') + '</span><button class="btn sm" data-act="' + (S.folder.state === 'none' ? 'folder-connect' : 'folder-permit') + '">' + (S.folder.state === 'none' ? '폴더 연결' : '다시 연결') + '</button></li>';
    const st = S.store.status[n];
    return '<li><b>' + n + '</b><span>' + (!st ? '준비됨' : st.ok ? dateKo(st.at) + ' 저장됨' : '저장 안 됨') + '</span>' + (st && !st.ok ? '<button class="btn sm" data-act="retry">다시 시도</button>' : '') + '</li>';
  }).join('');
  return '<ul class="savelist">' + rows + '</ul>';
}
function homePage() {
  const d = S.data;
  const tiles = [['quote', '견적서', 'fileText', '행사 견적 보내기'], ['stmt', '거래명세서', 'clipboard', '물품 건넬 때 · A4에 2부'], ['inv', '납품ㆍ청구서', 'truck', '납품 후 대금 청구'], ['rcpt', '영수증', 'receipt', '완납 뒤 확인증']]
    .map(([k, l, i, s]) => '<a class="tile t-' + k + '" href="#" data-act="doc-new" data-type="' + k + '"><span class="tile-ic">' + ic(i) + '</span><b>' + l + '</b><small>' + s + '</small><span class="tile-go">' + ic('arrowRight') + '</span></a>').join('');
  const meOk = !!(d.me.name && d.me.bizNo);
  const steps = [
    [meOk, '내 정보 넣기', '상호 · 사업자번호 · 계좌', '#me'],
    [S.folder.state === 'connected' || S.folder.state === 'unsupported', 'PC 폴더 정하기', S.folder.state === 'unsupported' ? '이 기기에서는 건너뛰어요' : '예: D:\\견적서발행기', 'folder'],
    [d.clients.length > 0, '거래처 등록하기', d.clients.length ? d.clients.length + '곳 등록됨' : '자주 거래하는 곳부터', '#clients'],
    [d.items.length > 0, '품목 · 단가 넣기', d.items.length ? '품목 ' + d.items.length + '개 · 세트 ' + d.sets.length + '개' : '엑셀에서 붙여넣기로 한 번에', '#items']
  ];
  const stepHtml = steps.map(([done, t, s, go], i) =>
    '<li class="' + (done ? 'done' : '') + '"><span class="snum">' + (done ? ic('check') : i + 1) + '</span><span class="stx"><b>' + t + '</b><small>' + s + '</small></span>' +
    (done ? '<em>완료</em>' : go === 'folder' ? '<button class="btn sm primary" data-act="folder-connect">하기</button>' : '<a class="btn sm primary" href="' + go + '">하기</a>') + '</li>').join('');
  return '<div class="home">' +
    '<section class="card c-new"><div class="card-h"><h2>새 문서 만들기</h2><span class="hint">영수증은 행사 · 입금에서 완납했을 때 만들어요</span></div><div class="tiles">' + tiles + '</div></section>' + homeRecentHtml() +
    homeTodoHtml() + homeMoneyHtml() +
    '<section class="card h-half"><div class="card-h"><h2>' + ic('check') + '시작 준비</h2><span class="hint">한 번만 하면 돼요</span></div><ol class="steps3">' + stepHtml + '</ol></section>' +
    '<section class="card h-half"><div class="card-h"><h2>' + ic('cloud') + '저장 상태</h2><span class="hint">입력하면 저절로 저장돼요</span></div><div id="homeSave">' + homeSaveRows() + '</div>' +
    '<div class="form-actions"><button class="btn" data-act="backup-now">' + ic('copy') + '지금 백업 만들기</button></div></section>' +
    '</div>';
}

/* ── 내 정보 ── */
function meField(label, key, extra = '', cls = '') {
  return '<label class="fld ' + cls + '"><span>' + label + '</span><input class="in" data-me="' + key + '" value="' + esc(S.data.me[key]) + '"' + extra + '></label>';
}
function supPreview() {
  const m = S.data.me, v = (x) => (x ? esc(x) : '<span style="color:#9AA3B2">-</span>');
  return '<table class="pv-sup"><tbody>' +
    '<tr><th>등록번호</th><td colspan="3">' + v(m.bizNo) + '</td></tr>' +
    '<tr><th>상호</th><td class="nm">' + (m.name ? nl2br(m.name) : v('')) + '</td><th style="width:56px">대표</th><td class="stamp-cell">' + v(m.ceo) + ' <span class="in-s">(인)</span>' + stampImg(m, 'stamp pv-stamp') + '</td></tr>' +
    '<tr><th>주소</th><td colspan="3">' + v(m.addr) + '</td></tr>' +
    '<tr><th>업태</th><td>' + v(m.bizType) + '</td><th style="width:56px">종목</th><td>' + v(m.bizItem) + '</td></tr>' +
    '<tr><th>전화</th><td colspan="3">' + v(m.tel) + (m.fax ? ' · 팩스 ' + esc(m.fax) : '') + '</td></tr>' +
    '<tr><th>입금 계좌</th><td colspan="3">' + (m.bankName || m.bankNo ? esc([m.bankName, m.bankNo, m.holder && '예금주 ' + m.holder].filter(Boolean).join(' ')) : v('')) + '</td></tr>' +
    '</tbody></table>';
}
function mePage() {
  const m = S.data.me;
  return '<div class="mepage"><div class="me-form">' +
    '<section class="card"><div class="card-h"><h2>' + ic('building') + '사업자 정보</h2><span class="hint">처음 한 번만 넣으면 돼요</span></div><div class="fgrid">' +
    '<label class="fld span2"><span>상호 (업체명) <em class="tag2">최대 2줄</em></span>' +
    '<textarea class="in ta2" data-me="name" rows="2" aria-describedby="nmHint" placeholder="스타미디어&#10;(STARmedia)">' + esc(m.name) + '</textarea>' +
    '<small id="nmHint" class="fhint">' + ic('check') + '<span><b>엔터</b>를 누르면 다음 줄로 넘어가요. 예: 스타미디어 ↵ (STARmedia)</span></small></label>' +
    meField('대표자', 'ceo') + meField('사업자등록번호', 'bizNo', ' inputmode="numeric" placeholder="000-00-00000"') +
    meField('주소', 'addr', '', 'span2') +
    meField('업태', 'bizType') + meField('종목', 'bizItem') + meField('전화', 'tel', ' inputmode="tel"') + meField('팩스', 'fax', ' inputmode="tel"') +
    '</div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('bank') + '입금 계좌</h2><span class="hint">견적서 특이사항과 납품ㆍ청구서에 들어가요</span></div><div class="fgrid three">' +
    meField('은행', 'bankName') + meField('계좌번호', 'bankNo', ' inputmode="numeric"') + meField('예금주', 'holder') +
    '</div></section>' +
    stampCard() +
    '</div>' +
    '<aside class="card me-pv"><div class="card-h"><h2>' + ic('eye') + '문서에 이렇게 보여요</h2></div><div id="meSample">' + supPreview() + '</div>' +
    '<p class="note" style="margin-top:12px">' + ic('fileText') + '<span>견적서 · 거래명세서 · 납품ㆍ청구서 · 영수증에 똑같이 들어가요.</span></p></aside>' +
    '</div>';
}
function stampCard() {
  const m = S.data.me;
  return '<section class="card"><div class="card-h"><h2>' + ic('user') + '도장</h2><span class="hint">문서의 대표자 (인) 자리에 찍혀요</span></div>' +
    '<div class="stamp-row"><div class="stamp-box" id="stampBox">' + (m.stamp ? '<img src="' + m.stamp + '" alt="등록한 도장">' : '<span>도장 없음</span>') + '</div>' +
    '<div class="stamp-side"><div class="stamp-btns"><button type="button" class="btn primary" data-act="stamp-pick">' + ic('upload') + (m.stamp ? '다른 사진으로 바꾸기' : '도장 사진 넣기') + '</button>' +
    (m.stamp ? '<button type="button" class="btn danger-o" data-act="stamp-del">' + ic('trash') + '지우기</button>' : '') + '</div>' +
    '<label class="chkrow"><input type="checkbox" id="stampBg" checked><span><b>흰 배경 자동 지우기</b> — 흰 종이에 찍어 사진을 찍은 경우(JPG). 이미 투명한 PNG는 그대로 써요.</span></label>' +
    (m.stamp ? '<label class="fld"><span>문서에 찍히는 크기 <b id="stampSzTxt">' + (m.stampSize || 54) + 'px</b></span><input type="range" min="36" max="80" step="2" id="stampSize" value="' + (m.stampSize || 54) + '"></label>' : '') +
    '</div></div></section>';
}
async function pickStamp() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const bg = $('#stampBg') ? $('#stampBg').checked : true;
    try {
      const r = await processStamp(f, bg);
      S.data.me.stamp = r.dataUrl; if (!S.data.me.stampSize) S.data.me.stampSize = 54;
      changed(); render();
      toast(r.keptAlpha ? '투명 PNG 도장을 그대로 넣었어요' : r.cleared ? '흰 배경을 지우고 도장을 넣었어요' : '도장을 넣었어요');
    } catch (e) { toast(String(e && e.message || '도장 사진을 읽지 못했어요')); }
  };
  inp.click();
}
const fmtBiz = (s) => { const d = String(s).replace(/\D/g, ''); return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5) : s; };

/* ── 거래처 ── */
const CF = [['name', '상호 (업체명)', true], ['person', '담당자'], ['tel', '연락처', false, 'tel'], ['email', '이메일', false, 'email'], ['bizNo', '사업자등록번호', false, 'numeric'], ['addr', '주소'], ['memo', '메모']];
function clientRow(c) {
  const sub = [c.person, c.tel].filter(Boolean).map(esc).join(' · ') || '<span style="color:#9AA3B2">담당자 · 연락처 없음</span>';
  return '<div class="crow" data-id="' + c.id + '"><span class="cn"><b>' + esc(c.name) + '</b><small>' + sub + '</small></span>' +
    '<button class="btn sm" data-act="client-edit" data-id="' + c.id + '">' + ic('fileText') + '수정</button>' +
    '<button class="btn sm danger-o" data-act="client-del" data-id="' + c.id + '">' + ic('trash') + '삭제</button></div>';
}
function clientListHtml() {
  const q = S.clientQuery.trim().toLowerCase();
  const list = S.data.clients.filter((c) => !q || [c.name, c.person, c.tel, c.bizNo].join(' ').toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  if (!S.data.clients.length) return '<div class="empty">아직 등록한 거래처가 없어요.<br><b>거래처 추가</b>를 눌러 자주 거래하는 곳부터 넣어 보세요.</div>';
  if (!list.length) return '<div class="empty">「' + esc(S.clientQuery) + '」에 맞는 거래처가 없어요.</div>';
  return list.map(clientRow).join('');
}
function clientsPage() {
  return '<section class="card"><div class="card-h"><h2>' + ic('users') + '거래처 목록</h2><span class="hint">' + S.data.clients.length + '곳</span>' +
    '<div class="tools">' + (S.data.clients.length ? '<button class="btn" data-act="x-clients-xlsx">' + ic('table') + '엑셀로 저장</button>' : '') + '<button class="btn primary" data-act="client-add">' + ic('plus') + '거래처 추가</button></div></div>' +
    '<div class="searchrow"><input class="in" type="search" id="cq" placeholder="상호 · 담당자 · 연락처로 찾기" value="' + esc(S.clientQuery) + '" aria-label="거래처 찾기"></div>' +
    '<div class="clist" id="clist">' + clientListHtml() + '</div></section>';
}
function clientForm(c) {
  return '<div class="fgrid">' + CF.map(([k, label, req, mode]) =>
    '<label class="fld' + (k === 'addr' || k === 'memo' || k === 'name' ? ' span2' : '') + '"><span>' + label + (req ? ' <em class="req">*</em>' : '') + '</span>' +
    '<input class="in" data-cf="' + k + '" value="' + esc(c[k] || '') + '"' + (mode ? ' inputmode="' + mode + '"' : '') + '></label>').join('') +
    '</div><p class="note" id="cfMsg" style="margin:4px 0 0;display:none"></p>';
}
function openClient(id) {
  const old = id ? S.data.clients.find((c) => c.id === id) : null;
  let dupOk = false;
  openModal({
    icon: 'users', title: old ? '거래처 수정' : '거래처 추가', body: clientForm(old || {}), ok: old ? '수정 저장' : '추가', cancel: '취소',
    onOk: () => {
      const v = {}; document.querySelectorAll('[data-cf]').forEach((el) => { v[el.dataset.cf] = el.value.trim(); });
      const msg = $('#cfMsg');
      const say = (t) => { msg.style.display = 'flex'; msg.innerHTML = ic('alert') + '<span>' + t + '</span>'; };
      if (!v.name) { say('상호를 넣어 주세요.'); $('[data-cf="name"]').focus(); return false; }
      if (v.bizNo) v.bizNo = fmtBiz(v.bizNo);
      const dup = S.data.clients.some((c) => c.id !== id && c.name.replace(/\s/g, '') === v.name.replace(/\s/g, ''));
      if (dup && !dupOk) { dupOk = true; say('같은 이름의 거래처가 이미 있어요. 그래도 저장하려면 한 번 더 누르세요.'); return false; }
      const now = new Date().toISOString();
      if (old) Object.assign(old, v, { updatedAt: now });
      else S.data.clients.push({ id: uid('c'), ...v, createdAt: now, updatedAt: now });
      changed(); render();
      toast(old ? '거래처를 수정했어요' : '「' + v.name + '」를 추가했어요');
    }
  });
}
function deleteClient(id) {
  const c = S.data.clients.find((x) => x.id === id); if (!c) return;
  openModal({
    tone: 'danger', icon: 'trash', title: '거래처를 삭제할까요?',
    body: '<p><b>' + esc(c.name) + '</b></p><p>휴지통으로 옮겨 30일 동안 보관해요. 그 안에는 되돌릴 수 있어요.</p>', ok: '삭제', cancel: '취소',
    onOk: () => {
      S.data.clients = S.data.clients.filter((x) => x.id !== id);
      S.data.trash.push({ kind: 'client', item: c, deletedAt: new Date().toISOString() });
      changed(); render();
      toast('휴지통으로 옮겼어요', { label: '되돌리기', fn: () => restoreClient(c.id) });
    }
  });
}
function restoreClient(id) {
  const i = S.data.trash.findIndex((t) => t.kind === 'client' && t.item.id === id); if (i < 0) return;
  S.data.clients.push(S.data.trash[i].item); S.data.trash.splice(i, 1);
  changed(); render(); toast('되돌렸어요');
}

/* ── 그리기 ── */
function render() {
  const root = $('#root');
  if (!S.data) { root.innerHTML = setupScreen() + modalHtml() + '<div class="toast" id="toast" role="status"></div>'; return; }
  S.route = hashRoute(); S.hash = location.hash;
  const PAGES = { me: mePage, clients: clientsPage, items: itemsPage, list: listPage, doc: editorPage, event: eventListPage, event1: eventPage, equip: equipPage, money: moneyPage, cal: calendarPage, trash: trashPage, set: settingsPage, home: homePage };
  let body;
  try { body = (PAGES[S.route] || homePage)(); }
  catch (e) { logProblem('화면 그리기 실패', e, S.route); body = '<section class="card"><div class="empty">이 화면을 그리다 문제가 생겼어요. 자료는 그대로예요.<br><a href="#home">홈으로</a> · <a href="#set">설정 → 문제 기록</a>에서 AI에게 보낼 내용을 복사할 수 있어요.</div></section>'; }
  root.innerHTML = shell(body) + modalHtml() + '<div class="toast" id="toast" role="status"></div>';
  const t0 = TITLES[S.route][0];
  document.title = (typeof t0 === 'function' ? t0() : t0).replace('안녕하세요, 대표님', '홈') + ' · 스타미디어 견적서 발행기';
  editorAfterRender();
  if (S.route === 'set') settingsAfterRender();
}
/** 백업 되살리기 · 불러오기 뒤: 새 자료로 바꾸고 다시 그리기 */
function normalize(d) { const e = emptyData(); return { ...e, ...d, me: { ...e.me, ...(d.me || {}) }, settings: { ...e.settings, ...(d.settings || {}) } }; }
async function adoptData(d) { S.data = normalize(d); applyBigText(); await saveNow(); render(); }
function applyBigText() { document.documentElement.classList.toggle('big', !!(S.data && S.data.settings && S.data.settings.bigText)); }
function setBigText(on) { S.data.settings.bigText = !!on; applyBigText(); changed(); }

/* ── 움직임 ── */
document.addEventListener('click', async (e) => {
  if (e.target.id === 'modal') { closeModal(); return; }
  if (e.target.id === 'moreSheet') { e.target.classList.remove('on'); return; }
  if (e.target.closest('#moreSheet a')) $('#moreSheet').classList.remove('on');
  const mb = e.target.closest('[data-modal]');
  if (mb) { if (mb.dataset.modal === 'ok') await modalOk(); else { const fn = MODAL.onCancel; closeModal(); if (fn) await fn(); } return; }
  const sb = e.target.closest('[data-seg] button');
  if (sb) {
    const name = sb.parentElement.dataset.seg, r = editorSeg(name, sb.dataset.v);
    if (r === true) sb.parentElement.querySelectorAll('button').forEach((b) => { const on = b === sb; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    return;
  }
  const soon = e.target.closest('[data-soon]');
  if (soon) { e.preventDefault(); toast('「' + soon.dataset.soon + '」은(는) 다음 묶음에서 만들어요'); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (a.tagName === 'A') e.preventDefault();
  if (act === 'lock-now') { if (!lockNow()) { location.hash = '#set'; toast('먼저 비밀번호를 정해 주세요 (화면 잠금)'); } return; }
  if (equipClick(act, a, curEvent()) || editorClick(act, a) || eventsClick(act, a) || exportClick(act, a, curDoc()) ||
      moneyClick(act, a) || calendarClick(act, a) || trashClick(act, a) || settingsClick(act, a)) return;
  if (act === 'stamp-pick') pickStamp();
  else if (act === 'stamp-del') { S.data.me.stamp = null; changed(); render(); toast('도장을 지웠어요'); }
  else if (act === 'start-fresh') startFresh(null);
  else if (act === 'find-folder') onFindInFolder();
  else if (act === 'import-file') onImportFile();
  else if (act === 'folder-connect') onFolderConnect();
  else if (act === 'folder-permit') onFolderPermit();
  else if (act === 'retry') saveNow();
  else if (act === 'backup-now') { await saveNow(); const n = await S.store.backup('수동'); toast(n ? '백업을 만들었어요 (최근 10개 보관)' : '백업할 자료가 아직 없어요'); }
  else if (act === 'client-add') openClient(null);
  else if (act === 'client-edit') openClient(a.dataset.id);
  else if (act === 'client-del') deleteClient(a.dataset.id);
  else if (act === 'more') { e.preventDefault(); $('#moreSheet').classList.toggle('on'); }
  else itemsClick(act, a);
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.me) {
    let v = t.value;
    if (t.dataset.me === 'name') {
      const lines = v.split('\n');
      if (lines.length > 2) { v = lines.slice(0, 2).join('\n') + lines.slice(2).join(''); t.value = v; toast('상호는 2줄까지 넣을 수 있어요'); }
    }
    S.data.me[t.dataset.me] = v;
    const pv = $('#meSample'); if (pv) pv.innerHTML = supPreview();
    changed();
  } else if (t.id === 'cq') {
    S.clientQuery = t.value; $('#clist').innerHTML = clientListHtml();
  } else if (t.id === 'stampSize') {
    S.data.me.stampSize = Number(t.value); $('#stampSzTxt').textContent = t.value + 'px';
    const pv = $('#meSample'); if (pv) pv.innerHTML = supPreview();
    changed();
  } else if (equipInput(t, curEvent()) || settingsInput(t) || editorInput(t) || listInput(t) || eventsInput(t)) { /* 각 화면 파일이 처리 */ }
  else itemsInput(t);
});

document.addEventListener('change', (e) => { if (equipChange(e.target, curEvent()) || settingsChange(e.target)) return; editorChange(e.target); });

document.addEventListener('focusout', (e) => {
  const t = e.target;
  itemsBlur(t);
  editorBlur(t);
  if (t.dataset && t.dataset.me === 'bizNo' && t.value) { const f = fmtBiz(t.value); if (f !== t.value) { t.value = f; S.data.me.bizNo = f; $('#meSample').innerHTML = supPreview(); changed(); } }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && S.data) { e.preventDefault(); saveNow().then(() => toast('저장했어요')); return; }
  const pf = $('#pvFull');
  if (e.key === 'Escape' && pf && pf.classList.contains('on')) { pf.classList.remove('on'); return; }
  const sh = $('#moreSheet');
  if (e.key === 'Escape' && sh && sh.classList.contains('on')) { sh.classList.remove('on'); return; }
  const m = $('#modal');
  if (m && m.classList.contains('on')) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); modalOk(); }
    return;
  }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.me === 'name' && e.target.value.split('\n').length >= 2) {
    e.preventDefault(); toast('상호는 2줄까지 넣을 수 있어요');
  }
});

// 화면에서 주소(#me 등)를 바꾼 뒤 직접 그렸으면 다시 그리지 않는다 (열어 둔 확인 창 · 알림이 지워지지 않도록)
const hashRoute = () => {
  const r = (location.hash || '#home').slice(1);
  if (r.startsWith('event/')) { S.eventId = r.slice(6); return S.data && S.data.events.some((e) => e.id === S.eventId) ? 'event1' : 'event'; }
  if (r.startsWith('doc/')) { S.docId = r.slice(4); return S.data && S.data.docs.some((d) => d.id === S.docId) ? 'doc' : 'list'; }
  return TITLES[r] && r !== 'doc' && r !== 'event1' ? r : 'home';
};
window.addEventListener('hashchange', () => { if (S.data && location.hash !== S.hash) { render(); window.scrollTo(0, 0); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S.dirty) saveNow(); });
window.addEventListener('beforeunload', (e) => { if (S.dirty || S.saving) { saveNow(); e.preventDefault(); e.returnValue = ''; } });

initItems({ S, $, esc, ic, uid, toast, openModal, changed, render: () => render() });
initEditor({ S, $, esc, ic, uid, toast, openModal, closeModal, changed, render: () => render() });
initEvents({ S, $, esc, ic, uid, toast, openModal, closeModal, changed, render: () => render() });
initExport({ S, $, esc, ic, toast, openModal, closeModal });
const ctx = { S, $, esc, ic, uid, toast, openModal, closeModal, changed, saveNow, render: () => render(), homeSaveRows: () => homeSaveRows(), adoptData, setBigText, appInfo: { version: APP_VERSION, build: APP_BUILD } };
initMoney(ctx); initCalendar(ctx); initEquip(ctx); initTrash(ctx); initSettings(ctx); initLock(ctx);

/* ── 시작 ── */
async function boot() {
  // 연결해 둔 PC 폴더가 있으면 다시 붙인다 (브라우저가 허락을 다시 물으면 '다시 연결' 버튼으로)
  if (HAS_FOLDER) {
    try {
      const h = await S.device.get('folderHandle');
      if (h) {
        S.folder.handle = h;
        const p = await h.queryPermission({ mode: 'readwrite' });
        if (p === 'granted') await attachFolder(h); else S.folder.state = 'needs-permission';
      }
    } catch (e) { /* 폴더를 못 찾으면 연결 안 됨으로 둔다 */ }
  }
  let r;
  try { r = await S.store.open(); } catch (e) { r = { ok: false, reason: 'device-error' }; }
  if (r.ok) {
    S.data = normalize(r.data);
    const before = S.data.trash.length; S.data.trash = purgeTrash(S.data.trash);   // 30일 지난 휴지통 비우기
    if (S.data.trash.length !== before) changed();
    applyBigText();
    if (r.migrated) { await saveNow(); setTimeout(() => toast('새 버전에 맞게 자료를 바꿨어요 (바꾸기 전 자료는 백업에 있어요)'), 300); }
  } else if (r.reason !== 'empty') { S.bootProblem = r.reason; logProblem('자료 열기 실패', r.reason); }
  render();
  window.__smStarted = true;
  if (S.data) lockOnBoot();
  // 홈 화면 설치용 도우미 (인터넷 먼저 · 끊겼을 때만 저장해 둔 파일). 실패해도 프로그램은 그대로 쓴다.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch((e) => logProblem('홈 화면 설치 도우미 등록 실패', e));
  }
}
boot();
