// 화면: 설정 · 백업 (#set)
//  1) 문서 기본값  2) 화면(글자 크게)  3) 화면 잠금  4) 저장 위치  5) 백업 · 자료 파일  6) 문제 기록(AI 에게 보낼 글)  7) 프로그램 정보 · 업데이트 확인
// 설정 값은 S.data.settings 에 저장된다 (core/datafile.mjs emptyData 참고).
import { DEFAULT_PHRASES } from './core/docs.mjs';
import { uxMode, cardMode, uxLvl, setLvl, isPhone, uxTabs, uxNavBtn, uxBackHtml, uxGroup, uxMid, uxKids, uxLeaf } from './ux.mjs';
import { toNum } from './core/catalog.mjs';
import { onlyDigits, validPin, PIN_MIN, PIN_MAX } from './core/lock.mjs';
import { hasLock, lockNow, setPin, verifyPin, removePin, showCodeModal } from './lockscreen.mjs';
import { problems, clearProblems, reportText, deviceText } from './errors.mjs';
import { wrap } from './core/datafile.mjs';
import { RELEASES, KIND_LABEL } from './releases.mjs';
import { openInstall, isStandalone } from './install.mjs';
import { driveRowHtml, preloadGis } from './gdrive.mjs';

let C;
export function initSettings(ctx) { C = ctx; }
const st = () => C.S.data.settings;
const LOCK_MIN = [[0, '끄기'], [1, '1분'], [3, '3분'], [5, '5분'], [10, '10분'], [30, '30분']];

function seg(act, opts, cur) {
  return '<div class="seg" role="radiogroup">' + opts.map(([v, l]) => '<button type="button" data-act="' + act + '" data-v="' + v + '" class="' + (String(cur) === String(v) ? 'on' : '') + '" aria-checked="' + (String(cur) === String(v)) + '" role="radio">' + l + '</button>').join('') + '</div>';
}
const fmtBk = (n) => { const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})_?(.*)$/.exec(n); return m ? { when: m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5], why: (m[7] || '').replace(/_/g, ' ') } : { when: n, why: '' }; };
// 백업 이름의 시각은 세계 표준시(UTC)로 적혀 있어 한국 시각으로 바꿔 보여 준다
const localWhen = (n) => { const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(n); if (!m) return fmtBk(n).when; const d = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6])); return d.toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };

export function settingsPage() { return uxSettings(settingsBody()); }
function settingsBody() {
  const s = st(), S = C.S;
  const phrases = (s.phrases && s.phrases.length ? s.phrases : DEFAULT_PHRASES).join('\n');
  const probs = problems();
  const lockOn = hasLock();
  return '<div class="setpage">' +
    // 1. 문서 기본값
    '<section class="card"><div class="card-h"><h2>' + C.ic('fileText') + '문서 기본값</h2><span class="hint">새로 만드는 문서에 처음 들어가는 값이에요 (이미 만든 문서는 그대로)</span></div>' +
    '<div class="set-rows">' +
    '<div class="set-row"><span class="sl"><b>부가세</b><small>견적서 · 청구서의 기본 부가세 방식</small></span>' + seg('set-vat', [['excl', '별도 (10% 더하기)'], ['incl', '포함'], ['none', '없음']], s.vat || 'excl') + '</div>' +
    '<div class="set-row"><span class="sl"><b>견적 유효기간</b><small>견적서 날짜부터 며칠까지</small></span><label class="set-num"><input class="in num" data-set="validDays" inputmode="numeric" value="' + C.esc(s.validDays ?? 15) + '" aria-label="유효기간 (일)"><span>일</span></label></div>' +
    '<div class="set-row"><span class="sl"><b>입금 기한</b><small>납품ㆍ청구서 날짜부터 며칠 안에</small></span><label class="set-num"><input class="in num" data-set="dueDays" inputmode="numeric" value="' + C.esc(s.dueDays ?? 14) + '" aria-label="입금 기한 (일)"><span>일</span></label></div>' +
    '<div class="set-row"><span class="sl"><b>빈 줄 채우기</b><small>품목이 적어도 표를 A4 끝까지 그리기</small></span><label class="switch"><input type="checkbox" data-setchk="fillRows"' + (s.fillRows ? ' checked' : '') + '><i></i><span>' + (s.fillRows ? '켜짐' : '꺼짐') + '</span></label></div>' +
    '</div>' +
    '<label class="fld"><span>자주 쓰는 특이사항 문구 <small class="fhint-i">한 줄에 하나씩 · 문서의 특이사항에서 골라 넣어요</small></span><textarea class="in" id="setPhrases" rows="5">' + C.esc(phrases) + '</textarea></label></section>' +
    // 2. 화면
    '<section class="card"><div class="card-h"><h2>' + C.ic('type') + '화면</h2></div><div class="set-rows">' +
    '<div class="set-row"><span class="sl"><b>글자 크게</b><small>기본 16px → 18px · 화면만 커지고 문서(A4)는 그대로</small></span><label class="switch"><input type="checkbox" id="setBig"' + (s.bigText ? ' checked' : '') + '><i></i><span>' + (s.bigText ? '켜짐' : '꺼짐') + '</span></label></div>' +
    '<div class="set-row"><span class="sl"><b>바탕화면 아이콘</b><small>' + (isStandalone() ? '지금 아이콘(앱)으로 열려 있어요' : '휴대폰 · 태블릿 · PC 바탕화면에 앱처럼 아이콘 만들기') + '</small></span><button type="button" class="btn" data-act="set-install">' + C.ic('phone') + '만드는 방법 보기</button></div>' +
    '<div class="set-row set-ux"><span class="sl"><b>화면 디자인 (UI · UX)</b><small>이 기기에만 적용돼요 · 품목 · 세트, 발행 목록, 설정 · 백업 화면 모양</small></span>' +
    seg('ux-set', [['', '기본'], ['a', 'A · 탭 정리형'], ['b', 'B · 목록 · 상세형']], uxMode()) + '</div>' +
    '<div class="set-row set-ux"><span class="sl"><b>영역 제목 모양</b><small>이 기기에만 적용돼요 · 각 상자 맨 위 제목 줄</small></span>' +
    seg('ux-cardh', [['soft', '연한 띠 (기본)'], ['band', '파란 띠'], ['none', '띠 없음']], cardMode()) + '</div>' +
    '</div></section>' +
    // 3. 잠금
    '<section class="card"><div class="card-h"><h2>' + C.ic('lock') + '화면 잠금</h2><span class="hint">남이 화면을 못 보게 하는 문이에요 (자료 파일을 암호화하지는 않아요)</span></div>' +
    '<div class="set-rows"><div class="set-row"><span class="sl"><b>비밀번호</b><small>' + (lockOn ? '정해져 있어요 · 숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리' : '아직 정하지 않았어요 · 숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리') + '</small></span>' +
    (lockOn ? '<span class="set-btns"><button type="button" class="btn" data-act="set-lock-now">' + C.ic('lock') + '지금 잠금</button><button type="button" class="btn" data-act="set-pin-change">비밀번호 재설정</button><button type="button" class="btn danger-o" data-act="set-pin-remove">잠금 끄기</button></span>'
      : '<button type="button" class="btn primary" data-act="set-pin-new">' + C.ic('lock') + '비밀번호 정하기</button>') + '</div>' +
    '<div class="set-row"><span class="sl"><b>자동 잠금</b><small>이 시간 동안 손대지 않으면 잠가요 · 휴대폰은 다른 앱에 다녀와도</small></span>' + seg('set-autolock', LOCK_MIN, s.autoLockMin ?? 5) + '</div></div>' +
    '<p class="note">' + C.ic('alert') + '<span>비밀번호를 정하거나 재설정하면 <b>초기화 코드(영어 대문자 · 숫자 5자리)</b>를 <mark class="hl-p">한 번</mark> 보여 드려요. 비밀번호를 잊으면 잠금 화면의 「비밀번호를 잊었어요」에서 <mark class="hl-y"><b>사업자등록번호 + 초기화 코드</b></mark>로 초기화한 뒤 새 비밀번호를 정해요.</span></p></section>' +
    // 4. 저장 위치
    '<section class="card"><div class="card-h"><h2>' + C.ic('cloud') + '저장 위치</h2><span class="hint">입력하면 저절로 저장돼요</span></div><div id="setSave">' + C.homeSaveRows() + '</div>' +
    '</section>' +
    // 5. 백업
    '<section class="card"><div class="card-h"><h2>' + C.ic('copy') + '백업 · 자료 파일</h2><span class="hint">백업은 최근 10개(+ 직접 「보관」한 것)를 이 기기와 PC 폴더에 둬요</span></div>' +
    '<div class="set-btns wrap"><button type="button" class="btn primary" data-act="backup-now">' + C.ic('copy') + '지금 백업 만들기</button>' +
    '<button type="button" class="btn" data-act="set-export">' + C.ic('download') + '자료 파일 내려받기 (.json)</button>' +
    '<button type="button" class="btn" data-act="import-file">' + C.ic('upload') + '자료 파일 불러오기</button></div>' +
    '<div id="bkList" class="bklist"><p class="hint">백업 목록을 읽는 중…</p></div>' +
    '<p class="note">' + C.ic('check') + '<span>백업으로 되살리기 전에는 지금 자료를 <b>먼저 백업</b>해 두니, 잘못 골라도 다시 돌아올 수 있어요.</span></p></section>' +
    // 6. 문제 기록
    '<section class="card set-prob"><div class="card-h"><h2>' + C.ic('alert') + '문제 기록</h2><span class="hint">오류가 나면 저절로 적혀요 · 거래처 이름 · 금액은 적지 않아요</span></div>' +
    '<p>' + (probs.length ? '최근 기록 <b>' + probs.length + '개</b>' : '기록된 오류가 없어요.') + ' · ' + C.esc(deviceText()) + '</p>' +
    (probs.length ? '<ul class="problist">' + probs.slice(0, 8).map((p) => '<li><small>' + new Date(p.at).toLocaleString('ko-KR') + ' · ' + C.esc(p.page || '') + '</small><b>' + C.esc(p.kind) + '</b> ' + C.esc(p.msg) + '</li>').join('') + '</ul>' : '') +
    '<label class="fld"><span>무엇을 하다가 어떻게 됐나요? <small class="fhint-i">적어 두면 AI가 더 빨리 고쳐요</small></span><textarea class="in" id="probMemo" rows="2" placeholder="예: 견적서에서 PDF 저장을 눌렀더니 아무 반응이 없어요"></textarea></label>' +
    '<div class="set-btns wrap"><button type="button" class="btn primary" data-act="prob-copy">' + C.ic('copy') + 'AI에게 보낼 내용 복사</button><button type="button" class="btn" data-act="prob-save">' + C.ic('download') + '파일로 저장</button>' +
    (probs.length ? '<button type="button" class="btn danger-o" data-act="prob-clear">' + C.ic('trash') + '기록 지우기</button>' : '') + '</div>' +
    '<p class="note">' + C.ic('chat') + '<span>복사한 글을 Claude나 ChatGPT(Codex) 대화창에 붙여 넣고 「이 문제를 고쳐 줘」라고 하면 돼요.</span></p></section>' +
    // 7. 정보
    '<section class="card"><div class="card-h"><h2>' + C.ic('star') + '프로그램 정보</h2></div><div class="set-rows">' +
    '<div class="set-row"><span class="sl"><b>버전</b><small>v' + C.esc(C.appInfo.version) + ' · ' + C.esc((RELEASES.find((r) => r.version === C.appInfo.version) || {}).date || '') + ' · 빌드 ' + C.esc(C.appInfo.build) + '</small></span><span class="set-btns"><button type="button" class="btn" data-act="set-releases">' + C.ic('list') + '릴리즈 노트</button><button type="button" class="btn" data-act="set-update">' + C.ic('download') + '업데이트 확인</button></span></div>' +
    '<div class="set-row"><span class="sl"><b>디자인 시안</b><small>처음에 고른 시안 A 블루 모던 · 하위 메뉴 시안 A · B (참고용)</small></span><span class="set-btns"><a class="btn" href="sian/ux/" target="_blank" rel="noopener">하위 메뉴 시안</a></span><a class="btn" href="sian/" target="_blank" rel="noopener">' + C.ic('eye') + '시안 보기</a></div>' +
    '</div><p id="updMsg" class="note" style="display:none"></p></section>' +
    '</div>';
}

/** 화면을 그린 뒤: 백업 목록 읽기 (기기 저장소에서) */
export async function settingsAfterRender() {
  preloadGis();
  const box = document.getElementById('bkList'); if (!box) return;
  let names = [];
  try { names = (await C.S.store.listBackups()).slice().reverse(); } catch (e) { box.innerHTML = '<p class="hint">백업 목록을 읽지 못했어요.</p>'; return; }
  if (!document.getElementById('bkList')) return;
  box.innerHTML = names.length ? '<ul class="bkrows">' + names.slice(0, 15).map((n) => { const f = fmtBk(n); return '<li><span><b>' + C.esc(localWhen(n)) + '</b><small>' + C.esc(f.why || '') + (n.includes('_보관') ? ' · 보관' : '') + '</small></span><button type="button" class="btn sm" data-act="bk-restore" data-n="' + C.esc(n) + '">' + C.ic('left') + '이 백업으로 되살리기</button></li>'; }).join('') + '</ul>'
    : '<p class="hint">아직 백업이 없어요. 「지금 백업 만들기」를 눌러 보세요.</p>';
}

function pinForm(fields) {
  return '<div class="fgrid one">' + fields.map(([id, l]) => '<label class="fld"><span>' + l + '</span><input class="in" id="' + id + '" type="password" inputmode="numeric" maxlength="' + PIN_MAX + '" autocomplete="off"></label>').join('') + '</div><p class="note" id="pinMsg" style="display:none;margin:4px 0 0"></p>';
}
const pinSay = (t) => { const m = document.getElementById('pinMsg'); m.style.display = 'flex'; m.innerHTML = C.ic('alert') + '<span>' + t + '</span>'; return false; };
const val = (id) => onlyDigits((document.getElementById(id) || {}).value);

function download(name, text, type = 'application/json') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.style.display = 'none';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
}
const today8 = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
function report() {
  const S = C.S, d = S.data;
  const storage = ['이 기기 ' + (S.store.status['이 기기'] ? (S.store.status['이 기기'].ok ? '저장 성공' : '저장 실패') : '준비됨'), 'PC 폴더 ' + ({ none: '연결 안 됨', connected: S.store.status['PC 폴더'] ? (S.store.status['PC 폴더'].ok ? '저장 성공' : '저장 실패') : '연결됨', 'needs-permission': '허락 필요', unsupported: '못 씀(이 브라우저)' }[S.folder.state] || S.folder.state)].join(' · ');
  return reportText({ version: C.appInfo.version, build: C.appInfo.build, storage, memo: (document.getElementById('probMemo') || {}).value || '', counts: { docs: d.docs.length, events: d.events.length, clients: d.clients.length, items: d.items.length, equipment: (d.equipment || []).length, trash: d.trash.length } });
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
  }
}

export function settingsClick(act, a) {
  if (!/^(set-|bk-|prob-)/.test(act) || !C.S.data) return false;   // 다른 화면의 누르기는 건드리지 않는다
  const S = C.S, s = st();
  switch (act) {
    case 'set-ux-g': {
      S.setGroup = a.dataset.v; S.setSec = Number(a.dataset.sec || 0); if (uxMode() === 'b') setLvl(2); C.render();
      const secs = [...document.querySelectorAll('.setpage section[data-sg="' + S.setGroup + '"]')];
      if (S.setSec && secs[S.setSec]) secs[S.setSec].scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
      return true;
    }
    case 'set-vat': s.vat = a.dataset.v; C.changed(); C.render(); C.toast('새 문서의 부가세 기본값을 바꿨어요'); return true;
    case 'set-autolock': s.autoLockMin = Number(a.dataset.v); C.changed(); C.render(); C.toast(Number(a.dataset.v) ? a.dataset.v + '분 동안 손대지 않으면 잠가요' : '자동 잠금을 껐어요'); return true;
    case 'set-lock-now': lockNow(); return true;
    case 'set-pin-new':
      C.openModal({ icon: 'lock', title: '비밀번호 정하기', body: pinForm([['pinA', '새 비밀번호 (숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리)'], ['pinB', '새 비밀번호 다시 입력']]) + (onlyDigits(S.data.me.bizNo).length < 10 ? '<p class="warnbox">' + C.ic('alert') + '<span>내 정보에 <mark class="hl-p">사업자등록번호가 없으면</mark> 비밀번호를 잊었을 때 <mark class="hl-p">다시 정할 수 없어요</mark>. <mark class="hl-y">먼저 넣어 두세요</mark>.</span></p>' : ''), ok: '정하기',
        onOk: async () => { const p = val('pinA'); if (!validPin(p)) return pinSay('숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리로 넣어 주세요'); if (p !== val('pinB')) return pinSay('두 번 넣은 비밀번호가 달라요'); const code = await setPin(p); if (s.autoLockMin == null) s.autoLockMin = 5; C.render(); showCodeModal(code, '비밀번호를 정했어요'); } });
      return true;
    case 'set-pin-change':
      C.openModal({ icon: 'lock', title: '비밀번호 재설정', body: pinForm([['pinA', '새 비밀번호 (숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리)'], ['pinB', '새 비밀번호 다시 입력']]) + '<p class="note">' + C.ic('alert') + '<span>재설정하면 <mark class="hl-p">예전 초기화 코드는 못 쓰고</mark>, 새 초기화 코드를 드려요.</span></p>', ok: '재설정',
        onOk: async () => { const p = val('pinA'); if (!validPin(p)) return pinSay('새 비밀번호는 숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리로 넣어 주세요'); if (p !== val('pinB')) return pinSay('두 번 넣은 비밀번호가 달라요'); const code = await setPin(p); C.render(); showCodeModal(code, '비밀번호를 재설정했어요'); } });
      return true;
    case 'set-pin-remove':
      C.openModal({ tone: 'danger', icon: 'lock', title: '잠금을 끌까요?', body: pinForm([['pinO', '지금 비밀번호']]), ok: '잠금 끄기',
        onOk: async () => { if (!(await verifyPin(val('pinO')))) return pinSay('비밀번호가 맞지 않아요'); removePin(); C.render(); C.toast('화면 잠금을 껐어요'); } });
      return true;
    case 'set-export': {
      download('견적서발행기_자료_' + today8() + '.json', JSON.stringify(wrap(S.data, C.appInfo.version)));
      C.toast('자료 파일을 내려받았어요 (다운로드 폴더) · 다른 기기에서 「자료 파일 불러오기」로 열어요');
      return true;
    }
    case 'bk-restore': {
      const n = a.dataset.n;
      C.openModal({ tone: 'danger', icon: 'copy', title: '이 백업으로 되살릴까요?', body: '<p><b>' + C.esc(localWhen(n)) + '</b> 백업 ' + C.esc(fmtBk(n).why) + '</p><p>지금 자료는 <mark class="hl-g">먼저 백업해 둬요</mark>. 그 뒤로 고친 내용은 지금 자료 백업에 남아요.</p>', ok: '되살리기',
        onOk: async () => { await C.saveNow(); const r = await S.store.restore(n); if (!r.ok) { C.toast('이 백업을 읽지 못해 아무것도 바꾸지 않았어요'); return; } C.adoptData(r.data); C.toast('백업으로 되살렸어요 (되살리기 전 자료도 백업에 있어요)'); } });
      return true;
    }
    case 'prob-copy': copyText(report()).then((ok) => C.toast(ok ? '복사했어요. AI 대화창에 붙여 넣어 주세요' : '복사하지 못했어요. 「파일로 저장」을 써 주세요')); return true;
    case 'prob-save': download('견적서발행기_문제보고_' + today8() + '.md', report(), 'text/markdown'); C.toast('문제 보고 파일을 내려받았어요'); return true;
    case 'prob-clear': C.openModal({ icon: 'trash', title: '문제 기록을 지울까요?', body: '<p>AI에게 보낼 일이 끝났다면 지워도 돼요.</p>', ok: '지우기', onOk: () => { clearProblems(); C.render(); C.toast('문제 기록을 지웠어요'); } }); return true;
    case 'set-update': checkUpdate(); return true;
    case 'set-install': openInstall(); return true;
    case 'set-releases': C.openModal({ icon: 'list', title: '릴리즈 노트', body: releasesHtml(), ok: '닫기', cancel: false, wide: true }); return true;
  }
  return false;
}
/** 릴리즈 노트: 최신 버전부터, 버전마다 날짜 · 제목 · 새 기능 / 좋아짐 / 고침 */
function releasesHtml() {
  return '<div class="relnotes">' + RELEASES.map((r, i) => '<article class="rel' + (r.version === C.appInfo.version ? ' cur' : '') + '"><header><b class="rel-v">v' + r.version + '</b>' + (i === 0 ? '<span class="schip s-sent">최신</span>' : '') + (r.version === C.appInfo.version ? '<span class="schip s-contract">지금 쓰는 버전</span>' : '') + '<time>' + r.date.replace(/-/g, '.') + '</time></header>' +
    '<h4>' + C.esc(r.title) + '</h4>' + (r.intro ? '<p class="rel-intro">' + C.esc(r.intro) + '</p>' : '') +
    '<ul>' + r.items.map(([k, t]) => '<li><span class="rk rk-' + k + '">' + KIND_LABEL[k] + '</span><span>' + C.esc(t) + '</span></li>').join('') + '</ul></article>').join('') + '</div>' +
    '<p class="note">' + C.ic('star') + '<span>버전 번호 v<b>주</b>.<b>부</b>.<b>수</b> — 주: 크게 바뀜 · 부: 새 기능 · 수: 고침</span></p>';
}
async function checkUpdate() {
  const msg = document.getElementById('updMsg'); if (!msg) return;
  msg.style.display = 'flex'; msg.innerHTML = C.ic('clock') + '<span>확인하는 중…</span>';
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    const v = await r.json();
    if (v.build && v.build !== C.appInfo.build) msg.innerHTML = C.ic('download') + '<span>새 버전 <b>v' + C.esc(v.version) + '</b>(빌드 ' + C.esc(v.build) + ')이 있어요. </span><button type="button" class="btn sm primary" onclick="location.reload()">새로 고쳐서 받기</button>';
    else msg.innerHTML = C.ic('check') + '<span>지금 쓰는 것이 최신 버전이에요.</span>';
  } catch (e) { msg.innerHTML = C.ic('alert') + '<span>인터넷이 안 되거나 확인할 수 없어요. 자료는 그대로예요.</span>'; }
}

export function settingsInput(t) {
  if (!C.S.data) return false;
  const s = st();
  if (t.dataset.set) { const n = Math.round(toNum(t.value)); if (n >= 0 && n <= 365) { s[t.dataset.set] = n; C.changed(); } return true; }
  if (t.id === 'setPhrases') { s.phrases = t.value.split('\n').map((x) => x.trim()).filter(Boolean); C.changed(); return true; }
  if (t.id === 'probMemo') return true;
  return false;
}
export function settingsChange(t) {
  if (!C.S.data) return false;
  const s = st();
  if (t.dataset.setchk) { s[t.dataset.setchk] = t.checked; C.changed(); C.render(); return true; }
  if (t.id === 'setBig') { C.setBigText(t.checked); C.render(); return true; }
  return false;
}

/* ── 설정 시안 A · B (v1.6.0 시험): 7개 영역을 4개 묶음으로 나눠 한 번에 하나만 ── */
const SET_GROUPS = ['doc', 'screen', 'screen', 'save', 'save', 'info', 'info'];
const SET_SECS = { doc: ['문서 기본값'], screen: ['화면', '화면 잠금'], save: ['저장 위치', '백업 · 자료 파일'], info: ['문제 기록', '프로그램 정보'] };   // 영역 순서: 기본값 · 화면 · 잠금 · 저장 위치 · 백업 · 문제 기록 · 정보
function uxSettings(html) {
  const m = uxMode(); if (!m) return html;
  let i = 0; html = html.replace(/<section class="card/g, () => '<section data-sg="' + (SET_GROUPS[i++] || 'info') + '" class="card');
  const s = st(), S = C.S, g = S.setGroup || 'doc', probs = problems();
  const vat = { excl: '별도', incl: '포함', none: '없음' }[s.vat] || '별도';
  const groups = [['doc', '문서 기본값', vat + ' · ' + (s.validDays || 15) + '일'], ['screen', '화면 · 잠금', hasLock() ? (Number(s.autoLockMin) ? s.autoLockMin + '분 잠금' : '잠금 켬') : '잠금 없음'],
    ['save', '저장 · 백업', '자동 저장'], ['info', '문제 · 정보', probs.length ? '기록 ' + probs.length + '개' : 'v' + C.appInfo.version]];
  const nav = m === 'a' ? uxTabs(groups.map(([k, l]) => [k, l]), g, 'set-ux-g')
    : '<aside class="uxsub2" aria-label="설정 하위 메뉴">' + uxGroup('sliders', '설정', groups.map(([k, l]) => {
        const ph = isPhone(), on = !ph && k === g, secs = SET_SECS[k];
        return uxMid('sg:' + k, l, '', on && secs.length < 2, on) +
          uxKids('sg:' + k, (ph ? uxLeaf('data-act="set-ux-g" data-v="' + k + '"', false, '전체 보기', '') : '') + secs.map((nm, i) => uxLeaf('data-act="set-ux-g" data-v="' + k + '" data-sec="' + i + '"', on && (S.setSec || 0) === i && secs.length > 1, nm, '')).join(''), on);
      }).join('')) + '</aside>';
  return '<div class="uxp ux-' + m + ' ux-set sg-' + g + ' lvl' + uxLvl() + '">' + nav + '<div class="uxsetbody">' + (m === 'b' ? uxBackHtml('설정 · 백업') : '') + html + '</div></div>';
}
