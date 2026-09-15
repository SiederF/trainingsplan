/**
 * climbing.js — Boulder-Protokoll und Gradstatistik.
 *
 * Der Grund, warum das überhaupt existiert: Die App maß bisher Dips,
 * Klimmzüge und Hanglasten — aber nicht das Ziel. Zeit am Fels und
 * Bewegungslernen sind laut Determinanten-Literatur der größte
 * Einzelfaktor für den Grad; ohne Protokoll ist genau der unsichtbar.
 *
 * Reine Funktionen, kein Speicher, kein DOM.
 */

/** Fontainebleau-Boulderskala, aufsteigend. Index = Schwierigkeit. */
export const GRADE = [
  '5', '5+', '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b'
];

export const ERGEBNIS = [
  { id: 'flash',   label: 'Flash',   zaehlt: true,  text: 'im ersten Versuch' },
  { id: 'send',    label: 'Geklettert', zaehlt: true, text: 'nach mehreren Versuchen' },
  { id: 'projekt', label: 'Projekt', zaehlt: false, text: 'dran gearbeitet, noch offen' },
  { id: 'versuch', label: 'Versucht', zaehlt: false, text: 'angeschaut, nichts draus geworden' }
];

export const gradIndex = g => GRADE.indexOf(g);
export const istBesser = (a, b) => gradIndex(a) > gradIndex(b);

/** Zielgrad dieses Plans. */
export const ZIELGRAD = '7c';

const imFenster = (eintraege, tage, bis = Date.now()) => {
  const von = bis - tage * 86400000;
  return eintraege.filter(e => {
    const t = new Date(e.at).getTime();
    return t >= von && t <= bis;
  });
};

/** Härtester tatsächlich geklletterter Boulder im Zeitfenster. */
export function bestenGrad(eintraege, tage = 90) {
  const gezaehlt = imFenster(eintraege, tage)
    .filter(e => ERGEBNIS.find(r => r.id === e.ergebnis)?.zaehlt);
  if (!gezaehlt.length) return null;
  return gezaehlt.reduce((best, e) => (istBesser(e.grad, best) ? e.grad : best), gezaehlt[0].grad);
}

/** Wie viele Begehungen je Grad im Zeitfenster. */
export function verteilung(eintraege, tage = 90) {
  const zaehler = {};
  imFenster(eintraege, tage)
    .filter(e => ERGEBNIS.find(r => r.id === e.ergebnis)?.zaehlt)
    .forEach(e => { zaehler[e.grad] = (zaehler[e.grad] || 0) + 1; });
  return GRADE
    .map(g => ({ grad: g, anzahl: zaehler[g] || 0 }))
    .filter(x => x.anzahl > 0);
}

/**
 * Entwicklung: bester Grad im letzten Quartal gegen das davor.
 * Aussagekräftig erst, wenn in beiden Fenstern etwas steht.
 */
export function entwicklung(eintraege, tage = 90) {
  const jetzt = Date.now();
  const aktuell = bestenGrad(eintraege, tage);
  const davor = (() => {
    const frueher = imFenster(eintraege, tage, jetzt - tage * 86400000)
      .filter(e => ERGEBNIS.find(r => r.id === e.ergebnis)?.zaehlt);
    if (!frueher.length) return null;
    return frueher.reduce((b, e) => (istBesser(e.grad, b) ? e.grad : b), frueher[0].grad);
  })();

  if (!aktuell) return { aktuell: null, davor, richtung: 'keine', text: 'Noch keine gezählte Begehung im letzten Quartal.' };
  if (!davor) return { aktuell, davor: null, richtung: 'neu', text: `Bester Boulder im letzten Quartal: ${aktuell}. Für einen Vergleich fehlt noch ein zweites Quartal.` };

  if (istBesser(aktuell, davor))
    return { aktuell, davor, richtung: 'hoch', text: `Von ${davor} auf ${aktuell} im Quartalsvergleich. Der Grad bewegt sich.` };
  if (istBesser(davor, aktuell))
    return { aktuell, davor, richtung: 'runter', text: `Im Vorquartal stand ${davor}, jetzt ${aktuell}. Das kann an Wetter, Zeit am Fels oder Projektwahl liegen — nicht überbewerten, aber im Blick behalten.` };
  return { aktuell, davor, richtung: 'gleich', text: `Seit zwei Quartalen bei ${aktuell}. Wenn die Kraftwerte steigen und der Grad nicht, liegt es eher an Technik oder Felszeit.` };
}

/** Abstand zum Zielgrad in Graden. */
export function abstandZumZiel(eintraege, ziel = ZIELGRAD) {
  const best = bestenGrad(eintraege, 180);
  if (!best) return null;
  const diff = gradIndex(ziel) - gradIndex(best);
  return { best, ziel, diff };
}

/** Wie viele Tage am Fels im Zeitfenster — Felszeit ist der Engpass. */
export function felstage(eintraege, tage = 28) {
  const tageSet = new Set(imFenster(eintraege, tage).map(e => e.at.slice(0, 10)));
  return tageSet.size;
}

export function neuerEintrag({ grad, ergebnis, versuche, ort, notiz }) {
  if (!GRADE.includes(grad)) throw new Error('Unbekannter Grad.');
  if (!ERGEBNIS.some(r => r.id === ergebnis)) throw new Error('Unbekanntes Ergebnis.');
  return {
    at: new Date().toISOString(),
    grad, ergebnis,
    versuche: Math.max(1, Number(versuche) || 1),
    ort: (ort || '').trim().slice(0, 60),
    notiz: (notiz || '').trim().slice(0, 200)
  };
}
