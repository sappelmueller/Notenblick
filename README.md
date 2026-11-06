# Notenblick

Entwicklungsbranch: **1.27.0 – Testversion**. Ein gezielter Qualitätsaudit verbessert Zuverlässigkeit, Darstellung und Tastaturbedienung. Die offizielle Version bleibt 1.26.0; diese Testversion erhält noch keine Updaterfreigabe. [Audit und Prüfstand](docs/PRUEFBERICHT-1.27.0.md).

Notenblick ist eine portable Offline-Notenverwaltung für Windows. Du verwaltest Klassen und Fächer, erfasst Noten oder Punkte und erstellst Berichte für den Schulalltag. Alle Schülerdaten bleiben lokal auf deinem Rechner.

[**Aktuelle Version für Windows herunterladen**](https://github.com/sappelmueller/Notenblick/releases/latest/download/Notenblick_1.26.0.zip)

Aktuelle Version: **1.26.0**, veröffentlicht am **6. November 2026**. [Was ist neu?](https://github.com/sappelmueller/Notenblick/releases/tag/v1.26.0)

Neu in 1.26: Eigene Leistungsbereiche je Fach und individuelle Gewichtungen. Du wählst zwischen direkter Gewichtung und einer gemeinsamen schriftlichen Note, vergleichst Änderungen vor dem Speichern und findest die Bereiche auch in Notenansichten und Exporten wieder. Die überarbeitete Hilfe erklärt die Bedienung Schritt für Schritt.

## Das kann Notenblick

- **Organisieren:** Schuljahre, Klassen, Fächer und Schüler verwalten, Schülerlisten übernehmen und mit dem Einrichtungsassistenten starten. Die Startseite führt zum letzten Fach und zu offenen Noteneingaben.
- **Bewerten:** Eigene Leistungsbereiche pro Fach, mündliche Klassenrunden und Einzelnoten in allen Bereichen sowie GFS erfassen. Teilnehmer auswählen, Status und Bemerkungen ergänzen.
- **Noten und Punkte:** Noten direkt eingeben oder Punkte mit linearen, geknickten und individuellen Notenschlüsseln umrechnen. Ganze, halbe, Viertel- und Zehntelnoten sowie manuelle Anpassungen sind möglich.
- **Durchschnitte und Zeugnisse:** Gewichtungen festlegen und Ergebnisse nachvollziehen. Halbjahresinformationen mit Viertelnoten, Zeugnisse mit ganzen Noten; festgelegte Abschlussnoten bleiben unabhängig vom Durchschnitt gespeichert.
- **Sichern und wiederherstellen:** Automatisch speichern, vollständige Sicherungen erstellen und frühere Stände wiederherstellen. TXT-Notfalllisten sind auch ohne das Programm lesbar.
- **Berichte erstellen:** PDF, Word, Excel, CSV und TXT für Fächer, Leistungen und Schüler, dazu Druckvorschau und Gesamtexporte als ZIP.

## Herunterladen und starten

1. Das Windows-ZIP vollständig in einen beschreibbaren Ordner entpacken.
2. **Notenblick.exe** starten. Der vollständige Ordner **Programm** muss daneben liegen; **Daten** entsteht beim ersten Start.
3. Dem Einrichtungsassistenten folgen oder eine eigene Sicherung wiederherstellen.

Eine Installation von Notenblick ist nicht nötig. Die EXE ist bisher nicht digital signiert; Windows kann deshalb einen Sicherheitshinweis anzeigen. Quellcode und Prüfsummen stehen beim [Release](https://github.com/sappelmueller/Notenblick/releases/tag/v1.26.0).

**Voraussetzungen:** Windows x86/x64 mit .NET Framework 4.8 oder neuer und Microsoft Edge WebView2 Runtime. Für native ARM64-Ausführung: Windows 11 ab 24H2, .NET Framework 4.8.1 und ARM64-WebView2. Dieselbe EXE unterstützt beide Prozessorfamilien; die erforderlichen Programm-Bibliotheken liegen bei. Node.js, Python und Office werden für die Anwendung nicht benötigt.

## Tastatur und Hilfe

Notenblick ist für Tastatur, NVDA und Braille entwickelt. Links, echte Registerkarten, kurze Beschriftungen und eine klare Fokusführung unterstützen die Bedienung. **F1** erklärt den aktuellen Arbeitsschritt; Eingabe und Umschalt+Eingabe führen durch die schnelle Noteneingabe.

Version 1.26.0 wurde vom Herausgeber unter Windows praktisch getestet und zur Veröffentlichung freigegeben. [Bedienkonzept und Barrierefreiheit](BARRIEREFREIHEIT.md) · [Hilfe](docs/HILFE-1.26.0-QUELLE.md) · [Prüfstand](docs/PRUEFBERICHT-1.26.0.md)

## Daten und Aktualisierungen

Schülerdaten bleiben ausschließlich im Ordner **Daten** und werden nicht an externe Dienste übertragen. Sichere diesen Ordner regelmäßig zusätzlich auf einem anderen Datenträger. TXT-Notfalllisten helfen beim Nachlesen; zur vollständigen Wiederherstellung dient eine Sicherung.

Unter **Einstellungen → Allgemein → Aktualisierungen** kannst du nach freigegebenen Versionen suchen. Die Prüfung beim Start ist freiwillig und zunächst ausgeschaltet. Download und Installation beginnen erst nach deiner Zustimmung. Dabei werden ausschließlich **Notenblick.exe** und der vollständige Ordner **Programm** ersetzt; **Daten bleibt unangetastet**.

Der direkte Wechsel von **1.25.1 auf 1.26.0** ist ohne Zwischenversion möglich.

Manuell aktualisieren: Notenblick schließen, Daten sichern, EXE und vollständigen Programmordner ersetzen. **Daten vollständig behalten.**

## Lizenz und Kontakt

Copyright © 2026 Sebastian Müller. Eigene Quellen: **GNU GPL Version 3** mit [Bibliotheksausnahme](LICENSE-EXCEPTION) ([Lizenztext](LICENSE), `GPL-3.0-only WITH GPL-3.0-linking-exception`). Für Drittanbieter gelten ihre [eigenen Lizenzen](THIRD-PARTY-NOTICES.md). Windows, .NET Framework und WebView2 Runtime stellt Microsoft separat bereit.

Fehler und Vorschläge bitte über [GitHub Issues](https://github.com/sappelmueller/Notenblick/issues) melden – mit erfundenen Beispielen und ohne echte Schülerdaten oder Zugangsdaten. Sicherheitslücken: [SECURITY.md](SECURITY.md).

[Änderungen](AENDERUNGEN.md) · [Prüfberichte](PRUEFBERICHT.md) · [Mitmachen](CONTRIBUTING.md) · [Entwicklung](ENTWICKLUNG.md)
