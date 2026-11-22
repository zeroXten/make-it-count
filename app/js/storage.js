/* Local-first storage. Everything lives in localStorage under one key. */
const KEY = 'make-it-count:v1';

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.levers)) return { levers: d.levers, events: Array.isArray(d.events) ? d.events : [] };
  } catch { /* corrupt or missing: start fresh */ }
  return { levers: [], events: [] };
}

export function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function isValid(d) {
  return d && Array.isArray(d.levers) && Array.isArray(d.events) &&
    d.levers.every(l => l && typeof l.id === 'string' && typeof l.type === 'string' && l.vals) &&
    d.events.every(e => e && typeof e.leverId === 'string' && typeof e.t === 'number' && (e.c === 'y' || e.c === 'n'));
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* Ask the browser not to evict our data under storage pressure (best effort). */
export function requestPersist() {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}
