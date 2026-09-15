/**
 * sound.js — kurze Signaltöne über die Web Audio API.
 * Keine Audiodateien, damit die App vollständig offline funktioniert.
 */

let ctx = null;
let enabled = true;

export function setEnabled(value) { enabled = !!value; }
export function isEnabled() { return enabled; }

function context() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, duration, gain = 0.3) {
  if (!enabled) return;
  const ac = context();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(0.0001, ac.currentTime);
  vol.gain.exponentialRampToValueAtTime(gain, ac.currentTime + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(vol); vol.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration + 0.02);
}

export const beepStart = () => tone(660, 0.12);
export const beepWork  = () => tone(880, 0.12);
export const beepRest  = () => tone(440, 0.14);
export const beepDone  = () => { tone(1040, 0.3, 0.35); };

/** Muss einmal aus einer Nutzeraktion heraus laufen (iOS-Anforderung). */
export function unlock() { context(); }
