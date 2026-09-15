/**
 * secrets.js — verwaltet Token und Passphrase.
 *
 * Kernpunkt: Das GitHub-Token liegt nicht im Klartext auf dem Gerät. Es
 * wird mit demselben Schlüssel verschlüsselt, der auch die Trainingsdaten
 * schützt. Wer das entsperrte Gerät in die Hand bekommt, findet ohne
 * Passphrase nur einen unlesbaren Block.
 *
 * Die Passphrase selbst wird nirgends gespeichert. Sie wird einmal pro
 * Sitzung eingegeben; der daraus abgeleitete Schlüssel bleibt nur im
 * Arbeitsspeicher und ist beim Schließen der App weg.
 */

import { read, write, remove } from './storage.js';
import { deriveKey, encrypt, decrypt, saltOf, randomBytes } from './crypto.js';

const KEY_CONFIG = 'sync';      // unverschlüsselt: Gist-ID, Salt, Zeitstempel
const KEY_SECRET = 'secret';    // verschlüsselt: das Token

const LEER = { gistId: null, salt: null, lastSync: null, auto: true };

let schluessel = null;          // CryptoKey, nur im Arbeitsspeicher

export const istEntsperrt = () => schluessel !== null;
export const schluesselHolen = () => schluessel;

export const konfig = () => ({ ...LEER, ...read(KEY_CONFIG, LEER) });
export const konfigSetzen = c => write(KEY_CONFIG, { ...konfig(), ...c });

export const istEingerichtet = () => Boolean(konfig().salt && read(KEY_SECRET, null));

/**
 * Erstmalige Einrichtung: Passphrase wählen, Token verschlüsselt ablegen.
 */
export async function einrichten(passphrase, token) {
  const salt = randomBytes(16);
  schluessel = await deriveKey(passphrase, salt);
  const umschlag = await encrypt({ token }, schluessel, salt);
  write(KEY_SECRET, umschlag);
  konfigSetzen({ salt: umschlag.salt });
  return true;
}

/**
 * Sitzung entsperren. Wirft, wenn die Passphrase nicht passt.
 * @returns {string} das entschlüsselte Token
 */
export async function entsperren(passphrase) {
  const umschlag = read(KEY_SECRET, null);
  if (!umschlag) throw new Error('Noch nichts eingerichtet.');
  const key = await deriveKey(passphrase, saltOf(umschlag));
  const inhalt = await decrypt(umschlag, key);   // wirft bei falscher Passphrase
  schluessel = key;
  return inhalt.token;
}

/** Token der laufenden Sitzung holen. Setzt eine entsperrte Sitzung voraus. */
export async function tokenHolen() {
  if (!schluessel) throw new Error('Sitzung ist gesperrt.');
  const umschlag = read(KEY_SECRET, null);
  if (!umschlag) throw new Error('Kein Token hinterlegt.');
  return (await decrypt(umschlag, schluessel)).token;
}

/** Schlüssel aus dem Arbeitsspeicher werfen. */
export function sperren() { schluessel = null; }

/** Synchronisierung vollständig entfernen. Trainingsdaten bleiben erhalten. */
export function abschalten() {
  schluessel = null;
  remove(KEY_SECRET);
  remove(KEY_CONFIG);
}
