/**
 * progressView.js — Fortschritt und Einstellungen.
 */

import { el, clear, DAY_LABEL, num } from './dom.js';
import { getExercise, GROUPS } from '../data/exercises.js';
import { effectiveLevel, describeLevel, daysSince, weekAdvice } from '../core/progression.js';
import { isPersistent } from '../core/storage.js';

export function renderProgress(root, ctx) {
  const { weeks, week, levels, log, completed, onRepeatWeek, onNextWeek } = ctx;
  clear(root);

  root.appendChild(el('div.pagehead', {},
    el('h2', { text: 'Fortschritt' }),
    el('p', { text: `Woche ${week.n} von ${weeks.length} · ${week.blockName}` })
  ));

  // ---- Kennzahlen ----
  const total = weeks.reduce((sum, w) => sum + w.sessions.length, 0);
  const doneAll = Object.keys(completed).length;
  const doneWeek = week.sessions.filter(s => completed[week.n + '.' + s.id]).length;
  const letzte = log.length ? daysSince(log[log.length - 1].at) : null;

  root.appendChild(el('div.stats', {},
    el('div.stat', {}, el('div.stat__val', { text: `${doneWeek}/${week.sessions.length}` }), el('div.stat__lab', { text: 'diese Woche' })),
    el('div.stat', {}, el('div.stat__val', { text: String(doneAll) }), el('div.stat__lab', { text: 'Einheiten gesamt' })),
    el('div.stat', {}, el('div.stat__val', { text: String(Math.round(doneAll / total * 100)) + '%' }), el('div.stat__lab', { text: 'vom Zyklus' })),
    el('div.stat', {}, el('div.stat__val', { text: letzte === null ? '—' : letzte === 0 ? 'heute' : letzte + 'd' }), el('div.stat__lab', { text: 'letztes Training' }))
  ));

  // ---- Wochenbalken ----
  root.appendChild(el('p.sectiontitle', { text: 'Einheiten je Woche' }));
  const bars = el('div.bars');
  weeks.forEach(w => {
    const d = w.sessions.filter(s => completed[w.n + '.' + s.id]).length;
    const h = Math.max(4, Math.round(d / w.sessions.length * 72));
    const b = el('div.bar', { style: `height:${h}px`, title: `Woche ${w.n}: ${d}/${w.sessions.length}` });
    if (d) b.classList.add('bar--on');
    bars.appendChild(b);
  });
  root.appendChild(bars);

  // ---- Wochenwechsel ----
  const rat = weekAdvice(doneWeek, week.sessions.length);
  root.appendChild(el('div.note', { text: rat.text, style: 'margin-top:20px' }));
  root.appendChild(el('div.btnrow', {},
    el('button.btn', { type: 'button', text: 'Woche wiederholen', onclick: onRepeatWeek }),
    el('button.btn.btn--primary', { type: 'button', text: 'Nächste Woche', onclick: onNextWeek })
  ));

  if (letzte !== null && letzte > 10) {
    root.appendChild(el('div.note.note--warn', {},
      el('strong', { text: 'Pause erkannt. ' }),
      `Seit ${letzte} Tagen kein Training erfasst. Die Vorgaben wurden automatisch zurückgestuft, damit der Wiedereinstieg nicht zu hart wird.`));
  }

  // ---- Anpassungen je Übung ----
  const angepasst = Object.entries(levels)
    .map(([id, entry]) => ({ id, lvl: effectiveLevel(entry), entry }))
    .filter(x => x.lvl !== 0 && getExercise(x.id))
    .sort((a, b) => b.lvl - a.lvl);

  if (angepasst.length) {
    root.appendChild(el('p.sectiontitle', { text: 'Aktuelle Anpassungen' }));
    root.appendChild(el('table.table', {},
      el('thead', {}, el('tr', {}, el('th', { text: 'Übung' }), el('th', { text: 'Bereich' }), el('th', { text: 'Abweichung' }))),
      el('tbody', {}, angepasst.map(x => {
        const ex = getExercise(x.id);
        return el('tr', {},
          el('td', { text: ex.name }),
          el('td', { text: GROUPS[ex.group] || '' }),
          el('td', {}, el('span', {
            class: 'badge ' + (x.lvl > 0 ? 'badge--up' : 'badge--down'),
            text: describeLevel(x.id, x.lvl) || ''
          }))
        );
      }))
    ));
  } else {
    root.appendChild(el('div.note', { text: 'Noch keine Anpassungen — die App folgt aktuell exakt dem Plan. Nach den ersten erfassten Einheiten erscheinen hier die Abweichungen.', style: 'margin-top:20px' }));
  }
}

export function renderSettings(root, ctx) {
  const { settings, onChange, onExport, onImport, onReset } = ctx;
  clear(root);

  root.appendChild(el('div.pagehead', {},
    el('h2', { text: 'Einstellungen' }),
    el('p', { text: 'Fels-Tage, Ton und Daten' })
  ));

  // ---- Fels-Tage ----
  root.appendChild(el('p.sectiontitle', { text: 'Fels-Tage' }));
  root.appendChild(el('div.note', { text: 'Wähle einen oder zwei Tage. Die übrigen Einheiten ordnen sich automatisch so an, dass zwischen Finger-Belastungen ein Tag Abstand bleibt.' }));

  const row = el('div.chiprow', { style: 'padding-inline:0;margin-top:12px' });
  DAY_LABEL.forEach((d, i) => {
    row.appendChild(el('button.chip.chip--sm.chip--cool', {
      type: 'button', 'aria-pressed': String(settings.boulderDays.includes(i)), text: d,
      onclick: () => {
        let days = [...settings.boulderDays];
        if (days.includes(i)) { if (days.length > 1) days = days.filter(x => x !== i); }
        else days = days.length >= 2 ? [days[1], i] : days.concat(i);
        onChange({ ...settings, boulderDays: days.sort((a, b) => a - b) });
      }
    }));
  });
  root.appendChild(row);

  // ---- Ton ----
  root.appendChild(el('p.sectiontitle', { text: 'Ton' }));
  root.appendChild(el('div.btnrow', {},
    el('button.btn', {
      type: 'button', text: settings.sound ? 'Signaltöne an' : 'Signaltöne aus',
      onclick: () => onChange({ ...settings, sound: !settings.sound })
    })
  ));

  // ---- Daten ----
  root.appendChild(el('p.sectiontitle', { text: 'Daten' }));
  if (!isPersistent()) {
    root.appendChild(el('div.note.note--warn', {},
      el('strong', { text: 'Kein dauerhafter Speicher. ' }),
      'Dieser Browser erlaubt keinen lokalen Speicher, etwa im privaten Fenster oder in einer eingebetteten Vorschau. Die App funktioniert, merkt sich aber nichts über den Neustart hinaus. Auf einer installierten Version oder normal geöffneten Seite ist das nicht der Fall.'));
  }
  root.appendChild(el('div.note', { text: 'Alle Daten liegen ausschließlich auf diesem Gerät. Nichts wird übertragen. Die Sicherung ist eine JSON-Datei, die du auch auf ein anderes Gerät laden kannst.' }));

  const fileInput = el('input', { type: 'file', accept: 'application/json', hidden: true });
  fileInput.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (f) onImport(f);
    fileInput.value = '';
  });

  root.appendChild(el('div.btnrow', {},
    el('button.btn', { type: 'button', text: 'Sicherung speichern', onclick: onExport }),
    el('button.btn', { type: 'button', text: 'Sicherung laden', onclick: () => fileInput.click() }),
    el('button.btn.btn--ghost', { type: 'button', text: 'Alles zurücksetzen', onclick: onReset }),
    fileInput
  ));

  // Der Abgleich wird von app.js in diesen Platzhalter gezeichnet.
  root.appendChild(el('div', { id: 'sync-slot' }));

  root.appendChild(el('p.sectiontitle', { text: 'Über' }));
  root.appendChild(el('div.note', { text: 'Trainingsplan für den Weg von Font 7a Richtung 7c. 14 Wochen in vier Blöcken, ausgelegt auf Beastmaker 2000, Kurzhanteln bis 10 kg, Parallelbar, 20-kg-Weste und Türbänder.' }));
  root.appendChild(el('div', { id: 'version-slot', style: 'margin-top:12px' }));
}
