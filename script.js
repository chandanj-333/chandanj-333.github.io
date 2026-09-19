/* ==========================================================================
   Chandan & Swetha — Wedding Invitation
   Vanilla JS · no dependencies · works from file:// and GitHub Pages
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     CONFIGURATION — edit these values
     ====================================================================== */

  // WhatsApp number for RSVP, digits only with country code, e.g. "919876543210".
  // Leave empty ("") to hide the RSVP button.
  const RSVP_WHATSAPP_NUMBER = "";

  // Background music: the first file in this list that exists is used.
  // If none exists, the music button hides itself.
  const MUSIC_SOURCES = [
    "assets/audio/wedding-music.mp3",
    "assets/audio/music.mp3"
  ];

  const COUPLE = "Chandan & Swetha";

  const VENUE = {
    name: "Soudhamini Kalyana Mantapa",
    address: "New Bank Colony, Anjanapura Main Road, Konanakunte, Bengaluru - 560062",
    // Official Google Maps link for the mantapa
    mapsLink: "https://maps.app.goo.gl/Y8QNFMVbE6oM2g298",
    lat: 12.8826745,
    lng: 77.5663482
  };
  VENUE.full = VENUE.name + ", " + VENUE.address;

  // All times are IST (UTC+5:30) expressed as UTC epoch milliseconds,
  // so the countdown is correct in every visitor's timezone.
  const EVENTS = {
    wedding: {
      title: "Chandan & Swetha - Wedding",
      description: "Muhurtham of Chandan & Swetha. Lagnam: Dhanusu. 9:30 AM to 10:30 AM IST.",
      start: Date.UTC(2026, 10, 11, 4, 0, 0),   // 11 Nov 2026, 09:30 IST
      end:   Date.UTC(2026, 10, 11, 5, 0, 0),   // 11 Nov 2026, 10:30 IST
      uid: "wedding-20261111@chandan-swetha"
    },
    reception: {
      title: "Chandan & Swetha - Reception",
      description: "Wedding reception of Chandan & Swetha. 7:00 PM onwards IST.",
      start: Date.UTC(2026, 10, 10, 13, 30, 0), // 10 Nov 2026, 19:00 IST
      end:   Date.UTC(2026, 10, 10, 16, 30, 0), // 10 Nov 2026, 22:00 IST
      uid: "reception-20261110@chandan-swetha"
    }
  };

  const SHARE_TEXT =
    "You're invited to celebrate the wedding of Chandan & Swetha ❤️\n" +
    "11 November 2026\n" +
    "Soudhamini Kalyana Mantapa, Bengaluru";

  const RSVP_TEXT =
    "Hello! I would like to RSVP for Chandan & Swetha's wedding on 11 November 2026.";

  /* ======================================================================
     Helpers
     ====================================================================== */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  let musicAvailable = false, wantsMusic = false;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pageURL() {
    // Canonical URL without hash — works at username.github.io/repo/ and file://
    return location.origin + location.pathname + location.search;
  }

  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
      catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function openExternal(url) {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) location.href = url; // popup blocked → same tab
  }

  /* ======================================================================
     Maps links
     ====================================================================== */
  const directionsURL = 'https://www.google.com/maps/dir/?api=1&destination=' +
    encodeURIComponent(VENUE.lat + ',' + VENUE.lng);

  $$('[data-maps-link]').forEach(a => { a.href = VENUE.mapsLink; });
  $$('[data-directions-link]').forEach(a => { a.href = directionsURL; });

  /* ======================================================================
     Open invitation
     ====================================================================== */
  const hero    = $('#hero');
  const page    = $('#page');
  const openBtn = $('#openBtn');
  let opened = false;

  function openInvitation(animate) {
    if (opened) return;
    opened = true;

    page.removeAttribute('inert');
    page.removeAttribute('aria-hidden');
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-open');
    window.scrollTo(0, 0);

    wantsMusic = true;
    tryPlayMusic();

    const finish = () => {
      hero.classList.add('is-opened');
      hero.setAttribute('aria-hidden', 'true');
      // Trigger reveals already in view
      revealNow();
      const first = $('#main');
      if (first) first.focus && first.setAttribute('tabindex', '-1');
    };

    if (animate && !reduceMotion) {
      hero.classList.add('is-opening');
      setTimeout(finish, 1300);
    } else {
      finish();
    }
  }

  if (openBtn) openBtn.addEventListener('click', () => openInvitation(true));

  // Split the hero names into letters so each can rise in on its own (decorative only)
  (function splitNames() {
    const h1 = $('.hero__names');
    if (!h1) return;
    const names = $$('.hero__name', h1);
    h1.setAttribute('aria-label', names.map(n => n.textContent.trim()).join(' and '));
    names.forEach(name => {
      const text = name.textContent.trim();
      name.setAttribute('aria-hidden', 'true');
      name.textContent = '';
      Array.from(text).forEach((chr, i) => {
        const span = document.createElement('span');
        span.className = 'ch';
        span.style.setProperty('--i', i);
        span.textContent = chr;
        name.appendChild(span);
      });
    });
  })();

  // The skip link opens the invitation directly
  $('.skip-link') && $('.skip-link').addEventListener('click', () => openInvitation(false));

  /* ======================================================================
     Scroll reveal (IntersectionObserver)
     ====================================================================== */
  const revealEls = $$('.reveal');
  let io = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }
  function revealNow() {
    // Elements currently within the viewport get revealed immediately after opening
    const vh = window.innerHeight;
    revealEls.forEach(el => {
      if (el.classList.contains('is-visible')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) {
        el.classList.add('is-visible');
        io && io.unobserve(el);
      }
    });
  }

  /* ======================================================================
     Countdown
     ====================================================================== */
  const cd = {
    grid: $('#countdownGrid'),
    done: $('#countdownDone'),
    d: $('#cdDays'), h: $('#cdHours'), m: $('#cdMinutes'), s: $('#cdSeconds')
  };
  const pad = n => String(n).padStart(2, '0');
  function setNum(el, val) {
    if (!el || el.textContent === val) return;
    el.textContent = val;
    if (!reduceMotion) {
      el.classList.remove('tick');
      void el.offsetWidth; // restart animation
      el.classList.add('tick');
    }
  }
  let cdTimer;
  function tickCountdown() {
    const diff = EVENTS.wedding.start - Date.now();
    if (diff <= 0) {
      if (cd.grid) cd.grid.hidden = true;
      if (cd.done) cd.done.hidden = false;
      clearInterval(cdTimer);
      return;
    }
    const s = Math.floor(diff / 1000);
    setNum(cd.d, String(Math.floor(s / 86400)));
    setNum(cd.h, pad(Math.floor((s % 86400) / 3600)));
    setNum(cd.m, pad(Math.floor((s % 3600) / 60)));
    setNum(cd.s, pad(s % 60));
  }
  if (cd.grid) {
    tickCountdown();
    cdTimer = setInterval(tickCountdown, 1000);
  }

  /* ======================================================================
     Calendar (Google + .ics)
     ====================================================================== */
  function icsDate(ms) {
    return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
  function icsEscape(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }
  function icsEvent(ev) {
    return [
      'BEGIN:VEVENT',
      'UID:' + ev.uid,
      'DTSTAMP:' + icsDate(Date.now()),
      'DTSTART:' + icsDate(ev.start),
      'DTEND:' + icsDate(ev.end),
      'SUMMARY:' + icsEscape(ev.title),
      'DESCRIPTION:' + icsEscape(ev.description + '\n' + pageURL()),
      'LOCATION:' + icsEscape(VENUE.full),
      'URL:' + pageURL(),
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + icsEscape(ev.title + ' is tomorrow'),
      'END:VALARM',
      'END:VEVENT'
    ];
  }
  function buildICS(events) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Chandan and Swetha Wedding//Invitation//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    events.forEach(ev => lines.push.apply(lines, icsEvent(ev)));
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }
  function downloadICS(events, filename) {
    const content = buildICS(events);
    const a = document.createElement('a');
    let url;
    try {
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      url = URL.createObjectURL(blob);
    } catch (e) {
      url = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content);
    }
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (url.indexOf('blob:') === 0) setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Calendar file downloaded');
  }
  function googleCalendarURL(ev) {
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: ev.title,
      dates: icsDate(ev.start) + '/' + icsDate(ev.end),
      details: ev.description + '\n' + pageURL(),
      location: VENUE.full,
      ctz: 'Asia/Kolkata'
    });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }

  const calendarBtn = $('#calendarBtn');
  const dialog = $('#calendarDialog');
  const supportsDialog = dialog && typeof dialog.showModal === 'function';
  let lastFocus = null;

  function openDialog() {
    if (!dialog) return;
    lastFocus = document.activeElement;
    if (supportsDialog) dialog.showModal();
    else { dialog.classList.add('is-fallback'); dialog.setAttribute('open', ''); }
    const firstBtn = $('[data-cal]', dialog);
    firstBtn && firstBtn.focus();
  }
  function closeDialog() {
    if (!dialog) return;
    if (supportsDialog) dialog.close();
    else dialog.removeAttribute('open');
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  if (calendarBtn && dialog) {
    calendarBtn.addEventListener('click', openDialog);
    $$('[data-close]', dialog).forEach(b => b.addEventListener('click', closeDialog));
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); }); // backdrop click
    dialog.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !supportsDialog) closeDialog(); });
    $$('[data-cal]', dialog).forEach(btn => {
      btn.addEventListener('click', () => {
        const which = btn.getAttribute('data-cal');
        const action = btn.getAttribute('data-cal-action');
        const list = which === 'both' ? [EVENTS.reception, EVENTS.wedding] : [EVENTS[which]];
        if (action === 'google') {
          openExternal(googleCalendarURL(list[0]));
        } else {
          const name = which === 'both' ? 'Chandan-Swetha-Wedding-Events.ics' :
                       which === 'wedding' ? 'Chandan-Swetha-Wedding.ics' : 'Chandan-Swetha-Reception.ics';
          downloadICS(list, name);
        }
        closeDialog();
      });
    });
  }

  /* ======================================================================
     Copy address
     ====================================================================== */
  const copyBtn = $('#copyAddressBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyText(VENUE.full + '\n' + VENUE.mapsLink)
        .then(() => toast('Address copied'))
        .catch(() => toast('Could not copy — please long-press the address'));
    });
  }

  /* ======================================================================
     Share
     ====================================================================== */
  function share() {
    const url = pageURL();
    if (navigator.share) {
      navigator.share({ title: COUPLE + ' – Wedding Invitation', text: SHARE_TEXT, url: url })
        .catch(err => { if (err && err.name !== 'AbortError') fallbackShare(url); });
    } else {
      fallbackShare(url);
    }
  }
  function fallbackShare(url) {
    const isFile = location.protocol === 'file:';
    const text = SHARE_TEXT + (isFile ? '' : '\n' + url);
    // WhatsApp share (works on phone and desktop web)
    openExternal('https://wa.me/?text=' + encodeURIComponent(text));
    if (!isFile) copyText(url).then(() => toast('Link copied — share it with your loved ones')).catch(() => {});
  }
  $('#shareBtn') && $('#shareBtn').addEventListener('click', share);
  $('#shareInlineBtn') && $('#shareInlineBtn').addEventListener('click', share);

  /* ======================================================================
     RSVP on WhatsApp (hidden when number not configured)
     ====================================================================== */
  const rsvpBtn = $('#rsvpWhatsappBtn');
  if (rsvpBtn) {
    const digits = String(RSVP_WHATSAPP_NUMBER || '').replace(/\D/g, '');
    if (digits) {
      rsvpBtn.href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(RSVP_TEXT);
      rsvpBtn.hidden = false;
    } else {
      rsvpBtn.remove();
    }
  }

  /* ======================================================================
     Back to top
     ====================================================================== */
  const topBtn = $('#topBtn');
  if (topBtn) {
    let ticking = false;
    const update = () => {
      topBtn.classList.toggle('is-visible', window.scrollY > 600);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ======================================================================
     Background music — button only appears when the file exists
     ====================================================================== */
  const audio = $('#bgm');
  const musicBtn = $('#musicBtn');

  function setMusicUI(playing) {
    if (!musicBtn) return;
    musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }
  function tryPlayMusic() {
    if (!musicAvailable || !audio) return;
    wantsMusic = true;
    audio.volume = 0.55;
    const p = audio.play();
    if (p && p.then) {
      p.then(() => setMusicUI(true)).catch(() => setMusicUI(false)); // autoplay blocked → stays paused
    }
  }
  function probeMusic(src) {
    if (location.protocol !== 'file:' && window.fetch) {
      return fetch(src, { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false);
    }
    // file:// — fetch is blocked, so probe with an <audio> element instead
    return new Promise(resolve => {
      const probe = document.createElement('audio');
      const done = ok => { clearTimeout(t); resolve(ok); };
      const t = setTimeout(() => done(false), 10000);
      probe.preload = 'metadata';
      probe.addEventListener('loadedmetadata', () => done(true), { once: true });
      probe.addEventListener('error', () => done(false), { once: true });
      probe.src = src;
    });
  }
  // Resolves to the first existing source, or null
  function detectMusic(list) {
    const srcs = (list || []).filter(Boolean);
    if (!srcs.length) return Promise.resolve(null);
    return probeMusic(srcs[0]).then(ok => ok ? srcs[0] : detectMusic(srcs.slice(1)));
  }
  if (audio && musicBtn) {
    detectMusic(MUSIC_SOURCES).then(src => {
      if (!src) { musicBtn.remove(); return; }
      musicAvailable = true;
      audio.src = src;
      musicBtn.hidden = false;
      setMusicUI(false);
      if (opened && wantsMusic) tryPlayMusic(); // opened before detection finished
    });

    musicBtn.addEventListener('click', () => {
      if (audio.paused) { tryPlayMusic(); }
      else { audio.pause(); wantsMusic = false; setMusicUI(false); }
    });
    audio.addEventListener('play',  () => setMusicUI(true));
    audio.addEventListener('pause', () => setMusicUI(false));
    document.addEventListener('visibilitychange', () => {
      if (!musicAvailable) return;
      if (document.hidden) { if (!audio.paused) { audio.pause(); wantsMusic = true; } }
      else if (wantsMusic && audio.paused) { audio.play().catch(() => {}); }
    });
  }

  /* ======================================================================
     Floating jasmine petals (canvas, lightweight)
     ====================================================================== */
  (function petals() {
    const canvas = $('#petals');
    if (!canvas) return;
    if (reduceMotion || !canvas.getContext) { canvas.remove(); return; }
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, items = [], raf = 0, running = false, last = 0;

    const PALETTE = [
      { fill: [255, 252, 245], edge: [232, 214, 170] }, // jasmine white
      { fill: [250, 236, 200], edge: [201, 162, 74]  }, // pale gold
      { fill: [248, 228, 226], edge: [214, 160, 160] }  // blush
    ];
    const rand = (a, b) => a + Math.random() * (b - a);

    function makeGlint(fromBottom) {
      return {
        k: 'g',
        x: rand(0, W), y: fromBottom ? H + rand(4, 30) : rand(0, H),
        r: rand(.9, 2.2), vy: rand(6, 14), phase: rand(0, Math.PI * 2), tw: rand(1.2, 2.6), alpha: rand(.35, .8)
      };
    }
    function make(fromTop) {
      if (Math.random() < .38) return makeGlint(fromTop);
      return {
        k: 'p',
        x: rand(0, W), y: fromTop ? rand(-40, -10) : rand(0, H),
        r: rand(4, 9),
        vy: rand(18, 38),            // px per second
        vx: rand(-8, 8),
        phase: rand(0, Math.PI * 2), sway: rand(.6, 1.4),
        rot: rand(0, Math.PI * 2), vr: rand(-.6, .6),
        alpha: rand(.45, .8),
        c: PALETTE[Math.floor(Math.random() * PALETTE.length)]
      };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(12, Math.min(30, Math.round(W / 52)));
      while (items.length < n) items.push(make(false));
      items.length = n;
    }
    function drawGlint(p) {
      const a = p.alpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.phase)));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(228,199,120,' + (a * .18) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,241,194,' + a + ')'; ctx.fill();
    }
    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.quadraticCurveTo(p.r * .75, -p.r * .15, 0, p.r);
      ctx.quadraticCurveTo(-p.r * .75, -p.r * .15, 0, -p.r);
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + p.c.fill.join(',') + ',' + p.alpha + ')';
      ctx.fill();
      ctx.lineWidth = .8;
      ctx.strokeStyle = 'rgba(' + p.c.edge.join(',') + ',' + (p.alpha * .6) + ')';
      ctx.stroke();
      ctx.restore();
    }
    function frame(now) {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000 || .016);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < items.length; i++) {
        const p = items[i];
        if (p.k === 'g') {
          p.phase += dt * p.tw;
          p.y -= p.vy * dt;
          p.x += Math.sin(p.phase * .5) * 6 * dt;
          if (p.y < -10) items[i] = makeGlint(true);
          drawGlint(items[i]);
          continue;
        }
        p.phase += dt * p.sway;
        p.x += (p.vx + Math.sin(p.phase) * 14) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 20 || p.x < -40 || p.x > W + 40) { items[i] = make(true); continue; }
        drawPetal(p);
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  })();

  /* ======================================================================
     Tap the names → petals, gold sparkles & hearts
     ====================================================================== */
  (function burst() {
    const btn = $('#namesTap');
    const canvas = $('#fx');
    if (!btn) return;

    let ctx = null, W = 0, H = 0, dpr = 1, parts = [], raf = 0, running = false, last = 0;
    if (canvas && !reduceMotion && canvas.getContext) {
      ctx = canvas.getContext('2d');
    }
    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function heartPath(s) {
      ctx.beginPath();
      ctx.moveTo(0, -s * .35);
      ctx.bezierCurveTo(s * .5, -s, s * 1.4, -s * .1, 0, s * .9);
      ctx.bezierCurveTo(-s * 1.4, -s * .1, -s * .5, -s, 0, -s * .35);
      ctx.closePath();
    }
    function petalPath(r) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * .75, -r * .15, 0, r);
      ctx.quadraticCurveTo(-r * .75, -r * .15, 0, -r);
      ctx.closePath();
    }
    function spawn(x, y) {
      const isMobile = W < 600;
      const nSpark = isMobile ? 26 : 40, nPetal = isMobile ? 14 : 22, nHeart = isMobile ? 6 : 9;
      for (let i = 0; i < nSpark; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(120, 320);
        parts.push({ k: 's', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0, ttl: rand(.6, 1.2), r: rand(1.2, 2.8), g: 260 });
      }
      for (let i = 0; i < nPetal; i++) {
        const a = rand(-Math.PI, 0) , sp = rand(80, 220);
        parts.push({ k: 'p', x, y, vx: Math.cos(a) * sp * rand(.6, 1.4), vy: Math.sin(a) * sp, life: 0, ttl: rand(1.4, 2.2), r: rand(4, 8), rot: rand(0, 6), vr: rand(-3, 3), g: 140, blush: Math.random() < .35 });
      }
      for (let i = 0; i < nHeart; i++) {
        const a = rand(-Math.PI * .85, -Math.PI * .15), sp = rand(60, 150);
        parts.push({ k: 'h', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, ttl: rand(1.2, 1.9), r: rand(4, 7), g: -30 });
      }
      start();
    }
    function frame(now) {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000 || .016);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.ttl) { parts.splice(i, 1); continue; }
        const t = p.life / p.ttl;
        p.vy += p.g * dt;
        p.vx *= (1 - dt * 1.2);
        p.x += p.vx * dt; p.y += p.vy * dt;
        const fade = t < .7 ? 1 : 1 - (t - .7) / .3;
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.k === 's') {
          ctx.globalAlpha = fade * .9;
          ctx.fillStyle = '#F3E2AE';
          ctx.beginPath(); ctx.arc(0, 0, p.r * 2.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(228,199,120,.25)'; ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fillStyle = '#FFF1C2'; ctx.fill();
        } else if (p.k === 'p') {
          p.rot += p.vr * dt;
          ctx.rotate(p.rot);
          ctx.globalAlpha = fade * .95;
          petalPath(p.r);
          ctx.fillStyle = p.blush ? 'rgba(246,220,218,1)' : 'rgba(255,252,245,1)';
          ctx.fill();
          ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(201,162,74,.6)'; ctx.stroke();
        } else {
          ctx.globalAlpha = fade * .9;
          const s = p.r * (1 + Math.sin(t * Math.PI) * .25);
          heartPath(s);
          ctx.fillStyle = t < .5 ? '#8A1C2E' : '#C9A24A';
          ctx.fill();
        }
        ctx.restore();
      }
      if (parts.length) raf = requestAnimationFrame(frame);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }

    if (ctx) {
      resize();
      let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    }

    let lastTap = 0;
    btn.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastTap < 250) return; // debounce double-fire
      lastTap = now;
      btn.classList.remove('is-pulsing');
      void btn.offsetWidth;
      btn.classList.add('is-pulsing');
      if (!ctx) return;
      let x, y;
      if (e.clientX || e.clientY) { x = e.clientX; y = e.clientY; }
      else { const r = btn.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
      spawn(x, y);
    });
  })();

  /* ======================================================================
     Gentle parallax for watermark mandalas (transform only, desktop pointer)
     ====================================================================== */
  (function parallax() {
    const els = $$('[data-parallax]');
    if (!els.length || reduceMotion || !window.matchMedia('(hover: hover) and (min-width: 760px)').matches) return;
    let ticking = false;
    function update() {
      ticking = false;
      const vh = window.innerHeight;
      els.forEach(el => {
        const cur = parseFloat(el.style.getPropertyValue('--py')) || 0;
        const r = el.getBoundingClientRect();
        const top = r.top - cur;                       // untransformed position
        if (top + r.height < -200 || top > vh + 200) return;
        const centre = top + r.height / 2 - vh / 2;
        el.style.setProperty('--py', (-centre * parseFloat(el.dataset.parallax || .1)).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  /* ======================================================================
     Small niceties
     ====================================================================== */
  // Keep the countdown accurate after the tab was asleep
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cd.grid) tickCountdown(); });

  // Deep links (e.g. index.html#venue) skip the cover and jump to the section.
  // Runs last so every module above is initialised.
  if (location.hash && /^#[\w-]+$/.test(location.hash) && $(location.hash)) {
    openInvitation(false);
    setTimeout(() => { const t = $(location.hash); t && t.scrollIntoView(); }, 50);
  }
})();
