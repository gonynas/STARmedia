// PDF 파일 만들기 — 외부 라이브러리 없이 (5단계)
// A4 한 쪽마다 문서 그림(JPEG) 한 장을 꽉 채워 넣는다. 미리보기 · 이미지와 똑같은 모습이 된다.
import { concat } from './xlsx.mjs?v=mwyavegf';

const A4 = { w: 595.28, h: 841.89 }; // pt (1pt = 1/72인치)
const enc = new TextEncoder();

/** JPEG 의 가로 · 세로 픽셀 (SOF 표시를 찾아 읽는다) */
export function jpegSize(b) {
  if (b[0] !== 0xFF || b[1] !== 0xD8) throw new Error('JPEG 그림이 아니에요');
  let p = 2;
  while (p + 9 < b.length) {
    if (b[p] !== 0xFF) { p++; continue; }
    const m = b[p + 1];
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { p += 2; continue; }
    const len = (b[p + 2] << 8) | b[p + 3];
    if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) {
      return { height: (b[p + 5] << 8) | b[p + 6], width: (b[p + 7] << 8) | b[p + 8], comps: b[p + 9] };
    }
    p += 2 + len;
  }
  throw new Error('JPEG 크기를 읽지 못했어요');
}

/** PDF 문서 정보의 글자(한글 포함)는 UTF-16 으로 적는다 */
function pdfText(s) {
  let h = 'FEFF';
  for (const ch of String(s || '')) {
    const cp = ch.codePointAt(0);
    if (cp > 0xFFFF) { const v = cp - 0x10000; h += (0xD800 + (v >> 10)).toString(16).padStart(4, '0') + (0xDC00 + (v & 0x3FF)).toString(16).padStart(4, '0'); }
    else h += cp.toString(16).padStart(4, '0');
  }
  return '<' + h.toUpperCase() + '>';
}

/**
 * JPEG 쪽들 → PDF 바이트
 * pages: [Uint8Array(JPEG), ...]
 */
export function imagesToPdf(pages, { title = '', when = new Date() } = {}) {
  if (!pages.length) throw new Error('쪽이 없어요');
  const chunks = []; const offsets = []; let pos = 0;
  const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); pos += b.length; };
  const obj = (n, body) => { offsets[n] = pos; put(n + ' 0 obj\n'); if (Array.isArray(body)) body.forEach(put); else put(body); put('\nendobj\n'); };

  const n = pages.length;
  // 번호: 1 카탈로그 · 2 쪽 묶음 · 3 정보 · 그다음 쪽마다 [쪽, 내용, 그림]
  const pageNo = (i) => 4 + i * 3;
  put('%PDF-1.4\n'); // 머리말
  put(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A])); // 바이너리 파일임을 알리는 줄
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Count ' + n + ' /Kids [' + pages.map((_, i) => pageNo(i) + ' 0 R').join(' ') + '] >>');
  const d = when, p2 = (x) => String(x).padStart(2, '0');
  const date = 'D:' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
  obj(3, '<< /Title ' + pdfText(title) + ' /Producer ' + pdfText('스타미디어 견적서 발행기') + ' /CreationDate (' + date + ') >>');
  pages.forEach((jpg, i) => {
    const sz = jpegSize(jpg);
    const no = pageNo(i);
    const content = 'q\n' + A4.w + ' 0 0 ' + A4.h + ' 0 0 cm\n/Im0 Do\nQ\n';
    obj(no, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + A4.w + ' ' + A4.h + '] /Resources << /XObject << /Im0 ' + (no + 2) + ' 0 R >> >> /Contents ' + (no + 1) + ' 0 R >>');
    obj(no + 1, ['<< /Length ' + content.length + ' >>\nstream\n', content, 'endstream']);
    obj(no + 2, ['<< /Type /XObject /Subtype /Image /Width ' + sz.width + ' /Height ' + sz.height + ' /ColorSpace /' + (sz.comps === 1 ? 'DeviceGray' : 'DeviceRGB') +
      ' /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n', jpg, '\nendstream']);
  });
  const count = 4 + n * 3;
  const xref = pos;
  let x = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
  for (let i = 1; i < count; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  put(x);
  put('trailer\n<< /Size ' + count + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
  return concat(chunks);
}
