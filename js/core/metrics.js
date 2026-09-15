/**
 * metrics.js — abgeleitete Kennzahlen. Reine Funktionen.
 *
 * Die wichtigste Zahl im Bouldern ist nicht die Hanglast in Kilogramm,
 * sondern die Gesamtlast im Verhältnis zum Körpergewicht. Wer vier Kilo
 * zunimmt und gleich viel hängt, ist am Fels schwächer geworden —
 * genau das zeigt diese Datei an.
 *
 * Die Prozentmarken stammen aus öffentlich zugänglichen Lattice-Daten,
 * die ein unabhängiger Analyst aus Videomaterial rekonstruiert hat. Sie
 * sind NICHT peer-reviewed und bewusst als Orientierung gekennzeichnet.
 * Die individuelle Streuung ist erheblich.
 */

import { getExercise } from '../data/exercises.js';
import { effectiveLevel, applyLevel } from './progression.js';

/** Zwei-Arm-Max-Hang an der 20-mm-Leiste, Prozent Körpergewicht. */
export const BENCHMARKS = [
  { grad: 'Font 6c / V5',  pct: 134 },
  { grad: 'Font 7a / V6',  pct: 140 },
  { grad: 'Font 7a+ / V7', pct: 146 },
  { grad: 'Font 7b+ / V8', pct: 152 },
  { grad: 'Font 7c / V9',  pct: 158 }
];

/**
 * Hanglast als Prozent des Körpergewichts.
 * @param {number} koerpergewicht kg
 * @param {number} zusatzlast kg
 */
export function hangProzent(koerpergewicht, zusatzlast) {
  if (!koerpergewicht || koerpergewicht <= 0) return null;
  return Math.round((koerpergewicht + zusatzlast) / koerpergewicht * 1000) / 10;
}

/** Welche Marke ist damit erreicht, und wie weit ist die nächste? */
export function einordnung(pct) {
  if (pct == null) return null;
  const erreicht = [...BENCHMARKS].reverse().find(b => pct >= b.pct) || null;
  const naechste = BENCHMARKS.find(b => pct < b.pct) || null;
  return { erreicht, naechste, luecke: naechste ? Math.round((naechste.pct - pct) * 10) / 10 : 0 };
}

/** Wie viele Kilo Zusatzlast fehlen bis zu einer Zielmarke? */
export function kiloBis(koerpergewicht, zielPct, aktuelleLast) {
  if (!koerpergewicht) return null;
  const noetig = koerpergewicht * (zielPct / 100) - koerpergewicht;
  return Math.round((noetig - aktuelleLast) * 10) / 10;
}

/** Aktuelle Zusatzlast einer Übung aus Plan plus Fortschritt. */
export function aktuelleLast(planItem, levels) {
  const lvl = effectiveLevel(levels[planItem.ex]);
  return applyLevel(planItem, lvl).load || 0;
}

/* ------------------------------------------------------------------ */
/* Zug-Druck-Verhältnis                                                */
/* ------------------------------------------------------------------ */

/**
 * Kletterer kippen fast immer zugdominant. Ein Verhältnis um 1,5 zu 1 ist
 * normal und unproblematisch; ab etwa 2,5 zu 1 lohnt ein Blick auf die
 * Schultern, weil das Antagonistentraining nicht mehr mithält.
 */
export function zugDruck(log, tage = 28) {
  const grenze = Date.now() - tage * 86400000;
  let zug = 0, druck = 0;

  log.filter(e => new Date(e.at).getTime() >= grenze).forEach(e => {
    (e.items || []).forEach(i => {
      const ex = getExercise(i.ex);
      if (!ex || !i.sets?.length) return;
      if (ex.group === 'pull') zug += i.sets.length;
      if (ex.group === 'push') druck += i.sets.length;
    });
  });

  if (!zug && !druck) return null;
  const quote = druck ? Math.round(zug / druck * 100) / 100 : Infinity;

  let bewertung = 'ausgewogen';
  let text = `Zug zu Druck steht bei ${quote === Infinity ? '∞' : quote.toLocaleString('de-DE')} zu 1. Das ist für einen Kletterer unauffällig.`;
  if (quote > 2.5) {
    bewertung = 'zugdominant';
    text = `Zug zu Druck steht bei ${quote === Infinity ? '∞' : quote.toLocaleString('de-DE')} zu 1. Dein Antagonistentraining kommt nicht mit — häng an den Push-Tagen ein bis zwei Sätze dran, sonst zahlst du das über die Schulter.`;
  } else if (quote < 0.8) {
    bewertung = 'druckdominant';
    text = `Zug zu Druck steht bei ${quote.toLocaleString('de-DE')} zu 1. Für einen Boulderer ungewöhnlich wenig Zugarbeit.`;
  }
  return { zug, druck, quote, bewertung, text };
}

/* ------------------------------------------------------------------ */
/* Empfehlung für den nächsten Zyklus                                  */
/* ------------------------------------------------------------------ */

/**
 * Nach dem Abschlusstest: Woran liegt es, und was gehört in Zyklus zwei?
 * Die Verzweigung folgt der Leistungsdeterminanten-Literatur — Fingerkraft
 * ist der stärkste Einzelprädiktor, erklärt aber auf höherem Niveau
 * immer weniger, weil dort Technik und Explosivkraft mitlimitieren.
 */
export function naechsterZyklus({ hangPct, klimmzuegeProzent, gradErreicht }) {
  if (hangPct == null) {
    return {
      fokus: 'messen',
      titel: 'Erst messen',
      text: 'Ohne Körpergewicht und aktuelle Hanglast lässt sich nichts ableiten. Trag beides beim Testtag ein, dann steht hier eine Empfehlung.'
    };
  }

  if (hangPct < 140) return {
    fokus: 'finger',
    titel: 'Zyklus 2: Fingerkraft',
    text: `Deine Hanglast liegt bei ${hangPct} Prozent Körpergewicht. Unterhalb der 140-Prozent-Marke ist Fingerkraft dein klarer Engpass — sie ist der stärkste Einzelprädiktor der Kletterleistung. Der nächste Zyklus bekommt zwei Boardeinheiten pro Woche statt einer, dafür weniger Hypertrophievolumen.`
  };

  if (hangPct < 158) return {
    fokus: 'gemischt',
    titel: 'Zyklus 2: Maximalkraft weiter, Technik dazu',
    text: `Mit ${hangPct} Prozent liegst du zwischen der 7a- und der 7c-Marke. Fahr die Maximalkraftphase fort, aber verschieb Gewicht Richtung Fels: mehr Limit-Bouldern, mehr explosive Züge. Ab hier erklärt Fingerkraft allein immer weniger.`
  };

  return {
    fokus: 'technik',
    titel: 'Zyklus 2: Technik und Explosivkraft',
    text: `Mit ${hangPct} Prozent hast du die Fingerkraft für 7c beisammen.${gradErreicht ? '' : ' Dass der Grad noch nicht steht, liegt damit nicht an der Kraft.'} Der nächste Zyklus gehört dem Fels: Limit-Bouldern, Bewegungslernen, Schnellkraft. Am Board reicht Erhalten.`
  };
}
