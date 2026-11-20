// 하위 메뉴 디자인 시안 (v1.6 후보) — 보여 주기용 화면. 프로그램 자료는 쓰지 않고 예시 자료만 그린다.
(function () {
  'use strict';
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    won: '<circle cx="12" cy="12" r="9"/><path d="m7.5 8.5 1.8 7 2.7-6 2.7 6 1.8-7M7 12h10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3.5 5.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    right: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    sort: '<path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
    pdf: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M12 11v6M9.5 14.5 12 17l2.5-2.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    minus: '<path d="M5 12h14"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'
  };
  const ic = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>';
  const won = (n) => n.toLocaleString('ko-KR');

  const ITEMS = [
    { id: 'i1', cat: '천막', name: '천막텐트', spec: '3m×6m', price: 30000, days: 1, sets: '천막세트(기본)' },
    { id: 'i2', cat: '천막', name: '몽골텐트', spec: '5m×5m', price: 170000, days: 1, sets: '몽골세트(5M)' },
    { id: 'i3', cat: '음향', name: '음향세트', spec: '기본', price: 1500000, days: 1, sets: '-' },
    { id: 'i4', cat: '의자', name: '의자', spec: '등받이형', price: 1000, days: 1, sets: '천막세트(기본) 외 1' },
    { id: 'i5', cat: '테이블', name: '테이블', spec: '1800×750', price: 10000, days: 1, sets: '천막세트(기본) 외 1' }
  ];
  const SETS = [
    { id: 's1', name: '천막세트(기본)', lines: '천막텐트 · 테이블 · 의자', price: 41000 },
    { id: 's2', name: '몽골세트(3M)', lines: '몽골텐트-3M · 테이블 · 의자', price: 161000 },
    { id: 's3', name: '몽골세트(5M)', lines: '몽골텐트-5M · 테이블 · 의자', price: 181000 }
  ];
  const DOCS = [
    { id: 'd1', type: 'stmt', tl: '거래명세서', no: '명세 261120-02', client: '남해군청', ev: '', date: '11/20', amt: 199100, st: 'draft' },
    { id: 'd2', type: 'stmt', tl: '거래명세서', no: '명세 261120-01', client: '남해군청', ev: '겨울 별빛축제', date: '11/20', amt: 222200, st: 'done' },
    { id: 'd3', type: 'quote', tl: '견적서', no: '견적 261120-01', client: '남해군청', ev: '겨울 별빛축제', date: '11/19', amt: 222200, st: 'sent' }
  ];
  const ST = { draft: '작성 중', done: '작성 완료', sent: '발송 완료' };
  const TIP = {
    items: '자주 쓰는 품목과 기본 단가를 넣어 두면 문서를 만들 때 골라 써요. 단가는 문서마다 바꿀 수 있어요.',
    list: '만든 문서를 찾고, 열고, 복사해서 새로 만들어요.',
    set: '문서 기본값 · 잠금 · 저장 위치 · 백업을 정해요. 바꾸면 바로 저장돼요.'
  };
  const S = { v: 'A', s: 'items', tab: { items: 'item', list: 'all', set: 'doc' }, cat: '', sel: { items: 'i1', list: 'd2', set: 'doc' }, lvl: 1, sheet: false, tip: false };
  const phone = () => matchMedia('(max-width:767px)').matches;

  /* ── 큰 틀 ── */
  const NAV = [['home', '홈', 'home'], ['list', '발행 목록', 'list'], ['event', '행사 · 입금', 'won'], ['clients', '거래처', 'users'], ['items', '품목 · 세트', 'layers', 5], ['equip', '장비 관리', 'box'], ['money', '매출 · 미수금', 'chart'], ['cal', '행사 달력', 'cal'], ['trash', '휴지통', 'trash'], ['me', '내 정보 · 도장', 'user'], ['set', '설정 · 백업', 'sliders']];
  function shell(body) {
    const side = '<aside class="side"><img class="logo" src="../../assets/starmedia-logo.png" alt="STARmedia 스타미디어 기획사"><button type="button" class="new">' + ic('plus') + '새 문서 만들기</button>' +
      NAV.map(([k, l, i, n]) => '<a href="#" class="' + (k === S.s ? 'on' : '') + '" data-go="' + k + '">' + ic(i) + l + (n ? '<em>' + n + '</em>' : '') + '</a>').join('') + '</aside>';
    const bn = [['home', '홈', 'home'], ['new', '새 문서', 'plus'], ['list', '목록', 'list'], ['clients', '거래처', 'users'], ['more', '더보기', 'layers']];
    const bon = S.s === 'list' ? 'list' : 'more';
    const bnav = '<nav class="bnav">' + bn.map(([k, l, i]) => '<a href="#" class="' + (k === bon ? 'on' : '') + '" data-go="' + (k === 'list' ? 'list' : k === 'more' ? 'items' : '') + '">' + ic(i) + l + '</a>').join('') + '</nav>';
    return '<div class="app">' + side + '<main class="main">' + body + '</main></div>' + bnav;
  }
  function head(title, act) {
    return '<header class="ph"><h1>' + title + '</h1><button type="button" class="ib" data-x="tip" aria-label="이 화면 설명 보기" aria-expanded="' + S.tip + '">' + ic('info') + '</button><div class="act">' + (act || '') + '</div></header>' +
      '<p class="tip' + (S.tip ? ' on' : '') + '">' + TIP[S.s] + '</p>';
  }
  const tabs = (key, list) => '<nav class="tabs" role="tablist">' + list.map(([k, l, n]) => '<button type="button" role="tab" aria-selected="' + (S.tab[key] === k) + '" class="' + (S.tab[key] === k ? 'on' : '') + '" data-tab="' + key + ':' + k + '">' + l + (n !== undefined ? '<em>' + n + '</em>' : '') + '</button>').join('') + '</nav>';
  const cats = () => { const m = {}; ITEMS.forEach((i) => { m[i.cat] = (m[i.cat] || 0) + 1; }); return Object.entries(m); };
  const shownItems = () => ITEMS.filter((i) => !S.cat || i.cat === S.cat);
  const chipSt = (st) => '<span class="chip c-' + st + '">' + ST[st] + '</span>';
  const more = (lbl) => '<button type="button" class="ib" aria-label="' + lbl + ' 더보기 (수정 · 복사 · 삭제)">' + ic('more') + '</button>';

  /* ══ 시안 A · 탭 정리형 ══ */
  function aItems() {
    const act = '<button type="button" class="btn">' + ic('table') + '<span>엑셀</span></button><button type="button" class="btn primary">' + ic('plus') + '<span>' + (S.tab.items === 'set' ? '세트 만들기' : '품목 추가') + '</span></button>';
    let body;
    if (S.tab.items === 'set') {
      body = phone()
        ? '<div class="mlist">' + SETS.map((s) => '<div class="mi"><div class="t"><b>' + s.name + '</b><small>' + s.lines + '</small></div><div class="v num">' + won(s.price) + '원</div>' + more(s.name) + '</div>').join('') + '</div>'
        : '<table class="tbl"><thead><tr><th>세트</th><th>들어 있는 품목</th><th class="r">세트 금액</th><th></th></tr></thead><tbody>' + SETS.map((s) => '<tr><td class="nm"><b>' + s.name + '</b></td><td class="dim">' + s.lines + '</td><td class="r num"><b>' + won(s.price) + '</b>원</td><td class="act">' + more(s.name) + '</td></tr>').join('') + '</tbody></table>';
      return head('품목 · 세트', act) + tabs('items', [['item', '품목', 5], ['set', '세트', 3]]) + '<section class="panel">' + body + '</section>' + (phone() ? '<button type="button" class="fab">' + ic('plus') + '세트</button>' : '');
    }
    const chips = '<div class="chips" role="radiogroup" aria-label="분류"><button type="button" class="' + (!S.cat ? 'on' : '') + '" data-cat="">전체 <em>5</em></button>' + cats().map(([c, n]) => '<button type="button" class="' + (S.cat === c ? 'on' : '') + '" data-cat="' + c + '">' + c + ' <em>' + n + '</em></button>').join('') + '<button type="button" class="sort">' + ic('sort') + '순서</button></div>';
    const tool = '<div class="tool"><label class="search">' + ic('search') + '<input placeholder="품목 · 규격으로 찾기" aria-label="품목 찾기"></label>' + chips + '</div>';
    body = phone()
      ? '<div class="mlist">' + shownItems().map((i) => '<div class="mi"><div class="t"><b>' + i.name + '</b><small>' + i.spec + ' <span class="chip c-cat">' + i.cat + '</span></small></div><div class="v num">' + won(i.price) + '원<small class="dim">' + i.days + '일</small></div>' + more(i.name) + '</div>').join('') + '</div>'
      : '<table class="tbl"><thead><tr><th>품목 · 규격</th><th>분류</th><th class="r">기본 단가</th><th class="r">일수</th><th></th></tr></thead><tbody>' + shownItems().map((i) => '<tr><td class="nm"><b>' + i.name + '</b><small>' + i.spec + '</small></td><td><span class="chip c-cat">' + i.cat + '</span></td><td class="r num"><b>' + won(i.price) + '</b>원</td><td class="r num">' + i.days + '일</td><td class="act">' + more(i.name) + '</td></tr>').join('') + '</tbody></table>';
    return head('품목 · 세트', act) + tabs('items', [['item', '품목', 5], ['set', '세트', 3]]) + '<section class="panel">' + tool + body + '<div class="foot">단가는 기본값이에요. 문서마다 바꿀 수 있어요.</div></section>' + (phone() ? '<button type="button" class="fab">' + ic('plus') + '품목</button>' : '');
  }
  function aList() {
    const act = '<button type="button" class="btn">' + ic('table') + '<span>엑셀</span></button><button type="button" class="btn primary">' + ic('plus') + '<span>새 문서</span></button>';
    const t = S.tab.list, docs = DOCS.filter((d) => t === 'all' || d.type === t);
    const tool = '<div class="tool"><label class="search">' + ic('search') + '<input placeholder="받는 곳 · 행사 · 문서번호로 찾기" aria-label="문서 찾기"></label><div class="chips" aria-label="상태"><button type="button" class="on">모든 상태</button><button type="button">작성 중 <em>1</em></button><button type="button">작성 완료 <em>1</em></button><button type="button">발송 완료 <em>1</em></button></div></div>';
    const body = phone()
      ? '<div class="mlist">' + docs.map((d) => '<div class="mi"><div class="t"><b>' + d.client + (d.ev ? ' · ' + d.ev : '') + '</b><small>' + ic(d.type === 'quote' ? 'file' : 'clip') + d.no + ' · ' + d.date + '</small></div><div class="v num">₩' + won(d.amt) + '<small>' + chipSt(d.st) + '</small></div>' + more(d.no) + '</div>').join('') + '</div>'
      : '<table class="tbl"><thead><tr><th>문서</th><th>받는 곳 · 행사</th><th>날짜</th><th class="r">금액</th><th>상태</th><th></th></tr></thead><tbody>' + docs.map((d) => '<tr><td class="nm"><b>' + d.tl + '</b><small class="num">' + d.no + '</small></td><td class="nm"><b>' + d.client + '</b><small>' + (d.ev || '행사 없음') + '</small></td><td class="num dim">' + d.date + '</td><td class="r num"><b>₩' + won(d.amt) + '</b></td><td>' + chipSt(d.st) + '</td><td class="act">' + more(d.no) + '</td></tr>').join('') + '</tbody></table>';
    return head('발행 목록', act) + tabs('list', [['all', '전체', 3], ['quote', '견적서', 1], ['stmt', '거래명세서', 2], ['inv', '납품 · 청구서', 0], ['rcpt', '영수증', 0]]) + '<section class="panel">' + tool + body + '</section>' + (phone() ? '<button type="button" class="fab">' + ic('plus') + '새 문서</button>' : '');
  }
  function setRows(k) {
    if (k === 'doc') return '<div class="grp">' +
      row('부가세', '견적서 · 청구서에 처음 들어가는 값', '<div class="seg"><button class="on" type="button">별도</button><button type="button">포함</button><button type="button">없음</button></div>') +
      row('견적 유효기간', '', stepper(15)) + row('입금 기한', '', stepper(14)) +
      row('빈 줄 채우기', '품목이 적어도 표를 A4 끝까지', '<span class="sw" role="switch" aria-checked="false"></span>') +
      row('자주 쓰는 특이사항', '4개', '<button type="button" class="btn">' + ic('edit') + '고치기</button>') + '</div>';
    if (k === 'screen') return '<div class="grp"><h3>화면</h3>' +
      row('글자 크게', '화면만 커지고 문서는 그대로', '<span class="sw" role="switch" aria-checked="false"></span>') +
      row('바탕화면 아이콘', '', '<button type="button" class="btn">만드는 법</button>') + '</div><div class="grp"><h3>화면 잠금</h3>' +
      row('비밀번호', '정해 둠 · 6자리', '<button type="button" class="btn">바꾸기</button>') +
      row('자동 잠금', '', '<div class="seg"><button type="button">끄기</button><button type="button">1분</button><button type="button">3분</button><button type="button" class="on">5분</button><button type="button">10분</button></div>') + '</div>';
    if (k === 'save') return '<div class="grp"><h3>저장 위치</h3>' +
      row('1차 · 구글 드라이브', '', '<span class="st"><i></i>05:07 맞춤</span>') +
      row('2차 · PC 폴더', '', '<span class="st"><i class="off"></i>연결 안 됨</span><button type="button" class="btn">연결</button>') +
      row('이 기기', '빠른 열기용 사본', '<span class="val num">05:07 저장됨</span>') + '</div><div class="grp"><h3>백업</h3>' +
      row('자동 백업', '최근 10개 · 마지막 11월 20일', '<button type="button" class="btn primary">지금 백업</button>') +
      row('자료 파일', '다른 PC로 옮길 때', '<button type="button" class="btn">' + ic('download') + '내려받기</button><button type="button" class="btn">불러오기</button>') + '</div>';
    return '<div class="grp">' +
      row('문제 기록', '기록된 오류 없음', '<button type="button" class="btn">AI에게 보낼 내용 복사</button>') +
      row('버전', 'v1.6.0 · 2026-11-20', '<button type="button" class="btn">릴리즈 노트</button><button type="button" class="btn">업데이트 확인</button>') + '</div>';
  }
  const row = (b, s, ctl) => '<div class="row"><div class="lb"><b>' + b + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>' + ctl + '</div>';
  const stepper = (n) => '<div class="stepper"><button type="button" aria-label="하루 줄이기">' + ic('minus') + '</button><b class="num">' + n + '일</b><button type="button" aria-label="하루 늘리기">' + ic('plus') + '</button></div>';
  function aSet() {
    return head('설정 · 백업', '') + tabs('set', [['doc', '문서 기본값'], ['screen', '화면 · 잠금'], ['save', '저장 · 백업'], ['info', '문제 · 정보']]) + '<section class="panel">' + setRows(S.tab.set) + '</section>';
  }

  /* ══ 시안 B · 목록 · 상세형 ══ */
  function itemDetail(i) {
    return '<h2>' + i.name + '</h2><p class="k">' + i.cat + ' · ' + i.spec + '</p><dl><dt>분류</dt><dd>' + i.cat + '</dd><dt>규격</dt><dd>' + i.spec + '</dd><dt>기본 단가</dt><dd class="num">' + won(i.price) + '원</dd><dt>기본 일수</dt><dd>' + i.days + '일</dd><dt>쓰는 세트</dt><dd>' + i.sets + '</dd></dl>' +
      '<div class="acts"><button type="button" class="btn primary wide">' + ic('edit') + '수정</button><button type="button" class="btn">' + ic('copy') + '복사</button><button type="button" class="btn danger">' + ic('trash') + '삭제</button></div>';
  }
  function docDetail(d) {
    return '<div class="thumb" aria-hidden="true"></div><h2>' + d.client + '</h2><p class="k">' + d.tl + ' · <span class="num">' + d.no + '</span></p><dl><dt>행사</dt><dd>' + (d.ev || '없음') + '</dd><dt>날짜</dt><dd class="num">' + d.date + '</dd><dt>금액</dt><dd class="num">₩' + won(d.amt) + '</dd><dt>상태</dt><dd>' + chipSt(d.st) + '</dd></dl>' +
      '<div class="acts"><button type="button" class="btn primary wide">' + ic('edit') + '열어서 고치기</button><button type="button" class="btn">' + ic('pdf') + 'PDF</button><button type="button" class="btn">' + ic('chat') + '카톡 보내기</button><button type="button" class="btn">' + ic('copy') + '복사해서 새로</button><button type="button" class="btn danger">' + ic('trash') + '삭제</button></div>';
  }
  const subBtn = (attr, on, label, right) => '<button type="button" ' + attr + ' class="' + (on ? 'on' : '') + '">' + label + (right || '') + '<span class="chev">' + ic('right') + '</span></button>';
  function bItems() {
    const act = '<button type="button" class="btn">' + ic('table') + '<span>엑셀</span></button><button type="button" class="btn primary">' + ic('plus') + '<span>품목 추가</span></button>';
    const sub = '<nav class="sub" aria-label="품목 하위 메뉴"><h4>분류</h4>' + subBtn('data-cat=""', !S.cat && S.tab.items === 'item', '전체 품목', '<em>5</em>') +
      cats().map(([c, n]) => subBtn('data-cat="' + c + '"', S.cat === c && S.tab.items === 'item', c, '<em>' + n + '</em>')).join('') +
      '<hr>' + subBtn('data-tab="items:set"', S.tab.items === 'set', '품목 세트', '<em>3</em>') + '<hr><button type="button" class="add">' + ic('sort') + '분류 순서 바꾸기</button></nav>';
    const isSet = S.tab.items === 'set';
    const rows = isSet ? SETS.map((s) => '<button type="button" class="li" data-sel="items:' + s.id + '"><span class="t"><b>' + s.name + '</b><small>' + s.lines + '</small></span><span class="v num">' + won(s.price) + '원</span><span class="chev">' + ic('right') + '</span></button>').join('')
      : shownItems().map((i) => '<button type="button" class="li' + (!phone() && S.sel.items === i.id ? ' on' : '') + '" data-sel="items:' + i.id + '"><span class="t"><b>' + i.name + '</b><small>' + i.spec + '</small></span><span class="v num">' + won(i.price) + '원<small class="dim">' + i.days + '일</small></span><span class="chev">' + ic('right') + '</span></button>').join('');
    const lst = '<section class="lst"><div class="tool"><label class="search">' + ic('search') + '<input placeholder="' + (S.cat || '전체') + '에서 찾기" aria-label="찾기"></label></div>' + rows + '</section>';
    const sel = ITEMS.find((i) => i.id === S.sel.items) || ITEMS[0];
    if (phone()) {
      if (S.lvl === 1) return head('품목 · 세트', act) + sub;
      return '<button type="button" class="back" data-x="up">' + ic('left') + '품목 · 세트</button>' + head(isSet ? '품목 세트' : (S.cat || '전체 품목'), act) + lst + sheet(itemDetail(sel)) + '<button type="button" class="fab">' + ic('plus') + '품목</button>';
    }
    return head('품목 · 세트', act) + '<div class="md">' + sub + lst + '<aside class="det" aria-label="고른 품목">' + itemDetail(sel) + '</aside></div>';
  }
  function bList() {
    const act = '<button type="button" class="btn">' + ic('table') + '<span>엑셀</span></button><button type="button" class="btn primary">' + ic('plus') + '<span>새 문서</span></button>';
    const t = S.tab.list;
    const sub = '<nav class="sub" aria-label="발행 목록 하위 메뉴"><h4>문서 종류</h4>' + [['all', '전체', 3], ['quote', '견적서', 1], ['stmt', '거래명세서', 2], ['inv', '납품 · 청구서', 0], ['rcpt', '영수증', 0]].map(([k, l, n]) => subBtn('data-tab="list:' + k + '"', t === k, l, '<em>' + n + '</em>')).join('') +
      '<hr><h4>상태</h4>' + subBtn('', false, '작성 중', '<em>1</em>') + subBtn('', false, '작성 완료', '<em>1</em>') + subBtn('', false, '발송 완료', '<em>1</em>') + '</nav>';
    const docs = DOCS.filter((d) => t === 'all' || d.type === t);
    const lst = '<section class="lst"><div class="tool"><label class="search">' + ic('search') + '<input placeholder="받는 곳 · 행사 · 문서번호" aria-label="문서 찾기"></label></div>' +
      docs.map((d) => '<button type="button" class="li' + (!phone() && S.sel.list === d.id ? ' on' : '') + '" data-sel="list:' + d.id + '">' + ic(d.type === 'quote' ? 'file' : 'clip') + '<span class="t"><b>' + d.client + (d.ev ? ' · ' + d.ev : '') + '</b><small class="num">' + d.no + ' · ' + d.date + '</small></span><span class="v num">₩' + won(d.amt) + '<small>' + chipSt(d.st) + '</small></span><span class="chev">' + ic('right') + '</span></button>').join('') + '</section>';
    const sel = DOCS.find((d) => d.id === S.sel.list) || DOCS[0];
    if (phone()) {
      if (S.lvl === 1) return head('발행 목록', act) + sub;
      return '<button type="button" class="back" data-x="up">' + ic('left') + '발행 목록</button>' + head({ all: '전체 문서', quote: '견적서', stmt: '거래명세서', inv: '납품 · 청구서', rcpt: '영수증' }[t], act) + lst + sheet(docDetail(sel)) + '<button type="button" class="fab">' + ic('plus') + '새 문서</button>';
    }
    return head('발행 목록', act) + '<div class="md">' + sub + lst + '<aside class="det" aria-label="고른 문서">' + docDetail(sel) + '</aside></div>';
  }
  function bSet() {
    const SEC = [['doc', '문서 기본값', '별도 · 15일'], ['screen', '화면 · 잠금', '5분 잠금'], ['save', '저장 · 백업', '드라이브 맞춤'], ['info', '문제 · 정보', 'v1.6.0']];
    const DESC = { doc: '새로 만드는 문서에 처음 들어가는 값이에요.', screen: '글자 크기와 화면 잠금을 정해요.', save: '자료는 입력하면 저절로 저장돼요.', info: '오류가 나면 저절로 적혀요 · 거래처 이름 · 금액은 적지 않아요.' };
    const k = S.tab.set;
    const sub = '<nav class="sub" aria-label="설정 하위 메뉴">' + SEC.map(([kk, l, st]) => subBtn('data-tab="set:' + kk + '"', !phone() && k === kk, l, '<small>' + st + '</small>')).join('') + '</nav>';
    const name = SEC.find((x) => x[0] === k)[1];
    const sec = '<section class="sec"><h2>' + name + '</h2><p>' + DESC[k] + '</p>' + setRows(k) + '</section>';
    if (phone()) {
      if (S.lvl === 1) return head('설정 · 백업', '') + sub;
      return '<button type="button" class="back" data-x="up">' + ic('left') + '설정 · 백업</button>' + sec;
    }
    return head('설정 · 백업', '') + '<div class="md two">' + sub + sec + '</div>';
  }
  const sheet = (inner) => '<div class="scrim' + (S.sheet ? ' on' : '') + '" data-x="close"></div><div class="sheet' + (S.sheet ? ' on' : '') + '" role="dialog" aria-label="자세히"><div class="grab"></div><div class="det">' + inner + '</div></div>';

  /* ── 그리기 · 누르기 ── */
  function render() {
    const f = { A: { items: aItems, list: aList, set: aSet }, B: { items: bItems, list: bList, set: bSet } }[S.v][S.s];
    document.getElementById('app').innerHTML = shell(f());
    document.querySelectorAll('.pick [data-v]').forEach((b) => b.classList.toggle('on', b.dataset.v === S.v));
    document.querySelectorAll('.pick [data-s]').forEach((b) => b.classList.toggle('on', b.dataset.s === S.s));
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.tagName === 'A') e.preventDefault();
    const d = t.dataset;
    if (d.v) { S.v = d.v; S.lvl = 1; S.sheet = false; }
    else if (d.s) { S.s = d.s; S.lvl = 1; S.sheet = false; S.tip = false; }
    else if (d.go && ['items', 'list', 'set'].includes(d.go)) { S.s = d.go; S.lvl = 1; S.sheet = false; }
    else if (d.tab) { const [k, v] = d.tab.split(':'); S.tab[k] = v; if (k === 'items') S.cat = ''; S.lvl = 2; }
    else if (d.cat !== undefined) { S.cat = d.cat; S.tab.items = 'item'; S.lvl = 2; }
    else if (d.sel) { const [k, v] = d.sel.split(':'); S.sel[k] = v; if (phone()) S.sheet = true; }
    else if (d.x === 'tip') S.tip = !S.tip;
    else if (d.x === 'up') { S.lvl = 1; S.sheet = false; }
    else if (d.x === 'close') S.sheet = false;
    else return;
    render();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.sheet) { S.sheet = false; render(); } });
  // 주소 뒤 ?v=B&s=set&lvl=2&sheet=1 로 바로 열기 (사진 찍기용)
  const q = new URLSearchParams(location.search);
  if (q.get('v')) S.v = q.get('v'); if (q.get('s')) S.s = q.get('s');
  if (q.get('tab')) S.tab[S.s] = q.get('tab'); if (q.get('lvl')) S.lvl = Number(q.get('lvl')); if (q.get('sheet')) S.sheet = true; if (q.get('tip')) S.tip = true;
  matchMedia('(max-width:767px)').addEventListener('change', render);
  render();
})();
