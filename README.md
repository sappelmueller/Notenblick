# Notenblick

Notenblick ist eine portable Offline-Notenverwaltung für Windows. Du verwaltest Klassen und Fächer, erfasst Noten oder Punkte und erstellst Berichte für den Schulalltag. Alle Schülerdaten bleiben auf deinem Rechner.

[**Notenblick 1.27.0 für Windows herunterladen**](https://github.com/sappelmueller/Notenblick/releases/download/v1.27.0/Notenblick_1.27.0.zip) · [Was ist neu?](https://github.com/sappelmueller/Notenblick/releases/tag/v1.27.0)

Aktuelle Version: **1.27.0**, veröffentlicht am **6. November 2026**. Der Qualitätsaudit verbessert Schutzsicherungen, Notengewichtung, Fokusführung und die Darstellung in kleinen Fenstern. Das vertraute Design und die bisherigen Abläufe bleiben erhalten.

## Das kann Notenblick

- **Organisieren:** Schuljahre, Klassen, Fächer und Schüler verwalten; Schülerlisten übernehmen und mit dem Einrichtungsassistenten starten.
- **Bewerten:** Eigene Leistungsbereiche und Gewichtungen, mündliche Klassenrunden, Einzelnoten und GFS. Noten direkt eingeben oder Punkte mit verschiedenen Notenschlüsseln umrechnen.
- **Ergebnisse festhalten:** Durchschnitte nachvollziehen, Halbjahresinformationen und Zeugnisnoten festlegen. Manuell festgelegte Abschlussnoten bleiben unabhängig vom Durchschnitt gespeichert.
- **Sichern und ausgeben:** Automatische Speicherung, Sicherungen und lesbare TXT-Notfalllisten. Berichte als PDF, Word, Excel, CSV und TXT, dazu Druckvorschau und Gesamtexport.

## Herunterladen und starten

1. Das Windows-ZIP vollständig in einen beschreibbaren Ordner entpacken.
2. **Notenblick.exe** starten. Der vollständige Ordner **Programm** muss daneben liegen; **Daten** entsteht beim ersten Start.
3. Dem Einrichtungsassistenten folgen oder eine eigene Sicherung wiederherstellen.

Eine Installation von Notenblick ist nicht nötig. Die EXE ist bisher nicht digital signiert; Windows kann deshalb einen Sicherheitshinweis anzeigen. Quellcode und Prüfsummen findest du beim [Release](https://github.com/sappelmueller/Notenblick/releases/tag/v1.27.0).

**Voraussetzungen:** Windows x86/x64 mit .NET Framework 4.8 oder neuer und Microsoft Edge WebView2 Runtime. Für native ARM64-Ausführung: Windows 11 ab 24H2, .NET Framework 4.8.1 und ARM64-WebView2. Dieselbe EXE unterstützt beide Prozessorfamilien; die erforderlichen Programm-Bibliotheken liegen bei. Node.js, Python und Office brauchst du für die Anwendung nicht.

## Tastatur und Hilfe

Notenblick ist für Tastatur, NVDA und Braille entwickelt. **F1** erklärt den aktuellen Arbeitsschritt; Eingabe und Umschalt+Eingabe führen durch die schnelle Noteneingabe. Der Herausgeber hat 1.27.0 unter Windows x64 und ARM64 einschließlich NVDA, Braille und Aktualisierung praktisch getestet und freigegeben.

[Bedienkonzept und Barrierefreiheit](BARRIEREFREIHEIT.md) · [Hilfe](docs/HILFE-1.26.0-QUELLE.md) · [Prüfstand](docs/PRUEFBERICHT-1.27.0.md)

## Daten und Aktualisierungen

Schülerdaten bleiben ausschließlich im Ordner **Daten** und werden nicht an externe Dienste übertragen. Sichere diesen Ordner regelmäßig zusätzlich auf einem anderen Datenträger. TXT-Notfalllisten helfen beim Nachlesen; zur vollständigen Wiederherstellung dient eine Sicherung.

Unter **Einstellungen → Allgemein → Aktualisierungen** kannst du nach freigegebenen Versionen suchen. Die Prüfung beim Start ist freiwillig und zunächst ausgeschaltet. Download und Installation beginnen erst nach deiner Zustimmung. Der direkte Wechsel von **1.26.0 auf 1.27.0** ist ohne Zwischenversion möglich.

Beim Update werden ausschließlich **Notenblick.exe** und der vollständige Ordner **Programm** ersetzt. **Daten bleibt unangetastet.** Auch beim manuellen Aktualisieren: Notenblick schließen, Daten sichern und nur EXE und Programmordner ersetzen.

## Lizenz und Kontakt

Copyright © 2026 Sebastian Müller. Eigene Quellen: **GNU GPL Version 3** mit [Bibliotheksausnahme](LICENSE-EXCEPTION) ([Lizenztext](LICENSE), `GPL-3.0-only WITH GPL-3.0-linking-exception`). Für Drittanbieter gelten ihre [eigenen Lizenzen](THIRD-PARTY-NOTICES.md). Windows, .NET Framework und WebView2 Runtime stellt Microsoft separat bereit.

Fehler und Vorschläge bitte über [GitHub Issues](https://github.com/sappelmueller/Notenblick/issues) melden – mit erfundenen Beispielen und ohne echte Schülerdaten oder Zugangsdaten. Sicherheitslücken: [SECURITY.md](SECURITY.md).

[Änderungen](AENDERUNGEN.md) · [Prüfberichte](PRUEFBERICHT.md) · [Mitmachen](CONTRIBUTING.md) · [Entwicklung](ENTWICKLUNG.md)
