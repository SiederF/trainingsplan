/**
 * syncView.js — Oberfläche für den verschlüsselten Abgleich.
 * Kennt die Krypto-Einzelheiten nicht, nur die Schnittstelle von secrets.js.
 */

import { el, clear } from './dom.js';
import { KRYPTO_INFO } from '../core/crypto.js';

const feld = (label, props) => el('div.field', {},
  el('label.field__label', { text: label }),
  el('input', {
    style: 'min-height:44px;padding:0 12px;border:1px solid var(--c-line);border-radius:10px;background:var(--c-surface);color:var(--c-text);width:100%',
    ...props
  })
);

export function renderSync(root, ctx) {
  const { eingerichtet, entsperrt, konfig, status, onEinrichten, onEntsperren, onHoch, onRunter, onAbschalten, onAuto } = ctx;
  clear(root);

  root.appendChild(el('p.sectiontitle', { text: 'Geräteabgleich (verschlüsselt)' }));

  if (status) {
    root.appendChild(el('div', {
      class: 'note' + (status.fehler ? ' note--warn' : ''), text: status.text
    }));
  }

  /* ---------- Noch nicht eingerichtet ---------- */
  if (!eingerichtet) {
    root.appendChild(el('div.note', {},
      el('strong', { text: 'So funktioniert es. ' }),
      'Deine Daten werden auf dem Gerät verschlüsselt und als unlesbarer Block in einem privaten GitHub-Gist abgelegt. GitHub sieht nur Kauderwelsch. Auf dem zweiten Gerät gibst du dieselbe Passphrase und dieselbe Gist-ID ein.'
    ));
    root.appendChild(el('div.note.note--warn', {},
      el('strong', { text: 'Die Passphrase kann niemand zurücksetzen. ' }),
      'Sie wird nirgends gespeichert. Ist sie weg, sind die Daten in der Wolke unlesbar — die lokalen Daten auf dem Gerät bleiben davon unberührt.'
    ));

    const pass = feld('Passphrase (mindestens 8 Zeichen)', { type: 'password', autocomplete: 'new-password', id: 'sync-pass' });
    const pass2 = feld('Passphrase wiederholen', { type: 'password', autocomplete: 'new-password', id: 'sync-pass2' });
    const token = feld('GitHub-Token mit Gist-Berechtigung', { type: 'password', autocomplete: 'off', id: 'sync-token' });
    const gist = feld('Gist-ID (leer lassen, um einen neuen anzulegen)', { type: 'text', autocomplete: 'off', id: 'sync-gist' });

    [pass, pass2, token, gist].forEach(f => { f.style.marginTop = '12px'; root.appendChild(f); });

    root.appendChild(el('div.btnrow', {},
      el('button.btn.btn--primary.btn--wide', {
        type: 'button', text: 'Abgleich einrichten',
        onclick: () => onEinrichten({
          passphrase: pass.querySelector('input').value,
          wiederholung: pass2.querySelector('input').value,
          token: token.querySelector('input').value.trim(),
          gistId: gist.querySelector('input').value.trim() || null
        })
      })
    ));

    root.appendChild(el('p.ex__meta', {
      text: `Verschlüsselung: ${KRYPTO_INFO.verfahren}, Schlüsselableitung ${KRYPTO_INFO.ableitung}.`,
      style: 'margin-top:12px'
    }));
    return;
  }

  /* ---------- Eingerichtet, aber gesperrt ---------- */
  if (!entsperrt) {
    root.appendChild(el('div.note', { text: 'Der Abgleich ist eingerichtet. Zum Hoch- oder Herunterladen brauchst du deine Passphrase — einmal pro Sitzung.' }));

    const pass = feld('Passphrase', { type: 'password', autocomplete: 'current-password', id: 'sync-unlock' });
    pass.style.marginTop = '12px';
    root.appendChild(pass);

    root.appendChild(el('div.btnrow', {},
      el('button.btn.btn--primary', {
        type: 'button', text: 'Entsperren',
        onclick: () => onEntsperren(pass.querySelector('input').value)
      }),
      el('button.btn.btn--ghost', { type: 'button', text: 'Abgleich entfernen', onclick: onAbschalten })
    ));
    return;
  }

  /* ---------- Entsperrt ---------- */
  root.appendChild(el('div.note', {},
    el('strong', { text: 'Entsperrt. ' }),
    konfig.lastSync
      ? 'Letzter Abgleich: ' + new Date(konfig.lastSync).toLocaleString('de-DE') + '.'
      : 'Noch kein Abgleich erfolgt.'
  ));

  root.appendChild(el('p.ex__meta', { text: 'Gist-ID: ' + (konfig.gistId || '—'), style: 'margin-top:8px' }));

  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--primary', { type: 'button', text: 'Jetzt hochladen', onclick: onHoch }),
    el('button.btn', { type: 'button', text: 'Jetzt herunterladen', onclick: onRunter })
  ));

  root.appendChild(el('div.btnrow', {},
    el('button.btn.btn--sm', {
      type: 'button', text: konfig.auto ? 'Automatisch beim Start: an' : 'Automatisch beim Start: aus',
      onclick: () => onAuto(!konfig.auto)
    }),
    el('button.btn.btn--sm.btn--ghost', { type: 'button', text: 'Abgleich entfernen', onclick: onAbschalten })
  ));

  root.appendChild(el('div.note', {
    text: 'Es gewinnt immer der neuere Stand. Trainiere also auf einem Gerät zu Ende und lade hoch, bevor du auf ein anderes wechselst.',
    style: 'margin-top:12px'
  }));
}
