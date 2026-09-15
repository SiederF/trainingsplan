/**
 * runnerView.js — die Ansicht während des Trainings.
 *
 * Führt Satz für Satz: Ziel anzeigen, Satz abhaken, Ergebnis erfassen,
 * Pausentimer starten. Der Bildschirm bleibt hier durchgehend an.
 */

import { el, clear, formatPrescription, num } from './dom.js';
import { getExercise } from '../data/exercises.js';
import { RATINGS } from '../core/progression.js';
import { zielwert } from '../core/workout.js';

export function renderRunner(root, ctx) {
  const { workout, onTimer, onFinish, onAbort, wakeText } = ctx;
  clear(root);

  const item = workout.current();
  const ex = item ? getExercise(item.ex) : null;
  if (!item || !ex) { onFinish(); return; }

  const gesamt = workout.setsTotal();
  const erledigt = workout.setsDone();
  const zaehlbar = workout.isCountable();
  const ziel = zielwert(item);

  // ---- Kopf ----
  root.appendChild(el('div.runner', {},
    el('p.runner__step', { text: `Übung ${workout.state.index + 1} von ${workout.state.items.length}` }),
    el('h2.runner__name', { text: ex.name }),
    el('p.runner__target', { text: formatPrescription(item) })
  ));

  // ---- Satzpunkte ----
  const dots = el('div.setdots');
  for (let i = 0; i < gesamt; i++) {
    const d = el('span.setdot', { text: String(i + 1) });
    if (i < erledigt) d.classList.add('setdot--done');
    else if (i === erledigt) d.classList.add('setdot--current');
    dots.appendChild(d);
  }
  root.appendChild(el('div', { style: 'margin-top:16px' }, dots));

  // ---- Timer für die Belastung ----
  const timerRow = el('div.btnrow');
  const satzOffen = zaehlbar && erledigt < gesamt;
  const pauseText = item.rest >= 60 ? `Pause ${num(item.rest / 60)} min` : `Pause ${item.rest} s`;

  if (item.type === 'hold') {
    timerRow.appendChild(el('button.btn', {
      type: 'button', text: `${num(item.hold)} s Haltezeit starten`,
      onclick: () => onTimer({ mode: 'countdown', seconds: item.hold, label: ex.name })
    }));
  }
  if (item.type === 'interval') {
    timerRow.appendChild(el('button.btn', {
      type: 'button', text: `Durchgang starten (${item.rounds}×)`,
      onclick: () => onTimer({
        mode: 'interval', work: item.work, rest: item.pause, rounds: item.rounds,
        workLabel: 'Hängen', restLabel: 'Ab', label: ex.name
      })
    }));
  }
  // Der lose Pausenknopf erscheint nur, wenn kein Satz mehr offen ist.
  // Sonst würde die Pause laufen, ohne dass der Satz gezählt wird —
  // der Abhak-Knopf unten startet sie gleich mit.
  if (item.rest && !satzOffen) {
    timerRow.appendChild(el('button.btn.btn--rest', {
      type: 'button', text: pauseText,
      onclick: () => onTimer({ mode: 'countdown', seconds: item.rest, label: 'Pause', isRest: true })
    }));
  }
  if (timerRow.childNodes.length) root.appendChild(timerRow);

  // ---- Erfassung ----
  if (zaehlbar && erledigt < gesamt) {
    let wert = ziel;
    let bewertung = 'ok';

    const anzeige = el('span.stepper__val', { text: String(wert) });
    const einheit = item.type === 'hold' ? 'Sekunden gehalten'
                  : item.type === 'interval' ? 'Durchgänge geschafft' : 'Wiederholungen geschafft';

    const stepper = el('div.stepper', {},
      el('button.stepper__btn', {
        type: 'button', 'aria-label': 'weniger',
        onclick: () => { wert = Math.max(0, wert - 1); anzeige.textContent = String(wert); }, text: '−'
      }),
      anzeige,
      el('button.stepper__btn', {
        type: 'button', 'aria-label': 'mehr',
        onclick: () => { wert += 1; anzeige.textContent = String(wert); }, text: '+'
      }),
      el('span.field__label', { text: einheit })
    );

    const ratingRow = el('div.ratings');
    const buttons = RATINGS.map(r => el('button.rating', {
      type: 'button', 'aria-pressed': String(r.id === bewertung), text: r.label,
      onclick: e => {
        bewertung = r.id;
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
      }
    }));
    buttons.forEach(b => ratingRow.appendChild(b));

    root.appendChild(el('p.sectiontitle', { text: `Satz ${erledigt + 1} erfassen` }));
    root.appendChild(el('div.field', {}, stepper));
    root.appendChild(el('p.field__label', { text: 'Wie hat sich der Satz angefühlt?', style: 'margin-top:12px' }));
    root.appendChild(ratingRow);

    root.appendChild(el('div.btnrow', {},
      el('button.btn.btn--primary.btn--wide', {
        type: 'button',
        text: item.rest && erledigt + 1 < gesamt ? `Satz abhaken · ${pauseText}` : 'Satz abhaken',
        onclick: () => {
          ctx.onRecord(wert, bewertung);
          if (item.rest && workout.setsDone() < gesamt) {
            onTimer({ mode: 'countdown', seconds: item.rest, label: 'Pause', isRest: true });
          }
        }
      })
    ));
  }

  if (!zaehlbar) {
    root.appendChild(el('div.note', { text: 'Freies Training — hier wird nichts gezählt. Hak die Übung ab, wenn du fertig bist.' }));
    root.appendChild(el('div.btnrow', {},
      el('button.btn.btn--primary.btn--wide', {
        type: 'button', text: 'Erledigt', onclick: () => ctx.onRecord(1, 'ok')
      })
    ));
  }

  if (zaehlbar && erledigt >= gesamt) {
    root.appendChild(el('div.note', { text: 'Alle Sätze erfasst.' }));
  }

  // ---- Navigation ----
  const nav = el('div.btnrow', {},
    erledigt > 0 ? el('button.btn.btn--sm', { type: 'button', text: 'Satz zurück', onclick: ctx.onUndo }) : null,
    workout.state.index > 0 ? el('button.btn.btn--sm', { type: 'button', text: 'Vorige Übung', onclick: ctx.onPrev }) : null,
    !workout.isLastExercise()
      ? el('button.btn.btn--sm', { type: 'button', text: 'Nächste Übung', onclick: ctx.onNext })
      : el('button.btn.btn--sm', { type: 'button', text: 'Einheit abschließen', onclick: onFinish })
  );
  root.appendChild(nav);

  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--sm.btn--ghost', { type: 'button', text: 'Training abbrechen', onclick: onAbort })
  ));

  if (wakeText) root.appendChild(el('p.overlay__wake', { text: wakeText, style: 'margin-top:16px' }));
}

/** Rückmeldung nach dem Abschluss: was wurde angepasst. */
export function renderSummary(root, { anpassungen, onBack }) {
  clear(root);
  root.appendChild(el('div.pagehead', {},
    el('h2', { text: 'Einheit abgeschlossen' }),
    el('p', { text: anpassungen.length ? 'Die Vorgaben für das nächste Mal wurden angepasst.' : 'Die Vorgaben bleiben unverändert.' })
  ));

  if (anpassungen.length) {
    const table = el('table.table', {},
      el('thead', {}, el('tr', {}, el('th', { text: 'Übung' }), el('th', { text: 'Anpassung' }))),
      el('tbody', {}, anpassungen.map(a => el('tr', {},
        el('td', {}, el('div', { text: a.name }), el('div.ex__meta', { text: a.reason })),
        el('td', {}, el('span', {
          class: 'badge ' + (a.delta > 0 ? 'badge--up' : 'badge--down'),
          text: a.delta > 0 ? 'schwerer' : 'leichter'
        }))
      )))
    );
    root.appendChild(table);
  }

  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--primary.btn--wide', { type: 'button', text: 'Zurück zum Plan', onclick: onBack })
  ));
}
