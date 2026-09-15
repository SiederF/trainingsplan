/**
 * readiness.js — Tagesform und Fingerzustand.
 *
 * Zwei Abfragen vor jeder Einheit, die die Vorgaben anpassen, bevor
 * trainiert wird. Reine Funktionen, kein Speicher, kein DOM.
 *
 * TAGESFORM skaliert Wiederholungen und Haltezeiten um zehn Prozent nach
 * oben oder unten. Die Last bleibt unangetastet — an einem schlechten Tag
 * weniger Wiederholungen bei gleichem Gewicht ist sinnvoller als leichtere
 * Sätze, weil der Kraftreiz erhalten bleibt. Zehn Prozent sind bewusst
 * konservativ gewählt und eine Erfahrungsgröße, keine Studienzahl.
 *
 * FINGERZUSTAND greift härter, weil hier das Verletzungsrisiko sitzt.
 * Ringbandverletzungen sind die häufigste Überlastungsverletzung im
 * Klettern, und der Crimp-Griff ist der Mechanismus. Deshalb:
 *
 *   frei     alles normal
 *   ziehen   Fingerlast minus zehn Prozent, keine Steigerung in dieser
 *            Einheit, Hinweis auf offenen Griff statt Crimp
 *   schmerz  Fingerübungen fallen aus, Level eine Stufe zurück, und die
 *            Steigerung bleibt für die nächsten zwei Einheiten gesperrt
 *
 * Die Sperre ist der wichtige Teil: Ein einzelner guter Tag nach
 * Beschwerden darf nicht sofort wieder den Doppelsprung auslösen.
 */

import { getExercise } from '../data/exercises.js';

export const FORM = [
  { id: 'gut',     label: 'Gut drauf',  faktor: 1.1 },
  { id: 'normal',  label: 'Normal',     faktor: 1.0 },
  { id: 'schwach', label: 'Müde',       faktor: 0.9 }
];

export const FINGER = [
  { id: 'frei',    label: 'Frei' },
  { id: 'ziehen',  label: 'Leichtes Ziehen' },
  { id: 'schmerz', label: 'Schmerz' }
];

/** Wie viele Einheiten die Steigerung nach Schmerz gesperrt bleibt. */
export const SPERRE_EINHEITEN = 2;

/** Belastet die Übung die Ringbänder? */
export const istFinger = exId => getExercise(exId)?.group === 'finger';

/** Klettern selbst ist die höchste Ringbandbelastung überhaupt. */
export const istKlettern = exId => getExercise(exId)?.group === 'climb';

/**
 * Wird nach dem Fingerzustand gefragt? Immer dann, wenn die Einheit die
 * Ringbänder belastet — also am Board UND am Fels. Reine Push- oder
 * Mobility-Einheiten fragen nicht; Handgelenk-Curls zählen nicht dazu,
 * die belasten die Unterarmmuskeln, nicht das Sehnen-Ringband-System.
 */
export const hatFinger = session =>
  session.items.some(i => istFinger(i.ex) || istKlettern(i.ex)) ||
  (session.warmup || []).some(id => istFinger(id));

const faktorVon = formId => FORM.find(f => f.id === formId)?.faktor ?? 1;

/**
 * Vorgaben an Tagesform und Fingerzustand anpassen.
 * Wird NACH applyLevel angewendet, verändert also nur die Tagesvorgabe,
 * nicht den gespeicherten Fortschritt.
 *
 * @returns {{items: Array, entfernt: number, hinweise: string[]}}
 */
export function anpassen(items, { form = 'normal', finger = 'frei' } = {}) {
  const faktor = faktorVon(form);
  const hinweise = [];
  let entfernt = 0;

  const out = [];
  for (const item of items) {
    const fingerUebung = istFinger(item.ex);

    // Fingerübungen fallen bei Schmerz raus. Klettern NICHT: Ob du an den
    // Fels gehst, entscheidest du, nicht die App. Sie warnt nur deutlich.
    if (fingerUebung && finger === 'schmerz') { entfernt++; continue; }

    const neu = { ...item };

    if (faktor !== 1) {
      if (neu.reps != null) neu.reps = Math.max(1, Math.round(neu.reps * faktor));
      if (neu.hold != null) neu.hold = Math.max(3, Math.round(neu.hold * faktor));
      neu.tagesform = form;
    }

    if (fingerUebung && finger === 'ziehen') {
      if (neu.load != null) neu.load = Math.round(neu.load * 0.9 * 2) / 2;
      neu.offenerGriff = true;
      neu.keineSteigerung = true;
    }

    out.push(neu);
  }

  if (faktor > 1) hinweise.push('Gute Tagesform: Wiederholungen und Haltezeiten liegen zehn Prozent über Plan.');
  if (faktor < 1) hinweise.push('Müde gemeldet: Wiederholungen und Haltezeiten liegen zehn Prozent unter Plan. Die Last bleibt gleich, damit der Kraftreiz erhalten bleibt.');
  if (finger === 'ziehen') hinweise.push('Finger melden Ziehen: Hanglast zehn Prozent niedriger, offener Griff statt Crimp, und heute wird nichts gesteigert.');
  if (finger === 'schmerz' && entfernt) hinweise.push(`Fingerschmerz gemeldet: ${entfernt} Fingerübung${entfernt === 1 ? '' : 'en'} wurde${entfernt === 1 ? '' : 'n'} aus dieser Einheit entfernt. Das Oberkörpertraining läuft normal weiter.`);

  const klettertag = out.some(i => istKlettern(i.ex));
  if (klettertag && finger === 'schmerz') hinweise.push('Du gehst mit Fingerschmerzen an den Fels. Die Entscheidung liegt bei dir, aber genau so entstehen Ringbandrisse: Crimpen mit Vorschädigung, dazu ein abrutschender Fuß. Wenn du gehst, dann offen greifen, nichts Dynamisches, und beim ersten Stechen aufhören.');
  if (klettertag && finger === 'ziehen') hinweise.push('Leichtes Ziehen gemeldet: Heute offen greifen statt crimpen und auf harte dynamische Züge verzichten.');

  return { items: out, entfernt, hinweise };
}

/**
 * Wie oft wurden zuletzt Beschwerden gemeldet? Dreimal in vier Wochen ist
 * kein Zufall mehr, sondern ein Muster.
 */
export function beschwerdeMuster(log, tage = 28) {
  const grenze = Date.now() - tage * 86400000;
  const treffer = log.filter(e =>
    e.readiness && e.readiness.finger && e.readiness.finger !== 'frei' &&
    new Date(e.at).getTime() >= grenze
  );
  if (treffer.length < 3) return null;
  return `Du hast in den letzten ${tage} Tagen ${treffer.length}-mal Fingerbeschwerden gemeldet. Das ist ein Muster, kein Ausrutscher. Lass das von jemandem anschauen, der sich mit Kletterverletzungen auskennt, bevor daraus ein Ringbandschaden wird.`;
}
