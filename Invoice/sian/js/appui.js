// 프로그램 화면 시안: 첫 화면(home) · 문서 작성(editor) · 잠금(lock)
var UI = { kind: 'quote', theme: 'a' };

function devIcon(d) {
  if (d === 'pc>phone') return '<span class="dev-ic" title="PC에서 만들고 폰에서 고침">' + ic('monitor') + '<i>›</i>' + ic('phone', 'sm') + '</span>';
  var map = { pc: ['monitor', 'PC'], phone: ['phone', '폰'], tablet: ['tablet', '태블릿'] }[d];
  return '<span class="dev-ic" title="' + map[1] + '에서 만듦">' + ic(map[0]) + '<em>' + map[1] + '</em></span>';
}

function typeChip(type) { return '<span class="tchip t-' + type + '">' + ic(TYPES[type].icon) + TYPES[type].label + '</span>'; }
function statusChip(s) { return '<span class="schip s-' + s + '">' + STATUS[s] + '</span>'; }

function appSidebar(page) {
  // [화면 이름, 메뉴 글자, 아이콘, 시안에서 열리는 화면인지]
  var items = [
    ['home', '홈', 'home', true], ['list', '발행 목록', 'list'], ['event', '행사 · 입금', 'won', true], ['users', '거래처', 'users'],
    ['items', '품목 · 세트', 'layers'], ['equip', '장비 관리', 'tent', true], ['money', '매출 · 미수금', 'chart'],
    ['cal', '행사 달력', 'calendar'], ['trash', '휴지통', 'trash'], ['me', '내 정보 · 도장', 'user', true], ['set', '설정 · 백업', 'sliders']
  ];
  var cur = page === 'editor' ? '' : page;
  var nav = items.map(function (it, i) {
    var href = it[3] ? '?frame=1&t=' + UI.theme + '&page=' + it[0] : '#';
    return '<a href="' + href + '" class="' + (it[0] === cur ? 'on' : '') + '"' + (it[3] ? '' : ' data-toast') + (it[0] === cur ? ' aria-current="page"' : '') + '><span class="nchip n' + (i % 3) + '">' + ic(it[2]) + '</span><span class="lbl">' + it[1] + '</span>' + (it[0] === 'list' ? '<em class="cnt">7</em>' : '') + (it[0] === 'equip' ? '<em class="cnt new">NEW</em>' : '') + '</a>';
  }).join('');
  return '<aside class="side">' +
    '<div class="side-logo"><img class="full" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><img class="mark" src="assets/star-icon.svg" alt=""></div>' +
    '<a href="?frame=1&t=' + UI.theme + '&page=editor" class="side-new">' + ic('plus') + '<span class="lbl">새 문서 만들기</span></a>' +
    '<nav class="nav">' + nav + '</nav>' +
    '<div class="side-bottom"><div class="sync">' + ic('cloud') + '<span class="lbl"><b>구글 드라이브</b><small>이 기기에 저장됨 · 구글 연결은 2단계</small></span></div>' +
    '<button class="lockbtn" data-act="lock">' + ic('lock') + '<span class="lbl">화면 잠금</span></button></div>' +
    '</aside>';
}

function appTop(page) {
  var back = '<a class="back" href="?frame=1&t=' + UI.theme + '&page=home" aria-label="홈으로">' + ic('left') + '</a>';
  var titles = {
    editor: back + '<div><h1>새 문서 만들기</h1><p>입력하면 오른쪽 미리보기가 바로 바뀌고, 저절로 저장돼요</p></div>',
    equip: back + '<div><h1>장비 관리</h1><p>가진 장비와 총 수량을 등록하고, 날짜별로 몇 개가 나가는지 확인해요</p></div>',
    event: back + '<div><h1>행사 · 입금</h1><p>행사 한 건에 묶인 문서와 입금을 한곳에서 봐요 (보완 시안)</p></div>',
    me: back + '<div><h1>내 정보 · 도장</h1><p>여기 넣은 정보가 모든 문서의 「보내는 곳」에 들어가요</p></div>'
  };
  var title = titles[page] || '<div><h1>안녕하세요, 대표님</h1><p>2026년 11월 12일 목요일 · 확인할 일이 <b>3건</b> 있어요</p></div>';
  return '<header class="top"><img class="top-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사"><div class="top-title">' + title + '</div>' +
    '<label class="search">' + ic('search') + '<input type="search" placeholder="문서 · 거래처 · 받는 사람 이름 검색"></label>' +
    '<div class="top-tools">' +
    '<button class="tool txt" data-act="font">' + ic('type') + '<span>글자 크게</span></button>' +
    '<button class="tool" data-toast aria-label="알림">' + ic('bell') + '<i class="dot">3</i></button>' +
    '<button class="tool" data-act="lock" aria-label="화면 잠금">' + ic('lock') + '</button>' +
    '</div></header>';
}

function homeNewDocs() {
  var tiles = ['quote', 'stmt', 'inv', 'rcpt'].map(function (k) {
    return '<a class="tile t-' + k + '" href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + k + '"><span class="tile-ic">' + ic(TYPES[k].icon) + '</span><b>' + TYPES[k].label + '</b><small>' + TYPES[k].desc + '</small><span class="tile-go">' + ic('arrowRight') + '</span></a>';
  }).join('');
  return '<section class="card c-new"><div class="card-h"><h2>새 문서 만들기</h2><span class="hint">만들 문서를 누르세요</span></div><div class="tiles">' + tiles + '</div></section>';
}

function homeTodo() {
  return '<section class="todo">' +
    '<article class="card tcard warn"><div class="tc-h"><span class="tc-ic">' + ic('clock') + '</span><h3>만료가 가까운 견적</h3></div><div class="tc-big"><b>2</b>건</div>' +
    '<ul><li><span>(주)한빛건설 · 준공식</span><em>3일 남음</em></li><li><span>○○리조트 · 송년회</span><em>5일 남음</em></li></ul><button class="mini" data-toast>견적 다시 보내기</button></article>' +
    '<article class="card tcard danger"><div class="tc-h"><span class="tc-ic">' + ic('alert') + '</span><h3>입금 기한 지난 청구서</h3></div><div class="tc-big"><b>1</b>건 <small class="num">1,320,000원</small></div>' +
    '<ul><li><span>○○초등학교 · 가을 운동회</span><em>11일 지남</em></li></ul><button class="mini" data-toast>' + ic('check') + '입금 확인했어요</button></article>' +
    '<article class="card tcard info"><div class="tc-h"><span class="tc-ic">' + ic('calendar') + '</span><h3>이번 주 행사</h3></div><div class="tc-big"><b>2</b>건</div>' +
    '<ul><li><span>11/21(토) 가을 별빛축제</span><em>천막 13동</em></li><li><span>11/22(일) 가을 별빛축제</span><em>2일차</em></li></ul><button class="mini" data-toast>달력으로 보기</button></article>' +
    '</section>';
}

function homeMoney() {
  var max = Math.max.apply(null, MONTHS.map(function (m) { return m.v; }));
  var bars = MONTHS.map(function (m, i) {
    return '<div class="bar' + (i === MONTHS.length - 1 ? ' now' : '') + '"><em class="num">' + Calc.won(m.v) + '</em><i style="height:' + Math.round(m.v / max * 100) + '%"></i><span>' + m.m + '</span></div>';
  }).join('');
  var top = TOP_CLIENTS.map(function (c, i) {
    return '<li><span class="rk">' + (i + 1) + '</span><span class="nm">' + c.name + '</span><b class="num">' + Calc.won(c.v) + '만</b></li>';
  }).join('');
  return '<section class="card c-money"><div class="card-h"><h2>이번 달 돈 흐름</h2><span class="hint">11월 1일 ~ 오늘</span></div>' +
    '<div class="kpis">' +
    '<div class="kpi k1"><div class="kl"><span>' + ic('won') + '이번 달 매출</span><em>입금 완료 기준 · 11월 진행 중</em></div><b class="num">12,430,000<small>원</small></b></div>' +
    '<div class="kpi k2"><div class="kl"><span>' + ic('clock') + '받을 돈 (미수금)</span><em>4건 · 선금 1,155,000원 받음</em></div><b class="num">8,640,000<small>원</small></b></div>' +
    '<div class="kpi k3"><div class="kl"><span>' + ic('tax') + '세금계산서 안 끊은 문서</span><em>홈택스에서 발행하면 체크</em></div><b class="num">2<small>건</small></b></div>' +
    '</div></section>' +
    '<section class="card c-chart"><div class="card-h"><h2>월별 매출</h2><span class="hint">단위: 만 원</span></div><div class="bars">' + bars + '</div>' +
    '<div class="topc"><h4>거래처별 매출 (올해)</h4><ol>' + top + '</ol></div></section>';
}

function homeRecent() {
  var rows = RECENT.map(function (r) {
    return '<tr class="' + (r.status === 'cancel' ? 'is-cancel' : '') + '"><td>' + devIcon(r.dev) + '</td><td>' + typeChip(r.type) + '</td><td class="no num">' + r.no + '</td>' +
      '<td class="cl"><b>' + r.client + '</b><small>' + r.event + '</small></td><td class="num">' + r.when + '</td><td class="r num amt">' + Calc.won(r.amount) + '</td>' +
      '<td>' + statusChip(r.status) + '</td><td class="c">' + (r.tax ? '<span class="taxok">' + ic('check') + '발행</span>' : '<span class="taxno">미발행</span>') + '</td>' +
      '<td class="c"><button class="icbtn" data-toast aria-label="더보기">' + ic('more') + '</button></td></tr>';
  }).join('');
  var cards = RECENT.map(function (r) {
    return '<li class="rc ' + (r.status === 'cancel' ? 'is-cancel' : '') + '"><div class="rc-top">' + devIcon(r.dev) + typeChip(r.type) + statusChip(r.status) + '</div>' +
      '<div class="rc-mid"><b>' + r.client + '</b><span class="num amt">' + Calc.won(r.amount) + '원</span></div>' +
      '<div class="rc-bot"><span>' + r.event + ' · ' + r.when + '</span><span class="num">' + r.no + '</span></div></li>';
  }).join('');
  var filters = ['전체', '견적서', '거래명세서', '납품ㆍ청구서', '영수증'].map(function (f, i) { return '<button class="fchip' + (i ? '' : ' on') + '" data-toast>' + f + '</button>'; }).join('');
  return '<section class="card c-recent"><div class="card-h"><h2>최근 문서</h2><div class="fchips">' + filters + '</div><a class="more" href="#" data-toast>전체 보기' + ic('right') + '</a></div>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>만든 곳</th><th>종류</th><th>문서번호</th><th>받는 곳 · 행사</th><th>행사일</th><th class="r">합계금액</th><th>진행 상태</th><th class="c">세금계산서</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<ul class="rcards">' + cards + '</ul></section>';
}

function homePage() {
  return '<div class="home">' + homeNewDocs() + homeRecent() + homeTodo() + homeMoney() + '</div>';
}

/* ── 문서 작성 ── */
function field(label, value, cls, extra) {
  return '<label class="fld ' + (cls || '') + '"><span>' + label + '</span><input class="in" value="' + esc(value) + '"' + (extra || '') + '></label>';
}

function lineCard(l, i) {
  var r = Calc.line(l, DOC.vat);
  return '<div class="line" data-i="' + i + '">' +
    '<button class="grip" aria-label="꾹 눌러 끌어서 순서 바꾸기" title="꾹 눌러 끌어서 순서 바꾸기">' + ic('grip') + '</button>' +
    '<div class="line-main">' +
    '<div class="line-top"><span class="line-no">' + (i + 1) + '</span><input class="in nm" data-f="name" value="' + esc(l.name) + '" aria-label="품목"><input class="in sp" data-f="spec" value="' + esc(l.spec) + '" placeholder="규격" aria-label="규격"><input class="in mm" data-f="memo" value="' + esc(l.memo || '') + '" placeholder="비고" aria-label="비고"></div>' +
    '<div class="line-nums">' +
    '<label class="nb"><span>일수</span><input class="in num" data-f="days" inputmode="decimal" value="' + Calc.num(l.days) + '"></label><span class="op">×</span>' +
    '<label class="nb"><span>수량</span><input class="in num" data-f="qty" inputmode="numeric" value="' + Calc.num(l.qty) + '"></label><span class="op">×</span>' +
    '<label class="nb w"><span>단가</span><input class="in num" data-f="price" inputmode="numeric" value="' + Calc.won(l.price) + '"></label>' +
    '</div></div>' +
    '<div class="line-amt"><span>공급가액</span><b class="num">' + Calc.won(r.supply) + '</b><small>세액 <span class="num">' + Calc.won(r.tax) + '</span></small></div>' +
    '<button class="del" aria-label="이 줄 지우기" data-toast>' + ic('x') + '</button>' +
    '</div>';
}

function edTotals() {
  var t = Calc.totals(DOC);
  return '<div class="ed-sum"><div><span>공급가액</span><b class="num">' + Calc.won(t.supply) + '</b></div><div><span>부가세</span><b class="num">' + Calc.won(t.tax) + '</b></div><div class="g"><span>총 합계</span><b class="num">₩' + Calc.won(t.total) + '</b></div>' +
    (DOC.depositOn ? '<div class="bal"><span>선금 뺀 잔금</span><b class="num">₩' + Calc.won(t.balance) + '</b></div>' : '') + '</div>';
}

function seg(name, opts, cur) {
  return '<div class="seg" role="radiogroup" data-seg="' + name + '">' + opts.map(function (o) {
    return '<button role="radio" aria-checked="' + (o[0] === cur) + '" class="' + (o[0] === cur ? 'on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>';
  }).join('') + '</div>';
}

function editorPage(step) {
  var kinds = [['quote', '견적서'], ['stmt', '거래명세서'], ['inv', '납품ㆍ청구서'], ['rcpt', '영수증']];
  var statusOpts = Object.keys(STATUS).filter(function (k) { return k !== 'overdue'; }).map(function (k) { return '<option' + (k === DOC.status ? ' selected' : '') + '>' + STATUS[k] + '</option>'; }).join('');
  var lines = DOC.lines.map(lineCard).join('');
  var phrases = PHRASES.map(function (p, i) { return '<button class="pchip' + (i < 2 ? ' on' : '') + '" data-toast>' + (i < 2 ? ic('check') : ic('plus')) + p + '</button>'; }).join('');
  var steps = [['1', '받는 곳'], ['2', '품목 넣기'], ['3', '확인 · 보내기']].map(function (s) {
    return '<a href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + UI.kind + '&step=' + s[0] + '" class="' + (+s[0] === step ? 'on' : (+s[0] < step ? 'done' : '')) + '"><i>' + (+s[0] < step ? '✓' : s[0]) + '</i><span>' + s[1] + '</span></a>';
  }).join('');
  var next = step < 3
    ? '<a class="btn primary big" href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + UI.kind + '&step=' + (step + 1) + '">다음 : ' + (step === 1 ? '품목 넣기' : '확인 · 보내기') + ic('arrowRight') + '</a>'
    : '<button class="btn primary big" data-toast>' + ic('chat') + '카톡 보내기</button>';
  var prev = step > 1 ? '<a class="btn ghost big" href="?frame=1&t=' + UI.theme + '&page=editor&kind=' + UI.kind + '&step=' + (step - 1) + '">' + ic('left') + '이전</a>' : '';

  return '<div class="ed" data-step="' + step + '">' +
    '<nav class="steps" aria-label="작성 단계">' + steps + '</nav>' +
    '<div class="ed-bar card">' +
    '<div class="ed-bar-l">' + seg('kind', kinds, UI.kind) + '</div>' +
    '<div class="ed-bar-r"><label class="status-sel"><span>진행 상태</span><select class="in">' + statusOpts + '</select></label>' +
    '<div class="menu"><button class="btn" data-menu>' + ic('download') + '파일로 저장' + ic('down') + '</button><div class="menu-pop"><button data-toast>' + ic('table') + '엑셀 (.xlsx)</button><button data-toast>' + ic('pdf') + 'PDF</button><button data-toast>' + ic('image') + '이미지 (JPG)</button></div></div>' +
    '<button class="btn" data-toast>' + ic('print') + '인쇄</button>' +
    '<div class="menu"><button class="btn primary" data-menu>' + ic('share') + '보내기' + ic('down') + '</button><div class="menu-pop right"><button data-toast>' + ic('chat') + '카톡 (이미지 복사)</button><button data-toast>' + ic('mail') + '메일 (Gmail 쓰기 창)</button></div></div>' +
    '</div></div>' +
    '<div class="ed-cols"><div class="ed-form">' +
    '<section class="card" data-s="1"><div class="card-h"><h2><span class="sn">1</span>받는 곳</h2><span class="hint">거래처를 고르면 담당자·연락처가 채워져요</span></div><div class="fgrid">' +
    '<label class="fld span2"><span>거래처 (받는 곳)</span><div class="combo"><input class="in" value="' + esc(DOC.client.name) + '">' + ic('down') + '</div></label>' +
    field('담당자', DOC.client.person) + field('연락처', DOC.client.tel, 'num') + field('문서 날짜', '2026-11-12', '', ' type="date"') + field('유효기간 (일)', DOC.valid, '', ' inputmode="numeric"') +
    '</div></section>' +
    '<section class="card" data-s="1"><div class="card-h"><h2><span class="sn ev">' + ic('star') + '</span>행사 정보</h2><span class="hint">비워 두면 문서에서 자동으로 숨겨요</span></div><div class="fgrid">' +
    field('행사명', DOC.event.name, 'span2') + field('행사 일정', DOC.event.date) + field('행사 장소', DOC.event.place) +
    '</div></section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn">2</span>품목</h2><div class="tools"><button class="btn sm" data-toast>' + ic('layers') + '세트 넣기</button><button class="btn sm" data-toast>' + ic('list') + '목록에서 고르기</button><button class="btn sm" data-toast>' + ic('table') + '엑셀 붙여넣기</button></div></div>' +
    '<p class="note">' + ic('grip') + '왼쪽 손잡이를 꾹 누른 채 위아래로 끌면 순서가 바뀌어요. 공급가액 = 일수 × 수량 × 단가</p>' +
    '<div class="lines">' + lines + '</div><button class="addline" data-toast>' + ic('plus') + '품목 추가</button>' + edTotals() + '</section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn won">₩</span>부가세 · 선금</h2></div>' +
    '<div class="opt-row"><span class="ol">부가세</span>' + seg('vat', [['excl', '별도 (10% 더하기)'], ['incl', '포함'], ['none', '없음']], DOC.vat) + '</div>' +
    '<div class="opt-row dep-row"><span class="ol">선금 (계약금)</span>' +
    '<label class="sw"><input type="checkbox" data-opt="depositOn"' + (DOC.depositOn ? ' checked' : '') + '><i></i><span>선금 받기</span></label>' +
    '<div class="dep" id="depBox"' + (DOC.depositOn ? '' : ' hidden') + '><input class="in num" id="depAmt" value="' + Calc.won(DOC.deposit) + '" inputmode="numeric" aria-label="선금 금액"><span class="won-s">원</span>' +
    '<button class="pchip" data-dep="0.1">10%</button><button class="pchip" data-dep="0.3">30%</button><button class="pchip" data-dep="0.5">50%</button></div>' +
    '<p class="dep-hint" id="depHint">' + (DOC.depositOn ? '문서에 <b>선금 · 잔금</b> 줄이 들어가요.' : '꺼져 있으면 문서에 선금 · 잔금 줄이 나오지 않아요.') + '</p></div>' +
    '<div class="opt-row"><span class="ol">끝자리 정리</span><label class="sw"><input type="checkbox"><i></i><span>합계 끝자리 깎기 (네고)</span></label></div>' +
    '</section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn">3</span>특이사항 · 문서 설정</h2></div>' +
    '<div class="autos"><span class="auto">' + ic('check') + '견적 유효기간 15일 (자동)</span><span class="auto">' + ic('check') + '결제 계좌 (자동)</span></div>' +
    '<div class="pchips">' + phrases + '</div><textarea class="in ta" rows="2" placeholder="직접 쓰기 — 예: 무대 설치는 전날 오후에 진행합니다."></textarea>' +
    '<div class="opt-row"><label class="sw"><input type="checkbox" data-opt="showNo"' + (DOC.showNo ? ' checked' : '') + '><i></i><span>문서번호 보이기</span></label>' +
    '<label class="sw"><input type="checkbox" data-opt="fill"' + (DOC.fill ? ' checked' : '') + '><i></i><span>빈 줄 채우기 (표를 끝까지)</span></label></div>' +
    '</section>' +
    '</div>' +
    '<aside class="ed-preview card" data-s="3"><div class="card-h"><h2>' + ic('eye') + '미리보기</h2><span class="hint pv-kind">' + TYPES[UI.kind].label + ' · A4</span></div>' +
    '<div class="pv-box"><div class="fit" data-w="794" data-h="auto"><div class="fit-inner" style="width:794px" id="pv">' + renderDoc(UI.kind, UI.theme) + '</div></div></div>' +
    '<div class="share-big"><button class="sb" data-toast>' + ic('pdf') + 'PDF 저장</button><button class="sb" data-toast>' + ic('image') + '이미지 저장</button><button class="sb kakao" data-toast>' + ic('chat') + '카톡 보내기</button><button class="sb" data-toast>' + ic('mail') + '메일 보내기</button></div>' +
    '</aside>' +
    '</div>' +
    '<div class="ed-next">' + prev + next + '</div>' +
    '</div>';
}

function lockScreen() {
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(function (k) {
    if (k === 'del') return '<button class="key fn" data-key="del" aria-label="지우기">' + ic('backspace') + '</button>';
    if (k === 'ok') return '<button class="key fn ok" data-key="ok">확인</button>';
    return '<button class="key" data-key="' + k + '">' + k + '</button>';
  }).join('');
  return '<div class="lock" id="lock" role="dialog" aria-label="화면 잠금"><div class="lock-card">' +
    '<img class="lock-logo" src="assets/starmedia-logo.png" alt="스타미디어 기획사">' +
    '<span class="lock-ic">' + ic('lock') + '</span><h2>화면이 잠겼어요</h2><p>숫자 비밀번호를 누르면<br>쓰던 화면 그대로 이어서 작성해요</p>' +
    '<div class="pins" id="pins"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="pad">' + keys + '</div>' +
    '<button class="forgot" data-toast>' + ic('google') + '비밀번호를 잊었어요 · 구글 계정으로 확인</button>' +
    '<small class="lock-tip">시안: 숫자 4개 이상 누르고 확인을 누르면 풀려요 · 5분 동안 손대지 않으면 자동으로 잠겨요</small>' +
    '</div></div>';
}

/* 장비 관리는 equip.js */

/* ── 내 정보 · 도장 ── */
function meField(label, key, extra) {
  return '<label class="fld"><span>' + label + '</span><input class="in" data-me="' + key + '" value="' + esc(ME[key]) + '"' + (extra || '') + '></label>';
}

function mePage() {
  return '<div class="mepage"><div class="me-form">' +
    '<section class="card"><div class="card-h"><h2>' + ic('building') + '사업자 정보</h2><span class="hint">처음 한 번만 넣으면 돼요</span></div><div class="fgrid">' +
    '<label class="fld span2 nmfld"><span>상호 (업체명) <em class="tag2">최대 2줄</em></span>' +
    '<textarea class="in ta2" data-me="name" rows="2" aria-describedby="nmHint">' + esc(ME.name) + '</textarea>' +
    '<small id="nmHint" class="fhint">' + ic('check') + '<span><b>엔터</b>를 누르면 다음 줄로 넘어가요. 예: 스타미디어 ↵ (STARmedia)</span></small></label>' +
    meField('대표자', 'ceo') + meField('사업자등록번호', 'bizNo', ' inputmode="numeric"') +
    '<div class="span2">' + meField('주소', 'addr') + '</div>' +
    meField('업태', 'bizType') + meField('종목', 'bizItem') + meField('전화', 'tel', ' inputmode="tel"') + meField('팩스', 'fax', ' inputmode="tel"') +
    '</div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('bank') + '입금 계좌</h2><span class="hint">견적서 특이사항과 납품ㆍ청구서 입금 계좌 상자에 들어가요</span></div><div class="fgrid three">' +
    meField('은행', 'bankName') + meField('계좌번호', 'bankNo', ' inputmode="numeric"') + meField('예금주', 'holder') +
    '</div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('user') + '도장</h2><span class="hint">문서의 「대표」 칸에 찍혀요</span></div>' +
    '<div class="stampbox"><div class="stamp-pv"><img src="assets/stamp-sample.svg" alt="도장 미리보기" id="stampImg" style="width:72px;height:72px"></div>' +
    '<div class="stamp-act"><div class="stamp-btns"><button class="btn" data-toast>' + ic('image') + '도장 사진 넣기 <small>(JPG · 흰 배경 자동 지우기)</small></button>' +
    '<button class="btn" data-toast>' + ic('upload') + '투명 PNG 그대로 넣기</button></div>' +
    '<label class="range"><span>크기</span><input type="range" min="12" max="24" value="17" id="stampSize" aria-label="도장 크기"><b id="stampSizeV">17mm</b></label>' +
    '<p class="note">' + ic('check') + '크기를 키워도 도장이 잘리지 않도록 칸 밖으로 넘쳐도 그대로 보여요.</p></div></div>' +
    '</section></div>' +
    '<aside class="card me-pv"><div class="card-h"><h2>' + ic('eye') + '문서에 이렇게 보여요</h2></div>' +
    '<div class="me-sample doc--a" id="meSample">' + supplierTable(true) + '</div>' +
    '<p class="note">' + ic('fileText') + '견적서 · 거래명세서 · 납품ㆍ청구서 · 영수증에 똑같이 들어가요.</p></aside>' +
    '</div>';
}

/* ── 휴대폰 아래 메뉴 + 더보기 ── */
function bottomNav(page) {
  var it = [['home', '홈', 'home', page === 'home'], ['new', '새 문서', 'plus', page === 'editor'], ['list', '목록', 'list'], ['users', '거래처', 'users'], ['more', '더보기', 'grid', page === 'equip' || page === 'me' || page === 'event']];
  var more = [['event', '행사 · 입금', 'won', true], ['equip', '장비 관리', 'tent', true], ['me', '내 정보 · 도장', 'user', true], ['items', '품목 · 세트', 'layers'], ['money', '매출 · 미수금', 'chart'], ['cal', '행사 달력', 'calendar'], ['trash', '휴지통', 'trash'], ['set', '설정 · 백업', 'sliders']];
  return '<nav class="bnav">' + it.map(function (x) {
    var href = x[0] === 'new' ? '?frame=1&t=' + UI.theme + '&page=editor' : x[0] === 'home' ? '?frame=1&t=' + UI.theme + '&page=home' : '#';
    var attr = x[0] === 'more' ? ' data-act="more"' : (href === '#' ? ' data-toast' : '');
    return '<a href="' + href + '" class="' + (x[3] ? 'on ' : '') + (x[0] === 'new' ? 'bnew' : '') + '"' + attr + '><span class="bi">' + ic(x[2]) + '</span><span>' + x[1] + '</span></a>';
  }).join('') + '</nav>' +
    '<div class="sheet" id="moreSheet" role="dialog" aria-label="더보기 메뉴"><div class="sheet-card"><div class="sheet-h"><b>더보기</b><button class="icbtn" data-act="more" aria-label="닫기">' + ic('x') + '</button></div>' +
    '<div class="sheet-grid">' + more.map(function (m) {
      return '<a href="' + (m[3] ? '?frame=1&t=' + UI.theme + '&page=' + m[0] : '#') + '" class="' + (m[0] === page ? 'on' : '') + '"' + (m[3] ? '' : ' data-toast') + '><span class="bi">' + ic(m[2]) + '</span><span>' + m[1] + '</span></a>';
    }).join('') + '</div></div></div>';
}

function credit() {
  return '<footer class="credit"><img src="assets/gonynas-logo.jpg" alt=""><span>Developed by <b>GONYNAS</b> · v1.0</span></footer>';
}

function renderApp(opt) {
  UI.theme = opt.theme; UI.kind = opt.kind || 'quote';
  var page = opt.page || 'home', step = opt.step || 1;
  var body = page === 'editor' ? editorPage(step) : page === 'equip' ? equipPage() : page === 'event' ? eventPage() : page === 'me' ? mePage() : homePage();
  return '<div class="app" data-page="' + page + '">' + appSidebar(page) +
    '<div class="main">' + appTop(page) + '<main class="page">' + body + '</main>' + credit() + '</div>' +
    bottomNav(page) + '</div>' + lockScreen() + modalBox() + '<div class="toast" id="toast" role="status"></div>';
}

/* ── 움직임 ── */
function toast(msg) {
  var t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg || '시안 화면이라 실제로 저장·발송되지는 않아요';
  t.classList.add('on'); clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('on'); }, 2200);
}

var pvTimer = null;
function refreshPreview(root) {
  clearTimeout(pvTimer);
  pvTimer = setTimeout(function () {
    var pv = root.querySelector('#pv'); if (!pv) return;
    pv.innerHTML = renderDoc(UI.kind, UI.theme);
    var k = root.querySelector('.pv-kind'); if (k) k.textContent = TYPES[UI.kind].label + ' · A4';
    var sum = root.querySelector('.ed-sum'); if (sum) sum.outerHTML = edTotals();
    fitAll();
  }, 80);
}

function updateLineView(lineEl, l) {
  var r = Calc.line(l, DOC.vat);
  lineEl.querySelector('.line-amt b').textContent = Calc.won(r.supply);
  lineEl.querySelector('.line-amt small .num').textContent = Calc.won(r.tax);
}

function renumber(root) {
  root.querySelectorAll('.lines .line').forEach(function (el, i) { el.dataset.i = i; el.querySelector('.line-no').textContent = i + 1; });
}

function bindDrag(root) {
  var box = root.querySelector('.lines'); if (!box) return;
  box.addEventListener('pointerdown', function (e) {
    var g = e.target.closest('.grip'); if (!g) return;
    e.preventDefault();
    var item = g.closest('.line'); item.classList.add('dragging');
    g.setPointerCapture(e.pointerId);
    var move = function (ev) {
      var others = Array.prototype.filter.call(box.children, function (c) { return c !== item; });
      var before = null;
      for (var i = 0; i < others.length; i++) { var r = others[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { before = others[i]; break; } }
      if (before) box.insertBefore(item, before); else box.appendChild(item);
    };
    var up = function () {
      item.classList.remove('dragging');
      g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
      var order = Array.prototype.map.call(box.children, function (c) { return +c.dataset.i; });
      DOC.lines = order.map(function (i) { return DOC.lines[i]; });
      renumber(root); refreshPreview(root);
    };
    g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  });
}

function bindApp(root) {
  root.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a && a.dataset.act === 'lock') { e.preventDefault(); openLock(); return; }
    if (a && a.dataset.act === 'font') { e.preventDefault(); document.documentElement.classList.toggle('big'); a.querySelector('span').textContent = document.documentElement.classList.contains('big') ? '글자 보통' : '글자 크게'; fitAll(); return; }
    var m = e.target.closest('[data-menu]');
    root.querySelectorAll('.menu.open').forEach(function (x) { if (!m || x !== m.parentElement) x.classList.remove('open'); });
    if (m) { e.preventDefault(); m.parentElement.classList.toggle('open'); return; }
    var sb = e.target.closest('[data-seg] button');
    if (sb) {
      var segEl = sb.parentElement, name = segEl.dataset.seg;
      segEl.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === sb); b.setAttribute('aria-checked', b === sb); });
      if (name === 'kind') { UI.kind = sb.dataset.v; root.querySelectorAll('a[href*="page=editor"]').forEach(function (l) { l.href = l.getAttribute('href').replace(/kind=\w+/, 'kind=' + UI.kind); }); }
      if (name === 'vat') { DOC.vat = sb.dataset.v; root.querySelectorAll('.lines .line').forEach(function (el) { updateLineView(el, DOC.lines[+el.dataset.i]); }); }
      refreshPreview(root); return;
    }
    var k = e.target.closest('[data-key]'); if (k) { pinKey(k.dataset.key); return; }
    if (a && a.dataset.act === 'more') { e.preventDefault(); var sh = root.querySelector('#moreSheet'); if (sh) sh.classList.toggle('on'); return; }
    if (e.target.id === 'moreSheet') { e.target.classList.remove('on'); return; }
    // 확인 창 · 장비 관리 (equip.js)
    if (modalClick(e)) return;
    if (equipClick(e, root, a)) return;
    if (eventClick(e, root, a)) return;
    // 선금 빠른 입력 10% · 30% · 50% (견적서에 보이는 예상 선금)
    var dp = e.target.closest('[data-dep]');
    if (dp) { DOC.deposit = Math.round(Calc.totals({ lines: DOC.lines, vat: DOC.vat }).total * +dp.dataset.dep); var di = root.querySelector('#depAmt'); if (di) di.value = Calc.won(DOC.deposit); refreshPreview(root); return; }
    var tt = e.target.closest('[data-toast]'); if (tt) { e.preventDefault(); toast(); }
  });
  root.addEventListener('input', function (e) {
    var inp = e.target, f = inp.dataset.f;
    if (f) {
      var lineEl = inp.closest('.line'), l = DOC.lines[+lineEl.dataset.i];
      l[f] = (f === 'name' || f === 'spec' || f === 'memo') ? inp.value : Calc.parse(inp.value);
      updateLineView(lineEl, l); refreshPreview(root);
    }
    // 내 정보: 고치는 대로 「문서에 이렇게 보여요」에 반영. 업체명은 2줄까지
    var mk = inp.dataset.me;
    if (mk) {
      if (mk === 'name') {
        var parts = inp.value.split('\n');
        // 붙여넣기로 3줄 이상이 들어오면 둘째 줄 뒤를 한 줄로 합친다
        if (parts.length > 2) { inp.value = parts[0] + '\n' + parts.slice(1).join(' '); toast('업체명은 2줄까지 쓸 수 있어요'); }
      }
      ME[mk] = inp.value;
      var smp = root.querySelector('#meSample'); if (smp) { smp.innerHTML = supplierTable(true); applyStampSize(root); }
    }
    if (inp.id === 'stampSize') applyStampSize(root);
  });
  root.addEventListener('keydown', function (e) {
    if (e.target.dataset.me === 'name' && e.key === 'Enter' && e.target.value.indexOf('\n') !== -1) { e.preventDefault(); toast('업체명은 2줄까지 쓸 수 있어요'); }
  });
  root.addEventListener('change', function (e) {
    var o = e.target.dataset.opt;
    if (o) {
      DOC[o] = e.target.checked;
      if (o === 'depositOn') {
        var box0 = root.querySelector('#depBox'), hint = root.querySelector('#depHint');
        if (box0) box0.hidden = !DOC.depositOn;
        if (hint) hint.innerHTML = DOC.depositOn ? '문서에 <b>선금 · 잔금</b> 줄이 들어가요.' : '꺼져 있으면 문서에 선금 · 잔금 줄이 나오지 않아요.';
      }
      refreshPreview(root);
    }
    equipChange(e, root);
  });
  root.addEventListener('input', function (e) {
    if (e.target.id === 'depAmt') { DOC.deposit = Calc.parse(e.target.value); refreshPreview(root); }
    if (e.target.id === 'mTotal') eqDiffHint();
    eventInput(e, root);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  bindDrag(root);
  var idle; var resetIdle = function () { clearTimeout(idle); idle = setTimeout(openLock, 5 * 60 * 1000); };
  ['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, resetIdle); }); resetIdle();
}

// 도장 크기(12~24mm)를 미리보기에 반영 (A4 기준 약 3px = 1mm)
function applyStampSize(root) {
  var r = root.querySelector('#stampSize'); if (!r) return;
  var v = +r.value, lbl = root.querySelector('#stampSizeV'), pv = root.querySelector('#stampImg');
  if (lbl) lbl.textContent = v + 'mm';
  if (pv) { pv.style.width = pv.style.height = Math.round(v * 4.2) + 'px'; }
  root.querySelectorAll('#meSample .stamp').forEach(function (s) { s.style.width = s.style.height = Math.round(v * 3) + 'px'; });
}

var PIN = '';
function openLock() { PIN = ''; drawPins(); var l = document.getElementById('lock'); if (l) l.classList.add('on'); }
function drawPins() { document.querySelectorAll('#pins i').forEach(function (d, i) { d.classList.toggle('on', i < PIN.length); }); }
function pinKey(k) {
  if (k === 'del') PIN = PIN.slice(0, -1);
  else if (k === 'ok') { if (PIN.length >= 4) { document.getElementById('lock').classList.remove('on'); toast('잠금이 풀렸어요 (시안)'); } else toast('숫자를 4개 이상 눌러 주세요'); PIN = ''; }
  else if (PIN.length < 6) PIN += k;
  drawPins();
}
