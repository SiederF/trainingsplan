/**
 * wakelock.js — hält den Bildschirm während einer Einheit wach.
 *
 * Die Sperre wird beim Betreten des Trainingsmodus angefordert und beim
 * Verlassen freigegeben. Wechselt der Nutzer kurz in eine andere App,
 * gibt das Betriebssystem die Sperre frei; beim Zurückkommen wird sie
 * automatisch neu angefordert.
 */

let lock = null;
let wanted = false;
const listeners = new Set();

const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export const isSupported = () => supported;

function notify(state) { listeners.forEach(fn => fn(state)); }

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function acquire() {
  wanted = true;
  if (!supported) { notify('unsupported'); return 'unsupported'; }
  if (lock) return 'active';
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; if (!wanted) notify('released'); });
    notify('active');
    return 'active';
  } catch {
    lock = null;
    notify('blocked');
    return 'blocked';
  }
}

export async function release() {
  wanted = false;
  if (lock) { try { await lock.release(); } catch {} lock = null; }
  notify('released');
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wanted && !lock) acquire();
  });
}

export const STATE_TEXT = {
  active: 'Bildschirm bleibt an',
  blocked: 'Bildschirmsperre blockiert — Auto-Sperre manuell ausschalten',
  unsupported: 'Dieser Browser kennt keine Bildschirmsperre — Auto-Sperre manuell ausschalten',
  released: ''
};
