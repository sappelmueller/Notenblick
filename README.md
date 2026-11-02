# Notenblick

Notenblick ist eine portable Notenverwaltung für Windows. Lehrkräfte verwalten Schuljahre, Klassen, Fächer und Schüler, tragen Noten oder Punkte ein und erstellen kompakte Berichte. Das Programm arbeitet vollständig offline und speichert alle Daten lokal.

Aktuelle Version: **1.23.2**. Sebastian Müller hat die Windows- und NVDA-Tests erfolgreich bestätigt. Gesonderte Nachweise für native ARM64-Ausführung, Braille, Microsoft Office und physischen Druck stehen noch aus; siehe [Prüfbericht](docs/PRUEFBERICHT-1.23.2.md).

## Download und Start

1. Unter [Releases](https://github.com/sappelmueller/Notenblick/releases/tag/v1.23.2-oss.1) **Notenblick_1.23.2.zip** herunterladen. Dort stehen auch Quellcode und SHA-256-Prüfsummen.
2. Das ZIP vollständig in einen beschreibbaren Ordner entpacken.
3. **Notenblick.exe** starten. Der Ordner **Programm** muss daneben liegen. **Daten** wird beim ersten Start angelegt.

Eine Installation von Notenblick ist nicht nötig. Die EXE ist bisher nicht digital signiert; Windows kann deshalb einen Sicherheitshinweis anzeigen.

## Voraussetzungen

- Windows mit .NET Framework 4.8 oder neuer und Microsoft Edge WebView2 Runtime; x86 und x64 werden berücksichtigt.
- Für native ARM64-Ausführung: Windows 11 ab 24H2, .NET Framework 4.8.1 und ARM64-WebView2. Dieselbe EXE ist dafür vorbereitet; die tatsächliche native Ausführung muss noch auf einem ARM64-Gerät bestätigt werden.
- Ein beschreibbarer Programmordner. macOS und Linux sind keine unterstützten Anwendersysteme.

## Funktionen

- Direkte Noten oder Punkte mit Notenschlüssel, individuelle Gewichtungen und getrennt festgelegte Abschlussnoten.
- Schriftliche und mündliche Leistungen, Klassenrunden und einzelne Bewertungen.
- Automatische Speicherung, Sicherungen und lesbare TXT-Notenlisten für den Notfall.
- Berichte als PDF, Word, Excel, CSV und TXT, Druckvorschau und ZIP-Gesamtexport.
- Tastaturbedienung, kurze Beschriftungen, klare Fokusführung und Hilfe mit F1.

## Daten, Sicherung und Updates

Schülerdaten bleiben im Ordner **Daten**. Notenblick überträgt sie nicht an externe Dienste. Sichere diesen Ordner regelmäßig zusätzlich auf einem anderen Datenträger. Die TXT-Listen lassen sich auch ohne Notenblick lesen; sie ersetzen keine vollständige Sicherung.

Updates werden manuell aus einem offiziellen GitHub-Release geladen. **Notenblick schließen, Daten sichern und ausschließlich Notenblick.exe sowie den vollständigen Ordner Programm ersetzen. Daten behalten.** Ein automatischer Updater ist noch nicht enthalten.

Änderungen stehen in [AENDERUNGEN.md](AENDERUNGEN.md). Bedienhinweise und Prüfgrenzen enthält [BARRIEREFREIHEIT.md](BARRIEREFREIHEIT.md).

## Lizenz und Mitarbeit

Copyright © 2026 Sebastian Müller. Die eigenen Notenblick-Quellen stehen unter **GNU GPL Version 3** ([LICENSE](LICENSE), `GPL-3.0-only WITH GPL-3.0-linking-exception`). Die [zusätzliche Erlaubnis](LICENSE-EXCEPTION) ermöglicht die Weitergabe mit den genannten Bibliotheken; Notenblick selbst bleibt unter GPLv3. Drittanbieter behalten ihre [eigenen Lizenzen](THIRD-PARTY-NOTICES.md). Windows, .NET Framework und WebView2 Runtime werden separat von Microsoft bereitgestellt.

Fehler und Vorschläge können über GitHub Issues gemeldet werden. Bitte niemals echte Schülerdaten, Notenlisten, Sicherungen oder Zugangsdaten hochladen. Sicherheitslücken gemäß [SECURITY.md](SECURITY.md) melden.

Für Entwicklung und Beiträge: [CONTRIBUTING.md](CONTRIBUTING.md), [Projektübersicht](docs/PROJEKTUEBERSICHT.md) und [Prüfberichte](PRUEFBERICHT.md).
