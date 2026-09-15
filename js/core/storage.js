/**
 * storage.js — einzige Stelle, die den Browser-Speicher kennt.
 *
 * Kapselt localStorage hinter einer kleinen Schnittstelle. Steht kein
 * Speicher zur Verfügung (privates Fenster, eingebettete Vorschau), wird
 * still auf einen Speicher im Arbeitsspeicher umgeschaltet — die App
 * läuft dann normal, merkt sich aber nichts über den Neustart hinaus.
 *
 * Ein Austausch gegen IndexedDB berührt ausschließlich diese Datei.
 */

const PREFIX = 'tp.v1.';
const memory = new Map();

/** Tiefe Kopie über JSON — die gespeicherten Daten sind reines JSON.
 *  Bewusst kein structuredClone: das fehlt in älteren Browsern. */
const clone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

let backend = (() => {
  try {
    const probe = PREFIX + 'probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return 'local';
  } catch {
    return 'memory';
  }
})();

export const isPersistent = () => backend === 'local';

function readRaw(key) {
  if (backend === 'local') {
    try { return localStorage.getItem(PREFIX + key); } catch { backend = 'memory'; }
  }
  return memory.has(key) ? memory.get(key) : null;
}

function writeRaw(key, value) {
  if (backend === 'local') {
    try { localStorage.setItem(PREFIX + key, value); return true; }
    catch { backend = 'memory'; }
  }
  memory.set(key, value);
  return false;
}

export function read(key, fallback) {
  const raw = readRaw(key);
  if (raw === null) return clone(fallback);
  try { return JSON.parse(raw); }
  catch { return clone(fallback); }
}

export function write(key, value) {
  return writeRaw(key, JSON.stringify(value));
}

export function remove(key) {
  if (backend === 'local') { try { localStorage.removeItem(PREFIX + key); } catch {} }
  memory.delete(key);
}

/* ---------------- Schema ---------------- */

export const DEFAULTS = {
  settings: {
    boulderDays: [1, 5],      // Di und Sa
    currentWeek: 1,
    startedAt: null,
    sound: true
  },
  levels: {},                 // exerciseId -> { level, lastDone }
  log: [],                    // [{ at, week, sessionId, exerciseId, sets:[{target,done,rating}], delta }]
  completed: {}               // "week.sessionId" -> ISO-Datum
};

const LOG_LIMIT = 600;

export const loadSettings  = () => ({ ...DEFAULTS.settings, ...read('settings', DEFAULTS.settings) });
export const saveSettings  = s => write('settings', s);
export const loadLevels    = () => read('levels', DEFAULTS.levels);
export const saveLevels    = l => write('levels', l);
export const loadLog       = () => read('log', DEFAULTS.log);
export const loadCompleted = () => read('completed', DEFAULTS.completed);
export const saveCompleted = c => write('completed', c);

export function appendLog(entry) {
  const log = loadLog();
  log.push(entry);
  write('log', log.slice(-LOG_LIMIT));
}

export function exportAll() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(), levels: loadLevels(),
    log: loadLog(), completed: loadCompleted()
  };
}

export function importAll(data) {
  if (!data || data.version !== 1) throw new Error('Unbekanntes Dateiformat');
  if (data.settings)  write('settings', data.settings);
  if (data.levels)    write('levels', data.levels);
  if (data.log)       write('log', data.log);
  if (data.completed) write('completed', data.completed);
}

export function resetAll() {
  ['settings', 'levels', 'log', 'completed'].forEach(remove);
}
