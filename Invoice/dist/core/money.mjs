// 스타미디어 견적서 발행기 — 금액 계산 엔진 (1단계, 확정 규칙)
// 근거: 설계서 v0.1 4절 + 최종확정 v1.0 6절 + P01 · P02 · P03 (2026-11-14 '모두 추천대로')
// 화면과 상관없는 순수 계산만 둔다. 모든 금액은 원 단위 정수.

/** 줄 공급가액(부가세 전 금액) = 일수 × 수량 × 단가, 원 아래 버림 (P02) */
export function lineAmount(line) {
  const v = (Number(line.days) || 0) * (Number(line.qty) || 0) * (Number(line.price) || 0);
  // 0.1 × 3 같은 부동소수 오차로 1원이 빠지지 않게 아주 작은 값을 더한 뒤 버림
  return Math.floor(v + 1e-6);
}

/**
 * 줄 하나의 공급가액 · 세액
 * vat: 'excl'(별도: 10% 원 아래 버림) | 'incl'(포함: ÷1.1 반올림이 공급가액) | 'none'(없음)
 * 품목별 면세(line.taxFree)면 세액 0
 */
export function lineTax(line, vat) {
  const a = lineAmount(line);
  if (vat === 'none' || line.taxFree) return { supply: a, tax: 0 };
  if (vat === 'incl') { const s = Math.round(a / 1.1); return { supply: s, tax: a - s }; }
  return { supply: a, tax: Math.floor(a * 0.1) };
}

/** 품목 합계 (끝자리 정리 전) */
export function itemsTotal(lines, vat) {
  let supply = 0, tax = 0;
  for (const l of lines) { const r = lineTax(l, vat); supply += r.supply; tax += r.tax; }
  return { supply, tax, total: supply + tax };
}

/**
 * P01 끝자리 정리: 최종 합의금액(부가세 포함 최종 금액)을 받아
 * 공급가액 · 세액을 다시 나누고, 원래 합계와의 차이를 「끝자리 정리」 한 줄로 돌려준다.
 * agreed 가 없으면(null/undefined) 정리 없음.
 */
export function settle(lines, vat, agreed) {
  const base = itemsTotal(lines, vat);
  if (agreed === null || agreed === undefined || agreed === '' || Number(agreed) === base.total) {
    return { base, final: base, adjust: null };
  }
  const A = Math.round(Number(agreed));
  let supply, tax;
  if (vat === 'none') { supply = A; tax = 0; } else { supply = Math.round(A / 1.1); tax = A - supply; }
  const adjust = { supply: supply - base.supply, tax: tax - base.tax, total: A - base.total };
  return { base, final: { supply, tax, total: A }, adjust };
}

/**
 * Q02 · P03 입금 장부: 취소 표시된 입금은 빼고 더한다. 환불은 음수 금액으로 적는다.
 * 돌려주는 값: 받은 금액, 남은 금액(음수면 더 받음), 상태
 */
export function ledger(finalTotal, payments) {
  const valid = (payments || []).filter((p) => !p.cancelled);
  const received = valid.reduce((s, p) => s + Math.round(Number(p.amount) || 0), 0);
  const remaining = finalTotal - received;
  let state = 'unpaid';
  if (received > 0 && remaining > 0) state = 'partial';
  if (remaining === 0 && finalTotal > 0) state = 'paid';
  if (remaining < 0) state = 'overpaid';
  return { received, remaining, overpaid: remaining < 0 ? -remaining : 0, state };
}

/** Q03 완납 영수증은 남은 금액이 0일 때만. 더 받은 상태면 먼저 환불을 적어야 함 */
export function canIssueReceipt(finalTotal, payments) {
  const l = ledger(finalTotal, payments);
  return { ok: l.state === 'paid', reason: l.state === 'paid' ? '' : l.state === 'overpaid' ? 'overpaid' : 'remaining', ledger: l };
}

/** P03: 계약 취소 시 돌려줄 금액 = 지금까지 받은 금액(유효 입금 합계, 음수면 0) */
export function refundOnCancel(payments) {
  const { received } = ledger(0, payments);
  return Math.max(0, received);
}

/** 한글 금액: 6,622,000 → 육백육십이만이천 (일금 ○○ 원정 에 사용) */
export function hangul(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (!n) return '영';
  const d = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const u = ['', '십', '백', '천'], b = ['', '만', '억', '조'];
  let s = '', i = 0;
  while (n > 0) {
    let chunk = n % 10000; n = Math.floor(n / 10000);
    if (chunk) {
      let c = '';
      for (let j = 0; j < 4; j++) { const dig = chunk % 10; chunk = Math.floor(chunk / 10); if (dig) c = (dig === 1 && j > 0 ? '' : d[dig]) + u[j] + c; }
      s = c + b[i] + s;
    }
    i++;
  }
  return s;
}
