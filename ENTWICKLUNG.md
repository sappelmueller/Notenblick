# Entwicklung und Erstellung

Technischer Stand: Notenblick 1.23.2. Aufbau und kritische Verträge stehen in der [Projektübersicht](docs/PROJEKTUEBERSICHT.md), verbindliche Regeln in [AGENTS.md](AGENTS.md).

## Werkzeuge

Benötigt werden Python ab 3.12, Git und Node.js gemäß `.node-version`. `setup` richtet das gesperrte .NET SDK 8.0.426, npm-Testpakete, Chromium und den Open-XML-Prüfer lokal ein. Die Bibliotheksdateien sind über Prüfsummen gesperrt. Für vollständige Exportprüfungen kommen die festgelegten Python-Pakete, Java, veraPDF 1.30.3 und LibreOffice hinzu; siehe [Exportprüfung](docs/EXPORT-PRUEFUNG.md).

Das SDK dient nur der Entwicklung. Die Windows-Anwendung verwendet .NET Framework und WebView2; Node.js, Python, Office und Java werden dort nicht benötigt. Anwender-Voraussetzungen und ARM64-Grenzen stehen in der [README](README.md).

## Befehle

```sh
python3 dev/manage.py setup
python3 dev/manage.py doctor
python3 dev/manage.py plan --base main
python3 dev/manage.py test changed --base main
python3 dev/manage.py test changed --stage integration --base main
python3 dev/manage.py build
python3 dev/manage.py release
```

Die Ausgangsbasis während einer Aufgabe nicht wechseln. Vor einer unmittelbar folgenden vollständigen Release-Prüfung ist kein doppelter Integrationslauf nötig. Unbekannte gemeinsame Änderungen werden konservativ vollständig geprüft. Fehler nicht überspringen.

`release` führt sämtliche Tests, große Datenbestände, Exportvalidatoren, zwei saubere bytegleiche Builds und ZIP-/Entpackprüfungen aus. `release --check-only` prüft denselben Umfang mit temporären Archiven. Quellen und Dokumente vorher abschließen und stagen; den aktuellen Nachweis mit `status --report reports/<Lauf>/summary.json` bestätigen.

## Ausgabe und Zusammenarbeit

`dist` enthält nur EXE und Programmordner. `artifacts` enthält vollständiges Windows-ZIP, vollständiges Quellcode-ZIP und SHA-256-Prüfsummen. Eigene Lizenztexte und Drittanbieterhinweise werden vor der Integritätsliste eingebunden. Daten, Werkzeuge, Buildausgaben und vollständige Logs bleiben außerhalb von Git.

Eigene Quellen: GPLv3 mit der Bibliotheksausnahme in [LICENSE-EXCEPTION](LICENSE-EXCEPTION). Beiträge und Freigaben: [CONTRIBUTING.md](CONTRIBUTING.md) und [Veröffentlichungsablauf](docs/VEROEFFENTLICHUNG.md). GitHub Actions bleiben deaktiviert. Für echte Windows-/NVDA-/Braille-Tests gilt der [Windows-Prüfplan](docs/WINDOWS-PRUEFUNG.md).

Die frühere ausführliche Architekturbeschreibung bis 1.14 ist als [historischer Hintergrund](docs/archiv/ENTWICKLUNG-bis-1.14.md) erhalten. Ihre damaligen Versionslisten, Beschriftungen und Befehle sind keine aktuellen Vorgaben.
