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

/* ---------- Ergebnis ---------- */
console.log(`\n${pass} Prüfungen bestanden, ${fail} fehlgeschlagen.`);
process.exit(fail ? 1 : 0);
