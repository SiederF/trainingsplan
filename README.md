# Trainingsplan Bouldern — PWA

Installierbare Web-App für den 14-Wochen-Trainingsplan. Läuft ohne Backend,
ohne Build-Schritt und ohne Konto. Alle Daten bleiben auf dem Gerät.

## Was sie kann

- **14 Wochen, jeder Tag einzeln** — die Vorgaben ändern sich von Woche zu Woche.
- **Satzzählung** — Ziel anzeigen, Satz abhaken, Ergebnis erfassen, Pausentimer startet automatisch.
- **Automatische Anpassung** — nach jeder Einheit wird die Übung schwerer, bleibt gleich oder wird leichter.
- **Pausenerkennung** — nach längerer Inaktivität stuft die App die Vorgaben zurück.
- **Bildschirm bleibt an** — während der gesamten Einheit, über die Wake-Lock-API.
- **Fels-Tage frei wählbar** — der Rest der Woche ordnet sich automatisch darum an.
- **Offline** — nach dem ersten Laden vollständig ohne Netz nutzbar.
- **Responsiv** — Handy mit Tab-Leiste unten, ab Tablet mit Seitenspalte.

## Installation auf GitHub Pages

```bash
git init
git add .
git commit -m "Trainingsplan-App"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/trainingsplan.git
git push -u origin main
```

Dann im Repository unter **Settings → Pages** als Quelle `main` und Ordner `/ (root)`
wählen. Nach ein bis zwei Minuten ist die App unter
`https://DEIN-NAME.github.io/trainingsplan/` erreichbar.

**Wichtig:** Service Worker und Wake Lock brauchen HTTPS. GitHub Pages liefert das
automatisch. Ein Öffnen per Doppelklick (`file://`) funktioniert nicht vollständig —
lokal stattdessen `python3 -m http.server` im Projektordner starten.

### Als App installieren

- **Android/Chrome:** Menü → „App installieren"
- **iOS/Safari:** Teilen → „Zum Home-Bildschirm"
- **Desktop/Chrome/Edge:** Installationssymbol rechts in der Adressleiste

## Aufbau

```
index.html              schlankes Gerüst, keine Logik
manifest.webmanifest    Installierbarkeit
sw.js                   Offline-Cache
css/
  tokens.css            Farben, Typografie, Abstände — einzige Quelle
  base.css              Reset und Grundtypografie
  layout.css            Seitengerüst und Breakpoints
  components.css        Bausteine
js/
  data/
    exercises.js        Übungsstammdaten inkl. Progressionsregel
    plan.js             14-Wochen-Plan als strukturierte Daten
  core/                 Logik, ohne DOM, ohne Browser testbar
    storage.js          einzige Stelle mit Browser-Speicher
    progression.js      steigern, halten, zurückstufen, Pausenabschlag
    schedule.js         Wochenverteilung um die Fels-Tage
    workout.js          Ablauf einer Einheit, Satzzählung
    timer.js            Countdown und Intervall
    wakelock.js         Bildschirmsperre
    sound.js            Signaltöne
  ui/                   Darstellung, kennt keine Speicher-Details
    dom.js              Elementhelfer und Textformatierung
    planView.js         Tagesansicht
    runnerView.js       Trainingsmodus
    timerOverlay.js     Vollbild-Timer
    progressView.js     Fortschritt und Einstellungen
  app.js                Zusammenbau und Zustandsführung
test.mjs                Logiktests, Aufruf: node test.mjs
```

Die Trennung ist die eigentliche Wartbarkeitszusage:

- **Aussehen ändern** → nur `css/tokens.css`
- **Übung ergänzen** → `data/exercises.js`, danach in `data/plan.js` verwenden
- **Trainingsinhalt ändern** → nur `data/plan.js`
- **Anpassungsregeln ändern** → nur `core/progression.js`
- **Speicher wechseln (z. B. IndexedDB)** → nur `core/storage.js`

Kein Modul greift auf den Speicher zu, außer über `storage.js`. Kein `core/`-Modul
fasst das DOM an. Deshalb laufen die Logiktests ohne Browser.

## Wie die Anpassung funktioniert

Jede Übung hat ein Level, Start 0. Das Level verschiebt die Planvorgabe um einen
Schritt, dessen Größe in `exercises.js` je Übung festgelegt ist — ±1 Wiederholung,
±2 Sekunden Haltezeit oder ±2,5 kg Zusatzlast.

Nach jeder Einheit wird ausgewertet:

| Ergebnis | Anpassung |
|---|---|
| Letzter Satz zwei Wdh über Ziel, zweite Einheit in Folge | **zwei Stufen schwerer** |
| Alle Sätze erreicht, höchstens „Passt" | eine Stufe schwerer |
| Alle Sätze erreicht, aber „Sehr schwer" | unverändert |
| Ein Satz unter Ziel | unverändert |
| Zwei oder mehr Sätze unter Ziel, oder Abbruch | eine Stufe leichter |

### Der doppelte Sprung: 2-für-2-Regel

Wer im letzten Satz zwei Wiederholungen über dem Ziel schafft, und das in
zwei aufeinanderfolgenden Einheiten derselben Übung, bekommt den doppelten
Schritt. Bei Haltezeiten gilt statt zwei Wiederholungen eine um 20 Prozent
längere Zeit.

Das ist keine Eigenerfindung, sondern die Standardregel aus Baechle & Earle,
*Essentials of Strength Training and Conditioning* (NSCA). Das ACSM-Positionspapier
*Progression Models in Resistance Training for Healthy Adults*
(Med Sci Sports Exerc 2009, [PubMed 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/),
Evidenzkategorie B) empfiehlt dieselbe Bedingung und beziffert die Steigerung
auf 2 bis 10 Prozent der Last — der kleinere Wert für kleine, der größere für
große Muskelgruppen.

Umgerechnet auf diesen Plan: Ein Schritt sind 2,5 kg. Bei 71 kg Körpergewicht
und 10 kg Zusatzlast am Hangboard entspricht ein Schritt rund 3 Prozent der
Gesamtlast, ein Doppelschritt rund 6 Prozent. Beides liegt im empfohlenen
Korridor; die Testsuite prüft das automatisch mit.

**Ausnahme Hangboard:** Für Fingerübungen gibt es keinen Doppelschritt. Bindegewebe
passt sich deutlich langsamer an als Muskulatur — hier wären die Ringbänder der
begrenzende Faktor, nicht die Kraft.

### Sätze statt Wiederholungen

Stößt eine Übung an ihre Wiederholungsobergrenze, wandert der Überschuss in
zusätzliche Sätze: je zwei Wiederholungen über der Grenze ein Satz, höchstens zwei.

Grundlage ist die Dosis-Wirkungs-Beziehung des Trainingsvolumens. Schoenfeld,
Ogborn & Krieger (J Sports Sci 2017;35:1073–82,
[PubMed 27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/)) fanden je zusätzlichem
Wochensatz rund 0,37 Prozent mehr Muskelzuwachs. Die neuere Meta-Regression
(Sports Medicine 2025, 67 Studien, 2058 Teilnehmer,
[PubMed 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/)) bestätigt den
Zusammenhang, zeigt aber deutlich abnehmenden Grenznutzen — daher die Deckelung
bei zwei Zusatzsätzen statt unbegrenztem Wachstum.

Dass Wiederholungen eine gleichwertige Alternative zur Last sind, stützt
Plotkin et al. (PeerJ 2022, [PMC9528903](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9528903/)):
Eine Gruppe steigerte über acht Wochen die Last, die andere die Wiederholungen —
bei Hypertrophie und Kraft zeigten sich vergleichbare Ergebnisse.

Trainingspausen werden nicht bestraft, sondern abgebildet: bis 10 Tage kein Abschlag,
bis 21 Tage eine Stufe, bis 42 Tage zwei, danach drei. Der gespeicherte Wert bleibt
dabei unverändert — der Abschlag wird bei jeder Anzeige neu berechnet, sodass ein
einzelnes gutes Training nach der Pause nicht sofort auf das alte Niveau zurückspringt.

Bouldern, Mobility und Aufwärmen werden bewusst **nicht** automatisch angepasst.
Dort entscheidet der Fels, nicht die App.

## Tests

```bash
node test.mjs
```

Prüft Plandaten, Muskelabdeckung je Woche, die Wochenverteilung über alle
sinnvollen Fels-Tage-Kombinationen sowie die Progressions- und Anpassungslogik.

## Daten

Alles liegt in `localStorage` unter dem Präfix `tp.v1.`. Unter *Mehr → Daten*
lässt sich eine JSON-Sicherung speichern und auf einem anderen Gerät wieder laden.
Steht kein Speicher zur Verfügung (privates Fenster, eingebettete Vorschau),
schaltet die App still auf einen flüchtigen Speicher um und weist darauf hin.

## Grenzen

- Die Anpassung ersetzt kein Trainerauge. Sie reagiert auf erfasste Zahlen, nicht
  auf Schlaf, Stress oder Fingerschmerzen. Bei Beschwerden gilt dein Urteil.
- Die Wake-Lock-API kennt jeder aktuelle Browser außer älteren iOS-Versionen
  (nötig ist Safari 16.4 oder neuer). Fehlt sie, weist die App darauf hin.
- Die Schriftart lädt beim ersten Aufruf von Google Fonts und wird danach
  mitgecacht. Wer das vermeiden will, entfernt die beiden `<link>`-Zeilen in
  `index.html`; die App nutzt dann die Systemschrift.
