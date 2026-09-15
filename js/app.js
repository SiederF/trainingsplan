/**
 * app.js — Einstiegspunkt. Hält den Zustand zusammen und entscheidet,
 * welche Ansicht gezeichnet wird. Enthält bewusst keine Trainingslogik:
 * die liegt in core/, die Darstellung in ui/.
 */

import { WEEKS } from './data/plan.js';
import { scheduleWeek } from './core/schedule.js';
import { createWorkout } from './core/workout.js';
import * as store from './core/storage.js';
import * as secrets from './core/secrets.js';
import * as sync from './core/sync.js';
import { encrypt, decrypt, saltOf } from './core/crypto.js';
import * as wake from './core/wakelock.js';
import * as sound from './core/sound.js';
import { el, clear, $, DAY_LABEL } from './ui/dom.js';
import { renderPlan, renderWeekChips, renderDayStrip } from './ui/planView.js';
import { renderRunner, renderSummary } from './ui/runnerView.js';
import { renderProgress, renderSettings } from './ui/progressView.js';
import { createTimerOverlay } from './ui/timerOverlay.js';
import { renderSync } from './ui/syncView.js';

/** Wird bei jeder Veröffentlichung hochgezählt, zusammen mit CACHE in sw.js. */
export const APP_VERSION = '1.2.0';

/* Icons als SVG statt als Schriftzeichen: Zeichen wie ▤ oder ⚙ werden je
   nach Gerät unterschiedlich oder gar nicht dargestellt. */
const ICONS = {
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13.5h4M7.5 17h7"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V13M9.33 19.5V8M14.67 19.5v-6M20 19.5V4"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.6"/><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6"/></svg>'
};

const TABS = [
  { id: 'plan',     label: 'Plan' },
  { id: 'progress', label: 'Fortschritt' },
  { id: 'settings', label: 'Mehr' }
];

const app = {
  tab: 'plan',
  dayIndex: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
  settings: store.loadSettings(),
  workout: null,
  summary: null,
  wakeText: '',
  syncStatus: null,
  updateReady: false
};

const week = () => WEEKS[Math.min(app.settings.currentWeek, WEEKS.length) - 1];
const layout = () => scheduleWeek(week(), app.settings.boulderDays);

/* ---------------- Timer ---------------- */
const overlay = createTimerOverlay({
  onOpen: () => wake.acquire(),
  onClose: () => { if (!app.workout) wake.release(); }
});

wake.onChange(state => {
  app.wakeText = wake.STATE_TEXT[state] || '';
  overlay.setWakeText(app.wakeText);
  // Auch die Trainingsansicht zeigt den Zustand an — ohne dieses Neuzeichnen
  // bliebe dort der alte Text stehen, weil der Wechsel asynchron eintrifft.
  if (app.workout) render();
});

/* ---------------- Speichern ---------------- */
function updateSettings(next) {
  app.settings = next;
  store.saveSettings(next);
  sound.setEnabled(next.sound);
  render();
}

/* ---------------- Trainingsmodus ---------------- */
function startWorkout(session) {
  app.workout = createWorkout(week(), session);
  app.summary = null;
  sound.unlock();
  wake.acquire();
  render();
}

function finishWorkout() {
  if (!app.workout) return;
  app.summary = app.workout.finish();
  app.workout = null;
  wake.release();
  render();
}

function abortWorkout() {
  app.workout = null;
  wake.release();
  render();
}

/* ---------------- Zeichnen ---------------- */
const main = () => $('#view');

function render() {
  // Kopfzeile
  $('#week-label').textContent = 'Woche ' + week().n;
  $('#block-label').textContent = week().blockName;

  const chips = $('#weekchips');
  const strip = $('#daystrip');
  const inWorkout = Boolean(app.workout || app.summary);
  const showPlanNav = app.tab === 'plan' && !inWorkout;

  chips.hidden = !showPlanNav;
  strip.hidden = !showPlanNav;

  if (showPlanNav) {
    const completed = store.loadCompleted();
    renderWeekChips(chips, {
      weeks: WEEKS, current: week().n, completed,
      onSelect: n => updateSettings({ ...app.settings, currentWeek: n })
    });
    renderDayStrip(strip, {
      layout: layout(), week: week(), dayIndex: app.dayIndex, completed,
      onSelect: i => { app.dayIndex = i; render(); }
    });
  }

  // Navigationszustand. Während einer laufenden Einheit ist die Navigation
  // gesperrt, damit kein Fehltipp den erfassten Fortschritt verwirft —
  // der Ausstieg läuft über "Training abbrechen" im Trainingsmodus.
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.setAttribute('aria-selected', String(btn.dataset.tab === app.tab && !inWorkout));
    btn.disabled = Boolean(app.workout);
    btn.title = app.workout ? 'Während einer laufenden Einheit gesperrt' : '';
  });

  const root = main();

  if (app.updateReady) {
    root.appendChild(el('div.note', { style: 'margin-bottom:16px' },
      el('strong', { text: 'Neue Version bereit. ' }),
      'Beim Neuladen wird sie übernommen.',
      el('div.btnrow', {},
        el('button.btn.btn--primary.btn--sm', {
          type: 'button', text: 'Jetzt neu laden',
          onclick: () => location.reload()
        }),
        el('button.btn.btn--sm.btn--ghost', {
          type: 'button', text: 'Später',
          onclick: () => { app.updateReady = false; render(); }
        })
      )
    ));
  }

  if (app.summary) {
    renderSummary(root, { anpassungen: app.summary, onBack: () => { app.summary = null; render(); } });
    return;
  }

  if (app.workout) {
    renderRunner(root, {
      workout: app.workout,
      wakeText: app.wakeText,
      onTimer: cfg => overlay.open(cfg),
      onRecord: (wert, bewertung) => {
        app.workout.recordSet(wert, bewertung);
        if (app.workout.exerciseComplete() && !app.workout.isLastExercise()) app.workout.nextExercise();
        render();
      },
      onUndo: () => { app.workout.undoSet(); render(); },
      onNext: () => { app.workout.nextExercise(); render(); },
      onPrev: () => { app.workout.prevExercise(); render(); },
      onFinish: finishWorkout,
      onAbort: abortWorkout
    });
    return;
  }

  if (app.tab === 'plan') {
    renderPlan(root, {
      week: week(), layout: layout(), dayIndex: app.dayIndex,
      levels: store.loadLevels(), settings: app.settings,
      completed: store.loadCompleted(), onStart: startWorkout
    });
  } else if (app.tab === 'progress') {
    renderProgress(root, {
      weeks: WEEKS, week: week(), levels: store.loadLevels(),
      log: store.loadLog(), completed: store.loadCompleted(),
      onRepeatWeek: () => render(),
      onNextWeek: () => updateSettings({
        ...app.settings, currentWeek: Math.min(app.settings.currentWeek + 1, WEEKS.length)
      })
    });
  } else {
    renderSettings(root, {
      settings: app.settings,
      onChange: updateSettings,
      onExport: exportData,
      onImport: importData,
      onReset: resetData
    });
    const vslot = document.getElementById('version-slot');
    if (vslot) {
      vslot.appendChild(el('p.ex__meta', { text: 'Version ' + APP_VERSION }));
      vslot.appendChild(el('div.btnrow', {},
        el('button.btn.btn--sm', { type: 'button', text: 'Nach Update suchen', onclick: nachUpdateSuchen })
      ));
    }

    const slot = document.getElementById('sync-slot');
    if (slot) renderSync(slot, {
      eingerichtet: secrets.istEingerichtet(),
      entsperrt: secrets.istEntsperrt(),
      konfig: secrets.konfig(),
      status: app.syncStatus,
      onEinrichten: syncEinrichten,
      onEntsperren: syncEntsperren,
      onHoch: () => syncHochladen(),
      onRunter: () => syncHerunterladen(),
      onAuto: wert => { secrets.konfigSetzen({ auto: wert }); render(); },
      onAbschalten: syncAbschalten
    });
  }
}

/* ---------------- Daten ---------------- */
function exportData() {
  const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `trainingsplan-sicherung-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  try {
    store.importAll(JSON.parse(await file.text()));
    app.settings = store.loadSettings();
    render();
  } catch (err) {
    alert('Sicherung konnte nicht gelesen werden: ' + err.message);
  }
}

function resetData() {
  if (!confirm('Wirklich alle Fortschritte und Einstellungen löschen? Das lässt sich nicht rückgängig machen.')) return;
  store.resetAll();
  app.settings = store.loadSettings();
  app.tab = 'plan';
  render();
}

/* ---------------- Verschlüsselter Abgleich ---------------- */
function meldung(text, fehler = false) { app.syncStatus = { text, fehler }; render(); }

async function syncEinrichten({ passphrase, wiederholung, token, gistId }) {
  try {
    if (passphrase !== wiederholung) throw new Error('Die beiden Passphrasen stimmen nicht überein.');
    if (!token) throw new Error('Ohne Token kann nicht hochgeladen werden.');
    meldung('Schlüssel wird abgeleitet, das dauert einen Moment …');
    await secrets.einrichten(passphrase, token);
    await sync.tokenPruefen(token);
    if (gistId) secrets.konfigSetzen({ gistId });
    meldung('Eingerichtet. Lade jetzt den ersten Stand hoch.');
    await syncHochladen();
  } catch (err) {
    secrets.sperren();
    meldung(err.message, true);
  }
}

async function syncEntsperren(passphrase) {
  try {
    meldung('Entsperren …');
    await secrets.entsperren(passphrase);
    meldung('Entsperrt.');
    if (secrets.konfig().auto) await syncHerunterladen(true);
  } catch (err) { meldung(err.message, true); }
}

async function syncHochladen() {
  try {
    const token = await secrets.tokenHolen();
    const daten = store.exportAll();
    daten.syncedAt = new Date().toISOString();
    const key = secrets.schluesselHolen();
    const umschlag = await encrypt(daten, key, saltOf({ salt: secrets.konfig().salt }));
    umschlag.syncedAt = daten.syncedAt;

    let gistId = secrets.konfig().gistId;
    if (!gistId) {
      gistId = await sync.gistAnlegen(token, umschlag);
      secrets.konfigSetzen({ gistId });
    } else {
      await sync.hochladen(token, gistId, umschlag);
    }
    secrets.konfigSetzen({ lastSync: daten.syncedAt });
    meldung('Hochgeladen. Gist-ID: ' + gistId);
  } catch (err) { meldung(err.message, true); }
}

async function syncHerunterladen(still = false) {
  try {
    const token = await secrets.tokenHolen();
    const gistId = secrets.konfig().gistId;
    if (!gistId) throw new Error('Keine Gist-ID hinterlegt.');

    const umschlag = await sync.herunterladen(token, gistId);
    if (!umschlag) { meldung('Im Gist liegt noch kein Stand.', true); return; }

    const entfernt = umschlag.syncedAt || null;
    const richtung = sync.vergleiche(secrets.konfig().lastSync, entfernt);
    if (richtung === 'lokal' && !still) {
      meldung('Dein Gerät hat den neueren Stand. Lade lieber hoch, statt herunterzuladen.', true);
      return;
    }
    if (richtung === 'gleich' && still) { app.syncStatus = null; render(); return; }

    const daten = await decrypt(umschlag, secrets.schluesselHolen());
    store.importAll(daten);
    app.settings = store.loadSettings();
    secrets.konfigSetzen({ lastSync: entfernt });
    meldung('Stand übernommen' + (entfernt ? ' vom ' + new Date(entfernt).toLocaleString('de-DE') : '') + '.');
  } catch (err) { meldung(err.message, true); }
}

function syncAbschalten() {
  if (!confirm('Abgleich entfernen? Token und Gist-Verknüpfung werden gelöscht. Deine Trainingsdaten auf diesem Gerät bleiben erhalten.')) return;
  secrets.abschalten();
  meldung('Abgleich entfernt.');
}

/* ---------------- Aktualisierung ---------------- */
let swRegistration = null;
let updateGemeldet = false;

/** Sucht von Hand nach einer neuen Fassung. */
async function nachUpdateSuchen() {
  if (!swRegistration) { meldung('Diese Fassung läuft ohne Service Worker.', true); return; }
  try {
    await swRegistration.update();
    meldung(app.updateReady
      ? 'Neue Version gefunden.'
      : 'Kein Update gefunden — du hast die aktuelle Fassung.');
  } catch {
    meldung('Suche fehlgeschlagen. Bist du online?', true);
  }
}

/* ---------------- Aufbau ---------------- */
function buildNav() {
  const tabbar = $('#tabbar');
  const sidebar = $('#sidebar');
  TABS.forEach(t => {
    tabbar.appendChild(el('button.tab', {
      type: 'button', role: 'tab', 'data-tab': t.id, 'aria-selected': 'false',
      'aria-label': t.label,
      onclick: () => { app.tab = t.id; render(); }
    }, el('span.tab__icon', { html: ICONS[t.id] }), el('span', { text: t.label })));

    sidebar.appendChild(el('button.navitem', {
      type: 'button', role: 'tab', 'data-tab': t.id, 'aria-selected': 'false',
      onclick: () => { app.tab = t.id; render(); }
    }, el('span.tab__icon', { html: ICONS[t.id] }), el('span', { text: t.label })));
  });
}

function init() {
  if (!app.settings.startedAt) {
    app.settings.startedAt = new Date().toISOString();
    store.saveSettings(app.settings);
  }
  sound.setEnabled(app.settings.sound);
  document.body.appendChild(overlay.root);
  buildNav();
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        swRegistration = await navigator.serviceWorker.register('./sw.js');

        // Übernimmt ein neuer Service Worker, ist die neue Fassung im Cache.
        // Bewusst kein automatisches Neuladen: Das würde mitten in einer
        // Einheit die erfassten Sätze verwerfen.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (updateGemeldet) return;
          updateGemeldet = true;
          app.updateReady = true;
          render();
        });
      } catch { /* ohne Service Worker läuft die App trotzdem */ }
    });
  }
}

init();
