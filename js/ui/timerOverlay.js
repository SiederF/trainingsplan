/**
 * timerOverlay.js — Vollbild-Timer. Kennt nur die Timer-Engine und
 * die Tonausgabe, nicht den Trainingszustand.
 */

import { el, clear } from './dom.js';
import { createTimer, formatTime } from '../core/timer.js';
import * as sound from '../core/sound.js';

const CIRC = 2 * Math.PI * 45;

export function createTimerOverlay({ onOpen, onClose }) {
  const digits = el('div.dial__digits', { text: '0:00' });
  const prog = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  prog.setAttribute('class', 'dial__prog');
  prog.setAttribute('cx', '50'); prog.setAttribute('cy', '50'); prog.setAttribute('r', '45');
  prog.setAttribute('stroke-dasharray', String(CIRC));
  prog.setAttribute('stroke-dashoffset', '0');

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('class', 'dial__track');
  track.setAttribute('cx', '50'); track.setAttribute('cy', '50'); track.setAttribute('r', '45');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  svg.append(track, prog);

  const phase = el('p.overlay__phase', { text: '' });
  const rounds = el('p.overlay__rounds', { text: '' });
  const label = el('p.overlay__label', { text: '' });
  const wake = el('p.overlay__wake', { text: '' });
  const pauseBtn = el('button.btn', { type: 'button', text: 'Pause' });
  const stopBtn = el('button.btn.btn--primary', { type: 'button', text: 'Beenden' });

  const root = el('div.overlay', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Timer', hidden: true },
    phase, rounds,
    el('div.dial', {}, svg, digits),
    label, wake,
    el('div.btnrow', {}, pauseBtn, stopBtn)
  );

  const timer = createTimer({
    onTick: ({ remaining, total, phase: ph, round, rounds: rs, label: lab }) => {
      digits.textContent = formatTime(remaining);
      const frac = total > 0 ? Math.max(0, remaining / total) : 0;
      prog.setAttribute('stroke-dashoffset', String(CIRC * (1 - frac)));
      const rest = ph === 'rest';
      prog.classList.toggle('dial__prog--rest', rest);
      phase.classList.toggle('overlay__phase--rest', rest);
      phase.textContent = lab;
      rounds.textContent = rs > 1 ? `Durchgang ${round} von ${rs}` : '';
    },
    onPhase: ({ phase: ph }) => { ph === 'rest' ? sound.beepRest() : sound.beepWork(); },
    onDone: () => { sound.beepDone(); close(); }
  });

  function open(config) {
    sound.unlock();
    label.textContent = config.label || '';
    root.hidden = false;
    pauseBtn.textContent = 'Pause';
    onOpen?.();
    sound.beepStart();
    timer.start(config);
  }

  function close() {
    timer.stop(true);
    root.hidden = true;
    onClose?.();
  }

  pauseBtn.addEventListener('click', () => {
    const paused = timer.toggle();
    pauseBtn.textContent = paused ? 'Weiter' : 'Pause';
  });
  stopBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !root.hidden) close(); });

  return { root, open, close, setWakeText: t => { wake.textContent = t || ''; } };
}
