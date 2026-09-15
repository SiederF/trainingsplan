# Einrichten: GitHub, Installation, mehrere Geräte

## 1. App auf GitHub bringen

### Weg A — ohne Kommandozeile (empfohlen für den Anfang)

1. Entpacke `trainingsapp.zip` auf deinem Rechner.
2. Gehe auf **github.com** → oben rechts **+** → **New repository**.
3. Name zum Beispiel `trainingsplan`. Wichtig: **Public** wählen.
   GitHub Pages funktioniert bei privaten Repositories nur mit einem
   kostenpflichtigen Plan.
4. **Create repository**.
5. Auf der leeren Repo-Seite: **uploading an existing file**.
6. Ziehe den **Inhalt** des Ordners `trainingsapp` hinein — also `index.html`,
   `manifest.webmanifest`, `sw.js` sowie die Ordner `css`, `js`, `assets`.
   **Nicht den Ordner selbst**: `index.html` muss direkt im Wurzelverzeichnis
   des Repositories liegen, sonst findet Pages nichts.
7. Unten **Commit changes**.
8. **Settings** → links **Pages** → unter *Build and deployment* bei *Source*
   **Deploy from a branch** wählen, Branch **main**, Ordner **/ (root)** → **Save**.
9. Nach ein bis zwei Minuten läuft die App unter
   `https://DEIN-NAME.github.io/trainingsplan/`

Bei Änderungen später: Datei im Repo öffnen, Stift-Symbol, bearbeiten, committen.
Oder erneut hochladen.

### Weg B — mit Kommandozeile

```bash
cd trainingsapp
git init
git add .
git commit -m "Trainingsplan-App"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/trainingsplan.git
git push -u origin main
```

Danach Schritt 8 von oben. Für spätere Änderungen:

```bash
git add . && git commit -m "Was geändert wurde" && git push
```

## 2. Der Zugangscode

Beim `git push` fragt GitHub nach Benutzername und Passwort. **Dein normales
Passwort funktioniert dort nicht mehr** — GitHub verlangt seit 2021 ein Token.

So erstellst du eines:

1. github.com → oben rechts dein Profilbild → **Settings**
2. Ganz unten links **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. **Token name**: zum Beispiel `trainingsplan-push`
5. **Expiration**: 90 Tage oder länger, wie du magst
6. **Repository access**: *Only select repositories* → dein `trainingsplan`
7. **Permissions** → *Repository permissions* → **Contents** auf
   **Read and write** stellen. Mehr braucht es nicht.
8. **Generate token** → den Code **sofort kopieren**. Er wird nur einmal angezeigt.

Beim `git push` gibst du dann ein:
- Username: dein GitHub-Benutzername
- Password: **das Token**, nicht dein Passwort

Damit du es nicht jedes Mal eintippen musst:

```bash
git config --global credential.helper store
```

Einmal eingeben, danach merkt es sich Git. Achtung: Das Token liegt dann im
Klartext in `~/.git-credentials`. Auf deinem eigenen Rechner ist das in Ordnung,
auf einem geteilten Gerät nicht.

Wenn du über **Weg A** hochlädst, brauchst du überhaupt kein Token.

## 3. Installierbar wie eine App?

Ja. Manifest, Service Worker und Icons sind vorhanden, GitHub Pages liefert
HTTPS — damit sind alle Bedingungen erfüllt.

| Gerät | So geht es |
|---|---|
| **Android / Chrome** | Menü (drei Punkte) → *App installieren*. Oft erscheint auch von selbst ein Hinweisbalken. |
| **iPhone / Safari** | Teilen-Symbol → *Zum Home-Bildschirm*. Safari zeigt **keinen** automatischen Hinweis, du musst den Weg über Teilen gehen. Funktioniert nur in Safari, nicht in Chrome für iOS. |
| **Desktop Chrome / Edge** | Installationssymbol rechts in der Adressleiste, oder Menü → *Installieren*. |

Nach der Installation startet die App im eigenen Fenster, ohne Adressleiste,
und funktioniert offline.

## 4. Icon auf dem Home-Screen?

Ja. Im Paket liegen vier Varianten:

- `icon-192.png` und `icon-512.png` — Android und Desktop
- `icon-maskable-512.png` — für Androids runde und abgerundete Icon-Formen,
  damit nichts abgeschnitten wird
- `apple-touch-icon-180.png` — iOS-Home-Screen in der von Apple erwarteten Größe

Das Motiv ist eine stilisierte Griffleiste mit drei Fingerpositionen.
Willst du ein eigenes, ersetze die vier PNGs unter gleichem Namen.

## 5. Synchronisierung zwischen Geräten — hier muss ich dich bremsen

**Nein, das funktioniert so nicht.** GitHub Pages ist reiner Dateiversand:
Es liefert deine HTML-, CSS- und JS-Dateien aus und kann nichts
zurückschreiben. Es gibt dort keine Datenbank und kein Benutzerkonto.

Deine Trainingsdaten liegen in `localStorage` — das ist **pro Gerät und pro
Browser**. Handy und Laptop haben also getrennte Stände, und auch Safari und
Chrome auf demselben Handy wüssten nichts voneinander.

### Was jetzt schon geht

Unter **Mehr → Daten**: *Sicherung speichern* erzeugt eine JSON-Datei,
*Sicherung laden* spielt sie auf einem anderen Gerät ein. Legst du die Datei in
iCloud, Google Drive oder Dropbox ab, ist der Wechsel eine Sache von zwei Tipps —
aber eben von Hand, und der jeweils letzte Import gewinnt.

Für den üblichen Fall reicht das: Wer auf einem Gerät trainiert und die Daten
nur gelegentlich mitnehmen will, kommt damit gut zurecht.

### Was es für echte Synchronisierung bräuchte

Ein Server, der schreiben kann. Drei realistische Wege:

1. **Privater GitHub-Gist als Speicher.** Die App schreibt die JSON-Datei über
   die GitHub-API in einen privaten Gist und liest sie beim Start zurück. Kostet
   nichts, du hast schon ein Konto, und es passt zu deinem Aufbau. Nachteil: Ein
   Token mit Gist-Rechten müsste im Browser gespeichert werden. Wer dein Handy
   entsperrt hat, käme an dieses Token — bei eng begrenzten Rechten ist der
   Schaden klein, aber es ist ein Zugeständnis.
2. **Supabase oder Firebase**, kostenlose Stufe. Richtige Datenbank, echte
   Anmeldung, saubere Konfliktbehandlung. Dafür ein zweiter Dienst, der
   eingerichtet und gepflegt werden will.
3. **Datei in einem synchronisierten Ordner.** Am wenigsten Technik, aber
   Browser dürfen nicht automatisch auf Dateisystemordner schreiben — bleibt
   also halbmanuell.

Für einen Nutzer mit ein bis zwei Geräten ist Weg 1 der beste Kompromiss.
Sag Bescheid, dann baue ich ihn ein — sauber gekapselt in `core/storage.js`,
sodass die übrige App unverändert bleibt. Ohne Token läuft sie dann weiterhin
rein lokal.
