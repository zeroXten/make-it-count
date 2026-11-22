import { load, save, uid, isValid, requestPersist } from './storage.js';
import { TYPES, TYPE_ORDER, defaults, copyFor, fmt, horizon, projection, tileInfo, leverBase, heroSummary, addPreview } from './model.js';

const C = { good: '#1B6B4F', bad: '#C0362C', ink: '#16181B', muted: '#5B6068', ghost: '#9A9EA5', goodDark: '#7FD1AE', badDark: '#FF8A7A' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (x) => Math.max(-1, Math.min(1, x));
const app = document.getElementById('app');

let data = load();
const persist = () => save(data);
const H = horizon();

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
function spark(trend) {
  const P = { up: [C.good, 'M2 18 C 14 17, 26 10, 42 3'], flat: ['#8A8F96', 'M2 15 C 14 15, 28 14, 42 14'], down: [C.bad, 'M2 15 C 12 6, 20 4, 26 7 C 32 10, 38 14, 42 16'] }[trend];
  return `<svg width="44" height="22" viewBox="0 0 44 22" aria-hidden="true"><path d="M2 15 H42" stroke="#C9C4B9" stroke-width="1.5" stroke-dasharray="3 3"/><path d="${P[1]}" fill="none" stroke="${P[0]}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}

function hero(s) {
  if (s.state === 'empty' || s.state === 'quiet') {
    const empty = s.state === 'empty';
    return `<section class="hero">
      <div class="hero-head">${empty ? 'Pick the habits you want to move.' : 'Every choice from here moves summer-you.'}</div>
      <svg class="hero-chart" viewBox="0 76 310 54" role="img" aria-label="Your line level with the old-you line">
        <path d="M6 100 C 100 100, 200 99, 262 98" fill="none" stroke="#8A8F96" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"/>
        <path d="M6 100 C 60 99, 120 98, 150 98" fill="none" stroke="${C.goodDark}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="150" cy="98" r="6" fill="${C.goodDark}"/>
        <text x="266" y="102" font-size="12" fill="#B9BDC4">old you</text>
        <text x="6" y="124" font-size="11" fill="#8A8F96">now</text><text x="236" y="124" font-size="11" fill="#8A8F96">summer</text>
      </svg>
      <div class="hero-sub">${empty ? 'Add a lever — a snack, a drink, a workout, a bedtime. Then open it the moment you’re choosing.' : 'Open a lever the moment you’re choosing, and move NOW.'}</div>
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

function home() {
  const tiles = data.levers.map(l => {
    const t = tileInfo(l, data.events);
    return `<a class="tile" href="#/lever/${l.id}">
      <span class="tile-name"><span>${esc(l.name)}</span>${spark(t.trend)}</span>
      <span class="tile-fact ${t.bad ? 'bad' : ''}">${t.fact}</span></a>`;
  }).join('');
  app.innerHTML = `<main class="screen">
    <header class="row"><h1 class="brand">Make It Count</h1><button class="link" id="install" hidden>Install app</button></header>
    ${hero(heroSummary(data.levers, data.events, H.weeks))}
    ${data.levers.length ? '<div class="section-label">Tap before you choose</div>' : ''}
    <div class="grid2">${tiles}<a class="tile tile-add" href="#/add">+ Add ${data.levers.length ? 'a' : 'your first'} lever</a></div>
    <footer class="footer">
      <span>Your data stays on this device.</span>
      <span><button class="link" id="export">Back up</button> · <button class="link" id="import">Restore</button></span>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </footer>
  </main>`;
  updateInstallButton();
}

/* ================= Decision ================= */
let dec = null; // { id, v, drag, choice, eventId }

function decisionShell(lever) {
  const c = copyFor(lever);
  app.innerHTML = `<main class="screen decision">
    <div class="row"><a href="#/" class="back">← Levers</a><a href="#/edit/${lever.id}" class="back">Edit</a></div>
    <h1 class="dec-head" id="dec-head"></h1>
    <p class="muted dec-instr">Grab NOW and move it. Watch summer-you move with it.</p>
    <div class="card chart-card">
      <svg class="drag" id="drag" viewBox="0 15 350 270" tabindex="0" role="slider" aria-orientation="vertical"
        aria-label="${esc(c.q)} Move NOW up to ${esc(c.up.slice(2))}, down to ${esc(c.down.slice(2))}. Press Enter to commit."
        aria-valuemin="-100" aria-valuemax="100"></svg>
      <div class="timeline"><b>now</b>${H.ticks.map(t => `<span>${t}</span>`).join('')}<b>summer</b></div>
    </div>
    <div class="proj" id="proj"></div>
    <div id="result" aria-live="polite"></div>
  </main>`;
  paintDecision();
}

function decisionModel(lever) {
  const c = copyFor(lever), B = leverBase(lever, data.events);
  const v = dec.v, ch = dec.choice, idle = Math.abs(v) < 0.05 && !ch;
  const e = v >= 0 ? B + v * (1 - B) : B + v * (1 + B); // effective summer position
  const mag = Math.abs(e), good = e > 0, flat = mag < 0.08;
  const ny = Math.round(150 - v * 50), ey = Math.round(150 - e * 118), eyb = Math.round(150 - B * 118);
  const col = flat ? C.muted : (good ? C.good : C.bad);
  const head = ch === 'y' ? c.yesHead : ch === 'n' ? c.noHead : idle ? c.q : (v > 0 ? 'You just changed summer.' : 'You just changed summer. For the worse.');
  const headCol = (ch === 'n' || (!ch && !idle && v < 0)) ? C.bad : (ch === 'y' || (!ch && !idle && v > 0)) ? C.good : C.ink;
  const p = projection(lever, e, H.weeks);
  return { c, B, v, idle, e, mag, good, flat, ny, ey, eyb, col, head, headCol, p,
    line: `M40 ${ny} C 120 ${ny}, 210 ${Math.round((ny + ey) / 2)}, 300 ${ey}`,
    base: `M40 150 C 120 150, 210 ${Math.round((150 + eyb) / 2)}, 300 ${eyb}`,
    projLabel: idle ? 'On your current pace, by summer:' : 'If this becomes your habit, by summer:' };
}

function paintDecision() {
  const lever = data.levers.find(l => l.id === dec.id), m = decisionModel(lever), c = m.c;
  const head = document.getElementById('dec-head');
  head.textContent = m.head; head.style.color = m.headCol;

  const svg = document.getElementById('drag');
  svg.setAttribute('aria-valuenow', Math.round(m.v * 100));
  svg.setAttribute('aria-valuetext', m.p.text);
  svg.classList.toggle('locked', !!dec.choice);
  const showBase = !m.idle && Math.abs(m.B) > 0.02;
  svg.innerHTML = `
    <rect x="0" y="0" width="350" height="150" fill="${C.good}" opacity="0.05"/>
    <rect x="0" y="150" width="350" height="150" fill="${C.bad}" opacity="0.05"/>
    <text x="20" y="34" class="t-display" font-size="16" fill="${C.good}">${esc(c.top)}</text>
    <text x="20" y="278" class="t-display" font-size="16" fill="${C.bad}">${esc(c.bot)}</text>
    <text x="20" y="54" font-size="12" fill="${C.good}">${esc(c.up)}</text>
    <text x="20" y="258" font-size="12" fill="${C.bad}">${esc(c.down)}</text>
    <path d="${m.line} L 300 150 L 40 150 Z" fill="${m.col}" opacity="${(0.06 + m.mag * 0.24).toFixed(2)}"/>
    <path d="M40 150 H300" stroke="${C.ghost}" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/>
    <text x="150" y="${m.e >= 0 ? 168 : 140}" font-size="12" fill="${C.muted}">old you</text>
    <path d="${m.base}" fill="none" stroke="${m.B >= 0 ? C.good : C.bad}" stroke-width="3" stroke-linecap="round" opacity="${showBase ? 0.35 : 0}"/>
    <text x="296" y="${m.e > m.B ? m.eyb + 18 : m.eyb - 10}" text-anchor="end" font-size="11" fill="${m.B >= 0 ? C.good : C.bad}" opacity="${showBase ? 0.6 : 0}">your current path</text>
    <path d="${m.line}" fill="none" stroke="${m.col}" stroke-width="5" stroke-linecap="round"/>
    <path d="M318 150 h8 V ${m.ey} h-8" fill="none" stroke="${m.col}" stroke-width="2" opacity="${m.flat ? 0 : 1}"/>
    <circle cx="300" cy="${m.ey}" r="9" fill="${m.col}"/>
    <text x="${Math.abs(m.ey - 150) > 95 ? 282 : 294}" y="${Math.abs(m.ey - 150) > 95 ? m.ey + 7 : m.e >= 0 ? m.ey - 16 : m.ey + 30}" text-anchor="end" class="t-display" font-size="20" fill="${m.col}">${m.flat ? '' : esc(m.good ? c.top : c.bot)}</text>
    <circle cx="40" cy="${m.ny}" r="22" fill="#fff" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="40" cy="${m.ny}" r="8" fill="${C.ink}"/>
    <text x="40" y="${m.ny - 30}" text-anchor="middle" class="t-display" font-size="13" fill="${C.ink}">NOW</text>`;

  const proj = document.getElementById('proj');
  proj.className = 'proj ' + (m.flat ? '' : m.good ? 'good' : 'bad');
  proj.innerHTML = `<div class="proj-label">${m.projLabel}</div><div class="proj-text">${esc(m.p.text)}</div>${m.p.sub ? `<div class="proj-sub">${esc(m.p.sub)}</div>` : ''}`;

  const res = document.getElementById('result');
  if (dec.choice && !res.dataset.shown) {
    const y = dec.choice === 'y';
    res.dataset.shown = '1';
    res.innerHTML = `<div class="result ${y ? 'good' : 'bad'}">
      <div>${esc(y ? c.yesText(lever.vals) : c.noText(lever.vals))}</div>
      <div class="row-start"><button class="btn-ghost" id="undo">Undo</button><a class="btn-ghost" href="#/">Done</a></div></div>`;
    res.firstElementChild.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  } else if (!dec.choice && res.dataset.shown) {
    delete res.dataset.shown; res.innerHTML = '';
  }
}

function commit(choice) {
  dec.v = choice === 'y' ? 1 : -1;
  dec.choice = choice;
  const ev = { id: uid(), leverId: dec.id, t: Date.now(), c: choice };
  dec.eventId = ev.id;
  data.events.push(ev); persist();
  if (navigator.vibrate) navigator.vibrate(choice === 'y' ? 30 : [20, 40, 20]);
  paintDecision();
}
function undo() {
  data.events = data.events.filter(e => e.id !== dec.eventId); persist();
  dec.choice = null; dec.eventId = null; dec.v = 0;
  paintDecision();
  document.getElementById('drag').focus();
}
function release() {
  if (dec.v > 0.6) commit('y');
  else if (dec.v < -0.6) commit('n');
  else { dec.v = 0; paintDecision(); }
}

const yOf = (ev, el) => { const r = el.getBoundingClientRect(); return 15 + (ev.clientY - r.top) / r.height * 270; };
app.addEventListener('pointerdown', (ev) => {
  const svg = ev.target.closest('#drag');
  if (!svg || !dec || dec.choice) return;
  ev.preventDefault();
  svg.setPointerCapture(ev.pointerId);
  dec.drag = true;
  // Grab offset: dragging is relative to where you grabbed, so the handle never jumps.
  dec.grabY = yOf(ev, svg); dec.grabV = dec.v;
});
app.addEventListener('pointermove', (ev) => {
  if (!dec || !dec.drag) return;
  const svg = document.getElementById('drag');
  dec.v = clamp(dec.grabV + (dec.grabY - yOf(ev, svg)) / 50);
  paintDecision();
});
const endDrag = () => { if (dec && dec.drag) { dec.drag = false; release(); } };
app.addEventListener('pointerup', endDrag);
app.addEventListener('pointercancel', endDrag);

app.addEventListener('keydown', (ev) => {
  if (ev.target.id !== 'drag' || !dec || dec.choice) return;
  const k = ev.key;
  if (k === 'ArrowUp' || k === 'ArrowRight') dec.v = clamp(dec.v + 0.2);
  else if (k === 'ArrowDown' || k === 'ArrowLeft') dec.v = clamp(dec.v - 0.2);
  else if (k === 'Enter' || k === ' ') { release(); ev.preventDefault(); return; }
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
    ${editing ? '' : `<div class="pills" role="radiogroup" aria-label="Lever type">${TYPE_ORDER.map(k => `<button class="pill ${k === form.type ? 'on' : ''}" role="radio" aria-checked="${k === form.type}" data-type="${k}">${esc(TYPES[k].label)}</button>`).join('')}</div>`}
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
  </main>`;
  paintAddProj();
}
function paintAddProj() {
  const [head, lines] = addPreview(form.type, form.vals, H.weeks);
  document.getElementById('addproj').innerHTML = `<div class="add-proj-head">${head}</div>` + lines.map(x => `<div class="add-proj-line">${esc(x)}</div>`).join('');
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
    data = { levers: d.levers, events: d.events }; persist(); render();
  } catch { alert('That file isn’t a Make It Count backup.'); }
}

/* ================= Install prompt ================= */
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; updateInstallButton(); });
window.addEventListener('appinstalled', () => { installEvt = null; updateInstallButton(); });
function updateInstallButton() { const b = document.getElementById('install'); if (b) b.hidden = !installEvt; }

/* ================= Events & render ================= */
app.addEventListener('click', async (e) => {
  const id = e.target.closest('button')?.id;
  if (id === 'undo') return undo();
  if (id === 'save') return saveForm();
  if (id === 'delete') return deleteLever();
  if (id === 'export') return exportData();
  if (id === 'import') return document.getElementById('import-file').click();
  if (id === 'install' && installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; return updateInstallButton(); }
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
  if (r.name === 'decision') { dec = { id: r.id, v: 0, drag: false, choice: null }; decisionShell(data.levers.find(l => l.id === r.id)); }
  else if (r.name === 'form') {
    const l = r.id && data.levers.find(x => x.id === r.id);
    form = l ? { id: l.id, type: l.type, name: l.name, vals: { ...defaults(l.type), ...l.vals } } : { type: 'snack', name: TYPES.snack.name, vals: defaults('snack') };
    formScreen();
  } else home();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
// Another tab changed the data: pick it up.
window.addEventListener('storage', () => { data = load(); if (!dec?.drag) render(); });
render();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
