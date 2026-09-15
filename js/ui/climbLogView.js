/**
 * climbLogView.js — Boulder eintragen und ansehen.
 * Bewusst knapp gehalten: Wer nach einer Session am Fels steht, tippt
 * keinen Roman. Grad, Ergebnis, fertig — der Rest ist optional.
 */

import { el, clear } from './dom.js';
import { GRADE, ERGEBNIS, bestenGrad, verteilung, entwicklung, abstandZumZiel, felstage, ZIELGRAD }
  from '../core/climbing.js';

export function renderClimbForm(root, { onSave, onAbbruch, vorgabeOrt }) {
  clear(root);
  let grad = '7a';
  let ergebnis = 'send';
  let versuche = 1;

  root.appendChild(el('div.pagehead', {},
    el('h2', { text: 'Boulder eintragen' }),
    el('p', { text: 'Nur was du wirklich geklettert bist — Projekte kannst du getrennt festhalten.' })
  ));

  // Grad
  root.appendChild(el('p.sectiontitle', { text: 'Grad' }));
  const gradRow = el('div.chiprow', { style: 'padding-inline:0' });
  const gradBtns = GRADE.map(g => el('button.chip', {
    type: 'button', 'aria-pressed': String(g === grad), text: g,
    onclick: e => { grad = g; gradBtns.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); }
  }));
  gradBtns.forEach(b => gradRow.appendChild(b));
  root.appendChild(gradRow);

  // Ergebnis
  root.appendChild(el('p.sectiontitle', { text: 'Ergebnis' }));
  const ergRow = el('div.ratings');
  const ergBtns = ERGEBNIS.map(r => el('button.rating', {
    type: 'button', 'aria-pressed': String(r.id === ergebnis), text: r.label, title: r.text,
    onclick: e => { ergebnis = r.id; ergBtns.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); }
  }));
  ergBtns.forEach(b => ergRow.appendChild(b));
  root.appendChild(ergRow);

  // Versuche
  root.appendChild(el('p.sectiontitle', { text: 'Versuche' }));
  const anzeige = el('span.stepper__val', { text: '1' });
  root.appendChild(el('div.stepper', {},
    el('button.stepper__btn', { type: 'button', text: '−', 'aria-label': 'weniger',
      onclick: () => { versuche = Math.max(1, versuche - 1); anzeige.textContent = String(versuche); } }),
    anzeige,
    el('button.stepper__btn', { type: 'button', text: '+', 'aria-label': 'mehr',
      onclick: () => { versuche += 1; anzeige.textContent = String(versuche); } })
  ));

  // Ort und Notiz
  const feldStil = 'min-height:44px;padding:0 12px;border:1px solid var(--c-line);border-radius:10px;background:var(--c-surface);color:var(--c-text);width:100%;margin-top:12px';
  const ort = el('input', { type: 'text', placeholder: 'Ort oder Sektor', value: vorgabeOrt || '', style: feldStil });
  const notiz = el('input', { type: 'text', placeholder: 'Notiz, etwa Griffart oder was gefehlt hat', style: feldStil });
  root.appendChild(el('p.sectiontitle', { text: 'Optional' }));
  root.appendChild(ort);
  root.appendChild(notiz);

  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--primary.btn--wide', {
      type: 'button', text: 'Eintragen',
      onclick: () => onSave({ grad, ergebnis, versuche, ort: ort.value, notiz: notiz.value })
    })
  ));
  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--sm.btn--ghost', { type: 'button', text: 'Abbrechen', onclick: onAbbruch })
  ));
}

/** Übersicht für die Fortschrittsansicht. */
export function renderClimbStats(root, { boulders, onNeu, onLoeschen }) {
  root.appendChild(el('p.sectiontitle', { text: 'Bouldern am Fels' }));

  if (!boulders.length) {
    root.appendChild(el('div.note', { text: 'Noch nichts eingetragen. Ohne Protokoll siehst du zwar, ob deine Dips stärker werden — aber nicht, ob du dem Zielgrad näher kommst. Und genau das ist die Frage.' }));
    root.appendChild(el('div.btnrow', {},
      el('button.btn.btn--primary', { type: 'button', text: 'Boulder eintragen', onclick: onNeu })));
    return;
  }

  const best90 = bestenGrad(boulders, 90);
  const ent = entwicklung(boulders);
  const abstand = abstandZumZiel(boulders);
  const tage = felstage(boulders, 28);

  root.appendChild(el('div.stats', {},
    el('div.stat', {}, el('div.stat__val', { text: best90 || '—' }), el('div.stat__lab', { text: 'bester, 90 Tage' })),
    el('div.stat', {}, el('div.stat__val', { text: ZIELGRAD }), el('div.stat__lab', { text: 'Zielgrad' })),
    el('div.stat', {}, el('div.stat__val', { text: abstand ? String(abstand.diff) : '—' }), el('div.stat__lab', { text: 'Grade bis zum Ziel' })),
    el('div.stat', {}, el('div.stat__val', { text: String(tage) }), el('div.stat__lab', { text: 'Felstage, 4 Wochen' }))
  ));

  root.appendChild(el('div.note', { text: ent.text, style: 'margin-top:12px' }));

  if (tage < 4) {
    root.appendChild(el('div.note.note--warn', {},
      el('strong', { text: 'Wenig Felszeit. ' }),
      `${tage} Tage am Fels in vier Wochen. Bewegungslernen braucht Wiederholung, und das lässt sich am Board nicht ersetzen — das ist auf deinem Weg der wahrscheinlichste Engpass, nicht die Kraft.`));
  }

  // Verteilung als Balken
  const vert = verteilung(boulders, 90);
  if (vert.length) {
    const max = Math.max(...vert.map(v => v.anzahl));
    const bars = el('div.bars', { style: 'margin-top:16px' });
    vert.forEach(v => bars.appendChild(el('div.bar.bar--on', {
      style: `height:${Math.max(6, Math.round(v.anzahl / max * 72))}px`,
      title: `${v.grad}: ${v.anzahl}`
    })));
    root.appendChild(bars);
    root.appendChild(el('p.ex__meta', { text: vert.map(v => `${v.grad}: ${v.anzahl}`).join(' · '), style: 'margin-top:6px' }));
  }

  // Letzte Einträge
  const letzte = [...boulders].reverse().slice(0, 8);
  root.appendChild(el('table.table', { style: 'margin-top:16px' },
    el('thead', {}, el('tr', {}, el('th', { text: 'Datum' }), el('th', { text: 'Boulder' }), el('th', { text: '' }))),
    el('tbody', {}, letzte.map(e => el('tr', {},
      el('td', { text: new Date(e.at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) }),
      el('td', {},
        el('div', { text: `${e.grad} · ${ERGEBNIS.find(r => r.id === e.ergebnis)?.label || e.ergebnis}` }),
        e.ort || e.notiz ? el('div.ex__meta', { text: [e.ort, e.notiz].filter(Boolean).join(' — ') }) : null),
      el('td', {}, el('button.btn.btn--sm.btn--ghost', {
        type: 'button', text: 'Löschen', onclick: () => onLoeschen(e.at)
      }))
    )))
  ));

  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--primary', { type: 'button', text: 'Boulder eintragen', onclick: onNeu })));
}
