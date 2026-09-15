/**
 * workout.js — Zustand einer laufenden Einheit.
 *
 * Führt durch Übungen und Sätze, sammelt je Satz das Ergebnis und
 * schreibt beim Abschluss die Level-Anpassungen sowie einen Logeintrag.
 * Kennt weder DOM noch Timer.
 */

import { applyLevel, effectiveLevel, evaluate, mitSperre } from './progression.js';
import { anpassen, istFinger, SPERRE_EINHEITEN } from './readiness.js';
import { loadLevels, saveLevels, appendLog, loadCompleted, saveCompleted,
         loadRehab, saveRehab } from './storage.js';
import { begrenzen, nachEinheit } from './rehab.js';
import { getExercise } from '../data/exercises.js';

/** Zählbare Übungen — Bouldern und Freiformen werden nur abgehakt. */
const countable = item => item.type === 'reps' || item.type === 'hold' || item.type === 'interval';

export function zielwert(item) {
  if (item.type === 'reps') return item.reps;
  if (item.type === 'hold') return item.hold;
  if (item.type === 'interval') return item.rounds;
  return 1;
}

export function createWorkout(week, session, readiness = { form: 'normal', finger: 'frei' }) {
  const levels = loadLevels();
  const now = Date.now();

  // Erst das gespeicherte Level verrechnen, dann die Tagesform. Die
  // Reihenfolge ist wichtig: Tagesform verändert nur die heutige Vorgabe,
  // nicht den Fortschritt.
  const mitLevel = session.items.map(item => applyLevel(item, effectiveLevel(levels[item.ex], now)));

  // Wiedereinstieg deckelt die Fingerlast, bevor die Tagesform greift.
  const rehabZustand = loadRehab();
  const gedeckelt = begrenzen(mitLevel, rehabZustand, istFinger);

  const roh = anpassen(gedeckelt.items, readiness);
  const items = roh.items;
  const hinweise = [...gedeckelt.hinweise, ...roh.hinweise];
  const entfernt = roh.entfernt;

  const state = {
    week: week.n,
    sessionId: session.id,
    readiness,
    hinweise,
    entfernt,
    items,
    index: 0,
    results: items.map(() => []),
    startedAt: new Date().toISOString()
  };

  const current = () => state.items[state.index] || null;
  const currentResults = () => state.results[state.index] || [];

  const setsTotal = () => { const it = current(); return it ? (it.sets || 1) : 0; };
  const setsDone = () => currentResults().length;
  const isCountable = () => { const it = current(); return it ? countable(it) : false; };

  /** Ergebnis eines Satzes erfassen. */
  function recordSet(done, rating) {
    const it = current();
    if (!it) return;
    state.results[state.index].push({
      target: zielwert(it),
      done: Number(done),
      rating: rating || 'ok'
    });
  }

  function undoSet() {
    const r = state.results[state.index];
    if (r && r.length) r.pop();
  }

  const exerciseComplete = () => setsDone() >= setsTotal();
  const isLastExercise = () => state.index >= state.items.length - 1;

  function nextExercise() {
    if (isLastExercise()) return false;
    state.index += 1;
    return true;
  }

  function prevExercise() {
    if (state.index === 0) return false;
    state.index -= 1;
    return true;
  }

  function gotoExercise(i) {
    if (i >= 0 && i < state.items.length) { state.index = i; return true; }
    return false;
  }

  /**
   * Einheit abschließen: Level anpassen, Log schreiben, als erledigt
   * markieren. Gibt die Anpassungen für die Rückmeldung zurück.
   */
  function finish() {
    const levelsNow = loadLevels();
    const stamp = new Date().toISOString();
    const anpassungen = [];

    state.items.forEach((item, i) => {
      const sets = state.results[i];
      const ex = getExercise(item.ex);
      if (!sets.length || !ex) return;

      const entry = levelsNow[item.ex] || { level: 0, lastDone: null, streak: 0, sperre: 0 };
      const wirksam = effectiveLevel(entry, Date.now());

      let delta = 0, reason = 'Nur abgehakt', streak = 0, sperre = entry.sperre || 0;
      if (countable(item) && ex.progress?.mode !== 'none') {
        if (item.keineSteigerung) {
          reason = 'Wegen gemeldeter Beschwerden heute keine Steigerung';
          sperre = Math.max(sperre, 1);
        } else {
          const roh = evaluate(sets, { type: item.type, exerciseId: item.ex, streak: entry.streak || 0 });
          const res = mitSperre(roh, sperre);
          delta = res.delta; reason = res.reason; streak = res.streak; sperre = res.sperre;
        }
      }

      levelsNow[item.ex] = { level: wirksam + delta, lastDone: stamp, streak, sperre };
      if (delta !== 0) anpassungen.push({ ex: item.ex, name: ex.name, delta, reason });
    });

    // Bei gemeldetem Schmerz gehen ALLE Fingerübungen zurück, auch die, die
    // heute gar nicht trainiert wurden — das Gewebe unterscheidet nicht
    // zwischen Leiste und Sloper.
    if (state.readiness?.finger === 'schmerz') {
      Object.keys(levelsNow).forEach(id => {
        if (!istFinger(id)) return;
        const e = levelsNow[id];
        levelsNow[id] = { ...e, level: (e.level || 0) - 1, streak: 0, sperre: SPERRE_EINHEITEN };
      });
      anpassungen.push({
        ex: '*finger', name: 'Alle Fingerübungen', delta: -1,
        reason: `Fingerschmerz gemeldet — eine Stufe zurück, Steigerung für ${SPERRE_EINHEITEN} Einheiten gesperrt`
      });
    }

    saveLevels(levelsNow);

    appendLog({
      at: stamp, week: state.week, sessionId: state.sessionId,
      readiness: state.readiness,
      items: state.items.map((item, i) => ({ ex: item.ex, sets: state.results[i] }))
    });

    // Wiedereinstiegsprotokoll fortschreiben, wenn Finger belastet wurden.
    const rehabVorher = loadRehab();
    if (rehabVorher.aktiv && state.items.some(i => istFinger(i.ex)) || (rehabVorher.aktiv && state.entfernt)) {
      const schritt = nachEinheit(rehabVorher, state.readiness?.finger || 'frei');
      saveRehab(schritt.zustand);
      if (schritt.meldung) anpassungen.push({
        ex: '*rehab', name: 'Wiedereinstieg', delta: schritt.fertig ? 1 : 0, reason: schritt.meldung
      });
    }

    const completed = loadCompleted();
    completed[state.week + '.' + state.sessionId] = stamp;
    saveCompleted(completed);

    return anpassungen;
  }

  return {
    state, current, currentResults, setsTotal, setsDone, isCountable,
    recordSet, undoSet, exerciseComplete, isLastExercise,
    nextExercise, prevExercise, gotoExercise, finish
  };
}

export function isSessionDone(week, sessionId, completed) {
  return Boolean(completed[week + '.' + sessionId]);
}
