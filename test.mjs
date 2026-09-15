/**
 * test.mjs — Prüft die Logik ohne Browser.
 * Aufruf: node test.mjs
 */

import { WEEKS, DAYS } from './js/data/plan.js';
import { EXERCISES, getExercise } from './js/data/exercises.js';
import { scheduleWeek, boulderDaysWarning } from './js/core/schedule.js';
import { applyLevel, evaluate, decayFor, effectiveLevel, describeLevel,
         isOvershoot, OVERSHOOT, OVERSHOOT_STREAK, MAX_EXTRA_SETS } from './js/core/progression.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; }
  else { fail++; console.log('  FEHLER: ' + name + (extra ? ' — ' + extra : '')); }
};
const section = t => console.log('\n' + t);

/* ---------- 1. Plandaten ---------- */
section('1. Plandaten');
ok('14 Wochen vorhanden', WEEKS.length === 14);
WEEKS.forEach(w => {
  ok('Woche ' + w.n + ' hat 7 Einheiten', w.sessions.length === 7, w.sessions.length + ' gefunden');
  w.sessions.forEach(s => {
    s.items.forEach(it => {
      ok('Übung bekannt: ' + it.ex, !!getExercise(it.ex));
      if (it.type === 'reps') ok(it.ex + ' hat Sätze und Wdh', it.sets > 0 && it.reps > 0);
      if (it.type === 'hold') ok(it.ex + ' hat Sätze und Haltezeit', it.sets > 0 && it.hold > 0);
      if (it.type === 'interval') ok(it.ex + ' hat Intervalldaten', it.work > 0 && it.rounds > 0);
    });
    s.warmup.forEach(id => ok('Aufwärmübung bekannt: ' + id, !!getExercise(id)));
  });
});

/* ---------- 2. Muskelabdeckung je Woche ---------- */
section('2. Muskelabdeckung');
const GRUPPEN = ['pull', 'push', 'core', 'finger'];
WEEKS.forEach(w => {
  const groups = new Set();
  w.sessions.forEach(s => s.items.forEach(it => {
    const ex = getExercise(it.ex);
    if (ex) groups.add(ex.group);
  }));
  GRUPPEN.forEach(g => ok(`Woche ${w.n} deckt ${g} ab`, groups.has(g)));
});

/* ---------- 3. Wochenplanung ---------- */
section('3. Wochenplanung um die Fels-Tage');
const KOMBIS = [[0], [1], [2], [3], [4], [5], [6], [1, 5], [3, 5], [0, 4], [2, 6], [1, 4]];
KOMBIS.forEach(bd => {
  WEEKS.forEach(w => {
    const lay = scheduleWeek(w, bd);
    ok(`W${w.n} ${bd}: sieben Slots`, lay.length === 7);
    const climbs = lay.filter(s => s && s.kind === 'climb').length;
    ok(`W${w.n} ${bd}: ${bd.length} Felstage belegt`, climbs === bd.length, climbs + ' gefunden');
    const belegt = lay.filter(Boolean).length;
    ok(`W${w.n} ${bd}: keine Einheit verloren`, belegt === 5 + bd.length, belegt + ' belegt');
    // Finger-Einheiten nicht an aufeinanderfolgenden Tagen
    for (let i = 0; i < 7; i++) {
      const a = lay[i], b = lay[(i + 1) % 7];
      const fin = s => s && ['finger', 'climb', 'test'].includes(s.kind);
      if (fin(a) && fin(b) && Math.min(...[bd[1] - bd[0], 7 - (bd[1] - bd[0])].filter(Number.isFinite)) >= 2) {
        ok(`W${w.n} ${bd}: kein Fingerdoppel an ${DAYS[i]}`, false);
      }
    }
  });
});
ok('Warnung bei benachbarten Felstagen', boulderDaysWarning([6, 0]) !== null);
ok('Keine Warnung bei Abstand', boulderDaysWarning([1, 5]) === null);

/* ---------- 4. Progression ---------- */
section('4. Progressionslogik');
const alleSauber = [{ target: 3, done: 3, rating: 'ok' }, { target: 3, done: 3, rating: 'leicht' }];
ok('Alle Sätze sauber → schwerer', evaluate(alleSauber).delta === 1);
ok('Am Limit → gleich', evaluate([{ target: 3, done: 3, rating: 'schwer' }]).delta === 0);
ok('Ein Satz knapp → gleich', evaluate([{ target: 3, done: 3, rating: 'ok' }, { target: 3, done: 2, rating: 'ok' }]).delta === 0);
ok('Zwei Sätze knapp → leichter', evaluate([{ target: 3, done: 2, rating: 'ok' }, { target: 3, done: 1, rating: 'ok' }]).delta === -1);
ok('Abbruch → leichter', evaluate([{ target: 3, done: 3, rating: 'fail' }]).delta === -1);
ok('Keine Daten → gleich', evaluate([]).delta === 0);

ok('Pause 5 Tage ohne Abschlag', decayFor(5) === 0);
ok('Pause 15 Tage → 1 Stufe', decayFor(15) === 1);
ok('Pause 30 Tage → 2 Stufen', decayFor(30) === 2);
ok('Pause 90 Tage → 3 Stufen', decayFor(90) === 3);

const vorGestern = new Date(Date.now() - 30 * 86400000).toISOString();
ok('Wirksames Level fällt nach Pause', effectiveLevel({ level: 4, lastDone: vorGestern }) === 2);
ok('Level nie unter −3', effectiveLevel({ level: -5, lastDone: null }) === -3);

/* ---------- 4b. 2-für-2-Regel ---------- */
section('4b. 2-für-2-Regel (NSCA / ACSM)');
const ueber = [{ target: 3, done: 3, rating: 'ok' }, { target: 3, done: 5, rating: 'leicht' }];
const knapp = [{ target: 3, done: 3, rating: 'ok' }, { target: 3, done: 4, rating: 'ok' }];

ok('Zwei Wdh über Ziel erkannt', isOvershoot(ueber, 'reps') === true);
ok('Eine Wdh über Ziel reicht nicht', isOvershoot(knapp, 'reps') === false);
ok('Haltezeit 20 % über Ziel erkannt', isOvershoot([{ target: 10, done: 12, rating: 'ok' }], 'hold') === true);
ok('Haltezeit 10 % über Ziel reicht nicht', isOvershoot([{ target: 10, done: 11, rating: 'ok' }], 'hold') === false);

const e1 = evaluate(ueber, { type: 'reps', exerciseId: 'dips', streak: 0 });
ok('Erste Überschreitung → einfacher Schritt', e1.delta === 1, 'delta ' + e1.delta);
ok('Erste Überschreitung merkt sich Serie', e1.streak === 1, 'streak ' + e1.streak);

const e2 = evaluate(ueber, { type: 'reps', exerciseId: 'dips', streak: 1 });
ok('Zweite Überschreitung → doppelter Schritt', e2.delta === 2, 'delta ' + e2.delta);
ok('Serie wird danach zurückgesetzt', e2.streak === 0);

const e3 = evaluate(alleSauber, { type: 'reps', exerciseId: 'dips', streak: 1 });
ok('Ohne Überschreitung bricht die Serie', e3.streak === 0 && e3.delta === 1);

const eFinger = evaluate(ueber, { type: 'reps', exerciseId: 'repeaters_20', streak: 1 });
ok('Am Hangboard kein Doppelschritt', eFinger.delta === 1, 'delta ' + eFinger.delta);

const eFail = evaluate([{ target: 3, done: 1, rating: 'fail' }], { type: 'reps', exerciseId: 'dips', streak: 5 });
ok('Abbruch löscht die Serie', eFail.streak === 0 && eFail.delta === -1);

/* ---------- 5. Vorgaben anpassen ---------- */
section('5. Vorgabenanpassung');
const wdhUebung = { ex: 'pullup_vol', type: 'reps', sets: 6, reps: 3, rest: 120 };
ok('Wiederholungen steigen', applyLevel(wdhUebung, 2).reps === 5);
ok('Wiederholungen fallen', applyLevel(wdhUebung, -1).reps === 2);
ok('Untergrenze greift', applyLevel(wdhUebung, -10).reps === EXERCISES.pullup_vol.progress.min);

const lastUebung = { ex: 'maxhang_20', type: 'hold', sets: 5, hold: 10, rest: 180, load: 7.5 };
ok('Last steigt um 2,5 kg', applyLevel(lastUebung, 1).load === 10);
ok('Haltezeit bleibt bei Last-Modus', applyLevel(lastUebung, 1).hold === 10);
ok('Last nie negativ', applyLevel(lastUebung, -20).load === 0);

const halteUebung = { ex: 'front_lever_tuck', type: 'hold', sets: 5, hold: 10, rest: 60 };
ok('Haltezeit steigt um 2 s', applyLevel(halteUebung, 1).hold === 12);

ok('Bouldern bleibt unverändert', applyLevel({ ex: 'boulder_rock', type: 'free' }, 3).adjusted === undefined);
ok('Beschreibung für Last', describeLevel('maxhang_20', 2) === '+5 kg gegenüber Plan');
ok('Beschreibung für Wdh', describeLevel('pullup_vol', -1) === '−1 Wdh gegenüber Plan');
ok('Keine Beschreibung ohne Anpassung', describeLevel('pullup_vol', 0) === null);

/* ---------- 6. Satzaufstockung an der Obergrenze ---------- */
section('6. Satzaufstockung');
const dipsMax = EXERCISES.dips.progress.max;      // 20
const dipsBasis = { ex: 'dips', type: 'reps', sets: 4, reps: 8, rest: 120 };
const anGrenze = applyLevel(dipsBasis, dipsMax - 8);
ok('An der Obergrenze noch keine Zusatzsätze', anGrenze.sets === 4 && anGrenze.reps === dipsMax);
const ueberGrenze = applyLevel(dipsBasis, dipsMax - 8 + 2);
ok('Zwei Wdh über Grenze → ein Satz mehr', ueberGrenze.sets === 5 && ueberGrenze.reps === dipsMax,
   'sets ' + ueberGrenze.sets + ' reps ' + ueberGrenze.reps);
const weitUeber = applyLevel(dipsBasis, dipsMax - 8 + 20);
ok('Satzaufstockung ist gedeckelt', weitUeber.sets === 4 + MAX_EXTRA_SETS, 'sets ' + weitUeber.sets);

/* ---------- 7. Lastsprung im empfohlenen Korridor ---------- */
section('7. Laststeigerung 2–10 % (ACSM)');
const koerper = 71;
const basisLast = { ex: 'maxhang_20', type: 'hold', sets: 5, hold: 10, rest: 180, load: 10 };
const gesamtVorher = koerper + basisLast.load;
const einfach = (applyLevel(basisLast, 1).load - basisLast.load) / gesamtVorher * 100;
const doppelt = (applyLevel(basisLast, 2).load - basisLast.load) / gesamtVorher * 100;
ok('Einfacher Schritt zwischen 2 und 10 %', einfach >= 2 && einfach <= 10, einfach.toFixed(1) + ' %');
ok('Doppelter Schritt zwischen 2 und 10 %', doppelt >= 2 && doppelt <= 10, doppelt.toFixed(1) + ' %');


/* ---------- 8. Tagesform und Fingerzustand ---------- */
import { anpassen, hatFinger, beschwerdeMuster, istFinger, SPERRE_EINHEITEN } from './js/core/readiness.js';
import { mitSperre } from './js/core/progression.js';

section('8. Tagesform und Fingerzustand');

const probe = [
  { ex: 'maxhang_20', type: 'hold', sets: 5, hold: 10, rest: 180, load: 15 },
  { ex: 'dips_weighted', type: 'reps', sets: 4, reps: 6, rest: 150, load: 10 },
  { ex: 'db_press', type: 'reps', sets: 3, reps: 12, rest: 60 }
];

const normal = anpassen(probe, { form: 'normal', finger: 'frei' });
ok('Normale Tagesform ändert nichts',
   normal.items[1].reps === 6 && normal.items[0].hold === 10 && normal.entfernt === 0);

const gut = anpassen(probe, { form: 'gut', finger: 'frei' });
ok('Gute Form: Wdh zehn Prozent hoch', gut.items[1].reps === 7, 'reps ' + gut.items[1].reps);
ok('Gute Form: Haltezeit hoch', gut.items[0].hold === 11, 'hold ' + gut.items[0].hold);
ok('Gute Form lässt die Last unverändert', gut.items[1].load === 10);

const muede = anpassen(probe, { form: 'schwach', finger: 'frei' });
ok('Müde: Wdh zehn Prozent runter', muede.items[1].reps === 5, 'reps ' + muede.items[1].reps);
ok('Müde lässt die Last unverändert', muede.items[0].load === 15);

const ziehen = anpassen(probe, { form: 'normal', finger: 'ziehen' });
ok('Ziehen senkt nur die Fingerlast', ziehen.items[0].load === 13.5, 'load ' + ziehen.items[0].load);
ok('Ziehen lässt Oberkörperlast unberührt', ziehen.items[1].load === 10);
ok('Ziehen sperrt die Steigerung', ziehen.items[0].keineSteigerung === true);
ok('Ziehen schaltet auf offenen Griff', ziehen.items[0].offenerGriff === true);

const schmerz = anpassen(probe, { form: 'normal', finger: 'schmerz' });
ok('Schmerz entfernt Fingerübungen', schmerz.entfernt === 1 && schmerz.items.length === 2);
ok('Schmerz lässt Push- und Pulltraining stehen',
   schmerz.items.every(i => !istFinger(i.ex)) && schmerz.items.length === 2);
ok('Schmerz erzeugt einen Hinweis', schmerz.hinweise.some(h => h.includes('Oberkörpertraining')));

ok('Hangboard löst die Fingerfrage aus',
   hatFinger({ items: [{ ex: 'maxhang_20' }], warmup: [] }) === true);
ok('Klettern löst die Fingerfrage aus',
   hatFinger({ items: [{ ex: 'boulder_rock' }], warmup: ['w_dyn'] }) === true);
ok('Reine Push-Einheit ohne Fingerfrage',
   hatFinger({ items: [{ ex: 'dips' }, { ex: 'db_press' }, { ex: 'wrist_curl' }], warmup: ['w_dyn'] }) === false);
ok('Handgelenk-Curls zählen nicht als Ringbandbelastung', istFinger('wrist_curl') === false);
ok('Klettern wird bei Schmerz nicht gestrichen',
   anpassen([{ ex: 'boulder_rock', type: 'free' }], { finger: 'schmerz' }).items.length === 1);
ok('Klettern bei Schmerz erzeugt eine Warnung',
   anpassen([{ ex: 'boulder_rock', type: 'free' }], { finger: 'schmerz' })
     .hinweise.some(h => h.includes('Ringbandrisse')));
// Jede Einheit mit Ringbandbelastung im echten Plan muss fragen
ok('Alle Board- und Klettertage fragen nach den Fingern',
   WEEKS.every(w => w.sessions.filter(s => s.kind === 'finger' || s.kind === 'climb').every(hatFinger)));

const heute = new Date().toISOString();
ok('Drei Meldungen ergeben ein Muster',
   beschwerdeMuster([1,2,3].map(() => ({ at: heute, readiness: { finger: 'ziehen' } }))) !== null);
ok('Zwei Meldungen noch nicht',
   beschwerdeMuster([1,2].map(() => ({ at: heute, readiness: { finger: 'ziehen' } }))) === null);

/* ---------- 9. Steigerungssperre ---------- */
section('9. Steigerungssperre nach Beschwerden');
const gutesErgebnis = { delta: 2, streak: 0, reason: 'x' };
const gesperrt = mitSperre(gutesErgebnis, SPERRE_EINHEITEN);
ok('Sperre verhindert den Sprung', gesperrt.delta === 0, 'delta ' + gesperrt.delta);
ok('Sperre zählt herunter', gesperrt.sperre === SPERRE_EINHEITEN - 1);
ok('Ohne Sperre bleibt der Sprung', mitSperre(gutesErgebnis, 0).delta === 2);
ok('Rückstufung bleibt trotz Sperre möglich',
   mitSperre({ delta: -1, streak: 0, reason: 'y' }, 2).delta === -1);

/* ---------- 10. Griffarten mit eigenem Fortschritt ---------- */
section('10. Griffarten getrennt');
['maxhang_20','maxhang_open','maxhang_sloper','maxhang_pocket','onearm_assist'].forEach(id =>
  ok('Eigener Eintrag: ' + id, !!EXERCISES[id] && EXERCISES[id].progress.mode === 'load'));
ok('Sloper darf mit Band entlastet werden', EXERCISES.maxhang_sloper.progress.min < 0);
ok('Einarmhang startet entlastet und endet bei null',
   EXERCISES.onearm_assist.progress.min === -40 && EXERCISES.onearm_assist.progress.max === 0);
const sloperLast = applyLevel({ ex: 'maxhang_sloper', type: 'hold', sets: 3, hold: 10, rest: 180, load: 0 }, 2);
ok('Sloperfortschritt rechnet eigenständig', sloperLast.load === 5, 'load ' + sloperLast.load);

/* ---------- 11. Neue Planinhalte ---------- */
section('11. Neue Planinhalte');
const alleIds = new Set();
WEEKS.forEach(w => w.sessions.forEach(s => s.items.forEach(i => alleIds.add(i.ex))));
ok('Sloper kommt im Plan vor', alleIds.has('maxhang_sloper'));
ok('Pocket kommt im Plan vor', alleIds.has('maxhang_pocket'));
ok('Einarmhang kommt im Plan vor', alleIds.has('onearm_assist'));
ok('Hüfttest kommt im Plan vor', alleIds.has('t_hip'));
// In Deload-Wochen gehört explosive Arbeit bewusst NICHT hinein.
const trainingsWochen = WEEKS.filter(w => !w.deload);
ok('Jeder Boulder-Tag im Training enthält explosive Züge',
   trainingsWochen.every(w =>
     w.sessions.filter(s => s.kind === 'climb').every(s => s.items.some(i => i.ex === 'explosive'))));
ok('Deload-Wochen bleiben ohne explosive Züge',
   WEEKS.filter(w => w.deload).every(w =>
     w.sessions.filter(s => s.kind === 'climb').every(s => !s.items.some(i => i.ex === 'explosive'))));


/* ---------- 12. Kraft-Gewichts-Verhältnis ---------- */
import { hangProzent, einordnung, kiloBis, zugDruck, naechsterZyklus } from './js/core/metrics.js';
import * as reha from './js/core/rehab.js';

section('12. Kraft-Gewichts-Verhältnis');
ok('71 kg plus 15 kg ergibt 121,1 %', hangProzent(71, 15) === 121.1, String(hangProzent(71, 15)));
ok('Ohne Zusatzlast sind es 100 %', hangProzent(71, 0) === 100);
ok('Ohne Körpergewicht kein Wert', hangProzent(0, 15) === null);

const e140 = einordnung(140);
ok('140 % trifft die 7a-Marke', e140.erreicht.pct === 140);
ok('Nächste Marke ist 7a+', e140.naechste.pct === 146);
ok('Unter allen Marken kein erreichter Grad', einordnung(120).erreicht === null);
ok('Über 158 % keine nächste Marke mehr', einordnung(160).naechste === null);

ok('Von +15 kg fehlen bis 158 % noch 26,2 kg',
   kiloBis(71, 158, 15) === 26.2, String(kiloBis(71, 158, 15)));
ok('Schwereres Körpergewicht verlangt mehr Zusatzlast',
   kiloBis(75, 158, 15) > kiloBis(71, 158, 15));

/* ---------- 13. Zug-Druck-Verhältnis ---------- */
section('13. Zug-Druck-Verhältnis');
const jetzt = new Date().toISOString();
const satz = (ex, n) => ({ ex, sets: Array.from({ length: n }, () => ({ target: 5, done: 5, rating: 'ok' })) });
ok('Ohne Daten keine Kennzahl', zugDruck([]) === null);
const ausgewogen = zugDruck([{ at: jetzt, items: [satz('pullup_vol', 6), satz('dips', 4)] }]);
ok('1,5 zu 1 gilt als ausgewogen', ausgewogen.bewertung === 'ausgewogen', String(ausgewogen.quote));
const schief = zugDruck([{ at: jetzt, items: [satz('pullup_vol', 9), satz('dips', 2)] }]);
ok('4,5 zu 1 wird als zugdominant erkannt', schief.bewertung === 'zugdominant', String(schief.quote));
ok('Warnung nennt die Schulter', schief.text.includes('Schulter'));
const alt = zugDruck([{ at: '2020-01-01T00:00:00Z', items: [satz('pullup_vol', 9)] }]);
ok('Alte Einträge fallen aus dem Fenster', alt === null);

/* ---------- 14. Empfehlung für Zyklus 2 ---------- */
section('14. Empfehlung für Zyklus 2');
ok('Unter 140 % → Fingerkraft', naechsterZyklus({ hangPct: 121 }).fokus === 'finger');
ok('Dazwischen → gemischt', naechsterZyklus({ hangPct: 148 }).fokus === 'gemischt');
ok('Ab 158 % → Technik', naechsterZyklus({ hangPct: 159 }).fokus === 'technik');
ok('Ohne Messwert wird nichts behauptet', naechsterZyklus({ hangPct: null }).fokus === 'messen');

/* ---------- 15. Wiedereinstieg nach Verletzung ---------- */
section('15. Wiedereinstieg nach Verletzung');
let r = reha.starten();
ok('Start auf Stufe 1', r.aktiv && r.stufe === 1 && r.schmerzfrei === 0);

const fingerFn = id => ['maxhang_20', 'repeaters_20', 'nohang'].includes(id);
const proben = [
  { ex: 'maxhang_20', type: 'hold', sets: 5, hold: 10, rest: 180, load: 15 },
  { ex: 'dips', type: 'reps', sets: 4, reps: 8, rest: 120 }
];
const begrenzt = reha.begrenzen(proben, r, fingerFn);
ok('Stufe 1 deckelt auf 30 % der Last', begrenzt.items[0].load === 4.5, String(begrenzt.items[0].load));
ok('Stufe 1 kürzt die Haltezeit', begrenzt.items[0].hold === 8, String(begrenzt.items[0].hold));
ok('Stufe 1 sperrt die Steigerung', begrenzt.items[0].keineSteigerung === true);
ok('Stufe 1 verlangt offenen Griff', begrenzt.items[0].rehabGriff === 'offen');
ok('Oberkörper bleibt unberührt', begrenzt.items[1].reps === 8 && !begrenzt.items[1].keineSteigerung);

for (let i = 0; i < reha.EINHEITEN_PRO_STUFE; i++) r = reha.nachEinheit(r, 'frei').zustand;
ok('Nach drei schmerzfreien Einheiten Stufe 2', r.stufe === 2, 'Stufe ' + r.stufe);

const nachZiehen = reha.nachEinheit({ ...r, schmerzfrei: 2 }, 'ziehen');
ok('Ziehen setzt den Zähler zurück', nachZiehen.zustand.schmerzfrei === 0 && nachZiehen.zustand.stufe === 2);

const nachSchmerz = reha.nachEinheit(r, 'schmerz');
ok('Schmerz führt eine Stufe zurück', nachSchmerz.zustand.stufe === 1);
ok('Rückstufung wird erklärt', nachSchmerz.meldung.includes('kein Rückschritt'));

let ende = { aktiv: true, stufe: reha.STUFEN.length, schmerzfrei: reha.EINHEITEN_PRO_STUFE - 1, seit: jetzt };
const fertig = reha.nachEinheit(ende, 'frei');
ok('Letzte Stufe beendet das Protokoll', fertig.fertig === true && fertig.zustand.aktiv === false);
ok('Ohne aktives Protokoll passiert nichts',
   reha.begrenzen(proben, reha.LEER, fingerFn).items[0].load === 15);



/* ---------- 16. Boulder-Protokoll ---------- */
import { GRADE, ERGEBNIS, istBesser, bestenGrad, verteilung, entwicklung,
         abstandZumZiel, felstage, neuerEintrag, ZIELGRAD } from './js/core/climbing.js';

section('16. Boulder-Protokoll');
const tagVor = n => new Date(Date.now() - n * 86400000).toISOString();
const b = (grad, ergebnis, vorTagen) => ({ at: tagVor(vorTagen), grad, ergebnis, versuche: 1, ort: '', notiz: '' });

ok('Skala ist aufsteigend sortiert', istBesser('7c', '7a') && istBesser('7a', '6c') && !istBesser('6a', '7a'));
ok('Zielgrad ist 7c', ZIELGRAD === '7c');

const eintraege = [
  b('7a', 'send', 5), b('6c+', 'flash', 10), b('7a+', 'send', 20),
  b('7b', 'projekt', 15),            // zählt nicht
  b('7c', 'versuch', 3),             // zählt nicht
  b('6c', 'send', 200)               // außerhalb des Fensters
];

ok('Bester gezählter Grad in 90 Tagen ist 7a+', bestenGrad(eintraege, 90) === '7a+', String(bestenGrad(eintraege, 90)));
ok('Projekte zählen nicht als Begehung', bestenGrad([b('8a', 'projekt', 1)], 90) === null);
ok('Versuche zählen nicht als Begehung', bestenGrad([b('8a', 'versuch', 1)], 90) === null);
ok('Flash zählt als Begehung', bestenGrad([b('7b', 'flash', 1)], 90) === '7b');
ok('Alte Begehungen fallen aus dem Fenster', bestenGrad([b('8a', 'send', 200)], 90) === null);

const v = verteilung(eintraege, 90);
ok('Verteilung enthält nur gezählte Grade', v.length === 3, JSON.stringify(v.map(x => x.grad)));
ok('Verteilung ist nach Schwierigkeit sortiert',
   v.map(x => GRADE.indexOf(x.grad)).every((n, i, a) => i === 0 || a[i - 1] < n));

const abst = abstandZumZiel(eintraege);
ok('Abstand zum Ziel wird berechnet', abst.best === '7a+' && abst.diff === GRADE.indexOf('7c') - GRADE.indexOf('7a+'),
   JSON.stringify(abst));

ok('Felstage zählen Kalendertage, nicht Einträge',
   felstage([b('7a', 'send', 1), b('6c', 'send', 1), b('7a', 'send', 3)], 28) === 2);

const hoch = entwicklung([b('7a', 'send', 10), b('6b', 'send', 100)]);
ok('Steigerung wird erkannt', hoch.richtung === 'hoch', hoch.richtung);
const gleich = entwicklung([b('7a', 'send', 10), b('7a', 'send', 100)]);
ok('Stagnation wird erkannt', gleich.richtung === 'gleich');
ok('Stagnation verweist auf Technik', gleich.text.includes('Technik'));
ok('Ohne Vorquartal kein Vergleich', entwicklung([b('7a', 'send', 10)]).richtung === 'neu');
ok('Ohne Daten keine Aussage', entwicklung([]).richtung === 'keine');

const e = neuerEintrag({ grad: '7a', ergebnis: 'flash', versuche: 0, ort: ' Gais ', notiz: 'x' });
ok('Neuer Eintrag bekommt Zeitstempel', typeof e.at === 'string' && e.at.includes('T'));
ok('Versuche mindestens eins', e.versuche === 1);
ok('Ort wird getrimmt', e.ort === 'Gais');
let warf = false;
try { neuerEintrag({ grad: '9z', ergebnis: 'send' }); } catch { warf = true; }
ok('Unbekannter Grad wird abgelehnt', warf);
warf = false;
try { neuerEintrag({ grad: '7a', ergebnis: 'quatsch' }); } catch { warf = true; }
ok('Unbekanntes Ergebnis wird abgelehnt', warf);

console.log(`\n${pass} Prüfungen bestanden, ${fail} fehlgeschlagen.`);
process.exit(fail ? 1 : 0);
