/**
 * sync.js — Abgleich über einen privaten GitHub-Gist.
 *
 * Ablauf: Die App verschlüsselt den gesamten Datenstand und legt ihn als
 * eine Datei in einem Gist ab. Beim Start holt sie ihn zurück. GitHub
 * speichert also nur den verschlüsselten Umschlag.
 *
 * Konfliktbehandlung: Es gewinnt der neuere Zeitstempel. Das genügt, weil
 * immer nur ein Gerät gleichzeitig trainiert. Ist der Stand in der Wolke
 * neuer als der letzte Abgleich dieses Geräts, meldet die App das, statt
 * still zu überschreiben.
 *
 * Das Token wird nie im Klartext abgelegt — es liegt selbst verschlüsselt
 * unter derselben Passphrase (siehe secrets.js).
 */

const API = 'https://api.github.com';
const DATEINAME = 'trainingsplan.enc.json';
const BESCHREIBUNG = 'Trainingsplan — verschlüsselter Datenstand (nicht von Hand bearbeiten)';

function headers(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

async function anfrage(pfad, token, optionen = {}) {
  const res = await fetch(API + pfad, { ...optionen, headers: headers(token) });
  if (res.status === 401) throw new Error('Token abgelehnt. Ist es abgelaufen oder fehlt die Gist-Berechtigung?');
  if (res.status === 403) throw new Error('Zugriff verweigert. Das Token braucht die Berechtigung für Gists.');
  if (res.status === 404) throw new Error('Gist nicht gefunden. Stimmt die Gist-ID?');
  if (!res.ok) throw new Error('GitHub antwortete mit Fehler ' + res.status + '.');
  return res.json();
}

/** Prüft Token und Berechtigung, ohne etwas zu verändern. */
export async function tokenPruefen(token) {
  const res = await fetch(API + '/gists?per_page=1', { headers: headers(token) });
  if (res.status === 401) throw new Error('Token ungültig.');
  if (!res.ok) throw new Error('Prüfung fehlgeschlagen (Fehler ' + res.status + ').');
  return true;
}

/** Legt einen neuen privaten Gist an und gibt dessen ID zurück. */
export async function gistAnlegen(token, umschlag) {
  const gist = await anfrage('/gists', token, {
    method: 'POST',
    body: JSON.stringify({
      description: BESCHREIBUNG,
      public: false,
      files: { [DATEINAME]: { content: JSON.stringify(umschlag) } }
    })
  });
  return gist.id;
}

/** Schreibt den Umschlag in einen bestehenden Gist. */
export async function hochladen(token, gistId, umschlag) {
  await anfrage('/gists/' + gistId, token, {
    method: 'PATCH',
    body: JSON.stringify({
      files: { [DATEINAME]: { content: JSON.stringify(umschlag) } }
    })
  });
  return true;
}

/** Holt den Umschlag. Gibt null zurück, wenn der Gist leer ist. */
export async function herunterladen(token, gistId) {
  const gist = await anfrage('/gists/' + gistId, token);
  const datei = gist.files?.[DATEINAME];
  if (!datei) return null;

  // Sehr große Gists liefert GitHub gekürzt, dann steht die Rohadresse bereit.
  const inhalt = datei.truncated
    ? await (await fetch(datei.raw_url)).text()
    : datei.content;

  try { return JSON.parse(inhalt); }
  catch { throw new Error('Der Inhalt des Gists ist unlesbar.'); }
}

/**
 * Entscheidet, welcher Stand gilt.
 * @returns 'lokal' | 'entfernt' | 'gleich'
 */
export function vergleiche(lokalIso, entferntIso) {
  if (!entferntIso) return 'lokal';
  if (!lokalIso) return 'entfernt';
  const l = new Date(lokalIso).getTime(), e = new Date(entferntIso).getTime();
  if (Math.abs(l - e) < 1000) return 'gleich';
  return l > e ? 'lokal' : 'entfernt';
}

export const GIST_DATEINAME = DATEINAME;
