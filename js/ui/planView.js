/**
 * planView.js — zeigt die Woche und den gewählten Tag.
 * Reine Darstellung; jede Aktion läuft über Rückrufe an app.js.
 */

import { el, clear, formatPrescription, formatRest, DAY_LABEL } from './dom.js';
import { getExercise } from '../data/exercises.js';
import { applyLevel, effectiveLevel, describeLevel } from '../core/progression.js';
import { boulderDaysWarning } from '../core/schedule.js';

function exerciseRow(item, i, levels) {
  const ex = getExercise(item.ex);
  if (!ex) return null;

  const lvl = effectiveLevel(levels[item.ex]);
  const shown = applyLevel(item, lvl);
  const hinweis = describeLevel(item.ex, lvl);

  const info = el('div.ex__info', { hidden: true },
    el('p', { text: ex.desc }),
    el('p', {}, el('a', {
      href: ex.link, target: '_blank', rel: 'noopener',
      text: ex.link.includes('youtube') ? 'Video ansehen' : 'Quelle und Protokoll'
    }))
  );

  const meta = [formatRest(item.rest), item.note].filter(Boolean).join(' · ');

  return el('li.ex', {},
    el('div.ex__num', { text: String(i + 1) }),
    el('div', {},
      el('p.ex__name', { text: ex.name }),
      el('p.ex__presc', { text: formatPrescription(shown) }),
      meta ? el('p.ex__meta', { text: meta }) : null,
      hinweis ? el('p.ex__meta', {},
        el('span', { class: 'badge ' + (lvl > 0 ? 'badge--up' : 'badge--down'), text: hinweis })) : null,
      el('div.btnrow', {},
        el('button.btn.btn--sm', {
          type: 'button',
          onclick: e => { info.hidden = !info.hidden; e.currentTarget.textContent = info.hidden ? 'Erklärung' : 'Schließen'; },
          text: 'Erklärung'
        })
      ),
      info
    )
  );
}

export function renderPlan(root, ctx) {
  const { week, layout, dayIndex, levels, settings, completed, onStart } = ctx;
  clear(root);

  const session = layout[dayIndex];

  root.appendChild(el('div.pagehead', {},
    el('h2', { text: session ? session.title : 'Ruhetag' }),
    el('p', { text: `Woche ${week.n} · ${DAY_LABEL[dayIndex]}` + (session ? ' · ' + session.duration : '') })
  ));

  const warn = boulderDaysWarning(settings.boulderDays);
  if (warn) root.appendChild(el('div.note.note--warn', {}, el('strong', { text: 'Hinweis. ' }), warn));

  if (!session) {
    root.appendChild(el('div.note', {},
      el('strong', { text: 'Kein Training. ' }),
      'Regeneration ist Teil des Plans, nicht die Lücke dazwischen.'));
  } else {
    if (session.note) root.appendChild(el('div.note', { text: session.note }));

    const erledigt = Boolean(completed[week.n + '.' + session.id]);

    root.appendChild(el('div.btnrow', {},
      el('button.btn.btn--primary.btn--wide', {
        type: 'button', onclick: () => onStart(session),
        text: erledigt ? 'Einheit wiederholen' : 'Einheit starten'
      })
    ));
    if (erledigt) root.appendChild(el('p.ex__meta', { text: 'Diese Einheit ist in Woche ' + week.n + ' bereits abgeschlossen.' }));

    if (session.warmup?.length) {
      root.appendChild(el('p.sectiontitle', { text: 'Aufwärmen' }));
      const ol = el('ol.exlist');
      session.warmup.forEach((id, i) => {
        const row = exerciseRow({ ex: id, type: 'free' }, i, levels);
        if (row) ol.appendChild(row);
      });
      root.appendChild(ol);
    }

    root.appendChild(el('p.sectiontitle', { text: 'Hauptteil' }));
    const ol = el('ol.exlist');
    session.items.forEach((item, i) => {
      const row = exerciseRow(item, i, levels);
      if (row) ol.appendChild(row);
    });
    root.appendChild(ol);
  }

  if (week.daily) {
    root.appendChild(el('p.sectiontitle', { text: 'Täglich zusätzlich' }));
    const ol = el('ol.exlist');
    const row = exerciseRow(week.daily, 0, levels);
    if (row) ol.appendChild(row);
    root.appendChild(ol);
    root.appendChild(el('div.note', {
      text: week.n <= 3
        ? 'Zweimal täglich mit mindestens sechs Stunden Abstand. Ab Woche 4 nur noch einmal täglich.'
        : 'Einmal täglich an Tagen ohne Hangboard.'
    }));
  }
}

export function renderWeekChips(root, { weeks, current, completed, onSelect }) {
  clear(root);
  weeks.forEach(w => {
    const total = w.sessions.length;
    const done = w.sessions.filter(s => completed[w.n + '.' + s.id]).length;
    const btn = el('button.chip', {
      type: 'button',
      'aria-pressed': String(w.n === current),
      'aria-label': 'Woche ' + w.n,
      text: String(w.n),
      onclick: () => onSelect(w.n)
    });
    if (w.deload) btn.classList.add('chip--deload');
    if (done === total && total) btn.classList.add('chip--done');
    root.appendChild(btn);
  });
}

export function renderDayStrip(root, { layout, week, dayIndex, completed, onSelect }) {
  clear(root);
  DAY_LABEL.forEach((label, i) => {
    const s = layout[i];
    const dot = el('span.daystrip__dot');
    if (s) {
      dot.classList.add(s.kind === 'climb' ? 'daystrip__dot--rock' : 'daystrip__dot--work');
      if (completed[week.n + '.' + s.id]) dot.classList.add('daystrip__dot--done');
    }
    root.appendChild(el('button.daystrip__day', {
      type: 'button', 'aria-pressed': String(i === dayIndex), onclick: () => onSelect(i)
    }, label, dot));
  });
}
