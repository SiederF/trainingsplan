/**
 * plan.js — der 14-Wochen-Plan als strukturierte Daten.
 *
 * Vorgaben sind Objekte, keine Textbausteine. Nur so kann die App
 * Sätze zählen und die Schwierigkeit automatisch nachjustieren.
 *
 * Vorgabe-Typen:
 *   reps     { sets, reps, load?, rest, perSide? }
 *   hold     { sets, hold, load?, rest }
 *   interval { sets, work, pause, rounds, load?, rest }
 *   free     { }                           — Bouldern, kein Zählen
 */

export const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const reps = (ex, sets, r, rest, extra = {}) => ({ ex, type: 'reps', sets, reps: r, rest, ...extra });
const hold = (ex, sets, h, rest, extra = {}) => ({ ex, type: 'hold', sets, hold: h, rest, ...extra });
const ival = (ex, sets, work, pause, rounds, rest, extra = {}) =>
  ({ ex, type: 'interval', sets, work, pause, rounds, rest, ...extra });
const free = ex => ({ ex, type: 'free' });

/* ------------------------------------------------------------------ */
/* Block 1 — Basis (Woche 1–4)                                         */
/* ------------------------------------------------------------------ */
const B1 = {
  pull: {
    1: [reps('pullup_vol', 6, 3, 120), hold('pullup_neg', 3, 5, 90), reps('row_db', 3, 12, 60, { perSide: true }),
        reps('toes_to_bar', 4, 3, 60), hold('front_lever_tuck', 5, 10, 60), reps('hammer_curl', 3, 10, 60)],
    2: [reps('pullup_vol', 6, 4, 120), hold('pullup_neg', 3, 5, 90), reps('row_db', 3, 14, 60, { perSide: true }),
        reps('toes_to_bar', 4, 4, 60), hold('front_lever_tuck', 5, 12, 60), reps('hammer_curl', 3, 10, 60)],
    3: [reps('pullup_vol', 7, 4, 120), hold('pullup_neg', 3, 5, 90), reps('row_db', 3, 15, 60, { perSide: true }),
        reps('toes_to_bar', 4, 5, 60), hold('front_lever_tuck', 5, 15, 60), reps('hammer_curl', 3, 12, 60)],
    4: [reps('pullup_vol', 5, 3, 120), hold('pullup_neg', 2, 5, 90), reps('row_db', 3, 12, 60, { perSide: true }),
        reps('toes_to_bar', 4, 3, 60), hold('front_lever_tuck', 5, 12, 60), reps('hammer_curl', 2, 10, 60)]
  },
  push: {
    1: [reps('dips', 4, 8, 120), reps('archer_pushup', 3, 8, 90, { perSide: true }), reps('db_press', 3, 12, 60),
        reps('db_fly', 3, 15, 60), reps('band_facepull', 3, 15, 45), reps('band_er', 3, 15, 45, { perSide: true }),
        reps('scap_pullup', 3, 10, 45), reps('wrist_curl', 2, 15, 45)],
    2: [reps('dips', 4, 10, 120), reps('archer_pushup', 3, 9, 90, { perSide: true }), reps('db_press', 3, 12, 60),
        reps('db_fly', 3, 15, 60), reps('band_facepull', 3, 15, 45), reps('band_er', 3, 15, 45, { perSide: true }),
        reps('scap_pullup', 3, 10, 45), reps('wrist_curl', 2, 15, 45)],
    3: [reps('dips_weighted', 4, 8, 150, { load: 5 }), reps('archer_pushup', 3, 10, 90, { perSide: true }),
        reps('db_press', 3, 12, 60), reps('db_fly', 3, 15, 60), reps('band_facepull', 3, 18, 45),
        reps('band_er', 3, 15, 45, { perSide: true }), reps('scap_pullup', 3, 12, 45), reps('wrist_curl', 3, 15, 45)],
    4: [reps('dips', 3, 8, 120), reps('archer_pushup', 2, 8, 90, { perSide: true }), reps('db_press', 2, 12, 60),
        reps('db_fly', 2, 15, 60), reps('band_facepull', 2, 15, 45), reps('band_er', 3, 15, 45, { perSide: true }),
        reps('scap_pullup', 3, 10, 45)]
  },
  board: {
    1: [ival('repeaters_20', 4, 7, 3, 6, 180, { load: 0 }), ival('repeaters_open', 3, 7, 3, 6, 180, { load: 0 }),
        hold('density_jug', 2, 40, 90), hold('hollow', 3, 30, 60)],
    2: [ival('repeaters_20', 4, 7, 3, 6, 180, { load: 2.5 }), ival('repeaters_open', 3, 7, 3, 6, 180, { load: 0 }),
        hold('density_jug', 2, 40, 90), hold('hollow', 3, 30, 60)],
    3: [ival('repeaters_20', 4, 7, 3, 6, 180, { load: 5 }), hold('maxhang_sloper', 3, 12, 150, { load: 0 }),
        hold('density_jug', 2, 45, 90), hold('hollow', 3, 30, 60)],
    4: [ival('repeaters_20', 3, 7, 3, 6, 180, { load: 2.5 }), ival('repeaters_open', 2, 7, 3, 6, 180, { load: 0 }),
        hold('density_jug', 2, 40, 90), hold('hollow', 3, 30, 60)]
  }
};

/* ------------------------------------------------------------------ */
/* Block 2 — Maximalkraft (Woche 6–9)                                  */
/* ------------------------------------------------------------------ */
const B2 = {
  pull: {
    6: [reps('pullup_weighted', 4, 3, 180, { load: 5 }), reps('pullup_strict', 3, 5, 120),
        hold('frenchies', 3, 5, 120, { note: '3 Halte pro Satz' }), reps('toes_to_bar', 4, 5, 60),
        hold('front_lever_tuck', 5, 15, 60), reps('hammer_curl', 3, 10, 60)],
    7: [reps('pullup_weighted', 4, 3, 180, { load: 7.5 }), reps('pullup_strict', 3, 6, 120),
        hold('frenchies', 3, 6, 120, { note: '3 Halte pro Satz' }), reps('toes_to_bar', 4, 6, 60),
        hold('front_lever_adv', 5, 8, 60), reps('hammer_curl', 3, 10, 60)],
    8: [reps('pullup_weighted', 4, 3, 180, { load: 7.5 }), reps('pullup_strict', 3, 6, 120),
        hold('frenchies', 3, 7, 120, { note: '3 Halte pro Satz' }), reps('toes_to_bar', 4, 7, 60),
        hold('front_lever_adv', 5, 10, 60), reps('hammer_curl', 3, 12, 60)],
    9: [reps('pullup_weighted', 4, 3, 180, { load: 10 }), reps('pullup_strict', 3, 7, 120),
        hold('frenchies', 3, 7, 120, { note: '3 Halte pro Satz' }), reps('toes_to_bar', 4, 8, 60),
        hold('front_lever_adv', 5, 12, 60), reps('hammer_curl', 3, 12, 60)]
  },
  push: {
    6: [reps('dips_weighted', 4, 6, 150, { load: 7.5 }), reps('archer_pushup', 3, 10, 90, { perSide: true }),
        reps('db_press', 3, 12, 60), reps('db_fly', 3, 15, 60), reps('band_facepull', 3, 18, 45),
        reps('band_er', 3, 15, 45, { perSide: true }), reps('scap_pullup', 3, 12, 45), reps('wrist_curl', 3, 15, 45)],
    7: [reps('dips_weighted', 4, 6, 150, { load: 10 }), reps('archer_pushup', 3, 10, 90, { perSide: true }),
        reps('db_press', 3, 12, 60), reps('db_fly', 3, 15, 60), reps('band_facepull', 3, 18, 45),
        reps('band_er', 3, 15, 45, { perSide: true }), reps('scap_pullup', 3, 12, 45), reps('wrist_curl', 3, 15, 45)],
    8: [reps('dips_weighted', 4, 5, 150, { load: 12.5 }), reps('archer_pushup', 3, 12, 90, { perSide: true }),
        reps('db_press', 3, 12, 60), reps('db_fly', 3, 15, 60), reps('band_facepull', 3, 20, 45),
        reps('band_er', 3, 15, 45, { perSide: true }), reps('scap_pullup', 3, 12, 45), reps('wrist_curl', 3, 15, 45)],
    9: [reps('dips_weighted', 4, 5, 150, { load: 12.5 }), reps('archer_pushup', 3, 12, 90, { perSide: true }),
        reps('db_press', 3, 12, 60), reps('db_fly', 3, 15, 60), reps('band_facepull', 3, 20, 45),
        reps('band_er', 3, 15, 45, { perSide: true }), reps('scap_pullup', 3, 12, 45), reps('wrist_curl', 3, 15, 45)]
  },
  board: {
    6: [hold('maxhang_20', 5, 10, 180, { load: 7.5 }), hold('maxhang_open', 3, 10, 180, { load: 5 }),
        reps('pallof', 3, 10, 45, { perSide: true })],
    7: [hold('maxhang_20', 5, 10, 180, { load: 10 }), hold('maxhang_sloper', 3, 10, 180, { load: 0 }),
        reps('pallof', 3, 10, 45, { perSide: true })],
    8: [hold('maxhang_20', 5, 10, 180, { load: 12.5 }), hold('maxhang_open', 3, 10, 180, { load: 7.5 }),
        reps('pallof', 3, 10, 45, { perSide: true })],
    9: [hold('maxhang_20', 5, 10, 180, { load: 15 }), hold('maxhang_sloper', 3, 10, 180, { load: 0 }),
        reps('pallof', 3, 10, 45, { perSide: true })]
  }
};

/* ------------------------------------------------------------------ */
/* Bausteine                                                           */
/* ------------------------------------------------------------------ */
const MOBILITY = [
  hold('m_9090', 2, 40, 10, { perSide: true }), hold('m_frog', 2, 40, 10),
  hold('m_couch', 2, 40, 10, { perSide: true }), hold('m_pancake', 2, 40, 10),
  reps('m_jeff', 2, 6, 30), reps('m_disloc', 2, 12, 30), hold('m_chest', 2, 40, 10, { perSide: true })
];

const NOHANG = ival('nohang', 1, 10, 50, 10, 0);

const TESTS = [
  hold('t_hang', 1, 10, 180), reps('t_pull', 1, 1, 180), reps('t_dip', 1, 1, 180),
  reps('t_core', 1, 1, 120), reps('t_hip', 1, 1, 60), reps('t_weight', 1, 1, 0)
];

const S = (id, kind, title, duration, items, opts = {}) =>
  ({ id, kind, title, duration, items, warmup: opts.warmup || [], note: opts.note || null });

/* ------------------------------------------------------------------ */
/* Wochen                                                              */
/* ------------------------------------------------------------------ */
function blockOf(w) {
  if (w <= 4)  return { key: 'b1', name: 'Block 1 · Basis — Volumen, Sehnen, Klimmzugbasis', deload: false };
  if (w === 5) return { key: 'dl', name: 'Deload und Test — halbes Volumen, Retest', deload: true };
  if (w <= 9)  return { key: 'b2', name: 'Block 2 · Maximalkraft — Zusatzgewicht, längere Pausen', deload: false };
  if (w === 10) return { key: 'dl', name: 'Deload und Test — halbes Volumen, Retest', deload: true };
  if (w <= 13) return { key: 'b3', name: 'Block 3 · Hypertrophie — Oberkörpermasse aufbauen', deload: false };
  return { key: 'dl', name: 'Deload und Abschlusstest — Zyklus auswerten', deload: true };
}

export function buildWeek(w) {
  const b = blockOf(w);
  const sessions = [];
  let daily = null;

  if (b.key === 'b1') {
    sessions.push(
      S('pull', 'strength', 'Kraft A — Pull und Core', '35 min', B1.pull[w], {
        warmup: ['w_dyn'],
        note: 'Volumenmethode: nie bis zum Versagen, immer zwei bis drei Wiederholungen in Reserve.'
      }),
      S('push', 'strength', 'Kraft B — Push und Antagonisten', '30 min', B1.push[w], {
        warmup: ['w_dyn'],
        note: 'Schwerere Varianten statt mehr Wiederholungen. Ab Woche 3 kommt die Weste an die Dips.'
      }),
      S('board', 'finger', 'Hangboard und Core', '30 min', B1.board[w], {
        warmup: ['w_fingers'],
        note: w === 1
          ? 'Woche 1 dient der Eichung: bei Körpergewicht hängen und merken, wie fordernd der letzte Durchgang war.'
          : 'Wenn der sechste Durchgang nicht mehr sauber hält, ist die Last zu hoch.'
      }),
      S('rock1', 'climb', 'Bouldern', 'Halle oder Fels', [free('explosive'), free('boulder_tech')], {
        warmup: ['w_dyn'],
        note: 'Die explosiven Züge kommen direkt nach dem Aufwärmen, im frischen Zustand. Im müden Zustand trainierst du Langsamkeit.' }),
      S('rock2', 'climb', 'Bouldern am Fels', 'Hauptsession', [free('explosive'), free('boulder_rock')], { warmup: ['w_dyn'] }),
      S('mob1', 'mobility', 'Mobility', '15 min', MOBILITY),
      S('mob2', 'mobility', 'Ruhe und Mobility', '15 min', MOBILITY)
    );
    if (w < 4) daily = NOHANG;
  }

  if (b.key === 'b2') {
    sessions.push(
      S('pull', 'strength', 'Kraft A — Pull und Core', '35 min', B2.pull[w], {
        warmup: ['w_dyn'], note: 'Bei 4 × 3 zählt jede Wiederholung sauber: kein Schwung, volle Streckung unten.'
      }),
      S('push', 'strength', 'Kraft B — Push und Antagonisten', '30 min', B2.push[w], { warmup: ['w_dyn'] }),
      S('board', 'finger', 'Hangboard und Core', '35 min', B2.board[w], {
        warmup: ['w_fingers'],
        note: 'Die Last stimmt, wenn nach zehn Sekunden noch zwei Sekunden Reserve wären. Sonst runtergehen, nicht durchbeißen.'
      }),
      S('rock1', 'climb', 'Bouldern', 'Halle oder Fels', [free('explosive'), free('boulder_limit')], {
        warmup: ['w_dyn'],
        note: 'Drei mal drei dynamische Antritte nach dem Aufwärmen, dann ins Projektieren. Explosivkraft trennt Boulderer von Routenkletterern und darf nicht komplett wegfallen.' }),
      S('rock2', 'climb', 'Bouldern am Fels', 'Hauptsession', [free('explosive'), free('boulder_rock')], { warmup: ['w_dyn'] }),
      S('mob1', 'mobility', 'Mobility', '15 min', MOBILITY),
      S('mob2', 'mobility', 'Ruhe und Mobility', '15 min', MOBILITY)
    );
    daily = NOHANG;
  }

  if (b.key === 'b3') {
    const n = w === 11 ? 3 : 4;
    sessions.push(
      S('push', 'strength', 'Push-Hypertrophie', '38 min', [
        reps('dips_weighted', n, 9, 120, { load: 5 }), reps('db_press', n, 13, 75),
        reps('archer_pushup', 3, 11, 75, { perSide: true }), reps('db_fly', 3, 17, 60),
        reps('tri_ext', 3, 13, 60), reps('band_facepull', 3, 20, 45)
      ], { warmup: ['w_dyn'],
        note: 'Hypertrophie statt Maximalkraft: leichtere Last, mehr Wiederholungen, jeder Satz bis ein bis zwei Wiederholungen vor dem Versagen. Konzentrisch bewusst explosiv hochdrücken, exzentrisch langsam ablassen — die Bewegungsabsicht erhält die Schnellkraft, ohne dass eine Übung dazukommt.' }),
      S('pull', 'strength', 'Pull-Hypertrophie', '38 min', [
        reps('pullup_weighted', n, 7, 120, { load: 5 }), reps('row_db', 4, 13, 75, { perSide: true }),
        reps('band_row', 3, 15, 60), reps('band_pullover', 3, 15, 60),
        reps('db_curl', 3, 13, 60), reps('scap_pullup', 3, 12, 45)
      ], { warmup: ['w_dyn'],
        note: 'Weniger Last, mehr Wiederholungen als in Block 2 — für Masse zählt Zeit unter Spannung, nicht die Maximallast.' }),
      S('board', 'finger', 'Hangboard, Core und Arme', '35 min', [
        hold('maxhang_hold', 3, 10, 180),
        hold(w === 12 ? 'maxhang_pocket' : 'onearm_assist', 3, 8, 150, { load: w === 12 ? 0 : -25 }),
        reps('toes_to_bar', 4, 8, 60), hold('front_lever_adv', 4, 12, 60),
        reps('hammer_curl', 3, 13, 60), reps('wrist_curl', 3, 17, 45), reps('band_er', 3, 15, 45, { perSide: true })
      ], { warmup: ['w_fingers'],
        note: 'Am Hangboard nur das Niveau halten. Steigern wäre bei diesem Krafttrainingsvolumen zu viel für die Sehnen.' }),
      S('rock1', 'climb', 'Bouldern', 'Halle oder Fels', [free('explosive'), free('boulder_tech')], {
        warmup: ['w_dyn'],
        note: 'In dieser Phase bewusst nicht am Anschlag klettern — die explosiven Züge bleiben trotzdem drin, damit die Schnellkraft im Aufbaublock nicht verloren geht.' }),
      S('rock2', 'climb', 'Bouldern am Fels', 'Hauptsession', [free('explosive'), free('boulder_rock')], { warmup: ['w_dyn'] }),
      S('mob1', 'mobility', 'Mobility', '15 min', MOBILITY),
      S('mob2', 'mobility', 'Ruhe und Mobility', '15 min', MOBILITY, {
        note: 'Ohne 3100 bis 3400 kcal und 130 bis 155 g Protein täglich wächst in diesem Block nichts.' })
    );
  }

  if (b.key === 'dl') {
    const leicht = w === 5
      ? [reps('pullup_vol', 3, 3, 120), hold('pullup_neg', 2, 5, 90),
         reps('row_db', 2, 12, 60, { perSide: true }), reps('toes_to_bar', 3, 3, 60)]
      : [reps('pullup_weighted', 3, 3, 180, { load: 5 }), reps('pullup_strict', 2, 4, 120),
         reps('row_db', 2, 12, 60, { perSide: true }), reps('toes_to_bar', 3, 5, 60)];
    sessions.push(
      S('pull', 'strength', 'Kraft leicht — Pull', '25 min', leicht, {
        warmup: ['w_dyn'], note: 'Volumen halbieren, Intensität halten.' }),
      S('push', 'strength', 'Kraft leicht — Push und Arme', '20 min', [
        reps('dips', 2, 8, 90), reps('db_press', 2, 12, 60), reps('db_fly', 2, 15, 60),
        reps('hammer_curl', 2, 12, 60), reps('band_facepull', 2, 15, 45), reps('band_er', 3, 15, 45, { perSide: true })
      ], { warmup: ['w_dyn'], note: 'Auch im Deload bleibt der Oberkörper dran, nur mit halbem Volumen.' }),
      S('test', 'test', 'Testtag', '40 min', TESTS, {
        warmup: ['w_fingers'],
        note: 'Immer gleich aufwärmen, immer ausgeruht. Ohne Vergleichszahlen weißt du nach dem nächsten Block nicht, ob er funktioniert hat.' }),
      S('rock1', 'climb', 'Bouldern locker', 'kein Limit', [free('boulder_tech')], { warmup: ['w_dyn'] }),
      S('rock2', 'climb', 'Bouldern locker', 'kein Limit', [free('boulder_tech')], { warmup: ['w_dyn'] }),
      S('mob1', 'mobility', 'Mobility', '15 min', MOBILITY),
      S('mob2', 'mobility', 'Ruhe und Mobility', '15 min', MOBILITY)
    );
  }

  return { n: w, block: b.key, blockName: b.name, deload: b.deload, sessions, daily };
}

export const WEEKS = Array.from({ length: 14 }, (_, i) => buildWeek(i + 1));
export const TOTAL_WEEKS = WEEKS.length;
