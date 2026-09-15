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

## 5. Geräteabgleich — verschlüsselt über einen privaten Gist

**Wichtig vorweg:** GitHub Pages selbst kann nichts speichern. Es liefert nur
Dateien aus. Der Abgleich läuft deshalb über die GitHub-API und einen privaten
**Gist** — das ist ein zweiter, davon unabhängiger Dienst im selben Konto.

### Wie es funktioniert

Dein gesamter Datenstand wird **auf dem Gerät** verschlüsselt und als ein
unlesbarer Block in einen privaten Gist gelegt. GitHub bekommt nie Klartext zu
sehen. Auf dem zweiten Gerät gibst du dieselbe Passphrase und dieselbe Gist-ID
ein, und der Stand ist da.

| | |
|---|---|
| Verschlüsselung | AES-GCM, 256 Bit |
| Schlüsselableitung | PBKDF2-SHA256, 600.000 Runden |
| Schlüssel gespeichert? | Nein — wird pro Sitzung aus der Passphrase neu abgeleitet |
| Token gespeichert? | Ja, aber **selbst verschlüsselt** unter derselben Passphrase |

Der letzte Punkt ist der entscheidende. Ohne Passphrase findet auch jemand mit
deinem entsperrten Handy nur einen unlesbaren Block — weder Trainingsdaten noch
das Token.

AES-GCM prüft zusätzlich die Echtheit: Wäre am Gist manipuliert worden oder ist
die Passphrase falsch, schlägt das Entschlüsseln fehl, statt Unsinn zu liefern.

### Zweites Token für Gists erstellen

Das Token aus Abschnitt 2 reicht nicht — das darf nur Dateien ins Repository
schreiben. Für Gists brauchst du ein **klassisches** Token, weil die
feingranularen Tokens Gists nicht abdecken:

1. github.com → **Settings** → **Developer settings**
2. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**
3. **Note**: zum Beispiel `trainingsplan-sync`
4. **Expiration**: nach Wunsch, ein Jahr ist praktikabel
5. Bei **Select scopes** nur **`gist`** ankreuzen. Sonst nichts.
6. **Generate token** → sofort kopieren, es wird nur einmal angezeigt.

Mehr als `gist` darf das Token nicht dürfen. Selbst im schlimmsten Fall käme
jemand damit nur an deine Gists, nicht an deine Repositories.

### Einrichten

1. In der App: **Mehr** → Abschnitt *Geräteabgleich*
2. Passphrase wählen und wiederholen, mindestens acht Zeichen
3. Token einfügen, Gist-ID leer lassen
4. **Abgleich einrichten** — die App legt den Gist an und zeigt dir die **Gist-ID**

**Notiere dir die Gist-ID.** Du brauchst sie auf jedem weiteren Gerät.

### Zweites Gerät

App öffnen → **Mehr** → Abgleich einrichten → **dieselbe Passphrase**, dasselbe
Token, und diesmal die **Gist-ID eintragen**. Dann *Jetzt herunterladen*.

### Im Alltag

Nach jedem App-Start einmal die Passphrase eingeben, dann wird der aktuelle
Stand automatisch geholt, sofern *Automatisch beim Start* angeschaltet ist.
Nach dem Training auf *Jetzt hochladen*.

Es gewinnt immer der neuere Zeitstempel. Ist der Stand in der Wolke neuer als
dein letzter Abgleich, warnt die App, statt still zu überschreiben. Das genügt,
weil du ohnehin nur auf einem Gerät gleichzeitig trainierst — trainiere zu Ende,
lade hoch, wechsle dann das Gerät.

### Was du wissen musst

- **Die Passphrase kann niemand zurücksetzen**, auch ich nicht. Sie wird
  nirgends gespeichert. Ist sie weg, ist der Stand im Gist unlesbar. Die Daten
  auf dem Gerät selbst bleiben davon unberührt und lassen sich weiterhin als
  JSON-Datei sichern.
- **Ohne Abgleich läuft alles wie bisher.** Die Synchronisierung ist ein
  Zusatz, kein Zwang. Wer sie nicht einrichtet, merkt nichts davon.
- **Der Export als JSON-Datei bleibt bestehen** und ist die einfachere
  Sicherung, wenn du gar nichts mit Tokens zu tun haben willst.

## 6. Tests

```bash
npm test
```

Führt beide Testreihen aus: die Trainingslogik (1582 Prüfungen) und die
Verschlüsselung (15 Prüfungen, inklusive falscher Passphrase und erkannter
Manipulation).

```bash
npm run build     # erzeugt die Einzeldatei in dist/
npm run serve     # lokaler Server auf Port 8000
```
