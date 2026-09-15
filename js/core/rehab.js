/**
 * rehab.js — Wiedereinstieg nach einer Fingerverletzung.
 *
 * Die normale Pausen-Rückstufung bildet eine Trainingspause ab, nicht ein
 * verletztes Ringband. Dafür braucht es ein abgestuftes Protokoll: Die
 * Belastung startet deutlich reduziert und steigt erst, wenn mehrere
 * Einheiten hintereinander schmerzfrei waren — nicht nach Kalender.
 *
 * Der Aufbau folgt dem, was in der Literatur zu Ringbandverletzungen als
 * gestufte Rückkehr zum Sport beschrieben wird: konservative Behandlung,
 * dann schrittweise Wiederbelastung, offener Griff vor Crimp. Die
 * konkreten Prozentwerte und Schwellen sind eine praktikable Umsetzung,
 * keine Studienzahlen.
 *
 * WICHTIG: Das ersetzt keine Diagnose. Bei Knacken im Finger, sichtbarer
 * Schwellung oder Bogensehnenbildung gehört das abgeklärt, nicht
 * selbst auftrainiert.
 */

export const STUFEN = [
  {
    nr: 1, anteil: 0.30, griff: 'offen',
    titel: 'Stufe 1 — Anbelasten',
    text: 'Dreißig Prozent der früheren Last, ausschließlich offener Griff, keine Maximalhänge. Ziel ist Durchblutung und Gewöhnung, kein Reiz. Bei jedem Ziehen sofort abbrechen.'
  },
  {
    nr: 2, anteil: 0.50, griff: 'offen',
    titel: 'Stufe 2 — Aufbauen',
    text: 'Fünfzig Prozent, weiterhin offener Griff. No-Hangs sind hier das Mittel der Wahl, weil sie sich fein dosieren lassen und die Füße am Boden bleiben.'
  },
  {
    nr: 3, anteil: 0.70, griff: 'offen',
    titel: 'Stufe 3 — Belasten',
    text: 'Siebzig Prozent. Erste längere Hänge wieder möglich, Crimp bleibt draußen. Klettern ja, aber an großen Griffen und ohne dynamische Züge.'
  },
  {
    nr: 4, anteil: 0.85, griff: 'halb',
    titel: 'Stufe 4 — Annähern',
    text: 'Fünfundachtzig Prozent, halber Aufleger wieder erlaubt. Voller Crimp bleibt tabu. Wenn diese Stufe schmerzfrei durchläuft, geht es zurück in den normalen Plan.'
  }
];

/** Schmerzfreie Fingereinheiten je Stufe, bevor es weitergeht. */
export const EINHEITEN_PRO_STUFE = 3;

export const LEER = { aktiv: false, stufe: 1, schmerzfrei: 0, seit: null };

export const stufeVon = zustand =>
  STUFEN.find(s => s.nr === (zustand?.stufe || 1)) || STUFEN[0];

export function starten() {
  return { aktiv: true, stufe: 1, schmerzfrei: 0, seit: new Date().toISOString() };
}

export const beenden = () => ({ ...LEER });

/**
 * Nach einer Einheit fortschreiben.
 * @param {object} zustand
 * @param {string} fingerMeldung  'frei' | 'ziehen' | 'schmerz'
 * @returns {{zustand:object, meldung:string|null, fertig:boolean}}
 */
export function nachEinheit(zustand, fingerMeldung) {
  if (!zustand?.aktiv) return { zustand, meldung: null, fertig: false };

  if (fingerMeldung === 'schmerz') {
    const zurueck = Math.max(1, (zustand.stufe || 1) - 1);
    return {
      zustand: { ...zustand, stufe: zurueck, schmerzfrei: 0 },
      meldung: `Schmerz gemeldet — zurück auf Stufe ${zurueck}. Das ist kein Rückschritt, sondern der Sinn des Protokolls.`,
      fertig: false
    };
  }

  if (fingerMeldung === 'ziehen') {
    return {
      zustand: { ...zustand, schmerzfrei: 0 },
      meldung: 'Ziehen gemeldet — die Stufe bleibt, der Zähler beginnt von vorn.',
      fertig: false
    };
  }

  const zaehler = (zustand.schmerzfrei || 0) + 1;
  if (zaehler < EINHEITEN_PRO_STUFE) {
    return {
      zustand: { ...zustand, schmerzfrei: zaehler },
      meldung: `Schmerzfrei: ${zaehler} von ${EINHEITEN_PRO_STUFE} auf Stufe ${zustand.stufe}.`,
      fertig: false
    };
  }

  if (zustand.stufe >= STUFEN.length) {
    return {
      zustand: beenden(),
      meldung: 'Alle Stufen schmerzfrei durchlaufen. Der Wiedereinstieg ist abgeschlossen, der normale Plan gilt wieder — steigere die ersten Wochen trotzdem vorsichtig.',
      fertig: true
    };
  }

  return {
    zustand: { ...zustand, stufe: zustand.stufe + 1, schmerzfrei: 0 },
    meldung: `Stufe ${zustand.stufe} abgeschlossen. Weiter mit Stufe ${zustand.stufe + 1}.`,
    fertig: false
  };
}

/**
 * Vorgaben auf die aktuelle Stufe begrenzen. Greift nur bei
 * Fingerübungen; Oberkörper- und Rumpfarbeit bleiben unberührt.
 */
export function begrenzen(items, zustand, istFingerFn) {
  if (!zustand?.aktiv) return { items, hinweise: [] };
  const stufe = stufeVon(zustand);

  const out = items.map(item => {
    if (!istFingerFn(item.ex)) return item;
    const neu = { ...item };
    if (neu.load != null) neu.load = Math.round(neu.load * stufe.anteil * 2) / 2;
    if (neu.hold != null) neu.hold = Math.max(5, Math.round(neu.hold * 0.8));
    neu.keineSteigerung = true;
    neu.rehabGriff = stufe.griff;
    return neu;
  });

  return {
    items: out,
    hinweise: [`Wiedereinstieg, ${stufe.titel}: ${stufe.text}`]
  };
}
