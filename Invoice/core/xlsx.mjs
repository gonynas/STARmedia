// 엑셀(.xlsx) 파일 만들기 — 외부 라이브러리 없이 (5단계 · 이미지 · 엑셀 · 공유)
// .xlsx 는 XML 파일 몇 개를 ZIP 으로 묶은 것이다. 압축 없이(저장 방식) 묶어도 엑셀이 그대로 연다.
// 칸(cell): null | 숫자 | 글자 | { v: 값, f: '수식(= 없이)', s: '모양 이름' }
// 시트: { name, cols: [너비...], rows: [ [칸...] | { cells: [칸...], h: 높이 } ], merges: ['A1:I1'], grid: false, freeze: 'A2' }

const enc = new TextEncoder();
const bytesOf = (x) => (typeof x === 'string' ? enc.encode(x) : x);

/* ── CRC-32 (ZIP 이 파일마다 요구하는 확인 값) ── */
let CRC_T = null;
export function crc32(bytes) {
  if (!CRC_T) {
    CRC_T = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_T[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ── ZIP (저장 방식, 이름은 UTF-8) ── */
export function zip(files, when = new Date(2026, 0, 1)) {
  const dosTime = ((when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((when.getFullYear() - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate()) & 0xFFFF;
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = bytesOf(f.data), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034B50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014B50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054B50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  return concat([...parts, ...central, new Uint8Array(e.buffer)]);
}
export function concat(arrs) {
  const out = new Uint8Array(arrs.reduce((s, a) => s + a.length, 0));
  let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

/* ── 칸 주소 ── */
export function colName(i) { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
export const ref = (c, r) => colName(c) + r; // c 는 0부터, r 은 1부터

/* ── 모양(스타일): 이름 → 번호 ── */
// 글꼴 0 기본 · 1 굵게 · 2 제목 · 3 회색 작게 · 4 굵게 파랑
// 채움 0 없음 · 1 (필수) · 2 연한 파랑 · 3 진한 남색
// 테두리 0 없음 · 1 얇은 선
const XF = [
  // [글꼴, 채움, 테두리, 숫자형식, 가로정렬, 줄바꿈]
  ['default', 0, 0, 0, 0, '', false],
  ['title', 2, 0, 0, 0, 'center', false],
  ['head', 1, 2, 1, 0, 'center', true],
  ['text', 0, 0, 1, 0, '', true],
  ['num', 0, 0, 1, 3, '', false],
  ['numB', 1, 0, 1, 3, '', false],
  ['label', 1, 0, 0, 0, '', false],
  ['plainNum', 0, 0, 0, 3, '', false],
  ['center', 0, 0, 1, 0, 'center', false],
  ['totalLabel', 1, 3, 1, 0, '', false],
  ['totalNum', 1, 3, 1, 3, '', false],
  ['wrap', 0, 0, 0, 0, '', true],
  ['sub', 3, 0, 0, 0, '', false],
  ['keyLabel', 4, 2, 1, 0, '', false],
  ['keyVal', 0, 0, 1, 0, '', true],
  ['keyNum', 4, 2, 1, 3, '', false],
  // v1.11.0 앱 문서 모양(견적서 · 거래명세서 A4) — 글꼴 5~ · 채움 4~ · 테두리 2~ · 숫자형식 164 = ₩#,##0
  ['barBlue', 0, 4, 0, 0, '', false], ['ruleNavy', 0, 0, 3, 0, '', false],
  ['eyebrow', 5, 0, 0, 0, 'left', false], ['bigTitle', 6, 0, 0, 0, 'left', false], ['stTitle', 16, 0, 0, 0, 'left', false],
  ['metaL', 10, 0, 0, 0, 'right', false], ['metaV', 14, 0, 0, 0, 'right', false],
  ['blueCap', 17, 0, 0, 0, '', false], ['copyTagB', 17, 0, 0, 0, '', false], ['copyTagR', 9, 0, 0, 0, '', false],
  ['clientName', 11, 0, 0, 0, '', false], ['clientSub', 10, 0, 0, 0, '', false],
  ['evL', 10, 7, 0, 0, '', false], ['evV', 14, 7, 0, 0, '', true], ['intro', 13, 0, 0, 0, '', true],
  ['supV', 12, 8, 5, 0, 'center', true], ['supL', 12, 8, 5, 0, 'center', true], ['supT', 13, 0, 5, 0, '', true],
  ['bandL', 7, 4, 0, 0, 'left', true], ['bandC', 7, 4, 0, 0, 'center', true], ['bandN', 8, 4, 0, 164, 'right', false], ['bandNL', 8, 4, 0, 164, 'left', false], ['bandS', 15, 4, 0, 0, 'right', true],
  ['th', 12, 8, 4, 0, 'center', true],
  ['tdC', 13, 0, 2, 0, 'center', false], ['tdT', 13, 0, 2, 0, '', true], ['tdN', 13, 0, 2, 3, 'right', false], ['tdNB', 14, 0, 2, 3, 'right', false], ['tdQ', 13, 0, 2, 0, 'center', false], ['tdM', 10, 0, 2, 0, '', true],
  ['adjC', 9, 6, 2, 0, 'center', false], ['adjT', 9, 6, 2, 0, '', false], ['adjN', 9, 6, 2, 3, 'right', false],
  ['noteT', 17, 0, 0, 0, '', false], ['noteL', 13, 0, 0, 0, '', true],
  ['totL', 10, 0, 2, 0, 'left', false], ['totN', 14, 0, 2, 3, 'right', false],
  ['grandL', 7, 5, 0, 0, 'left', false], ['grandN', 8, 5, 0, 164, 'right', false],
  ['sumL', 12, 8, 2, 0, 'center', false], ['sumN', 14, 8, 2, 3, 'right', false],
  ['mL', 12, 8, 5, 0, 'center', false], ['mN', 14, 0, 5, 3, 'right', false], ['mNBlue', 19, 0, 5, 3, 'right', false],
  ['confirm', 13, 0, 5, 0, '', false], ['confirmR', 13, 0, 5, 0, 'right', false], ['cut', 18, 0, 6, 0, 'center', false], ['rcptLine', 14, 0, 0, 0, 'center', false]
];
const XF_INDEX = Object.fromEntries(XF.map((x, i) => [x[0], i]));
export const STYLE_NAMES = Object.keys(XF_INDEX);

const F = (b, sz, rgb) => '<font>' + (b ? '<b/>' : '') + '<sz val="' + sz + '"/><color rgb="FF' + rgb + '"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>';
function stylesXml() {
  const fonts = [
    '<font><sz val="10.5"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>',
    '<font><b/><sz val="10.5"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>',
    '<font><b/><sz val="20"/><color rgb="FF172B46"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>',
    '<font><sz val="9"/><color rgb="FF6B7280"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>',
    '<font><b/><sz val="10.5"/><color rgb="FF173A6B"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>',
    F(true, 8, '3A83F7'), F(true, 22, '172B46'), F(true, 10, 'FFFFFF'), F(true, 15, 'FFFFFF'), F(true, 9, 'D92D20'), F(false, 8.5, '6B7280'),
    F(true, 13, '172B46'), F(true, 9, '173A6B'), F(false, 9.5, '172B46'), F(true, 9.5, '172B46'), F(false, 8.5, 'FFFFFF'), F(true, 18, '172B46'),
    F(true, 9, '3A83F7'), F(false, 9, '9AA4B2'), F(true, 10, '1C62D8')
  ];
  const fill = (rgb) => '<fill><patternFill patternType="solid"><fgColor rgb="' + rgb + '"/><bgColor indexed="64"/></patternFill></fill>';
  const fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>', fill('FFEAF2FE'), fill('FFDCE8FD'), fill('FF3A83F7'), fill('FF172B46'), fill('FFFFF3F3'), fill('FFF5F8FC'), fill('FFEEF4FE')];
  const side = (n) => '<' + n + ' style="thin"><color rgb="FFB8C4D6"/></' + n + '>';
  const sd = (n, st, rgb) => '<' + n + ' style="' + st + '"><color rgb="FF' + rgb + '"/></' + n + '>';
  const bottom = (st, rgb) => '<border><left/><right/><top/>' + sd('bottom', st, rgb) + '<diagonal/></border>';
  const borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>', '<border>' + side('left') + side('right') + side('top') + side('bottom') + '<diagonal/></border>',
    bottom('thin', 'E3E9F2'), bottom('medium', '172B46'), bottom('medium', '3A83F7'),
    '<border>' + sd('left', 'thin', 'E3E9F2') + sd('right', 'thin', 'E3E9F2') + sd('top', 'thin', 'E3E9F2') + sd('bottom', 'thin', 'E3E9F2') + '<diagonal/></border>', bottom('dashed', '9AA4B2')];
  const xfs = XF.map(([, font, fillI, border, fmt, h, wrap]) =>
    '<xf numFmtId="' + fmt + '" fontId="' + font + '" fillId="' + fillI + '" borderId="' + border + '" xfId="0"' +
    (font ? ' applyFont="1"' : '') + (fillI ? ' applyFill="1"' : '') + (border ? ' applyBorder="1"' : '') + (fmt ? ' applyNumberFormat="1"' : '') +
    ' applyAlignment="1"><alignment vertical="center"' + (h ? ' horizontal="' + h + '"' : '') + (wrap ? ' wrapText="1"' : '') + '/></xf>').join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;₩&quot;#,##0"/></numFmts>' +
    '<fonts count="' + fonts.length + '">' + fonts.join('') + '</fonts>' +
    '<fills count="' + fills.length + '">' + fills.join('') + '</fills>' +
    '<borders count="' + borders.length + '">' + borders.join('') + '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="' + XF.length + '">' + xfs + '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
}

/* ── XML 글자 다듬기 ── */
// 엑셀이 못 읽는 제어 문자는 빼고, < > & " 는 바꾼다
export const xmlEsc = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** 시트 이름: 31자까지, [ ] : * ? / \ 는 쓸 수 없다 */
export function sheetName(s, used = new Set()) {
  let base = String(s || '시트').replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || '시트';
  let n = base, i = 2;
  while (used.has(n.toLowerCase())) { const suf = ' (' + i++ + ')'; n = base.slice(0, 31 - suf.length) + suf; }
  used.add(n.toLowerCase());
  return n;
}

function cellXml(cell, addr) {
  if (cell === null || cell === undefined || cell === '') return '';
  const o = typeof cell === 'object' ? cell : { v: cell };
  const s = o.s ? XF_INDEX[o.s] : undefined;
  if (o.s && s === undefined) throw new Error('모양 이름이 없어요: ' + o.s);
  const sa = s ? ' s="' + s + '"' : '';
  if (o.f) {
    const v = typeof o.v === 'number' && Number.isFinite(o.v) ? '<v>' + o.v + '</v>' : '';
    return '<c r="' + addr + '"' + sa + '><f>' + xmlEsc(o.f) + '</f>' + v + '</c>';
  }
  if (typeof o.v === 'number') return Number.isFinite(o.v) ? '<c r="' + addr + '"' + sa + '><v>' + o.v + '</v></c>' : '';
  if (o.v === null || o.v === undefined || o.v === '') return sa ? '<c r="' + addr + '"' + sa + '/>' : '';
  return '<c r="' + addr + '"' + sa + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(o.v) + '</t></is></c>';
}

function sheetXml(sh, drawingRid) {
  const rows = sh.rows.map((r) => (Array.isArray(r) ? { cells: r } : r));
  let maxC = 0;
  const body = rows.map((r, ri) => {
    const cells = r.cells || [];
    maxC = Math.max(maxC, cells.length);
    const inner = cells.map((c, ci) => cellXml(c, ref(ci, ri + 1))).join('');
    if (!inner && !r.h && !r.hidden) return '';
    return '<row r="' + (ri + 1) + '"' + (r.h ? ' ht="' + r.h + '" customHeight="1"' : '') + (r.hidden ? ' hidden="1"' : '') + '>' + inner + '</row>';
  }).join('');
  const dim = 'A1:' + ref(Math.max(0, maxC - 1), Math.max(1, rows.length));
  const freeze = sh.freeze ? (() => {
    const m = /^([A-Z]+)(\d+)$/.exec(sh.freeze); const r = Number(m[2]) - 1;
    return '<pane ySplit="' + r + '" topLeftCell="' + sh.freeze + '" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="' + sh.freeze + '" sqref="' + sh.freeze + '"/>';
  })() : '';
  const cols = sh.cols && sh.cols.length ? '<cols>' + sh.cols.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' : '';
  const merges = sh.merges && sh.merges.length ? '<mergeCells count="' + sh.merges.length + '">' + sh.merges.map((m) => '<mergeCell ref="' + m + '"/>').join('') + '</mergeCells>' : '';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="' + dim + '"/>' +
    '<sheetViews><sheetView workbookViewId="0"' + (sh.grid === false ? ' showGridLines="0"' : '') + '>' + freeze + '</sheetView></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="18"/>' + cols + '<sheetData>' + body + '</sheetData>' + merges +
    (sh.center ? '<printOptions horizontalCentered="1"/>' : '') +
    (sh.margins ? '<pageMargins left="' + sh.margins + '" right="' + sh.margins + '" top="' + sh.margins + '" bottom="' + sh.margins + '" header="0.2" footer="0.2"/>' : '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>') +
    '<pageSetup paperSize="9" orientation="' + (sh.landscape ? 'landscape' : 'portrait') + '" fitToWidth="1" fitToHeight="' + (sh.onePage ? 1 : 0) + '"/>' +
    (drawingRid ? '<drawing r:id="' + drawingRid + '"/>' : '') + '</worksheet>';
}

/** 시트 목록 → .xlsx 파일 내용(바이트) */
export function buildXlsx(sheets, { title = '', when = new Date() } = {}) {
  if (!sheets.length) throw new Error('시트가 없어요');
  const used = new Set();
  const names = sheets.map((s) => sheetName(s.name, used));
  const files = [];
  files.push({ name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' });
  files.push({ name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' });
  const iso = when.toISOString().replace(/\.\d+Z$/, 'Z');
  files.push({ name: 'docProps/core.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<dc:title>' + xmlEsc(title) + '</dc:title><dc:creator>스타미디어 견적서 발행기</dc:creator>' +
    '<dcterms:created xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:modified></cp:coreProperties>' });
  files.push({ name: 'docProps/app.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>' });
  files.push({ name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<bookViews><workbookView/></bookViews><sheets>' + names.map((n, i) => '<sheet name="' + xmlEsc(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets>' +
    '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>' });
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
    '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' });
  files.push({ name: 'xl/styles.xml', data: stylesXml() });
  // 그림(로고 · 도장): sheet.images = [{ data: PNG 바이트, col, row(0부터), colOff, rowOff, w, h (px) }]
  let img = 0, dr = 0;
  sheets.forEach((s, i) => {
    const pics = (s.images || []).filter((p) => p && p.data && p.data.length);
    if (!pics.length) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s) }); return; }
    dr++;
    const E = (px) => Math.round(px * 9525);
    const anchors = pics.map((p, k) => { img++; files.push({ name: 'xl/media/image' + img + '.png', data: p.data });
      return '<xdr:oneCellAnchor><xdr:from><xdr:col>' + p.col + '</xdr:col><xdr:colOff>' + E(p.colOff || 0) + '</xdr:colOff><xdr:row>' + p.row + '</xdr:row><xdr:rowOff>' + E(p.rowOff || 0) + '</xdr:rowOff></xdr:from>' +
        '<xdr:ext cx="' + E(p.w) + '" cy="' + E(p.h) + '"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="' + (k + 2) + '" name="' + xmlEsc(p.name || 'pic' + k) + '"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>' +
        '<xdr:blipFill><a:blip r:embed="rId' + (k + 1) + '"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + E(p.w) + '" cy="' + E(p.h) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>'; });
    const first = img - pics.length;
    files.push({ name: 'xl/drawings/drawing' + dr + '.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + anchors.join('') + '</xdr:wsDr>' });
    files.push({ name: 'xl/drawings/_rels/drawing' + dr + '.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + pics.map((_, k) => '<Relationship Id="rId' + (k + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image' + (first + k + 1) + '.png"/>').join('') + '</Relationships>' });
    files.push({ name: 'xl/worksheets/_rels/sheet' + (i + 1) + '.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing' + dr + '.xml"/></Relationships>' });
    files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s, 'rId1') });
  });
  if (dr) {
    const ct = files[0];
    ct.data = ct.data.replace('<Default Extension="xml"', '<Default Extension="png" ContentType="image/png"/><Default Extension="xml"')
      .replace('</Types>', Array.from({ length: dr }, (_, k) => '<Override PartName="/xl/drawings/drawing' + (k + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>').join('') + '</Types>');
  }
  return zip(files, when);
}

/** 시험용: 저장 방식 ZIP 을 다시 풀어 { 이름: 글자 } 로 (CRC 도 확인) */
export function unzipStored(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  const out = {}; let p = 0;
  while (p + 4 <= bytes.length && dv.getUint32(p, true) === 0x04034B50) {
    const crc = dv.getUint32(p + 14, true), size = dv.getUint32(p + 18, true), nl = dv.getUint16(p + 26, true), xl = dv.getUint16(p + 28, true);
    const name = dec.decode(bytes.subarray(p + 30, p + 30 + nl));
    const data = bytes.subarray(p + 30 + nl + xl, p + 30 + nl + xl + size);
    if (crc32(data) !== crc) throw new Error('CRC 가 맞지 않아요: ' + name);
    out[name] = dec.decode(data);
    p += 30 + nl + xl + size;
  }
  return out;
}
