import { load, save, uid, isValid, requestPersist } from './storage.js';
import { VERSION } from './version.js';
import { TYPES, TYPE_GROUPS, migrate, defaults, copyFor, fmt, horizon, projection, tileInfo, leverBase, heroSummary, addPreview, streakInfo, leverStreaks, bankedSummary } from './model.js';

const C = { good: '#12805C', bad: '#D93A3A', ink: '#16181B', muted: '#5B6068', ghost: '#9A9EA5', goodDark: '#47D7A0', badDark: '#FF6F6F', more: '#0F766E', less: '#BE185D' };
/* Direction is colour: building up = teal, cutting back = pink. Good/bad outcomes are green/red. */
const groupOf = (l) => (TYPES[l.type] && TYPES[l.type].group) || 'more';
/* Which way is good on screen: build-up habits go up, cut-back habits go down.
   The chart plots how much of the habit you do, so less snacking is a downward drag. */
const flipOf = (l) => groupOf(l) === 'less' ? -1 : 1;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (x) => Math.max(-1, Math.min(1, x));
const app = document.getElementById('app');

let data = migrate(load());
const persist = () => save(data);
const H = horizon();
/* All copy is written as "summer"; swap in the season ~6 months out (spring/summer/autumn/winter).
   Done on the rendered DOM so every string, model copy included, follows the rolling horizon. */
const capS = (w) => w[0].toUpperCase() + w.slice(1);
const seasonText = (t) => H.season === 'summer' ? t : t.replace(/summer/g, H.season).replace(/Summer/g, capS(H.season));
function seasonalise(root) {
  if (H.season === 'summer' || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (/summer/i.test(n.nodeValue)) n.nodeValue = seasonText(n.nodeValue);
  root.querySelectorAll('[aria-label],[aria-valuetext]').forEach(el => {
    for (const at of ['aria-label', 'aria-valuetext']) { const v = el.getAttribute(at); if (v && /summer/i.test(v)) el.setAttribute(at, seasonText(v)); }
  });
}

/* ---------- Routing (hash) ---------- */
function route() {
  const [, a, b] = (location.hash.slice(1) || '/').split('/');
  if (a === 'lever' && data.levers.some(l => l.id === b)) return { name: 'decision', id: b };
  if (a === 'add') return { name: 'form' };
  if (a === 'edit' && data.levers.some(l => l.id === b)) return { name: 'form', id: b };
  return { name: 'home' };
}
const nav = (hash) => { location.hash = hash; };

/* ================= Home ================= */
/* Last 4 weeks at a glance. Colour is the outcome (green good, red slipping); the slope is
   what you're doing, so cut-back habits are mirrored: going well heads down, slipping climbs. */
function spark(trend, g = 'more') {
  const P = { up: [C.good, 'M2 18 C 14 17, 26 10, 42 3'], flat: ['#8A8F96', 'M2 15 C 14 15, 28 14, 42 14'], down: [C.bad, 'M2 15 C 12 6, 20 4, 26 7 C 32 10, 38 14, 42 16'] }[trend];
  return `<svg width="44" height="22" viewBox="0 0 44 22" aria-hidden="true"><g${g === 'less' ? ' transform="translate(0 22) scale(1 -1)"' : ''}><path d="M2 15 H42" stroke="#C9C4B9" stroke-width="1.5" stroke-dasharray="3 3"/><path d="${P[1]}" fill="none" stroke="${P[0]}" stroke-width="2.5" stroke-linecap="round"/></g></svg>`;
}

function hero(s) {
  if (s.state === 'empty' || s.state === 'quiet') {
    // Doing nothing isn't flat: left alone, habits drift the wrong way. Show the fork.
    const empty = s.state === 'empty', wk = Math.round(H.weeks);
    return `<section class="hero">
      <div class="hero-head">${empty ? 'Doing nothing isn’t standing still.' : 'Standing still is drifting.'}</div>
      <svg class="hero-chart" viewBox="0 0 310 150" role="img" aria-label="From now, one line climbs if you start changing; the other drifts down if nothing changes. Summer is ${wk} weeks away.">
        <path d="M14 70 C 100 68, 190 40, 262 16 L 262 118 C 190 96, 100 72, 14 70 Z" fill="#F5F3EE" opacity="0.06"/>
        <path class="draw" pathLength="1" d="M14 70 C 100 72, 190 96, 262 118" fill="none" stroke="${C.badDark}" stroke-width="3" stroke-linecap="round"/>
        <path class="draw late" pathLength="1" d="M14 70 C 100 68, 190 40, 262 16" fill="none" stroke="${C.goodDark}" stroke-width="4" stroke-linecap="round"/>
        <circle class="pop" cx="262" cy="118" r="5" fill="${C.badDark}"/>
        <circle class="pop late" cx="262" cy="16" r="6" fill="${C.goodDark}"/>
        <text x="132" y="36" font-size="13" font-weight="600" fill="${C.goodDark}">start now</text>
        <text x="132" y="112" font-size="13" font-weight="600" fill="${C.badDark}">do nothing</text>
        <text x="190" y="72" font-size="11" fill="#B9BDC4">the gap is</text><text x="190" y="86" font-size="11" fill="#B9BDC4">your choice</text>
        <circle cx="14" cy="70" r="9" fill="#F5F3EE"/><circle cx="14" cy="70" r="3.5" fill="${C.ink}"/>
        <text x="6" y="144" font-size="11" fill="#8A8F96">now</text>
        <text x="304" y="144" text-anchor="end" font-size="11" fill="#8A8F96">summer · ${wk} weeks</text>
      </svg>
      <div class="hero-sub">${empty
        ? 'Left alone, habits drift the wrong way: a little heavier, less fit, more tired each year. Which line you’re on starts with your next choice.'
        : 'No choices made here this month, and the drift doesn’t wait. Open a lever the moment you’re choosing.'}</div>
    </section>`;
  }
  const ahead = s.state === 'ahead', acc = ahead ? C.goodDark : C.badDark;
  const top = Math.round(98 - 84 * s.strength);
  const you = ahead ? `M6 100 C 90 96, 170 ${Math.round((top + 98) / 2)}, 262 ${top}` : 'M6 100 C 60 70, 110 52, 150 60 C 200 72, 230 90, 262 96';
  return `<section class="hero ${ahead ? '' : 'slipping'}">
    <div class="hero-head">${ahead ? 'You’re pulling away from the old you.' : 'You’re drifting back to the old you.'}</div>
    <svg class="hero-chart" viewBox="0 0 310 128" role="img" aria-label="${ahead ? 'Your line climbing away from the old-you line' : 'Your line falling back towards the old-you line'}">
      <path d="${you} L 262 98 C 200 99, 100 100, 6 100 Z" fill="${acc}" opacity="0.18"/>
      <path d="M6 100 C 100 100, 200 99, 262 98" fill="none" stroke="#8A8F96" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"/>
      <path d="${you}" fill="none" stroke="${acc}" stroke-width="4" stroke-linecap="round"/>
      <text x="266" y="102" font-size="12" fill="#B9BDC4">old you</text>
      <text x="150" y="${ahead ? 90 : 48}" font-size="13" font-weight="600" fill="${acc}">${ahead ? 'that gap is you' : 'the gap is closing'}</text>
      <text x="6" y="124" font-size="11" fill="#8A8F96">now</text><text x="236" y="124" font-size="11" fill="#8A8F96">summer</text>
    </svg>
    <div class="hero-sub">${ahead ? 'By summer, that gap is:' : 'By summer, you’re throwing away:'}</div>
    <div class="chips" style="color:${acc}">${s.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>
  </section>`;
}

/* ---------- Hero slides 2 & 3: streak, banked ---------- */
const STREAK_ROWS = 4;
function streakSlide() {
  const all = leverStreaks(data.levers, data.events);
  const rows = all.slice(0, STREAK_ROWS), more = all.length - rows.length;
  const alive = all.filter(r => r.streak > 0), atRisk = alive.filter(r => !r.todayDone);
  const head = !alive.length ? 'Start a streak today.' : atRisk.length ? 'Keep them alive today.' : 'Don’t break them.';
  const champ = all.reduce((m, r) => (r.best > (m ? m.best : 0) ? r : m), null);
  const label = { good: 'good day', bad: 'slipped', none: 'nothing logged' };
  const row = (r) => {
    const days = r.days.slice(-7), n = r.streak, g = groupOf(r.lever), unit = g === 'less' ? 'clear' : 'done';
    const status = r.todayDone ? `${unit} today ✓` : n ? 'today?' : r.best ? `best ${r.best}` : 'not started';
    return `<a class="ls-row ${g}" href="#/lever/${r.lever.id}" aria-label="${esc(r.lever.name)}: ${n} day streak, ${r.todayDone ? 'done today' : 'not yet today'}. Last 7 days: ${days.map(d => label[d.state]).join(', ')}">
      <span class="ls-name"><b>${esc(r.lever.name)}</b><span class="ls-status ${r.todayDone ? 'done' : n ? 'risk' : ''}">${status}</span></span>
      <span class="strip ls-strip" aria-hidden="true">${days.map(d => `<span class="sd ${d.state}${d.today ? ' today' : ''}"></span>`).join('')}</span>
      <span class="ls-num ${n ? '' : 'zero'}">${n}<small>day${n === 1 ? '' : 's'} ${unit}</small></span>
    </a>`;
  };
  return `<section class="hero">
    <div class="hero-head">${head}</div>
    <div class="ls-list">${rows.map(row).join('')}</div>
    <div class="hero-sub">${more > 0 ? `+${more} more · ` : ''}${champ ? `Longest ever: ${esc(champ.lever.name)}, ${champ.best} day${champ.best === 1 ? '' : 's'}.` : 'A day counts when good choices outnumber bad on that habit.'}</div>
  </section>`;
}

function bankedSlide() {
  const b = bankedSummary(data.levers, data.events);
  if (!b.total) return `<section class="hero">
    <div class="hero-head">Nothing banked yet.</div>
    <div class="hero-sub">Every good choice lands here and stays: real, not projected. Your next one is the first.</div>
  </section>`;
  const since = b.since.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `<section class="hero">
    <div class="hero-head">Already banked.</div>
    <div class="big-stat"><span class="big-num">${b.total}</span><span class="big-unit">good choice${b.total === 1 ? '' : 's'}</span></div>
    ${b.chips.length ? `<div class="hero-sub">That’s already:</div><div class="chips" style="color:${C.goodDark}">${b.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : ''}
    <div class="hero-sub">Real, not projected. Yours since ${since}, whatever happens next.</div>
  </section>`;
}

/* Swipeable hero: scroll-snap slides + dot indicator. */
let heroIndex = 0;
const SLIDE_NAMES = ['Your path', 'Streak', 'Banked'];
function heroCarousel(slides) {
  if (slides.length === 1) return slides[0];
  return `<div class="carousel" aria-roledescription="carousel" aria-label="Your progress">
    <div class="slides" id="slides">${slides.map((h, i) => `<div class="slide" role="group" aria-roledescription="slide" aria-label="${SLIDE_NAMES[i]}, ${i + 1} of ${slides.length}">${h}</div>`).join('')}</div>
    <div class="dots">${slides.map((_, i) => `<button class="dot${i === heroIndex ? ' on' : ''}" data-slide="${i}" aria-label="Show ${SLIDE_NAMES[i]}"${i === heroIndex ? ' aria-current="true"' : ''}></button>`).join('')}</div>
  </div>`;
}
const slideStep = (el) => el.firstElementChild.offsetWidth + parseFloat(getComputedStyle(el).columnGap || 0);
function wireCarousel() {
  const el = document.getElementById('slides');
  if (!el) return;
  heroIndex = Math.min(heroIndex, el.children.length - 1);
  el.scrollLeft = heroIndex * slideStep(el);
  el.addEventListener('scroll', () => {
    const i = Math.round(el.scrollLeft / slideStep(el));
    if (i === heroIndex) return;
    heroIndex = i;
    document.querySelectorAll('.dot').forEach((d, j) => { d.classList.toggle('on', j === i); d.toggleAttribute('aria-current', j === i); });
  }, { passive: true });
  // Touch and trackpads swipe natively; give a mouse the same drag-to-swipe.
  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.classList.add('dragging');
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    el.scrollLeft = drag.left - dx;
  });
  const end = () => {
    if (!drag) return;
    const step = slideStep(el), dx = el.scrollLeft - drag.left;
    // A short flick is enough to move one slide.
    const target = Math.abs(dx) > step * 0.15 ? Math.round(drag.left / step) + Math.sign(dx) : Math.round(drag.left / step);
    el.classList.remove('dragging');
    drag = null;
    showSlide(Math.max(0, Math.min(el.children.length - 1, target)));
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
function showSlide(i) {
  const el = document.getElementById('slides');
  el.scrollTo({ left: i * slideStep(el), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function home() {
  const tiles = data.levers.map(l => {
    const t = tileInfo(l, data.events);
    return `<a class="tile ${groupOf(l)}" href="#/lever/${l.id}">
      <span class="tile-name"><span>${esc(l.name)}</span>${spark(t.trend, groupOf(l))}</span>
      <span class="tile-fact ${t.bad ? 'bad' : ''}">${t.fact}</span></a>`;
  }).join('');
  app.innerHTML = `<main class="screen">
    <header class="row"><h1 class="brand">Make It Count</h1><button class="link" id="install" hidden>Install app</button></header>
    ${heroCarousel(data.levers.length ? [hero(heroSummary(data.levers, data.events, H.weeks)), streakSlide(), bankedSlide()] : [hero(heroSummary(data.levers, data.events, H.weeks))])}
    ${data.levers.length ? '<div class="section-label">Tap before you choose</div>' : ''}
    ${data.levers.length
      ? `<div class="grid2">${tiles}<a class="tile tile-add" href="#/add">+ Add a lever</a></div>`
      : '<a class="btn-primary btn-start" href="#/add">Start now: pick your first habit</a>'}
    <footer class="footer">
      <span>Your data stays on this device.</span>
      <span><button class="link" id="export">Back up</button> · <button class="link" id="import">Restore</button></span>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </footer>
    <div class="version">v${VERSION}</div>
  </main>`;
  updateInstallButton();
  wireCarousel();
}

/* ================= Decision ================= */
let dec = null; // { id, v, drag }
// The choice is wherever NOW is left: past ±60% it's a pending skip/have, logged only when Done is pressed.
const pending = () => (dec && dec.pend) || null;

/* Hysteresis: every on-screen state flips at one threshold and only flips back at a lower one,
   so a finger resting near a boundary can't make the screen flicker between states. */
const hyst = (cur, x, enter, exit) => cur === 'up' ? (x < -enter ? 'down' : x < exit ? 'rest' : 'up')
  : cur === 'down' ? (x > enter ? 'up' : x > -exit ? 'rest' : 'down')
  : (x > enter ? 'up' : x < -enter ? 'down' : 'rest');
/* Three states only: rest (centre), up, down. Hysteresis stops a wobbling finger flipping between them. */
const DEAD = 0.1;   // inside this, NOW is "at rest"; the line has crossed old-you by the time you leave it
function settle() {
  dec.zone = hyst(dec.zone || 'rest', dec.v, 0.18, DEAD);
  const p = hyst(dec.pend === 'y' ? 'up' : dec.pend === 'n' ? 'down' : 'rest', dec.v, 0.6, 0.47);
  dec.pend = p === 'up' ? 'y' : p === 'down' ? 'n' : null;  // Done card
}
/* Where summer-you ends up for a given drag v, starting from your current pace B.
   Moving with your pace: straight from B towards ±1. Moving against it: back to old-you
   by the edge of the dead zone, then on to the other side, so the line is always on the
   side the headline and panel describe. */
function summerAt(v, B) {
  const s = Math.sign(v) || 1, a = Math.abs(v);
  if (s * B >= 0) return B + v * (1 - Math.abs(B));
  if (a <= DEAD) return B * (1 - a / DEAD);
  return s * (a - DEAD) / (1 - DEAD);
}

function decisionShell(lever) {
  const c = copyFor(lever), f = flipOf(lever), [yesDir, noDir] = f > 0 ? ['up', 'down'] : ['down', 'up'];
  app.innerHTML = `<main class="screen decision">
    <div class="row"><a href="#/" class="back">← Levers</a><a href="#/edit/${lever.id}" class="back">Edit</a></div>
    <h1 class="dec-head" id="dec-head"></h1>
    <p class="muted dec-instr">Grab NOW and move it. Watch summer-you move with it.</p>
    <div class="card chart-card">
      <svg class="drag" id="drag" viewBox="0 15 350 270" tabindex="0" role="slider" aria-orientation="vertical"
        aria-label="${esc(c.q)} Move NOW ${yesDir} to ${esc(c.yesHint)}, ${noDir} to ${esc(c.noHint)}. Press Enter for Done."
        aria-valuemin="-100" aria-valuemax="100"></svg>
      <div class="timeline"><b>now</b>${H.ticks.map(t => `<span>${t}</span>`).join('')}<b>summer</b></div>
    </div>
    <div class="proj" id="proj"></div>
    <div id="result" aria-live="polite"></div>
    <div class="version">v${VERSION}</div>
  </main>`;
  paintDecision();
}

function decisionModel(lever) {
  const c = copyFor(lever), B = leverBase(lever, data.events), f = flipOf(lever);
  const v = dec.v, e = summerAt(v, B);
  settle();
  const ch = pending(), idle = dec.zone === 'rest';
  // One state drives everything: at rest it's your current pace (B); otherwise it's the drag direction.
  const sign = idle ? (Math.abs(B) < 0.08 ? 0 : Math.sign(B)) : (dec.zone === 'up' ? 1 : -1);
  const good = sign > 0, flat = sign === 0, mag = Math.abs(e);
  // v, e and B are "how good" (+1 best); f turns that into screen direction.
  const ny = Math.round(150 - f * v * 50), ey = Math.round(150 - f * e * 118), eyb = Math.round(150 - f * B * 118);
  const col = flat ? C.muted : (good ? C.good : C.bad);
  const head = ch === 'y' ? c.yesHead : ch === 'n' ? c.noHead : idle ? c.q
    : dec.zone === 'up' ? 'You just changed summer.' : 'You just changed summer. For the worse.';
  const headCol = idle ? C.ink : good ? C.good : C.bad;
  // Wording only steps after a clear move, so it can't flicker at a band edge.
  if (idle) dec.pe = undefined;
  else if (dec.pe === undefined || Math.abs(mag - dec.pe) > 0.12 || mag > 0.97) dec.pe = mag;
  const p = flat ? projection(lever, 0, H.weeks) : projection(lever, sign * Math.max(idle ? Math.abs(B) : dec.pe, 0.1), H.weeks);
  return { c, f, B, v, idle, e, mag, good, flat, ny, ey, eyb, col, head, headCol, p,
    line: `M40 ${ny} C 120 ${ny}, 210 ${Math.round((ny + ey) / 2)}, 300 ${ey}`,
    base: `M40 150 C 120 150, 210 ${Math.round((150 + eyb) / 2)}, 300 ${eyb}`,
    projLabel: idle ? 'On your current pace, by summer:' : 'If this becomes your habit, by summer:' };
}

function paintDecision() {
  const lever = data.levers.find(l => l.id === dec.id), m = decisionModel(lever), c = m.c;
  const head = document.getElementById('dec-head');
  head.textContent = m.head; head.style.color = m.headCol;

  const svg = document.getElementById('drag');
  svg.setAttribute('aria-valuenow', Math.round(m.f * m.v * 100));
  svg.setAttribute('aria-valuetext', m.p.text);
  const showBase = !m.idle && Math.abs(m.B) > 0.02;
  // Good half is on top for build-up habits, at the bottom for cut-back ones.
  const up = m.f > 0, gY = up ? 0 : 150, bY = up ? 150 : 0;
  const above = (y) => y <= 150;  // is a point on the upper half of the chart?
  svg.innerHTML = `
    <rect x="0" y="${gY}" width="350" height="150" fill="${C.good}" opacity="0.05"/>
    <rect x="0" y="${bY}" width="350" height="150" fill="${C.bad}" opacity="0.05"/>
    <text x="20" y="${up ? 34 : 278}" class="t-display" font-size="16" fill="${C.good}">${esc(c.top)}</text>
    <text x="20" y="${up ? 278 : 34}" class="t-display" font-size="16" fill="${C.bad}">${esc(c.bot)}</text>
    <text x="20" y="${up ? 54 : 258}" font-size="12" fill="${C.good}">${up ? '↑' : '↓'} ${esc(c.yesHint)}</text>
    <text x="20" y="${up ? 258 : 54}" font-size="12" fill="${C.bad}">${up ? '↓' : '↑'} ${esc(c.noHint)}</text>
    <path d="${m.line} L 300 150 L 40 150 Z" fill="${m.col}" opacity="${(0.06 + m.mag * 0.24).toFixed(2)}"/>
    <path d="M40 150 H300" stroke="${C.ghost}" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/>
    <text x="150" y="${above(m.ey) ? 168 : 140}" font-size="12" fill="${C.muted}">old you</text>
    <path d="${m.base}" fill="none" stroke="${m.B >= 0 ? C.good : C.bad}" stroke-width="3" stroke-linecap="round" opacity="${showBase ? 0.35 : 0}"/>
    <text x="296" y="${m.ey < m.eyb ? m.eyb + 18 : m.eyb - 10}" text-anchor="end" font-size="11" fill="${m.B >= 0 ? C.good : C.bad}" opacity="${showBase ? 0.6 : 0}">your current path</text>
    <path d="${m.line}" fill="none" stroke="${m.col}" stroke-width="5" stroke-linecap="round"/>
    <path d="M318 150 h8 V ${m.ey} h-8" fill="none" stroke="${m.col}" stroke-width="2" opacity="${m.flat ? 0 : 1}"/>
    <circle cx="300" cy="${m.ey}" r="9" fill="${m.col}"/>
    <text x="${Math.abs(m.ey - 150) > 95 ? 282 : 294}" y="${Math.abs(m.ey - 150) > 95 ? m.ey + 7 : above(m.ey) ? m.ey - 16 : m.ey + 30}" text-anchor="end" class="t-display" font-size="20" fill="${m.col}">${m.flat ? '' : esc(m.good ? c.top : c.bot)}</text>
    <circle cx="40" cy="${m.ny}" r="22" fill="#fff" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="40" cy="${m.ny}" r="8" fill="${C.ink}"/>
    <text x="40" y="${m.ny - 30}" text-anchor="middle" class="t-display" font-size="13" fill="${C.ink}">NOW</text>`;

  // Only touch the panels below when their content actually changes: no repaint churn mid-drag.
  const proj = document.getElementById('proj');
  const projClass = 'proj ' + (m.flat ? '' : m.good ? 'good' : 'bad');
  const projHtml = `<div class="proj-label">${m.projLabel}</div><div class="proj-text">${esc(m.p.text)}</div>${m.p.sub ? `<div class="proj-sub">${esc(m.p.sub)}</div>` : ''}`;
  if (proj.className !== projClass) proj.className = projClass;
  if (proj.dataset.html !== projHtml) { proj.dataset.html = projHtml; proj.innerHTML = projHtml; }

  // The result card always occupies its space (hidden until pending), so the page never
  // changes height or scrolls under your finger while you drag.
  const res = document.getElementById('result'), pend = pending(), state = pend || 'none';
  if (res.dataset.state !== state) {
    res.dataset.state = state;
    const y = pend !== 'n';
    res.innerHTML = `<div class="result ${pend ? (y ? 'good' : 'bad') : 'placeholder'}" ${pend ? '' : 'aria-hidden="true"'}>
      <div>${esc(y ? c.yesText(lever.vals) : c.noText(lever.vals))}</div>
      <div class="row-end"><button class="btn-ghost" id="done" ${pend ? '' : 'tabindex="-1" disabled'}>Done</button></div></div>`;
  }
  seasonalise(app);
}

function done() {
  const choice = pending();
  if (!choice) return;
  data.events.push({ id: uid(), leverId: dec.id, t: Date.now(), c: choice }); persist();
  if (navigator.vibrate) navigator.vibrate(choice === 'y' ? 30 : [20, 40, 20]);
  location.hash = '#/';
}
function release() { // NOW stays where you leave it; nothing is logged until Done
  // Let go near the centre and it settles exactly at the centre: back to "on your current pace".
  if (dec.zone === 'rest' || Math.abs(dec.v) < 0.18) { dec.v = 0; dec.zone = 'rest'; dec.pend = null; }
  paintDecision();
  const card = document.querySelector('#result .result:not(.placeholder)');
  if (card) card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

const yOf = (ev, el) => { const r = el.getBoundingClientRect(); return 15 + (ev.clientY - r.top) / r.height * 270; };
app.addEventListener('pointerdown', (ev) => {
  const svg = ev.target.closest('#drag');
  if (!svg || !dec) return;
  ev.preventDefault();
  svg.setPointerCapture(ev.pointerId);
  dec.drag = true;
  // Grab offset: dragging is relative to where you grabbed, so the handle never jumps.
  dec.grabY = yOf(ev, svg); dec.grabV = dec.v;
});
app.addEventListener('pointermove', (ev) => {
  if (!dec || !dec.drag) return;
  const svg = document.getElementById('drag');
  dec.v = clamp(dec.grabV + dec.f * (dec.grabY - yOf(ev, svg)) / 50);
  paintDecision();
});
const endDrag = () => { if (dec && dec.drag) { dec.drag = false; release(); } };
app.addEventListener('pointerup', endDrag);
app.addEventListener('pointercancel', endDrag);

app.addEventListener('keydown', (ev) => {
  if (ev.target.id !== 'drag' || !dec) return;
  const k = ev.key;
  if (k === 'ArrowUp' || k === 'ArrowRight') dec.v = clamp(dec.v + 0.2 * dec.f);  // keys move NOW on screen
  else if (k === 'ArrowDown' || k === 'ArrowLeft') dec.v = clamp(dec.v - 0.2 * dec.f);
  else if (k === 'Enter' || k === ' ') { done(); ev.preventDefault(); return; }
  else if (k === 'Escape') dec.v = 0;
  else return;
  ev.preventDefault();
  paintDecision();
});

/* ================= Add / edit lever ================= */
let form = null; // { id?, type, name, vals }

function formScreen() {
  const t = TYPES[form.type], editing = !!form.id;
  app.innerHTML = `<main class="screen form">
    <div class="row"><h1 class="form-title">${editing ? 'Edit lever' : 'New lever'}</h1><a href="${editing ? `#/lever/${form.id}` : '#/'}" class="back">Cancel</a></div>
    ${editing ? '' : TYPE_GROUPS.map(([label, keys]) => `<div class="type-group"><div class="type-group-label">${label}</div>
      <div class="pills" role="radiogroup" aria-label="${label}">${keys.map(k => `<button class="pill ${k === form.type ? 'on' : ''}" role="radio" aria-checked="${k === form.type}" data-type="${k}">${esc(TYPES[k].label)}</button>`).join('')}</div></div>`).join('')}
    <label class="field">Name
      <input id="name" type="text" maxlength="40" value="${esc(form.name)}" autocomplete="off">
    </label>
    <div class="card sliders">
      ${t.fields.map(([k, l, mn, mx, st, , u]) => `<label class="slider">
        <span class="slider-top"><span>${l}</span><b id="val-${k}">${fmt(u, form.vals[k])}</b></span>
        <input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${st}" value="${form.vals[k]}"></label>`).join('')}
      <div class="muted small">Typical values to start. Close enough is fine.</div>
    </div>
    <div class="add-proj" id="addproj"></div>
    <button class="btn-primary" id="save">${editing ? 'Save' : 'Add lever'}</button>
    ${editing ? '<button class="btn-danger" id="delete">Delete lever</button>' : ''}
    <div class="version">v${VERSION}</div>
  </main>`;
  paintAddProj();
}
function paintAddProj() {
  const [head, lines] = addPreview(form.type, form.vals, H.weeks);
  document.getElementById('addproj').innerHTML = `<div class="add-proj-head">${head}</div>` + lines.map(x => `<div class="add-proj-line">${esc(x)}</div>`).join('');
  seasonalise(document.getElementById('addproj'));
}
function saveForm() {
  const name = form.name.trim() || TYPES[form.type].name;
  if (form.id) {
    const l = data.levers.find(x => x.id === form.id);
    Object.assign(l, { name, vals: { ...form.vals } });
    persist(); nav(`#/lever/${l.id}`);
  } else {
    const l = { id: uid(), type: form.type, name, vals: { ...form.vals }, created: Date.now() };
    data.levers.push(l); persist(); requestPersist(); nav('#/');
  }
}
function deleteLever() {
  const l = data.levers.find(x => x.id === form.id);
  if (!confirm(`Delete “${l.name}” and its history? This can’t be undone.`)) return;
  data.levers = data.levers.filter(x => x.id !== l.id);
  data.events = data.events.filter(e => e.leverId !== l.id);
  persist(); nav('#/');
}

/* ================= Backup ================= */
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'make-it-count', version: 1, exported: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `make-it-count-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function importData(file) {
  try {
    const d = JSON.parse(await file.text());
    if (!isValid(d)) throw new Error('bad');
    if (!confirm(`Replace everything on this device with ${d.levers.length} lever(s) from the backup?`)) return;
    data = migrate({ levers: d.levers, events: d.events }); persist(); render();
  } catch { alert('That file isn’t a Make It Count backup.'); }
}

/* ================= Install prompt ================= */
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; updateInstallButton(); });
window.addEventListener('appinstalled', () => { installEvt = null; updateInstallButton(); });
const isInstalled = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)').matches || navigator.standalone === true;
function updateInstallButton() { const b = document.getElementById('install'); if (b) b.hidden = !installEvt || isInstalled(); }

/* ================= Events & render ================= */
app.addEventListener('click', async (e) => {
  const id = e.target.closest('button')?.id;
  if (id === 'done') return done();
  if (id === 'save') return saveForm();
  if (id === 'delete') return deleteLever();
  if (id === 'export') return exportData();
  if (id === 'import') return document.getElementById('import-file').click();
  if (id === 'install' && installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; return updateInstallButton(); }
  const dot = e.target.closest('[data-slide]');
  if (dot) return showSlide(Number(dot.dataset.slide));
  const t = e.target.closest('[data-type]');
  if (t && form && !form.id) { form = { type: t.dataset.type, name: TYPES[t.dataset.type].name, vals: defaults(t.dataset.type) }; formScreen(); }
});
app.addEventListener('input', (e) => {
  const r = e.target;
  if (r.id === 'name' && form) { form.name = r.value; return; }
  if (r.dataset?.k && form) {
    form.vals[r.dataset.k] = Number(r.value);
    const f = TYPES[form.type].fields.find(x => x[0] === r.dataset.k);
    document.getElementById('val-' + r.dataset.k).textContent = fmt(f[6], form.vals[r.dataset.k]);
    paintAddProj();
  }
});
app.addEventListener('change', (e) => { if (e.target.id === 'import-file' && e.target.files[0]) importData(e.target.files[0]); });
app.addEventListener('submit', (e) => e.preventDefault());

function render() {
  const r = route();
  dec = null; form = null;
  if (r.name === 'decision') { const l = data.levers.find(x => x.id === r.id); dec = { id: r.id, v: 0, drag: false, f: flipOf(l) }; decisionShell(l); }
  else if (r.name === 'form') {
    const l = r.id && data.levers.find(x => x.id === r.id);
    form = l ? { id: l.id, type: l.type, name: l.name, vals: { ...defaults(l.type), ...l.vals } } : { type: 'snack', name: TYPES.snack.name, vals: defaults('snack') };
    formScreen();
  } else home();
  window.scrollTo(0, 0);
  seasonalise(app);
}
window.addEventListener('hashchange', render);
// Another tab changed the data: pick it up.
window.addEventListener('storage', () => { data = migrate(load()); if (!dec?.drag) render(); });
render();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
