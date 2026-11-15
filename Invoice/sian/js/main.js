// 시작: 주소에 frame=1 이 있으면 프로그램 화면(시안) 하나만, 없으면 시안 보는 첫 화면
function fitAll() {
  document.querySelectorAll('.fit').forEach(function (el) {
    var inner = el.firstElementChild; if (!inner) return;
    var w = +el.dataset.w, max = +(el.dataset.max || 1);
    var avail = el.parentElement.clientWidth || w;
    var s = Math.min(max, avail / w);
    var h = el.dataset.h === 'auto' ? inner.scrollHeight : +el.dataset.h;
    inner.style.transform = 'scale(' + s + ')';
    el.style.width = Math.floor(w * s) + 'px';
    el.style.height = Math.ceil(h * s) + 'px';
  });
}

function boot() {
  var q = new URLSearchParams(location.search);
  var root = document.getElementById('root');
  var resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(fitAll, 80); });

  if (q.get('frame')) {
    var theme = /^[abc]$/.test(q.get('t')) ? q.get('t') : 'a';
    var page = q.get('page') || 'home';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = 'in-app';
    root.innerHTML = renderApp({ theme: theme, page: page === 'lock' ? 'home' : page, step: Math.min(3, Math.max(1, +(q.get('step') || 1))), kind: TYPES[q.get('kind')] ? q.get('kind') : 'quote' });
    bindApp(root);
    if (page === 'lock') openLock();
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    return;
  }

  document.body.className = 'in-hub';
  var last = '';
  var go = function () {
    var route = (location.hash || '#a/pc-home').slice(1);
    root.innerHTML = renderHub(route);
    var themeNow = route.charAt(0);
    if (themeNow !== last.charAt(0) || route === 'overview') window.scrollTo(0, 0);
    last = route;
    fitAll();
    setTimeout(fitAll, 300);
  };
  window.addEventListener('hashchange', go);
  go();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
