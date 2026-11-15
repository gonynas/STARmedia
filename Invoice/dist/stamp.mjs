// 도장 사진 → 문서에 넣을 투명 배경 PNG
// JPG · 흰 배경 사진: 밝고 색이 옅은 점(종이)을 투명하게, 경계는 부드럽게. 남은 부분만 잘라 300px 안으로 줄임
// 이미 투명한 PNG: 배경은 그대로 두고 크기만 맞춤
const MAX = 300;

function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('그림을 읽지 못했어요')); };
    img.src = url;
  });
}

export async function processStamp(file, removeBg = true) {
  const img = await loadImage(file);
  const sc = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * sc)), h = Math.max(1, Math.round(img.naturalHeight * sc));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h), p = id.data;
  let hasAlpha = false;
  for (let i = 3; i < p.length; i += 4 * 7) if (p[i] < 250) { hasAlpha = true; break; }
  const cleared = removeBg && !hasAlpha;
  if (cleared) {
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn, lum = (r + g + b) / 3;
      // 종이: 밝고 색이 옅음 → 투명. 경계(조금 덜 밝음)는 반투명
      if (sat < 45 && lum > 195) p[i + 3] = 0;
      else if (sat < 60 && lum > 160) p[i + 3] = Math.round(p[i + 3] * Math.min(1, (195 - lum) / 35 + sat / 120));
    }
    ctx.putImageData(id, 0, 0);
  }
  // 투명하지 않은 부분만 남기기
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (p[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error('도장 모양을 찾지 못했어요. 흰 종이에 찍은 도장을 밝게 찍어 주세요');
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, side = Math.max(cw, ch);
  const out = document.createElement('canvas');
  const os = Math.min(MAX, side); out.width = os; out.height = os;
  const k = os / side;
  out.getContext('2d').drawImage(cv, x0, y0, cw, ch, (os - cw * k) / 2, (os - ch * k) / 2, cw * k, ch * k);
  return { dataUrl: out.toDataURL('image/png'), cleared, keptAlpha: hasAlpha };
}
