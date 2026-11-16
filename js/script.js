(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }
  // Each feature runs on its own, so one failure can't stop the others.
  function safe(fn) {
    try { fn(); } catch (err) { console.error('[portfolio]', err); }
  }

  var root, side, links = [];

  /* ---------- Theme toggle ---------- */
  function initTheme() {
    var btnDark = document.getElementById('btn-dark');
    var btnLight = document.getElementById('btn-light');
    if (!root || !btnDark || !btnLight) return;

    function setTheme(mode) {
      var dark = mode === 'dark';
      root.classList.toggle('dark', dark);
      root.classList.toggle('light', !dark);
      btnDark.classList.toggle('on', dark);
      btnLight.classList.toggle('on', !dark);
      btnDark.setAttribute('aria-pressed', String(dark));
      btnLight.setAttribute('aria-pressed', String(!dark));
      document.documentElement.style.background = dark ? '#06090B' : '#F6FAFA';
      document.body.style.background = dark ? '#06090B' : '#F6FAFA';
      try { localStorage.setItem('theme', mode); } catch (e) {}
    }

    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    setTheme(saved === 'light' ? 'light' : 'dark');
    btnDark.addEventListener('click', function () { setTheme('dark'); });
    btnLight.addEventListener('click', function () { setTheme('light'); });
  }

  /* ---------- Hamburger menu (mobile) ---------- */
  function initMenu() {
    var burger = document.getElementById('burger');
    if (!side || !burger) return;

    function setMenu(open) {
      side.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      setMenu(!side.classList.contains('open'));
    });
    links.forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('click', function (e) {
      if (side.classList.contains('open') && !side.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 800) setMenu(false);
    });
  }

  /* ---------- Active link follows scroll ---------- */
  function initScrollSpy() {
    if (!links.length) return;
    var sections = links.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    });

    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('on', on);
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    }
    setActive('home');
    links.forEach(function (a) {
      a.addEventListener('click', function () { setActive(a.getAttribute('href').slice(1)); });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      sections.forEach(function (s) { if (s) io.observe(s); });
    }
  }

  /* ---------- Back to top ---------- */
  function initToTop() {
    var toTop = document.getElementById('to-top');
    if (!toTop) return;
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      toTop.classList.toggle('show', y > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------- Scroll progress bar + hero parallax ---------- */
  function initScrollFx() {
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    root.appendChild(bar);
    var hero = document.querySelector('.hero-name');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset || 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      if (hero && !reduce && y < 900) hero.style.translate = '0 ' + (y * 0.16).toFixed(1) + 'px';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Reveal elements as they scroll into view ---------- */
  function initReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var els = qsa('.row-between,.hero-name,.tagline,.ctas,.scope,.facts>div,.head-row,.title,.head>.body,.portrait,.copy>*,.eyebrow.ic,.xp>div,.tile,.proj,.link,.mailrow,.sec>.lede,.endnote');
    var counts = new Map();
    els.forEach(function (el) {
      var i = counts.get(el.parentNode) || 0;
      counts.set(el.parentNode, i + 1);
      var d = el.classList.contains('tile') ? (i % 5) * 0.07 : Math.min(i, 5) * 0.09;
      el.style.setProperty('--d', d + 's');
      el.classList.add('rv');
    });
    root.classList.add('anim');

    function cleanup(el) {
      // hand control back to the element's normal styles and hover transitions
      el.classList.remove('rv', 'in');
      el.style.removeProperty('--d');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        el.classList.add('in');
        var done = false;
        function finish() { if (!done) { done = true; cleanup(el); } }
        el.addEventListener('transitionend', function (ev) {
          if (ev.target === el && ev.propertyName === 'transform') finish();
        });
        setTimeout(finish, 1800);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Cursor glow + 3D tilt (mouse devices only) ---------- */
  function initPointerFx() {
    if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    function track(el, tilt, strength) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty('--mx', x + 'px');
        el.style.setProperty('--my', y + 'px');
        if (tilt && !reduce) {
          el.style.setProperty('--ry', ((x / r.width - 0.5) * strength).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - y / r.height) * strength).toFixed(2) + 'deg');
        }
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    }
    qsa('.tile,.proj,.link').forEach(function (el) {
      el.classList.add('glow');
      track(el, el.classList.contains('tile'), 14);
    });
    var portrait = document.querySelector('.portrait');
    if (portrait && !reduce) { portrait.classList.add('tilt'); track(portrait, true, 10); }
  }

  /* ---------- Click the email to copy it ---------- */
  function initCopyMail() {
    var mail = document.querySelector('.mail');
    if (!mail) return;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    root.appendChild(toast);
    var timer;
    function say(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
    }
    function fallback() {
      var r = document.createRange();
      r.selectNodeContents(mail);
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      try { document.execCommand('copy'); say('Email copied'); } catch (e) { say('Press Ctrl+C to copy'); }
    }
    function copy() {
      var text = mail.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say('Email copied'); }, fallback);
      } else { fallback(); }
    }
    mail.setAttribute('role', 'button');
    mail.setAttribute('tabindex', '0');
    mail.setAttribute('title', 'Click to copy');
    mail.addEventListener('click', copy);
    mail.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); }
    });
  }

  ready(function () {
    root = document.querySelector('.pf');
    side = document.querySelector('.side');
    links = Array.prototype.slice.call(document.querySelectorAll('.nav-item'));
    safe(initTheme);
    safe(initScrollSpy);
    safe(initMenu);
    safe(initToTop);
    safe(initScrollFx);
    safe(initReveal);
    safe(initPointerFx);
    safe(initCopyMail);
    window.__pfReady = true;
  });
})();
