/**
 * progressView.js — Fortschritt und Einstellungen.
 */

import { el, clear, DAY_LABEL, num } from './dom.js';
import { getExercise, GROUPS } from '../data/exercises.js';
import { effectiveLevel, describeLevel, daysSince, weekAdvice } from '../core/progression.js';
import { isPersistent } from '../core/storage.js';
import { hangProzent, einordnung, kiloBis, zugDruck, naechsterZyklus, BENCHMARKS } from '../core/metrics.js';
import { STUFEN, EINHEITEN_PRO_STUFE, stufeVon } from '../core/rehab.js';
import { renderClimbStats } from './climbLogView.js';
import { bestenGrad, ZIELGRAD, gradIndex } from '../core/climbing.js';

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

  // ---- Bouldern: das eigentliche Ziel zuerst ----
  renderClimbStats(root, {
    boulders: ctx.boulders || [],
    onNeu: ctx.onNeuerBoulder,
    onLoeschen: ctx.onBoulderLoeschen
  });

  // ---- Kraft-Gewichts-Verhältnis ----
  const kg = ctx.koerpergewicht;
  const last = ctx.hangLast;
  const pct = hangProzent(kg, last);
  const ein = einordnung(pct);

  root.appendChild(el('p.sectiontitle', { text: 'Kraft-Gewichts-Verhältnis' }));
  if (pct == null) {
    root.appendChild(el('div.note', { text: 'Trag unter Mehr dein Körpergewicht ein, dann erscheint hier die entscheidende Kennzahl: die Hanglast in Prozent des Körpergewichts.' }));
  } else {
    root.appendChild(el('div.stats', {},
      el('div.stat', {}, el('div.stat__val', { text: pct.toLocaleString('de-DE') + ' %' }), el('div.stat__lab', { text: 'Max Hang 20 mm' })),
      el('div.stat', {}, el('div.stat__val', { text: kg.toLocaleString('de-DE') + ' kg' }), el('div.stat__lab', { text: 'Körpergewicht' })),
      el('div.stat', {}, el('div.stat__val', { text: '+' + num(last) + ' kg' }), el('div.stat__lab', { text: 'Zusatzlast' })),
      el('div.stat', {}, el('div.stat__val', { text: ein.erreicht ? ein.erreicht.grad.split(' / ')[0] : 'unter 6c' }), el('div.stat__lab', { text: 'entspricht etwa' }))
    ));

    const bis7c = kiloBis(kg, 158, last);
    root.appendChild(el('div.note', {},
      ein.naechste
        ? `Bis ${ein.naechste.grad} fehlen ${ein.luecke.toLocaleString('de-DE')} Prozentpunkte. Zur 7c-Marke von 158 Prozent sind es noch ${bis7c.toLocaleString('de-DE')} kg Zusatzlast.`
        : 'Du liegst über allen hinterlegten Marken.'
    ));
    root.appendChild(el('p.ex__meta', {
      text: 'Die Prozentmarken sind aus öffentlichem Lattice-Videomaterial rekonstruiert, nicht peer-reviewed. Orientierung, kein Maßstab.',
      style: 'margin-top:8px'
    }));

    if (ctx.gewichtsWarnung) {
      root.appendChild(el('div.note.note--warn', {}, el('strong', { text: 'Achtung. ' }), ctx.gewichtsWarnung));
    }
  }

  // ---- Zug-Druck-Verhältnis ----
  const zd = zugDruck(log);
  if (zd) {
    root.appendChild(el('p.sectiontitle', { text: 'Zug und Druck, letzte vier Wochen' }));
    root.appendChild(el('div', {
      class: 'note' + (zd.bewertung === 'zugdominant' ? ' note--warn' : ''), text: zd.text
    }));
    root.appendChild(el('p.ex__meta', { text: `${zd.zug} Zugsätze, ${zd.druck} Drucksätze`, style: 'margin-top:8px' }));
  }

  // ---- Wiedereinstieg ----
  if (ctx.rehab?.aktiv) {
    const st = stufeVon(ctx.rehab);
    root.appendChild(el('p.sectiontitle', { text: 'Wiedereinstieg nach Verletzung' }));
    root.appendChild(el('div.note.note--warn', {},
      el('strong', { text: st.titel + '. ' }), st.text,
      el('p.ex__meta', { text: `Schmerzfrei: ${ctx.rehab.schmerzfrei} von ${EINHEITEN_PRO_STUFE} · Stufe ${st.nr} von ${STUFEN.length}`, style: 'margin-top:8px' })
    ));
  }

  // ---- Empfehlung für den nächsten Zyklus ----
  if (week.n >= 13) {
    const best = bestenGrad(ctx.boulders || [], 180);
    const emp = naechsterZyklus({
      hangPct: pct,
      gradErreicht: best ? gradIndex(best) >= gradIndex(ZIELGRAD) : false
    });
    root.appendChild(el('p.sectiontitle', { text: 'Nach diesem Zyklus' }));
    root.appendChild(el('div.note', {}, el('strong', { text: emp.titel + '. ' }), emp.text));
  }

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

  // ---- Körpergewicht ----
  root.appendChild(el('p.sectiontitle', { text: 'Körpergewicht' }));
  root.appendChild(el('div.note', { text: 'Grundlage für das Kraft-Gewichts-Verhältnis. Morgens nüchtern wiegen, einmal pro Woche reicht.' }));
  const gewFeld = el('input', {
    type: 'number', step: '0.1', min: '30', max: '200', value: String(settings.koerpergewicht ?? ''),
    style: 'min-height:44px;padding:0 12px;border:1px solid var(--c-line);border-radius:10px;background:var(--c-surface);color:var(--c-text);width:100%;margin-top:12px'
  });
  root.appendChild(gewFeld);
  root.appendChild(el('div.btnrow', {},
    el('button.btn', {
      type: 'button', text: 'Gewicht speichern',
      onclick: () => ctx.onGewicht(Number(gewFeld.value))
    })
  ));

  // ---- Wiedereinstieg ----
  root.appendChild(el('p.sectiontitle', { text: 'Wiedereinstieg nach Fingerverletzung' }));
  if (ctx.rehab?.aktiv) {
    const st = stufeVon(ctx.rehab);
    root.appendChild(el('div.note.note--warn', {}, el('strong', { text: st.titel + '. ' }), st.text));
    root.appendChild(el('div.btnrow', {},
      el('button.btn', { type: 'button', text: 'Wiedereinstieg beenden', onclick: ctx.onRehabEnde })
    ));
  } else {
    root.appendChild(el('div.note', { text: 'Schaltet ein abgestuftes Protokoll ein: Die Fingerlast startet bei dreißig Prozent und steigt erst nach drei schmerzfreien Einheiten je Stufe. Oberkörpertraining läuft unverändert weiter. Ersetzt keine Diagnose — bei Knacken, Schwellung oder Bogensehnenbildung gehört das abgeklärt.' }));
    root.appendChild(el('div.btnrow', {},
      el('button.btn', { type: 'button', text: 'Wiedereinstieg starten', onclick: ctx.onRehabStart })
    ));
  }

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
