/**
 * exercises.js — reine Stammdaten. Keine Logik, keine DOM-Zugriffe.
 *
 * progress.mode bestimmt, woran die App eine Übung schwerer oder leichter macht:
 *   'reps' → Wiederholungen ±step
 *   'load' → Zusatzgewicht ±step (kg)
 *   'hold' → Haltezeit ±step (s)
 *   'none' → nicht automatisch anpassbar (Bouldern, Mobility)
 */

const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

export const GROUPS = {
  pull: 'Rücken & Bizeps',
  push: 'Brust, Schulter & Trizeps',
  core: 'Rumpf',
  finger: 'Finger & Unterarm',
  mobility: 'Beweglichkeit',
  climb: 'Klettern',
  prehab: 'Prävention'
};

export const EXERCISES = {
  /* ---------------- Ziehen ---------------- */
  pullup_vol: {
    name: 'Klimmzug — Volumenmethode', group: 'pull',
    progress: { mode: 'reps', step: 1, min: 2, max: 10 },
    desc: 'Schulterbreiter Obergriff, Schultern vor dem Zug aktiv nach unten, Kinn über die Stange, kontrolliert ablassen. Nie bis zum Versagen: In jedem Satz bleiben zwei bis drei Wiederholungen übrig. Viele frische Sätze bauen die Wiederholungszahl schneller auf als wenige ausbelastete.',
    link: yt('strict pull up technique scapular')
  },
  pullup_neg: {
    name: 'Klimmzug-Negative', group: 'pull',
    progress: { mode: 'hold', step: 1, min: 3, max: 10 },
    desc: 'Hochspringen bis Kinn über der Stange, dann gleichmäßig ablassen. Unten aktiv abfangen, nicht in die Schultern fallen.',
    link: yt('negative pull up eccentric tutorial')
  },
  pullup_weighted: {
    name: 'Klimmzug mit Zusatzgewicht', group: 'pull',
    progress: { mode: 'load', step: 2.5, min: 0, max: 20 },
    desc: 'Gewichtsweste teilweise beladen, volle Bewegung, kein Schwung. Wenn die letzte Wiederholung unsauber wird, ist die Last zu hoch.',
    link: yt('weighted pull ups climbers technique')
  },
  pullup_strict: {
    name: 'Klimmzug strikt', group: 'pull',
    progress: { mode: 'reps', step: 1, min: 2, max: 15 },
    desc: 'Ohne Zusatzgewicht, saubere Ausführung, zwei Wiederholungen vor dem Versagen abbrechen.',
    link: yt('strict pull up form')
  },
  row_db: {
    name: 'Einarmiges Rudern (Kurzhantel)', group: 'pull',
    progress: { mode: 'reps', step: 1, min: 8, max: 20 },
    desc: 'Knie und Hand abgestützt, Rücken flach. Hantel zur Hüfte ziehen, Schulterblatt zur Wirbelsäule, drei Sekunden ablassen. Gegengewicht zur vielen vertikalen Zugarbeit.',
    link: yt('single arm dumbbell row form')
  },
  band_row: {
    name: 'Band-Rudern horizontal', group: 'pull',
    progress: { mode: 'reps', step: 2, min: 10, max: 25 },
    desc: 'Band auf Brusthöhe in der Tür, zurücklehnen, zum Bauchnabel ziehen, Schulterblätter zusammen. Horizontales Ziehen als zweite Ebene neben dem Klimmzug.',
    link: yt('band row horizontal form')
  },
  band_pullover: {
    name: 'Band-Pullover', group: 'pull',
    progress: { mode: 'reps', step: 2, min: 10, max: 25 },
    desc: 'Band hoch in der Tür, Arme fast gestreckt zu den Oberschenkeln ziehen. Isoliert den Latissimus ohne Bizepsbeteiligung.',
    link: yt('band straight arm pullover lat')
  },
  frenchies: {
    name: 'Frenchies', group: 'pull',
    progress: { mode: 'hold', step: 1, min: 3, max: 12 },
    desc: 'Klimmzug hoch, auf halbem Weg halten, dann weiter ablassen. Trainiert Haltekraft in der Position, die du am Fels beim Umgreifen brauchst.',
    link: yt('frenchies climbing pull up exercise')
  },
  hammer_curl: {
    name: 'Hammer Curls (10 kg)', group: 'pull',
    progress: { mode: 'reps', step: 1, min: 8, max: 20 },
    desc: 'Neutraler Griff, Daumen oben, vier Sekunden ablassen. Da 10 kg nahe deinem Maximum sind, läuft die Progression über Wiederholungen und Absenkgeschwindigkeit, nicht über Last.',
    link: yt('hammer curl form technique')
  },
  db_curl: {
    name: 'Bizeps-Curls (supiniert)', group: 'pull',
    progress: { mode: 'reps', step: 1, min: 8, max: 20 },
    desc: 'Handflächen nach oben, Ellbogen am Körper fixiert, kein Schwung aus der Hüfte, vier Sekunden ablassen.',
    link: yt('dumbbell biceps curl strict form')
  },
  scap_pullup: {
    name: 'Scapular Pull-ups', group: 'prehab',
    progress: { mode: 'reps', step: 1, min: 6, max: 20 },
    desc: 'An der Stange hängen, Arme gestreckt, nur die Schulterblätter nach unten und hinten ziehen. Kleiner Weg, große Wirkung für die Schulterkontrolle.',
    link: yt('scapular pull ups tutorial')
  },

  /* ---------------- Drücken ---------------- */
  dips: {
    name: 'Dips am Barren', group: 'push',
    progress: { mode: 'reps', step: 1, min: 4, max: 20 },
    desc: 'Schultern unten und hinten, leicht vorgelehnt, nur bis Oberarm waagerecht ablassen. Tiefer belastet die Schultervorderseite unnötig.',
    link: yt('parallel bar dips proper depth')
  },
  dips_weighted: {
    name: 'Dips mit Zusatzgewicht', group: 'push',
    progress: { mode: 'load', step: 2.5, min: 0, max: 20 },
    desc: 'Weste teilweise beladen, gleiche Tiefe wie ohne. Wenn die Schulter zwickt, Tiefe reduzieren statt Gewicht.',
    link: yt('weighted dips technique')
  },
  archer_pushup: {
    name: 'Archer-Liegestütz', group: 'push',
    progress: { mode: 'reps', step: 1, min: 4, max: 15 },
    desc: 'Breite Handposition, Gewicht auf einen Arm verlagern, der andere bleibt gestreckt. Schwerere Variante statt mehr normaler Wiederholungen.',
    link: yt('archer push up tutorial')
  },
  db_press: {
    name: 'Kurzhantel-Schulterdrücken', group: 'push',
    progress: { mode: 'reps', step: 1, min: 8, max: 20 },
    desc: 'Sitzend oder stehend, drei Sekunden exzentrisch ablassen. Die langsame Absenkphase holt aus leichten Hanteln den Wachstumsreiz heraus.',
    link: yt('dumbbell shoulder press form')
  },
  db_fly: {
    name: 'Kurzhantel-Fliegende am Boden', group: 'push',
    progress: { mode: 'reps', step: 2, min: 10, max: 25 },
    desc: 'Rückenlage, Arme leicht gebeugt weit öffnen bis die Oberarme den Boden berühren, dann zusammenführen. Der Boden begrenzt die Dehnung und schützt die Schulter.',
    link: yt('floor dumbbell fly')
  },
  tri_ext: {
    name: 'Trizeps-Überkopfdrücken', group: 'push',
    progress: { mode: 'reps', step: 1, min: 8, max: 20 },
    desc: 'Eine Kurzhantel beidhändig hinter den Kopf senken, Ellbogen eng und nach oben zeigend. Trifft den langen Trizepskopf in gedehnter Position.',
    link: yt('overhead dumbbell triceps extension form')
  },
  band_facepull: {
    name: 'Face Pull (Band)', group: 'prehab',
    progress: { mode: 'reps', step: 2, min: 12, max: 30 },
    desc: 'Band auf Kopfhöhe, mit beiden Händen zum Gesicht ziehen, Ellbogen hoch und außen, kurz halten. Hintere Schulter und oberer Rücken.',
    link: yt('band face pull rear delt form')
  },
  band_er: {
    name: 'Band-Außenrotation', group: 'prehab',
    progress: { mode: 'reps', step: 2, min: 10, max: 25 },
    desc: 'Band auf Ellbogenhöhe, Oberarm am Körper, Unterarm nach außen rotieren. Nicht optional — das ist die Versicherung gegen Schulterprobleme.',
    link: yt('band external rotation rotator cuff')
  },
  wrist_curl: {
    name: 'Handgelenk- und Reverse Curls', group: 'prehab',
    progress: { mode: 'reps', step: 2, min: 10, max: 30 },
    desc: 'Unterarm auf dem Oberschenkel, erst Handfläche nach oben, dann im Reverse-Griff. Die Reverse-Variante ist die wichtigere: Streckerseite, beste Vorbeugung gegen Tennisellbogen.',
    link: yt('wrist curl reverse curl forearm')
  },

  /* ---------------- Rumpf ---------------- */
  toes_to_bar: {
    name: 'Toes-to-bar', group: 'core',
    progress: { mode: 'reps', step: 1, min: 3, max: 15 },
    desc: 'Gestreckte Beine bis zur Stange, Becken bewusst nach hinten kippen. Wenn es nicht sauber geht, zurück zu gestreckten Leg Raises.',
    link: yt('toes to bar strict technique')
  },
  front_lever_tuck: {
    name: 'Tuck Front Lever', group: 'core',
    progress: { mode: 'hold', step: 2, min: 5, max: 30 },
    desc: 'Hängen, Knie eng an die Brust, Körper waagerecht drehen bis der Rücken parallel zum Boden ist. Arme gestreckt, Schultern aktiv nach unten.',
    link: yt('tuck front lever progression')
  },
  front_lever_adv: {
    name: 'Advanced Tuck Front Lever', group: 'core',
    progress: { mode: 'hold', step: 2, min: 5, max: 25 },
    desc: 'Hüfte geöffnet, Rücken flach, Oberschenkel etwa 45 Grad zum Körper. Deutlich schwerer, deshalb kürzere Haltezeiten.',
    link: yt('advanced tuck front lever')
  },
  hollow: {
    name: 'Hollow Hold', group: 'core',
    progress: { mode: 'hold', step: 5, min: 15, max: 60 },
    desc: 'Rückenlage, unterer Rücken fest am Boden, Arme und Beine gestreckt angehoben. Sobald der Rücken abhebt, Beine höher nehmen.',
    link: yt('hollow body hold tutorial')
  },
  pallof: {
    name: 'Pallof Press (Band)', group: 'core',
    progress: { mode: 'reps', step: 1, min: 8, max: 20 },
    desc: 'Seitlich zum Band stehen, Griff vor der Brust, gerade nach vorn drücken ohne dich verdrehen zu lassen. Anti-Rotation.',
    link: yt('pallof press band anti rotation')
  },

  /* ---------------- Finger ---------------- */
  repeaters_20: {
    name: 'Repeaters — 20 mm, Half Crimp', group: 'finger',
    progress: { mode: 'load', step: 2.5, min: 0, max: 15 },
    desc: 'Sieben Sekunden hängen, drei Sekunden ab, sechsmal — das ist ein Satz. Half Crimp: Finger etwa 90 Grad im Mittelgelenk, Daumen liegt an, drückt aber nicht über die Finger. Wenn der sechste Durchgang nicht mehr sauber hält, ist die Last zu hoch.',
    link: 'https://thehangboard.com/blogs/news/hangboard-training'
  },
  repeaters_open: {
    name: 'Repeaters — 3-Finger offen', group: 'finger',
    progress: { mode: 'load', step: 2.5, min: 0, max: 12 },
    desc: 'Gleiches Schema an den offenen Dreifingergriffen. Die offene Position hat das geringste Ringbandrisiko und verträgt mehr Volumen.',
    link: 'https://thehangboard.com/blogs/news/hangboard-training'
  },
  maxhang_20: {
    name: 'Max Hang — 20 mm, Half Crimp', group: 'finger',
    progress: { mode: 'load', step: 2.5, min: 0, max: 35 },
    desc: 'Zehn Sekunden mit Zusatzgewicht, drei Minuten Pause. Die Last stimmt, wenn nach zehn Sekunden noch etwa zwei Sekunden Reserve wären. Schaffst du die zehn Sekunden nicht sauber, gehst du runter statt durchzubeißen. Full Crimp bleibt in diesem Zyklus draußen.',
    link: 'https://strengthclimbing.com/eva-lopez-maxhangs/'
  },
  maxhang_open: {
    name: 'Max Hang — 3-Finger offen', group: 'finger',
    progress: { mode: 'load', step: 2.5, min: 0, max: 25 },
    desc: 'Zweiter Griff nach dem Hauptsatz, etwa 60 Prozent der Hauptlast. Deckt die zweite große Griffposition ab.',
    link: 'https://strengthclimbing.com/eva-lopez-maxhangs/'
  },
  maxhang_hold: {
    name: 'Max Hang — Erhaltungslast', group: 'finger',
    progress: { mode: 'none' },
    desc: 'Drei Sätze auf der zuletzt erreichten Last. In dieser Phase geht es nur ums Halten des Niveaus — Steigern wäre bei diesem Trainingsvolumen zu viel für die Sehnen.',
    link: 'https://strengthclimbing.com/eva-lopez-maxhangs/'
  },
  density_jug: {
    name: 'Density Hang am Jug', group: 'finger',
    progress: { mode: 'hold', step: 5, min: 20, max: 60 },
    desc: 'Langes lockeres Hängen an den großen Griffen, Schultern aktiv. Baut Bindegewebskapazität auf.',
    link: yt('density hangs climbing')
  },
  nohang: {
    name: 'No-Hangs (Abrahangs)', group: 'finger',
    progress: { mode: 'none' },
    desc: 'Zehn Sekunden Belastung, fünfzig Sekunden Pause, zehn Durchgänge. Füße bleiben am Boden, Belastung deutlich submaximal bei etwa 70 Prozent. Macht nicht müde und baut Sehnenkapazität auf. 15 g Gelatine plus Vitamin C eine Stunde vorher.',
    link: 'https://warriorwomen.co.uk/2025/03/03/abrahangs-experiment/'
  },

  /* ---------------- Klettern ---------------- */
  boulder_tech: {
    name: 'Bouldern — Technik und Volumen', group: 'climb',
    progress: { mode: 'none' },
    desc: 'Viele Boulder unter dem Limit, Fokus auf präzise Füße, ruhige Hüfte, bewusstes Ausatmen. Zeit am Fels ist der größte einzelne Faktor für den Grad.',
    link: yt('bouldering footwork drills technique')
  },
  boulder_limit: {
    name: 'Bouldern — Limit', group: 'climb',
    progress: { mode: 'none' },
    desc: 'Vier bis sechs Züge, maximal schwer, drei bis fünf Minuten Pause zwischen den Versuchen. Sobald die Versuche schlechter statt besser werden, ist die Session vorbei.',
    link: yt('limit bouldering training session')
  },
  boulder_rock: {
    name: 'Bouldern am Fels', group: 'climb',
    progress: { mode: 'none' },
    desc: 'Die Hauptsession der Woche. Bei nur ein bis zwei Felstagen gilt: lieber ausgeruht an schwere Boulder als müde an viele leichte.',
    link: yt('outdoor bouldering session')
  },
  explosive: {
    name: 'Explosive Züge', group: 'climb',
    progress: { mode: 'none' },
    desc: 'Dynamische Antritte oder Sprungzüge an guten Griffen, direkt nach dem Aufwärmen im frischen Zustand. Kurz und explosiv — im müden Zustand trainierst du Langsamkeit.',
    link: yt('bouldering dynamic movement training')
  },

  /* ---------------- Beweglichkeit und Aufwärmen ---------------- */
  m_9090:   { name: '90/90 Hüftrotation', group: 'mobility', progress: { mode: 'none' },
    desc: 'Ein Bein 90 Grad vorn, eins 90 Grad seitlich, Oberkörper über das vordere Knie neigen. Öffnet Innen- und Außenrotation — die Basis für hohe Fußaufsteller.', link: yt('90 90 hip stretch tutorial') },
  m_frog:   { name: 'Frosch', group: 'mobility', progress: { mode: 'none' },
    desc: 'Vierfüßlerstand, Knie weit auseinander, Schienbeine parallel, Becken nach hinten schieben. Adduktoren.', link: yt('frog stretch hip adductors') },
  m_couch:  { name: 'Couch Stretch', group: 'mobility', progress: { mode: 'none' },
    desc: 'Hinteres Bein mit dem Fuß an der Wand, vorderes im Ausfallschritt, Becken aufrichten. Hüftbeuger — wird vom vielen Radfahren kurz.', link: yt('couch stretch hip flexor') },
  m_pancake:{ name: 'Pancake', group: 'mobility', progress: { mode: 'none' },
    desc: 'Sitzende Grätsche, Oberkörper mit geradem Rücken nach vorn. Hilft direkt bei Heel Hooks und weiten Spreizzügen.', link: yt('pancake stretch progression') },
  m_jeff:   { name: 'Jefferson Curl (10 kg)', group: 'mobility', progress: { mode: 'none' },
    desc: 'Auf einer Erhöhung stehen, Wirbel für Wirbel nach unten rollen, kontrolliert zurück. Langsam und leicht — Beweglichkeit unter Last.', link: yt('jefferson curl tutorial') },
  m_disloc: { name: 'Türband-Dislocates', group: 'mobility', progress: { mode: 'none' },
    desc: 'Band weit greifen, gestreckte Arme über den Kopf nach hinten führen. Griff enger machen, wenn es zu leicht wird.', link: yt('shoulder dislocates band') },
  m_chest:  { name: 'Brustöffner an der Wand', group: 'mobility', progress: { mode: 'none' },
    desc: 'Unterarm an Türrahmen oder Wand, Körper wegdrehen. Gegenspieler zum vielen Ziehen.', link: yt('doorway chest stretch') },

  w_dyn:     { name: 'Dynamisches Aufwärmen', group: 'mobility', progress: { mode: 'none' },
    desc: 'Beinschwünge vor und seitlich je 15, Hüftkreisen, tiefe Ausfallschritte im Gehen, Armkreisen. Kein langes statisches Dehnen vor Kraft- oder Klettersessions — über 60 Sekunden pro Dehnung kostet messbar Maximalkraft.', link: yt('dynamic warm up climbing') },
  w_fingers: { name: 'Finger aufwärmen', group: 'finger', progress: { mode: 'none' },
    desc: 'Lockeres Hängen an Jugs, Handgelenke kreisen, drei aufbauende Sätze an großen Leisten mit steigender Belastung. Nie kalt an kleine Griffe.', link: yt('finger warm up hangboard') },

  /* ---------------- Tests ---------------- */
  t_hang:   { name: 'Test — Max Hang 20 mm', group: 'finger', progress: { mode: 'none' },
    desc: 'Höchste Last, die zehn Sekunden sauber geht. Immer gleich aufwärmen, immer ausgeruht. Ausgangswert: 40 Sekunden bei Körpergewicht.', link: 'https://strengthclimbing.com/eva-lopez-maxhangs/' },
  t_pull:   { name: 'Test — Klimmzüge strikt', group: 'pull', progress: { mode: 'none' },
    desc: 'Einmal maximal bis eine Wiederholung vor dem Versagen. Ausgangswert: 3 × 5 im Satzbetrieb.', link: yt('pull up max test') },
  t_dip:    { name: 'Test — Dips maximal', group: 'push', progress: { mode: 'none' },
    desc: 'Saubere Wiederholungen bis kurz vor Versagen. Ausgangswert: 3 × 8.', link: yt('dips max reps test') },
  t_core:   { name: 'Test — Toes-to-bar', group: 'core', progress: { mode: 'none' },
    desc: 'Gestreckte Beine bis zur Stange, ohne Schwung. Ausgangswert: 3 × 4.', link: yt('hanging leg raise test') },
  maxhang_sloper: {
    name: 'Max Hang — 35°-Sloper', group: 'finger',
    progress: { mode: 'load', step: 2.5, min: -15, max: 15 },
    desc: 'Offene Hand auf dem 35-Grad-Sloper des Beastmaker. Schultern aktiv, Handgelenk leicht gestreckt, Druck über die ganze Handfläche statt über die Fingerkuppen. Eigener Fortschrittswert, weil Sloperkraft sich nicht aus Leistenkraft ableiten lässt — und an Südtiroler Blöcken bist du ständig darauf angewiesen. Negative Werte heißen: mit Band entlasten.',
    link: yt('sloper hangboard training technique')
  },
  maxhang_pocket: {
    name: 'Max Hang — Zweifinger-Pocket', group: 'finger',
    progress: { mode: 'load', step: 2.5, min: -15, max: 15 },
    desc: 'Große Zweifinger-Pocket, Mittel- und Ringfinger, offene bis halboffene Position. Höhere Belastung pro Finger als an der Leiste, deshalb nur nach vollständigem Aufwärmen, nie im ermüdeten Zustand und niemals als Monos. Eigener Fortschrittswert.',
    link: yt('two finger pocket hangboard training')
  },
  onearm_assist: {
    name: 'Assistierter Einarmhang', group: 'finger',
    progress: { mode: 'load', step: 2.5, min: -40, max: 0 },
    desc: 'Einarmig an der 20-mm-Leiste, das Türband nimmt einen Teil des Körpergewichts ab. Die Last steigerst du, indem du die Bandunterstützung verringerst — deshalb bewegt sich der Wert von negativ Richtung null. Ab etwa V9-Niveau der übliche Weg, weil einarmige Belastung am Fels der Normalfall ist und beidarmiges Hängen die Asymmetrie verdeckt.',
    link: yt('assisted one arm hang progression climbing')
  },
  t_hip: {
    name: 'Test — Hüftbeweglichkeit (Foot Raise)', group: 'mobility',
    progress: { mode: 'none' },
    desc: 'Seitlich zur Wand stehen, wandnahes Bein ohne Ausweichbewegung des Oberkörpers so hoch wie möglich an die Wand setzen, Höhe vom Boden messen. Draper et al. fanden für diesen Test eine der stärksten Korrelationen mit der Kletterleistung überhaupt; Elite-Kletterer erreichen im Mittel rund 114 cm, Anfänger etwa 104 cm.',
    link: yt('grant foot raise test climbing flexibility')
  },
  t_weight: { name: 'Test — Körpergewicht', group: 'core', progress: { mode: 'none' },
    desc: 'Morgens nüchtern. Zielrate 0,2 kg pro Woche. Wenn du schneller zunimmst und die Hanglast in Prozent Körpergewicht fällt, Überschuss reduzieren.', link: 'https://trainingforclimbing.com' }
};

export const getExercise = id => EXERCISES[id] || null;
