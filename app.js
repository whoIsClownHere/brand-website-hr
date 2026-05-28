/* =================================================================
   Ермакова — interactions & motion
   ================================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav solid on scroll + progress bar ---------- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('progress');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('solid', y > 40);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  function setMenu(open) {
    if (!nav || !menuToggle || !mobileMenu) return;
    nav.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if ('inert' in mobileMenu) mobileMenu.inert = !open;
    else if (open) mobileMenu.removeAttribute('inert');
    else mobileMenu.setAttribute('inert', '');
  }
  if (menuToggle && mobileMenu) {
    setMenu(false);
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('click', function (ev) {
      if (nav && nav.classList.contains('menu-open') && !nav.contains(ev.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 880) setMenu(false);
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal], .clip');
  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- count-up numbers ---------- */
  function formatNum(n) {
    return n >= 1000 ? n.toLocaleString('ru-RU').replace(/,/g, ' ') : String(n);
  }
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = formatNum(target) + suffix; return; }
    var dur = 1500, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.round(target * eased)) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = formatNum(target) + suffix;
    }
    requestAnimationFrame(tick);
  }
  var countEls = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { cio.observe(el); });
  } else {
    countEls.forEach(runCount);
  }

  /* ---------- hero word entrance ---------- */
  if (!reduce) {
    var words = document.querySelectorAll('.hero-name .word');
    words.forEach(function (w, i) {
      w.style.transform = 'translateY(115%)';
      w.style.transition = 'transform 1.05s cubic-bezier(.16,1,.3,1)';
      w.style.transitionDelay = (0.15 + i * 0.12) + 's';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        words.forEach(function (w) { w.style.transform = 'translateY(0)'; });
      });
    });
  }

  /* ---------- parallax (scroll-linked) ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function applyParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var r = el.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var offset = (center - vh / 2) * -speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
    ticking = false;
  }
  if (!reduce && parallaxEls.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', applyParallax);
    applyParallax();
  }

  /* ---------- marquee: continuous + scroll-velocity nudge ---------- */
  var track = document.getElementById('marquee');
  if (track && !reduce) {
    // duplicate content for seamless loop
    track.innerHTML += track.innerHTML;
    var pos = 0, base = 0.6, vel = 0, lastY = window.scrollY, half = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      vel = Math.min(Math.abs(y - lastY) * 0.35, 14);
      lastY = y;
    }, { passive: true });
    function loop() {
      pos -= (base + vel);
      vel *= 0.9;
      if (half && pos <= -half) pos += half;
      track.style.transform = 'translate3d(' + pos + 'px,0,0)';
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------- services route: fill line + activate nodes on scroll ---------- */
  var path = document.getElementById('path');
  var pathFill = document.getElementById('pathFill');
  if (path && pathFill) {
    var line = path.querySelector('.path-line');
    var stops = [].slice.call(path.querySelectorAll('.stop'));
    function updatePath() {
      var lr = line.getBoundingClientRect();
      var total = lr.height || 1;
      var vh = window.innerHeight;
      var prog = (vh * 0.58 - lr.top) / total;
      prog = Math.max(0, Math.min(1, prog));
      pathFill.style.height = (prog * 100).toFixed(2) + '%';
      var fillBottomY = lr.top + prog * total;
      stops.forEach(function (s) {
        var nr = s.querySelector('.stop-node').getBoundingClientRect();
        s.classList.toggle('active', (nr.top + nr.height / 2) <= fillBottomY + 2);
      });
    }
    window.addEventListener('scroll', updatePath, { passive: true });
    window.addEventListener('resize', updatePath);
    updatePath();
  }

  /* ---------- smooth anchor offset for fixed nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      var top = t.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
