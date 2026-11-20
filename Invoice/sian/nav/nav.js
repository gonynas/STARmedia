// 메뉴 분류 시안 (v1.6.2 후보) — 대분류 · 중분류 · 소분류 규칙 + 앱 아이콘. 보여 주기용 예시 자료만 그린다.
(function () {
  'use strict';
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    sort: '<path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'
  };
  const ic = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>';
  const won = (n) => n.toLocaleString('ko-KR');
  const CATS = [['천막텐트', 1], ['몽골텐트', 2], ['테이블', 1], ['의자', 1], ['음향', 3], ['조명', 3], ['출연진', 20], ['특수효과', 9], ['사회자1', 2], ['사회자2', 8], ['진행용품1', 17], ['진행용품2', 7], ['카메라', 1], ['기타', 4]];
  const SETS = [['천막세트(기본)', 41000], ['몽골세트(3M)', 161000], ['몽골세트(5M)', 181000]];
  const TYPES = [['견적서', 2], ['거래명세서', 2], ['납품 · 청구서', 0], ['영수증', 0]];
  const STS = [['작성 중', 4], ['작성 완료', 0], ['발송 완료', 0]];
  const ITEMS = { '천막텐트': [['천막텐트', '3mx6m', 30000]], '몽골텐트': [['몽골텐트-3M', '3×3M', 150000], ['몽골텐트-5M', '5×5M', 170000]], '음향': [['음향세트', '기본', 1500000], ['음향세트', '고급', 2000000], ['음향세트', '최고급', 4000000]] };
  const S = { s: 'items', view: 'new', mk: 'tree', open: { all: false, sets: false, types: true, sts: true }, sel: { items: 'all', list: 'all', st: '' } };

  /* ── 새 규칙 하위 메뉴 ── */
  const grp = (icon, title, inner) => '<section class="card grp"><h3 class="g-h"><span class="gi">' + ic(icon) + '</span>' + title + '</h3>' + inner + '</section>';
  const mid = (key, label, n, on) => '<button type="button" class="mid' + (on ? ' on' : '') + '" data-mid="' + key + '" aria-expanded="' + S.open[key] + '"><span class="chev">' + ic('right') + '</span><span class="lb">' + label + '</span><em class="cnt num">' + n + '</em></button>';
  const kids = (key, list, selKey, prefix) => '<div class="kids"' + (S.open[key] ? '' : ' hidden') + ' role="group">' + list.map(([l, n]) => '<button type="button" class="leaf' + (S.sel[selKey] === prefix + l ? ' on' : '') + '" data-leaf="' + selKey + ':' + prefix + l + '"><span class="lb">' + l + '</span>' + (n !== undefined ? '<em class="cnt num">' + (typeof n === 'number' && n > 999 ? won(n) + '원' : n) + '</em>' : '') + '</button>').join('') + '</div>';
  function navItems() {
    return '<nav class="nav' + (S.mk === 'dot' ? ' mk-dot' : '') + '" aria-label="품목 · 세트 하위 메뉴">' +
      grp('layers', '품목', mid('all', '전체 품목', 79, S.sel.items === 'all') + kids('all', CATS, 'items', 'c:') + '<button type="button" class="tool">' + ic('sort') + '분류 순서 바꾸기</button>') +
      grp('box', '세트', mid('sets', '품목 세트', SETS.length, S.sel.items === 'sets') + kids('sets', SETS.map(([l]) => [l]), 'items', 's:')) + '</nav>';
  }
  function navList() {
    return '<nav class="nav' + (S.mk === 'dot' ? ' mk-dot' : '') + '" aria-label="발행 목록 하위 메뉴">' +
      grp('file', '문서 종류', mid('types', '전체', 4, S.sel.list === 'all') + kids('types', TYPES, 'list', 't:')) +
      grp('flag', '상태', mid('sts', '모든 상태', 4, S.sel.st === '') + kids('sts', STS, 'st', '')) + '</nav>';
  }
  /* ── 지금(v1.6.1) 모양: 비교용 ── */
  function oldItems() {
    return '<nav class="card old"><h4>분류</h4><button type="button" class="o on">전체 품목<em>79</em></button>' + CATS.map(([l, n]) => '<button type="button" class="o">' + l + '<em>' + n + '</em></button>').join('') + '<hr><button type="button" class="o">품목 세트<em>3</em></button><hr><button type="button" class="o" style="color:#1C62D8">분류 순서 바꾸기</button></nav>';
  }
  function oldList() {
    return '<nav class="card old"><h4>문서 종류</h4><button type="button" class="o on">전체<em>4</em></button>' + TYPES.map(([l, n]) => '<button type="button" class="o">' + l + '<em>' + n + '</em></button>').join('') + '<h4>상태</h4><button type="button" class="o on">모든 상태</button>' + STS.map(([l, n]) => '<button type="button" class="o">' + l + '<em>' + n + '</em></button>').join('') + '</nav>';
  }
  /* ── 오른쪽 목록 (보여 주기용) ── */
  function listItems() {
    const sel = S.sel.items;
    let crumb = '품목 › <b>전체 품목</b>', rows;
    if (sel === 'sets') { crumb = '세트 › <b>품목 세트</b>'; rows = SETS.map(([l, p]) => [l, '품목 3개', p]); }
    else if (sel.startsWith('s:')) { crumb = '세트 › 품목 세트 › <b>' + sel.slice(2) + '</b>'; rows = [['천막텐트', '3mx6m', 30000], ['테이블', '1800×750', 10000], ['의자', '등받이형', 1000]]; }
    else if (sel.startsWith('c:')) { const c = sel.slice(2); crumb = '품목 › 전체 품목 › <b>' + c + '</b>'; rows = ITEMS[c] || [[c + ' 품목', '규격', 10000]]; }
    else rows = [].concat(...Object.values(ITEMS));
    return '<section class="card"><div class="lst-h"><h2>' + (sel === 'all' ? '전체 품목' : sel === 'sets' ? '품목 세트' : sel.slice(2)) + '</h2><span class="crumb">' + crumb + '</span></div>' +
      rows.map(([n, s, p]) => '<div class="li"><span class="t"><b>' + n + '</b><small>' + s + '</small></span><span class="v num">' + won(p) + '원</span></div>').join('') + '</section>';
  }
  function listDocs() {
    const t = S.sel.list === 'all' ? '전체 문서' : S.sel.list.slice(2);
    const st = S.sel.st ? ' · ' + S.sel.st : '';
    return '<section class="card"><div class="lst-h"><h2>' + t + st + '</h2><span class="crumb">문서 종류 › <b>' + (S.sel.list === 'all' ? '전체' : S.sel.list.slice(2)) + '</b> · 상태 › <b>' + (S.sel.st || '모든 상태') + '</b></span></div>' +
      [['남해군청', '명세 261119-02 · 11월 19일', 199100], ['남해군청 · 겨울 별빛축제', '명세 261119-01 · 11월 19일', 222200], ['남해군청 · 겨울 별빛축제', '견적 261119-01 · 11월 19일', 222200]].map(([n, s, p]) => '<div class="li"><span class="t"><b>' + n + '</b><small>' + s + '</small></span><span class="v num">₩' + won(p) + '</span></div>').join('') + '</section>';
  }
  /* ── 메뉴 규칙 ── */
  function rulePage() {
    const ex = (h) => '<div class="ex' + (S.mk === 'dot' ? ' mk-dot' : '') + '">' + h + '</div>';
    return '<section class="card doc"><h2>메뉴 분류 · 구분 규칙 (대분류 · 중분류 · 소분류)</h2><p>모든 메뉴의 하위 메뉴는 이 세 단계만 써요. 단계마다 <b>모양 · 들여쓰기 · 굵기</b>가 정해져 있어서, 처음 보는 화면도 한눈에 위계가 보여요. 알록달록한 이모지는 쓰지 않고, 같은 색(파랑 · 회색)의 선 아이콘과 기호만 써요.</p>' +
      '<table class="rt"><thead><tr><th>단계</th><th>모양 (앞 표시)</th><th>예</th><th>움직임</th></tr></thead><tbody>' +
      '<tr><td>대분류</td><td>상자 하나 = 대분류 하나. 상자 머리에 <b>선 아이콘(연한 파란 네모)</b> + 굵은 제목(16px · 800), 아래 얇은 선</td><td>' + ex('<h3 class="g-h" style="border:0;padding:4px 0;margin:0"><span class="gi">' + ic('file') + '</span>문서 종류</h3>') + '</td><td>누르지 않아요 (제목)</td></tr>' +
      '<tr><td>중분류</td><td><b>꺾쇠 ›</b>(접힘) / <b>⌄</b>(펼침) + 굵게(15px · 700) + 개수 둥근 칸. 들여쓰기 없음</td><td>' + ex('<button type="button" class="mid" aria-expanded="false" style="padding:0"><span class="chev">' + ic('right') + '</span><span class="lb">전체 품목</span><em class="cnt">79</em></button>') + '</td><td>누르면 펼침 / 한 번 더 누르면 접힘 + 그 묶음 전체 보기</td></tr>' +
      '<tr><td>소분류</td><td><b>한 글자(1em) 들여쓰기</b> + 앞에 <b>' + (S.mk === 'dot' ? '· (점)' : '└ (줄)') + '</b>(옅은 회색) + 보통 굵기(14.5px · 500), 개수는 옅게</td><td>' + ex('<div class="kids" style="padding-left:1em"><button type="button" class="leaf"><span class="lb">천막텐트</span><em class="cnt">1</em></button></div>') + '</td><td>누르면 그 항목만 보기</td></tr>' +
      '<tr><td>도구 줄</td><td>상자 맨 아래 점선 다음, 아이콘 + 파란 글자. 들여쓰기 없음</td><td>' + ex('<button type="button" class="tool" style="border:0;margin:0;padding:0">' + ic('sort') + '분류 순서 바꾸기</button>') + '</td><td>순서 바꾸기 · 추가 같은 작업</td></tr>' +
      '</tbody></table>' +
      '<ol class="rules">' +
      '<li><b>세 단계까지만.</b> 페이지 제목(예: 품목 · 세트) 아래로 대분류 → 중분류 → 소분류. 더 깊어지면 화면을 나눠요.</li>' +
      '<li><b>대분류는 상자로 나눠요.</b> 「문서 종류」와 「상태」처럼 성격이 다른 묶음은 서로 다른 상자에 넣어요 (한 상자에 섞지 않음).</li>' +
      '<li><b>처음 펼침 규칙.</b> 사용자가 늘리는 목록(품목 분류 · 세트 · 거래처)은 <b>접힌 채</b> 시작, 정해진 짧은 목록(문서 종류 · 상태)은 <b>펼친 채</b> 시작. 지금 고른 항목이 든 묶음은 늘 펼쳐요.</li>' +
      '<li><b>고른 표시는 하나.</b> 연한 파란 바탕 + 파란 글자. 굵은 색 막대 · 그림자는 쓰지 않아요.</li>' +
      '<li><b>개수는 오른쪽 끝.</b> 중분류는 둥근 칸, 소분류는 옅은 숫자.</li>' +
      '<li><b>위치 표시.</b> 오른쪽 목록 머리에 「품목 › 전체 품목 › 천막텐트」처럼 지금 위치를 적어요.</li>' +
      '<li><b>휴대폰.</b> 같은 규칙, 줄 높이만 크게(중분류 50px · 소분류 46px). 소분류를 누르면 목록 화면으로 들어가요.</li>' +
      '<li><b>모든 메뉴 같은 규칙.</b> 품목 · 세트, 발행 목록, 설정 · 백업, 거래처, 장비, 매출 등 하위 메뉴가 있는 곳은 모두 이 모양을 따라요.</li>' +
      '</ol></section>';
  }
  /* ── 앱 아이콘 ── */
  function iconPage() {
    const t = (src, w, label, sub, chk) => '<div class="ic-t"><div class="' + (chk ? 'chk' : '') + '" style="padding:8px;border-radius:8px"><img src="icons/' + src + '" width="' + w + '" height="' + w + '" alt="' + label + '"></div><b>' + label + '</b><small>' + sub + '</small></div>';
    const appI = (cls) => '<div class="home ' + cls + '">' + ['', '', 'me', '', '', '', '', ''].map((k) => '<div class="app-i">' + (k ? '<img src="icons/' + (cls === 'ios' ? 'apple-touch-icon.png' : cls === 'and' ? 'icon-maskable-512.png' : 'icon-192.png') + '" alt="">' + '견적서 발행기' : '<span class="ai"></span>&nbsp;') + '</div>').join('') + '</div>';
    return '<section class="card doc"><h2>앱 아이콘 · 웹페이지 아이콘</h2><p>보내 주신 투명 배경 스타미디어 심볼로 크기별 아이콘을 만들었어요. 바둑판 무늬 = 투명한 곳.</p>' +
      '<div class="icons">' + t('favicon-16.png', 16, '16 × 16', '브라우저 탭', true) + t('favicon-32.png', 32, '32 × 32', '브라우저 탭 (선명한 화면)', true) + t('favicon-48.png', 48, '48 × 48', '윈도 바로 가기', true) +
      t('apple-touch-icon.png', 90, '180 × 180', '아이폰 바탕화면 (흰 바탕)', false) + t('icon-192.png', 96, '192 × 192', '안드로이드 · PC 앱 (투명)', true) + t('icon-512.png', 120, '512 × 512', '앱 설치 화면 (투명)', true) + t('icon-maskable-512.png', 120, '512 × 512', '안드로이드 둥근 아이콘 (흰 바탕)', false) + '</div>' +
      '<div class="mock"><div><h4>브라우저 탭</h4><div class="tabbar"><div class="tab"><img src="icons/favicon-32.png" width="16" height="16" alt="">스타미디어 견적서 발행기</div><div class="addr">gonynas.github.io/STARmedia/Invoice/dist/</div></div></div>' +
      '<div><h4>아이폰 바탕화면</h4>' + appI('ios') + '</div><div><h4>안드로이드 바탕화면</h4>' + appI('and') + '</div><div><h4>PC(윈도) 바탕화면 · 앱</h4>' + appI('win') + '</div></div>' +
      '<p class="note">아이폰은 바탕화면 아이콘의 투명한 곳을 <b>검은색</b>으로 채워요. 그래서 아이폰용(180)과 안드로이드 둥근 아이콘은 <b>흰 바탕</b>으로, 브라우저 탭 · PC 앱 · 설치 화면은 <b>투명</b>으로 만들었어요. 바꾼 뒤 이미 바탕화면에 깔린 아이콘은 지우고 다시 만들어야 새 그림으로 바뀌어요(휴대폰이 옛 그림을 기억해서).</p></section>';
  }

  /* ── 큰 틀 · 그리기 ── */
  function shell(body) {
    const nav = [['home', '홈', 'home'], ['list', '발행 목록', 'list'], ['clients', '거래처', 'users'], ['items', '품목 · 세트', 'layers'], ['set', '설정 · 백업', 'sliders']];
    return '<div class="app"><aside class="side"><img class="logo" src="../../assets/starmedia-logo.png" alt="STARmedia 스타미디어 기획사">' +
      nav.map(([k, l, i]) => '<a href="#" class="' + (k === S.s ? 'on' : '') + '">' + ic(i) + l + '</a>').join('') + '</aside><main class="main">' + body + '</main></div>';
  }
  function render() {
    let body;
    if (S.s === 'rule') body = '<header class="ph"><h1>메뉴 규칙</h1><p>시안 · v1.6.2 후보</p></header>' + rulePage();
    else if (S.s === 'icon') body = '<header class="ph"><h1>앱 아이콘</h1><p>시안 · v1.6.2 후보</p></header>' + iconPage();
    else if (S.s === 'items') body = '<header class="ph"><h1>품목 · 세트</h1><p>' + (S.view === 'new' ? '새 규칙' : '지금(v1.6.1)') + '</p></header><div class="cols">' + (S.view === 'new' ? navItems() : oldItems()) + listItems() + '</div>';
    else body = '<header class="ph"><h1>발행 목록</h1><p>' + (S.view === 'new' ? '새 규칙' : '지금(v1.6.1)') + '</p></header><div class="cols">' + (S.view === 'new' ? navList() : oldList()) + listDocs() + '</div>';
    document.getElementById('app').innerHTML = shell(body);
    document.querySelectorAll('.pick [data-s]').forEach((b) => b.classList.toggle('on', b.dataset.s === S.s));
    document.querySelectorAll('.pick [data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === S.view));
    document.querySelectorAll('.pick [data-mk]').forEach((b) => b.classList.toggle('on', b.dataset.mk === S.mk));
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.tagName === 'A') e.preventDefault();
    const d = t.dataset;
    if (d.s) S.s = d.s;
    else if (d.view) S.view = d.view;
    else if (d.mk) S.mk = d.mk;
    else if (d.mid) {   // 중분류: 누르면 펼침/접힘 + 그 묶음 전체 보기
      S.open[d.mid] = !S.open[d.mid];
      if (d.mid === 'all') S.sel.items = 'all'; else if (d.mid === 'sets') S.sel.items = 'sets'; else if (d.mid === 'types') S.sel.list = 'all'; else if (d.mid === 'sts') S.sel.st = '';
    } else if (d.leaf) { const i = d.leaf.indexOf(':'); S.sel[d.leaf.slice(0, i)] = d.leaf.slice(i + 1); }
    else return;
    render();
  });
  const q = new URLSearchParams(location.search);
  if (q.get('s')) S.s = q.get('s'); if (q.get('view')) S.view = q.get('view'); if (q.get('mk')) S.mk = q.get('mk');
  if (q.get('open')) q.get('open').split(',').forEach((k) => { S.open[k] = true; });
  if (q.get('sel')) S.sel.items = q.get('sel');
  render();
})();
