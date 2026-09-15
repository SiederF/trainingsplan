/**
 * progression.js — entscheidet, ob eine Übung schwerer, gleich oder
 * leichter wird. Reine Funktionen, kein Speicher, kein DOM.
 *
 * Modell: Jede Übung hat ein Level (ganze Zahl, Start 0). Das Level
 * verschiebt die Planvorgabe um progress.step nach oben oder unten.
 *
 * GRUNDREGEL nach jeder Einheit:
 *   alle Sätze erreicht und höchstens "fordernd"   → +1
 *   alle Sätze erreicht, aber "sehr schwer"        →  0
 *   ein Satz unter Ziel                            →  0
 *   zwei oder mehr Sätze unter Ziel, oder Abbruch  → -1
 *
 * 2-FÜR-2-REGEL (beschleunigte Steigerung):
 *   Wer im letzten Satz zwei Wiederholungen über dem Ziel schafft, und
 *   das in zwei aufeinanderfolgenden Einheiten derselben Übung, bekommt
 *   den doppelten Schritt. Das ist die Standardregel aus Baechle & Earle,
 *   "Essentials of Strength Training and Conditioning" (NSCA), und deckt
 *   sich mit dem ACSM-Positionspapier "Progression Models in Resistance
 *   Training for Healthy Adults" (Med Sci Sports Exerc 2009, Evidenz-
 *   kategorie B): Laststeigerung um 2–10 %, sobald ein bis zwei
 *   Wiederholungen über dem Ziel in zwei aufeinanderfolgenden Einheiten
 *   möglich sind — der kleinere Wert für kleine, der größere für große
 *   Muskelgruppen.
 *
 *   Umrechnung auf diesen Plan: ein Schritt sind 2,5 kg. Bei rund 80 kg
 *   Gesamtlast am Hangboard sind das etwa 3 %, ein Doppelschritt etwa 6 %.
 *   Beides liegt im empfohlenen Korridor.
 *
 * AUSNAHME FINGER: Für Hangboard-Übungen gibt es keinen Doppelschritt.
 * Bindegewebe passt sich deutlich langsamer an als Muskulatur; die
 * Sehnen wären der begrenzende Faktor, nicht die Kraft.
 *
 * SÄTZE STATT WIEDERHOLUNGEN: Stößt eine Übung an ihre Wiederholungs-
 * obergrenze, wandert der Überschuss in zusätzliche Sätze — je zwei
 * Wiederholungen über der Grenze ein Satz, höchstens zwei. Begründung:
 * Schoenfeld, Ogborn & Krieger (J Sports Sci 2017) fanden je zusätzlichem
 * Wochensatz rund 0,37 % mehr Muskelzuwachs; die neuere Meta-Regression
 * (Sports Medicine 2025) bestätigt den Zusammenhang, zeigt aber
 * abnehmenden Grenznutzen — deshalb die Deckelung.
 */

import { getExercise } from '../data/exercises.js';

export const RATINGS = [
  { id: 'leicht', label: 'Leicht' },
  { id: 'ok',     label: 'Passt' },
  { id: 'schwer', label: 'Sehr schwer' },
  { id: 'fail',   label: 'Abgebrochen' }
];

const DAY = 86400000;

/** Ab wann gilt ein Satz als deutlich über dem Ziel. */
export const OVERSHOOT = {
  reps: 2,        // zwei Wiederholungen über Ziel (2-für-2-Regel)
  holdFactor: 1.2 // Haltezeiten: 20 % länger als vorgegeben
};

/** Wie viele aufeinanderfolgende Einheiten nötig sind. */
export const OVERSHOOT_STREAK = 2;

/** Höchstens zwei zusätzliche Sätze über der Wiederholungsobergrenze. */
export const MAX_EXTRA_SETS = 2;

/**
 * Steigerungssperre nach Fingerbeschwerden. Solange sie läuft, kann eine
 * Übung nur gleich bleiben oder zurückgehen, nie steigen. Damit setzt ein
 * einzelner guter Tag nach Schmerzen nicht sofort den Doppelsprung frei.
 */
export function mitSperre(ergebnis, sperre = 0) {
  if (sperre <= 0) return { ...ergebnis, sperre: 0 };
  return {
    delta: Math.min(ergebnis.delta, 0),
    streak: 0,
    sperre: sperre - 1,
    reason: ergebnis.delta > 0
      ? 'Geschafft, aber nach Fingerbeschwerden bleibt die Steigerung noch gesperrt'
      : ergebnis.reason
  };
}

/** Abschlag auf das Level nach Trainingspause. */
export function decayFor(days) {
  if (days == null) return 0;
  if (days <= 10) return 0;   // Kraft hält sich problemlos
  if (days <= 21) return 1;   // erste messbare Einbußen
  if (days <= 42) return 2;   // deutlicher Rückgang
  return 3;                   // Wiedereinstieg auf sicherem Niveau
}

export function daysSince(iso, now = Date.now()) {
  if (!iso) return null;
  return Math.floor((now - new Date(iso).getTime()) / DAY);
}

/**
 * Wirksames Level inklusive Pausen-Abschlag. Verändert den gespeicherten
 * Wert nicht — der Abschlag wird bei jeder Anzeige neu berechnet.
 */
export function effectiveLevel(entry, now = Date.now()) {
  if (!entry) return 0;
  const decay = decayFor(daysSince(entry.lastDone, now));
  const lvl = (entry.level || 0) - decay;
  return Math.max(lvl, -3);
}

/** Vorgabe mit dem Level verrechnen. Gibt immer eine neue Kopie zurück. */
export function applyLevel(prescription, level) {
  const ex = getExercise(prescription.ex);
  const out = { ...prescription };
  if (!ex || !ex.progress || ex.progress.mode === 'none' || !level) return out;

  const { mode, step, min, max } = ex.progress;
  const clamp = v => Math.min(max ?? Infinity, Math.max(min ?? 0, v));

  if (mode === 'reps' && out.reps != null) {
    const roh = out.reps + level * step;
    out.reps = clamp(roh);
    // Über der Obergrenze wächst nicht mehr die Wiederholungszahl,
    // sondern die Satzzahl — je zwei Wiederschüsse ein Satz.
    const ueber = roh - (max ?? Infinity);
    if (ueber > 0) {
      const extra = Math.min(MAX_EXTRA_SETS, Math.floor(ueber / 2));
      if (extra > 0) { out.sets = out.sets + extra; out.extraSets = extra; }
    }
  }
  if (mode === 'hold' && out.hold != null) out.hold = clamp(out.hold + level * step);
  if (mode === 'load') out.load = clamp((out.load || 0) + level * step);

  out.adjusted = level;
  return out;
}

/** Hat der letzte Satz das Ziel deutlich überschritten? */
export function isOvershoot(sets, type) {
  if (!sets || !sets.length) return false;
  const letzter = sets[sets.length - 1];
  const ziel = Number(letzter.target), erreicht = Number(letzter.done);
  if (!ziel) return false;
  if (type === 'hold') return erreicht >= ziel * OVERSHOOT.holdFactor;
  return erreicht >= ziel + OVERSHOOT.reps;
}

/**
 * Ergebnis einer Einheit bewerten.
 * @param {Array<{target:number, done:number, rating:string}>} sets
 * @param {{type?:string, exerciseId?:string, streak?:number}} kontext
 * @returns {{delta:number, reason:string, streak:number}}
 */
export function evaluate(sets, kontext = {}) {
  if (!sets || !sets.length) return { delta: 0, reason: 'Keine Daten erfasst', streak: 0 };

  const abgebrochen = sets.some(s => s.rating === 'fail');
  const unterZiel   = sets.filter(s => Number(s.done) < Number(s.target)).length;
  const schwer      = sets.some(s => s.rating === 'schwer');

  if (abgebrochen || unterZiel >= 2)
    return { delta: -1, reason: 'Ziel deutlich verfehlt — nächste Einheit leichter', streak: 0 };
  if (unterZiel === 1)
    return { delta: 0, reason: 'Ein Satz unter Ziel — Vorgabe bleibt', streak: 0 };
  if (schwer)
    return { delta: 0, reason: 'Geschafft, aber am Limit — Vorgabe bleibt', streak: 0 };

  // Alle Sätze sauber. Jetzt prüfen, ob deutlich übererfüllt.
  const ex = kontext.exerciseId ? getExercise(kontext.exerciseId) : null;
  const fingerUebung = ex && ex.group === 'finger';
  const ueber = isOvershoot(sets, kontext.type);
  const streak = ueber ? (kontext.streak || 0) + 1 : 0;

  if (ueber && streak >= OVERSHOOT_STREAK && !fingerUebung)
    return {
      delta: 2, streak: 0,
      reason: 'Zwei Einheiten deutlich über Ziel — doppelter Sprung (2-für-2-Regel)'
    };

  if (ueber && fingerUebung)
    return {
      delta: 1, streak,
      reason: 'Deutlich über Ziel, aber am Hangboard bleibt der Schritt klein — Sehnen brauchen länger'
    };

  if (ueber)
    return { delta: 1, streak, reason: 'Deutlich über Ziel — noch eine solche Einheit, dann größerer Sprung' };

  return { delta: 1, streak: 0, reason: 'Alle Sätze sauber — nächste Einheit etwas schwerer' };
}

/** Beschreibt in einem Satz, was der Level für diese Übung bedeutet. */
export function describeLevel(exerciseId, level) {
  const ex = getExercise(exerciseId);
  if (!ex || !ex.progress || ex.progress.mode === 'none' || !level) return null;
  const { mode, step, max } = ex.progress;
  const betrag = Math.abs(level) * step;
  const einheit = mode === 'load' ? 'kg' : mode === 'hold' ? 's' : 'Wdh';
  return (level > 0 ? '+' : '−') + betrag + ' ' + einheit + ' gegenüber Plan';
}

/**
 * Empfehlung auf Wochenebene. Wer weniger als die Hälfte geschafft hat,
 * sollte die Woche wiederholen statt weiterzuspringen.
 */
export function weekAdvice(doneCount, totalCount) {
  const quote = totalCount ? doneCount / totalCount : 0;
  if (quote >= 0.7) return { action: 'next', text: 'Woche sauber durchgezogen — weiter zur nächsten.' };
  if (quote >= 0.4) return { action: 'next', text: 'Etwas gefehlt, aber genug für den nächsten Schritt.' };
  return { action: 'repeat', text: 'Weniger als die Hälfte geschafft — diese Woche lieber wiederholen.' };
}
