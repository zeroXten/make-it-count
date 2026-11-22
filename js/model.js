/* Lever types, copy, and the (deliberately loose) projection model.
   Numbers exist only to choose an everyday comparison. They are never shown. */

const DAY = 864e5;
const MONTH = 28 * DAY;

/* ---------- Lever types ----------
   group 'less' = a habit to cut back (up means skipping it).
   group 'more' = a habit to build up (up means doing it).
   fields: [key, label, min, max, step, default, unit]
   Outcome flags pick which everyday comparisons a type uses:
     kcal: weight (value = how much of the calorie figure counts), cost: money, time: evenings.
   levels: qualitative outcome by drag distance. chip: [gain, loss] words for the home hero. */
const SKIP_UP = { up: '↑ skip it', down: '↓ have it' };
const DO_UP = { up: '↑ do it now', down: '↓ skip it' };
const fitLevels = (good, bad) => ({ good: [[0.45, `a bit ${good[0]}`], [0.8, `noticeably ${good[0]}`], [2, good[1]]], bad: [[0.45, `a bit ${bad[0]}`], [0.8, `noticeably ${bad[0]}`], [2, bad[1]]] });

export const TYPES = {
  /* ----- Cut back ----- */
  snack: {
    group: 'less', label: 'Snacks', name: 'Snack', kcal: 1, cost: true,
    fields: [['kcal', 'Calories each', 0, 800, 10, 150, 'kcal'], ['cost', 'Cost each', 0, 10, 0.05, 0.75, 'gbp'], ['usual', 'Usually, per week', 0, 42, 1, 14, 'wk']],
    copy: { q: 'Snack?', top: 'lighter', bot: 'heavier', ...SKIP_UP, small: ['a little lighter', 'a little heavier'],
      goodSub: 'Clothes fit better. More energy. Less puffed on the stairs.',
      badSub: 'Tighter jeans. Less energy. Same summer as last year, only heavier.',
      yesText: () => 'Skipped. Clothes that fit better, more energy, less puffed on the stairs. That’s what you just chose.',
      noText: () => 'Had it. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} skipped this month` }
  },
  sweets: {
    group: 'less', label: 'Sweets & desserts', name: 'Sweet treats', kcal: 1, cost: true,
    fields: [['kcal', 'Calories each', 0, 1000, 10, 250, 'kcal'], ['cost', 'Cost each', 0, 10, 0.1, 0, 'gbp'], ['usual', 'Usually, per week', 0, 28, 1, 5, 'wk']],
    copy: { q: 'Sweet treat?', top: 'lighter', bot: 'heavier', ...SKIP_UP, small: ['a little lighter', 'a little heavier'],
      goodSub: 'Clothes fit better. Steadier energy. No sugar crash.',
      badSub: 'Tighter jeans. Sugar crashes. Same summer as last year, only heavier.',
      yesText: () => 'Skipped. Clothes that fit better, steadier energy. That’s what you just chose.',
      noText: () => 'Had it. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} skipped this month` }
  },
  alcohol: {
    group: 'less', label: 'Alcohol', name: 'Alcohol', kcal: 1, cost: true,
    fields: [['kcal', 'Calories per drink', 0, 600, 10, 180, 'kcal'], ['cost', 'Cost per drink', 0, 20, 0.1, 5, 'gbp'], ['usual', 'Drinks, usually per week', 0, 70, 1, 10, 'wk']],
    copy: { q: 'Drink?', top: 'lighter', bot: 'heavier', up: '↑ not this one', down: '↓ have it', small: ['a little lighter', 'a little heavier'],
      goodSub: 'Better sleep. Clearer mornings. Money in your pocket.',
      badSub: 'Heavier. Foggier mornings. Money gone.',
      yesText: () => 'Skipped. Better sleep, clearer mornings, money kept. That’s what you just chose.',
      noText: () => 'Had it. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} skipped this month` }
  },
  takeaway: {
    group: 'less', label: 'Takeaways', name: 'Takeaway', kcal: 1, cost: true,
    fields: [['kcal', 'Extra calories vs cooking', 0, 2000, 50, 500, 'kcal'], ['cost', 'Extra cost vs cooking', 0, 60, 1, 12, 'gbp'], ['usual', 'Usually, per week', 0, 21, 1, 2, 'wk']],
    copy: { q: 'Takeaway?', top: 'lighter', bot: 'heavier', up: '↑ cook instead', down: '↓ order it', small: ['a little lighter', 'a little heavier'],
      goodSub: 'Lighter. Richer. Feeling better for it.',
      badSub: 'Heavier. Poorer. Sluggish evenings.',
      yesText: () => 'Cooking it is. Lighter, richer, feeling better. That’s what you just chose.',
      noText: () => 'Ordered. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} cooked instead this month` }
  },
  smoking: {
    group: 'less', label: 'Smoking & vaping', name: 'Smoking', cost: true,
    fields: [['cost', 'Cost each (cigarette, vape session…)', 0, 2, 0.05, 0.8, 'gbp'], ['usual', 'Usually, per week', 0, 420, 5, 70, 'wk']],
    copy: { q: 'Smoke?', top: 'healthier', bot: 'less healthy', ...SKIP_UP, small: ['a little healthier', 'a little less healthy'],
      ...fitLevels(['healthier', 'properly healthier'], ['wheezier', 'short of breath']),
      goodSub: 'Easier breathing. Better taste and smell. Money kept.',
      badSub: 'Shorter breath. Money up in smoke.',
      yesText: () => 'Skipped. Easier breathing, money kept. That’s what you just chose.',
      noText: () => 'Had one. You just pulled summer-you down. Make the next one count.',
      chip: ['healthier', 'health'], fact: (n) => `${n} skipped this month` }
  },
  screen: {
    group: 'less', label: 'Screen time', name: 'Scrolling', time: true,
    fields: [['min', 'Minutes each time', 5, 180, 5, 20, 'min'], ['usual', 'Times, usually per week', 0, 140, 1, 28, 'wk']],
    copy: { q: null, top: 'more time', bot: 'less time', up: '↑ put it down', down: '↓ carry on', small: ['a little time back', 'a little time lost'],
      goodSub: 'Time for the things you keep putting off. Better sleep. A calmer head.',
      badSub: 'Evenings gone to the feed, with nothing to show for them.',
      yesText: () => 'Put down. That’s time back for things that matter. That’s what you just chose.',
      noText: () => 'Carried on. That time doesn’t come back. Make the next one count.',
      fact: (n) => `${n} put down this month` }
  },
  spending: {
    group: 'less', label: 'Spending', name: 'Impulse buys', cost: true,
    fields: [['cost', 'Typical cost', 0, 500, 5, 25, 'gbp'], ['usual', 'Usually, per week', 0, 21, 1, 3, 'wk']],
    copy: { q: 'Buy it?', top: 'richer', bot: 'poorer', up: '↑ leave it', down: '↓ buy it', small: ['a little richer', 'a little poorer'],
      goodSub: 'Money for things you actually want. Less clutter.',
      badSub: 'Money gone on things you’ll forget you bought.',
      yesText: () => 'Left it. That money’s going somewhere better. That’s what you just chose.',
      noText: () => 'Bought it. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} left on the shelf this month` }
  },

  /* ----- Build up ----- */
  exercise: {
    group: 'more', label: 'Exercise', name: 'Exercise', kcal: 0.6, // trackers overestimate burn
    fields: [['min', 'Minutes each', 5, 240, 5, 30, 'min'], ['kcal', 'Calories burned (0 if not sure)', 0, 2000, 10, 200, 'kcal'], ['usual', 'Usually, per week', 0, 14, 1, 2, 'wk']],
    copy: { q: null, top: 'fitter', bot: 'less fit', ...DO_UP,
      ...fitLevels(['fitter', 'properly fit'], ['less fit', 'back to where you started']),
      goodSub: 'More energy. A stronger body. What was hard feels easy.',
      badSub: 'The fitness you built fades. It all feels hard again.',
      yesText: (v) => `Go. Fitter, stronger, more energy. ${v.min} minutes.`,
      noText: () => 'Skipped. That’s a session summer-you doesn’t get back.',
      chip: ['fitter', 'fitness'], fact: (n) => `${n} sessions this month` },
    preview: { head: 'One more a week, and summer-you is…', lines: () => ['fitter and stronger'] }
  },
  sleep: {
    group: 'more', label: 'Sleep', name: 'Sleep',
    fields: [['gain', 'Extra sleep per early night', 15, 180, 5, 45, 'min'], ['usual', 'Early nights now, per week', 0, 7, 1, 1, 'wk']],
    copy: { q: 'Bed now?', top: 'sharper', bot: 'foggier', up: '↑ go to bed', down: '↓ stay up',
      ...fitLevels(['sharper', 'properly rested'], ['foggier', 'running on fumes']),
      goodSub: 'Clearer mornings. Steadier moods. Better days.',
      badSub: 'Foggy mornings. Shorter fuse. Tomorrow-you pays for tonight.',
      yesText: () => 'Lights out. Clearer mornings, steadier moods. That’s what you just chose.',
      noText: () => 'Staying up. Tomorrow-you pays for tonight. Make the next one count.',
      chip: ['better rested', 'sleep'], fact: (n) => `${n} early nights this month` },
    preview: { head: 'Two more early nights a week, and by summer…', lines: (v, weeks) => {
      const days = 2 * weeks * (v.gain || 45) / 60 / 24;
      return ['fewer foggy mornings', days >= 1.5 ? `${Math.round(days)} extra days of sleep banked` : days >= 1 ? 'a full extra day of sleep banked' : 'hours of sleep banked'];
    } }
  },
  fruit: {
    group: 'more', label: 'Fruit & veg', name: 'Fruit & veg',
    fields: [['usual', 'Portions a week now', 0, 70, 1, 14, 'n']],
    copy: { q: 'Fruit or veg instead?', top: 'more energy', bot: 'less energy', up: '↑ have some', down: '↓ skip it',
      ...fitLevels(['brighter', 'properly well'], ['flat', 'running on empty']),
      goodSub: 'More energy in the afternoons. Better skin. Fewer colds.',
      badSub: 'Afternoon slumps. More colds. Same tired summer.',
      yesText: () => 'Done. More energy, fewer slumps. That’s what you just chose.',
      noText: () => 'Skipped. Summer-you runs a little flatter. Make the next one count.',
      chip: ['more energy', 'energy'], fact: (n) => `${n} extra portions this month` },
    preview: { head: 'One more a day, and by summer…', lines: (v, weeks) => ['more energy in the afternoons', `${Math.round(weeks * 7 / 10) * 10} more portions`] }
  },
  learning: {
    group: 'more', label: 'Learning', name: 'Learning',
    fields: [['min', 'Minutes each', 5, 180, 5, 20, 'min'], ['usual', 'Usually, per week', 0, 21, 1, 3, 'wk']],
    copy: { q: null, top: 'more skilled', bot: 'rustier', ...DO_UP,
      ...fitLevels(['better at it', 'properly good at it'], ['rusty', 'back to where you started']),
      goodSub: 'What was hard comes easily. Something to show for the year.',
      badSub: 'The progress you made fades. Same as last year.',
      yesText: (v) => `Go. ${v.min} minutes closer to properly good at it.`,
      noText: () => 'Skipped. That’s a session summer-you doesn’t get back.',
      chip: ['more skilled', 'progress'], fact: (n) => `${n} sessions this month` },
    preview: { head: 'One more session a week, and by summer…', lines: () => ['noticeably better at it', 'something to show for the year'] }
  },
  mindfulness: {
    group: 'more', label: 'Mindfulness', name: 'Meditation',
    fields: [['min', 'Minutes each', 1, 60, 1, 10, 'min'], ['usual', 'Usually, per week', 0, 21, 1, 3, 'wk']],
    copy: { q: null, top: 'calmer', bot: 'more frazzled', ...DO_UP,
      ...fitLevels(['calmer', 'properly calm'], ['more frazzled', 'frazzled']),
      goodSub: 'Steadier. Less reactive. Better sleep.',
      badSub: 'More frazzled. Shorter fuse. Worse sleep.',
      yesText: (v) => `Go. ${v.min} minutes to a calmer you.`,
      noText: () => 'Skipped. That’s a calmer day summer-you doesn’t get.',
      chip: ['calmer', 'calm'], fact: (n) => `${n} sessions this month` },
    preview: { head: 'One more a week, and by summer…', lines: () => ['calmer', 'less reactive, sleeping better'] }
  }
};
export const TYPE_GROUPS = [
  ['Cut back', Object.keys(TYPES).filter(k => TYPES[k].group === 'less')],
  ['Build up', Object.keys(TYPES).filter(k => TYPES[k].group === 'more')]
];

/* Older saves used different type keys. */
const RENAMED = { practice: 'exercise', dessert: 'sweets', drink: 'alcohol', bed: 'sleep' };
export function migrate(data) {
  for (const l of data.levers) {
    if (RENAMED[l.type]) l.type = RENAMED[l.type];
    if (!TYPES[l.type]) l.type = 'snack';
  }
  return data;
}

export function defaults(type) {
  const v = {};
  TYPES[type].fields.forEach(f => { v[f[0]] = f[5]; });
  return v;
}

export function copyFor(lever) {
  const c = TYPES[lever.type].copy;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  return { ...c, q: c.q || `${lever.name} now?`, yesHead: `${cap(c.top)} by summer.`, noHead: `${cap(c.bot)} by summer.` };
}

export function fmt(unit, v) {
  if (unit === 'kcal') return v + ' kcal';
  if (unit === 'gbp') return '£' + Number(v).toFixed(2);
  if (unit === 'wk') return v + ' a week';
  if (unit === 'min') return v + ' min';
  return String(v);
}

/* ---------- Horizon: a rolling ~6 months, named after the season it lands in ---------- */
const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
export const HORIZON_WEEKS = 26;
export function horizon(now = new Date()) {
  const span = HORIZON_WEEKS * 7 * DAY, target = new Date(now.getTime() + span);
  return {
    weeks: HORIZON_WEEKS,
    season: SEASONS[target.getMonth()],
    ticks: [1, 2, 3].map(i => new Date(now.getTime() + span * i / 4).toLocaleString('en-GB', { month: 'short' }))
  };
}

/* ---------- Comparisons ---------- */
const kgOf = (kcalPerWeek, weeks) => kcalPerWeek * weeks / 7700 * 0.8; // 0.8 ≈ metabolic adaptation
function kgNoun(kg) {
  if (kg < 0.15) return null;
  if (kg < 0.4) return 'a block of butter';
  if (kg < 1.5) return 'a bag of sugar';
  if (kg < 3.5) return 'a bag of potatoes';
  if (kg < 7) return 'a bowling ball';
  return 'a full suitcase';
}
function moneyNoun(gbp) {
  if (gbp < 15) return null;
  if (gbp < 40) return 'a takeaway';
  if (gbp < 120) return 'a nice meal out';
  if (gbp < 350) return 'a weekend away';
  if (gbp < 900) return 'a long weekend in Europe';
  return 'a proper holiday';
}
function timeNoun(hours) { // counted in evenings (~3 free hours each)
  if (hours < 1.5) return null;
  const ev = hours / 3;
  if (ev < 1.5) return 'an evening';
  if (ev <= 90) return `${Math.round(ev)} evenings`;
  return 'months of evenings';
}
const pickLevel = (arr, m) => { for (const [t, w] of arr) if (m <= t) return w; return arr[arr.length - 1][1]; };
const andList = (a) => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

/* Numeric outcomes for `perWeek` occurrences changed, as comparison phrases. */
function outcomes(t, v, perWeek, good, weeks) {
  const parts = [];
  if (t.kcal) { const k = kgNoun(kgOf(perWeek * (v.kcal || 0) * t.kcal, weeks)); if (k) parts.push(`${k} ${good ? 'lighter' : 'heavier'}`); }
  if (t.cost) { const g = moneyNoun(perWeek * (v.cost || 0) * weeks); if (g) parts.push(`${g} ${good ? 'richer' : 'poorer'}`); }
  if (t.time) { const x = timeNoun(Math.min(perWeek * (v.min || 0), 56 * 60) * weeks / 60); if (x) parts.push(`${x} ${good ? 'back' : 'lost'}`); }
  return parts;
}
/* A full drag = cutting out every usual occurrence, or two extra sessions a week. */
const perWeekAt = (t, v, m) => m * (t.group === 'less' ? (v.usual || 0) : 2);

/* What summer-you looks like if position e ∈ [-1, 1] becomes the habit. */
export function projection(lever, e, weeks) {
  const t = TYPES[lever.type], c = t.copy, m = Math.abs(e), good = e > 0, v = lever.vals;
  if (m < 0.08) return { text: 'You, much the same as now.', sub: '' };
  const parts = [];
  if (c.good) parts.push(pickLevel(good ? c.good : c.bad, m));
  parts.push(...outcomes(t, v, perWeekAt(t, v, m), good, weeks));
  if (!parts.length) parts.push(c.small[good ? 0 : 1]);
  return { text: `You, ${andList(parts)}.`, sub: good ? c.goodSub : c.badSub };
}

/* ---------- History ---------- */
export function leverStats(lever, events, now = Date.now()) {
  let y = 0, n = 0, yPrev = 0;
  for (const ev of events) {
    if (ev.leverId !== lever.id) continue;
    const age = now - ev.t;
    if (age < MONTH) { if (ev.c === 'y') y++; else n++; }
    else if (age < 2 * MONTH && ev.c === 'y') yPrev++;
  }
  return { y, n, yPrev };
}

/* Tile: trend + one concrete fact. */
export function tileInfo(lever, events) {
  const s = leverStats(lever, events), c = TYPES[lever.type].copy;
  if (!s.y && !s.n && !s.yPrev) return { trend: 'flat', fact: 'No change yet', bad: false };
  if (s.y < s.yPrev || s.n > s.y) return { trend: 'down', fact: s.y < s.yPrev ? 'Less than last month' : `${s.n} slipped this month`, bad: true };
  if (s.y === 0) return { trend: 'flat', fact: 'No change yet', bad: false };
  return { trend: 'up', fact: c.fact(s.y), bad: false };
}

/* Current-path position for the decision chart, in [-0.75, 0.75]. */
export function leverBase(lever, events) {
  const { y, n } = leverStats(lever, events), total = y + n;
  if (!total) return 0;
  return 0.75 * (y - n) / total * Math.min(1, total / 4);
}

/* Home hero: are you pulling away from the old you, or drifting back? */
export function heroSummary(levers, events, weeks) {
  if (!levers.length) return { state: 'empty' };
  let Y = 0, N = 0;
  const gain = { kcal: 0, gbp: 0, hours: 0, q: new Set() }, loss = { kcal: 0, gbp: 0, hours: 0, q: new Set() };
  for (const l of levers) {
    const { y, n } = leverStats(l, events), t = TYPES[l.type], v = l.vals;
    Y += y; N += n;
    for (const [count, b, i] of [[y, gain, 0], [n, loss, 1]]) {
      if (!count) continue;
      const perWeek = count / 4;
      if (t.kcal) b.kcal += perWeek * (v.kcal || 0) * t.kcal;
      if (t.cost) b.gbp += perWeek * (v.cost || 0) * weeks;
      if (t.time) b.hours += Math.min(perWeek * (v.min || 0), 56 * 60) * weeks / 60;
      if (t.copy.chip) b.q.add(t.copy.chip[i]);
    }
  }
  if (!Y && !N) return { state: 'quiet' };
  const ahead = Y >= N, b = ahead ? gain : loss;
  const k = kgNoun(kgOf(b.kcal, weeks)), g = moneyNoun(b.gbp), x = timeNoun(b.hours);
  const chips = ahead
    ? [k && `${k} lighter`, g, x && `${x} back`, ...b.q].filter(Boolean)
    : [k && 'a lighter summer', g, x, ...b.q].filter(Boolean);
  if (!chips.length) chips.push('a better summer');
  return { state: ahead ? 'ahead' : 'slipping', chips, strength: Math.min(1, 0.35 + Math.abs(Y - N) / 12) };
}

/* Add-lever live preview. */
export function addPreview(type, v, weeks) {
  const t = TYPES[type];
  if (t.group === 'less') {
    const lines = [...(t.copy.good ? [pickLevel(t.copy.good, 0.5)] : []), ...outcomes(t, v, (v.usual || 0) / 2, true, weeks)];
    return ['Cut out half of them, and summer-you is…', lines.length ? lines : ['barely a dent — but it adds up']];
  }
  const extra = outcomes(t, v, 1, true, weeks);
  return [t.preview.head, [...t.preview.lines(v, weeks), ...extra]];
}

/* ---------- Streak: consecutive days where good choices outnumber bad ---------- */
const dayKey = (t) => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
export function streakInfo(events, now = new Date()) {
  const byDay = new Map();
  for (const e of events) {
    const k = dayKey(e.t), d = byDay.get(k) || { y: 0, n: 0 };
    d[e.c]++; byDay.set(k, d);
  }
  const state = (t) => { const d = byDay.get(dayKey(t)); return !d ? 'none' : d.y > 0 && d.y >= d.n ? 'good' : 'bad'; };
  const dayAt = (i) => { const d = new Date(now); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); return d.getTime(); };

  const days = [];
  for (let i = 13; i >= 0; i--) days.push({ state: state(dayAt(i)), today: i === 0 });

  const todayDone = state(dayAt(0)) === 'good';
  let streak = 0;
  for (let i = todayDone ? 0 : 1; state(dayAt(i)) === 'good'; i++) streak++;

  let best = 0, run = 0;
  if (events.length) {
    const first = Math.min(...events.map(e => e.t));
    const span = Math.ceil((dayAt(0) - first) / DAY) + 1;
    for (let i = span; i >= 0; i--) { run = state(dayAt(i)) === 'good' ? run + 1 : 0; best = Math.max(best, run); }
  }
  return { streak, best, todayDone, days };
}

/* Per-lever streaks, best first: same rule, counted on each lever's own choices. */
export function leverStreaks(levers, events, now = new Date()) {
  return levers
    .map(lever => ({ lever, ...streakInfo(events.filter(e => e.leverId === lever.id), now) }))
    .sort((a, b) => b.streak - a.streak || b.best - a.best || a.lever.name.localeCompare(b.lever.name));
}

/* ---------- Banked: what good choices have already earned (real, not projected) ---------- */
export function bankedSummary(levers, events) {
  let total = 0, kcal = 0, gbp = 0, mins = 0, first = Infinity;
  const sessions = [];
  for (const l of levers) {
    const t = TYPES[l.type], v = l.vals;
    const y = events.filter(e => e.leverId === l.id && e.c === 'y');
    if (!y.length) continue;
    total += y.length;
    first = Math.min(first, ...y.map(e => e.t));
    if (t.kcal) kcal += y.length * (v.kcal || 0) * t.kcal;
    if (t.cost) gbp += y.length * (v.cost || 0);
    if (t.time) mins += y.length * (v.min || 0);
    if (t.group === 'more') sessions.push(`${l.name} ×${y.length}`);
  }
  const kg = kcal / 7700 * 0.8, k = kgNoun(kg), hours = mins / 60, x = timeNoun(hours);
  const chips = [
    k && `${k} lighter`,
    gbp >= 1 && `£${Math.round(gbp)} kept`,
    x ? `${x} back` : hours >= 1 ? `${Math.round(hours)} hours back` : null,
    ...sessions
  ].filter(Boolean);
  return { total, chips, since: total ? new Date(first) : null };
}
