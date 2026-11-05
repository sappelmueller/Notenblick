# Notenblick 1.26.0 – Testbericht

Stand: 5. November 2026. Vollständige Testversion in `entwicklung/1.26.0`, ausgehend von der offiziellen Version 1.25.1. Kein offizielles Release und keine öffentliche Updaterfreigabe.

## Änderungen

- Eigene Leistungsbereiche je Fach hinzufügen, benennen, sortieren, übertragen und gewichten. Neue Fächer starten mit Klassenarbeiten 50 %, Tests 10 % und Mündlich 40 %. Neue Bereiche beginnen mit 0 %.
- Ein gemeinsamer Gewichtungsdialog mit kurzen Erklärungen, getrennten Verteilungen und Vergleich bei geänderten Durchschnitten. Änderungen bleiben bis zum Speichern im Entwurf. Fachvorlagen werden unabhängig übernommen; belegte abweichende Bereiche werden ausdrücklich zugeordnet.
- Direkte Noten, Punkte und Einzelnoten in allen Bereichen. Verschobene mündliche Einzelnoten und Klassenrunden behalten ihre Bearbeitungsform. Festgelegte Abschlussnoten bleiben unabhängig vom Durchschnitt gespeichert.
- Vertraute Ansichten mit fachbezogenen Reitern und Spalten. PDF, Word und Druck zeigen bis zu fünf Bereiche gemeinsam, weitere in Ergänzungstabellen. Excel und CSV bleiben vollständig breit; TXT bleibt linear und ohne unnötige Leerbereiche.
- Manuell geänderte TXT-Dateien bleiben erhalten. 0-%-Bereiche sind auch in Excel und CSV erkennbar. Mehrzeilige Excel-Hinweise haben genügend Platz. Die Halbjahresart steht in der kurzen Gewichtungszeile; der Klassendurchschnitt bleibt beim Druck mit dem letzten Schüler zusammen.

## Tatsächlich geprüft

Während der Entwicklung wurden Berechnungen, Entwürfe, Speicherung, Wiederherstellung, Navigation, Tastatur, Fokus, Hilfe, Exporte und Updater umfangreich automatisch geprüft. Der Katalog enthält 93 Pflichtgruppen. **Nach den letzten Exportkorrekturen wurde auf ausdrücklichen Wunsch des Herausgebers kein weiterer vollständiger Gesamtlauf durchgeführt. Für den endgültigen Stand wird kein vollständiger aktueller Release-Nachweis behauptet.**

Vorhandene Prüfungen umfassen unter anderem:

- Einen synthetischen Bestand mit 10 Schuljahren, 3.000 Schülern, 6.000 Leistungen, 180.000 Noteneinträgen und 9.200 TXT-Dateien sowie 3.000 referenzierte Schülerberechnungen.
- 171 native Updaterprüfungen unter .NET 8/Linux, einschließlich direktem Übergang von 1.25.1 zu 1.26.0 und Ablehnung einer nicht freigegebenen Testausgabe.
- Chromium-Prüfungen von Tastatur, ARIA, Fokus, F1, Dialogen, Fenstern und Zoom; zehn zusätzliche axe-Fälle für 1.26 mit bis zu 20 Leistungsbereichen.
- Unabhängiges Lesen und Rendern von Word, Excel, CSV, TXT, PDF und Druck; Open-XML- und PDF/UA-Prüfungen. Die Fälle mit 3, 5, 8 und 20 Bereichen wurden gezielt geprüft. Die Druckkorrektur bestand mit 23 Berichten auf 115 Seiten; die abschließende Kompaktkorrektur mit 17 Dokumentfällen und drei Gesamtexport-ZIPs.

Frühere Erfolge werden als Entwicklungsnachweise geführt, nicht pauschal auf jede spätere Quelländerung übertragen. Die abschließende Ausgabe wird neu erstellt und auf vollständige Archive, Prüfsummen, bytegleiche Entpackung und Start der entpackten Web-Oberfläche geprüft. Alle Testdaten sind synthetisch. Details: [Prüfumfang](qa-1.26.0.json).

## Aktualisieren und testen

Der direkte Updateweg aus 1.25.1 benötigt keine Zwischenversion. Auf ausdrücklichen Auftrag wurde keine umfangreiche Format-2-Migration eingeführt; Dateicontainer und Aktualisierungsdeskriptor bleiben bei Schema 1. Der unveränderte native Updater ersetzt ausschließlich `Notenblick.exe` und den vollständigen Ordner `Programm`; `Daten` bleibt unangetastet. Die Testausgabe bleibt `approved: false` und wird noch nicht öffentlich angeboten.

Die ZIP vollständig in einen eigenen Ordner entpacken und `Notenblick.exe` starten. `Daten` entsteht beim ersten Start. Bei einem vorhandenen Testbestand nur EXE und vollständigen Programmordner ersetzen und Daten behalten. [Testhinweise](TESTVERSION-1.26.0.md).

Echte Windows-/WebView2-/UIA-/NVDA-/Braille-/ARM64-Tests, Microsoft Office, physischer Druck sowie die vollständige Windows-Updateinstallation bleiben für 1.26.0 offen. Linux-/Chromium-/LibreOffice-Prüfungen ersetzen diese Praxisabnahme nicht. Eine offizielle Veröffentlichung erfolgt erst nach ausdrücklicher Freigabe durch Sebastian Müller.
