// 화면: 매출 · 미수금 (#money) + 홈의 「오늘 챙길 일」 · 「이번 달 돈 흐름」 · 「월별 매출」 카드
// 계산은 전부 core/reports.mjs (node 시험 통과). 이 파일은 그 결과를 그리기만 한다.
import { salesByMonth, salesByClient, receivables, yearSummary, salesYears, todo } from './core/reports.mjs?v=mwitgfh5';
import { eventDateText } from './core/events.mjs?v=mwitgfh5';
import { ymd, dateShort } from './core/docs.mjs?v=mwitgfh5';
import { won } from './docview.mjs?v=mwitgfh5';

let C;
export function initMoney(ctx) { C = ctx; }

const today = () => ymd();
const man = (n) => { const v = Math.round((Number(n) || 0) / 10000); return v.toLocaleString('ko-KR'); };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const dow = (s) => '일월화수목금토'[new Date(s).getDay()];
const md = (s) => { const [, m, d] = String(s).split('-').map(Number); return m + '/' + d; };

/* ── 막대그래프 (단위: 만 원) ── */
function barsHtml(months, nowMonth) {
  const max = Math.max(1, ...months.map((m) => m.sales));
  return '<div class="bars m12" role="img" aria-label="월별 매출 막대그래프">' + months.map((m) =>
    '<div class="bar' + (m.month === nowMonth ? ' now' : '') + '" title="' + m.month + '월 매출 ' + won(m.sales) + '원 · 받은 돈 ' + won(m.received) + '원">' +
    '<em class="num">' + (m.sales ? man(m.sales) : '') + '</em><i style="height:' + Math.max(m.sales ? 3 : 0, Math.round(m.sales / max * 100)) + '%"></i><span>' + m.month + '월</span></div>').join('') + '</div>';
}

/* ── 홈 카드 ── */
export function homeTodoHtml() {
  const t = todo(C.S.data, today());
  const li = (a, b, href) => '<li><a href="' + href + '"><span>' + C.esc(a) + '</span><em>' + C.esc(b) + '</em></a></li>';
  const more = (arr, n = 3) => (arr.length > n ? '<li class="more">외 ' + (arr.length - n) + '건</li>' : '');
  const exp = t.expiring.slice(0, 3).map((x) => { const d = x.doc, n = daysBetween(today(), x.until); return li((d.client && d.client.name || '받는 곳 없음') + (d.event && d.event.name ? ' · ' + d.event.name : ''), n === 0 ? '오늘까지' : n + '일 남음', '#doc/' + d.id); }).join('') + more(t.expiring);
  const due = t.overdue.slice(0, 3).map((r) => li(r.event.name, daysBetween(r.due, today()) + '일 지남 · ' + won(r.remaining) + '원', '#event/' + r.event.id)).join('') + more(t.overdue);
  const sumDue = t.overdue.reduce((s, r) => s + r.remaining, 0);
  const wk = t.week.slice(0, 3).map((e) => li(md(e.start) + '(' + dow(e.start) + ') ' + e.name, e.place || eventDateText(e), '#event/' + e.id)).join('') + more(t.week);
  const shortLine = t.short.length ? '<p class="tc-warn">' + C.ic('alert') + '<span>장비가 모자란 행사 <b>' + t.short.length + '건</b> — ' + C.esc(t.short[0].event.name) + ' 「' + C.esc(t.short[0].list[0].name) + ' ' + t.short[0].list[0].short + '개 부족」</span></p>' : '';
  const empty = (s) => '<p class="tc-empty">' + s + '</p>';
  return '<section class="todo">' +
    '<article class="card tcard warn"><div class="tc-h"><span class="tc-ic">' + C.ic('clock') + '</span><h3>만료가 가까운 견적</h3></div><div class="tc-big"><b>' + t.expiring.length + '</b>건</div>' +
    (exp ? '<ul>' + exp + '</ul>' : empty('3일 안에 끝나는 견적이 없어요')) + '<a class="mini" href="#list">' + C.ic('list') + '발행 목록 보기</a></article>' +
    '<article class="card tcard danger"><div class="tc-h"><span class="tc-ic">' + C.ic('alert') + '</span><h3>입금 기한 지난 청구</h3></div><div class="tc-big"><b>' + t.overdue.length + '</b>건' + (sumDue ? ' <small class="num">' + won(sumDue) + '원</small>' : '') + '</div>' +
    (due ? '<ul>' + due + '</ul>' : empty('기한이 지난 청구가 없어요')) + '<a class="mini" href="#money">' + C.ic('won') + '미수금 보기</a></article>' +
    '<article class="card tcard info"><div class="tc-h"><span class="tc-ic">' + C.ic('calendar') + '</span><h3>이번 주 행사</h3></div><div class="tc-big"><b>' + t.week.length + '</b>건</div>' +
    (wk ? '<ul>' + wk + '</ul>' : empty('7일 안에 잡힌 행사가 없어요')) + shortLine + '<a class="mini" href="#cal">' + C.ic('calendar') + '달력으로 보기</a></article>' +
    '</section>';
}

export function homeMoneyHtml() {
  const d = C.S.data, y = Number(today().slice(0, 4)), m = Number(today().slice(5, 7));
  const months = salesByMonth(d, y), cur = months[m - 1];
  const rec = receivables(d, today()), recSum = rec.reduce((s, r) => s + r.remaining, 0);
  const clients = salesByClient(d, y).slice(0, 3);
  const top = clients.length ? '<div class="topc"><h4>거래처별 매출 (올해)</h4><ol>' + clients.map((c, i) => '<li><span class="rk">' + (i + 1) + '</span><span class="nm">' + C.esc(c.name) + '</span><b class="num">' + man(c.sales) + '만</b></li>').join('') + '</ol></div>' : '';
  return '<section class="card c-money"><div class="card-h"><h2>이번 달 돈 흐름</h2><span class="hint">' + m + '월 1일 ~ 오늘</span></div>' +
    '<div class="kpis">' +
    '<div class="kpi k1"><div class="kl"><span>' + C.ic('won') + '이번 달 매출</span><em>계약 ' + cur.count + '건 · 행사 날짜 기준</em></div><b class="num">' + won(cur.sales) + '<small>원</small></b></div>' +
    '<div class="kpi k2"><div class="kl"><span>' + C.ic('check') + '이번 달 받은 돈</span><em>입금한 날짜 기준</em></div><b class="num">' + won(cur.received) + '<small>원</small></b></div>' +
    '<div class="kpi k3"><div class="kl"><span>' + C.ic('clock') + '받을 돈 (미수금)</span><em>' + rec.length + '건' + (rec.some((r) => r.overdue) ? ' · 기한 지난 것 있음' : '') + '</em></div><b class="num">' + won(recSum) + '<small>원</small></b></div>' +
    '</div></section>' +
    '<section class="card c-chart"><div class="card-h"><h2>월별 매출</h2><span class="hint">' + y + '년 · 단위: 만 원</span><a class="btn sm" href="#money">자세히</a></div>' + barsHtml(months, m) + top + '</section>';
}

/* ── 매출 · 미수금 화면 ── */
export function moneyPage() {
  const d = C.S.data, years = salesYears(d, today());
  const y = C.S.moneyYear && years.includes(String(C.S.moneyYear)) ? Number(C.S.moneyYear) : Number(years[0]);
  const isThisYear = y === Number(today().slice(0, 4));
  const sum = yearSummary(d, y, today()), months = salesByMonth(d, y), clients = salesByClient(d, y), rec = receivables(d, today());
  const ysel = '<div class="seg ysel" role="radiogroup" aria-label="연도">' + years.map((v) => '<button type="button" data-act="money-year" data-y="' + v + '" class="' + (Number(v) === y ? 'on' : '') + '" aria-checked="' + (Number(v) === y) + '">' + v + '년</button>').join('') + '</div>';
  const kpis = '<div class="eqsum mk4">' +
    '<div class="eqk"><span>' + C.ic('won') + y + '년 매출</span><b class="num">' + won(sum.sales) + '<small>원</small></b><em>계약 ' + sum.count + '건</em></div>' +
    '<div class="eqk"><span>' + C.ic('check') + '받은 돈</span><b class="num">' + won(sum.received) + '<small>원</small></b><em>입금한 날짜 기준</em></div>' +
    '<div class="eqk warn"><span>' + C.ic('clock') + '미수금 (지금)</span><b class="num">' + won(sum.remaining) + '<small>원</small></b><em>' + (sum.overdue ? '기한 지남 ' + won(sum.overdue) + '원' : '기한 지난 것 없음') + '</em></div>' +
    '<div class="eqk"><span>' + C.ic('fileText') + '아직 계약 전 견적</span><b class="num">' + sum.pendingCount + '<small>건</small></b><em>' + won(sum.pendingTotal) + '원 · 매출에 안 넣음</em></div></div>';
  const mrows = months.map((m) => '<tr' + (isThisYear && m.month === Number(today().slice(5, 7)) ? ' class="now"' : '') + '><td>' + m.month + '월</td><td class="r num">' + (m.count || '') + '</td><td class="r num">' + (m.sales ? won(m.sales) : '-') + '</td><td class="r num">' + (m.received ? won(m.received) : '-') + '</td></tr>').join('') +
    '<tr class="sum"><td>합계</td><td class="r num">' + sum.count + '</td><td class="r num">' + won(sum.sales) + '</td><td class="r num">' + won(sum.received) + '</td></tr>';
  const crow = clients.length ? clients.map((c) => '<tr><td>' + C.esc(c.name) + '</td><td class="r num">' + c.count + '</td><td class="r num">' + won(c.sales) + '</td><td class="r num">' + won(c.received) + '</td><td class="r num' + (c.remaining ? ' due' : '') + '">' + (c.remaining ? won(c.remaining) : '-') + '</td></tr>').join('')
    : '<tr><td colspan="5" class="c empty-msg">' + y + '년에 계약된 매출이 없어요.</td></tr>';
  const rrow = rec.length ? rec.map((r) => '<li class="rec' + (r.overdue ? ' overdue' : '') + '"><a href="#event/' + r.event.id + '"><span class="rn"><b>' + C.esc(r.event.name) + '</b><small>' + C.esc(r.event.client && r.event.client.name || '') + (r.date ? ' · ' + dateShort(r.date) : '') + '</small></span>' +
    '<span class="rm"><b class="num">' + won(r.remaining) + '원</b><small>' + (r.due ? (r.overdue ? '입금 기한 ' + dateShort(r.due) + ' · ' + daysBetween(r.due, today()) + '일 지남' : '입금 기한 ' + dateShort(r.due)) : '받은 돈 ' + won(r.received) + ' / ' + won(r.total)) + '</small></span></a></li>').join('')
    : '<li class="empty-msg">받을 돈이 남은 행사가 없어요.</li>';
  return '<div class="moneypage">' +
    '<section class="card"><div class="card-h"><h2>' + C.ic('chart') + '한눈에 보기</h2>' + ysel + '</div>' + kpis +
    '<p class="note">' + C.ic('alert') + '<span><b>매출</b>은 계약된 행사(계약 상태 · 입금 있음 · 명세서나 청구서를 만든 행사)와 「계약」 상태로 바꾼 문서만 세요. <b>미수금</b>은 행사로 묶은 문서만 셀 수 있어요.</span></p></section>' +
    '<div class="money-cols">' +
    '<section class="card"><div class="card-h"><h2>' + C.ic('chart') + '월별 매출</h2><span class="hint">단위: 만 원</span></div>' + barsHtml(months, isThisYear ? Number(today().slice(5, 7)) : 0) +
    '<div class="tbl-scroll"><table class="tbl mtbl"><thead><tr><th>달</th><th class="r">건수</th><th class="r">매출</th><th class="r">받은 돈</th></tr></thead><tbody>' + mrows + '</tbody></table></div></section>' +
    '<section class="card"><div class="card-h"><h2>' + C.ic('clock') + '받을 돈 (미수금)</h2><span class="hint">' + rec.length + '건 · 기한 지난 것 먼저</span></div><ul class="reclist">' + rrow + '</ul></section>' +
    '</div>' +
    '<section class="card"><div class="card-h"><h2>' + C.ic('users') + '거래처별 매출</h2><span class="hint">' + y + '년 · 매출 큰 순</span></div>' +
    '<div class="tbl-scroll"><table class="tbl mtbl"><thead><tr><th>거래처</th><th class="r">건수</th><th class="r">매출</th><th class="r">받은 돈</th><th class="r">남은 돈</th></tr></thead><tbody>' + crow + '</tbody></table></div></section>' +
    '</div>';
}

export function moneyClick(act, a) {
  if (act === 'money-year') { C.S.moneyYear = a.dataset.y; C.render(); return true; }
  return false;
}
