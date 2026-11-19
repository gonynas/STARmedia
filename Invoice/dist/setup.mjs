// 처음 설정 (v1.3.0, 사용자 결정)
//  PC : ① 1차 저장소 — 구글 드라이브 연결(필수)  ② 2차 저장소 — PC 폴더(백업용, 「나중에 하기」 가능)
//       ③ 내 정보 · 도장 → 「저장하고 다음」  ④ 화면 잠금 비밀번호(필수) → 초기화 코드 팝업  → 홈
//  휴대폰 · 태블릿 : ① 「구글 드라이브에서 불러오기」만 (PC에서 먼저 설정해야 쓸 수 있음). 2차 저장소 없음.
//  구글 드라이브에 이미 설정된 자료가 있으면(PC 포맷 뒤 · 다른 사무실 PC · 휴대폰) ③ ④ 는 저절로 건너뛴다.
//  어느 단계인지는 자료를 보고 정한다(needsSetup) — 따로 저장하는 「설정 끝」 표시가 없어서 기기를 바꿔도 맞게 나온다.
import { driveConfigured, driveConnected, setupDriveHtml } from './gdrive.mjs?v=mwmxoxka';
import { hasLock, setPin, showCodeModal } from './lockscreen.mjs?v=mwmxoxka';
import { validPin, onlyDigits, PIN_MIN, PIN_MAX } from './core/lock.mjs?v=mwmxoxka';

let C;
const FOLDER_DONE = 'starmedia-quote:folderStepDone';
export function initSetup(ctx) { C = ctx; }
export const isPC = () => C.hasFolderApi && !(window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches);
const folderStepDone = () => { try { return !!localStorage.getItem(FOLDER_DONE); } catch (e) { return false; } };

/** 지금 해야 할 설정 단계: 'drive' · 'folder' · 'me' · 'pin' · null(다 됨). 구글 설정이 없는 빌드면 예전 처음 화면을 쓴다(null 이 아니라 'legacy') */
export function needsSetup() {
  const S = C.S;
  if (!driveConfigured()) return S.data ? null : 'legacy';
  if (!S.data || !driveConnected()) return 'drive';
  if (isPC() && S.folder.state !== 'connected' && !folderStepDone()) return 'folder';
  if (!(S.data.me.name && onlyDigits(S.data.me.bizNo).length === 10)) return 'me';
  if (!hasLock()) return 'pin';
  return null;
}

function stepsBar(cur) {
  const pc = isPC();
  const list = pc ? [['drive', '구글 드라이브'], ['folder', 'PC 폴더'], ['me', '내 정보 · 도장'], ['pin', '잠금 비밀번호']] : [['drive', '구글 드라이브'], ['me', '내 정보'], ['pin', '잠금 비밀번호']];
  const idx = list.findIndex(([k]) => k === cur);
  return '<ol class="wz-steps">' + list.map(([k, l], i) => '<li class="' + (i < idx ? 'done' : i === idx ? 'on' : '') + '"><span>' + (i < idx ? C.ic('check') : i + 1) + '</span><b>' + l + '</b></li>').join('') + '</ol>';
}
const head = (title, sub) => '<div class="setup-head"><img src="assets/starmedia-logo.png" alt="스타미디어 기획사"><h1>' + title + '</h1><p>' + sub + '</p></div>';

/** 처음 설정 화면 전체 */
export function setupWizardHtml(step) {
  let body = '';
  if (step === 'drive') {
    body = head('견적서 발행기 · 처음 설정', isPC() ? '<b>1차 저장소(필수)</b> — 자료는 구글 드라이브에 저장되고 PC · 휴대폰이 같이 써요' : 'PC에서 설정한 자료를 <b>구글 드라이브에서 불러와</b> 바로 써요') +
      stepsBar('drive') + setupDriveHtml(isPC());
  } else if (step === 'folder') {
    body = head('2차 저장소 · PC 폴더', '구글 드라이브와 똑같은 자료를 이 PC 폴더에도 저장해요 — 드라이브에 문제가 생겨도 PC에 남아요') + stepsBar('folder') +
      '<div class="wz-card"><p>예: <b>D:\\견적서발행기</b> 처럼 찾기 쉬운 폴더를 골라 주세요. 그 폴더에 예전 자료가 있으면 합칠지 물어봐요.</p>' +
      '<div class="wz-btns"><button type="button" class="btn primary big" data-act="wz-folder">' + C.ic('cloud') + 'PC 폴더 고르기</button><button type="button" class="btn big ghost" data-act="wz-folder-later">나중에 하기</button></div>' +
      '<p class="note">' + C.ic('alert') + '<span>나중에 「설정 · 백업 → 저장 위치」에서 언제든 정할 수 있어요.</span></p></div>';
  } else if (step === 'me') {
    body = head('내 정보 · 도장', '모든 문서의 「보내는 곳」에 들어가요. 상호와 사업자등록번호는 꼭 넣어 주세요') + stepsBar('me') +
      '<div class="wz-me">' + C.mePageHtml() + '</div>' +
      '<div class="wz-btns wz-sticky"><button type="button" class="btn primary big" data-act="wz-me-save">' + C.ic('check') + '저장하고 다음</button></div><p class="note" id="wzMsg" style="display:none"></p>';
  } else if (step === 'pin') {
    body = head('화면 잠금 비밀번호', '남이 화면을 못 보게 하는 비밀번호예요. PC와 휴대폰이 같은 번호를 써요') + stepsBar('pin') +
      '<div class="wz-card"><div class="fgrid one"><label class="fld"><span>비밀번호 (숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리)</span><input class="in" id="wzPinA" type="password" inputmode="numeric" maxlength="' + PIN_MAX + '" autocomplete="new-password"></label>' +
      '<label class="fld"><span>비밀번호 다시 입력</span><input class="in" id="wzPinB" type="password" inputmode="numeric" maxlength="' + PIN_MAX + '" autocomplete="new-password"></label></div>' +
      '<p class="note" id="wzMsg" style="display:none"></p>' +
      '<div class="wz-btns"><button type="button" class="btn primary big" data-act="wz-pin">' + C.ic('lock') + '비밀번호 정하기</button></div>' +
      '<p class="note">' + C.ic('alert') + '<span>정하면 <b>초기화 코드(영어 대문자 · 숫자 5자리)</b>를 한 번 보여 드려요. 비밀번호를 잊었을 때 꼭 필요하니 <b>캡처하거나 따로 적어 두세요.</b></span></p></div>';
  }
  return '<div class="setup wz"><div class="setup-card">' + body + '</div></div>';
}

const say = (t) => { const m = document.getElementById('wzMsg'); if (m) { m.style.display = 'flex'; m.innerHTML = C.ic('alert') + '<span>' + t + '</span>'; m.scrollIntoView({ block: 'nearest' }); } return false; };

export function setupClick(act) {
  if (!/^wz-/.test(act)) return false;
  if (act === 'wz-folder') { C.connectFolder(); return true; }   // 폴더를 고르면 그쪽에서 다시 그린다(자료가 있으면 확인 창)
  if (act === 'wz-folder-later') { try { localStorage.setItem(FOLDER_DONE, 'later'); } catch (e) {} C.render(); return true; }
  if (act === 'wz-me-save') {
    const m = C.S.data.me;
    if (!String(m.name || '').trim()) { say('상호(업체명)를 넣어 주세요.'); const f = document.querySelector('[data-me="name"]'); if (f) f.focus(); return true; }
    if (onlyDigits(m.bizNo).length !== 10) { say('사업자등록번호 숫자 10자리를 넣어 주세요.'); const f = document.querySelector('[data-me="bizNo"]'); if (f) f.focus(); return true; }
    C.saveNow().then(() => { C.toast('내 정보를 저장했어요'); C.render(); window.scrollTo(0, 0); });
    return true;
  }
  if (act === 'wz-pin') {
    const a = onlyDigits((document.getElementById('wzPinA') || {}).value), b = onlyDigits((document.getElementById('wzPinB') || {}).value);
    if (!validPin(a)) { say('비밀번호는 숫자 ' + PIN_MIN + '~' + PIN_MAX + '자리로 넣어 주세요.'); return true; }
    if (a !== b) { say('두 번 넣은 비밀번호가 달라요.'); return true; }
    setPin(a).then((code) => { if (C.S.data.settings.autoLockMin == null) C.S.data.settings.autoLockMin = 5; showCodeModal(code, '비밀번호를 정했어요', () => { C.render(); location.hash = '#home'; C.toast('설정을 마쳤어요 · 이제 문서를 만들 수 있어요'); }); });
    return true;
  }
  return false;
}
