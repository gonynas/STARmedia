// 보완 시안: 행사 한 건 묶음 · 최종 합의금액(P01) · 여러 번 입금(Q02, P03) · 완납 영수증(Q03) · 저장 상태 · 충돌(Q09)
var EVT = {
  name: '2026 가을 별빛축제',
  start: '2026-11-21', end: '2026-11-22', out: '2026-11-20', back: '2026-11-23',
  agreed: 6600000,
  docs: [
    { type: 'quote', no: '견적 261112-01', ver: '처음 견적', status: 'sent', base: false, date: '11/12' },
    { type: 'quote', no: '견적 261112-01-2', ver: '수정 2차 · 계약 기준', status: 'contract', base: true, date: '11/13' },
    { type: 'stmt', no: '명세 261122-01', ver: '', status: 'sent', base: false, date: '11/22' },
    { type: 'inv', no: '청구 261122-01', ver: '', status: 'sent', base: false, date: '11/22' }
  ],
  pays: [
    { date: '2026-11-14', amt: 1000000, method: '계좌이체', memo: '계약금', cancel: false },
    { date: '2026-11-20', amt: 500000, method: '현금', memo: '금액 잘못 적음', cancel: true },
    { date: '2026-11-22', amt: 3000000, method: '계좌이체', memo: '중도금', cancel: false }
  ]
};

// P01: 최종 합의금액(VAT 포함)을 ÷1.1로 다시 나누고, 원래 합계와의 차이를 「끝자리 정리」 한 줄로
function evMoney() {
  var t = Calc.totals({ lines: DOC.lines, vat: DOC.vat });
  var agreed = EVT.agreed || t.total, s, x;
  if (DOC.vat === 'none') { s = agreed; x = 0; } else { s = Math.round(agreed / 1.1); x = agreed - s; }
  var got = EVT.pays.reduce(function (a, p) { return a + (p.cancel ? 0 : p.amt); }, 0);
  return { orig: t, agreed: agreed, supply: s, tax: x, dSupply: s - t.supply, dTax: x - t.tax, disc: agreed - t.total, got: got, left: agreed - got };
}

function evMoneyBox() {
  var m = evMoney();
  var leftTxt = m.left > 0 ? '₩' + Calc.won(m.left) : m.left === 0 ? '완납' : '−₩' + Calc.won(-m.left) + ' <small>(더 받음)</small>';
  return '<div class="evm">' +
    '<div class="evm-row"><span>원래 합계 <small>VAT 포함</small></span><b class="num">₩' + Calc.won(m.orig.total) + '</b></div>' +
    '<div class="evm-row agreed"><label for="evAgreed">최종 합의금액</label><div class="evm-in"><input class="in num" id="evAgreed" inputmode="numeric" value="' + Calc.won(m.agreed) + '"><span>원</span></div></div>' +
    '<div class="evm-row disc"><span>끝자리 정리 <small>자동 계산</small></span><b class="num">' + (m.disc ? '−' + Calc.won(-m.disc) : '0') + '원</b></div>' +
    '<p class="evm-split">문서에는 품목표 맨 아래에 <b>「끝자리 정리」 한 줄</b>로 들어가요 — 공급가액 <b class="num">' + Calc.won(m.dSupply) + '</b> / 세액 <b class="num">' + Calc.won(m.dTax) + '</b>. 품목 단가는 그대로예요.</p>' +
    '<div class="evm-big"><div><span>받은 금액 (누적)</span><b class="num">₩' + Calc.won(m.got) + '</b></div><div class="' + (m.left < 0 ? 'over' : m.left === 0 ? 'done' : '') + '"><span>남은 금액</span><b class="num">' + leftTxt + '</b></div></div>' +
    (m.left < 0 ? '<p class="evm-warn">' + ic('alert') + '<span>더 받은 금액이 있어요. 돌려주면 입금 내역에 <b>「환불 −' + Calc.won(-m.left) + '원」</b>을 한 줄 적어 주세요.</span></p>' : '') +
    '</div>';
}

function evPayRows() {
  return EVT.pays.map(function (p, i) {
    return '<tr class="' + (p.cancel ? 'cancel' : '') + (p.amt < 0 ? ' refund' : '') + '"><td class="num">' + Calc.md(p.date) + '</td><td class="r num"><b>' + (p.amt < 0 ? '−' + Calc.won(-p.amt) : Calc.won(p.amt)) + '원</b></td><td>' + p.method + '</td><td>' + esc(p.memo) + (p.cancel ? ' <span class="schip s-cancel">취소됨</span>' : '') + '</td>' +
      '<td class="c">' + (p.cancel ? '<span class="muted">기록만 남음</span>' : '<button class="btn sm danger-o" data-paycancel="' + i + '">' + ic('x') + '취소 표시</button>') + '</td></tr>';
  }).join('');
}

function evDocs() {
  var m = evMoney(), full = m.left <= 0;
  var rows = EVT.docs.map(function (d) {
    return '<li class="' + (d.base ? 'base' : '') + '">' + typeChip(d.type) + '<span class="evd-no num">' + d.no + '</span><span class="evd-ver">' + (d.ver || '') + '</span>' + statusChip(d.status) + (d.base ? '<span class="evd-base">' + ic('check') + '계약 기준</span>' : '') + '<span class="evd-date num">' + d.date + '</span></li>';
  }).join('');
  return '<ul class="evdocs">' + rows +
    '<li class="rcpt ' + (full ? 'ok' : 'locked') + '">' + typeChip('rcpt') + '<span class="evd-no">완납 영수증</span>' +
    (full ? '<button class="btn sm primary" data-toast>' + ic('plus') + '완납 영수증 만들기</button>' : '<span class="evd-lock">' + ic('lock') + '아직 ' + Calc.won(m.left) + '원 남아서 만들 수 없어요</span>') + '</li></ul>';
}

function eventPage() {
  return '<div class="evpage">' +
    '<section class="card ev-head"><div class="evh-l"><span class="evh-tag">행사 한 건</span><h2>' + EVT.name + '</h2>' +
    '<p>' + esc(DOC.client.name) + ' · ' + esc(DOC.client.person) + '</p></div>' +
    '<dl class="evh-dates"><dt>행사 일정</dt><dd class="num">' + Calc.md(EVT.start) + ' ~ ' + Calc.md(EVT.end) + '</dd><dt>장비 반출 · 반납</dt><dd class="num">' + Calc.md(EVT.out) + ' → ' + Calc.md(EVT.back) + '</dd><dt>과금 일수</dt><dd>품목마다 따로 (일정과 별개)</dd></dl>' +
    '<p class="evh-note">' + ic('layers') + '<span>이 행사의 견적서 · 수정본 · 거래명세서 · 청구서 · 영수증은 <b>하나로 묶여</b> 있어서, 문서를 여러 장 만들어도 매출 · 미수금 · 장비 예약은 <b>한 번만</b> 계산돼요.</span></p></section>' +
    '<div class="ev-cols">' +
    '<section class="card"><div class="card-h"><h2>' + ic('fileText') + '이 행사의 문서</h2><span class="hint">계약 기준은 수정본 중 하나만</span></div>' + evDocs() +
    '<div class="ev-docbtns"><button class="btn" data-toast>' + ic('plus') + '같은 행사로 다른 문서 만들기</button><button class="btn ghost" data-toast>' + ic('copy') + '복사해서 새 거래 만들기 <small>(입금 내역은 안 따라가요)</small></button></div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('won') + '금액 · 입금</h2></div><div id="evMoney">' + evMoneyBox() + '</div></section>' +
    '</div>' +
    '<section class="card"><div class="card-h"><h2>' + ic('list') + '입금 내역</h2><span class="hint">선금 · 중도금 · 잔금을 몇 번이든 적어요. 잘못 적은 건 지우지 않고 「취소 표시」</span></div>' +
    '<div class="tbl-wrap"><table class="tbl evpay"><thead><tr><th>날짜</th><th class="r">금액</th><th>방법</th><th>메모</th><th class="c">관리</th></tr></thead><tbody id="evPays">' + evPayRows() + '</tbody></table></div>' +
    '<div class="evadd"><label class="fld"><span>입금 날짜</span><input class="in" type="date" id="pDate" value="2026-11-28"></label>' +
    '<label class="fld"><span>금액 (환불은 − 붙여서)</span><input class="in num" id="pAmt" inputmode="numeric" placeholder="예: 2,600,000"></label>' +
    '<label class="fld"><span>방법</span><select class="in" id="pMethod"><option>계좌이체</option><option>현금</option><option>카드</option><option>환불</option></select></label>' +
    '<label class="fld"><span>메모</span><input class="in" id="pMemo" placeholder="예: 잔금"></label>' +
    '<button class="btn primary big" data-act="payadd">' + ic('plus') + '입금 추가</button></div>' +
    '<p class="note">' + ic('alert') + '<span>견적서의 「선금 받기」 스위치는 견적서에 <b>예상 선금</b>을 보여 주는 것이고, 실제로 받은 돈은 여기 <b>입금 내역</b>에만 적어요.</span></p></section>' +
    '<div class="ev-cols">' +
    '<section class="card"><div class="card-h"><h2>' + ic('cloud') + '저장 상태</h2><span class="hint">곳마다 따로 보여 줘요 (예시)</span></div><ul class="savest">' +
    '<li class="ok">' + ic('check') + '<b>이 기기</b><span>저장됨 · 방금</span></li>' +
    '<li class="fail">' + ic('alert') + '<b>PC 폴더</b><span>접근 실패 — 폴더 연결이 끊겼어요</span><button class="btn sm" data-toast>다시 시도</button><button class="btn sm ghost" data-toast>폴더 다시 고르기</button></li>' +
    '<li class="off">' + ic('cloud') + '<b>구글 드라이브</b><span>연결 안 됨 (2단계에서 연결)</span></li></ul></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('copy') + '두 기기에서 같이 고쳤을 때</h2><span class="hint">2단계 · 예시</span></div>' +
    '<p class="cf-msg">PC와 아이폰에서 같은 견적서를 따로 고쳤어요. 쓸 것을 골라 주세요. <b>고르지 않은 쪽도 지우지 않고 보관</b>해요.</p>' +
    '<div class="cf"><div class="cf-v">' + ic('monitor') + '<b>PC 수정본</b><span>11/13 14:20 · 의자 250 → 300개</span><button class="btn sm primary" data-toast>이걸로 쓰기</button></div>' +
    '<div class="cf-v">' + ic('phone') + '<b>아이폰 수정본</b><span>11/13 14:35 · 행사 장소 변경</span><button class="btn sm" data-toast>이걸로 쓰기</button></div></div></section>' +
    '</div></div>';
}

function evRedraw(root) {
  var mb = root.querySelector('#evMoney'); if (mb) mb.innerHTML = evMoneyBox();
  var pr = root.querySelector('#evPays'); if (pr) pr.innerHTML = evPayRows();
  var dl = root.querySelector('.evdocs'); if (dl) dl.outerHTML = evDocs();
}

function eventClick(e, root, a) {
  var pc = e.target.closest('[data-paycancel]');
  if (pc) {
    var p = EVT.pays[+pc.dataset.paycancel];
    openModal({ tone: 'danger', icon: 'x', title: '이 입금을 취소로 표시할까요?',
      body: '<ul class="mlist"><li><b>' + Calc.md(p.date) + ' · ' + Calc.won(p.amt) + '원</b><span>' + p.method + '</span></li></ul><p class="mnote">기록은 지우지 않고 「취소됨」으로 남아요. 받은 금액 · 남은 금액이 다시 계산되고, 이미 만든 완납 영수증은 「무효」로 표시돼요.</p>',
      ok: '취소로 표시', onOk: function () { p.cancel = true; evRedraw(root); toast('입금을 취소로 표시했어요 (시안)'); } });
    return true;
  }
  if (a && a.dataset.act === 'payadd') {
    var amt = Calc.parse(root.querySelector('#pAmt').value), neg = /^\s*[-−]/.test(root.querySelector('#pAmt').value);
    if (!amt) { toast('금액을 넣어 주세요'); return true; }
    var method = root.querySelector('#pMethod').value;
    if (neg || method === '환불') amt = -Math.abs(amt);
    EVT.pays.push({ date: root.querySelector('#pDate').value || '2026-11-28', amt: amt, method: method, memo: root.querySelector('#pMemo').value.trim(), cancel: false });
    root.querySelector('#pAmt').value = ''; root.querySelector('#pMemo').value = '';
    evRedraw(root); toast('입금 ' + Calc.won(amt) + '원을 적었어요 (시안)'); return true;
  }
  return false;
}

function eventInput(e, root) {
  if (e.target.id === 'evAgreed') {
    EVT.agreed = Calc.parse(e.target.value);
    var m = evMoney(), box = root.querySelector('#evMoney');
    // 입력 중인 칸은 그대로 두고 나머지 숫자만 다시 그린다
    var tmp = document.createElement('div'); tmp.innerHTML = evMoneyBox();
    box.querySelectorAll('.evm-row.disc, .evm-split, .evm-big, .evm-warn').forEach(function (n) { n.remove(); });
    tmp.querySelectorAll('.evm-row.disc, .evm-split, .evm-big, .evm-warn').forEach(function (n) { box.querySelector('.evm').appendChild(n); });
    var dl = root.querySelector('.evdocs'); if (dl) dl.outerHTML = evDocs();
    return m;
  }
}
