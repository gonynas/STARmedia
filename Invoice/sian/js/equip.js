// 장비 관리 (3차 시안): 수정 · 삭제(여러 개 선택) · 수량 변경 저장 · 확인 창
// sel = 체크한 장비, pending = − + 로 바꿨지만 아직 저장하지 않은 총 수량
var EQ = { day: 0, cat: '전체', sel: {}, pending: {}, next: 1 };
EQUIP.forEach(function (e) { if (!e.id) e.id = 'e' + (EQ.next++); });

function eqById(id) { for (var i = 0; i < EQUIP.length; i++) if (EQUIP[i].id === id) return EQUIP[i]; return null; }
function eqTotal(e) { return EQ.pending[e.id] !== undefined ? EQ.pending[e.id] : e.total; }
function eqOut(e) { return e.outs ? (e.outs[EQ.day] || 0) : 0; }
function eqLeft(e) { return eqTotal(e) - eqOut(e); }
// 부족하면 음수를 0으로 숨기지 않고 「N개 부족」으로 보여 준다
function eqState(e) {
  var left = eqLeft(e), tot = eqTotal(e);
  if (left < 0) return ['short', (-left) + '개 부족'];
  if (left === 0) return ['none', '모두 예약됨'];
  if (left / tot < 0.2) return ['low', '얼마 안 남음'];
  return ['ok', '넉넉함'];
}
function eqLabel(e) { return esc(e.name) + (e.spec ? ' ' + esc(e.spec) : ''); }

function eqStepper(e) {
  var ch = EQ.pending[e.id] !== undefined;
  return '<div class="stepper' + (ch ? ' changed' : '') + '" data-id="' + e.id + '"><button class="stp" data-stp="-1" aria-label="총 수량 1개 줄이기">' + ic('minus') + '</button>' +
    '<input class="in num" value="' + eqTotal(e) + '" inputmode="numeric" aria-label="' + eqLabel(e) + ' 총 보유 수량"><button class="stp" data-stp="1" aria-label="총 수량 1개 늘리기">' + ic('plus') + '</button></div>' +
    (ch ? '<small class="was">원래 ' + e.total + '개 · 저장 전</small>' : '');
}

function eqBar(e) {
  var st = eqState(e), tot = eqTotal(e), left = eqLeft(e);
  var pct = tot ? Math.max(0, Math.round(left / tot * 100)) : 0;
  var head = left < 0 ? '<b class="num">' + (-left) + '</b><span>개 모자람</span>' : '<b class="num">' + left + '</b><span>개 남음</span>';
  return '<div class="eqbar ' + st[0] + '"><div class="eqbar-t">' + head + '<em>' + st[1] + '</em></div><i><b style="width:' + (left < 0 ? 100 : pct) + '%"></b></i></div>';
}

function eqActs(e) {
  return '<div class="eqacts"><button class="btn sm" data-eqedit="' + e.id + '">' + ic('sliders') + '수정</button><button class="btn sm danger-o" data-eqdel="' + e.id + '">' + ic('trash') + '삭제</button></div>';
}

function eqList() { return EQUIP.filter(function (e) { return EQ.cat === '전체' || e.cat === EQ.cat; }); }

function eqRows() {
  var list = eqList();
  var rows = list.map(function (e) {
    var on = !!EQ.sel[e.id];
    return '<tr class="' + (on ? 'sel' : '') + '"><td class="c"><input type="checkbox" class="chk" data-eqsel="' + e.id + '"' + (on ? ' checked' : '') + ' aria-label="' + eqLabel(e) + ' 선택"></td>' +
      '<td class="eqnm"><span class="eqcat">' + e.cat + '</span><b>' + esc(e.name) + '</b><small>' + esc(e.spec) + (e.memo ? ' · ' + esc(e.memo) : '') + ' · ' + Calc.won(e.price) + '원</small></td>' +
      '<td class="eqst">' + eqStepper(e) + '</td>' +
      '<td class="c num eqout"><b>' + eqOut(e) + '</b>개</td>' +
      '<td class="eqleft">' + eqBar(e) + '</td>' +
      '<td>' + eqActs(e) + '</td></tr>';
  }).join('');
  var cards = list.map(function (e) {
    var on = !!EQ.sel[e.id];
    return '<li class="eqcard' + (on ? ' sel' : '') + '"><div class="eqc-top"><input type="checkbox" class="chk" data-eqsel="' + e.id + '"' + (on ? ' checked' : '') + ' aria-label="' + eqLabel(e) + ' 선택"><span class="eqcat">' + e.cat + '</span><b>' + esc(e.name) + '</b><small>' + esc(e.spec) + '</small></div>' +
      '<div class="eqc-mid"><div><span class="eqc-l">총 보유</span>' + eqStepper(e) + '</div><div class="eqc-out"><span class="eqc-l">이 날 나감</span><b class="num">' + eqOut(e) + '개</b></div></div>' +
      eqBar(e) + eqActs(e) + '</li>';
  }).join('');
  if (!list.length) rows = '<tr><td colspan="6" class="c empty-msg">등록된 장비가 없어요. 오른쪽에서 장비를 등록해 주세요.</td></tr>';
  return { rows: rows, cards: cards || '<li class="empty-msg">등록된 장비가 없어요.</li>' };
}

function eqSummary() {
  var kinds = EQUIP.length, total = 0, out = 0, short = 0;
  EQUIP.forEach(function (e) { total += eqTotal(e); out += eqOut(e); if (eqState(e)[0] !== 'ok') short++; });
  return '<div class="eqsum">' +
    '<div class="eqk"><span>' + ic('tent') + '등록한 장비</span><b class="num">' + kinds + '<small>종류</small></b></div>' +
    '<div class="eqk"><span>' + ic('layers') + '총 보유 수량</span><b class="num">' + Calc.won(total) + '<small>개</small></b></div>' +
    '<div class="eqk"><span>' + ic('truck') + EQUIP_DAYS[EQ.day][0] + ' 나가는 장비</span><b class="num">' + Calc.won(out) + '<small>개</small></b></div>' +
    '<div class="eqk warn"><span>' + ic('alert') + '부족하거나 얼마 안 남음</span><b class="num">' + short + '<small>종류</small></b></div>' +
    '</div>';
}

function eqBulkBar() {
  var list = eqList(), n = Object.keys(EQ.sel).length;
  var allOn = list.length > 0 && list.every(function (e) { return EQ.sel[e.id]; });
  return '<label class="chkall"><input type="checkbox" class="chk" id="eqAll"' + (allOn ? ' checked' : '') + '><span>보이는 장비 모두 선택</span></label>' +
    '<span class="seln"><b>' + n + '</b>개 선택</span>' +
    '<button class="btn sm danger" data-act="eqdelsel"' + (n ? '' : ' disabled') + '>' + ic('trash') + '선택한 장비 삭제</button>';
}

function eqPendBar() {
  var n = Object.keys(EQ.pending).length;
  return '<span class="pmsg">' + ic('alert') + '<span>수량을 바꾼 장비 <b>' + n + '</b>개 — <b>변경 저장</b>을 눌러야 반영돼요</span></span>' +
    '<button class="btn sm ghost" data-act="eqrevert">되돌리기</button><button class="btn sm primary" data-act="eqsave">' + ic('check') + '변경 저장</button>';
}

function equipPage() {
  var r = eqRows();
  var days = EQUIP_DAYS.map(function (d, i) { return '<button class="fchip' + (i === EQ.day ? ' on' : '') + '" data-eqday="' + i + '">' + d[0] + ' <small>' + d[1] + '</small></button>'; }).join('');
  var cats = ['전체'].concat(EQUIP_CATS.slice(0, 4)).map(function (c) { return '<button class="fchip' + (c === EQ.cat ? ' on' : '') + '" data-eqcat="' + c + '">' + c + '</button>'; }).join('');
  var catOpts = EQUIP_CATS.map(function (c) { return '<option>' + c + '</option>'; }).join('');
  return '<div class="eqpage">' +
    '<section class="card eq-sumcard">' + eqSummary() + '</section>' +
    '<div class="eq-cols">' +
    '<section class="card eq-list"><div class="card-h"><h2>' + ic('tent') + '장비 목록</h2><span class="hint">− + 로 수량을 바꾸고 「변경 저장」 · 다른 내용은 「수정」</span></div>' +
    '<div class="eq-filter"><span class="ol">날짜</span><div class="fchips">' + days + '</div></div>' +
    '<div class="eq-filter"><span class="ol">분류</span><div class="fchips">' + cats + '</div></div>' +
    '<div class="eq-bulk" id="eqBulk">' + eqBulkBar() + '</div>' +
    '<div class="tbl-wrap"><table class="tbl eqtbl"><thead><tr><th class="c">선택</th><th>장비 · 규격 · 기본 단가</th><th>총 보유 수량</th><th class="c">이 날 나감</th><th>남은 수량</th><th>관리</th></tr></thead><tbody id="eqrows">' + r.rows + '</tbody></table></div>' +
    '<ul class="eqcards" id="eqcards">' + r.cards + '</ul>' +
    '<div class="eq-pend" id="eqPend"' + (Object.keys(EQ.pending).length ? '' : ' hidden') + '>' + eqPendBar() + '</div>' +
    '<p class="note eqnote">' + ic('calendar') + '<span>「이 날 나감」은 그날 행사로 <b>계약</b>된 수량을 더한 값이에요. 날짜별 예약 계산 · 부족 경고는 3단계에서 실제로 작동해요(지금은 예시 숫자).</span></p>' +
    '</section>' +
    '<section class="card eq-form"><div class="card-h"><h2>' + ic('plus') + '장비 등록</h2></div><div class="fgrid one">' +
    '<label class="fld"><span>장비 이름</span><input class="in" id="eqName" placeholder="예: 몽골텐트"></label>' +
    '<label class="fld"><span>분류</span><select class="in" id="eqCat">' + catOpts + '</select></label>' +
    '<label class="fld"><span>규격</span><input class="in" id="eqSpec" placeholder="예: 5×5m"></label>' +
    '<div class="fld"><span>총 보유 수량</span><div class="stepper big" data-id="new"><button class="stp" data-stp="-1" aria-label="1개 줄이기">' + ic('minus') + '</button><input class="in num" id="eqTotal" value="1" inputmode="numeric" aria-label="총 보유 수량"><button class="stp" data-stp="1" aria-label="1개 늘리기">' + ic('plus') + '</button></div></div>' +
    '<label class="fld"><span>기본 대여 단가 (원)</span><input class="in num" id="eqPrice" inputmode="numeric" placeholder="예: 170,000"></label>' +
    '<label class="fld"><span>메모</span><input class="in" id="eqMemo" placeholder="예: 흰색 12 · 파랑 8"></label>' +
    '</div><button class="btn primary big wide" data-act="eqadd">' + ic('plus') + '장비 등록하기</button>' +
    '<p class="note">' + ic('layers') + '<span>등록한 장비는 「품목」에도 들어가서 견적서에서 바로 골라 쓸 수 있어요.</span></p>' +
    '</section></div></div>';
}

function redrawEquip(root) {
  var r = eqRows();
  var tb = root.querySelector('#eqrows'), cd = root.querySelector('#eqcards'), sm = root.querySelector('.eq-sumcard');
  var bk = root.querySelector('#eqBulk'), pd = root.querySelector('#eqPend');
  if (tb) tb.innerHTML = r.rows;
  if (cd) cd.innerHTML = r.cards;
  if (sm) sm.innerHTML = eqSummary();
  if (bk) bk.innerHTML = eqBulkBar();
  if (pd) { pd.innerHTML = eqPendBar(); pd.hidden = !Object.keys(EQ.pending).length; }
}

function eqEditForm(e) {
  var catOpts = EQUIP_CATS.map(function (c) { return '<option' + (c === e.cat ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  return '<div class="fgrid m-form">' +
    '<label class="fld span2"><span>장비 이름</span><input class="in" id="mName" value="' + esc(e.name) + '"></label>' +
    '<label class="fld"><span>분류</span><select class="in" id="mCat">' + catOpts + '</select></label>' +
    '<label class="fld"><span>규격</span><input class="in" id="mSpec" value="' + esc(e.spec) + '"></label>' +
    '<div class="fld span2"><span>총 보유 수량 <small class="was-l">지금 ' + e.total + '개</small></span>' +
    '<div class="qty-row"><div class="stepper big" data-id="modal"><button class="stp" data-stp="-1" aria-label="1개 줄이기">' + ic('minus') + '</button><input class="in num" id="mTotal" value="' + eqTotal(e) + '" data-orig="' + e.total + '" inputmode="numeric" aria-label="총 보유 수량"><button class="stp" data-stp="1" aria-label="1개 늘리기">' + ic('plus') + '</button></div>' +
    '<div class="qbtns"><button class="pchip" data-qadd="-5">−5</button><button class="pchip" data-qadd="5">+5</button><button class="pchip" data-qadd="10">+10</button></div></div>' +
    '<small class="qdiff" id="mDiff"></small></div>' +
    '<label class="fld"><span>기본 대여 단가 (원)</span><input class="in num" id="mPrice" inputmode="numeric" value="' + Calc.won(e.price) + '"></label>' +
    '<label class="fld"><span>메모</span><input class="in" id="mMemo" value="' + esc(e.memo || '') + '"></label>' +
    '</div>';
}

function eqDiffHint() {
  var t = document.getElementById('mTotal'), d = document.getElementById('mDiff'); if (!t || !d) return;
  var v = Math.max(0, Math.round(Calc.parse(t.value))), o = +t.dataset.orig, k = v - o;
  d.textContent = k === 0 ? '수량은 그대로예요' : (o + '개 → ' + v + '개 (' + (k > 0 ? '+' : '') + k + '개)');
  d.className = 'qdiff' + (k > 0 ? ' up' : k < 0 ? ' down' : '');
}

/* ── 확인 창 (팝업) ── */
var MODAL = { onOk: null, gen: 0 };

function modalBox() {
  return '<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="modal-card">' +
    '<div class="modal-h"><span class="modal-ic" id="mIcon"></span><h3 id="mTitle"></h3></div>' +
    '<div class="modal-body" id="mBody"></div>' +
    '<div class="modal-act"><button class="btn big ghost" data-modal="cancel" id="mCancel">취소</button><button class="btn big primary" data-modal="ok" id="mOk">확인</button></div>' +
    '</div></div>';
}

function openModal(o) {
  var m = document.getElementById('modal'); if (!m) return;
  MODAL.gen++; MODAL.onOk = o.onOk || null;
  m.className = 'modal on ' + (o.tone || 'primary');
  document.getElementById('mIcon').innerHTML = ic(o.icon || 'alert');
  document.getElementById('mTitle').textContent = o.title;
  document.getElementById('mBody').innerHTML = o.body || '';
  var ok = document.getElementById('mOk'), cc = document.getElementById('mCancel');
  ok.textContent = o.ok || '확인';
  ok.className = 'btn big ' + (o.tone === 'danger' ? 'danger' : 'primary');
  cc.textContent = o.cancel || '취소';
  setTimeout(function () { var f = m.querySelector('.modal-body input'); (f || ok).focus(); }, 30);
}

function closeModal() { var m = document.getElementById('modal'); if (m) m.className = 'modal'; MODAL.onOk = null; }

function modalClick(e) {
  var b = e.target.closest('[data-modal]');
  if (e.target.id === 'modal') { closeModal(); return true; }
  if (!b) {
    var q = e.target.closest('[data-qadd]');
    if (q) { var t = document.getElementById('mTotal'); t.value = Math.max(0, Math.round(Calc.parse(t.value)) + (+q.dataset.qadd)); eqDiffHint(); return true; }
    return false;
  }
  if (b.dataset.modal === 'cancel') { closeModal(); return true; }
  var gen = MODAL.gen, fn = MODAL.onOk;
  var keep = fn ? fn() : undefined;
  // 확인을 누른 뒤 다른 확인 창을 열었거나 입력이 잘못됐으면 닫지 않는다
  if (keep !== false && MODAL.gen === gen) closeModal();
  return true;
}

function diffRow(k, a, b) { return '<li><span class="dk">' + k + '</span><s>' + a + '</s>' + ic('arrowRight') + '<b>' + b + '</b></li>'; }
function nameList(arr) {
  var shown = arr.slice(0, 6).map(function (e) { return '<li><b>' + eqLabel(e) + '</b><span>총 ' + e.total + '개</span></li>'; }).join('');
  return '<ul class="mlist">' + shown + (arr.length > 6 ? '<li class="more">외 ' + (arr.length - 6) + '개</li>' : '') + '</ul>';
}

/* ── 장비 관리 버튼 동작 ── */
function eqConfirmDelete(root, arr) {
  openModal({
    tone: 'danger', icon: 'trash', title: arr.length > 1 ? '장비 ' + arr.length + '개를 지울까요?' : '이 장비를 지울까요?',
    body: nameList(arr) + '<p class="mnote">지운 장비는 <b>휴지통에 30일</b> 동안 보관돼요. 이미 만든 문서는 그대로 남지만, 새 견적서에서는 고를 수 없어요.</p>',
    ok: '삭제', onOk: function () {
      arr.forEach(function (e) { var i = EQUIP.indexOf(e); if (i >= 0) EQUIP.splice(i, 1); delete EQ.sel[e.id]; delete EQ.pending[e.id]; });
      redrawEquip(root); toast('장비 ' + arr.length + '개를 휴지통으로 옮겼어요 (시안)');
    }
  });
}

function eqOpenEdit(root, e) {
  openModal({
    icon: 'sliders', title: '장비 수정 — ' + e.name, body: eqEditForm(e), ok: '저장', cancel: '닫기',
    onOk: function () {
      var nm = document.getElementById('mName').value.trim();
      if (!nm) { toast('장비 이름을 넣어 주세요'); return false; }
      var nv = { name: nm, cat: document.getElementById('mCat').value, spec: document.getElementById('mSpec').value.trim(),
        total: Math.max(0, Math.round(Calc.parse(document.getElementById('mTotal').value))),
        price: Calc.parse(document.getElementById('mPrice').value), memo: document.getElementById('mMemo').value.trim() };
      var rows = '';
      if (nv.name !== e.name) rows += diffRow('장비 이름', esc(e.name), esc(nv.name));
      if (nv.cat !== e.cat) rows += diffRow('분류', e.cat, nv.cat);
      if (nv.spec !== e.spec) rows += diffRow('규격', esc(e.spec) || '(없음)', esc(nv.spec) || '(없음)');
      if (nv.total !== e.total) rows += diffRow('총 보유 수량', e.total + '개', nv.total + '개 (' + (nv.total > e.total ? '+' : '') + (nv.total - e.total) + ')');
      if (nv.price !== e.price) rows += diffRow('기본 단가', Calc.won(e.price) + '원', Calc.won(nv.price) + '원');
      if (nv.memo !== (e.memo || '')) rows += diffRow('메모', esc(e.memo) || '(없음)', esc(nv.memo) || '(없음)');
      if (!rows) { toast('바뀐 내용이 없어요'); return; }
      openModal({
        icon: 'check', title: '이대로 고칠까요?', body: '<p class="msub">' + eqLabel(e) + '</p><ul class="mdiff">' + rows + '</ul><p class="mnote">이미 보낸 문서의 금액 · 품목은 바뀌지 않아요.</p>',
        ok: '네, 고칠게요', cancel: '다시 보기', onOk: function () {
          Object.keys(nv).forEach(function (k) { e[k] = nv[k]; });
          delete EQ.pending[e.id];
          redrawEquip(root); toast('「' + e.name + '」을(를) 고쳤어요 (시안)');
        }
      });
    }
  });
  eqDiffHint();
}

function equipClick(ev, root, a) {
  var stp = ev.target.closest('[data-stp]');
  if (stp) {
    var box = stp.closest('.stepper'), inp = box.querySelector('input');
    var n = Math.max(0, Math.round(Calc.parse(inp.value)) + (+stp.dataset.stp)), id = box.dataset.id;
    if (id === 'new') { inp.value = Math.max(1, n); return true; }
    if (id === 'modal') { inp.value = n; eqDiffHint(); return true; }
    var e = eqById(id); if (!e) return true;
    if (n === e.total) delete EQ.pending[id]; else EQ.pending[id] = n;
    redrawEquip(root); return true;
  }
  var dd = ev.target.closest('[data-eqday]'); if (dd) { EQ.day = +dd.dataset.eqday; root.querySelectorAll('[data-eqday]').forEach(function (b) { b.classList.toggle('on', b === dd); }); redrawEquip(root); return true; }
  var cc = ev.target.closest('[data-eqcat]'); if (cc) { EQ.cat = cc.dataset.eqcat; root.querySelectorAll('[data-eqcat]').forEach(function (b) { b.classList.toggle('on', b === cc); }); redrawEquip(root); return true; }
  var ed = ev.target.closest('[data-eqedit]'); if (ed) { var e1 = eqById(ed.dataset.eqedit); if (e1) eqOpenEdit(root, e1); return true; }
  var dl = ev.target.closest('[data-eqdel]'); if (dl) { var e2 = eqById(dl.dataset.eqdel); if (e2) eqConfirmDelete(root, [e2]); return true; }
  if (!a) return false;
  var act = a.dataset.act;
  if (act === 'eqdelsel') { var arr = EQUIP.filter(function (e) { return EQ.sel[e.id]; }); if (arr.length) eqConfirmDelete(root, arr); return true; }
  if (act === 'eqrevert') { EQ.pending = {}; redrawEquip(root); toast('바꾼 수량을 되돌렸어요'); return true; }
  if (act === 'eqsave') {
    var ch = EQUIP.filter(function (e) { return EQ.pending[e.id] !== undefined; });
    if (!ch.length) return true;
    openModal({
      icon: 'check', title: '수량 변경을 저장할까요?',
      body: '<ul class="mdiff">' + ch.map(function (e) { var nv = EQ.pending[e.id]; return diffRow(eqLabel(e), e.total + '개', nv + '개 (' + (nv > e.total ? '+' : '') + (nv - e.total) + ')'); }).join('') + '</ul>',
      ok: '변경 저장', onOk: function () { ch.forEach(function (e) { e.total = EQ.pending[e.id]; }); EQ.pending = {}; redrawEquip(root); toast('장비 ' + ch.length + '개의 수량을 저장했어요 (시안)'); }
    });
    return true;
  }
  if (act === 'eqadd') {
    var nm = root.querySelector('#eqName').value.trim();
    if (!nm) { toast('장비 이름을 넣어 주세요'); root.querySelector('#eqName').focus(); return true; }
    EQUIP.push({ id: 'e' + (EQ.next++), cat: root.querySelector('#eqCat').value, name: nm, spec: root.querySelector('#eqSpec').value.trim(), total: Math.max(1, Math.round(Calc.parse(root.querySelector('#eqTotal').value))), outs: [0, 0, 0], price: Calc.parse(root.querySelector('#eqPrice').value), memo: root.querySelector('#eqMemo').value.trim() });
    ['#eqName', '#eqSpec', '#eqPrice', '#eqMemo'].forEach(function (s) { root.querySelector(s).value = ''; });
    root.querySelector('#eqTotal').value = 1;
    EQ.cat = '전체'; root.querySelectorAll('[data-eqcat]').forEach(function (b) { b.classList.toggle('on', b.dataset.eqcat === '전체'); });
    redrawEquip(root); toast('「' + nm + '」을(를) 장비 목록에 넣었어요 (시안)'); return true;
  }
  return false;
}

function equipChange(ev, root) {
  var t = ev.target;
  if (t.dataset.eqsel) { if (t.checked) EQ.sel[t.dataset.eqsel] = 1; else delete EQ.sel[t.dataset.eqsel]; redrawEquip(root); return; }
  if (t.id === 'eqAll') { eqList().forEach(function (e) { if (t.checked) EQ.sel[e.id] = 1; else delete EQ.sel[e.id]; }); redrawEquip(root); return; }
  var box = t.closest && t.closest('.stepper');
  if (box && box.dataset.id && box.dataset.id !== 'new' && box.dataset.id !== 'modal') {
    var e = eqById(box.dataset.id); if (!e) return;
    var n = Math.max(0, Math.round(Calc.parse(t.value)));
    if (n === e.total) delete EQ.pending[e.id]; else EQ.pending[e.id] = n;
    redrawEquip(root);
  }
}
