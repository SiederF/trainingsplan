import { deriveKey, encrypt, decrypt, saltOf, randomBytes } from './js/core/crypto.js';
import { vergleiche } from './js/core/sync.js';

let pass=0, fail=0;
const ok=(n,c,x='')=>{ c?pass++:(fail++,console.log('  FEHLER: '+n+(x?' — '+x:''))); };

const daten = { version:1, settings:{ currentWeek:7, boulderDays:[1,5] },
                levels:{ dips:{level:3,lastDone:'2026-09-01T10:00:00Z',streak:1} },
                log:[{at:'2026-09-01T10:00:00Z',week:7,sessionId:'pull'}], completed:{'7.pull':'x'} };

// 1. Rundlauf
const salt = randomBytes(16);
const key  = await deriveKey('richtige-passphrase-123', salt);
const umschlag = await encrypt(daten, key, salt);

ok('Umschlag hat Formatnummer', umschlag.v === 1);
ok('Umschlag enthält Salt und IV', !!umschlag.salt && !!umschlag.iv);
ok('Klartext taucht nicht im Umschlag auf',
   !umschlag.data.includes('boulderDays') && !JSON.stringify(umschlag).includes('currentWeek'));
ok('IV ist bei jedem Vorgang neu',
   (await encrypt(daten, key, salt)).iv !== umschlag.iv);

const zurueck = await decrypt(umschlag, key);
ok('Daten kommen unverändert zurück', JSON.stringify(zurueck) === JSON.stringify(daten));

// 2. Falsche Passphrase
const falsch = await deriveKey('falsche-passphrase-123', saltOf(umschlag));
let geworfen = false;
try { await decrypt(umschlag, falsch); } catch { geworfen = true; }
ok('Falsche Passphrase schlägt fehl', geworfen);

// 3. Manipulation wird erkannt
const manipuliert = { ...umschlag };
const b = Buffer.from(manipuliert.data, 'base64'); b[10] ^= 0xff;
manipuliert.data = b.toString('base64');
geworfen = false;
try { await decrypt(manipuliert, key); } catch { geworfen = true; }
ok('Manipulierte Daten werden erkannt', geworfen);

// 4. Salt aus Umschlag ermöglicht Ableitung auf zweitem Gerät
const zweitGeraet = await deriveKey('richtige-passphrase-123', saltOf(umschlag));
const aufZweitGeraet = await decrypt(umschlag, zweitGeraet);
ok('Zweites Gerät kann mit gleicher Passphrase lesen',
   aufZweitGeraet.settings.currentWeek === 7);

// 5. Zu kurze Passphrase
geworfen = false;
try { await deriveKey('kurz', salt); } catch { geworfen = true; }
ok('Zu kurze Passphrase wird abgelehnt', geworfen);

// 6. Konfliktentscheidung
ok('Neuerer lokaler Stand gewinnt',
   vergleiche('2026-09-02T10:00:00Z','2026-09-01T10:00:00Z') === 'lokal');
ok('Neuerer entfernter Stand gewinnt',
   vergleiche('2026-09-01T10:00:00Z','2026-09-02T10:00:00Z') === 'entfernt');
ok('Gleichstand erkannt',
   vergleiche('2026-09-01T10:00:00Z','2026-09-01T10:00:00Z') === 'gleich');
ok('Ohne entfernten Stand gilt lokal', vergleiche('2026-09-01T10:00:00Z', null) === 'lokal');
ok('Ohne lokalen Stand gilt entfernt', vergleiche(null, '2026-09-01T10:00:00Z') === 'entfernt');

// 7. Grosse Datenmenge (Base64-Schleife)
const gross = { log: Array.from({length: 600}, (_,i)=>({ at:'2026-09-01T10:00:00Z', week:i%14+1, sessionId:'pull', items:[{ex:'dips',sets:[{target:8,done:9,rating:'ok'}]}] })) };
const grossUm = await encrypt(gross, key, salt);
const grossZurueck = await decrypt(grossUm, key);
ok('Großer Datenstand überlebt den Rundlauf', grossZurueck.log.length === 600);

console.log(`${pass} Prüfungen bestanden, ${fail} fehlgeschlagen.`);
process.exit(fail ? 1 : 0);
