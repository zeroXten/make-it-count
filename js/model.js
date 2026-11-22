/* Lever types, copy, and the (deliberately loose) projection model.
   Numbers exist only to choose an everyday comparison. They are never shown. */

const DAY = 864e5;
const MONTH = 28 * DAY;

/* ---------- Lever types ----------
   fields: [key, label, min, max, step, default, unit]
   mode: 'avoid' = up means skipping it; everything else = up means doing it. */
export const TYPES = {
  snack: {
    label: 'Snack', name: 'Evening snack', mode: 'avoid',
    fields: [['kcal', 'Calories each', 0, 600, 10, 100, 'kcal'], ['cost', 'Cost each', 0, 5, 0.1, 0.5, 'gbp'], ['usual', 'Usually, per week', 0, 21, 1, 7, 'wk']],
    copy: {
      q: 'Snack?', top: 'lighter', bot: 'heavier', up: '↑ skip it', down: '↓ have it',
      goodSub: 'Clothes fit better. More energy. Less puffed on the stairs.',
      badSub: 'Tighter jeans. Less energy. Same summer as last year, only heavier.',
      yesText: () => 'Skipped. Clothes that fit better, more energy, less puffed on the stairs. That’s what you just chose.',
      noText: () => 'Had it. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} skipped this month`
    }
  },
  dessert: {
    label: 'Dessert', name: 'Dessert', mode: 'avoid',
    fields: [['kcal', 'Calories each', 0, 800, 10, 250, 'kcal'], ['cost', 'Cost each', 0, 8, 0.1, 0, 'gbp'], ['usual', 'Usually, per week', 0, 14, 1, 5, 'wk']],
    copy: {
      q: 'Dessert?', top: 'lighter', bot: 'heavier', up: '↑ skip it', down: '↓ have it',
      goodSub: 'Clothes fit better. Steadier energy. No sugar slump.',
      badSub: 'Tighter jeans. Sugar slumps. Same summer as last year, only heavier.',
      yesText: () => 'Skipped. Clothes that fit better, steadier energy. That’s what you just chose.',
      noText: () => 'Had it. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} skipped this month`
    }
  },
  drink: {
    label: 'Drink', name: 'Drink', mode: 'avoid',
    fields: [['kcal', 'Calories each', 0, 400, 10, 180, 'kcal'], ['cost', 'Cost each', 0, 12, 0.1, 4.3, 'gbp'], ['usual', 'Usually, per week', 0, 28, 1, 6, 'wk']],
    copy: {
      q: 'Drink?', top: 'lighter', bot: 'heavier', up: '↑ night off', down: '↓ have it',
      goodSub: 'Better sleep. Clearer mornings. Money in your pocket.',
      badSub: 'Heavier. Foggier mornings. Money gone.',
      yesText: () => 'Night off. Better sleep, clearer mornings, money kept. That’s what you just chose.',
      noText: () => 'Had it. You just pulled summer-you down. Make the next one count.',
      fact: (n) => `${n} nights off this month`
    }
  },
  exercise: {
    label: 'Exercise', name: 'Workout', mode: 'exercise',
    fields: [['min', 'Minutes each', 5, 120, 5, 30, 'min'], ['kcal', 'Calories burned', 0, 800, 10, 250, 'kcal'], ['usual', 'Usually, per week', 0, 14, 1, 2, 'wk']],
    copy: {
      q: 'Workout now?', top: 'fitter', bot: 'less fit', up: '↑ go now', down: '↓ skip it',
      good: [[0.45, 'a bit fitter'], [0.8, 'noticeably fitter'], [2, 'properly fit']],
      bad: [[0.45, 'a bit less fit'], [0.8, 'noticeably less fit'], [2, 'back to where you started']],
      goodSub: 'Stairs without the puff. More energy. Clothes fit better.',
      badSub: 'The fitness you built fades. Everything feels harder.',
      yesText: (v) => `Go. Fitter, stronger, more energy. ${v.min} minutes.`,
      noText: () => 'Skipped. That’s a session summer-you doesn’t get back.',
      fact: (n) => `${n} workouts this month`
    }
  },
  practice: {
    label: 'Practice', name: 'Stance holds', mode: 'practice',
    fields: [['min', 'Minutes each', 1, 60, 1, 10, 'min'], ['usual', 'Usually, per week', 0, 14, 1, 3, 'wk']],
    copy: {
      q: null, top: 'stronger', bot: 'weaker', up: '↑ do it now', down: '↓ skip it',
      good: [[0.45, 'a bit stronger'], [0.8, 'noticeably stronger'], [2, 'properly strong']],
      bad: [[0.45, 'a bit weaker'], [0.8, 'noticeably weaker'], [2, 'back to where you started']],
      goodSub: 'Stronger legs. Better balance. What was hard feels easy.',
      badSub: 'The strength you built fades. It all feels hard again.',
      yesText: (v) => `Go. Stronger, steadier, hard things getting easy. ${v.min} minutes.`,
      noText: () => 'Skipped. That’s a day summer-you doesn’t get back.',
      fact: (n) => `${n} sessions this month`
    }
  },
  fruit: {
    label: 'Fruit & veg', name: 'Fruit & veg', mode: 'fruit',
    fields: [['usual', 'Portions a week now', 0, 35, 1, 7, 'n']],
    copy: {
      q: 'Fruit or veg instead?', top: 'more energy', bot: 'less energy', up: '↑ have some', down: '↓ skip it',
      good: [[0.45, 'a bit brighter'], [0.8, 'noticeably more energetic'], [2, 'properly well']],
      bad: [[0.45, 'a bit flat'], [0.8, 'noticeably sluggish'], [2, 'running on empty']],
      goodSub: 'More energy in the afternoons. Better skin. Fewer colds.',
      badSub: 'Afternoon slumps. More colds. Same tired summer.',
      yesText: () => 'Done. More energy, fewer slumps. That’s what you just chose.',
      noText: () => 'Skipped. Summer-you runs a little flatter. Make the next one count.',
      fact: (n) => `${n} extra portions this month`
    }
  },
  bed: {
    label: 'Bedtime', name: 'Bed on time', mode: 'bed',
    fields: [['time', 'In bed by', 0, 180, 15, 120, 'time'], ['gain', 'Extra sleep per early night', 15, 120, 5, 45, 'min'], ['usual', 'Early nights now, per week', 0, 7, 1, 1, 'wk']],
    copy: {
      q: 'Bed now?', top: 'sharper', bot: 'foggier', up: '↑ go to bed', down: '↓ stay up',
      good: [[0.45, 'a bit sharper'], [0.8, 'noticeably sharper'], [2, 'properly rested']],
      bad: [[0.45, 'a bit foggy'], [0.8, 'noticeably foggier'], [2, 'running on fumes']],
      goodSub: 'Clearer mornings. Steadier moods. Better days.',
      badSub: 'Foggy mornings. Shorter fuse. Tomorrow-you pays for tonight.',
      yesText: () => 'Lights out. Clearer mornings, steadier moods. That’s what you just chose.',
      noText: () => 'Staying up. Tomorrow-you pays for tonight. Make the next one count.',
      fact: (n) => `${n} early nights this month`
    }
  }
};
export const TYPE_ORDER = ['snack', 'dessert', 'drink', 'exercise', 'practice', 'fruit', 'bed'];

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
  if (unit === 'time') { const m = 21 * 60 + Number(v); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  return String(v);
}

/* ---------- Horizon: next summer (21 June) ---------- */
export function horizon(now = new Date()) {
  let y = now.getFullYear();
  if (now.getMonth() >= 5) y++; // from June on, "summer" means next year's
  const target = new Date(y, 5, 21);
  const span = target - now;
  return {
    weeks: Math.max(4, span / (7 * DAY)),
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
const pickLevel = (arr, m) => { for (const [t, w] of arr) if (m <= t) return w; return arr[arr.length - 1][1]; };

/* What summer-you looks like if position e ∈ [-1, 1] becomes the habit. */
export function projection(lever, e, weeks) {
  const t = TYPES[lever.type], c = t.copy, m = Math.abs(e), good = e > 0, v = lever.vals;
  if (m < 0.08) return { text: 'You, much the same as now.', sub: '' };
  let phrase;
  if (t.mode === 'avoid') {
    const per = m * (v.usual || 0);
    const parts = [];
    const k = kgNoun(kgOf(per * (v.kcal || 0), weeks)); if (k) parts.push(`${k} ${good ? 'lighter' : 'heavier'}`);
    const g = moneyNoun(per * (v.cost || 0) * weeks); if (g) parts.push(`${g} ${good ? 'richer' : 'poorer'}`);
    phrase = parts.length ? parts.join(' and ') : (good ? 'a little lighter' : 'a little heavier');
  } else {
    phrase = pickLevel(good ? c.good : c.bad, m);
    if (t.mode === 'exercise' && good) {
      const k = kgNoun(kgOf(m * 2 * (v.kcal || 0) * 0.6, weeks)); // exercise burn counted at 60%
      if (k) phrase += `, and ${k} lighter`;
    }
  }
  return { text: `You, ${phrase}.`, sub: good ? c.goodSub : c.badSub };
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
  const gain = { kcal: 0, gbp: 0, q: new Set() }, loss = { kcal: 0, gbp: 0, q: new Set() };
  const Q = { exercise: ['fitter', 'fitness'], practice: ['stronger', 'strength'], fruit: ['more energy', 'energy'], bed: ['better rested', 'sleep'] };
  for (const l of levers) {
    const { y, n } = leverStats(l, events), mode = TYPES[l.type].mode, v = l.vals;
    Y += y; N += n;
    for (const [count, bucket, i] of [[y, gain, 0], [n, loss, 1]]) {
      if (!count) continue;
      const perWeek = count / 4;
      if (mode === 'avoid') { bucket.kcal += perWeek * (v.kcal || 0); bucket.gbp += perWeek * (v.cost || 0) * weeks; }
      else {
        if (mode === 'exercise') bucket.kcal += perWeek * (v.kcal || 0) * 0.6;
        bucket.q.add(Q[mode][i]);
      }
    }
  }
  if (!Y && !N) return { state: 'quiet' };
  const ahead = Y >= N, b = ahead ? gain : loss;
  const k = kgNoun(kgOf(b.kcal, weeks)), g = moneyNoun(b.gbp);
  const chips = ahead
    ? [k && `${k} lighter`, g, ...b.q].filter(Boolean)
    : [k && 'a lighter summer', g, ...b.q].filter(Boolean);
  if (!chips.length) chips.push(ahead ? 'a better summer' : 'a better summer');
  return { state: ahead ? 'ahead' : 'slipping', chips, strength: Math.min(1, 0.35 + Math.abs(Y - N) / 12) };
}

/* Add-lever live preview: "Skip half of them, and summer-you is…" */
export function addPreview(type, v, weeks) {
  const mode = TYPES[type].mode;
  if (mode === 'avoid') {
    const h = (v.usual || 0) / 2;
    const k = kgNoun(kgOf(h * (v.kcal || 0), weeks)), g = moneyNoun(h * (v.cost || 0) * weeks);
    const lines = [k ? `${k} lighter` : 'barely a dent — but it adds up', g && `${g} richer`].filter(Boolean);
    return ['Skip half of them, and summer-you is…', lines];
  }
  if (mode === 'exercise') {
    const k = kgNoun(kgOf((v.kcal || 0) * 0.6, weeks));
    return ['One more a week, and summer-you is…', [k ? `${k} lighter` : 'a little lighter', 'fitter and stronger']];
  }
  if (mode === 'practice') return ['One more a week, and summer-you is…', ['stronger legs', 'better balance']];
  if (mode === 'fruit') return ['One more a day, and by summer…', ['more energy in the afternoons', `${Math.round(weeks * 7 / 10) * 10} more portions`]];
  const nights = Math.round(2 * weeks * (v.gain || 45) / 60 / 24 * 10) / 10;
  return ['Two more early nights a week, and by summer…', ['fewer foggy mornings', nights >= 1 ? `${nights >= 2 ? Math.round(nights) : 'a full'} extra day${nights >= 2 ? 's' : ''} of sleep banked` : 'hours of sleep banked']];
}
