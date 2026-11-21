// 휴대폰 · 태블릿에서 처음 열 때: 「바탕화면(홈 화면)에 아이콘 만들기」 안내를 가장 먼저 보여 준다.
//  · 카카오톡 · 네이버 · 인스타그램 같은 앱 안 브라우저면: 아이콘 만들기 · 파일 저장이 안 되므로 먼저 Safari/Chrome 으로 내보낸다.
//      카카오톡은 kakaotalk://web/openExternal 로 바로 바깥 브라우저(아이폰 Safari · 안드로이드 기본 브라우저)를 연다.
//  · 안드로이드 Chrome: 브라우저가 주는 설치 창(beforeinstallprompt)을 단추 하나로 띄운다.
//  · 아이폰 · 아이패드: 프로그램이 대신 아이콘을 만들 수는 없어서(애플 정책) 그림 단계로 안내한다.
//  이미 설치한 앱으로 열었거나 「나중에」를 눌렀으면 다시 띄우지 않는다. 설정 → 화면에서 언제든 다시 열 수 있다.
let C, deferred = null;
const SEEN = 'starmedia-quote:installSeen';
const UA = () => navigator.userAgent || '';
export const isIOS = () => /iPhone|iPad|iPod/.test(UA()) || (/Macintosh/.test(UA()) && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/.test(UA());
export const inKakao = () => /KAKAOTALK/i.test(UA());
export const inAppBrowser = () => inKakao() || /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(UA());
export const isStandalone = () => !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone);
const isPhoneOrTablet = () => isIOS() || isAndroid() || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches);

export function initInstall(ctx) {
  C = ctx;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; const b = document.getElementById('instNative'); if (b) b.hidden = false; });
  window.addEventListener('appinstalled', () => { try { localStorage.setItem(SEEN, 'installed'); } catch (e) {} close(); C.toast('바탕화면에 아이콘을 만들었어요'); });
  document.addEventListener('click', onClick, true);
}
/** 처음 열 때 보여 줄까 */
export function shouldShowInstall() {
  if (isStandalone() || !isPhoneOrTablet()) return false;
  if (inAppBrowser()) return true;                       // 앱 안 브라우저면 매번 알려 준다(여기선 저장 · 설치가 안 됨)
  try { return !localStorage.getItem(SEEN); } catch (e) { return true; }
}

const step = (n, html) => '<li><span class="in-n">' + n + '</span><span>' + html + '</span></li>';
function bodyHtml() {
  const url = location.href.split('#')[0];
  if (inAppBrowser()) {
    const kakao = inKakao();
    const ext = kakao ? 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
      : isAndroid() ? 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;end' : url;   // 크롬을 정하지 않고 휴대폰 기본 브라우저로
    return '<h2>' + (kakao ? '카카오톡' : '앱') + ' 안에서 열렸어요</h2>' +
      '<p>여기서는 <b>바탕화면 아이콘 만들기</b>와 <b>PDF · 이미지 저장</b>이 잘 안 돼요. ' + (isIOS() ? 'Safari' : '휴대폰의 인터넷 브라우저') + '로 열어 주세요.</p>' +
      (kakao || isAndroid() ? '<a class="btn primary big wide" href="' + C.esc(ext) + '" data-inst="ext">' + C.ic('share') + (isIOS() ? 'Safari로 열기' : '인터넷 브라우저로 열기') + '</a>' : '') +
      '<ol class="in-steps">' + (kakao ? step(1, '단추가 안 되면 오른쪽 위(또는 아래) <b>⋯ 메뉴</b> → <b>「다른 브라우저로 열기」</b>') : step(1, '오른쪽 위 <b>⋯ 메뉴</b> → <b>「다른 브라우저로 열기」</b>')) +
      step(2, '열린 ' + (isIOS() ? 'Safari' : '브라우저') + '에서 바탕화면 아이콘을 만들면 다음부터 아이콘으로 바로 열려요') + '</ol>' +
      '<button type="button" class="btn ghost wide" data-inst="copy">' + C.ic('copy') + '주소 복사하기</button>';
  }
  if (isIOS()) {
    const chrome = /CriOS/.test(UA());
    return '<h2>바탕화면에 아이콘 만들기</h2><p>한 번만 해 두면 다음부터 <b>아이콘을 눌러 앱처럼</b> 바로 열려요.</p>' +
      '<ol class="in-steps">' +
      step(1, chrome ? '주소창 오른쪽 <b>공유 단추</b> ' + C.ic('upload') + '를 눌러요' : '화면 아래(또는 주소창 옆)의 <b>공유 단추</b> ' + C.ic('upload') + '를 눌러요') +
      step(2, '목록을 내려 <b>「홈 화면에 추가」</b>를 눌러요') +
      step(3, '오른쪽 위 <b>「추가」</b>를 누르면 바탕화면에 <b>견적서</b> 아이콘이 생겨요') + '</ol>' +
      '<p class="note">' + C.ic('alert') + '<span>아이폰은 애플 정책 때문에 프로그램이 대신 아이콘을 만들 수 없어요. <mark class="hl-g">위 3단계만</mark> 해 주세요.</span></p>';
  }
  return '<h2>바탕화면에 아이콘 만들기</h2><p>한 번만 해 두면 다음부터 <b>아이콘을 눌러 앱처럼</b> 바로 열려요.</p>' +
    '<button type="button" class="btn primary big wide" id="instNative" data-inst="native"' + (deferred ? '' : ' hidden') + '>' + C.ic('download') + '바탕화면에 아이콘 만들기</button>' +
    '<ol class="in-steps">' + step(1, '단추가 안 보이면 Chrome 오른쪽 위 <b>⋮ 메뉴</b>를 눌러요') + step(2, '<b>「홈 화면에 추가」</b> 또는 <b>「앱 설치」</b>를 눌러요') + step(3, '<b>「설치」 · 「추가」</b>를 누르면 바탕화면에 아이콘이 생겨요') + '</ol>';
}
export function openInstall() {
  let el = document.getElementById('installScreen');
  if (!el) { el = document.createElement('div'); el.id = 'installScreen'; el.className = 'installscreen'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '바탕화면 아이콘 만들기'); document.body.appendChild(el); }
  el.innerHTML = '<div class="in-card"><img class="in-icon" src="assets/starmedia-192.png" alt="" width="72" height="72"><span class="in-app">스타미디어 견적서 발행기</span>' + bodyHtml() +
    '<button type="button" class="in-later" data-inst="later">나중에 할게요 · 브라우저에서 계속</button></div>';
}
function close() { const el = document.getElementById('installScreen'); if (el) el.remove(); }
async function onClick(e) {
  const b = e.target.closest('[data-inst]'); if (!b) return;
  const k = b.dataset.inst;
  if (k === 'ext') return;   // 링크가 바깥 브라우저를 연다
  e.preventDefault(); e.stopPropagation();
  if (k === 'later') { try { localStorage.setItem(SEEN, 'later'); } catch (err) {} close(); return; }
  if (k === 'native' && deferred) { deferred.prompt(); const r = await deferred.userChoice.catch(() => null); deferred = null; if (r && r.outcome === 'accepted') { try { localStorage.setItem(SEEN, 'installed'); } catch (err) {} close(); } return; }
  if (k === 'copy') {
    const url = location.href.split('#')[0];
    try { await navigator.clipboard.writeText(url); C.toast('주소를 복사했어요. Safari · Chrome 주소창에 붙여 넣어 주세요'); }
    catch (err) { C.toast(url); }
  }
}
