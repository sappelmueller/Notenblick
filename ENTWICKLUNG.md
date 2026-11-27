# Entwicklung und Erstellung

**Aktueller Stand:** Notenblick 1.29.0 wurde am 27. November 2026 veröffentlicht. Die Ausgabe vereinfacht das Abschließen der Noteneingabe und die Verwaltung von Leistungen. [Prüfbericht 1.29.0](docs/PRUEFBERICHT-1.29.0.md)

Die Veröffentlichung und praktische Abnahme von 1.27.0 sind im [damaligen Versionsbericht](docs/PRUEFBERICHT-1.27.0.md) dokumentiert.

Historischer Abschluss 1.25.0: Der vollständige Audit und die ressourcenschonende Testverwaltung sind abgeschlossen. Das Release übernahm das getestete Programm unverändert. Aufbau und kritische Verträge stehen in der [Projektübersicht](docs/PROJEKTUEBERSICHT.md), verbindliche Regeln in [AGENTS.md](AGENTS.md).

## Werkzeuge

Benötigt werden Python ab 3.12, Git und Node.js gemäß `.node-version`. `setup` richtet das gesperrte .NET SDK 8.0.426, npm-Testpakete, Chromium und den Open-XML-Prüfer lokal ein. Die Bibliotheksdateien sind über Prüfsummen gesperrt. Für vollständige Exportprüfungen kommen die festgelegten Python-Pakete, Java, veraPDF ab 1.30.3 und LibreOffice hinzu; siehe [Exportprüfung](docs/EXPORT-PRUEFUNG.md).

Das SDK dient nur der Entwicklung. Die Windows-Anwendung verwendet .NET Framework und WebView2; Node.js, Python, Office und Java werden dort nicht benötigt. Anwender-Voraussetzungen und ARM64-Grenzen stehen in der [README](README.md).

## Befehle

```sh
python3 dev/manage.py setup
python3 dev/manage.py doctor
python3 dev/manage.py plan --base main
python3 dev/manage.py test changed --base main
python3 dev/manage.py build
```

Die Ausgangsbasis während einer Aufgabe beibehalten. Den Prüfplan anhand der betroffenen Funktionen prüfen und die passenden Gruppen gezielt ausführen. Erfolgreiche Prüfungen mit gültigen Nachweisen übernehmen.

Der vorhandene Vollprüflauf `release` und sein Wiederaufnahmebefehl `release --retry reports/<Lauf>` fallen unter die Regeln für ausdrücklich beauftragte Vollprüfungen. Für reguläre Veröffentlichungen gelten [AGENTS.md](AGENTS.md) und der [Veröffentlichungsablauf](docs/VEROEFFENTLICHUNG.md).

## Ausgabe und Zusammenarbeit

`dist` enthält nur EXE und Programmordner. `artifacts` enthält vollständiges Windows-ZIP, vollständiges Quellcode-ZIP und SHA-256-Prüfsummen. Eigene Lizenztexte und Drittanbieterhinweise werden vor der Integritätsliste eingebunden. Daten, Werkzeuge, Buildausgaben und vollständige Logs bleiben außerhalb von Git.

Eigene Quellen: GPLv3 mit der Bibliotheksausnahme in [LICENSE-EXCEPTION](LICENSE-EXCEPTION). Beiträge und Freigaben: [CONTRIBUTING.md](CONTRIBUTING.md) und [Veröffentlichungsablauf](docs/VEROEFFENTLICHUNG.md). GitHub Actions bleiben deaktiviert. Für echte Windows-/NVDA-/Braille-Tests gilt der [Windows-Prüfplan](docs/WINDOWS-PRUEFUNG.md).

Die frühere ausführliche Architekturbeschreibung bis 1.14 ist als [historischer Hintergrund](docs/archiv/ENTWICKLUNG-bis-1.14.md) erhalten. Ihre damaligen Versionslisten, Beschriftungen und Befehle sind keine aktuellen Vorgaben.

Historische Veröffentlichung 1.25.0: Der vollständige Audit, die erhaltenen Einzelbelege und der Doppelbuild-Nachweis wurden wiederverwendet. Nach der Nutzerfreigabe änderten sich nur Dokumentation, Quellcodearchiv und externe Veröffentlichungsmetadaten. [Abschluss und Nachweis](docs/PRUEFBERICHT-1.25.0.md). Diese unveränderte Übernahme und die reduzierte Freigabe von [1.24.0](docs/PRUEFBERICHT-1.24.0.md) ersetzen keine Prüfungen geänderter Programmquellen.
