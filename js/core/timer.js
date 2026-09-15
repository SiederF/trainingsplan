/**
 * timer.js — Zeitmessung ohne Oberfläche.
 *
 * Rechnet gegen die Systemzeit, nicht gegen die Zahl der Ticks. Damit
 * läuft der Timer korrekt weiter, wenn der Browser das Intervall
 * drosselt, weil die App im Hintergrund ist.
 *
 * Zwei Betriebsarten:
 *   countdown  einmalig, z. B. 10 s Hang oder 3 min Pause
 *   interval   Wechsel Belastung/Pause über mehrere Durchgänge
 */

const TICK = 100;

export function createTimer({ onTick, onPhase, onDone }) {
  let cfg = null, phase = 'work', round = 1, total = 0;
  let endsAt = 0, remaining = 0, paused = false, handle = null;

  function emit() {
    onTick?.({ remaining, total, phase, round, rounds: cfg?.rounds ?? 1, paused, label: labelFor() });
  }

  function labelFor() {
    if (!cfg) return '';
    if (cfg.mode === 'countdown') return cfg.label || 'Los';
    return phase === 'work' ? (cfg.workLabel || 'Belastung') : (cfg.restLabel || 'Pause');
  }

  function goto(seconds, nextPhase) {
    phase = nextPhase; total = seconds; remaining = seconds;
    endsAt = Date.now() + seconds * 1000;
    onPhase?.({ phase, round, label: labelFor() });
    emit();
  }

  function tick() {
    if (paused || !cfg) return;
    remaining = (endsAt - Date.now()) / 1000;
    if (remaining <= 0) {
      if (cfg.mode === 'countdown') { finish(); return; }
      if (phase === 'work') {
        if (round >= cfg.rounds) { finish(); return; }
        goto(cfg.rest, 'rest');
      } else {
        round += 1;
        goto(cfg.work, 'work');
      }
      return;
    }
    emit();
  }

  function finish() {
    stop(true);
    onDone?.();
  }

  function start(config) {
    stop(true);
    cfg = config;
    round = 1;
    paused = false;
    goto(cfg.mode === 'countdown' ? cfg.seconds : cfg.work, cfg.isRest ? 'rest' : 'work');
    handle = setInterval(tick, TICK);
  }

  function stop(silent) {
    if (handle) { clearInterval(handle); handle = null; }
    if (!silent) { cfg = null; emit(); }
  }

  function toggle() {
    if (!cfg) return;
    paused = !paused;
    if (!paused) endsAt = Date.now() + remaining * 1000;
    emit();
    return paused;
  }

  return {
    start, stop, toggle,
    isRunning: () => handle !== null,
    countdown: (seconds, label, isRest = false) => start({ mode: 'countdown', seconds, label, isRest }),
    interval: (work, rest, rounds, workLabel, restLabel) =>
      start({ mode: 'interval', work, rest, rounds, workLabel, restLabel })
  };
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
