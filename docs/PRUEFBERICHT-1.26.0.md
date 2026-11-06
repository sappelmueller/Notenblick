# Notenblick 1.26.0 – Testbericht

Stand: 6. November 2026. Vollständige Testversion in `entwicklung/1.26.0`, ausgehend von der offiziellen Version 1.25.1. Kein offizielles Release und keine öffentliche Updaterfreigabe.

## Letzter Feinschliff und vollständige technische Prüfung

Ausgangspunkt: `0e3383e966f7d97b4321b4f371662de832b72097`. Automatische Verteilungen und Umrechnungen verwenden gespeicherte Hundertstel und ergeben exakt 100 %. Bewusst gespeicherte vierstellige Werte bleiben beim unveränderten Öffnen erhalten. Die zentrale exakte Notenberechnung bleibt bestehen.

Der gemeinsame Editor zeigt kompakte Zeilen und zwei getrennte Verteilungen bei zusammengefasster Berechnung. Eine Rundungsbestätigung entfällt. Nur tatsächlich veränderte Schülerdurchschnitte erfordern die Übernahmebestätigung. Die Vergleichstabelle ist eingeklappt, zeigt zunächst nur Änderungen und kann auf alle Schüler erweitert werden.

Der Assistent verwendet denselben Editor; die alte Prüfung auf Hausaufgaben und Heftführung ist entfernt. Zusammenfassung und gespeicherte Vorgaben stimmen in beiden Berechnungsarten überein. F1 erklärt den aktuellen Schritt oder die Gewichtung mit den vorhandenen Hilfetexten. Alle neun Themen, 77 Kennungen, Listen und Tabellen bleiben erhalten. Die Notenübersicht besitzt die eigene H3 „Durchschnitte und Zeugnisnoten“; die Tabellenbenennung der Schüleransicht verbindet die sichtbare Inhalts- und Bereichsüberschrift.

Die gezielten Gruppen v170, v1260, v1260-browser, v170-browser, v1230 und v1231 bestanden vor dem vollständigen Lauf. Geprüft wurden zusätzlich 25 gleichmäßige Verteilungen, beide Umrechnungsrichtungen mit 3/5/8/20 Bereichen, eigene vierstellige Vorgaben, leere/notengleiche/veränderte Bestände, Vergleichsfilter und beide vollständigen Einrichtungsabläufe mit angepasster Vorlage. Keine Änderung an Speicherformat, nativer Aktualisierung oder Exportvorlagen.

Vollständiger Katalog und Auslieferungsprüfung werden mit `dev/manage.py release` ausgeführt; bei Fehlern wird derselbe Katalog über `--retry` mit gültigen Einzelnachweisen fortgesetzt. Kein offizielles Release, Tag, Merge oder öffentlich freigegebenes Update. Der Abschlussnachweis wird nach erfolgreicher technischer Prüfung ergänzt.

Die folgenden Abschnitte dokumentieren vorherige Entwicklungsstände. Sie sind keine Behauptung einer vollständigen Prüfung des späteren Quellstands.

## Bedienung und Hilfe – 6. November 2026

Ausgangspunkt dieser gezielten Überarbeitung: Entwicklungscommit `d395161c0e79d6324638eec7986b228b323449da`.

- Direkte Gewichtung sprachlich gekürzt; Sortieraktionen im vorhandenen Ausklappbereich. Die zusammengefasste Berechnung hat zwei getrennte Abschnitte mit eigenen Summen und Verteilaktionen. Die gemeinsame Note wird genau einmal in der Gesamtnote gewichtet.
- Umrechnung und gerundete neue Werte stehen unmittelbar unter der Berechnungsart. Bestätigungen und der Vergleich der Schülerdurchschnitte bleiben erhalten. Derselbe Editor versorgt Fachdialog, Standardvorgaben und Einrichtung.
- Einheitliche Aktionen und Leerzustände aller Leistungsbereiche, klare mündliche Auswahl, umgebrochene Registerkarten und abgesetzte Gewichtung. 0-%-Hinweis einmal oberhalb der Übersicht mit Tabellenbeschreibung für Screenreader.
- Die bereitgestellte Hilfe vollständig übernommen: neun Themen, 77 Abschnitte, alle Kennungen und 49 Basiskontexte erhalten. Absätze, Hervorhebungen, nummerierte Schritte, Listen und Tabellen werden zentral sowohl in der Vollhilfe als auch in F1 dargestellt. Redaktionelle Einbauhinweise werden nicht angezeigt.

Gezielt erfolgreich geprüft: 21 Gruppen in `v1260`, sechs Gruppen mit allen 49 F1-Kontexten in `v1230`, 13 Gruppen in `v1231` sowie elf Gruppen für die mündlichen Bedienabläufe in `v190`. Die Inhalte aller 77 Abschnitte wurden mit den Hilfedaten und der Markdown-Quelle verglichen; ihre Kennungen sind zum Ausgangsstand identisch. Chromium bestand sechs Bediengruppen und **25 axe-Fälle**, darunter alle neun Hilfethemen, fünf Fenster-/Zoomfälle der Gewichtung und schmale Hilfetabellen bei 320 Pixel bzw. 200-%-CSS-Zoom. Die Bildschirmdarstellung von Gewichtung, mehrzeiligen Reitern und Berechnungshilfe wurde zusätzlich visuell kontrolliert.

Unveränderte Durchschnitte wurden für beide Berechnungsarten exakt geprüft, ebenso Entwürfe, Zuordnung bei 0 %, Umbenennen, Sortieren, Übertragung, Bestätigungen, Abbruch und neue Bereiche. Vier Exportfälle mit 3/5/8/20 Bereichen wurden erzeugt; TXT und CSV blieben vor/nach dem unveränderten Gewichtungsentwurf bytegleich. Bei dieser Überarbeitung wurden Domain-Berechnung, Speicherung/Sicherung, sämtliche Exportvorlagen, automatische TXT-Erzeugung und native Dateien nicht geändert. Frühere unabhängige Office-/PDF-Validatoren wurden nicht erneut vollständig ausgeführt. Kein großer Gesamttest und keine Releasefreigabe.

Lokale Einzelprotokolle: `reports/20261106T073420563417Z` (F1/Hilfe und vorheriger Testfallfehler), `reports/20261106T073659502286Z` (korrigierte 1.26-Gruppen vollständig erfolgreich), `reports/20261106T073923524029Z` (abschließende mündliche Bedienprüfung erfolgreich). Fehler beim neu ergänzten Testablauf (nicht verworfener Einstellungsentwurf bzw. Auswahl eines verdeckten Einstellungsbuttons) wurden im Test korrigiert. Keine offenen Fehler in den abgeschlossenen gezielten Prüfungen.

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
