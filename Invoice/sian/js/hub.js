// 시안 보는 첫 화면 (한눈에 비교 + 시안별 자세히 보기)
var THEMES = {
  a: {
    name: '블루 모던', tag: '시안 A',
    line: '흰 바탕에 스타미디어 파랑으로 선과 버튼만 짚어 주는, 깔끔하고 요즘 느낌의 시안',
    sw: [['#3A83F7', '스타 블루'], ['#172B46', '네이비'], ['#F3F6FB', '바탕'], ['#FFFFFF', '상자']],
    points: ['파랑은 버튼 · 선택된 메뉴 · 합계에만 사용', '얇은 테두리 + 부드러운 그림자로 떠 있는 상자', '문서: 위쪽 파란 띠 + 연한 파랑 표 머리', '여백이 넉넉해 가장 차분하게 읽힘'],
    chosen: true,
    changes: [
      ['장비 수정 · 삭제', '장비마다 <b>수정 · 삭제</b> 버튼, 체크해서 <b>여러 개 한꺼번에 삭제</b>. −+ 로 바꾼 수량은 <b>변경 저장</b>을 눌러야 반영되고, 수정 · 삭제 · 저장 때마다 <b>확인 창</b>이 떠요', 'pc-equip'],
      ['문서 종류 버튼', '새 문서 만들기의 견적서 · 거래명세서 · 납품ㆍ청구서 · 영수증 버튼을 고르면 <b>파란 바탕 + 흰 글자</b>', 'pc-editor'],
      ['단계 버튼 (휴대폰 · 태블릿)', '받는 곳 → 품목 넣기 → 확인 · 보내기 중 고른 단계가 <b>파란 바탕 + 흰 글자</b>. 단계를 옮겨도 문서 종류가 그대로 유지돼요', 'mobile'],
      ['선금(계약금) 켜고 끄기', '처음엔 <b>꺼짐</b>. 「선금 받기」를 켜야 금액을 넣을 수 있고, 끄면 문서에서 <b>선금 · 잔금 줄이 자동으로 빠져요</b>', 'pc-editor'],
      ['요구사항 문서 반영 (일부)', '홈 순서(새 문서 → 최근 문서 → 오늘 챙길 일 → 돈 흐름), 장비 <b>「N개 부족」</b> 표시, 품목 <b>비고</b> 칸, 휴대폰 ②단계에 특이사항, 태블릿 메뉴 이름', 'pc-home']
    ]
  },
  b: {
    name: '트리컬러 포인트', tag: '시안 B',
    line: '개발자(GONYNAS) 로고의 파랑 · 주황 · 민트를 포인트로, 문서 종류마다 색이 달라 한눈에 구분되는 시안',
    sw: [['#2B63F0', '블루'], ['#FF6A3D', '오렌지'], ['#16B985', '민트'], ['#172B46', '네이비']],
    points: ['견적서 = 파랑, 거래명세서 = 민트, 납품ㆍ청구서 = 주황, 영수증 = 네이비', '더 둥근 상자 + 색이 살짝 비치는 그림자', '문서: 위쪽 3색 띠 + 파란 표 머리 + 주황 합계', '메뉴 아이콘도 색 칩이라 찾기 쉬움']
  },
  c: {
    name: '네이비 & 골드', tag: '시안 C', rec: true,
    line: '로고의 남색으로 메뉴와 문서 머리를 잡고, 파랑은 버튼, 금색은 돈과 확인할 일에만 쓰는 추천 시안',
    sw: [['#172B46', '네이비'], ['#3A83F7', '스타 블루'], ['#F2B33D', '골드'], ['#ECF0F6', '바탕']],
    points: ['어두운 남색 메뉴라 글자 대비가 가장 커서 50대 눈에 잘 보임', '금색은 「돈 · 확인할 일」에만 → 어디를 봐야 할지 바로 앎', '겹친 그림자로 세 시안 중 가장 입체적인 상자', '문서: 로고의 기울어진 모양을 남색 머리 띠로 · 관공서 제출용 무게감']
  }
};

var VIEWS = [
  ['pc-home', 'PC 첫 화면'], ['pc-editor', 'PC 문서 작성'], ['pc-event', '행사 · 입금 (보완)'], ['pc-equip', '장비 관리'], ['pc-me', '내 정보 · 업체명 2줄'], ['mobile', '휴대폰 · 태블릿'],
  ['quote', '견적서'], ['stmt', '거래명세서'], ['inv', '납품ㆍ청구서'], ['rcpt', '영수증']
];

function fr(theme, page, extra) { return 'index.html?frame=1&t=' + theme + '&page=' + page + (extra || ''); }

function browserFrame(src, w, h, title) {
  return '<div class="fit" data-w="' + w + '" data-h="' + (h + 38) + '"><div class="fit-inner" style="width:' + w + 'px">' +
    '<div class="browser"><div class="br-bar"><i></i><i></i><i></i><span>스타미디어 견적서 발행기</span></div>' +
    '<iframe src="' + src + '" width="' + w + '" height="' + h + '" loading="lazy" title="' + title + '"></iframe></div></div></div>';
}

function phoneFrame(src, title, label) {
  return '<figure class="dev-cell"><div class="fit" data-w="414" data-h="868" data-max="0.62"><div class="fit-inner" style="width:414px">' +
    '<div class="phone"><span class="notch"></span><iframe src="' + src + '" width="390" height="844" loading="lazy" title="' + title + '"></iframe></div></div></div>' +
    '<figcaption>' + label + '</figcaption></figure>';
}

function tabletFrame(src, title) {
  return '<figure class="dev-cell wide"><div class="fit" data-w="844" data-h="1204" data-max="0.5"><div class="fit-inner" style="width:844px">' +
    '<div class="tablet"><iframe src="' + src + '" width="820" height="1180" loading="lazy" title="' + title + '"></iframe></div></div></div>' +
    '<figcaption>태블릿 (세로) · 첫 화면 — 메뉴가 아이콘 줄로 접혀요</figcaption></figure>';
}

function docFrame(kind, theme, max) {
  return '<div class="fit doc-fit" data-w="794" data-h="auto"' + (max ? ' data-max="' + max + '"' : '') + '><div class="fit-inner" style="width:794px">' + renderDoc(kind, theme) + '</div></div>';
}

function swatches(t) {
  return '<ul class="swatch">' + t.sw.map(function (s) { return '<li><i style="background:' + s[0] + '"></i><span>' + s[1] + '<small>' + s[0] + '</small></span></li>'; }).join('') + '</ul>';
}

function hubHeader(route) {
  var on = function (k) { return route.charAt(0) === k && route !== 'overview'; };
  var nav = '<a href="#a/pc-home" class="' + (on('a') ? 'on' : '') + '"><i class="dotc d-a"></i>시안 A 블루 모던 <em class="sel">선택 · 3차</em></a>' +
    '<a href="#overview" class="' + (route === 'overview' ? 'on' : '') + '">1차 3가지 비교</a>' +
    ['b', 'c'].map(function (k) {
      return '<a href="#' + k + '/pc-home" class="old ' + (on(k) ? 'on' : '') + '"><i class="dotc d-' + k + '"></i>' + THEMES[k].tag + ' ' + THEMES[k].name + ' <small>(1차)</small></a>';
    }).join('');
  return '<header class="hub-top"><div class="hub-in"><img class="hub-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사">' +
    '<div class="hub-tt"><h1>견적서 발행기 디자인 시안 <span>3차</span></h1><p>고르신 <b>시안 A 블루 모던</b>에 3차 수정사항을 반영했어요 — 예시 자료로 채운 화면이에요</p></div>' +
    '<div class="hub-date">2026. 11. 13<br><small>Claude Code 작성</small></div></div>' +
    '<nav class="hub-nav"><div class="hub-in">' + nav + '</div></nav></header>';
}

function overview() {
  var cards = ['a', 'b', 'c'].map(function (k) {
    var t = THEMES[k];
    return '<article class="ov-card ov-' + k + (t.rec ? ' rec' : '') + '">' +
      '<div class="ov-h"><span class="ov-tag">' + t.tag + '</span>' + (t.rec ? '<span class="ov-rec">' + ic('star') + '추천</span>' : '') + '<h2>' + t.name + '</h2><p>' + t.line + '</p>' + swatches(t) + '</div>' +
      '<div class="ov-shot"><h3>프로그램 첫 화면</h3>' + browserFrame(fr(k, 'home'), 1280, 820, t.tag + ' 첫 화면') + '</div>' +
      '<div class="ov-shot"><h3>견적서</h3>' + docFrame('quote', k) + '</div>' +
      '<a class="ov-go" href="#' + k + '/pc-home">' + t.tag + ' 자세히 보기' + ic('arrowRight') + '</a></article>';
  }).join('');
  return '<section class="hub-intro"><div class="hub-in">' +
    '<div class="howto"><h2>보시는 방법</h2><ol>' +
    '<li><b>한눈에 비교</b>에서 세 시안의 분위기를 먼저 봐 주세요.</li>' +
    '<li>위쪽 <b>시안 A · B · C</b>를 누르면 PC 화면, 문서 작성, 휴대폰 · 태블릿, 문서 4가지를 하나씩 볼 수 있어요.</li>' +
    '<li>화면 속 버튼도 눌러 보세요. 품목 숫자를 고치면 미리보기와 합계가 바로 바뀌고, 왼쪽 손잡이로 줄 순서를 바꿀 수 있어요.</li>' +
    '<li><b>섞어서 골라도 돼요.</b> 예: 프로그램 화면은 C, 견적서는 A, 거래명세서는 B.</li></ol>' +
    '<p class="howto-note">' + ic('alert') + '<span>사업자번호 · 계좌 · 도장은 모두 <b>예시</b>예요. 실제 정보는 프로그램을 처음 열 때 한 번 넣어요.</span></p></div>' +
    '</div></section>' +
    '<section class="hub-in ov">' + cards + '</section>';
}

function themeView(k, view) {
  var t = THEMES[k], body = '';
  if (view === 'pc-home') body = '<p class="vh">PC(노트북) 첫 화면 — 새 문서 만들기, 오늘 챙길 일, 이번 달 돈 흐름, 최근 문서를 한 화면에. 화면 안에서 위아래로 넘겨 보세요.</p>' + browserFrame(fr(k, 'home'), 1280, 860, t.tag + ' PC 첫 화면');
  else if (view === 'pc-editor') body = '<p class="vh">PC 문서 작성 — 왼쪽에서 입력하면 오른쪽 A4 미리보기가 바로 바뀌어요. 위쪽에서 문서 종류를 바꿔 보세요.</p>' + browserFrame(fr(k, 'editor'), 1280, 900, t.tag + ' PC 문서 작성');
  else if (view === 'pc-event') body = '<p class="vh">보완 시안 — 행사 한 건에 묶인 문서(계약 기준 수정본 표시), 최종 합의금액과 끝자리 정리, 입금 여러 번 · 취소 표시, 완납해야 만들 수 있는 영수증, 저장 상태 · 충돌 예시. 금액을 바꾸거나 입금을 추가해 보세요.</p>' + browserFrame(fr(k, 'event'), 1280, 900, t.tag + ' 행사 · 입금');
  else if (view === 'pc-equip') body = '<p class="vh">장비 관리 — 천막 · 테이블 같은 장비를 등록하고 총수량을 − + 로 고쳐요. 위쪽에서 날짜를 고르면 그날 나가는 수량과 남는 수량이 바뀌어요. 오른쪽에서 새 장비를 등록해 보세요.</p>' + browserFrame(fr(k, 'equip'), 1280, 900, t.tag + ' 장비 관리');
  else if (view === 'pc-me') body = '<p class="vh">내 정보 · 도장 — 상호(업체명) 칸에서 <b>엔터</b>를 누르면 다음 줄로 넘어가요(2줄까지). 고치는 대로 오른쪽 「문서에 이렇게 보여요」가 바로 바뀌어요. 도장 크기도 조절해 보세요.</p>' + browserFrame(fr(k, 'me'), 1280, 900, t.tag + ' 내 정보');
  else if (view === 'mobile') body = '<p class="vh">아이폰 — 아래 큰 메뉴 5칸(장비 관리 · 내 정보는 「더보기」 안), 문서는 3단계(① 받는 곳 → ② 품목 → ③ 확인 · 보내기)로 만들어요. 각 화면 안에서 눌러 볼 수 있어요.</p>' +
    '<div class="devs">' + phoneFrame(fr(k, 'home'), '휴대폰 첫 화면', '① 첫 화면') + phoneFrame(fr(k, 'editor', '&step=1'), '휴대폰 문서 작성 1단계', '② 문서 만들기 · 받는 곳') +
    phoneFrame(fr(k, 'editor', '&step=2'), '휴대폰 문서 작성 2단계', '③ 품목 넣기 (손잡이로 순서 바꾸기)') + phoneFrame(fr(k, 'editor', '&step=3'), '휴대폰 문서 작성 3단계', '④ 확인 · PDF · 이미지 · 카톡') +
    phoneFrame(fr(k, 'equip'), '휴대폰 장비 관리', '⑤ 장비 관리 (더보기 안)') + phoneFrame(fr(k, 'me'), '휴대폰 내 정보', '⑥ 내 정보 · 업체명 2줄') +
    phoneFrame(fr(k, 'lock'), '휴대폰 잠금 화면', '⑦ 잠금 화면 (숫자 비밀번호)') + '</div>' +
    '<div class="devs">' + tabletFrame(fr(k, 'home'), '태블릿 첫 화면') + '</div>';
  else {
    var notes = {
      quote: '견적서 — 받는 곳 · 행사 정보 · 공급자 표 → 합계금액(한글) → 품목표 → 특이사항과 합계 → 맨 아래 가운데 로고',
      stmt: '거래명세서 — A4 한 장에 2부(공급받는자 / 공급자 보관용), 전잔액 · 입금액 · 잔액, 인수자 서명. 로고는 넣지 않아요.',
      inv: '납품ㆍ청구서 — 견적서 틀에 입금 기한과 입금 계좌 상자를 크게. 선금을 뺀 「이번에 청구하는 금액」을 강조해요.',
      rcpt: '영수증 — 「입금 완료」 문서에서 바로 만들어요. 받은 금액 · 받은 날짜 · 결제 방법 · 「위 금액을 정히 영수합니다」. (확정된 견적서 시안을 따라가요)'
    };
    body = '<p class="vh">' + notes[view] + '</p><div class="paper">' + docFrame(view, k, 1) + '</div>';
  }
  var tabs = VIEWS.map(function (v) { return '<a href="#' + k + '/' + v[0] + '" class="' + (v[0] === view ? 'on' : '') + '">' + v[1] + '</a>'; }).join('');
  var badge = t.chosen ? '<span class="ov-sel">' + ic('check') + '선택한 시안</span>' : (t.rec ? '<span class="ov-rec">' + ic('star') + '1차 추천</span>' : '');
  var changes = t.changes ? '<div class="tv-changes"><h3>' + ic('check') + '3차에서 고친 점 <small>(2차 시안 수정사항 + 최종 요구사항 문서)</small></h3><ol>' + t.changes.map(function (c) {
    return '<li><a href="#' + k + '/' + c[2] + '"><b>' + c[0] + '</b><span>' + c[1] + '</span></a></li>';
  }).join('') + '</ol></div>' : '';
  return '<section class="hub-in tv tv-' + k + '">' +
    '<div class="tv-head"><div><span class="ov-tag">' + t.tag + '</span>' + badge + '<h2>' + t.name + '</h2><p>' + t.line + '</p></div>' + swatches(t) + '</div>' +
    changes +
    '<ul class="tv-points">' + t.points.map(function (p) { return '<li>' + ic('check') + p + '</li>'; }).join('') + '</ul>' +
    '<nav class="tv-tabs" aria-label="보기 고르기">' + tabs + '</nav>' +
    '<div class="tv-body">' + body + '</div></section>';
}

function hubFoot() {
  return '<footer class="hub-foot"><div class="hub-in"><p>2차 시안을 보시고 고칠 점을 알려 주세요. 이대로 좋으면 「확정」이라고만 말씀해 주시면 1단계 코딩을 시작해요.</p>' +
    '<span class="credit-s"><img src="assets/gonynas-logo.jpg" alt="">Developed by <b>GONYNAS</b> · v1.0</span></div></footer>';
}

function renderHub(route) {
  if (route !== 'overview' && !THEMES[route.split('/')[0]]) route = 'a/pc-home';
  var parts = route.split('/'), k = parts[0], v = parts[1] || 'pc-home';
  var main = THEMES[k] ? themeView(k, VIEWS.some(function (x) { return x[0] === v; }) ? v : 'pc-home') : overview();
  return hubHeader(THEMES[k] ? route : 'overview') + '<main class="hub-main">' + main + '</main>' + hubFoot();
}
