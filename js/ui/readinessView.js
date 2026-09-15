/**
 * readinessView.js — die Abfrage vor dem Start einer Einheit.
 * Zwei Fragen, jede mit drei großen Schaltflächen. Die Fingerfrage
 * erscheint nur, wenn die Einheit überhaupt Fingerbelastung enthält.
 */

import { el, clear } from './dom.js';
import { FORM, FINGER } from '../core/readiness.js';

export function renderReadiness(root, { session, fingerRelevant, muster, onStart, onAbbruch }) {
  clear(root);
  let form = 'normal';
  let finger = 'frei';

  root.appendChild(el('div.pagehead', {},
    el('h2', { text: 'Kurz vor dem Start' }),
    el('p', { text: session.title + ' · ' + session.duration })
  ));

  if (muster) root.appendChild(el('div.note.note--warn', {}, el('strong', { text: 'Wiederholte Beschwerden. ' }), muster));

  const gruppe = (titel, optionen, aktiv, setzen) => {
    root.appendChild(el('p.sectiontitle', { text: titel }));
    const reihe = el('div.ratings');
    const knoepfe = optionen.map(o => el('button.rating', {
      type: 'button', 'aria-pressed': String(o.id === aktiv), text: o.label,
      onclick: e => {
        setzen(o.id);
        knoepfe.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
      }
    }));
    knoepfe.forEach(b => reihe.appendChild(b));
    root.appendChild(reihe);
  };

  gruppe('Wie ist die Tagesform?', FORM, form, v => { form = v; });

  if (fingerRelevant) {
    gruppe('Wie fühlen sich die Finger an?', FINGER, finger, v => { finger = v; });
    root.appendChild(el('div.note', {
      text: 'Bei Ziehen wird die Hanglast gesenkt und nichts gesteigert. Bei Schmerz fallen die Fingerübungen aus — das Oberkörpertraining läuft normal weiter.'
    }));
  }

  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--primary.btn--wide', {
      type: 'button', text: 'Training starten',
      onclick: () => onStart({ form, finger: fingerRelevant ? finger : 'frei' })
    })
  ));
  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--sm.btn--ghost', { type: 'button', text: 'Zurück', onclick: onAbbruch })
  ));
}
