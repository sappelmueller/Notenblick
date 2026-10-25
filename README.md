# Notenblick

Lokaler, vollständig offline arbeitender Windows-Notenrechner für Lehrkräfte. Aktuelle Programmversion: **1.10.0**. Einheitliche Notenansichten und gemeinsame Offline-Berichte für Druck, PDF, Word, Excel, Text und CSV. Berechnungslogik und Datenformat bleiben erhalten.

## Sofort weiterarbeiten

Nur das private Repository `sappelmueller/Notenblick` abrufen. Nach dem Abrufen im Repository ausführen:

```sh
python3 dev/manage.py setup
python3 dev/manage.py test quick
```

Falls die Git-CLI hier keine Anmeldung besitzt, beschreibt [docs/GITHUB-ANBINDUNG.md](docs/GITHUB-ANBINDUNG.md) den bereits geprüften Abruf und die Sicherung über die verbundene GitHub-Anbindung.

Die Einrichtung lädt das festgelegte .NET SDK und die gesperrten Testabhängigkeiten. Bereits vorhandene passende Werkzeuge werden wiederverwendet. Nach einem vollständigen Zurücksetzen müssen die Werkzeuge erneut heruntergeladen werden; Quellcode, Konfiguration, Tests und Anleitungen bleiben im Repository erhalten.

Benötigt: Python ab 3.12, Git und Node.js (getestet mit der Version in `.node-version`). Für vollständige Exportprüfungen werden zusätzlich die in `dev/export-qa-requirements.txt` gesperrten Python-Pakete, Java und veraPDF 1.30.3 benötigt; siehe [docs/EXPORT-PRUEFUNG.md](docs/EXPORT-PRUEFUNG.md). SDK, Compiler und Linux-Testbrowser werden projektspezifisch eingerichtet. Bibliotheksdateien für den Windows-Build sind inklusive SHA-256-Prüfsummen enthalten. Es wird kein globales System umkonfiguriert.

## Befehle

| Aufgabe | Befehl |
| --- | --- |
| Einmalige bzw. wiederholbare Einrichtung | `python3 dev/manage.py setup` |
| Werkzeugdiagnose | `python3 dev/manage.py doctor` |
| Schnelle Standardtests | `python3 dev/manage.py test quick` |
| Produktiver C#-Speicherkern | `python3 dev/manage.py test storage` |
| Tastatur, Fokus, Browser und axe | `python3 dev/manage.py test browser` |
| Großer Datenbestand | `python3 dev/manage.py test stress` |
| Alle Prüfungen | `python3 dev/manage.py test full` |
| Windows-Programm bauen | `python3 dev/manage.py build` |
| ZIP mit Integritäts- und Entpackprüfung | `python3 dev/manage.py package` |
| Vollständiger Prüf-, Build- und ZIP-Ablauf | `python3 dev/manage.py release` |

`release` baut sauber, führt alle Tests aus, wiederholt den Build und verlangt bytegleiche Programmdateien. Danach werden vollständige Programm- und Quellcode-ZIPs samt Prüfsummen unter `artifacts` erzeugt und die entpackte Anwendung im Testhost geprüft. Ein Fehler stoppt den Ablauf. Kein Befehl führt einen Push, eine GitHub-Veröffentlichung oder einen GitHub-Runner aus. `package` ist für lokale Paketprüfungen; vor einer Veröffentlichung ist `release` erforderlich.

Berichte, Ausgaben und vollständige Testprotokolle stehen unter `reports/<Zeitpunkt>`. `summary.json` unterscheidet laufende, erfolgreiche und fehlgeschlagene Durchläufe. Vorherige Testergebnisse werden beim neuen Lauf entfernt. Eine erfolgreiche Linux-Prüfung ist keine Windows-/NVDA-Freigabe.

## Architektur und Ablage

- `src`: modulare Anwendung mit zentraler Berechnung und gemeinsamen Oberflächenkomponenten.
- `native`: Windows-Starter, WebView2-Fenster und C#-Speicherung.
- `tests`: bestehende Tests und zusätzliche Entwicklungsregressionen; ausschließlich synthetische Testdaten.
- `dev`: Build-, Einrichtungs- und Paketwerkzeuge sowie benötigte Bibliotheken und Versions-/Prüfsummensperren.
- `.githooks`: lokale Prüfungen vor Commit und Push; werden von `setup` im aktuellen Repository aktiviert.
- `docs`: Einrichtung, Prüfgrenzen, Veröffentlichungsablauf und Windows-Prüfplan.
- `.tools`, `.build`, `dist`, `artifacts`, `reports`: erzeugte, nicht versionierte Arbeitsdateien.

Details zur unveränderten Facharchitektur: [ENTWICKLUNG.md](ENTWICKLUNG.md). Aktueller Einrichtungsbericht: [docs/EINRICHTUNGSBERICHT.md](docs/EINRICHTUNGSBERICHT.md).

## Projekte und persönliche Daten schützen

TrainScope ist ein anderes Projekt. Die Prüfung vor Commit/Push akzeptiert ausschließlich `sappelmueller/Notenblick`. Effektive Fetch- und Push-URLs werden geprüft; private Datenordner, Sicherungen, Notenlisten, bekannte Geheimnisse und Actions-Workflows werden abgewiesen. Die Schutzskripte sind eine Unfallbarriere; sie ersetzen keine inhaltliche Prüfung neuer Dateien. Echte Schülerdaten dürfen auch nicht unter anderen Dateinamen oder in Beispielen abgelegt werden.

Vor einem Git-Push verlangt die Prüfung eine live bestätigte private Repository-ID und deaktivierte Actions. Dafür wird ein bereits angemeldetes `gh` oder ein vorhandenes `GH_TOKEN`/`GITHUB_TOKEN` benötigt; Zugangsdaten werden nicht im Projekt gespeichert. Bei Verwendung der GitHub-Anbindung dieselben Prüfungen unmittelbar vor dem Schreiben durchführen. Keine erzwungenen Pushes, keine Änderungen an TrainScope und keine globalen Kontoeinstellungen.

## Windows-Auslieferung

Ziel bleibt .NET Framework 4.8, WinForms und WebView2. Das .NET SDK 8.0.426 dient nur dem Compiler und den Linux-Speichertests. Die Linux-Ausgabe liefert keine .NET-8-Laufzeit für Windows mit. Enthalten sind Newtonsoft.Json 13.0.3, WebView2 SDK 1.0.2903.40 und WebView2Loader für x86/x64/ARM64. Auf dem Windows-Rechner müssen .NET Framework 4.8 und die WebView2-Laufzeit vorhanden sein. Die ZIP enthält ausschließlich `Notenblick.exe` und `Programm`; `Daten` entsteht beim ersten Start.

Windows-Start, WebView2/UI Automation, NVDA und Windows-Skalierung sind auf einem Windows-Rechner gesondert zu prüfen. Dafür gibt es `dev/windows-qa.ps1` und [docs/WINDOWS-PRUEFUNG.md](docs/WINDOWS-PRUEFUNG.md). Kein Codesignierungszertifikat ist enthalten; SmartScreen wird nicht umgangen. Ohne Windows-Prüfung bleibt das Ergebnis ein unter Linux geprüfter Build-Kandidat.
