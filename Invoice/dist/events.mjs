// 행사 · 입금 화면: 행사 목록(#event) · 행사 한 건(#event/ID)
// 행사 한 건에 묶인 문서, 계약 기준 문서, 입금 여러 번(취소 표시 · 환불), 완납 영수증, 계약 취소 시 돌려줄 금액
import { DOC_TYPES, DOC_STATUS, ymd, dateShort, docNo, docTotals, newDoc } from './core/docs.mjs?v=mwmznjx6';
import { blankEvent, eventDocs, eventPays, baseDoc, eventMoney, MONEY_STATE, parsePayment, newPayment, receiptFor, receiptValid, eventDateText, filterEvents, convertDoc } from './core/events.mjs?v=mwmznjx6';
import { won } from './docview.mjs?v=mwmznjx6';
import { gearCardHtml } from './equip.mjs?v=mwmznjx6';

let C = null;
export function initEvents(ctx) { C = ctx; }
const TYPE_ICON = { quote: 'fileText', stmt: 'clipboard', inv: 'truck', rcpt: 'receipt' };
const STATE_CLS = { unpaid: 's-draft', partial: 's-deposit', paid: 's-paid', overpaid: 's-overdue', cancel: 's-cancel' };
const METHODS = ['계좌이체', '현금', '카드', '환불'];
const device = () => (matchMedia('(max-width:767px)').matches ? 'phone' : matchMedia('(max-width:1100px)').matches ? 'tablet' : 'pc');

export const curEvent = () => C.S.data && C.S.data.events.find((e) => e.id === C.S.eventId) || null;
function touchEvent(e) { e.updatedAt = new Date().toISOString(); C.changed(); }
const stateChip = (m) => '<span class="schip ' + STATE_CLS[m.state] + '">' + MONEY_STATE[m.state] + '</span>';
const leftTxt = (m) => (m.remaining > 0 ? '₩' + won(m.remaining) : m.remaining === 0 ? (m.total ? '완납' : '₩0') : '−₩' + won(-m.remaining) + ' <small>(더 받음)</small>');

/* ── 목록 ── */
export function eventListPage() {
  const { S, ic, esc } = C;
  const list = filterEvents(S.data.events, S.eventQuery || '');
  const rows = list.map((e) => {
    const m = eventMoney(e, S.data), n = eventDocs(e, S.data.docs).length;
    return '<a class="evrow" href="#event/' + e.id + '"><span class="evr-nm"><b>' + esc(e.name) + '</b><small>' + esc([e.client.name, eventDateText(e), e.place].filter(Boolean).join(' · ') || '받는 곳 · 일정 없음') + '</small></span>' +
      '<span class="evr-docs">' + ic('fileText') + '문서 ' + n + '</span>' +
      '<span class="evr-amt"><small>계약</small><b class="num">₩' + won(m.total) + '</b></span>' +
      '<span class="evr-amt"><small>받은 금액</small><b class="num">₩' + won(m.received) + '</b></span>' +
      '<span class="evr-amt left' + (m.remaining < 0 ? ' over' : '') + '"><small>남은 금액</small><b class="num">' + leftTxt(m) + '</b></span>' + stateChip(m) + '</a>';
  }).join('');
  const sum = S.data.events.filter((e) => e.status !== 'cancel').reduce((a, e) => { const m = eventMoney(e, S.data); a.total += m.total; a.got += m.received; a.left += Math.max(0, m.remaining); return a; }, { total: 0, got: 0, left: 0 });
  return '<div class="evlist">' +
    '<section class="card"><div class="kpis3"><div><span>진행 중 행사</span><b>' + S.data.events.filter((e) => e.status !== 'cancel').length + '건</b></div><div><span>계약 금액 합계</span><b class="num">₩' + won(sum.total) + '</b></div>' +
    '<div><span>받은 금액</span><b class="num">₩' + won(sum.got) + '</b></div><div class="left"><span>받을 금액 (미수금)</span><b class="num">₩' + won(sum.left) + '</b></div></div></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('won') + '행사 목록</h2><span class="hint">' + S.data.events.length + '건 · 견적서에서 「행사로 묶기」를 눌러도 생겨요</span>' +
    '<div class="tools"><button type="button" class="btn primary" data-act="ev-new">' + ic('plus') + '새 행사</button></div></div>' +
    '<div class="searchrow"><input class="in" type="search" id="eq" placeholder="행사명 · 받는 곳 · 장소로 찾기" value="' + esc(S.eventQuery || '') + '" aria-label="행사 찾기"></div>' +
    '<div class="evrows" id="evRows">' + (rows || (S.data.events.length ? '<div class="empty">맞는 행사가 없어요.</div>' : '<div class="empty">아직 행사가 없어요.<br>견적서를 만든 뒤 <b>행사로 묶기</b>를 누르거나, <b>새 행사</b>로 먼저 만들어 보세요.</div>')) + '</div></section></div>';
}

/* ── 행사 한 건 ── */
function docsHtml(e, m) {
  const { S, ic, esc } = C;
  const list = eventDocs(e, S.data.docs);
  const rows = list.map((d) => {
    const isBase = m.base && m.base.id === d.id, t = docTotals(d);
    const voided = d.type === 'rcpt' && !receiptValid(d, S.data);
    return '<li class="' + (isBase ? 'base' : '') + '"><span class="tchip t-' + d.type + '">' + ic(TYPE_ICON[d.type]) + DOC_TYPES[d.type].label + '</span>' +
      '<a class="evd-no num" href="#doc/' + d.id + '">' + esc(docNo(d)) + '</a><span class="evd-ver num">₩' + won(t.total) + '</span>' +
      '<span class="schip s-' + d.status + '">' + (DOC_STATUS[d.status] || DOC_STATUS.draft) + '</span>' +
      (voided ? '<span class="schip s-overdue">무효</span>' : '') +
      (isBase ? '<span class="evd-base">' + ic('check') + '계약 기준</span>' : d.type !== 'rcpt' ? '<button type="button" class="btn sm ghost" data-act="ev-base" data-id="' + d.id + '">계약 기준으로</button>' : '') +
      '<span class="evd-date num">' + dateShort(d.date) + '</span></li>';
  }).join('');
  const rc = m.receipt;
  const rcRow = '<li class="rcpt ' + (rc.ok ? 'ok' : 'locked') + '"><span class="tchip t-rcpt">' + ic('receipt') + '영수증</span><span class="evd-no">완납 영수증</span>' +
    (e.status === 'cancel' ? '<span class="evd-lock">' + ic('lock') + '취소한 행사예요</span>'
      : rc.ok ? '<button type="button" class="btn sm primary" data-act="ev-rcpt">' + ic('plus') + '완납 영수증 만들기</button>'
        : '<span class="evd-lock">' + ic('lock') + (rc.reason === 'overpaid' ? '더 받은 ' + won(m.overpaid) + '원을 환불로 적어야 만들 수 있어요' : !m.base ? '계약 기준 문서가 없어요' : '아직 ' + won(m.remaining) + '원 남아서 만들 수 없어요') + '</span>') + '</li>';
  return '<ul class="evdocs">' + (rows || '<li class="empty-li">아직 이 행사의 문서가 없어요.</li>') + rcRow + '</ul>';
}
function moneyHtml(e, m) {
  const { ic } = C;
  const t = m.base ? docTotals(m.base) : null;
  return '<div class="evm">' +
    '<div class="evm-row"><span>계약 금액 <small>' + (m.base ? C.esc(docNo(m.base)) + ' 기준 · 부가세 포함' : '계약 기준 문서 없음') + '</small></span><b class="num">₩' + won(m.total) + '</b></div>' +
    (t && t.adjust ? '<div class="evm-row disc"><span>끝자리 정리 <small>문서에서 정함</small></span><b class="num">' + (t.adjust.total > 0 ? '+' : '') + won(t.adjust.total) + '원</b></div>' : '') +
    (m.base ? '<p class="evm-split">최종 합의금액(끝자리 정리)은 계약 기준 문서에서 고쳐요. <a href="#doc/' + m.base.id + '">문서 열기</a></p>' : '') +
    '<div class="evm-big"><div><span>받은 금액 (누적)</span><b class="num">₩' + won(m.received) + '</b></div><div class="' + (m.remaining < 0 ? 'over' : m.remaining === 0 && m.total ? 'done' : '') + '"><span>남은 금액</span><b class="num">' + leftTxt(m) + '</b></div></div>' +
    (m.remaining < 0 && e.status !== 'cancel' ? '<p class="evm-warn">' + ic('alert') + '<span>더 받은 금액이 있어요. 돌려주면 입금 내역에 <b>「환불 −' + won(-m.remaining) + '원」</b>을 한 줄 적어 주세요.</span></p>' : '') +
    (e.status === 'cancel' && m.refund ? '<p class="evm-warn">' + ic('alert') + '<span>취소한 행사예요. <b>돌려줄 금액 ₩' + won(m.refund) + '</b> — 돌려준 뒤 입금 내역에 환불로 적어 주세요.</span></p>' : '') +
    '</div>';
}
function payRows(e) {
  const { S, ic, esc } = C;
  const list = eventPays(e, S.data.payments);
  if (!list.length) return '<tr><td colspan="5" class="c muted">아직 적은 입금이 없어요.</td></tr>';
  return list.map((p) => '<tr class="' + (p.cancelled ? 'cancel' : '') + (p.amount < 0 ? ' refund' : '') + '"><td class="num">' + dateShort(p.date) + '</td><td class="r num"><b>' + won(p.amount) + '원</b></td><td>' + esc(p.method) + '</td>' +
    '<td>' + esc(p.memo) + (p.cancelled ? ' <span class="schip s-cancel">취소됨</span>' : '') + '</td>' +
    '<td class="c">' + (p.cancelled ? '<span class="muted">기록만 남음</span>' : '<button type="button" class="btn sm danger-o" data-act="pay-cancel" data-id="' + p.id + '">' + ic('x') + '취소 표시</button>') + '</td></tr>').join('');
}
export function eventPage() {
  const e = curEvent(); if (!e) return '<div class="empty">행사를 찾지 못했어요. <a href="#event">행사 목록</a>에서 골라 주세요.</div>';
  const { S, ic, esc } = C;
  const m = eventMoney(e, S.data);
  const dt = eventDateText(e);
  return '<div class="evpage">' +
    '<section class="card ev-head"><div class="evh-l"><span class="evh-tag">행사 한 건</span>' + (e.contract && e.status !== 'cancel' ? '<span class="schip s-contract">' + ic('check') + '계약 확정</span>' : '') + stateChip(m) + '<h2>' + esc(e.name) + '</h2>' +
    '<p>' + esc([e.client.name, e.client.person && e.client.person + ' 님', e.client.tel].filter(Boolean).join(' · ') || '받는 곳 없음') + '</p></div>' +
    '<div class="evh-r"><dl class="evh-dates"><dt>행사 일정</dt><dd>' + (dt ? esc(dt) : '-') + '</dd><dt>행사 장소</dt><dd>' + (e.place ? esc(e.place) : '-') + '</dd></dl>' +
    '<div class="evh-btns"><button type="button" class="btn sm" data-act="ev-edit">' + ic('fileText') + '행사 정보 고치기</button>' +
    (e.status === 'cancel' ? '<button type="button" class="btn sm" data-act="ev-uncancel">취소 되돌리기</button>'
      : (e.contract ? '<button type="button" class="btn sm" data-act="ev-uncontract">계약 확정 풀기</button>' : '<button type="button" class="btn sm primary" data-act="ev-contract">' + ic('check') + '계약 확정</button>') +
        '<button type="button" class="btn sm danger-o" data-act="ev-cancel">' + ic('x') + '계약 취소</button>') + '</div></div>' +
    (!e.contract && e.status !== 'cancel' ? '<p class="note ev-contract-note">' + ic('alert') + '<span>계약이 정해지면 <b>「계약 확정」</b>을 눌러 주세요. 계약 확정한 행사(또는 입금 · 명세서 · 청구서가 있는 행사)만 <b>매출 · 미수금</b>에 들어가요.</span></p>' : '') +
    '<p class="evh-note">' + ic('layers') + '<span>이 행사의 견적서 · 수정본 · 거래명세서 · 청구서 · 영수증은 <b>하나로 묶여</b> 있어서, 문서를 여러 장 만들어도 돈은 <b>계약 기준 문서 한 장</b>으로만 계산돼요.</span></p></section>' +
    '<div class="ev-cols">' +
    '<section class="card"><div class="card-h"><h2>' + ic('fileText') + '이 행사의 문서</h2><span class="hint">계약 기준은 한 장만</span></div><div id="evDocs">' + docsHtml(e, m) + '</div>' +
    '<div class="ev-docbtns"><button type="button" class="btn" data-act="ev-mk" data-type="quote">' + ic('plus') + '견적서</button>' +
    '<button type="button" class="btn" data-act="ev-mk" data-type="stmt">' + ic('clipboard') + '거래명세서</button><button type="button" class="btn" data-act="ev-mk" data-type="inv">' + ic('truck') + '납품ㆍ청구서</button></div>' +
    '<p class="note ev-mknote">' + ic('check') + '<span>거래명세서 · 청구서는 <b>계약 기준 문서</b>의 품목 · 금액을 그대로 가져와요.</span></p></section>' +
    '<section class="card"><div class="card-h"><h2>' + ic('won') + '금액 · 입금</h2></div><div id="evMoney">' + moneyHtml(e, m) + '</div></section>' +
    '</div>' + gearCardHtml(e) +
    '<section class="card"><div class="card-h"><h2>' + ic('list') + '입금 내역</h2><span class="hint">선금 · 중도금 · 잔금을 몇 번이든 적어요. 잘못 적은 건 지우지 않고 「취소 표시」</span></div>' +
    '<div class="tbl-wrap evpay-wrap"><table class="tbl evpay"><thead><tr><th>날짜</th><th class="r">금액</th><th>방법</th><th>메모</th><th class="c">관리</th></tr></thead><tbody id="evPays">' + payRows(e) + '</tbody></table></div>' +
    '<div class="evadd"><label class="fld"><span>입금 날짜</span><input class="in" type="date" id="pDate" value="' + ymd() + '"></label>' +
    '<label class="fld"><span>금액 (환불은 − 붙여서)</span><input class="in num" id="pAmt" inputmode="numeric" placeholder="' + (m.remaining > 0 ? '남은 금액 ' + won(m.remaining) : '예: 1,000,000') + '"></label>' +
    '<label class="fld"><span>방법</span><select class="in" id="pMethod">' + METHODS.map((x) => '<option>' + x + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>메모</span><input class="in" id="pMemo" placeholder="예: 계약금 · 잔금"></label>' +
    '<button type="button" class="btn primary big" data-act="pay-add">' + ic('plus') + '입금 추가</button></div>' +
    (m.remaining > 0 ? '<button type="button" class="btn sm ghost pay-fill" data-act="pay-fill">남은 금액 ₩' + won(m.remaining) + ' 채우기</button>' : '') +
    '<p class="note">' + ic('alert') + '<span>견적서의 「예상 선금」은 견적서에 보여 주는 금액이고, 실제로 받은 돈은 여기 <b>입금 내역</b>에만 적어요.</span></p></section>' +
    '</div>';
}

function repaintMoney() {
  const e = curEvent(); if (!e) return;
  const m = eventMoney(e, C.S.data);
  const set = (id, h) => { const el = document.getElementById(id); if (el) el.innerHTML = h; };
  set('evDocs', docsHtml(e, m)); set('evMoney', moneyHtml(e, m)); set('evPays', payRows(e));
  const chip = document.querySelector('.ev-head .schip'); if (chip) chip.outerHTML = stateChip(m);
  const amt = document.getElementById('pAmt'); if (amt) amt.placeholder = m.remaining > 0 ? '남은 금액 ' + won(m.remaining) : '예: 1,000,000';
  const pf = document.querySelector('[data-act="pay-fill"]'); if (pf) { if (m.remaining > 0) pf.textContent = '남은 금액 ₩' + won(m.remaining) + ' 채우기'; else pf.remove(); }
}

/* ── 창 ── */
function eventForm(e) {
  const { esc } = C;
  const v = e || { name: '', client: {}, start: '', end: '', place: '' };
  const f = (label, id, val, extra = '', cls = '') => '<label class="fld ' + cls + '"><span>' + label + '</span><input class="in" id="' + id + '" value="' + esc(val || '') + '"' + extra + '></label>';
  return '<div class="fgrid">' + f('행사명 <em class="req">*</em>', 'evN', v.name, ' placeholder="예: 가을 별빛축제"', 'span2') +
    f('받는 곳 (거래처)', 'evC', v.client.name, ' list="evClientList" autocomplete="off"', 'span2') +
    f('담당자', 'evP', v.client.person) + f('연락처', 'evT', v.client.tel, ' inputmode="tel"') +
    f('시작 날짜', 'evS', v.start, ' type="date"') + f('끝 날짜', 'evE', v.end, ' type="date"') +
    f('행사 장소', 'evL', v.place, '', 'span2') + '</div>' +
    '<datalist id="evClientList">' + C.S.data.clients.map((c) => '<option value="' + esc(c.name) + '">').join('') + '</datalist><p class="note" id="evMsg" style="display:none;margin:4px 0 0"></p>';
}
function readEventForm() {
  const g = (id) => document.getElementById(id).value.trim();
  const name = g('evC'), c = C.S.data.clients.find((x) => x.name.trim() === name);
  return { name: g('evN'), clientName: name, clientId: c ? c.id : null, person: g('evP') || (c && c.person) || '', tel: g('evT') || (c && c.tel) || '', start: g('evS'), end: g('evE') || g('evS'), place: g('evL') };
}
function openEventForm(e) {
  C.openModal({
    icon: 'star', title: e ? '행사 정보 고치기' : '새 행사', body: eventForm(e), ok: e ? '저장' : '만들기', wide: true,
    onOk: () => {
      const v = readEventForm();
      if (!v.name) { const m = document.getElementById('evMsg'); m.style.display = 'flex'; m.innerHTML = C.ic('alert') + '<span>행사명을 넣어 주세요.</span>'; return false; }
      if (v.end && v.start && v.end < v.start) v.end = v.start;
      if (e) {
        Object.assign(e, { name: v.name, clientId: v.clientId, client: { name: v.clientName, person: v.person, tel: v.tel }, start: v.start, end: v.end, place: v.place });
        touchEvent(e); C.render(); C.toast('행사 정보를 고쳤어요');
      } else {
        const ne = blankEvent(v); C.S.data.events.push(ne); C.changed();
        location.hash = '#event/' + ne.id; C.toast('행사 「' + ne.name + '」를 만들었어요. 이제 견적서를 만들어 보세요');
      }
    }
  });
}
function eventToDocFields(e, d) {
  d.eventId = e.id;
  d.client = { name: e.client.name || '', person: e.client.person || '', tel: e.client.tel || '', email: '', bizNo: '', addr: '' };
  d.clientId = e.clientId || null;
  d.event = { name: e.name, date: eventDateText(e), place: e.place || '' };
}
function makeDoc(type) {
  const e = curEvent(); if (!e) return;
  const S = C.S, base = baseDoc(e, S.data.docs);
  let d;
  if (type !== 'quote' && base) d = convertDoc(base, type, S.data, { eventId: e.id, today: ymd(), device: device() });
  else {
    d = newDoc(type, S.data, { today: ymd(), device: device() });
    eventToDocFields(e, d);
    if (type === 'stmt') { d.tradeDate = e.end || ymd(); d.copies = 2; }
    if (type === 'inv') { const due = new Date(); due.setDate(due.getDate() + (Number(S.data.settings.dueDays) || 14)); d.dueDate = ymd(due); }
  }
  if (type === 'stmt' && e.end) d.tradeDate = e.end;   // 설계서 9-4: 거래일자 기본값은 행사 마지막 날
  S.data.docs.push(d);
  if (!e.baseDocId && type === 'quote') e.baseDocId = d.id;
  touchEvent(e); S.edStep = 1;
  location.hash = '#doc/' + d.id;
  C.toast(DOC_TYPES[type].label + ' ' + docNo(d) + '를 만들었어요' + (type !== 'quote' && base ? ' (계약 기준 문서의 품목을 가져왔어요)' : ''));
}

/* ── 누르기 · 입력 ── */
export function eventsClick(act, a) {
  const S = C.S;
  if (act === 'ev-new') { openEventForm(null); return true; }
  const e = curEvent();
  if (!e || S.route !== 'event1') return false;
  switch (act) {
    case 'ev-edit': openEventForm(e); return true;
    case 'ev-base': e.baseDocId = a.dataset.id; touchEvent(e); repaintMoney(); C.toast('계약 기준을 ' + docNo(S.data.docs.find((d) => d.id === a.dataset.id)) + '로 정했어요'); return true;
    case 'ev-mk': makeDoc(a.dataset.type); return true;
    case 'ev-rcpt': {
      const r = receiptFor(e, S.data, { today: ymd(), device: device() });
      if (!r.ok) { C.toast('아직 완납이 아니에요'); return true; }
      S.data.docs.push(r.doc); touchEvent(e); S.edStep = 3;
      location.hash = '#doc/' + r.doc.id; C.toast('완납 영수증 ' + docNo(r.doc) + '를 만들었어요');
      return true;
    }
    case 'pay-fill': { const m = eventMoney(e, S.data); document.getElementById('pAmt').value = won(m.remaining); document.getElementById('pMemo').value = document.getElementById('pMemo').value || '잔금'; return true; }
    case 'pay-add': {
      const method = document.getElementById('pMethod').value;
      const amount = parsePayment(document.getElementById('pAmt').value, method);
      if (amount === null) { C.toast('금액을 넣어 주세요'); document.getElementById('pAmt').focus(); return true; }
      const p = newPayment(e.id, { date: document.getElementById('pDate').value || ymd(), amount, method, memo: document.getElementById('pMemo').value });
      S.data.payments.push(p); touchEvent(e);
      document.getElementById('pAmt').value = ''; document.getElementById('pMemo').value = '';
      repaintMoney();
      const m = eventMoney(e, S.data);
      C.toast((amount < 0 ? '환불 ' : '입금 ') + won(amount) + '원을 적었어요' + (m.state === 'paid' ? ' · 완납! 영수증을 만들 수 있어요' : ''));
      return true;
    }
    case 'pay-cancel': {
      const p = S.data.payments.find((x) => x.id === a.dataset.id); if (!p) return true;
      const hasRcpt = eventDocs(e, S.data.docs).some((d) => d.type === 'rcpt');
      C.openModal({
        tone: 'danger', icon: 'x', title: '이 입금을 취소로 표시할까요?',
        body: '<p><b>' + dateShort(p.date) + ' · ' + won(p.amount) + '원</b> (' + C.esc(p.method) + ')</p><p>기록은 지우지 않고 「취소됨」으로 남아요. 받은 금액 · 남은 금액이 다시 계산돼요.' + (hasRcpt ? ' 이미 만든 완납 영수증은 <b>「무효」</b>로 표시돼요.' : '') + '</p>',
        ok: '취소로 표시',
        onOk: () => { p.cancelled = true; p.cancelledAt = new Date().toISOString(); touchEvent(e); repaintMoney(); C.toast('입금을 취소로 표시했어요'); }
      });
      return true;
    }
    case 'ev-cancel': {
      const m = eventMoney(e, S.data);
      C.openModal({
        tone: 'danger', icon: 'x', title: '이 행사를 계약 취소할까요?',
        body: '<p><b>' + C.esc(e.name) + '</b></p><p>문서와 입금 기록은 그대로 남고, 행사 상태만 「취소」가 돼요.</p>' + (m.received > 0 ? '<p class="warnbox">이미 받은 <b>₩' + won(m.received) + '</b>을 돌려줘야 해요. 돌려준 뒤 입금 내역에 환불로 적어 주세요.</p>' : ''),
        ok: '계약 취소', onOk: () => { e.status = 'cancel'; touchEvent(e); C.render(); C.toast('계약 취소로 표시했어요'); }
      });
      return true;
    }
    case 'ev-uncancel': e.status = 'active'; touchEvent(e); C.render(); C.toast('취소를 되돌렸어요'); return true;
    case 'ev-contract': e.contract = true; e.contractAt = new Date().toISOString(); touchEvent(e); C.render(); C.toast('「계약 확정」으로 표시했어요 · 매출 · 미수금에 들어가요'); return true;
    case 'ev-uncontract': C.openModal({ icon: 'alert', title: '계약 확정을 풀까요?', body: '<p>입금 · 명세서 · 청구서가 없으면 매출 · 미수금에서 빠져요. 문서와 입금 기록은 그대로예요.</p>', ok: '확정 풀기', onOk: () => { e.contract = false; touchEvent(e); C.render(); C.toast('계약 확정을 풀었어요'); } }); return true;
  }
  return false;
}
export function eventsInput(t) {
  if (t.id !== 'eq') return false;
  C.S.eventQuery = t.value;
  const box = document.getElementById('evRows');
  if (box) { const tmp = document.createElement('div'); tmp.innerHTML = eventListPage(); box.innerHTML = tmp.querySelector('#evRows').innerHTML; }
  return true;
}
