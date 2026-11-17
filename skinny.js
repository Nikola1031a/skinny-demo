(function () {
  if (window.SK) return;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(pointer: fine)').matches;
  var SK = (window.SK = { RM: RM });
  document.documentElement.lang = 'sr-Latn';

  /* Intro loader — first visit only, homepage only */
  (function intro() {
    if (!document.querySelector('meta[name="sk-intro"]')) return;
    var seen = false;
    try { seen = sessionStorage.getItem('sk-intro') === '1'; sessionStorage.setItem('sk-intro', '1'); } catch (e) {}
    if (seen || RM) return;
    document.documentElement.style.setProperty('--sk-d', '1.05s');
    var o = document.createElement('div');
    o.setAttribute('aria-hidden', 'true');
    o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#FBF8F9;display:flex;align-items:center;justify-content:center;animation:skOut .35s ease .9s forwards';
    var w = document.createElement('div');
    w.style.cssText = "display:flex;font-family:'Archivo Black',Impact,sans-serif;font-size:clamp(48px,11vw,120px);line-height:1;color:#EE0293;letter-spacing:-.02em";
    'SKINNY'.split('').forEach(function (ch, i) {
      var m = document.createElement('span');
      m.style.cssText = 'display:inline-block;overflow:hidden;padding:.06em 0';
      var s = document.createElement('span');
      s.textContent = ch;
      s.style.cssText = 'display:inline-block;animation:skUp .5s cubic-bezier(.2,.8,.2,1) ' + (i * 0.06) + 's both';
      m.appendChild(s); w.appendChild(m);
    });
    var d = document.createElement('span');
    d.textContent = '.';
    d.style.cssText = 'display:inline-block;padding:.06em 0;transform-origin:50% 80%;animation:skDot .38s cubic-bezier(.3,1.6,.5,1) .46s both';
    w.appendChild(d); o.appendChild(w);
    (document.body || document.documentElement).appendChild(o);
    setTimeout(function () { o.remove(); }, 1400);
  })();

  /* Drifting rose petals on a canvas */
  SK.petals = function (canvas, opts) {
    if (!canvas || canvas._sk) return; canvas._sk = 1;
    opts = opts || {};
    var n = opts.count || 12, cols = opts.colors || ['#EE0293', '#F6C6DA', '#F79BC9', '#C8007B', '#FDEAF3'];
    var ctx = canvas.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), P = [], vis = true, raf;
    function size() { var r = canvas.parentNode.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function mk(init) { return { x: Math.random() * W - (init ? 0 : W * 0.3), y: init ? Math.random() * H : -30, s: 5 + Math.random() * 8, vx: 0.25 + Math.random() * 0.5, vy: 0.35 + Math.random() * 0.6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02, ph: Math.random() * 6.28, c: cols[(Math.random() * cols.length) | 0], a: 0.28 + Math.random() * 0.4 }; }
    function petal(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
      var s = p.s; ctx.beginPath(); ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 1.1, -s * 0.6, s * 0.7, s * 0.9, 0, s);
      ctx.bezierCurveTo(-s * 0.7, s * 0.9, -s * 1.1, -s * 0.6, 0, -s);
      ctx.fill(); ctx.restore();
    }
    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      P.forEach(function (p, i) {
        if (!RM) { p.ph += 0.012; p.x += p.vx + Math.sin(p.ph) * 0.35; p.y += p.vy; p.r += p.vr; if (p.y > H + 30 || p.x > W + 30) P[i] = mk(false); }
        petal(p);
      });
      if (!RM && vis) raf = requestAnimationFrame(frame);
    }
    size(); for (var i = 0; i < n; i++) P.push(mk(true)); frame();
    window.addEventListener('resize', function () { size(); if (RM) frame(); });
    if (!RM && 'IntersectionObserver' in window) new IntersectionObserver(function (e) { var v = e[0].isIntersecting; if (v && !vis) { vis = true; raf = requestAnimationFrame(frame); } else if (!v) { vis = false; cancelAnimationFrame(raf); } }).observe(canvas);
  };

  /* Scroll reveals (fade-up / clip wipe), auto-staggered */
  var io = null;
  function revealIO() {
    if (io) return io;
    io = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        var d = (el.dataset.delay ? parseFloat(el.dataset.delay) : 0) + (k++) * 0.09;
        el.style.transitionDelay = d + 's';
        if (el.dataset.reveal === 'clip') el.style.clipPath = 'inset(0 0 0 0)';
        else { el.style.opacity = '1'; el.style.transform = 'none'; }
        setTimeout(function () { ['transition', 'transitionDelay', 'transform', 'opacity', 'clipPath'].forEach(function (p) { el.style[p] = ''; }); }, (d + 1.3) * 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    return io;
  }
  SK.reveal = function (root) {
    if (RM || !('IntersectionObserver' in window)) return;
    (root || document).querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el._rv) return; el._rv = 1;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      if (el.dataset.reveal === 'clip') { el.style.clipPath = 'inset(100% 0 0 0)'; el.style.transition = 'clip-path 1.15s cubic-bezier(.7,0,.2,1)'; }
      else { el.style.opacity = '0'; el.style.transform = 'translateY(30px)'; el.style.transition = 'opacity .85s cubic-bezier(.2,.7,.2,1), transform .85s cubic-bezier(.2,.7,.2,1)'; }
      revealIO().observe(el);
    });
  };

  /* Count-up numbers: data-count="4.7" data-dec="1" */
  SK.counters = function (root) {
    var els = (root || document).querySelectorAll('[data-count]');
    function fmt(v, dec) { return dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v)); }
    els.forEach(function (el) {
      if (el._ct) return; el._ct = 1;
      var to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), from = parseFloat(el.dataset.from || '0');
      if (RM || !('IntersectionObserver' in window)) { el.textContent = fmt(to, dec); return; }
      el.textContent = fmt(from, dec);
      var ob = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return; ob.disconnect();
        var t0 = performance.now(), dur = 1700;
        (function step(t) { var p = Math.min(1, (t - t0) / dur), ez = 1 - Math.pow(1 - p, 4); el.textContent = fmt(from + (to - from) * ez, dec); if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: 0.6 });
      ob.observe(el);
    });
  };

  /* Magnetic CTA buttons (desktop only) */
  SK.magnetic = function (root) {
    if (RM || !FINE) return;
    (root || document).querySelectorAll('[data-magnetic]').forEach(function (el) {
      if (el._mg) return; el._mg = 1;
      el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; el.style.transition = 'transform .15s'; el.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.32 + 'px)'; });
      el.addEventListener('mouseleave', function () { el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; });
    });
  };

  /* Gentle parallax: data-parallax="0.08" */
  var plx = [], ticking = false;
  function runPlx() { ticking = false; var vh = window.innerHeight; plx.forEach(function (el) { var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; var c = r.top + r.height / 2 - vh / 2; el.style.transform = 'translate3d(0,' + (-c * parseFloat(el.dataset.parallax)).toFixed(1) + 'px,0)'; }); }
  SK.parallax = function (root) {
    if (RM) return;
    (root || document).querySelectorAll('[data-parallax]').forEach(function (el) { if (el._px) return; el._px = 1; plx.push(el); });
    if (!SK._plxBound) { SK._plxBound = 1; window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(runPlx); } }, { passive: true }); }
    runPlx();
  };

  SK.init = function (root) { SK.reveal(root); SK.counters(root); SK.magnetic(root); SK.parallax(root); };
  SK.ready = function (fn) { fn(SK); };
})();
