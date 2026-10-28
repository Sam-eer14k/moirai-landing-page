/* MoirAI Cloud landing page. Plain JS, no dependencies. One module per section. */

/* =====================================================================
   CALCULATOR ASSUMPTIONS: edit these, nothing else in the file.
   Every value marked [CONFIRM] needs MoirAI's sign-off before launch.
   ===================================================================== */
var CALC = {
  DENSITY_GAIN_DEFAULT: 30,           // % more workloads per server with Synaptik Cell. [CONFIRM: typical density gain]
  HARDWARE_PER_SERVER_PER_YEAR: 2500, // USD, amortized hardware cost of one server per year. [CONFIRM: amortized hardware cost]
  LICENSING_SHARE_REMOVED: 1.0,       // Share of per-server virtualization licensing removed after moving (1.0 = all). [CONFIRM: share removed]
  YEARS: 3,                           // Horizon for the total.
  RACK_MAX_ICONS: 60                  // The rack graphic never draws more icons than this; each icon then stands for several servers.
};

(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  // One broken module must not take the rest of the page down with it.
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[moirai] ' + name, e); } }
  /* Shared scroll scheduler: one passive listener, all scroll-driven work batched into one
     requestAnimationFrame. A timer backs rAF up in background tabs and embedded frames, where
     rAF pauses. `jumping` is true for a moment while back-to-top jumps, so the header and the
     button itself don't react to that frame. */
  var jumping = false;
  var scrollFns = [], queued = false, fallback = null;
  function runScroll() {
    if (!queued) return;
    queued = false;
    clearTimeout(fallback);
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i]();
  }
  function requestScrollWork() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(runScroll);
    fallback = setTimeout(runScroll, 120);
  }
  window.addEventListener('scroll', requestScrollWork, { passive: true });
  window.addEventListener('resize', requestScrollWork, { passive: true });
  function onScroll(fn) { scrollFns.push(fn); fn(); }
  function jumpTo(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var num = new Intl.NumberFormat('en-US');

  /* ================= [CONFIRM] markers: make placeholders impossible to miss ================= */
  safe('confirm', function () {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return /\[CONFIRM/.test(n.nodeValue) && !n.parentNode.closest('script, style, textarea, option, .confirm') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      n.nodeValue.split(/(\[CONFIRM[^\]]*\])/).forEach(function (part) {
        if (!part) return;
        if (/^\[CONFIRM/.test(part)) { var m = document.createElement('mark'); m.className = 'confirm'; m.textContent = part; frag.appendChild(m); }
        else frag.appendChild(document.createTextNode(part));
      });
      n.parentNode.replaceChild(frag, n);
    });
  });

  /* ================= header: compact state, progress line, current link ================= */
  safe('header', function () {
    var hd = $('#hd');
    var bar = $('.hd__progress span');
    var links = $$('.nav__link[href^="#"]');
    var targets = links.map(function (a) { return $(a.getAttribute('href')); });
    onScroll(function () {
      if (jumping) return;
      var y = window.scrollY;
      hd.classList.toggle('is-compact', y > 24);
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      var line = window.innerHeight * 0.35, cur = -1;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('is-current', i === cur); });
    });
  });

  /* ================= mega menus ================= */
  safe('mega', function () {
    var items = $$('.nav__item.has-mega');
    function set(item, open) {
      item.classList.toggle('is-open', open);
      $('button', item).setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function closeAll(except) { items.forEach(function (it) { if (it !== except) set(it, false); }); }
    items.forEach(function (item) {
      var btn = $('button', item), timer;
      btn.addEventListener('click', function () { var open = !item.classList.contains('is-open'); closeAll(item); set(item, open); if (open) $('.mega a', item).focus(); });
      if (fine) {
        item.addEventListener('mouseenter', function () { clearTimeout(timer); closeAll(item); set(item, true); });
        item.addEventListener('mouseleave', function () { timer = setTimeout(function () { set(item, false); }, 160); });
      }
      item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) set(item, false); });
      item.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(item, false); btn.focus(); } });
      $$('.mega a', item).forEach(function (a) { a.addEventListener('click', function () { set(item, false); }); });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.has-mega')) closeAll(); });
  });

  /* ================= full-screen numbered menu ================= */
  safe('overlay', function () {
    var ovl = $('#ovl');
    var openers = $$('[data-ovl-open]');
    var last = null;
    $$('.ovl__nav li', ovl).forEach(function (li, i) { li.style.setProperty('--i', i); });
    function focusables() { return $$('a[href], button', ovl).filter(function (el) { return el.offsetParent !== null; }); }
    function onKey(e) {
      if (e.key === 'Escape') { close(true); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(), first = f[0], end = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
      else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
    }
    function open() {
      last = document.activeElement;
      ovl.hidden = false;
      document.body.style.overflow = 'hidden';
      openers.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
      requestAnimationFrame(function () { requestAnimationFrame(function () { ovl.classList.add('is-open'); }); });
      setTimeout(function () { ovl.classList.add('is-open'); }, 30);
      $('.ovl__close', ovl).focus({ preventScroll: true });
      document.addEventListener('keydown', onKey);
    }
    function close(restore) {
      ovl.classList.remove('is-open');
      document.body.style.overflow = '';
      openers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { ovl.hidden = true; }, reduce ? 0 : 350);
      if (restore && last) last.focus({ preventScroll: true });
    }
    openers.forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-ovl-close]', ovl).forEach(function (b) { b.addEventListener('click', function () { close(true); }); });
    // Section links close without pulling focus back, so the jump still lands.
    $$('a[href^="#"]', ovl).forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
  });

  /* ================= hero video: pause button, reduced motion, off-screen ================= */
  safe('video', function () {
    var v = $('.hero__video');
    var btn = $('[data-video-toggle]');
    var userPaused = reduce;
    function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function sync() {
      btn.classList.toggle('is-paused', userPaused);
      btn.setAttribute('aria-label', userPaused ? 'Play background video' : 'Pause background video');
    }
    v.muted = true;
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
    btn.addEventListener('click', function () { userPaused = !userPaused; if (userPaused) v.pause(); else play(); sync(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (userPaused) return; if (e.isIntersecting) play(); else v.pause(); });
      }, { threshold: 0.05 }).observe(v);
    }
    sync();
  });

  /* ================= hero operating map ================= */
  safe('map', function () {
    var info = {
      ai: ['AI layer', 'Reads the shared state, logs and metrics, traces an issue to a likely cause and suggests a fix for your team to approve.'],
      compute: ['Compute', 'Provision, manage and migrate workloads across the servers you run.'],
      network: ['Networking', 'Connectivity, segmentation and network policy, managed next to compute.'],
      storage: ['Storage', 'Provisioning, health and capacity, tied into the same console.'],
      monitor: ['Monitoring', 'Health, metrics, logs and usage in one view.'],
      access: ['Access & policy', 'Role-based access, audit trails and policy controls across the platform.']
    };
    var k = $('[data-map-k]'), t = $('[data-map-t]');
    var nodes = $$('.map__node');
    function select(id) {
      nodes.forEach(function (n) { n.classList.toggle('is-on', n.getAttribute('data-node') === id); n.setAttribute('aria-pressed', n.getAttribute('data-node') === id ? 'true' : 'false'); });
      $$('.map__lines path').forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-line') === id); });
      k.textContent = info[id][0];
      t.textContent = info[id][1];
    }
    nodes.forEach(function (n) {
      var id = n.getAttribute('data-node');
      n.setAttribute('aria-pressed', 'false');
      n.addEventListener('mouseenter', function () { select(id); });
      n.addEventListener('focus', function () { select(id); });
      n.addEventListener('click', function () { select(id); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); } });
    });
  });

  /* ================= custom cursor (fine pointers, motion allowed) ================= */
  safe('cursor', function () {
    if (!fine || reduce) return;
    var c = $('.cursor'), label = $('.cursor__label', c);
    doc.classList.add('has-cursor');
    var x = -100, y = -100, cx = -100, cy = -100, shown = false;
    var hoverSel = 'a, button, [role="button"], [role="tab"], [role="radio"], .tile, .stat, .env, .person__card, .vs__table tbody tr, label, input[type="range"], summary';
    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!shown) { cx = x; cy = y; shown = true; c.classList.remove('is-gone'); }
      var el = e.target;
      var text = el.closest && el.closest('input:not([type="range"]):not([type="radio"]), textarea, select');
      var lab = el.closest && el.closest('[data-cursor]');
      var hov = el.closest && el.closest(hoverSel);
      c.classList.toggle('is-text', !!text);
      c.classList.toggle('is-label', !!lab && !text);
      c.classList.toggle('is-hover', !!hov && !lab && !text);
      label.textContent = lab ? lab.getAttribute('data-cursor') : '';
    }, { passive: true });
    document.addEventListener('mouseleave', function () { c.classList.add('is-gone'); shown = false; });
    (function loop() {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  });

  /* ================= magnetic buttons + card spotlight ================= */
  safe('magnet', function () {
    if (!fine || reduce) return;
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  });
  safe('spot', function () {
    if (!fine) return;
    $$('.spot, .tile, .env, .post > a').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  });

  /* ================= scroll reveal (fails safe) =================
     Nothing hides until this runs, and every check reveals everything at or
     above the trigger line, so anchor jumps and reloads never strand content. */
  var revealHooks = [];
  safe('reveal', function () {
    var items = $$('.rv');
    // Stagger siblings that reveal together.
    items.forEach(function (el) {
      var sibs = $$(':scope > .rv', el.parentNode);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 5) * 0.08 + 's');
    });
    if (reduce) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    doc.classList.add('rv-on');
    function check() {
      var line = window.innerHeight * 0.9;
      items = items.filter(function (el) {
        if (el.getBoundingClientRect().top < line) {
          el.classList.add('is-in');
          revealHooks.forEach(function (h) { h(el); });
          return false;
        }
        return true;
      });
    }
    onScroll(check);
    window.addEventListener('hashchange', function () { setTimeout(check, 60); });
    setTimeout(check, 300);
  });
  function whenRevealed(el, fn) {
    if (!el) return;
    if (reduce || !doc.classList.contains('rv-on')) { fn(); return; }
    var done = false;
    revealHooks.push(function (x) { if (!done && (x === el || x.contains(el) || el.contains(x))) { done = true; fn(); } });
  }

  /* ================= bento: AI console sequence ================= */
  safe('console', function () {
    var box = $('[data-console]');
    if (reduce) return;
    var lines = $$('.cl', box);
    box.classList.add('is-anim');
    var timers = [];
    function run() {
      timers.forEach(clearTimeout); timers = [];
      lines.forEach(function (l) { l.classList.remove('is-show'); });
      lines.forEach(function (l, i) { timers.push(setTimeout(function () { l.classList.add('is-show'); }, 400 + i * 1100)); });
      timers.push(setTimeout(run, 400 + lines.length * 1100 + 4200));
    }
    var started = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; run(); }
          else if (!e.isIntersecting && started) { started = false; timers.forEach(clearTimeout); lines.forEach(function (l) { l.classList.add('is-show'); }); }
        });
      }, { threshold: 0.3 }).observe(box);
    } else { lines.forEach(function (l) { l.classList.add('is-show'); }); }
  });

  /* ================= about: before / after ================= */
  safe('beforeafter', function () {
    var ba = $('[data-ba]');
    var cap = $('[data-ba-cap]');
    var caps = { before: 'Four tools, four logins and four versions of the truth.', after: 'One console, one shared view of state.' };
    $$('[data-ba-set]', ba).forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-ba-set');
        ba.setAttribute('data-state', s);
        $$('[data-ba-set]', ba).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cap.textContent = caps[s];
      });
    });
  });

  /* ================= generic tabs (explorer, roadmap) with arrow keys ================= */
  function tabs(list, opts) {
    var btns = $$('[role="tab"]', list);
    function select(b, focus) {
      btns.forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) b.focus();
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      if (opts && opts.hover && fine) b.addEventListener('mouseenter', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var keys = opts && opts.vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
        var j = null;
        if (e.key === keys[1] || (opts && opts.vertical && e.key === 'ArrowRight')) j = (i + 1) % btns.length;
        else if (e.key === keys[0] || (opts && opts.vertical && e.key === 'ArrowLeft')) j = (i - 1 + btns.length) % btns.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = btns.length - 1;
        if (j !== null) { e.preventDefault(); select(btns[j], true); }
      });
    });
    return { select: select, btns: btns };
  }
  var explorer = null;
  safe('explorer', function () {
    explorer = tabs($('.xp__list'), { vertical: true });
    // Bento module pills open the matching tab.
    $$('[data-explore]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = $('.xp__tab[data-tab="' + b.getAttribute('data-explore') + '"]');
        if (t) { explorer.select(t); jumpTo($('#platform')); setTimeout(function () { t.focus({ preventScroll: true }); }, reduce ? 0 : 700); }
      });
    });
  });

  /* ================= why: sticky diagram follows the reasons ================= */
  safe('why', function () {
    var arch = $('[data-arch]');
    var steps = $$('.step');
    onScroll(function () {
      var mid = window.innerHeight * 0.5, best = steps[0];
      steps.forEach(function (s) { if (s.getBoundingClientRect().top < mid) best = s; });
      steps.forEach(function (s) { s.classList.toggle('is-active', s === best); });
      arch.setAttribute('data-active', best.getAttribute('data-step'));
    });
  });

  /* Centre of el in root's coordinates. Uses offsets, so transforms (reveals, hover lifts) don't skew it. */
  function centreIn(el, root) {
    var x = 0, y = 0, n = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
  }
  /* Lays a bar of thickness t from point a to b. Horizontal or vertical only; anything else is hidden. */
  function placeBar(el, a, b, t) {
    var dx = b.x - a.x, dy = b.y - a.y, s = el.style;
    if (Math.abs(dy) < 2 && Math.abs(dx) >= 2) {
      el.setAttribute('data-axis', 'x'); s.display = '';
      s.left = Math.min(a.x, b.x) + 'px'; s.top = (a.y - t / 2) + 'px'; s.width = Math.abs(dx) + 'px'; s.height = t + 'px';
    } else if (Math.abs(dx) < 2 && Math.abs(dy) >= 2) {
      el.setAttribute('data-axis', 'y'); s.display = '';
      s.left = (a.x - t / 2) + 'px'; s.top = Math.min(a.y, b.y) + 'px'; s.width = t + 'px'; s.height = Math.abs(dy) + 'px';
    } else { s.display = 'none'; }
  }

  /* ================= roadmap: track, stages, sliding indicator, crossfade, parallax ================= */
  safe('roadmap', function () {
    var tl = $('[data-tl]');
    var stages = $$('.tl__stage', tl);
    var dots = stages.map(function (s) { return $('.tl__dot', s); });
    var rail = $('.tl__seg--rail', tl), live = $('.tl__seg--live', tl), dev = $('.tl__seg--dev', tl);
    var ind = $('.tl__ind', tl);
    var cur = 0;

    // Track: grey rail from 01 to 05; solid cyan from 01 to halfway; dashed amber from there to exactly the centre of 02.
    function layout() {
      var c = dots.map(function (d) { return centreIn(d, tl); });
      var mid = { x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2 };
      placeBar(rail, c[0], c[4], 4);
      placeBar(live, c[0], mid, 4);
      placeBar(dev, mid, c[1], 4);
      moveInd();
    }
    function moveInd() {
      var s = stages[cur];
      ind.style.setProperty('--ix', (s.offsetLeft + s.offsetWidth / 2 - ind.offsetWidth / 2) + 'px');
      ind.setAttribute('data-status', s.getAttribute('data-status'));
    }
    function select(i, focus) {
      cur = i;
      stages.forEach(function (s, j) {
        var on = j === i;
        s.setAttribute('aria-selected', on ? 'true' : 'false');
        s.tabIndex = on ? 0 : -1;
        document.getElementById(s.getAttribute('aria-controls')).classList.toggle('is-active', on);
      });
      moveInd();
      if (focus) stages[i].focus();
    }
    stages.forEach(function (s, i) {
      s.addEventListener('click', function () { select(i); });
      if (fine) s.addEventListener('mouseenter', function () { select(i); });
      s.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % stages.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + stages.length) % stages.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = stages.length - 1;
        if (j !== null) { e.preventDefault(); select(j, true); }
      });
    });
    layout();
    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    setTimeout(layout, 500);

    // Slow parallax on the watermark, capped so the word never leaves the section.
    var bg = $('[data-parallax]');
    if (reduce || !bg) return;
    var sec = $('#roadmap');
    onScroll(function () {
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var py = Math.max(-28, Math.min(28, (r.top - window.innerHeight / 2) * -0.05));
      bg.style.setProperty('--py', py.toFixed(1) + 'px');
    });
  });

  /* ================= environments: hover/tap to expand ================= */
  safe('envs', function () {
    var envs = $$('[data-env]');
    function open(env) {
      envs.forEach(function (e) {
        var on = e === env;
        e.classList.toggle('is-open', on);
        $('.env__tab', e).setAttribute('aria-expanded', on ? 'true' : 'false');
        $('.env__body', e).hidden = !on;
      });
    }
    envs.forEach(function (env, i) {
      var tab = $('.env__tab', env);
      tab.addEventListener('click', function () { open(env); });
      if (fine) env.addEventListener('mouseenter', function () { open(env); });
      tab.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % envs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + envs.length) % envs.length;
        if (j !== null) { e.preventDefault(); open(envs[j]); $('.env__tab', envs[j]).focus(); }
      });
    });
  });

  /* ================= starting points: radiogroup ================= */
  safe('pick', function () {
    var opts = $$('[data-pick]');
    function choose(o, focus) {
      opts.forEach(function (x) { var on = x === o; x.setAttribute('aria-checked', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
      $$('[data-plan]').forEach(function (p) { p.hidden = p.getAttribute('data-plan') !== o.getAttribute('data-pick'); });
      if (focus) o.focus();
    }
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { choose(o); });
      o.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % opts.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + opts.length) % opts.length;
        if (j !== null) { e.preventDefault(); choose(opts[j], true); }
      });
    });
  });

  /* ================= VMware table: row takeaways ================= */
  safe('vs', function () {
    var k = $('[data-take-k]'), t = $('[data-take-t]');
    var rows = $$('.vs__table tbody tr');
    function show(r) {
      rows.forEach(function (x) { x.classList.toggle('is-on', x === r); });
      k.textContent = $('th', r).textContent;
      t.textContent = r.getAttribute('data-take');
    }
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { show(r); });
      r.addEventListener('focus', function () { show(r); });
      r.addEventListener('click', function () { show(r); });
    });
  });

  /* ================= calculator ================= */
  var calcState = null;
  safe('calculator', function () {
    var form = $('[data-calc]');
    var inputs = {};
    $$('[data-in]', form).forEach(function (i) { inputs[i.getAttribute('data-in')] = i; });
    inputs.gain.value = CALC.DENSITY_GAIN_DEFAULT;
    var outs = {};
    $$('[data-out]', form).forEach(function (o) { outs[o.getAttribute('data-out')] = o; });
    var kpi = {};
    $$('[data-kpi]').forEach(function (k) { kpi[k.getAttribute('data-kpi')] = { el: k, cur: 0 }; });
    var rowB = $('[data-rack="before"]'), rowA = $('[data-rack="after"]');
    var fmt = { servers: num.format, vms: num.format, lic: money.format, pwr: money.format, gain: function (v) { return v + '%'; } };

    function tween(key, to, isMoney) {
      var k = kpi[key];
      var from = k.cur, start = null, dur = reduce ? 0 : 450;
      k.cur = to;
      var show = function (v) { k.el.textContent = isMoney ? money.format(Math.round(v)) : num.format(Math.round(v)); };
      if (!dur) { show(to); return; }
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);
        show(from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      setTimeout(function () { show(to); }, dur + 80); // backup when rAF is throttled
    }
    function rack(row, total, on, per) {
      var n = Math.ceil(total / per), lit = Math.ceil(on / per);
      if (row.children.length !== n) row.innerHTML = new Array(n + 1).join('<i></i>');
      $$('i', row).forEach(function (el, idx) { el.classList.toggle('is-off', idx >= lit); });
    }
    function calc() {
      var v = {};
      Object.keys(inputs).forEach(function (key) {
        var i = inputs[key];
        v[key] = +i.value;
        outs[key].textContent = fmt[key](v[key]);
        i.style.setProperty('--fill', ((i.value - i.min) / (i.max - i.min) * 100) + '%');
      });
      var after = Math.ceil(v.servers / (1 + v.gain / 100));
      var retire = v.servers - after;
      var hw = retire * (v.pwr + CALC.HARDWARE_PER_SERVER_PER_YEAR);
      var lic = v.servers * v.lic * CALC.LICENSING_SHARE_REMOVED;
      var total = (hw + lic) * CALC.YEARS;
      tween('retire', retire); tween('hw', hw, true); tween('lic', lic, true); tween('total', total, true);
      var per = Math.max(1, Math.ceil(v.servers / CALC.RACK_MAX_ICONS));
      rack(rowB, v.servers, v.servers, per);
      rack(rowA, v.servers, after, per);
      $('[data-rack-before]').textContent = num.format(v.servers) + ' servers' + (per > 1 ? ' (1 block = ' + per + ')' : '');
      $('[data-rack-after]').textContent = num.format(after) + ' servers';
      calcState = { v: v, after: after, retire: retire, hw: hw, lic: lic, total: total };
    }
    form.addEventListener('input', calc);
    calc();
  });

  /* ================= readiness self-check ================= */
  var quizState = { score: 0, answered: 0, gaps: [] };
  safe('quiz', function () {
    var quiz = $('[data-quiz]');
    var bands = [
      [0, 2, 'Early days', 'Start with a workload inventory and your renewal date. Everything else depends on those two.'],
      [3, 4, 'Good footing', 'Close the gaps you answered "no" to before you set a migration date.'],
      [5, 6, 'Ready to plan a pilot', 'A phased move is the sensible next step. A pilot on your own hardware will show what to expect.']
    ];
    var ring = $('.score__bar').parentNode;
    function update() {
      var score = 0, answered = 0, gaps = [];
      $$('li', quiz).forEach(function (li) {
        var c = $('input:checked', li);
        if (c) { answered++; if (c.value === '1') score++; else gaps.push($('legend', li).textContent); }
      });
      quizState = { score: score, answered: answered, gaps: gaps };
      $('[data-score]').textContent = score;
      ring.style.setProperty('--s', 100 - (score / 6) * 100);
      if (!answered) { $('[data-score-h]').textContent = 'Answer the questions to see where you stand.'; $('[data-score-t]').textContent = ''; return; }
      var b = bands.filter(function (x) { return score >= x[0] && score <= x[1]; })[0];
      $('[data-score-h]').textContent = b[2] + (answered < 6 ? ' so far' : '');
      $('[data-score-t]').textContent = b[3];
    }
    quiz.addEventListener('change', update);
    $('[data-quiz-reset]').addEventListener('click', function () { $$('input', quiz).forEach(function (i) { i.checked = false; }); update(); $('input', quiz).focus(); });
    update();
  });

  /* ================= Synaptik Cell: play each stat animation once on reveal ================= */
  safe('cell', function () {
    $$('.stat').forEach(function (s) {
      whenRevealed(s, function () {
        if (reduce) return;
        setTimeout(function () { s.classList.add('is-play'); }, 500);
        setTimeout(function () { s.classList.remove('is-play'); }, 2900);
      });
    });
  });

  /* ================= rollout: connector through circle centres, draws on scroll ================= */
  safe('rollout', function () {
    var wrap = $('[data-steps]');
    var steps = $$('.rs', wrap);
    var circles = steps.map(function (s) { return $('.rs__n', s); });
    var segs = $$('.steps__seg', wrap);
    function layout() {
      var c = circles.map(function (n) { return centreIn(n, wrap); });
      segs.forEach(function (s, i) { placeBar(s, c[i], c[i + 1], 2); });
    }
    // 0 when the steps enter the lower part of the screen, 1 once they reach the upper third.
    function draw() {
      var p = 1;
      if (!reduce) {
        var r = wrap.getBoundingClientRect(), vh = window.innerHeight;
        p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.5)));
      }
      var total = p * segs.length;
      segs.forEach(function (s, i) { s.style.setProperty('--d', Math.max(0, Math.min(1, total - i)).toFixed(3)); });
      steps.forEach(function (st, k) { st.classList.toggle('is-reached', p > 0.02 && total >= k - 0.001); });
    }
    // Hovering a step lights the segment leading up to it.
    steps.forEach(function (st, k) {
      if (!k) return;
      st.addEventListener('mouseenter', function () { segs[k - 1].classList.add('is-hot'); });
      st.addEventListener('mouseleave', function () { segs[k - 1].classList.remove('is-hot'); });
    });
    layout();
    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    onScroll(draw);
  });

  /* ================= contact form, prefill, copy email ================= */
  var formApi = { prefill: function () {} };
  safe('form', function () {
    var form = $('#contact-form');
    var done = $('#form-done');
    var mode = form.getAttribute('data-mode');
    var msg = $('#f-message');
    var rules = {
      name: function (v) { return v.length >= 2 ? '' : 'Add your name so we know who to reply to.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'That email doesn\'t look right. Try something like jane@company.com.'; },
      message: function (v) { return v.length >= 10 ? '' : 'Tell us a little more. One or two sentences is plenty.'; }
    };
    function check(name) {
      var el = form.elements[name], m = rules[name](el.value.trim()), wrap = el.closest('.fl');
      wrap.classList.toggle('is-bad', !!m);
      wrap.classList.toggle('is-ok', !m && !!el.value.trim());
      el.setAttribute('aria-invalid', m ? 'true' : 'false');
      $('#e-' + name).textContent = m;
      return !m;
    }
    Object.keys(rules).forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener('blur', function () { if (el.value.trim() || el.closest('.fl').classList.contains('is-bad')) check(n); });
      el.addEventListener('input', function () { if (el.closest('.fl').classList.contains('is-bad')) check(n); });
    });
    var lastPrefill = '';
    formApi.prefill = function (text) {
      if (!msg.value.trim() || msg.value === lastPrefill) { msg.value = text; lastPrefill = text; }
    };
    form.addEventListener('submit', function (e) {
      var bad = Object.keys(rules).filter(function (n) { return !check(n); });
      if (bad.length) { e.preventDefault(); form.elements[bad[0]].focus(); return; }
      if (form.elements.website && form.elements.website.value) { e.preventDefault(); return; }
      var btn = $('[type="submit"]', form);
      if (mode === 'wp') { btn.disabled = true; $('span', btn).textContent = 'Sending…'; return; }
      e.preventDefault();
      var v = function (n) { return (form.elements[n].value || '').trim(); };
      var body = ['Name: ' + v('name'), 'Email: ' + v('email'), 'Company: ' + (v('company') || 'Not given'), 'Environment: ' + (v('environment') || 'Not given'), '', v('message')].join('\n');
      var to = (form.getAttribute('action') || '').replace(/^mailto:/, '');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Synaptix enquiry from ' + v('name') + (v('company') ? ', ' + v('company') : '')) + '&body=' + encodeURIComponent(body);
      $('#form-done-title').textContent = 'Thanks, ' + v('name').split(' ')[0] + '.';
      $('#form-done-text').textContent = 'Your email app should open with your message filled in. Press send there and the MoirAI team will reply. If nothing opened, write to ' + to + '.';
      form.hidden = true; done.hidden = false; done.focus();
    });
    $('[data-form-reset]').addEventListener('click', function () { done.hidden = true; form.hidden = false; $('#f-name').focus(); });
    var status = $('#form-status');
    if (status && status.textContent.trim()) { status.setAttribute('tabindex', '-1'); setTimeout(function () { status.focus(); }, 300); }

    // CTAs that carry context into the message box.
    $$('[data-prefill]').forEach(function (a) { a.addEventListener('click', function () { formApi.prefill(a.getAttribute('data-prefill')); }); });
    var calcCta = $('[data-calc-cta]');
    if (calcCta) calcCta.addEventListener('click', function () {
      if (!calcState) return;
      var s = calcState, v = s.v;
      formApi.prefill([
        'I used the Synaptik Cell calculator and would like a real number for our environment.',
        'Physical servers today: ' + v.servers,
        'Average workloads per server: ' + v.vms,
        'Licensing per server per year: ' + money.format(v.lic),
        'Power and cooling per server per year: ' + money.format(v.pwr),
        'Density gain assumed: ' + v.gain + '%',
        'Estimate shown: ' + s.retire + ' servers retired, ' + money.format(s.total) + ' over ' + CALC.YEARS + ' years.'
      ].join('\n'));
      $('#f-env').value = $('#f-env').value || '';
    });
    var quizCta = $('[data-quiz-cta]');
    if (quizCta) quizCta.addEventListener('click', function () {
      if (!quizState.answered) return;
      formApi.prefill('I took the VMware readiness check and scored ' + quizState.score + ' of 6.' + (quizState.gaps.length ? '\nGaps: ' + quizState.gaps.join(' / ') : '') + '\nI would like to talk through a migration plan.');
    });
    $$('a[href="#contact"]').forEach(function (a) {
      a.addEventListener('click', function () { setTimeout(function () { if (!form.hidden) $('#f-name').focus({ preventScroll: true }); }, reduce ? 0 : 800); });
    });
  });
  safe('copy', function () {
    var toast = $('[data-toast]'), timer;
    function say(t) { toast.textContent = t; toast.classList.add('is-on'); clearTimeout(timer); timer = setTimeout(function () { toast.classList.remove('is-on'); }, 2400); }
    $$('[data-copy]').forEach(function (b) {
      var label = $('[data-copy-label]', b);
      b.addEventListener('click', function () {
        var text = b.getAttribute('data-copy');
        var ok = function () { label.textContent = 'Copied'; say('Copied ' + text); setTimeout(function () { label.textContent = 'Copy'; }, 2400); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { window.location.href = 'mailto:' + text; });
        else window.location.href = 'mailto:' + text;
      });
    });
  });

  /* ================= team: tap to reveal bio on touch ================= */
  safe('team', function () {
    $$('.person__card').forEach(function (card) {
      card.addEventListener('click', function (e) { if (!e.target.closest('a')) card.classList.toggle('is-open'); });
      card.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); card.classList.toggle('is-open'); } });
    });
  });

  /* ================= FAQ: accordion + live search ================= */
  safe('faq', function () {
    var list = $('[data-faq]');
    var items = $$('.qa', list);
    items.forEach(function (qa) {
      var b = $('button', qa), a = $('.qa__a', qa);
      b.addEventListener('click', function () { var open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', open ? 'true' : 'false'); a.hidden = !open; });
    });
    var q = $('[data-faq-q]'), count = $('[data-faq-count]'), empty = $('[data-faq-empty]');
    q.addEventListener('input', function () {
      var term = q.value.trim().toLowerCase(), shown = 0;
      items.forEach(function (qa) {
        var hit = !term || qa.textContent.toLowerCase().indexOf(term) !== -1;
        qa.hidden = !hit;
        if (hit) shown++;
      });
      empty.hidden = shown > 0;
      count.textContent = term ? shown + ' of ' + items.length + ' questions' : items.length + ' questions';
    });
  });

  /* ================= insights: drag to scroll ================= */
  safe('drag', function () {
    var el = $('[data-drag]');
    var down = false, moved = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return; // touch scrolls natively
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; el.classList.add('is-dragging'); }
      el.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () { down = false; setTimeout(function () { el.classList.remove('is-dragging'); }, 0); });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    el.addEventListener('keydown', function (e) {
      if (e.target !== el) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); el.scrollBy({ left: 320, behavior: reduce ? 'auto' : 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); el.scrollBy({ left: -320, behavior: reduce ? 'auto' : 'smooth' }); }
    });
  });

  /* ================= closing CTA: node network on canvas ================= */
  safe('net', function () {
    var cv = $('[data-net]');
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pts = [], W = 0, H = 0, running = false;
    function size() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(60, W * H / 14000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 16000) { ctx.strokeStyle = 'rgba(82,208,226,' + (0.22 * (1 - d / 16000)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
      }
      ctx.fillStyle = 'rgba(82,208,226,0.75)';
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.283); ctx.fill(); });
    }
    function tick() {
      if (!running) return;
      pts.forEach(function (p) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; });
      draw();
      requestAnimationFrame(tick);
    }
    size(); draw();
    window.addEventListener('resize', function () { size(); draw(); });
    if (reduce || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { var was = running; running = e.isIntersecting; if (running && !was) tick(); });
    }).observe(cv);
  });

  /* ================= back to top: appears after the hero, one instant jump ================= */
  safe('totop', function () {
    var btn = $('[data-totop]');
    var hero = $('#top');
    var hd = $('#hd');
    var bar = $('.hd__progress span');
    var main = $('#main');
    onScroll(function () {
      if (jumping) return;
      var max = doc.scrollHeight - window.innerHeight;
      btn.classList.toggle('is-on', window.scrollY > hero.offsetHeight * 0.8);
      btn.style.setProperty('--p', String(100 - (max > 0 ? window.scrollY / max : 0) * 100));
    });
    function jumpTop(e) {
      e.preventDefault();
      jumping = true;
      // Put the header in its top-of-page state at once, with no height animation to "settle".
      hd.classList.add('no-anim');
      hd.classList.remove('is-compact');
      bar.style.setProperty('--p', 0);
      // The page sets scroll-behavior: smooth for anchor links; switch it off for this one call.
      var prev = doc.style.scrollBehavior;
      doc.style.scrollBehavior = 'auto';
      try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
      catch (err) { window.scrollTo(0, 0); } // Safari before 15.4 rejects 'instant'
      doc.style.scrollBehavior = prev;
      // Fade the button out with its normal transition and empty the ring.
      btn.classList.remove('is-on');
      btn.style.setProperty('--p', '100');
      main.focus({ preventScroll: true });
      setTimeout(function () {
        hd.classList.remove('no-anim');
        jumping = false;
        requestScrollWork();
      }, 150);
    }
    $$('[data-to-top]').forEach(function (el) { el.addEventListener('click', jumpTop); });
  });

  safe('year', function () { $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); }); });
})();
