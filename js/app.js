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

const TABS = [
  { id: 'plan',     label: 'Plan',       icon: '▤' },
  { id: 'progress', label: 'Fortschritt', icon: '◔' },
  { id: 'settings', label: 'Mehr',       icon: '⚙' }
];

const app = {
  tab: 'plan',
  dayIndex: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
  settings: store.loadSettings(),
  workout: null,
  summary: null,
  wakeText: '',
  syncStatus: null
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

/* ---------------- Aufbau ---------------- */
function buildNav() {
  const tabbar = $('#tabbar');
  const sidebar = $('#sidebar');
  TABS.forEach(t => {
    tabbar.appendChild(el('button.tab', {
      type: 'button', role: 'tab', 'data-tab': t.id, 'aria-selected': 'false',
      onclick: () => { app.tab = t.id; render(); }
    }, el('span.tab__icon', { text: t.icon }), t.label));

    sidebar.appendChild(el('button.navitem', {
      type: 'button', role: 'tab', 'data-tab': t.id, 'aria-selected': 'false',
      onclick: () => { app.tab = t.id; render(); }
    }, el('span.tab__icon', { text: t.icon }), t.label));
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
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

init();
