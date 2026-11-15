// 문제 기록 — 프로그램에서 생긴 오류를 이 기기(localStorage)에 최근 50개까지 남긴다.
// 기록하는 것: 시각 · 종류 · 오류 글 · 위치(파일:줄) · 보던 화면 주소. 거래처 이름 · 금액 같은 자료는 넣지 않는다.
// 오류를 잡는 일은 index.html 맨 위 작은 스크립트가 먼저 시작한다(프로그램이 열리기 전 오류까지 잡으려고).
// 설정 · 백업 → 「문제 기록」에서 보고, reportText() 글을 AI(Claude · GPT)에게 붙여 넣어 고치게 한다.

const KEY = 'starmedia-quote:problems';
const MAX = 50;

const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };

/** 프로그램 코드가 직접 남기는 기록 (예: 파일 만들기 실패, 저장 실패) */
export function logProblem(kind, err, extra = '') {
  const msg = String(err && err.message || err || '').slice(0, 400);
  if (typeof window.__smProblem === 'function') { window.__smProblem(kind, msg + (extra ? ' · ' + extra : ''), '', err && err.stack); return; }
  try {
    const list = read();
    list.push({ at: new Date().toISOString(), kind, msg: msg + (extra ? ' · ' + extra : ''), where: '', stack: String(err && err.stack || '').slice(0, 900), page: location.hash || '#home' });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch (e) { /* 기록조차 못 하면 넘어간다 */ }
}
export const problems = () => read().slice().reverse(); // 최근 것부터
export function clearProblems() { try { localStorage.removeItem(KEY); } catch (e) {} }

/** 어떤 기기 · 브라우저인지 쉬운 말로 */
export function deviceText() {
  const u = navigator.userAgent;
  const os = /iPhone/.test(u) ? '아이폰' : /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? '아이패드' : /Android/.test(u) ? (/Mobile/.test(u) ? '안드로이드 폰' : '안드로이드 태블릿') : /Windows/.test(u) ? '윈도우 PC' : /Mac/.test(u) ? '맥' : '기타';
  const br = /Edg\//.test(u) ? '엣지' : /SamsungBrowser/.test(u) ? '삼성 인터넷' : /CriOS|Chrome\//.test(u) ? '크롬' : /Safari\//.test(u) ? '사파리' : /Firefox\//.test(u) ? '파이어폭스' : '기타';
  const ver = (u.match(/(?:Edg|Chrome|CriOS|Version|Firefox)\/(\d+)/) || [])[1] || '';
  return os + ' · ' + br + (ver ? ' ' + ver : '') + ' · 화면 ' + window.innerWidth + '×' + window.innerHeight;
}

/**
 * AI 에게 보낼 글: 버전 · 기기 · 저장 상태 · 자료 개수(이름 · 금액 없음) · 최근 문제.
 * info: { version, build, storage, counts, memo }
 */
export function reportText(info = {}) {
  const list = problems().slice(0, 20);
  const c = info.counts || {};
  const lines = [
    '# 스타미디어 견적서 발행기 문제 보고',
    '',
    '- 프로그램: v' + (info.version || '?') + ' (빌드 ' + (info.build || '?') + ')',
    '- 보낸 때: ' + new Date().toLocaleString('ko-KR'),
    '- 기기: ' + deviceText(),
    '- 보던 화면: ' + (location.hash || '#home'),
    '- 저장 상태: ' + (info.storage || '?'),
    '- 자료 개수: 문서 ' + (c.docs || 0) + ' · 행사 ' + (c.events || 0) + ' · 거래처 ' + (c.clients || 0) + ' · 품목 ' + (c.items || 0) + ' · 장비 ' + (c.equipment || 0) + ' · 휴지통 ' + (c.trash || 0),
    '',
    '## 무엇을 하다가 어떻게 됐나요 (직접 적어 주세요)',
    info.memo ? info.memo : '(예: 견적서에서 PDF 저장을 눌렀더니 아무 반응이 없어요)',
    '',
    '## 최근 문제 기록 (' + list.length + '개)'
  ];
  if (!list.length) lines.push('기록된 오류가 없어요.');
  list.forEach((p, i) => {
    lines.push('', (i + 1) + '. [' + new Date(p.at).toLocaleString('ko-KR') + '] ' + p.kind + ' — ' + p.msg);
    if (p.where) lines.push('   위치: ' + p.where);
    if (p.page) lines.push('   화면: ' + p.page);
    if (p.stack) lines.push('   ```', '   ' + p.stack.split('\n').slice(0, 6).join('\n   '), '   ```');
  });
  lines.push('', '(이 글에는 거래처 이름 · 금액 같은 자료가 들어 있지 않아요. 코드는 app/AGENTS.md 안내를 먼저 읽어 주세요.)');
  return lines.join('\n');
}
