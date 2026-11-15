// 금액 계산 규칙 (2차 답변 반영)
// 공급가액 = 일수 × 수량 × 단가, 원 아래는 버림 (P02 확정: 0.5일 × 1 × 101원 = 50원)
// 부가세: 별도 = 줄마다 10%에서 원 아래 버림 / 포함 = 금액÷1.1 반올림이 공급가액, 나머지가 세액 / 없음 = 0
var Calc = {
  amount: function (l) {
    // 부동소수 오차(예: 0.1×3)로 1원이 빠지지 않도록 아주 작은 값을 더한 뒤 버림
    return Math.floor((Number(l.days) || 0) * (Number(l.qty) || 0) * (Number(l.price) || 0) + 1e-6);
  },
  line: function (l, vat) {
    var a = Calc.amount(l);
    if (vat === 'none') return { supply: a, tax: 0 };
    if (vat === 'incl') { var s = Math.round(a / 1.1); return { supply: s, tax: a - s }; }
    return { supply: a, tax: Math.floor(a * 0.1) };
  },
  totals: function (doc) {
    var s = 0, t = 0;
    doc.lines.forEach(function (l) { var r = Calc.line(l, doc.vat); s += r.supply; t += r.tax; });
    // 선금은 「선금 받기」를 켰을 때만 계산에 넣는다 (기본은 꺼짐)
    var total = s + t, dep = doc.depositOn ? (Number(doc.deposit) || 0) : 0;
    return { supply: s, tax: t, total: total, deposit: dep, balance: total - dep };
  },
  won: function (n) { return (Math.round(Number(n)) || 0).toLocaleString('ko-KR'); },
  num: function (n) { var v = Number(n) || 0; return v % 1 ? String(Math.round(v * 10) / 10) : v.toLocaleString('ko-KR'); },
  hangul: function (n) {
    n = Math.floor(Number(n) || 0);
    if (!n) return '영';
    var d = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    var u = ['', '십', '백', '천'], b = ['', '만', '억', '조'];
    var s = '', i = 0;
    while (n > 0) {
      var chunk = n % 10000; n = Math.floor(n / 10000);
      if (chunk) {
        var c = '';
        for (var j = 0; j < 4; j++) {
          var dig = chunk % 10; chunk = Math.floor(chunk / 10);
          if (dig) c = (dig === 1 && j > 0 ? '' : d[dig]) + u[j] + c;
        }
        s = c + b[i] + s;
      }
      i++;
    }
    return s;
  },
  date: function (iso) { var p = iso.split('-'); return p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일'; },
  md: function (iso) { var p = iso.split('-'); return (+p[1]) + '/' + (+p[2]); },
  addDays: function (iso, n) {
    var d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  parse: function (v) { var x = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(x) ? 0 : x; }
};

// 업체명처럼 2줄까지 쓰는 글자: 줄바꿈을 그대로 보여 준다
function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
