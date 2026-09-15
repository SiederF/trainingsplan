/**
 * notify.js — Systembenachrichtigung, wenn ein Timer im Hintergrund endet.
 *
 * Läuft die App im Hintergrund, drosseln Browser die Tonausgabe: Der
 * Signalton kommt dann möglicherweise gar nicht. Eine Benachrichtigung
 * kommt zuverlässig durch.
 *
 * Die Erlaubnis wird erst beim ersten Timerstart erfragt, nicht beim
 * Öffnen der App — eine Abfrage ohne erkennbaren Anlass wird meist
 * weggeklickt.
 */

let gefragt = false;

const verfuegbar = () => typeof Notification !== 'undefined';

export function erlaubnisAnfragen() {
  if (!verfuegbar() || gefragt) return;
  gefragt = true;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function melde(titel, text) {
  if (!verfuegbar() || Notification.permission !== 'granted') return false;
  try {
    // Über den Service Worker, falls vorhanden — auf Android zeigt Chrome
    // Benachrichtigungen aus dem Seitenkontext sonst nicht zuverlässig an.
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready
        .then(reg => reg.showNotification(titel, {
          body: text, icon: './assets/icon-192.png', tag: 'timer', renotify: true
        }))
        .catch(() => { new Notification(titel, { body: text }); });
      return true;
    }
    new Notification(titel, { body: text });
    return true;
  } catch { return false; }
}
