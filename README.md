# Notenblick

Notenblick ist eine portable Offline-Notenverwaltung für Windows. Du organisierst deine Klassen und Fächer, erfasst Noten oder Punkte und erstellst Berichte für den Schulalltag. Alle Schülerdaten bleiben lokal auf deinem Rechner.

[**Notenblick 1.24.0 herunterladen**](https://github.com/sappelmueller/Notenblick/releases/download/v1.24.0/Notenblick_1.24.0.zip)

Aktuelle Version: **1.24.0**, veröffentlicht am **3. November 2026**. Die Verbesserungen aus der Zwischenentwicklung 1.23.3 sind enthalten.

## Das kann Notenblick

- **Organisieren:** Schuljahre, Klassen, Fächer und Schüler verwalten, mit einem Assistenten einrichten und Schülerlisten übernehmen. Die Startseite bietet Fach-Schnellzugriffe, das zuletzt geöffnete Fach und offene Noteneingaben.
- **Leistungen erfassen:** Klassenarbeiten, Tests, mündliche Klassenrunden und Einzelnoten, GFS, Hausaufgaben und Heftbewertungen. Teilnehmer auswählen sowie Status und Bemerkungen ergänzen.
- **Mit Noten oder Punkten arbeiten:** Noten direkt eingeben oder Punkte über lineare Schlüssel, Schlüssel mit Knick oder individuelle Notengrenzen umrechnen. Ganze, halbe, Viertel- und Zehntelnoten sind möglich; einzelne Noten lassen sich bewusst anpassen.
- **Durchschnitte und Abschlussnoten:** Gewichtungen individuell festlegen und Ergebnisse nachvollziehen. Halbjahresinformationen verwenden Viertelnoten, Halbjahres- und Jahreszeugnisse ganze Noten. Festgelegte Abschlussnoten bleiben unabhängig vom berechneten Durchschnitt gespeichert.
- **Sichern und wiederherstellen:** Automatisch speichern, vollständige Sicherungen erstellen und frühere Stände wiederherstellen. Lesbare TXT-Notfalllisten stehen auch ohne das Programm zur Verfügung.
- **Berichte erstellen:** PDF, Word, Excel, CSV und TXT für Fächer, Leistungen und Schüler, dazu Druckvorschau und Gesamtexporte als ZIP.

## Download und Start

1. Unter [Releases](https://github.com/sappelmueller/Notenblick/releases) das Windows-ZIP der freigegebenen Version herunterladen. Quellcode und SHA-256-Prüfsummen stehen dort ebenfalls bereit.
2. Das ZIP vollständig in einen beschreibbaren Ordner entpacken.
3. **Notenblick.exe** starten. Der Ordner **Programm** muss daneben liegen; **Daten** entsteht beim ersten Start. Der Einrichtungsassistent führt durch die ersten Schritte.

Eine Installation von Notenblick ist nicht nötig. Der erste Wechsel von 1.23.2 auf 1.24.0 erfolgt manuell. Die EXE ist bisher nicht digital signiert; Windows kann deshalb einen Sicherheitshinweis anzeigen.

## Tastatur, NVDA, Braille und Hilfe

Hauptbereiche und Fächer sind über Links und Kurzbefehle erreichbar. Echte Registerkarten, kurze Beschriftungen und eine klare Fokusführung unterstützen die Arbeit mit Tastatur, NVDA und Braille. **F1** erklärt den aktuellen Arbeitsschritt. Die schnelle Noteneingabe verwendet Eingabe und Umschalt+Eingabe.

Sebastian Müller hat Version 1.23.2 am **2. November 2026** auf einem Windows-PC und unter Windows auf ARM in Parallels mit **NVDA und Braille** praktisch getestet. Die native ARM64-Prozessarchitektur und der passende WebView2-Loader wurden zusätzlich per PowerShell bestätigt. Wiederholte Kurzbefehle waren dabei teilweise stumm; Version 1.24.0 übernimmt die bisherigen Korrekturen und bearbeitet zusätzlich die doppelte Fachansage beim Wechsel aus anderen Hauptbereichen. Die Aktualisierungsprüfung von 1.24.0 wurde inzwischen unter Windows bestätigt. Die vollständige automatische Installation und Wiederherstellung sowie eine umfassende erneute Windows-/NVDA-/Braille-Abnahme bleiben offen. Die Nutzerabnahme ersetzt keine vollständige Barrierefreiheitszertifizierung. Bedienkonzept, Prüfstand und offene Punkte: [Barrierefreiheit](BARRIEREFREIHEIT.md).

## Daten und Sicherungen

Notenblick speichert Schülerdaten ausschließlich im Ordner **Daten** und überträgt sie nicht an externe Dienste. Sichere diesen Ordner regelmäßig zusätzlich auf einem anderen Datenträger. TXT-Notfalllisten helfen beim Nachlesen; eine vollständige Sicherung ist für die Wiederherstellung erforderlich.

Ab 1.24.0 kannst du unter **Einstellungen → Allgemein → Aktualisierungen** nach neuen Versionen suchen. Die Prüfung beim Start ist freiwillig und zunächst ausgeschaltet. Eine angebotene Version wird erst nach deiner Zustimmung heruntergeladen und installiert. Notenblick wird dabei geschlossen und anschließend wieder geöffnet. Deine Noten werden nicht übertragen. Die Aktualisierungseinstellungen werden getrennt von deinen Noten auf diesem Rechner gespeichert.

Der Updater berücksichtigt ausschließlich freigegebene stabile GitHub Releases. Eine Änderung am Quellcode allein löst keine Aktualisierung aus. Bei der Installation werden nur **Notenblick.exe** und der vollständige Ordner **Programm** ausgetauscht; **Daten bleibt unangetastet**. Wenn die Vorbereitung oder Prüfung scheitert, wird nichts installiert. Für einen unterbrochenen Austausch ist eine Wiederherstellung vorgesehen; ihr vollständiger praktischer Windows-Test folgt mit Version 1.25.0.

Manuelle Updates bleiben möglich: **Notenblick schließen, Daten sichern und ausschließlich Notenblick.exe sowie den vollständigen Ordner Programm ersetzen. Daten vollständig behalten.** Bewahre auch bei Verwendung des Updaters regelmäßig eigene Sicherungen auf.

Version 1.24.0 wurde auf ausdrücklichen Wunsch des Herausgebers mit gezielten Abschlussprüfungen veröffentlicht. Es gab keinen erneuten vollständigen Release-Testlauf. Der genaue Umfang und offene Praxistests stehen im [Prüfbericht](docs/PRUEFBERICHT-1.24.0.md).

## Voraussetzungen

- **Windows x86/x64:** .NET Framework 4.8 oder neuer und Microsoft Edge WebView2 Runtime.
- **Windows ARM64:** Für native Ausführung Windows 11 ab 24H2, .NET Framework 4.8.1 und ARM64-WebView2. Dieselbe EXE unterstützt beide Prozessorfamilien; native ARM64-Ausführung wurde für 1.23.2 innerhalb von Parallels praktisch bestätigt.
- Ein beschreibbarer Programmordner. Anwendersystem ist Windows.

## Lizenz und Entwicklung

Copyright © 2026 Sebastian Müller. Die eigenen Quellen stehen unter **GNU GPL Version 3** mit [Bibliotheksausnahme](LICENSE-EXCEPTION) ([Lizenztext](LICENSE), `GPL-3.0-only WITH GPL-3.0-linking-exception`). Drittanbieter behalten ihre [eigenen Lizenzen](THIRD-PARTY-NOTICES.md). Windows, .NET Framework und WebView2 Runtime stellt Microsoft separat bereit.

Fehler und Vorschläge bitte über GitHub Issues melden – mit erfundenen Beispielen und ohne echte Schülerdaten, Notenlisten, Sicherungen oder Zugangsdaten. Für Sicherheitslücken gilt [SECURITY.md](SECURITY.md).

[Änderungen](AENDERUNGEN.md) · [Prüfberichte](PRUEFBERICHT.md) · [Mitmachen](CONTRIBUTING.md) · [Technischer Einstieg](docs/PROJEKTUEBERSICHT.md)
