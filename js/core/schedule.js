/**
 * schedule.js — verteilt die Einheiten einer Woche auf die Wochentage.
 *
 * Die Boulder-Einheiten liegen auf den Tagen, die der Nutzer gewählt hat.
 * Alle übrigen Einheiten werden so verteilt, dass
 *   – zwischen zwei Finger-Belastungen (Board, Fels) ein Tag Pause liegt,
 *   – kein Zugtraining direkt vor einem Felstag liegt,
 *   – nicht drei harte Tage aufeinanderfolgen.
 *
 * Die Bewertung läuft über die Woche hinweg im Kreis, weil Sonntag und
 * Montag im Training direkt aufeinanderfolgen.
 */

const PULL_HEAVY = new Set(['pull']);
const FINGER = new Set(['finger', 'climb', 'test']);

const isClimb  = s => s && s.kind === 'climb';
const isHard   = s => s && (s.kind === 'strength' || s.kind === 'finger' || s.kind === 'climb' || s.kind === 'test');
const isFinger = s => s && FINGER.has(s.kind);
const isPull   = s => s && s.kind === 'strength' && PULL_HEAVY.has(s.id);

function score(slots) {
  let sc = 0;
  for (let i = 0; i < 7; i++) {
    const a = slots[i], b = slots[(i + 1) % 7], c = slots[(i + 2) % 7];
    if (isFinger(a) && isFinger(b)) sc -= 4;
    if (isPull(a) && isClimb(b)) sc -= 2;
    if (isHard(a) && isHard(b) && isHard(c)) sc -= 2;
    if (isClimb(a) && !isHard(b)) sc += 1;
  }
  return sc;
}

const cache = new Map();

/**
 * @param {object} week   Wochenobjekt aus plan.js
 * @param {number[]} boulderDays  Indizes 0 = Mo … 6 = So, ein bis zwei Tage
 * @returns {Array<object|null>}  sieben Einträge, null = Ruhetag
 */
export function scheduleWeek(week, boulderDays) {
  const days = [...boulderDays].slice(0, 2).sort((a, b) => a - b);
  const key = week.n + '|' + days.join(',');
  if (cache.has(key)) return cache.get(key);

  const climbs = week.sessions.filter(isClimb);
  const pool   = week.sessions.filter(s => !isClimb(s));

  const slots = new Array(7).fill(null);
  days.forEach((d, i) => { slots[d] = climbs[i] || climbs[climbs.length - 1] || null; });
  const free = [0, 1, 2, 3, 4, 5, 6].filter(i => !days.includes(i));

  let best = null, bestScore = -Infinity;
  const used = new Set();

  (function place(idx) {
    if (idx === pool.length) {
      const s = score(slots);
      if (s > bestScore) { bestScore = s; best = slots.slice(); }
      return;
    }
    for (const f of free) {
      if (used.has(f)) continue;
      slots[f] = pool[idx]; used.add(f);
      place(idx + 1);
      used.delete(f); slots[f] = null;
    }
  })(0);

  const result = best || slots;
  cache.set(key, result);
  return result;
}

/** Warnt, wenn die gewählten Felstage direkt aufeinanderfolgen. */
export function boulderDaysWarning(boulderDays) {
  if (boulderDays.length < 2) return null;
  const [a, b] = [...boulderDays].sort((x, y) => x - y);
  const abstand = Math.min(b - a, 7 - (b - a));
  if (abstand >= 2) return null;
  return 'Deine Fels-Tage liegen direkt hintereinander. Die Finger brauchen 48 Stunden zwischen harten Belastungen. Wenn es nicht anders geht, mach den zweiten Tag bewusst kürzer und leichter.';
}
