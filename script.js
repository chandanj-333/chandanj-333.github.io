/* ==========================================================================
   Chandan & Swetha — Wedding Invitation
   Vanilla JS · no dependencies · works from file:// and GitHub Pages
   ========================================================================== */
(function () {
  'use strict';

  /* ================= CONFIGURATION ================= */
  const RSVP_WHATSAPP_NUMBER = "";   // digits with country code, e.g. "919876543210". Empty = button hidden.
  const MUSIC_SOURCES = ["assets/audio/wedding-music.mp3", "assets/audio/music.mp3"];
  const COUPLE = "Chandan & Swetha";
  const VENUE = {
    name: "Soudhamini Kalyana Mantapa",
    address: "New Bank Colony, Anjanapura Main Road, Konanakunte, Bengaluru - 560062",
    mapsLink: "https://maps.app.goo.gl/Y8QNFMVbE6oM2g298",
    lat: 12.8826745, lng: 77.5663482
  };
  VENUE.full = VENUE.name + ", " + VENUE.address;
  // IST times expressed as UTC so the countdown is right in every timezone
  const EVENTS = {
    wedding:   { title: "Chandan & Swetha - Wedding",   description: "Muhurtham of Chandan & Swetha. Lagnam: Dhanusu. 9:30 AM to 10:30 AM IST.", start: Date.UTC(2026, 10, 11, 4, 0, 0),   end: Date.UTC(2026, 10, 11, 5, 0, 0),   uid: "wedding-20261111@chandan-swetha",   file: "Chandan-Swetha-Wedding.ics" },
    reception: { title: "Chandan & Swetha - Reception", description: "Wedding reception of Chandan & Swetha. 7:00 PM onwards IST.",               start: Date.UTC(2026, 10, 10, 13, 30, 0), end: Date.UTC(2026, 10, 10, 16, 30, 0), uid: "reception-20261110@chandan-swetha", file: "Chandan-Swetha-Reception.ics" }
  };
  // Invitation link goes first so WhatsApp shows its preview card at the top
  const SITE_URL = "https://chandanj-333.github.io/";
  const SHARE_TEXT =
    SITE_URL + "\n\n" +
    "You're invited to celebrate the wedding of Chandan & Swetha ❤️\n\n" +
    "Reception: Tuesday, 10 November 2026 · 7:00 PM onwards\n" +
    "Muhurtham: Wednesday, 11 November 2026 · 9:30 AM – 10:30 AM\n\n" +
    "Soudhamini Kalyana Mantapa, Bengaluru\n" +
    "Location: https://maps.app.goo.gl/Y8QNFMVbE6oM2g298";
  const RSVP_TEXT = "Hello! I would like to RSVP for Chandan & Swetha's wedding on 11 November 2026.";

  /* ================= helpers ================= */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageURL = () => location.origin + location.pathname + location.search;
  let musicAvailable = false, wantsMusic = false;

  const toastEl = $('#toast'); let toastTimer;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600); }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((res, rej) => { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy') ? res() : rej(new Error('copy')); } catch (e) { rej(e); } document.body.removeChild(ta); });
  }
  function openExternal(url) { const w = window.open(url, '_blank', 'noopener,noreferrer'); if (!w) location.href = url; }

  $$('[data-maps-link]').forEach(a => { a.href = VENUE.mapsLink; });
  $$('[data-directions-link]').forEach(a => { a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(VENUE.lat + ',' + VENUE.lng); });

  /* ================= cover / ribbon ================= */
  const intro = $('#intro'), card = $('#coverCard'), ribbon = $('#openBtn'), site = $('#site'), hint = $('#introHint');
  let opened = false;
  function openInvitation(animate) {
    if (opened) return; opened = true;
    site.removeAttribute('inert'); site.removeAttribute('aria-hidden');
    document.body.classList.remove('is-locked');
    window.scrollTo(0, 0);
    wantsMusic = true; tryPlayMusic();
    const finish = () => { intro.classList.add('is-done'); revealNow(); setTimeout(() => intro.remove(), 1000); };
    if (animate && !reduceMotion) {
      ribbon.classList.add('is-untying'); ribbon.disabled = true;
      if (hint) hint.style.opacity = '0';
      setTimeout(() => card.classList.add('is-open'), 900);
      setTimeout(finish, 1700);
    } else finish();
  }
  ribbon && ribbon.addEventListener('click', () => openInvitation(true));
  $('.skip-link') && $('.skip-link').addEventListener('click', () => openInvitation(false));

  /* ================= scroll reveal ================= */
  const revealEls = $$('.reveal'); let io = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('is-visible'));
  function revealNow() { const vh = innerHeight; revealEls.forEach(el => { if (el.classList.contains('is-visible')) return; const r = el.getBoundingClientRect(); if (r.top < vh * .94 && r.bottom > 0) { el.classList.add('is-visible'); io && io.unobserve(el); } }); }

  /* ================= countdown ================= */
  const cdDays = $('#cdDays'), cdHMS = $('#cdHMS'), cdDone = $('#cdDone');
  const pad = n => String(n).padStart(2, '0');
  let cdTimer;
  function tick() {
    const diff = EVENTS.wedding.start - Date.now();
    if (diff <= 0) { $('.band__count') && ($('.band__count').hidden = true); $('.band__label') && ($('.band__label').hidden = true); cdDone && (cdDone.hidden = false); clearInterval(cdTimer); return; }
    const s = Math.floor(diff / 1000);
    cdDays.textContent = Math.floor(s / 86400);
    cdHMS.textContent = pad(Math.floor((s % 86400) / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  }
  if (cdDays) { tick(); cdTimer = setInterval(tick, 1000); document.addEventListener('visibilitychange', () => !document.hidden && tick()); }

  /* ================= calendar ================= */
  const icsDate = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  function buildICS(ev) {
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chandan and Swetha Wedding//Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', 'UID:' + ev.uid, 'DTSTAMP:' + icsDate(Date.now()), 'DTSTART:' + icsDate(ev.start), 'DTEND:' + icsDate(ev.end),
      'SUMMARY:' + icsEsc(ev.title), 'DESCRIPTION:' + icsEsc(ev.description + '\n' + pageURL()), 'LOCATION:' + icsEsc(VENUE.full), 'URL:' + pageURL(), 'STATUS:CONFIRMED',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(ev.title + ' is tomorrow'), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  }
  function downloadICS(ev) {
    const content = buildICS(ev); const a = document.createElement('a'); let url;
    try { url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' })); } catch (e) { url = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content); }
    a.href = url; a.download = ev.file; a.rel = 'noopener'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    if (url.indexOf('blob:') === 0) setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Calendar file downloaded');
  }
  function gcalURL(ev) {
    const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: icsDate(ev.start) + '/' + icsDate(ev.end), details: ev.description + '\n' + pageURL(), location: VENUE.full, ctz: 'Asia/Kolkata' });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }
  $$('[data-cal]').forEach(b => b.addEventListener('click', () => downloadICS(EVENTS[b.dataset.cal])));
  $$('[data-gcal]').forEach(a => { a.href = gcalURL(EVENTS[a.dataset.gcal]); });

  /* ================= copy / share / rsvp ================= */
  $('#copyAddressBtn') && $('#copyAddressBtn').addEventListener('click', () => copyText(VENUE.full + '\n' + VENUE.mapsLink).then(() => toast('Address copied')).catch(() => toast('Could not copy — please long-press the address')));
  function share() {
    const url = pageURL();
    if (navigator.share) navigator.share({ title: COUPLE + ' – Wedding Invitation', text: SHARE_TEXT }).catch(err => { if (err && err.name !== 'AbortError') fallbackShare(url); });
    else fallbackShare(url);
  }
  function fallbackShare(url) {
    openExternal('https://wa.me/?text=' + encodeURIComponent(SHARE_TEXT));
    copyText(SITE_URL).then(() => toast('Link copied — share it with your loved ones')).catch(() => {});
  }
  $('#shareBtn') && $('#shareBtn').addEventListener('click', share);
  const rsvpBtn = $('#rsvpWhatsappBtn');
  if (rsvpBtn) { const d = String(RSVP_WHATSAPP_NUMBER || '').replace(/\D/g, ''); if (d) { rsvpBtn.href = 'https://wa.me/' + d + '?text=' + encodeURIComponent(RSVP_TEXT); rsvpBtn.hidden = false; } else rsvpBtn.remove(); }

  /* ================= back to top ================= */
  const topBtn = $('#topBtn');
  if (topBtn) { let t = false; addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(() => { topBtn.classList.toggle('is-visible', scrollY > 600); t = false; }); } }, { passive: true }); topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })); }

  /* ================= music ================= */
  const audio = $('#bgm'), musicBtn = $('#musicBtn');
  function setMusicUI(p) { if (!musicBtn) return; musicBtn.setAttribute('aria-pressed', p ? 'true' : 'false'); musicBtn.setAttribute('aria-label', p ? 'Pause music' : 'Play music'); }
  function tryPlayMusic() { if (!musicAvailable || !audio) return; wantsMusic = true; audio.volume = .55; const p = audio.play(); if (p && p.then) p.then(() => setMusicUI(true)).catch(() => setMusicUI(false)); }
  function probe(src) {
    if (location.protocol !== 'file:' && window.fetch) return fetch(src, { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false);
    return new Promise(res => { const a = document.createElement('audio'); const done = ok => { clearTimeout(t); res(ok); }; const t = setTimeout(() => done(false), 10000); a.preload = 'metadata'; a.addEventListener('loadedmetadata', () => done(true), { once: true }); a.addEventListener('error', () => done(false), { once: true }); a.src = src; });
  }
  function detectMusic(list) { if (!list.length) return Promise.resolve(null); return probe(list[0]).then(ok => ok ? list[0] : detectMusic(list.slice(1))); }
  if (audio && musicBtn) {
    detectMusic(MUSIC_SOURCES).then(src => { if (!src) { musicBtn.remove(); return; } musicAvailable = true; audio.src = src; musicBtn.hidden = false; setMusicUI(false); if (opened && wantsMusic) tryPlayMusic(); });
    musicBtn.addEventListener('click', () => { if (audio.paused) tryPlayMusic(); else { audio.pause(); wantsMusic = false; setMusicUI(false); } });
    audio.addEventListener('play', () => setMusicUI(true)); audio.addEventListener('pause', () => setMusicUI(false));
    document.addEventListener('visibilitychange', () => { if (!musicAvailable) return; if (document.hidden) { if (!audio.paused) { audio.pause(); wantsMusic = true; } } else if (wantsMusic && audio.paused) audio.play().catch(() => {}); });
  }

  /* ================= scratch-to-reveal ================= */
  (function scratch() {
    const box = $('#scratch'), canvas = $('#scratchCanvas'), revealBtn = $('#revealBtn');
    if (!box || !canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) { canvas.remove(); return; }
    const W = box.clientWidth, H = box.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#b9975c'); g.addColorStop(.3, '#f1e1b7'); g.addColorStop(.55, '#d9bd86'); g.addColorStop(.8, '#f3e5c0'); g.addColorStop(1, '#a98749');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { ctx.fillStyle = 'rgba(255,250,230,' + (Math.random() * .35) + ')'; ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
    ctx.fillStyle = '#4e1c2d'; ctx.textAlign = 'center';
    ctx.font = '400 30px "Pinyon Script", cursive'; ctx.fillText('Our forever awaits', W / 2, H * .44);
    ctx.font = '500 9px Jost, sans-serif'; ctx.letterSpacing = '3px'; ctx.fillText('SCRATCH TO REVEAL OUR DATE', W / 2, H * .55);
    let drawing = false, done = false, strokes = 0;
    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function erase(p) { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    function cleared() { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let n = 0; for (let i = 3; i < d.length; i += 4 * 9) if (d[i] === 0) n++; return n / (d.length / 36); }
    function finish() { if (done) return; done = true; canvas.classList.add('is-done'); revealBtn && (revealBtn.hidden = true); }
    canvas.addEventListener('pointerdown', e => { drawing = true; canvas.setPointerCapture(e.pointerId); erase(pos(e)); });
    canvas.addEventListener('pointermove', e => { if (!drawing) return; erase(pos(e)); if (++strokes % 12 === 0 && cleared() > .42) finish(); });
    const stop = () => { drawing = false; if (!done && cleared() > .42) finish(); };
    canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
    revealBtn && revealBtn.addEventListener('click', finish);
  })();

  /* ================= tap the names: sparkle burst ================= */
  (function burst() {
    const btn = $('#namesTap'), canvas = $('#fx'); if (!btn) return;
    let ctx = null, W = 0, H = 0, parts = [], raf = 0, running = false, last = 0;
    if (canvas && !reduceMotion) ctx = canvas.getContext('2d');
    const rand = (a, b) => a + Math.random() * (b - a);
    function resize() { const dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function heart(s) { ctx.beginPath(); ctx.moveTo(0, -s * .35); ctx.bezierCurveTo(s * .5, -s, s * 1.4, -s * .1, 0, s * .9); ctx.bezierCurveTo(-s * 1.4, -s * .1, -s * .5, -s, 0, -s * .35); ctx.closePath(); }
    function petal(r) { ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .75, -r * .15, 0, r); ctx.quadraticCurveTo(-r * .75, -r * .15, 0, -r); ctx.closePath(); }
    function spawn(x, y) {
      const m = W < 600;
      for (let i = 0; i < (m ? 26 : 40); i++) { const a = rand(0, Math.PI * 2), sp = rand(120, 320); parts.push({ k: 's', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0, ttl: rand(.6, 1.2), r: rand(1.2, 2.8), g: 260 }); }
      for (let i = 0; i < (m ? 14 : 22); i++) { const a = rand(-Math.PI, 0), sp = rand(80, 220); parts.push({ k: 'p', x, y, vx: Math.cos(a) * sp * rand(.6, 1.4), vy: Math.sin(a) * sp, life: 0, ttl: rand(1.4, 2.2), r: rand(4, 8), rot: rand(0, 6), vr: rand(-3, 3), g: 140 }); }
      for (let i = 0; i < (m ? 6 : 9); i++) { const a = rand(-Math.PI * .85, -Math.PI * .15), sp = rand(60, 150); parts.push({ k: 'h', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, ttl: rand(1.2, 1.9), r: rand(4, 7), g: -30 }); }
      if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life += dt; if (p.life >= p.ttl) { parts.splice(i, 1); continue; }
        const t = p.life / p.ttl; p.vy += p.g * dt; p.vx *= (1 - dt * 1.2); p.x += p.vx * dt; p.y += p.vy * dt;
        const fade = t < .7 ? 1 : 1 - (t - .7) / .3; ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = fade * .9;
        if (p.k === 's') { ctx.beginPath(); ctx.arc(0, 0, p.r * 2.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(233,211,166,.25)'; ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fillStyle = '#fff1c2'; ctx.fill(); }
        else if (p.k === 'p') { p.rot += p.vr * dt; ctx.rotate(p.rot); petal(p.r); ctx.fillStyle = 'rgba(231,185,189,1)'; ctx.fill(); ctx.strokeStyle = 'rgba(185,150,98,.6)'; ctx.lineWidth = .8; ctx.stroke(); }
        else { heart(p.r * (1 + Math.sin(t * Math.PI) * .25)); ctx.fillStyle = t < .5 ? '#e9d3a6' : '#b9667b'; ctx.fill(); }
        ctx.restore();
      }
      if (parts.length) raf = requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, W, H); }
    }
    if (ctx) { resize(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); }); }
    let lastTap = 0;
    btn.addEventListener('click', e => {
      const now = Date.now(); if (now - lastTap < 250) return; lastTap = now;
      btn.classList.remove('is-pulsing'); void btn.offsetWidth; btn.classList.add('is-pulsing');
      if (!ctx) return; let x = e.clientX, y = e.clientY; if (!x && !y) { const r = btn.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; } spawn(x, y);
    });
  })();

  // Deep links (index.html#events) skip the cover. Runs last so everything above is initialised.
  if (location.hash && /^#[\w-]+$/.test(location.hash) && $(location.hash)) { openInvitation(false); setTimeout(() => { const t = $(location.hash); t && t.scrollIntoView(); }, 50); }
})();
