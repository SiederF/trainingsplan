/**
 * workout.js — Zustand einer laufenden Einheit.
 *
 * Führt durch Übungen und Sätze, sammelt je Satz das Ergebnis und
 * schreibt beim Abschluss die Level-Anpassungen sowie einen Logeintrag.
 * Kennt weder DOM noch Timer.
 */

import { applyLevel, effectiveLevel, evaluate } from './progression.js';
import { loadLevels, saveLevels, appendLog, loadCompleted, saveCompleted } from './storage.js';
import { getExercise } from '../data/exercises.js';

/** Zählbare Übungen — Bouldern und Freiformen werden nur abgehakt. */
const countable = item => item.type === 'reps' || item.type === 'hold' || item.type === 'interval';

export function zielwert(item) {
  if (item.type === 'reps') return item.reps;
  if (item.type === 'hold') return item.hold;
  if (item.type === 'interval') return item.rounds;
  return 1;
}

export function createWorkout(week, session) {
  const levels = loadLevels();
  const now = Date.now();

  // Vorgaben einmalig mit dem wirksamen Level verrechnen
  const items = session.items.map(item => {
    const lvl = effectiveLevel(levels[item.ex], now);
    return applyLevel(item, lvl);
  });

  const state = {
    week: week.n,
    sessionId: session.id,
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

      const entry = levelsNow[item.ex] || { level: 0, lastDone: null, streak: 0 };
      const wirksam = effectiveLevel(entry, Date.now());

      let delta = 0, reason = 'Nur abgehakt', streak = 0;
      if (countable(item) && ex.progress?.mode !== 'none') {
        const res = evaluate(sets, { type: item.type, exerciseId: item.ex, streak: entry.streak || 0 });
        delta = res.delta; reason = res.reason; streak = res.streak;
      }

      levelsNow[item.ex] = { level: wirksam + delta, lastDone: stamp, streak };
      if (delta !== 0) anpassungen.push({ ex: item.ex, name: ex.name, delta, reason });
    });

    saveLevels(levelsNow);

    appendLog({
      at: stamp, week: state.week, sessionId: state.sessionId,
      items: state.items.map((item, i) => ({ ex: item.ex, sets: state.results[i] }))
    });

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
