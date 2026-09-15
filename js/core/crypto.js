/**
 * crypto.js — Ende-zu-Ende-Verschlüsselung der Trainingsdaten.
 *
 * Alles wird auf dem Gerät ver- und entschlüsselt. Was GitHub zu sehen
 * bekommt, ist ausschließlich Kauderwelsch. Der Schlüssel verlässt das
 * Gerät nie und wird auch nicht gespeichert — er wird bei jedem Start
 * neu aus der Passphrase abgeleitet.
 *
 * Verfahren:
 *   Schlüsselableitung  PBKDF2-HMAC-SHA256, 600.000 Runden, 16 Byte Salt
 *   Verschlüsselung     AES-GCM, 256 Bit, 12 Byte Zufalls-IV je Vorgang
 *
 * Die 600.000 Runden entsprechen der OWASP-Empfehlung für PBKDF2-SHA256.
 * Auf einem Handy dauert das knapp eine Sekunde — einmal pro Sitzung,
 * nicht pro Speichervorgang, weil der abgeleitete Schlüssel im
 * Arbeitsspeicher gehalten wird.
 *
 * AES-GCM prüft die Echtheit mit: Wurde an den Daten manipuliert oder ist
 * die Passphrase falsch, schlägt das Entschlüsseln fehl, statt Unsinn
 * zurückzugeben.
 */

const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const FORMAT = 1;

const te = new TextEncoder();
const td = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;

/** Uint8Array → Base64, schrittweise wegen großer Datenmengen. */
function toB64(bytes) {
  const arr = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < arr.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, arr.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function fromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const randomBytes = n => globalThis.crypto.getRandomValues(new Uint8Array(n));

/**
 * Schlüssel aus Passphrase ableiten.
 * @param {string} passphrase
 * @param {Uint8Array} salt  bei bestehenden Daten das gespeicherte Salt
 */
export async function deriveKey(passphrase, salt) {
  if (!passphrase || passphrase.length < 8)
    throw new Error('Die Passphrase muss mindestens 8 Zeichen haben.');

  const material = await subtle().importKey(
    'raw', te.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );

  return subtle().deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Objekt verschlüsseln. Das Salt wandert mit in den Umschlag, damit sich
 * derselbe Schlüssel auf einem anderen Gerät ableiten lässt.
 * @returns {{v:number, salt:string, iv:string, data:string}}
 */
export async function encrypt(obj, key, salt) {
  const iv = randomBytes(IV_BYTES);
  const klartext = te.encode(JSON.stringify(obj));
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, key, klartext);
  return { v: FORMAT, salt: toB64(salt), iv: toB64(iv), data: toB64(ct) };
}

/** Umschlag entschlüsseln. Wirft bei falscher Passphrase oder Manipulation. */
export async function decrypt(envelope, key) {
  if (!envelope || envelope.v !== FORMAT) throw new Error('Unbekanntes Dateiformat.');
  try {
    const klartext = await subtle().decrypt(
      { name: 'AES-GCM', iv: fromB64(envelope.iv) }, key, fromB64(envelope.data)
    );
    return JSON.parse(td.decode(klartext));
  } catch {
    throw new Error('Entschlüsselung fehlgeschlagen — falsche Passphrase oder beschädigte Daten.');
  }
}

/** Salt aus einem vorhandenen Umschlag lesen, sonst ein neues erzeugen. */
export function saltOf(envelope) {
  return envelope?.salt ? fromB64(envelope.salt) : randomBytes(SALT_BYTES);
}

export const KRYPTO_INFO = {
  verfahren: 'AES-GCM 256 Bit',
  ableitung: `PBKDF2-SHA256, ${ITERATIONS.toLocaleString('de-DE')} Runden`
};
