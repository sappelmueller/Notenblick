# Entwicklung und Erstellung

Aktueller Entwicklungsstand: **Notenblick 1.26.0 – Testversion** in `entwicklung/1.26.0`. Frei verwaltbare Leistungsbereiche betreffen Berechnung, Oberfläche und Ausgaben; der vollständige automatische Prüfkatalog bleibt dokumentiert. Zum Abschluss dieser Testversion hat der Herausgeber weitere große Testläufe ausdrücklich ausgeschlossen. Nach den letzten Exportkorrekturen werden nur Build und Paketprüfung abgeschlossen; ein vollständiger aktueller Gesamtnachweis wird nicht behauptet. Die praktische Windows-/NVDA-/Braille-/ARM64-Abnahme und die ausdrückliche Veröffentlichungsfreigabe stehen noch aus. [Testhinweise](docs/TESTVERSION-1.26.0.md).

Zuletzt offiziell freigegeben: **1.25.1** am 4. November 2026. Die damalige unveränderte Übernahme ist im [Versionsbericht](docs/PRUEFBERICHT-1.25.1.md) dokumentiert.

Historischer Abschluss 1.25.0: Der vollständige Audit und die ressourcenschonende Testverwaltung sind abgeschlossen. Das Release übernimmt das getestete Programm unverändert; sein Entwicklungsbranch wird nach Veröffentlichung und Downloadkontrolle gelöscht. Aufbau und kritische Verträge stehen in der [Projektübersicht](docs/PROJEKTUEBERSICHT.md), verbindliche Regeln in [AGENTS.md](AGENTS.md).

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
python3 dev/manage.py release --retry reports/<Lauf>
```

Die Ausgangsbasis während einer Aufgabe nicht wechseln. Vor einer unmittelbar folgenden vollständigen Release-Prüfung ist kein doppelter Integrationslauf nötig. Unbekannte gemeinsame Änderungen werden konservativ vollständig geprüft. Fehler nicht überspringen.

`release` führt sämtliche Tests, große Datenbestände, Exportvalidatoren, zwei saubere bytegleiche Builds und ZIP-/Entpackprüfungen zusammen. Gültige Einzelbelege werden wiederverwendet; nur betroffene oder offene Prüfungen laufen neu. Der Doppelbuild-Nachweis bleibt für unveränderte Build-Voraussetzungen gültig. Einzelheiten zur Wiederaufnahme und zu kleinen Infrastrukturtests: [Effizient entwickeln](docs/ENTWICKLUNGSOPTIMIERUNG.md). `release --check-only` prüft denselben Umfang mit temporären Archiven. Quellen und Dokumente vorher abschließen und stagen; den aktuellen Nachweis mit `status --report reports/<Lauf>/summary.json` bestätigen.

## Ausgabe und Zusammenarbeit

`dist` enthält nur EXE und Programmordner. `artifacts` enthält vollständiges Windows-ZIP, vollständiges Quellcode-ZIP und SHA-256-Prüfsummen. Eigene Lizenztexte und Drittanbieterhinweise werden vor der Integritätsliste eingebunden. Daten, Werkzeuge, Buildausgaben und vollständige Logs bleiben außerhalb von Git.

Eigene Quellen: GPLv3 mit der Bibliotheksausnahme in [LICENSE-EXCEPTION](LICENSE-EXCEPTION). Beiträge und Freigaben: [CONTRIBUTING.md](CONTRIBUTING.md) und [Veröffentlichungsablauf](docs/VEROEFFENTLICHUNG.md). GitHub Actions bleiben deaktiviert. Für echte Windows-/NVDA-/Braille-Tests gilt der [Windows-Prüfplan](docs/WINDOWS-PRUEFUNG.md).

Die frühere ausführliche Architekturbeschreibung bis 1.14 ist als [historischer Hintergrund](docs/archiv/ENTWICKLUNG-bis-1.14.md) erhalten. Ihre damaligen Versionslisten, Beschriftungen und Befehle sind keine aktuellen Vorgaben.

Historische Veröffentlichung 1.25.0: Der vollständige Audit, die erhaltenen Einzelbelege und der Doppelbuild-Nachweis wurden wiederverwendet. Nach der Nutzerfreigabe änderten sich nur Dokumentation, Quellcodearchiv und externe Veröffentlichungsmetadaten. [Abschluss und Nachweis](docs/PRUEFBERICHT-1.25.0.md). Diese unveränderte Übernahme und die reduzierte Freigabe von [1.24.0](docs/PRUEFBERICHT-1.24.0.md) ersetzen keine Prüfungen geänderter Programmquellen.
