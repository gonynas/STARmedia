// 5단계 시험: 엑셀(수식 · 파일 모양) · PDF 파일 모양
// 엑셀 수식은 아래의 작은 계산기로 직접 계산해서, 미리 넣은 값 · 화면 합계와 같은지 본다.
import { buildXlsx, unzipStored, crc32, colName, sheetName, xmlEsc } from './xlsx.mjs';
import { docSheet, listSheets, clientsSheet, itemsSheets, lineFormulas } from './sheets.mjs';
import { imagesToPdf, jpegSize } from './pdf.mjs';
import { docTotals } from './docs.mjs';
import { lineTax } from './money.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}

/* ── 작은 엑셀 계산기 (INT · ROUND · SUM · 사칙연산 · 칸 주소) ── */
function cellsOf(sheet) {
  const m = {};
  sheet.rows.forEach((r, ri) => (Array.isArray(r) ? r : r.cells).forEach((c, ci) => { if (c !== null && c !== undefined) m[colName(ci) + (ri + 1)] = typeof c === 'object' ? c : { v: c }; }));
  return m;
}
function evaluate(sheet) {
  const m = cellsOf(sheet), memo = {};
  const colIdx = (s) => [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const val = (a) => {
    if (a in memo) return memo[a];
    const c = m[a]; if (!c) return 0;
    if (!c.f) return memo[a] = typeof c.v === 'number' ? c.v : 0;
    const js = c.f
      .replace(/SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (_, c1, r1, c2, r2) => 'S("' + c1 + '",' + r1 + ',"' + c2 + '",' + r2 + ')')
      .replace(/INT\(/g, 'Math.floor(').replace(/ROUND\(/g, 'R(')
      .replace(/\b([A-Z]+)(\d+)\b/g, (_, c1, r1) => 'V("' + c1 + r1 + '")');
    const S = (c1, r1, c2, r2) => { let s = 0; for (let ci = colIdx(c1); ci <= colIdx(c2); ci++) for (let r = r1; r <= r2; r++) s += val(colName(ci) + r); return s; };
    const R = (x, d) => { const p = 10 ** d; return Math.sign(x) * Math.round(Math.abs(x) * p) / p; };
    return memo[a] = Function('S', 'R', 'V', 'return (' + js + ');')(S, R, val);
  };
  const bad = [];
  for (const a of Object.keys(m)) if (m[a].f && typeof m[a].v === 'number' && val(a) !== m[a].v) bad.push(a + ' ' + m[a].f + ' = ' + val(a) + ' ≠ ' + m[a].v);
  return { val, bad, m };
}
const findLabel = (sheet, text) => { const m = cellsOf(sheet); const a = Object.keys(m).find((k) => m[k].v === text); return a ? Number(a.replace(/[A-Z]+/, '')) : 0; };

const me = { name: '스타미디어', bizNo: '123-45-67890', ceo: '홍길동', addr: '서울', tel: '02-000-0000', bankName: '국민', bankNo: '000-00-0000', holder: '스타미디어' };
const L = (name, days, qty, price, x = {}) => ({ id: name, name, spec: '', days, qty, price, memo: '', taxFree: false, ...x });
const base = { id: 'd1', type: 'quote', serial: '261115-01', showNo: true, date: '2026-11-15', validDays: 15, status: 'draft', client: { name: '가나시청', person: '김담당', tel: '010' }, event: { name: '가을축제', date: '11/21', place: '공원' }, deposit: { on: false, amount: 0 }, agreed: null, notes: { valid: true, bank: true, phrases: [], text: '' } };
const lines = [L('무대', 2, 1, 1234567), L('조명', 0.5, 3, 33333), L('음향', 1, 1, 999999), L('행사보험', 1, 1, 50000, { taxFree: true }), L('할인', 1, 1, -12345)];

console.log('줄 수식 = 화면 계산 (별도 · 포함 · 없음 · 면세 · 음수)');
for (const vat of ['excl', 'incl', 'none']) {
  const doc = { ...base, vat, lines };
  const sh = docSheet(doc, me);
  const ev = evaluate(sh);
  eq(vat + ': 모든 수식이 미리 넣은 값과 같음', ev.bad, []);
  const g = findLabel(sh, '총 합계 (부가세 포함)');
  eq(vat + ': 총 합계 수식 = 화면 합계', ev.val('G' + g), docTotals(doc).total);
  const s = findLabel(sh, '공급가액 합계');
  eq(vat + ': 공급가액 합계 = 화면', ev.val('G' + s), docTotals(doc).supply);
}

console.log('끝자리 정리 · 선금 · 청구서 받은 금액');
{
  const doc = { ...base, vat: 'excl', lines, agreed: 2400000, deposit: { on: true, amount: 500000 } };
  const sh = docSheet(doc, me), ev = evaluate(sh), t = docTotals(doc);
  eq('끝자리 정리 줄이 있고 수식이 맞음', ev.bad, []);
  eq('정리 후 총 합계 = 합의금액', ev.val('G' + findLabel(sh, '총 합계 (부가세 포함)')), 2400000);
  eq('잔금 = 합계 − 선금', ev.val('G' + findLabel(sh, '잔금')), t.balance);
  eq('맨 위 합계금액 칸도 같은 금액', ev.val('G' + findLabel(sh, '합계금액 (부가세 포함)')), 2400000);
  const inv = { ...base, type: 'inv', dueDate: '2026-11-30', vat: 'excl', lines };
  const si = docSheet(inv, me, { linked: true, received: 1000000, remaining: docTotals(inv).total - 1000000 });
  const ei = evaluate(si);
  eq('청구서: 이번에 청구하는 금액 = 합계 − 받은 금액', ei.val('G' + findLabel(si, '이번에 청구하는 금액')), docTotals(inv).total - 1000000);
  eq('청구서: 입금 계좌 줄', findLabel(si, '입금 계좌') > 0, true);
  const empty = docSheet({ ...base, vat: 'excl', lines: [] }, me);
  eq('품목 없는 문서도 합계 0', evaluate(empty).val('G' + findLabel(empty, '총 합계 (부가세 포함)')), 0);
}

console.log('발행 목록 · 품목별 내역');
{
  const docs = [{ ...base, vat: 'excl', lines }, { ...base, id: 'd2', serial: '261115-02', vat: 'incl', lines: lines.slice(0, 2), agreed: 2000000 }, { ...base, id: 'd3', type: 'stmt', vat: 'none', lines: [] }];
  const [s1, s2] = listSheets(docs);
  const e1 = evaluate(s1), e2 = evaluate(s2);
  eq('목록 수식이 맞음', e1.bad, []);
  eq('목록 합계 줄 = 문서 합계의 합', e1.val('J' + s1.rows.length), docs.reduce((s, d) => s + docTotals(d).total, 0));
  eq('품목별 내역 수식이 맞음', e2.bad, []);
  const sumJK = (from, to) => { let s = 0; for (let r = from; r <= to; r++) s += e2.val('J' + r) + e2.val('K' + r); return s; };
  eq('품목별 내역 첫 문서 줄 합 = 그 문서 합계', sumJK(2, 1 + lines.length), docTotals(docs[0]).total);
  eq('끝자리 정리도 한 줄로 들어가 문서 합계와 같음', sumJK(2 + lines.length, 1 + lines.length + 3), 2000000);
}

console.log('거래처 · 품목 · 세트');
{
  const cs = clientsSheet([{ name: '하나', person: 'a' }, { name: '가나', email: 'x@y' }]);
  eq('거래처 이름순', cs.rows[1][0].v, '가나');
  const items = [{ id: 'i1', cat: '무대', name: '트러스', spec: '6m', days: 1, price: 150000 }, { id: 'i2', cat: '', name: '발전차', spec: '', days: 1, price: 800000, taxFree: false }];
  const sets = [{ id: 's1', name: '기본 세트', lines: [{ itemId: 'i1', qty: 2, days: 2 }, { itemId: 'gone', name: '지운 품목', qty: 1, days: 1, price: 1000 }] }];
  const [si, ss] = itemsSheets(items, sets);
  eq('분류 없는 품목 표시', si.rows.slice(1).map((r) => r[0].v), ['분류 없음', '무대']);
  eq('세트 금액 수식', evaluate(ss).bad, []);
  eq('세트 줄 금액 (2일 × 2개 × 150,000)', ss.rows[1][6].v, 600000);
  eq('지운 품목은 세트 사본으로', ss.rows[2][1].v, '지운 품목');
}

console.log('xlsx 파일 모양');
{
  const doc = { ...base, vat: 'excl', lines, client: { name: 'A&B <주>' } };
  const bytes = buildXlsx([docSheet(doc, me), ...listSheets([doc])], { title: '견적서', when: new Date(2026, 10, 15, 9, 0, 0) });
  eq('ZIP 머리 PK', [bytes[0], bytes[1]], [0x50, 0x4B]);
  const files = unzipStored(bytes);
  eq('필수 파일이 모두 있음', ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml'].every((n) => n in files), true);
  eq('시트 이름 3개', (files['xl/workbook.xml'].match(/<sheet /g) || []).length, 3);
  eq('특수 문자는 바뀌어 들어감', files['xl/worksheets/sheet1.xml'].includes('A&amp;B &lt;주&gt; 귀하'), true);
  eq('수식이 들어감 (INT)', /<f>INT\(D\d+\*E\d+\*F\d+\+0\.000001\)<\/f>/.test(files['xl/worksheets/sheet1.xml']), true);
  eq('열 때 다시 계산', files['xl/workbook.xml'].includes('fullCalcOnLoad="1"'), true);
  const xml = files['xl/worksheets/sheet1.xml'];
  const order = ['<sheetPr', '<dimension', '<sheetViews', '<sheetFormatPr', '<cols', '<sheetData', '<mergeCells', '<pageMargins', '<pageSetup'].map((t) => xml.indexOf(t));
  eq('시트 안 순서가 엑셀 규칙대로', order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])), true);
  eq('CRC-32 (알려진 값)', crc32(new TextEncoder().encode('123456789')).toString(16), 'cbf43926');
  eq('열 이름', [colName(0), colName(25), colName(26), colName(27)], ['A', 'Z', 'AA', 'AB']);
  eq('시트 이름 금지 문자 · 중복', (() => { const u = new Set(); return [sheetName('a/b', u), sheetName('a b', u)]; })(), ['a b', 'a b (2)']);
  eq('제어 문자 제거', xmlEsc('a\u0001b'), 'ab');
}

console.log('PDF 파일 모양');
{
  // JPEG 머리만 흉내 낸 바이트: SOI · APP0(JFIF) · SOF0(세로 2339, 가로 1654, 색 3) · EOI
  const jpg = Uint8Array.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0,
    0xFF, 0xC0, 0x00, 0x11, 0x08, 0x09, 0x23, 0x06, 0x76, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xFF, 0xD9]);
  eq('JPEG 크기 읽기', jpegSize(jpg), { height: 2339, width: 1654, comps: 3 });
  const pdf = imagesToPdf([jpg, jpg], { title: '견적서_가나_261115-01', when: new Date(2026, 10, 15) });
  const s = Buffer.from(pdf).toString('latin1');
  eq('PDF 머리', s.slice(0, 8), '%PDF-1.4');
  eq('쪽 2개', /\/Count 2/.test(s), true);
  eq('끝 표시', s.trimEnd().endsWith('%%EOF'), true);
  // xref 의 위치들이 실제 객체 위치와 맞는지
  const start = Number(/startxref\n(\d+)/.exec(s)[1]);
  eq('startxref 가 xref 를 가리킴', s.slice(start, start + 4), 'xref');
  const offs = s.slice(start).split('\n').slice(3).filter((l) => / n $/.test(l)).map((l) => Number(l.slice(0, 10)));
  eq('모든 객체 위치가 맞음', offs.every((o, i) => s.slice(o, o + String(i + 1).length + 6) === (i + 1) + ' 0 obj'), true);
  eq('A4 크기', s.includes('/MediaBox [0 0 595.28 841.89]'), true);
  eq('제목은 한글(UTF-16)', s.includes('/Title <FEFF'), true);
}

console.log(`\n내보내기 시험: ${pass}개 통과, ${fail}개 실패`);
if (fail) process.exit(1);
