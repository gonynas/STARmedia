// 화면: 행사 달력 (#cal) — 행사 날짜(시작~끝)를 달력에, 그날 나가는 장비 수와 부족 표시
// 계산은 core/reports.mjs 의 monthGrid · undatedEvents · equipmentOn (node 시험 통과)
import { monthGrid, undatedEvents, equipmentOn, isContracted, equipState } from './core/reports.mjs?v=mwqgvo9m';
import { eventDateText } from './core/events.mjs?v=mwqgvo9m';
import { ymd, dateKo } from './core/docs.mjs?v=mwqgvo9m';

let C;
export function initCalendar(ctx) { C = ctx; }

const ymNow = () => ymd().slice(0, 7);
const shift = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };

export function calendarPage() {
  const S = C.S, d = S.data;
  const ym = S.calYm || ymNow(), [y, m] = ym.split('-').map(Number);
  const pick = S.calDay && S.calDay.startsWith(ym) ? S.calDay : (ymNow() === ym ? ymd() : ym + '-01');
  const weeks = monthGrid(d, y, m), t = ymd();
  const head = '일월화수목금토'.split('').map((w, i) => '<div class="cal-w' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '') + '">' + w + '</div>').join('');
  const cells = weeks.flat().map((c, i) => {
    if (!c) return '<div class="cal-c empty" aria-hidden="true"></div>';
    const cls = ['cal-c', c.day === t ? 'today' : '', c.day === pick ? 'pick' : '', i % 7 === 0 ? 'sun' : i % 7 === 6 ? 'sat' : '', c.short ? 'short' : ''].filter(Boolean).join(' ');
    const evs = c.events.slice(0, 3).map((e) => '<span class="cal-ev' + (isContracted(e, d) ? ' ok' : '') + '">' + C.esc(e.name) + '</span>').join('') + (c.events.length > 3 ? '<span class="cal-more">+' + (c.events.length - 3) + '</span>' : '');
    return '<button type="button" class="' + cls + '" data-act="cal-day" data-day="' + c.day + '" aria-label="' + c.d + '일 행사 ' + c.events.length + '건' + (c.gearOut ? ' · 장비 ' + c.gearOut + '개 나감' : '') + (c.short ? ' · 장비 부족' : '') + '"' + (c.day === pick ? ' aria-pressed="true"' : '') + '>' +
      '<span class="cal-d">' + c.d + '</span>' + evs + (c.gearOut ? '<span class="cal-g">' + C.ic('tent') + c.gearOut + (c.short ? ' · 부족' : '') + '</span>' : '') + '</button>';
  }).join('');
  // 고른 날 자세히
  const dayEvents = d.events.filter((e) => e.status !== 'cancel' && e.start && pick >= e.start && pick <= (e.end && e.end >= e.start ? e.end : e.start));
  const gear = equipmentOn(d, pick).filter((x) => x.out > 0);
  const evList = dayEvents.length ? dayEvents.map((e) => '<li><a href="#event/' + e.id + '"><b>' + C.esc(e.name) + '</b><small>' + C.esc([e.client && e.client.name, e.place, eventDateText(e)].filter(Boolean).join(' · ')) + '</small><span class="schip ' + (isContracted(e, d) ? 's-contract' : 's-draft') + '">' + (isContracted(e, d) ? '계약' : '견적 중') + '</span></a></li>').join('') : '<li class="empty-msg">이 날 잡힌 행사가 없어요.</li>';
  const gList = gear.length ? gear.map((x) => { const st = equipState(x.total, x.left); return '<li><span>' + C.esc(x.equip.name) + '</span><b class="num">' + x.out + '개 나감</b><em class="eqs ' + st[0] + '">' + (x.left < 0 ? st[1] : x.left + '개 남음') + '</em></li>'; }).join('') : '<li class="empty-msg">이 날 나가는 장비가 없어요.</li>';
  const und = undatedEvents(d);
  return '<div class="calpage">' +
    '<section class="card cal-card"><div class="card-h cal-h"><button class="icbtn" data-act="cal-move" data-n="-1" aria-label="지난달">' + C.ic('left') + '</button><h2>' + y + '년 ' + m + '월</h2><button class="icbtn" data-act="cal-move" data-n="1" aria-label="다음 달">' + C.ic('right') + '</button>' +
    (ym !== ymNow() ? '<button class="btn sm" data-act="cal-today">오늘</button>' : '') + '<span class="hint">파란 칸 = 계약된 행사 · 회색 = 견적 중</span></div>' +
    '<div class="cal-grid">' + head + cells + '</div></section>' +
    '<aside class="card cal-side"><div class="card-h"><h2>' + C.ic('calendar') + C.esc(dateKo(pick)) + '</h2></div>' +
    '<h4 class="cal-sh">행사 ' + dayEvents.length + '건</h4><ul class="cal-list">' + evList + '</ul>' +
    '<h4 class="cal-sh">나가는 장비</h4><ul class="cal-gear">' + gList + '</ul>' +
    (und.length ? '<p class="note">' + C.ic('alert') + '<span>날짜를 안 정한 행사 <b>' + und.length + '건</b>은 달력에 안 보여요. 행사 화면에서 「행사 정보 고치기」로 날짜를 넣어 주세요.</span></p>' +
      '<ul class="cal-list">' + und.slice(0, 5).map((e) => '<li><a href="#event/' + e.id + '"><b>' + C.esc(e.name) + '</b><small>' + C.esc(e.dateText || '날짜 없음') + '</small></a></li>').join('') + '</ul>' : '') +
    '<a class="btn wide" href="#event">' + C.ic('won') + '행사 · 입금으로</a></aside></div>';
}

export function calendarClick(act, a) {
  const S = C.S;
  if (act === 'cal-move') { S.calYm = shift(S.calYm || ymNow(), Number(a.dataset.n)); S.calDay = null; C.render(); return true; }
  if (act === 'cal-today') { S.calYm = ymNow(); S.calDay = ymd(); C.render(); return true; }
  if (act === 'cal-day') { S.calDay = a.dataset.day; C.render(); return true; }
  return false;
}
