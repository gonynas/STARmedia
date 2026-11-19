// 문서 작성 화면 (견적서) · 발행 목록 · 홈의 최근 문서 · 인쇄 / PDF
// PC · 태블릿: 왼쪽 입력 + 오른쪽 A4 미리보기 / 휴대폰: ① 받는 곳 → ② 품목 → ③ 확인 · 인쇄
import { DOC_TYPES, DOC_STATUS, DEFAULT_PHRASES, ymd, dateShort, docNo, newDoc, copyDoc, renumberIfDateChanged, docTotals, depositFromRate, validUntil, dateKo, newLine, itemToLine, parseLinePaste, filterDocs } from './core/docs.mjs?v=mwn5py8q';
import { lineTax } from './core/money.mjs?v=mwn5py8q';
import { toNum, filterItems, expandSet, categories, NO_CAT, searchItems } from './core/catalog.mjs?v=mwn5py8q';
import { renderPages, won, fileTitle } from './docview.mjs?v=mwn5py8q';
import { eventFromDoc, convertDoc, reviseDoc, applyTypeDefaults, docMoney, baseDoc } from './core/events.mjs?v=mwn5py8q';
import { serialFor } from './core/docs.mjs?v=mwn5py8q';

let C = null;
export function initEditor(ctx) { C = ctx; bindOnce(); }

const READY_TYPES = ['quote', 'stmt', 'inv'];   // 영수증은 행사 · 입금에서 완납했을 때만 만든다
const TYPE_ICON = { quote: 'fileText', stmt: 'clipboard', inv: 'truck', rcpt: 'receipt' };
const numTxt = (n) => { const v = Number(n) || 0; return Number.isInteger(v) ? String(v) : String(v); };
const device = () => (matchMedia('(max-width:767px)').matches ? 'phone' : matchMedia('(max-width:1100px)').matches ? 'tablet' : 'pc');
const DEV_ICON = { pc: 'monitor', phone: 'phone', tablet: 'tablet' };

export function curDoc() { return C.S.data && C.S.data.docs.find((d) => d.id === C.S.docId) || null; }
function touch(doc) { if (doc.pending) delete doc.pending; doc.updatedAt = new Date().toISOString(); doc.lastDevice = device(); if (doc.status === 'done' || doc.status === 'sent') doc.editedAfter = true; C.changed(); }
/** 진행 상태 바꾸기 (드롭다운 · 「작성 완료」 단추 · 보내기) — 바꾸면 「수정됨」 표시는 지운다 */
export function setDocStatus(doc, st) { if (doc.pending) delete doc.pending; doc.status = st; doc.editedAfter = false; if (st === 'sent') doc.sentAt = new Date().toISOString(); if (st === 'done') doc.doneAt = new Date().toISOString(); doc.updatedAt = new Date().toISOString(); doc.lastDevice = device(); C.changed(); document.querySelectorAll('select[data-d="status"]').forEach((s) => { s.value = st; s.className = 'in st-sel st-' + st; }); document.querySelectorAll('[data-act="doc-done"]').forEach((b) => { b.hidden = st !== 'draft'; }); }
const phrasesAll = () => (C.S.data.settings.phrases && C.S.data.settings.phrases.length ? C.S.data.settings.phrases : DEFAULT_PHRASES);

/* ── 새 문서 · 복사 · 지우기 ── */
export function createDoc(type = 'quote') {
  if (!READY_TYPES.includes(type)) { C.toast('영수증은 완납한 행사에서 만들어요. 행사 · 입금에서 「완납 영수증 만들기」를 눌러 주세요'); location.hash = '#event'; return; }
  const d = newDoc(type, C.S.data, { today: ymd(), device: device() });
  applyTypeDefaults(d, C.S.data);
  // 아직 저장하지 않은 새 문서(pending): 거래처 · 품목 등 무언가를 넣거나 「저장」을 누르면 그때 목록에 들어간다.
  // 아무것도 안 넣고 다른 화면으로 가면 지워진다(main.mjs render · 저장할 때 pending 문서는 빼고 저장).
  d.pending = true;
  C.S.data.docs.push(d);
  C.S.edStep = 1;
  location.hash = '#doc/' + d.id;
}
function copyCurrent(id) {
  const src = C.S.data.docs.find((d) => d.id === id); if (!src) return;
  const c = copyDoc(src, C.S.data.docs, { today: ymd(), device: device() });
  c.eventId = null; c.version = 1;   // 새 거래: 행사 · 입금은 따라가지 않음
  if (c.type === 'rcpt') { c.type = 'quote'; c.serial = serialFor(C.S.data.docs, 'quote', c.date); }
  C.S.data.docs.push(c); C.changed(); C.S.edStep = 1;
  location.hash = '#doc/' + c.id;
  C.toast('복사해서 새 문서를 만들었어요 (' + docNo(c) + ')');
}
function deleteDoc(id) {
  const d = C.S.data.docs.find((x) => x.id === id); if (!d) return;
  C.openModal({
    tone: 'danger', icon: 'trash', title: '문서를 삭제할까요?',
    body: '<p><b>' + C.esc(docNo(d)) + '</b> · ' + C.esc(d.client.name || '받는 곳 없음') + '</p><p>휴지통으로 옮겨 30일 동안 보관해요. 그 안에는 되돌릴 수 있어요.</p>', ok: '삭제',
    onOk: () => {
      C.S.data.docs = C.S.data.docs.filter((x) => x.id !== id);
      C.S.data.trash.push({ kind: 'doc', item: d, deletedAt: new Date().toISOString() });
      C.changed();
      if (location.hash === '#doc/' + id) location.hash = '#list'; else C.render();
      C.toast('휴지통으로 옮겼어요', { label: '되돌리기', fn: () => restoreDoc(id) });
    }
  });
}
function restoreDoc(id) {
  const i = C.S.data.trash.findIndex((t) => t.kind === 'doc' && t.item.id === id); if (i < 0) return;
  C.S.data.docs.push(C.S.data.trash[i].item); C.S.data.trash.splice(i, 1);
  C.changed(); C.render(); C.toast('되돌렸어요');
}

/* ── 작은 조각 ── */
function fld(label, path, val, extra = '', cls = '') {
  return '<label class="fld ' + cls + '"><span>' + label + '</span><input class="in" data-d="' + path + '" value="' + C.esc(val) + '"' + extra + '></label>';
}
function seg(name, opts, cur) {
  return '<div class="seg" role="radiogroup" data-seg="' + name + '">' + opts.map(([v, l, soon]) =>
    '<button type="button" role="radio" aria-checked="' + (v === cur) + '" class="' + (v === cur ? 'on' : '') + (soon ? ' soon' : '') + '" data-v="' + v + '"' + (soon ? ' title="다음 묶음에서 열려요"' : '') + '>' + l + '</button>').join('') + '</div>';
}
function sw(path, on, label) {
  return '<label class="sw"><input type="checkbox" data-d="' + path + '"' + (on ? ' checked' : '') + '><i></i><span>' + label + '</span></label>';
}

function lineCard(doc, l, i) {
  const r = lineTax(l, doc.vat), ic = C.ic, esc = C.esc;
  return '<div class="line" data-id="' + l.id + '">' +
    '<button type="button" class="grip" aria-label="' + (i + 1) + '번 줄 순서 바꾸기 (끌거나 위 · 아래 화살표)" title="꾹 눌러 끌어서 순서 바꾸기">' + ic('grip') + '</button>' +
    '<div class="line-main">' +
    '<div class="line-top"><span class="line-no">' + (i + 1) + '</span>' +
    '<label class="lf nmf"><span>품목</span><input class="in nm" data-lf="name" value="' + esc(l.name) + '" placeholder="글자를 쓰면 등록한 품목이 나와요" autocomplete="off" aria-autocomplete="list"></label>' +
    '<label class="lf spf"><span>규격</span><input class="in sp" data-lf="spec" value="' + esc(l.spec) + '" placeholder="예: 3m×6m" autocomplete="off"></label></div>' +
    '<div class="line-nums">' +
    '<label class="nb"><span>일수</span><input class="in num" data-lf="days" inputmode="decimal" value="' + numTxt(l.days) + '"></label><span class="op">×</span>' +
    '<label class="nb"><span>수량</span><input class="in num" data-lf="qty" inputmode="decimal" value="' + numTxt(l.qty) + '"></label><span class="op">×</span>' +
    '<label class="nb w"><span>단가</span><input class="in num" data-lf="price" inputmode="numeric" value="' + won(l.price) + '"></label>' +
    '<label class="nb mmf"><span>비고</span><input class="in mm" data-lf="memo" value="' + esc(l.memo) + '" placeholder="필요할 때만" autocomplete="off"></label>' +
    '</div></div>' +
    '<div class="line-amt"><span>공급가액</span><b class="num">' + won(r.supply) + '</b><small>세액 <span class="num">' + won(r.tax) + '</span>' + (l.taxFree ? ' · 면세' : '') + '</small></div>' +
    '<button type="button" class="del" data-act="line-del" data-id="' + l.id + '" aria-label="' + (i + 1) + '번 줄 지우기">' + ic('x') + '</button>' +
    '</div>';
}
function linesHtml(doc) {
  if (!doc.lines.length) return '<div class="empty">아직 품목이 없어요. 아래 <b>품목 추가</b>나 위쪽 <b>목록에서 고르기 · 세트 넣기 · 엑셀 붙여넣기</b>로 넣어 보세요.</div>';
  return doc.lines.map((l, i) => lineCard(doc, l, i)).join('');
}
function sumHtml(doc) {
  const t = docTotals(doc);
  return '<div><span>공급가액</span><b class="num">' + won(t.supply) + '</b></div><div><span>부가세</span><b class="num">' + won(t.tax) + '</b></div>' +
    '<div class="g"><span>총 합계</span><b class="num">₩' + won(t.total) + '</b></div>' +
    (t.adjust ? '<div class="adj' + (t.adjust.total > 0 ? ' up' : '') + '"><span>끝자리 정리</span><b class="num">' + (t.adjust.total > 0 ? '+' : '') + won(t.adjust.total) + '</b></div>' : '') +
    (t.deposit ? '<div class="bal"><span>예상 선금 뺀 잔금</span><b class="num">₩' + won(t.balance) + '</b></div>' : '');
}
function agreedHint(doc) {
  const t = docTotals(doc);
  if (!t.adjust) return '품목 합계 <b>₩' + won(t.base.total) + '</b> · 최종 금액을 넣으면 차이를 「끝자리 정리」 한 줄로 보여 줘요.';
  return '품목 합계 ₩' + won(t.base.total) + ' → 최종 <b>₩' + won(t.total) + '</b> (끝자리 정리 <b>' + (t.adjust.total > 0 ? '+' : '') + won(t.adjust.total) + '원</b>)' + (t.adjust.total > 0 ? ' · <span class="warn-t">품목 합계보다 많아요. 맞는지 확인해 주세요</span>' : '');
}
function clientHint(doc) {
  const name = (doc.client.name || '').trim();
  if (!name) return '';
  if (doc.clientId) return '<span class="ok">' + C.ic('check') + '등록한 거래처예요</span>';
  return '<span>새 거래처예요</span><button type="button" class="btn sm" data-act="client-from-doc">' + C.ic('plus') + '거래처로 저장</button>';
}

/* ── 종류별 칸 ── */
function typeFields(d) {
  const esc = C.esc;
  if (d.type === 'quote') return '<label class="fld"><span>유효기간 (일)</span><input class="in" data-d="validDays" inputmode="numeric" value="' + esc(d.validDays) + '"><small class="fhint" id="validHint">' + dateKo(validUntil(d)) + '까지</small></label>';
  if (d.type === 'inv') return fld('입금 기한', 'dueDate', d.dueDate || '', ' type="date"');
  if (d.type === 'stmt') return fld('거래일자', 'tradeDate', d.tradeDate || '', ' type="date"') +
    '<div class="fld span2"><span>A4 한 장에</span>' + seg('copies', [['2', '2부 (공급받는자 · 공급자 보관용)'], ['1', '1부 (크게)']], String(d.copies || 2)) + '</div>';
  if (d.type === 'rcpt') return fld('받은 날짜', 'paidDate', d.paidDate || '', ' type="date"') + fld('결제 방법', 'payMethod', d.payMethod || '', ' placeholder="예: 계좌이체"');
  return '';
}
function ensureEvent(d) {
  let e = d.eventId ? C.S.data.events.find((x) => x.id === d.eventId) : null;
  if (!e) { e = eventFromDoc(d); C.S.data.events.push(e); d.eventId = e.id; }
  return e;
}
function convertCurrent(type) {
  const d = curDoc(); if (!d) return;
  const e = ensureEvent(d);
  const c = convertDoc(d, type, C.S.data, { eventId: e.id, today: ymd(), device: device() });
  C.S.data.docs.push(c); e.updatedAt = c.createdAt; C.changed(); C.S.edStep = 1;
  location.hash = '#doc/' + c.id;
  C.toast(DOC_TYPES[type].label + '를 만들었어요 (' + docNo(c) + ') · 같은 행사로 묶었어요');
}
function reviseCurrent() {
  const d = curDoc(); if (!d) return;
  const e = ensureEvent(d);
  const r = reviseDoc(d, C.S.data, { today: ymd(), device: device() });
  r.eventId = e.id; C.S.data.docs.push(r); e.baseDocId = r.id; e.updatedAt = r.createdAt; C.changed(); C.S.edStep = 1;
  location.hash = '#doc/' + r.id;
  C.toast('수정본 ' + docNo(r) + '을 만들고 계약 기준으로 정했어요');
}

/* ── 문서 작성 화면 ── */
export function editorPage() {
  const d = curDoc(); if (!d) return '<div class="empty">문서를 찾지 못했어요. <a href="#list">발행 목록</a>에서 다시 골라 주세요.</div>';
  const { ic, esc, S } = C;
  const step = S.edStep || 1;
  const steps = [['1', '받는 곳'], ['2', '품목 넣기'], ['3', '확인 · 인쇄']].map(([n, l]) =>
    '<button type="button" data-act="ed-step" data-step="' + n + '" class="' + (+n === step ? 'on' : +n < step ? 'done' : '') + '"' + (+n === step ? ' aria-current="step"' : '') + '><i>' + (+n < step ? '✓' : n) + '</i><span>' + l + '</span></button>').join('');
  const next = step < 3
    ? '<button type="button" class="btn primary big" data-act="ed-step" data-step="' + (step + 1) + '">다음 : ' + (step === 1 ? '품목 넣기' : '확인 · 인쇄') + ic('arrowRight') + '</button>'
    : '<button type="button" class="btn primary big" data-act="x-pdf">' + ic('pdf') + 'PDF 저장</button>';
  const prev = step > 1 ? '<button type="button" class="btn ghost big" data-act="ed-step" data-step="' + (step - 1) + '">' + ic('left') + '이전</button>' : '';
  const kinds = Object.keys(DOC_TYPES).map((k) => [k, DOC_TYPES[k].label, !READY_TYPES.includes(k) && k !== d.type]);
  const ev = d.eventId ? S.data.events.find((x) => x.id === d.eventId) : null;
  const isBase = ev && baseDoc(ev, S.data.docs) && baseDoc(ev, S.data.docs).id === d.id;
  const statusOpts = Object.keys(DOC_STATUS).map((k) => '<option value="' + k + '"' + (k === d.status ? ' selected' : '') + '>' + DOC_STATUS[k] + '</option>').join('');
  const clientOpts = S.data.clients.map((c) => '<option value="' + esc(c.name) + '">').join('');
  const phr = phrasesAll().map((p) => { const on = (d.notes.phrases || []).includes(p); return '<button type="button" class="pchip' + (on ? ' on' : '') + '" data-act="phrase" data-p="' + esc(p) + '" aria-pressed="' + on + '">' + ic(on ? 'check' : 'plus') + esc(p) + '</button>'; }).join('');
  const t = docTotals(d);
  const meMissing = !(S.data.me.name && S.data.me.bizNo);
  const agreedOn = toNum(d.agreed) > 0 || S.agreedOpen === d.id;

  return '<div class="ed" data-step="' + step + '">' +
    '<nav class="steps" aria-label="작성 단계">' + steps + '</nav>' +
    '<div class="ed-bar card">' +
    '<div class="ed-bar-l">' + seg('type', kinds, d.type) + '</div>' +
    '<div class="ed-bar-r"><button type="button" class="btn primary ed-save" data-act="doc-save" title="지금 바로 저장 (Ctrl+S) · 입력하면 저절로도 저장돼요">' + ic('download') + '저장</button><button type="button" class="btn ed-done" data-act="doc-done"' + (d.status === 'draft' ? '' : ' hidden') + '>' + ic('check') + '작성 완료</button>' +
    '<label class="status-sel"><span>진행 상태</span><select class="in st-sel st-' + d.status + '" data-d="status">' + statusOpts + '</select></label>' + (d.editedAfter ? '<span class="schip s-edited" title="작성 완료 · 발송 완료 뒤에 고쳤어요">수정됨</span>' : '') +
    '<div class="menu"><button type="button" class="btn" data-act="menu" aria-haspopup="menu">' + ic('copy') + '바꿔 · 복사해 만들기' + ic('down') + '</button><div class="menu-pop" role="menu">' +
    (d.type !== 'stmt' ? '<button type="button" data-act="conv" data-type="stmt">' + ic('clipboard') + '거래명세서로 만들기</button>' : '') +
    (d.type !== 'inv' ? '<button type="button" data-act="conv" data-type="inv">' + ic('truck') + '납품ㆍ청구서로 만들기</button>' : '') +
    (d.type === 'quote' ? '<button type="button" data-act="revise">' + ic('fileText') + '수정본 만들기 (같은 번호 -' + ((d.version || 1) + 1) + ')</button>' : '') +
    '<button type="button" data-act="doc-copy" data-id="' + d.id + '">' + ic('copy') + '복사해서 새 거래로</button></div></div>' +
    '<button type="button" class="btn" data-act="doc-print">' + ic('print') + '인쇄</button>' +
    '<div class="menu"><button type="button" class="btn" data-act="menu" aria-haspopup="menu">' + ic('download') + '파일로 저장' + ic('down') + '</button><div class="menu-pop right" role="menu">' +
    '<button type="button" role="menuitem" data-act="x-pdf">' + ic('pdf') + 'PDF 파일</button>' +
    '<button type="button" role="menuitem" data-act="x-jpg">' + ic('image') + '이미지 (JPG)</button>' +
    '<button type="button" role="menuitem" data-act="x-xlsx">' + ic('table') + '엑셀 <small class="x-mi">금액은 수식</small></button></div></div>' +
    '<div class="menu"><button type="button" class="btn primary" data-act="menu" aria-haspopup="menu">' + ic('share') + '보내기' + ic('down') + '</button><div class="menu-pop right" role="menu">' +
    '<button type="button" role="menuitem" data-act="x-kakao">' + ic('chat') + '카카오톡으로 <small class="x-mi">그림</small></button>' +
    '<button type="button" role="menuitem" data-act="x-mail">' + ic('mail') + '메일로 <small class="x-mi">PDF</small></button></div></div>' +
    '<button type="button" class="icbtn danger-i" data-act="doc-del" data-id="' + d.id + '" aria-label="이 문서 삭제" title="이 문서 삭제">' + ic('trash') + '</button>' +
    '</div></div>' +
    (meMissing ? '<p class="warnbox ed-warn">' + ic('alert') + '<span>내 정보(상호 · 사업자번호)가 비어 있어 문서의 「보내는 곳」이 비어 보여요. <a href="#me">내 정보 넣기</a></span></p>' : '') +
    '<div class="ev-link" data-s="1">' + (ev ? ic('star') + '<span>행사 <b>' + esc(ev.name) + '</b>에 묶여 있어요' + (isBase ? ' · <em class="evd-base">' + ic('check') + '계약 기준</em>' : '') + '</span><a class="btn sm" href="#event/' + ev.id + '">' + ic('won') + '행사 · 입금 보기</a>'
      : ic('layers') + '<span>아직 행사에 묶이지 않았어요. 묶으면 입금 · 잔금 · 영수증을 한곳에서 관리해요.</span><button type="button" class="btn sm" data-act="doc-to-event">' + ic('plus') + '행사로 묶기</button>') + '</div>' +
    '<div class="ed-cols"><div class="ed-form">' +
    '<section class="card" data-s="1"><div class="card-h"><h2><span class="sn">1</span>받는 곳</h2><span class="hint">등록한 거래처를 고르면 담당자 · 연락처가 채워져요</span></div><div class="fgrid">' +
    '<label class="fld span2"><span>거래처 (받는 곳)</span><input class="in" data-d="client.name" list="clientList" value="' + esc(d.client.name) + '" placeholder="상호를 쓰거나 목록에서 고르기" autocomplete="off"></label>' +
    '<div class="span2 cl-hint" id="clHint">' + clientHint(d) + '</div>' +
    fld('담당자', 'client.person', d.client.person) + fld('연락처', 'client.tel', d.client.tel, ' inputmode="tel"') +
    fld('문서 날짜', 'date', d.date, ' type="date"') +
    typeFields(d) +
    '</div><datalist id="clientList">' + clientOpts + '</datalist></section>' +
    '<section class="card" data-s="1"><div class="card-h"><h2><span class="sn ev">' + ic('star') + '</span>행사 정보</h2><span class="hint">비워 두면 문서에서 숨겨요</span></div><div class="fgrid">' +
    fld('행사명', 'event.name', d.event.name, ' placeholder="예: 가을 별빛축제"', 'span2') +
    fld('행사 일정', 'event.date', d.event.date, ' placeholder="예: 11월 21일(금) ~ 22일(토)"') + fld('행사 장소', 'event.place', d.event.place, ' placeholder="예: ○○공원 잔디광장"') +
    '</div></section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn">2</span>품목</h2><div class="tools">' +
    '<button type="button" class="btn sm" data-act="pick-items">' + ic('list') + '목록에서 고르기</button><button type="button" class="btn sm" data-act="pick-set">' + ic('layers') + '세트 넣기</button><button type="button" class="btn sm" data-act="paste-lines">' + ic('table') + '엑셀 붙여넣기</button></div></div>' +
    '<p class="note">' + ic('grip') + '<span>왼쪽 손잡이를 꾹 누른 채 끌면 순서가 바뀌어요. 공급가액 = 일수 × 수량 × 단가</span></p>' +
    '<div class="lines" id="lines">' + linesHtml(d) + '</div>' +
    '<button type="button" class="addline" data-act="line-add">' + ic('plus') + '품목 추가</button>' +
    '<div class="ed-sum" id="edSum">' + sumHtml(d) + '</div></section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn won">₩</span>부가세 · 선금 · 끝자리</h2></div>' +
    '<div class="opt-row"><span class="ol">부가세</span>' + seg('vat', [['excl', '별도 (10% 더하기)'], ['incl', '포함'], ['none', '없음']], d.vat) + '</div>' +
    (d.type !== 'quote' ? '' : '<div class="opt-row"><span class="ol">예상 선금</span>' + sw('deposit.on', d.deposit.on, '견적서에 선금 · 잔금 줄 넣기') +
    '<div class="dep"' + (d.deposit.on ? '' : ' hidden') + ' id="depBox"><input class="in num" data-d="deposit.amount" value="' + won(d.deposit.amount) + '" inputmode="numeric" aria-label="예상 선금 금액"><span class="won-s">원</span>' +
    '<button type="button" class="pchip" data-act="dep-rate" data-r="0.1">10%</button><button type="button" class="pchip" data-act="dep-rate" data-r="0.3">30%</button><button type="button" class="pchip" data-act="dep-rate" data-r="0.5">50%</button></div>' +
    '<p class="dep-hint">실제로 받은 돈은 「행사 · 입금」에서 따로 적어요. 여기는 견적서에 보여 줄 <b>예상</b> 금액이에요.</p></div>') +
    '<div class="opt-row"><span class="ol">끝자리 정리</span><label class="sw"><input type="checkbox" data-act-sw="agreed"' + (agreedOn ? ' checked' : '') + '><i></i><span>최종 합의금액으로 맞추기 (네고)</span></label>' +
    '<div class="dep"' + (agreedOn ? '' : ' hidden') + ' id="agreedBox"><input class="in num" data-d="agreed" value="' + (toNum(d.agreed) > 0 ? won(d.agreed) : '') + '" inputmode="numeric" placeholder="' + won(t.base.total) + '" aria-label="최종 합의금액 (부가세 포함)"><span class="won-s">원</span></div>' +
    '<p class="dep-hint" id="agreedHint"' + (agreedOn ? '' : ' hidden') + '>' + agreedHint(d) + '</p></div>' +
    '</section>' +
    '<section class="card" data-s="2"><div class="card-h"><h2><span class="sn">3</span>특이사항 · 문서 설정</h2></div>' +
    (d.type === 'quote' ? '<div class="opt-row">' + sw('notes.valid', d.notes.valid !== false, '유효기간 문구 (자동)') + sw('notes.bank', d.notes.bank !== false, '결제 계좌 문구 (자동)') + '</div>' : '') +
    '<div class="pchips">' + phr + '</div>' +
    '<textarea class="in ta" data-d="notes.text" rows="2" placeholder="직접 쓰기 — 한 줄에 하나씩. 예: 무대 설치는 전날 오후에 진행합니다.">' + esc(d.notes.text) + '</textarea>' +
    '<div class="opt-row">' + sw('showNo', d.showNo, '문서번호 보이기') + (d.type === 'quote' || d.type === 'inv' ? sw('fillRows', d.fillRows, '빈 줄 채우기 (표를 끝까지)') : '') + '</div>' +
    '</section>' +
    '</div>' +
    '<aside class="ed-preview card" data-s="3"><div class="card-h"><h2>' + ic('eye') + '미리보기</h2><span class="hint" id="pvMeta">' + C.esc(docNo(d)) + ' · A4</span>' +
    '<button type="button" class="btn sm pv-zoom" data-act="pv-full">' + ic('search') + '크게 보기</button></div>' +
    '<div class="pv-box"><div class="pv-fit" id="pvFit"><div class="pv-inner" id="pv">' + pagesOf(d).join('') + '</div></div></div>' +
    '<div class="st-row"><label class="status-sel"><span>진행 상태</span><select class="in st-sel st-' + d.status + '" data-d="status">' + statusOpts + '</select></label><button type="button" class="btn primary ed-done" data-act="doc-done"' + (d.status === 'draft' ? '' : ' hidden') + '>' + ic('check') + '작성 완료</button></div>' +
    '<div class="share-big"><button type="button" class="sb kakao" data-act="x-kakao">' + ic('chat') + '카톡 보내기</button><button type="button" class="sb" data-act="x-mail">' + ic('mail') + '메일 보내기</button>' +
    '<button type="button" class="sb" data-act="x-pdf">' + ic('pdf') + 'PDF 저장</button><button type="button" class="sb" data-act="x-jpg">' + ic('image') + '이미지 저장</button>' +
    '<button type="button" class="sb" data-act="doc-print">' + ic('print') + '인쇄</button><button type="button" class="sb" data-act="x-xlsx">' + ic('table') + '엑셀 저장</button>' +
    '<button type="button" class="sb" data-act="doc-copy" data-id="' + d.id + '">' + ic('copy') + '복사해서 새로</button><button type="button" class="sb" data-act="doc-del" data-id="' + d.id + '">' + ic('trash') + '삭제</button></div>' +
    '<p class="note pv-note">' + ic('check') + '<span>입력하면 저절로 저장되고, 미리보기도 바로 바뀌어요.</span></p>' +
    '</aside></div>' +
    '<div class="ed-next">' + prev + '<button type="button" class="btn ed-save" data-act="doc-save" aria-label="지금 바로 저장">' + ic('download') + '저장</button>' + next + '</div>' +
    '<div class="pvfull" id="pvFull" role="dialog" aria-modal="true" aria-label="문서 크게 보기"><div class="pvfull-bar"><b>' + C.esc(docNo(d)) + '</b><button type="button" class="btn" data-act="doc-print">' + ic('print') + '인쇄</button><button type="button" class="btn primary" data-act="pv-close">' + ic('x') + '닫기</button></div><div class="pvfull-body" id="pvFullBody"></div></div>' +
    '</div>';
}

/* ── 미리보기 ── */
const pagesOf = (d) => renderPages(d, C.S.data.me, docMoney(d, C.S.data));
let pvTimer = null;
function pvSoon() { clearTimeout(pvTimer); pvTimer = setTimeout(pvNow, 140); }
function pvNow() {
  const d = curDoc(), pv = document.getElementById('pv'); if (!d || !pv) return;
  pv.innerHTML = pagesOf(d).join('');
  fitPreview();
}
export function fitPreview() {
  const box = document.getElementById('pvFit'), pv = document.getElementById('pv'); if (!box || !pv) return;
  const w = box.clientWidth; if (!w) return;
  const s = Math.min(1, w / 794);
  pv.style.transform = 'scale(' + s + ')';
  box.style.height = Math.ceil(pv.offsetHeight * s) + 'px';
}
export function editorAfterRender() {
  if (C.S.route !== 'doc') return;
  fitPreview();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPreview);
}
function refreshSum() {
  const d = curDoc(); if (!d) return;
  const s = document.getElementById('edSum'); if (s) s.innerHTML = sumHtml(d);
  const h = document.getElementById('agreedHint'); if (h) h.innerHTML = agreedHint(d);
  const a = document.querySelector('[data-d="agreed"]'); if (a) a.placeholder = won(docTotals(d).base.total);
}
function refreshLines() {
  const d = curDoc(), box = document.getElementById('lines'); if (!d || !box) return;
  box.innerHTML = linesHtml(d);
}
function refreshLineAmt(lineEl, d, l) {
  const r = lineTax(l, d.vat);
  lineEl.querySelector('.line-amt b').textContent = won(r.supply);
  lineEl.querySelector('.line-amt small').innerHTML = '세액 <span class="num">' + won(r.tax) + '</span>' + (l.taxFree ? ' · 면세' : '');
}

/* ── 인쇄 · PDF ── */
let printTitle = null;
function fillPrint(doc) {
  let pr = document.getElementById('printRoot');
  if (!pr) { pr = document.createElement('div'); pr.id = 'printRoot'; document.body.appendChild(pr); }
  pr.innerHTML = pagesOf(doc).join('');
  document.body.classList.add('printing');
  if (printTitle === null) { printTitle = document.title; document.title = fileTitle(doc); }
}
function clearPrint() {
  document.body.classList.remove('printing');
  const pr = document.getElementById('printRoot'); if (pr) pr.innerHTML = '';
  if (printTitle !== null) { document.title = printTitle; printTitle = null; }
}
function printDoc(pdf) {
  const d = curDoc(); if (!d) return;
  if (!d.lines.length) C.toast('품목이 없는 문서예요. 그래도 인쇄 창을 열어요');
  if (pdf) C.toast('인쇄 창의 「대상」에서 「PDF로 저장」을 고르세요');
  fillPrint(d);
  setTimeout(() => { window.print(); }, pdf ? 350 : 30);
}

/* ── 고르기 창들 ── */
function insertLines(lines, msg) {
  const d = curDoc(); if (!d || !lines.length) return;
  d.lines.push(...lines); touch(d); refreshLines(); refreshSum(); pvSoon();
  C.toast(msg || '품목 ' + lines.length + '개를 넣었어요');
}
function openPickItems() {
  const { S, esc, ic } = C;
  if (!S.data.items.length) {
    C.openModal({ icon: 'layers', title: '등록한 품목이 없어요', body: '<p>「품목 · 세트」에서 자주 쓰는 품목과 기본 단가를 넣어 두면 여기서 골라 쓸 수 있어요. 지금은 <b>품목 추가</b>로 직접 써도 돼요.</p>', ok: '품목 · 세트로 가기', cancel: '닫기', onOk: () => { location.hash = '#items'; } });
    return;
  }
  const picked = new Set();
  let cat = '', q = '';
  const listHtml = () => {
    const list = filterItems(S.data.items, { cat, q });
    if (!list.length) return '<div class="empty">맞는 품목이 없어요.</div>';
    return list.map((it) => '<label class="pk-row"><input type="checkbox" data-pk="' + it.id + '"' + (picked.has(it.id) ? ' checked' : '') + '><span class="pk-nm"><b>' + esc(it.name) + '</b>' + (it.spec ? ' <small>' + esc(it.spec) + '</small>' : '') + '<em>' + esc((it.cat || '').trim() || NO_CAT) + '</em></span><span class="pk-pr num">' + won(it.price) + '원</span></label>').join('');
  };
  const cats = categories(S.data.items);
  C.openModal({
    icon: 'list', title: '품목 목록에서 고르기', wide: true,
    body: '<div class="pk-top"><input class="in" type="search" id="pkQ" placeholder="품목 · 규격 · 분류로 찾기" aria-label="품목 찾기">' +
      '<select class="in" id="pkCat" aria-label="분류"><option value="">전체 분류</option>' + cats.map((c) => '<option>' + esc(c.name) + '</option>').join('') + '</select></div>' +
      '<div class="pk-list" id="pkList">' + listHtml() + '</div><p class="pv-sum" id="pkSum">고른 품목 0개</p>',
    ok: '넣기', cancel: '취소',
    onOk: () => {
      if (!picked.size) { C.toast('넣을 품목을 골라 주세요'); return false; }
      const order = S.data.items.filter((it) => picked.has(it.id));
      insertLines(order.map(itemToLine));
    }
  });
  const box = document.getElementById('mBody');
  const repaint = () => { document.getElementById('pkList').innerHTML = listHtml(); };
  box.oninput = (e) => {
    if (e.target.id === 'pkQ') { q = e.target.value; repaint(); }
  };
  box.onchange = (e) => {
    if (e.target.id === 'pkCat') { cat = e.target.value; repaint(); return; }
    const id = e.target.dataset.pk; if (!id) return;
    if (e.target.checked) picked.add(id); else picked.delete(id);
    document.getElementById('pkSum').textContent = '고른 품목 ' + picked.size + '개';
    document.getElementById('mOk').textContent = picked.size ? picked.size + '개 넣기' : '넣기';
  };
}
function openPickSet() {
  const { S, esc } = C;
  if (!S.data.sets.length) {
    C.openModal({ icon: 'layers', title: '만든 세트가 없어요', body: '<p>「품목 · 세트」에서 자주 같이 나가는 품목을 세트로 묶어 두면, 여기서 한 번에 넣을 수 있어요.</p>', ok: '품목 · 세트로 가기', cancel: '닫기', onOk: () => { location.hash = '#items'; } });
    return;
  }
  const picked = new Set();
  C.openModal({
    icon: 'layers', title: '세트 넣기', wide: true,
    body: '<p class="pv-sum">세트 안 품목이 한 줄씩 펼쳐져 들어가요. 넣은 뒤에 고칠 수 있어요.</p><div class="pk-list">' +
      S.data.sets.map((s) => { const ls = expandSet(s, S.data.items); return '<label class="pk-row"><input type="checkbox" data-pks="' + s.id + '"><span class="pk-nm"><b>' + esc(s.name) + '</b><small>' + ls.map((l) => esc(l.name)).join(' · ') + '</small></span><span class="pk-pr">' + ls.length + '줄</span></label>'; }).join('') + '</div>',
    ok: '넣기', cancel: '취소',
    onOk: () => {
      if (!picked.size) { C.toast('넣을 세트를 골라 주세요'); return false; }
      const lines = [];
      for (const s of S.data.sets) if (picked.has(s.id)) for (const l of expandSet(s, S.data.items)) lines.push(newLine(l));
      insertLines(lines, '세트 ' + picked.size + '개 · 품목 ' + lines.length + '줄을 넣었어요');
    }
  });
  document.getElementById('mBody').onchange = (e) => { const id = e.target.dataset.pks; if (!id) return; if (e.target.checked) picked.add(id); else picked.delete(id); };
}
function openPasteLines() {
  const { esc } = C;
  const preview = () => {
    const r = parseLinePaste(document.getElementById('lpIn').value);
    const out = document.getElementById('lpPv');
    if (!r.rows.length) { out.innerHTML = '<p class="pv-sum">엑셀에서 품목 칸을 복사(Ctrl+C)한 뒤 위 칸에 붙여넣기(Ctrl+V) 하세요.</p>'; return r; }
    out.innerHTML = '<p class="pv-sum">' + (r.header ? '첫 줄 머리글을 읽어 칸을 맞췄어요. ' : '칸 수로 짐작했어요. ') + '<b>' + r.rows.length + '줄</b>' + (r.skipped ? ' · 건너뛴 줄 ' + r.skipped + '개 (합계 · 빈 품목)' : '') + '</p>' +
      '<div class="pv-scroll"><table class="itable mini"><thead><tr><th>품목</th><th>규격</th><th class="num">일수</th><th class="num">수량</th><th class="num">단가</th><th>비고</th></tr></thead><tbody>' +
      r.rows.map((x) => '<tr><td>' + esc(x.name) + '</td><td>' + (esc(x.spec) || '-') + '</td><td class="num">' + x.days + '</td><td class="num">' + x.qty + '</td><td class="num">' + won(x.price) + '</td><td>' + esc(x.memo) + '</td></tr>').join('') + '</tbody></table></div>';
    return r;
  };
  C.openModal({
    icon: 'table', title: '엑셀에서 품목 붙여넣기', wide: true,
    body: '<p class="pv-sum">엑셀 견적서의 <b>품목 · 규격 · 일수 · 수량 · 단가 · 비고</b> 칸을 드래그해 복사한 뒤 붙여넣으세요. 머리글 줄이 있으면 순서가 달라도 맞춰요. (단위 · 금액 칸은 무시하고 금액은 다시 계산해요)</p>' +
      '<textarea class="in ta-paste" id="lpIn" rows="6" aria-label="붙여넣을 표" placeholder="품목&#9;규격&#9;일수&#9;수량&#9;단가&#10;몽골텐트&#9;5×5m&#9;1&#9;4&#9;170,000"></textarea><div id="lpPv"></div>',
    ok: '넣기', cancel: '취소',
    onOk: () => {
      const r = parseLinePaste(document.getElementById('lpIn').value);
      if (!r.rows.length) { C.toast('읽을 수 있는 품목이 없어요'); return false; }
      const items = C.S.data.items;
      insertLines(r.rows.map((x) => { const it = items.find((i) => i.name.replace(/\s/g, '') === x.name.replace(/\s/g, '') && String(i.spec || '').replace(/\s/g, '') === x.spec.replace(/\s/g, '')); return newLine({ ...x, itemId: it ? it.id : null, taxFree: it ? it.taxFree : false }); }));
    }
  });
  preview();
  document.getElementById('mBody').oninput = (e) => { if (e.target.id === 'lpIn') { const r = preview(); document.getElementById('mOk').textContent = r.rows.length ? r.rows.length + '줄 넣기' : '넣기'; } };
}

/* ── 거래처 ── */
function applyClientMatch(d) {
  const name = (d.client.name || '').trim();
  const c = C.S.data.clients.find((x) => x.name.trim() === name);
  if (c && d.clientId !== c.id) {
    d.clientId = c.id;
    d.client = { name: c.name, person: c.person || '', tel: c.tel || '', email: c.email || '', bizNo: c.bizNo || '', addr: c.addr || '' };
    for (const k of ['person', 'tel']) { const el = document.querySelector('[data-d="client.' + k + '"]'); if (el) el.value = d.client[k]; }
  } else if (!c) d.clientId = null;
  const h = document.getElementById('clHint'); if (h) h.innerHTML = clientHint(d);
}
function clientFromDoc() {
  const d = curDoc(); if (!d) return;
  const now = new Date().toISOString();
  const c = { id: C.uid('c'), name: d.client.name.trim(), person: d.client.person || '', tel: d.client.tel || '', email: '', bizNo: '', addr: '', memo: '', createdAt: now, updatedAt: now };
  C.S.data.clients.push(c); d.clientId = c.id; touch(d);
  const h = document.getElementById('clHint'); if (h) h.innerHTML = clientHint(d);
  const dl = document.getElementById('clientList'); if (dl) dl.insertAdjacentHTML('beforeend', '<option value="' + C.esc(c.name) + '">');
  C.toast('「' + c.name + '」를 거래처에 저장했어요');
}

/* ── 값 넣기 ── */
function setPath(obj, path, v) { const ks = path.split('.'); let o = obj; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
const NUM_PATHS = ['validDays', 'deposit.amount', 'agreed'];

export function editorInput(t) {
  if (C.S.route !== 'doc') return false;
  const d = curDoc(); if (!d) return false;
  if (t.dataset.d && t.type !== 'checkbox' && t.tagName !== 'SELECT') {
    const p = t.dataset.d;
    let v = t.value;
    if (NUM_PATHS.includes(p)) v = p === 'agreed' ? (toNum(v) || null) : (toNum(v) ?? 0);
    setPath(d, p, v);
    if (p === 'client.name') applyClientMatch(d);
    if (p === 'date' && d.date) {
      if (renumberIfDateChanged(d, C.S.data.docs)) { const m = document.getElementById('pvMeta'); if (m) m.textContent = docNo(d) + ' · A4'; }
    }
    if (p === 'date' || p === 'validDays') { const h = document.getElementById('validHint'); if (h) h.textContent = dateKo(validUntil(d)) + '까지'; }
    if (p === 'deposit.amount' || p === 'agreed') refreshSum();
    touch(d); pvSoon();
    return true;
  }
  if (t.dataset.lf) {
    const el = t.closest('.line'); const l = d.lines.find((x) => x.id === el.dataset.id); if (!l) return true;
    const f = t.dataset.lf;
    if (f === 'name') {
      l.name = t.value;
      if (l.itemId) l.itemId = null;   // 글자를 고치면 등록한 품목과의 연결은 끊는다(목록에서 다시 고르면 다시 연결)
      showAc(t);
    } else if (f === 'spec' || f === 'memo') l[f] = t.value;
    else l[f] = toNum(t.value) ?? 0;
    refreshLineAmt(el, d, l); refreshSum(); touch(d); pvSoon();
    return true;
  }
  return false;
}
export function editorChange(t) {
  if (C.S.route !== 'doc') return false;
  const d = curDoc(); if (!d) return false;
  if (t.type === 'checkbox' && t.dataset.d) {
    setPath(d, t.dataset.d, t.checked);
    if (t.dataset.d === 'deposit.on') document.getElementById('depBox').hidden = !t.checked;
    refreshSum(); touch(d); pvSoon(); return true;
  }
  if (t.dataset.actSw === 'agreed') {
    document.getElementById('agreedBox').hidden = !t.checked; document.getElementById('agreedHint').hidden = !t.checked;
    C.S.agreedOpen = t.checked ? d.id : null;
    if (!t.checked) { d.agreed = null; const a = document.querySelector('[data-d="agreed"]'); if (a) a.value = ''; refreshSum(); touch(d); pvSoon(); }
    else setTimeout(() => document.querySelector('[data-d="agreed"]').focus(), 30);
    return true;
  }
  if (t.tagName === 'SELECT' && t.dataset.d === 'status') { setDocStatus(d, t.value); C.toast('진행 상태: ' + DOC_STATUS[d.status]); return true; }
  return false;
}
export function editorBlur(t) {
  if (C.S.route !== 'doc' || !t.dataset) return;
  if (t.dataset.lf === 'price' || ['deposit.amount', 'agreed'].includes(t.dataset.d)) {
    const n = toNum(t.value); if (n !== null && n !== 0) t.value = won(n);
  }
}

/* ── 누르기 ── */
export function editorClick(act, a) {
  const d = curDoc();
  switch (act) {
    case 'doc-new': createDoc(a.dataset.type || 'quote'); return true;
    case 'doc-copy': copyCurrent(a.dataset.id); return true;
    case 'doc-del': deleteDoc(a.dataset.id); return true;
    case 'list-type': C.S.listType = a.dataset.type; C.render(); return true;
  }
  if (C.S.route !== 'doc' || !d) return false;
  switch (act) {
    case 'ed-step': C.S.edStep = +a.dataset.step; C.render(); window.scrollTo(0, 0); return true;
    case 'line-add': {
      d.lines.push(newLine()); touch(d); refreshLines(); refreshSum(); pvSoon();
      const ins = document.querySelectorAll('#lines .line [data-lf="name"]'); if (ins.length) ins[ins.length - 1].focus();
      return true;
    }
    case 'line-del': {
      const i = d.lines.findIndex((l) => l.id === a.dataset.id); if (i < 0) return true;
      const [gone] = d.lines.splice(i, 1); touch(d); refreshLines(); refreshSum(); pvSoon();
      C.toast((gone.name || (i + 1) + '번 줄') + ' 줄을 뺐어요', { label: '되돌리기', fn: () => { d.lines.splice(i, 0, gone); touch(d); refreshLines(); refreshSum(); pvSoon(); } });
      return true;
    }
    case 'pick-items': openPickItems(); return true;
    case 'pick-set': openPickSet(); return true;
    case 'paste-lines': openPasteLines(); return true;
    case 'dep-rate': {
      const amt = depositFromRate(docTotals({ ...d, deposit: { on: false } }).total, Number(a.dataset.r));
      d.deposit.amount = amt; document.querySelector('[data-d="deposit.amount"]').value = won(amt);
      refreshSum(); touch(d); pvSoon(); return true;
    }
    case 'phrase': {
      const p = a.dataset.p; const list = d.notes.phrases || (d.notes.phrases = []);
      const i = list.indexOf(p); if (i >= 0) list.splice(i, 1); else list.push(p);
      const on = i < 0; a.classList.toggle('on', on); a.setAttribute('aria-pressed', on); a.innerHTML = C.ic(on ? 'check' : 'plus') + C.esc(p);
      touch(d); pvSoon(); return true;
    }
    case 'client-from-doc': clientFromDoc(); return true;
    case 'menu': a.parentElement.classList.toggle('open'); return true;
    case 'conv': convertCurrent(a.dataset.type); return true;
    case 'revise': reviseCurrent(); return true;
    case 'doc-to-event': { const e = ensureEvent(d); touch(d); C.render(); C.toast('행사 「' + e.name + '」로 묶었어요'); return true; }
    case 'doc-print': printDoc(false); return true;
    case 'doc-done': { const d = curDoc(); if (d) { setDocStatus(d, 'done'); C.toast('「작성 완료」로 표시했어요 · 카톡 · 메일로 보내면 「발송 완료」가 돼요'); } return true; }
    case 'doc-pdf': printDoc(true); return true;
    case 'pv-full': {
      const f = document.getElementById('pvFull'); document.getElementById('pvFullBody').innerHTML = pagesOf(d).map((p) => '<div class="pvfull-page">' + p + '</div>').join('');
      f.classList.add('on'); fitFull(); return true;
    }
    case 'pv-close': document.getElementById('pvFull').classList.remove('on'); return true;
  }
  return false;
}
function fitFull() {
  const body = document.getElementById('pvFullBody'); if (!body) return;
  const s = Math.min(1.25, (body.clientWidth - 24) / 794);
  body.querySelectorAll('.pvfull-page').forEach((w) => { const a4 = w.firstElementChild; a4.style.transform = 'scale(' + s + ')'; w.style.width = 794 * s + 'px'; w.style.height = a4.offsetHeight * s + 'px'; });
}
export function editorSeg(name, v) {
  const d = curDoc(); if (!d) return false;
  if (name === 'vat') { d.vat = v; touch(d); refreshLines(); refreshSum(); pvSoon(); return true; }
  if (name === 'type') {
    if (v === d.type) return true;
    if (!READY_TYPES.includes(v)) { C.toast('영수증은 행사 · 입금에서 완납했을 때 만들어요'); return 'keep'; }
    d.type = v; d.serial = serialFor(C.S.data.docs, v, d.date, d.id); d.version = 1; applyTypeDefaults(d, C.S.data); touch(d); C.render();
    C.toast(DOC_TYPES[v].label + '로 바꿨어요 (' + docNo(d) + ')');
    return 'keep';
  }
  if (name === 'copies') { d.copies = Number(v); touch(d); pvSoon(); return true;
  }
  return false;
}

/* ── 끌어서 순서 바꾸기 (손잡이) · 화살표 키 ── */
function reorderFromDom() {
  const d = curDoc(); const box = document.getElementById('lines'); if (!d || !box) return;
  const ids = [...box.querySelectorAll('.line')].map((el) => el.dataset.id);
  d.lines.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  box.querySelectorAll('.line').forEach((el, i) => { el.querySelector('.line-no').textContent = i + 1; });
  touch(d); pvSoon();
}
/* ── 품목 칸 실시간 찾기: 글자를 쓰면 등록한 품목이 아래에 나오고, 누르거나 ↑↓ + Enter 로 고른다 ── */
let acIdx = -1;
function hideAc() { document.querySelectorAll('#lines .ac').forEach((b) => b.remove()); acIdx = -1; }
function markHit(text, q) {
  const s = String(text || ''), k = String(q || '').trim(), esc = C.esc;
  const i = k ? s.toLowerCase().indexOf(k.toLowerCase()) : -1;
  return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + k.length)) + '</mark>' + esc(s.slice(i + k.length));
}
function showAc(t) {
  hideAc();
  const wrap = t.closest('.lf'); if (!wrap || !t.value.trim()) return;
  const list = searchItems(C.S.data.items, t.value);
  const box = document.createElement('div'); box.className = 'ac'; box.setAttribute('role', 'listbox');
  box.innerHTML = list.length
    ? list.map((it) => '<button type="button" class="ac-item" role="option" tabindex="-1" data-ac="' + it.id + '"><span class="ac-nm"><b>' + markHit(it.name, t.value) + '</b>' + (it.spec ? '<small>' + markHit(it.spec, t.value) + '</small>' : '') + '</span><em class="num">' + won(it.price) + '원</em></button>').join('')
    : '<div class="ac-empty">등록한 품목에 「' + C.esc(t.value.trim()) + '」이(가) 없어요. 그대로 쓰면 이 문서에만 들어가요.</div>';
  wrap.appendChild(box);
  acIdx = list.length ? 0 : -1; paintAc(box);
}
function paintAc(box) { box.querySelectorAll('.ac-item').forEach((b, i) => { b.classList.toggle('on', i === acIdx); if (i === acIdx) b.scrollIntoView({ block: 'nearest' }); }); }
function pickAc(btn) {
  const el = btn.closest('.line'), d = curDoc(); if (!el || !d) return;
  const l = d.lines.find((x) => x.id === el.dataset.id), it = C.S.data.items.find((i) => i.id === btn.dataset.ac);
  hideAc(); if (!l || !it) return;
  Object.assign(l, { itemId: it.id, name: it.name, spec: it.spec || '', price: toNum(it.price) ?? 0, days: toNum(it.days) ?? 1, taxFree: !!it.taxFree, memo: it.memo || l.memo });
  el.querySelector('[data-lf="name"]').value = l.name; el.querySelector('[data-lf="spec"]').value = l.spec;
  el.querySelector('[data-lf="price"]').value = won(l.price); el.querySelector('[data-lf="days"]').value = numTxt(l.days);
  el.querySelector('[data-lf="memo"]').value = l.memo || '';
  refreshLineAmt(el, d, l); refreshSum(); touch(d); pvSoon();
  const q = el.querySelector('[data-lf="qty"]'); if (q) { q.focus(); q.select(); }   // 고른 뒤 바로 수량을 쓸 수 있게
}
function bindAc() {
  // 목록을 누를 때 품목 칸이 포커스를 잃지 않게(누르기 전에 목록이 닫히지 않도록)
  document.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('#lines .ac')) e.preventDefault(); }, true);
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('#lines .ac-item'); if (b) { e.preventDefault(); pickAc(b); } });
  document.addEventListener('focusin', (e) => { if (e.target.matches && e.target.matches('#lines input.nm') && e.target.value.trim()) showAc(e.target); });
  document.addEventListener('focusout', (e) => { if (e.target.matches && e.target.matches('#lines input.nm')) setTimeout(() => { if (document.activeElement !== e.target) hideAc(); }, 200); });
  document.addEventListener('keydown', (e) => {
    if (!e.target.matches || !e.target.matches('#lines input.nm')) return;
    const box = e.target.closest('.lf').querySelector('.ac'); if (!box) return;
    if (e.isComposing || e.keyCode === 229) return;   // 한글을 조합하는 중의 Enter · 화살표는 글자 입력용
    const items = box.querySelectorAll('.ac-item');
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hideAc(); return; }
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); acIdx = (acIdx + 1) % items.length; paintAc(box); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); acIdx = (acIdx - 1 + items.length) % items.length; paintAc(box); }
    else if (e.key === 'Enter' && acIdx >= 0) { e.preventDefault(); pickAc(items[acIdx]); }
  });
}
function bindOnce() {
  bindAc();
  document.addEventListener('pointerdown', (e) => {
    const g = e.target.closest && e.target.closest('#lines .grip'); if (!g) return;
    const line = g.closest('.line'), box = line.parentElement;
    e.preventDefault();
    try { g.setPointerCapture(e.pointerId); } catch (x) { /* 무시 */ }
    line.classList.add('dragging');
    let moved = false;
    const move = (ev) => {
      const y = ev.clientY; let before = null;
      for (const s of box.children) { if (s === line) continue; const r = s.getBoundingClientRect(); if (y < r.top + r.height / 2) { before = s; break; } }
      if (line.nextSibling !== before) { box.insertBefore(line, before); moved = true; }
    };
    const up = () => {
      line.classList.remove('dragging');
      g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
      if (moved) reorderFromDom();
    };
    g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  });
  document.addEventListener('keydown', (e) => {
    const g = e.target.closest && e.target.closest('#lines .grip'); if (!g || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const line = g.closest('.line'), box = line.parentElement;
    if (e.key === 'ArrowUp' && line.previousElementSibling) box.insertBefore(line, line.previousElementSibling);
    else if (e.key === 'ArrowDown' && line.nextElementSibling) box.insertBefore(line.nextElementSibling, line);
    else return;
    reorderFromDom(); g.focus();
  });
  window.addEventListener('resize', () => { fitPreview(); fitFull(); });
  document.addEventListener('click', (e) => { document.querySelectorAll('.menu.open').forEach((m) => { if (!m.contains(e.target)) m.classList.remove('open'); }); }, true);
  window.addEventListener('beforeprint', () => { if (C.S.route === 'doc' && !document.body.classList.contains('printing')) { const d = curDoc(); if (d) fillPrint(d); } });
  window.addEventListener('afterprint', clearPrint);
}

/* ── 발행 목록 · 최근 문서 ── */
function docRow(d) {
  const { esc, ic } = C;
  const t = docTotals(d);
  const dev = d.device === d.lastDevice || !d.lastDevice ? ic(DEV_ICON[d.device] || 'monitor') : ic(DEV_ICON[d.device] || 'monitor') + '<small>→</small>' + ic(DEV_ICON[d.lastDevice] || 'monitor');
  return '<div class="drow"><a class="d-main" href="#doc/' + d.id + '">' +
    '<span class="tchip t-' + d.type + '">' + ic(TYPE_ICON[d.type]) + DOC_TYPES[d.type].label + '</span>' +
    '<span class="d-no num">' + esc(docNo(d)) + '</span>' +
    '<span class="d-cl"><b>' + (d.client.name ? esc(d.client.name) : '<span class="dim">받는 곳 없음</span>') + '</b><small>' + esc(d.event.name || '') + '</small></span>' +
    '<span class="d-dt">' + dateShort(d.date) + '</span>' +
    '<span class="d-amt num">₩' + won(t.total) + '</span>' +
    '<span class="schip s-' + d.status + '">' + (DOC_STATUS[d.status] || DOC_STATUS.draft) + (d.editedAfter ? '<i class="ed-mark" title="완료 뒤에 고쳤어요">수정됨</i>' : '') + '</span>' +
    '<span class="d-dev" title="만든 기기 → 마지막으로 고친 기기">' + dev + '</span></a>' +
    '<span class="d-act"><button type="button" class="icbtn" data-act="doc-copy" data-id="' + d.id + '" aria-label="복사해서 새로" title="복사해서 새로">' + ic('copy') + '</button>' +
    '<button type="button" class="icbtn danger-i" data-act="doc-del" data-id="' + d.id + '" aria-label="삭제" title="삭제">' + ic('trash') + '</button></span></div>';
}
export function homeRecentHtml() {
  const list = filterDocs(C.S.data.docs).slice(0, 6);
  return '<section class="card c-recent"><div class="card-h"><h2>' + C.ic('fileText') + '최근 문서</h2><span class="hint">최근에 고친 순</span>' +
    (C.S.data.docs.length ? '<a class="btn sm more" href="#list">전체 보기 (' + C.S.data.docs.length + ')</a>' : '') + '</div>' +
    (list.length ? '<div class="dlist">' + list.map(docRow).join('') + '</div>' : '<div class="empty">아직 만든 문서가 없어요. 위에서 <b>견적서</b>를 눌러 첫 문서를 만들어 보세요.</div>') + '</section>';
}
export function listPage() {
  const { S, esc, ic } = C;
  const type = S.listType || '';
  const counts = {}; for (const d of S.data.docs) counts[d.type] = (counts[d.type] || 0) + 1;
  const tabs = [['', '전체', S.data.docs.length], ...Object.keys(DOC_TYPES).filter((k) => counts[k]).map((k) => [k, DOC_TYPES[k].label, counts[k]])]
    .map(([k, l, n]) => '<button type="button" class="catb' + (k === type ? ' on' : '') + '" data-act="list-type" data-type="' + k + '"' + (k === type ? ' aria-pressed="true"' : '') + '><span>' + l + '</span><em>' + n + '</em></button>').join('');
  const list = filterDocs(S.data.docs, { type, q: S.listQuery || '' });
  const body = !S.data.docs.length ? '<div class="empty">아직 만든 문서가 없어요.<br><button type="button" class="btn primary" data-act="doc-new" data-type="quote" style="margin-top:12px">' + ic('plus') + '견적서 만들기</button></div>'
    : !list.length ? '<div class="empty">「' + esc(S.listQuery) + '」에 맞는 문서가 없어요.</div>' : '<div class="dlist">' + list.map(docRow).join('') + '</div>';
  return '<section class="card"><div class="card-h"><h2>' + ic('list') + '발행 목록</h2><span class="hint">' + S.data.docs.length + '개</span>' +
    '<div class="tools">' + (S.data.docs.length ? '<button type="button" class="btn" data-act="x-list-xlsx">' + ic('table') + '엑셀로 저장</button>' : '') + '<button type="button" class="btn primary" data-act="doc-new" data-type="quote">' + ic('plus') + '새 견적서</button></div></div>' +
    '<div class="list-tabs">' + tabs + '</div>' +
    '<div class="searchrow"><input class="in" type="search" id="lq" placeholder="받는 곳 · 담당자 · 행사명 · 문서번호 · 품목으로 찾기" value="' + esc(S.listQuery || '') + '" aria-label="문서 찾기"></div>' +
    '<div id="dlistBox">' + body + '</div></section>';
}
export function listInput(t) {
  if (t.id !== 'lq') return false;
  C.S.listQuery = t.value;
  const list = filterDocs(C.S.data.docs, { type: C.S.listType || '', q: t.value });
  document.getElementById('dlistBox').innerHTML = list.length ? '<div class="dlist">' + list.map(docRow).join('') + '</div>' : '<div class="empty">「' + C.esc(t.value) + '」에 맞는 문서가 없어요.</div>';
  return true;
}
