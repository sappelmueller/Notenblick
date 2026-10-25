# Notenblick 1.11.0 – Prüfbericht

Prüfstand: 25.10.2026. Ausgangsbasis: privates Repository sappelmueller/Notenblick, ID 1432518047, main, Commit 8c79c0f57392907ef37cf2d6b9b95810781cdac9 (Version 1.10.0). Nur synthetische Daten und lokale Prüfungen; GitHub Actions bleiben deaktiviert.

## Änderungen und fachliche Sicherung

Word erzwingt keine Feldaktualisierung beim Öffnen. PAGE und NUMPAGES bleiben lokale automatische Felder ohne erfundene feste Seitenzahlen. Keine externen Beziehungen. Die vollständige Open-XML-Prüfung deckte außer den Tabelleneigenschaften auch fehlendes w:shd/@w:val sowie falsche Eigenschaftenreihenfolgen in Absatz-, Zeichen- und Tabellenformatvorlagen auf. Diese Fehler sind korrigiert. Die frühere Reihenfolge der Zeileneigenschaften wird vom SDK akzeptiert; neu wird cantSplit vor tblHeader konsistent ausgegeben und ausdrücklich geprüft.

Eine zentrale inhaltsabhängige Layoutplanung ersetzt die Sechs-Spalten-Grenze. Spaltenart, Überschrift, typische und maximale Zellinhalte, Mindestbreiten und A4-Fläche bestimmen Hoch-/Querformat und 10 beziehungsweise 9 Punkt. Übliche sieben bis zehn Spalten bleiben zusammen. Kurze 15 Spalten passen; acht extrem lange können sinnvoll getrennt werden. Notwendige Teile beginnen mit eindeutiger Bezeichnung auf einer neuen Seite, Namen und Durchschnitte werden wiederholt. Excel/CSV bleiben vollständig. Zu umfangreiche Bemerkungen erscheinen als eindeutig zugeordnete Absätze. Überflüssige Word-Abschlussabsätze und große Absatzabstände in Tabellen entfallen.

Der Exportdialog zeigt mit aktuellen Filtern oder alle Einträge, dynamisch exakte Anzahlen und für Dokumentformate das automatische A4-Seitenformat. Ein mit aria-describedby verbundenes einzelnes höfliches Statusfeld erklärt Änderungen ohne Fokuswechsel. Erstellen, Speichern, fehlende Speicherorte und Berechtigungen werden unterschieden; Abbruch ist fehlerfrei. Späte asynchrone Exporte beeinflussen keine späteren Dialoge. Escape während der Druckvorbereitung verhindert eine verspätete Druckvorschau. Der native Speicherdialog läuft nicht nach zwei Minuten ab. ZIP-Integrität, CRC, alle XML-Teile und lokale Beziehungen werden vor atomarer Office-Speicherung geprüft.

Berechnungs-, Validierungs-, Migrations- und Speicherkern sind laut ursprünglichen SHA-256-Prüfungen unverändert. Ein 1.10.0-Stand mit 250 Einzelnoten, 60 Schülern und historischem Jahr wird bytegleich geöffnet; Exporte ändern ihn nicht. Sicherung, Schutzstand und Wiederherstellung erhalten Noten, Faktoren, GFS, Teilnehmer, Status und manuelle Zeugnisnoten. Keine fachliche Migration oder zusätzliche Laufzeitabhängigkeit.

## Startseite

Die Versionszeile bleibt normaler Text aus der zentralen Buildversion. Kaltstart und erneuter Start, neue und vorhandene synthetische Daten, DOM/Textknoten, Steuerzeichen, Pseudoelemente und zwölf Kombinationen aus 320/640/1280 Pixeln sowie 100/125/150/200 Prozent CSS-Zoom wurden untersucht. Der gemeldete kurzzeitige Effekt darunter war nicht reproduzierbar; keine nachgewiesene Ursache und keine spekulative Änderung der Versionsanzeige. Ein unabhängig gefundener Überlauf der Wortmarke im Programmkopf bei extremer Enge wurde korrigiert. CSS-Zoom ist kein tatsächlicher Windows-Skalierungs- oder WebView2-Livetest.

## Prüfstand

Der endgültige vollständige lokale Release-Lauf `20261025T210837108494Z` hat alle 39 Prozessschritte bestanden. Er umfasst sämtliche bisherigen Berechnungs-, UI-, Speicher-, Kompatibilitäts-, Browser-, Belastungs- und Assembly-Ladertests, den Windows-Cross-Build, bytegleichen Wiederholungsbuild, beide ZIP-Prüfungen und Start der entpackten Auslieferung im Linux-Testhost. Kompakte Ergebnisse: `qa-1.11.0.json`. Zwischenzeitlich fehlgeschlagene Läufe sind keine Freigabe; ein neuer XLSX-Inhaltsvergleich wurde korrigiert, weil die vorhandene Metadatenzeile C5 auch bei zwei fachlichen Spalten den Umfang enthält.

- 16.160 Kern-/Speicherprüfgruppen, 992 exakte Fälle direkter Gewichtung und 441 Gewichtsumrechnungen bestanden. Ursprüngliche SHA-256-Werte der Berechnungs-/Speichermodule unverändert.
- Alle bisherigen Chromium-Gruppen bestanden: 91/30/38/30 Szenarien, Exportgruppe 1.10 mit fünf Abläufen und neue Gruppe 1.11 mit zehn Abläufen; keine erfassten axe-Verstöße oder JavaScript-Fehler. Neue Dialogprüfungen umfassen alle sechs Ausgabeformen, aktuelle/alle/leere Auswahl, Schüler- und Leistungssuche, 250 Einzelnoten, historische Jahre, Dateidownloads, Abbruch, Fehler und Fokus.
- 27 native Binärexportprüfungen: tatsächliche DOCX/XLSX, beschädigte ZIP-/CRC-/XML-Inhalte, unzulässige externe Beziehungen, falsche Formate, Dateifilter und atomarer Ersatz. Zusätzlich echte C#-Speicherabläufe unter .NET 8/Linux einschließlich Update von 1.10.0 und Wiederherstellung.
- Vollständige Open XML SDK 3.3.0-Validierung für 57 erzeugte DOCX-/XLSX-Dateien: null Fehler. Drei absichtlich beschädigte Dateien wurden korrekt abgewiesen. Separate Paket-/XML-Prüfungen bestätigen Beziehungen, Felder, Raster, Kopfzeilen und A4-Abschnitte. Dies ist kein Word-Livetest.
- 30 Dateiprüfblöcke mit python-docx, openpyxl und pypdf bestätigen vollständige Inhalte, echte Datums-/Zahlenwerte, identische dargestellte Ergebnisse, Sprach-/Strukturangaben und unveränderte Daten. veraPDF 1.30.3: 28 PDFs ohne verletzte maschinelle PDF/UA-1-Regel, einschließlich tatsächlicher Chromium-Downloads.
- Belastung: 3.000 Schüler, 6.000 Leistungen, 180.000 Ergebnisse und rund 37 MB JSON; Speichern, Start, vollständige/incrementelle Speicherung und Sicherungsrückweg bestanden. Zusätzlich 40/100/250 Einzelnoten sowie 4/5/6/7/8/9/10/12/15/20/24 Spalten geprüft.
- Tatsächlich gerendert und visuell kontrolliert: 57 Word-/PDF-Seiten mit allen genannten Spaltenfällen, sehr kurzen/lange Bezeichnungen, Schülerbericht und langen Bemerkungen. Zusätzlich elf Chromium-Druckseiten mit sieben, acht, zehn und zwanzig Spalten, wiederholten Köpfen und Schwarz-Weiß-Darstellung. Die Word-Render stammen aus LibreOffice; die lokalen PAGE-/NUMPAGES-Felder ergeben dort richtige Seitenzahlen. Bildschirmkontrollen mit verschiedenen Breiten und CSS-Zoom sowie neue/erneute Startseiten ohne reproduzierten Versionszeileneffekt.

## Offene tatsächliche Abnahme

Keine echte Windows-/WebView2-Umgebung, Microsoft Word/Excel oder NVDA verfügbar. Deshalb keine Word-Warnmeldungs-, Office-, Windows-x64-/ARM64-Start-, nativen Speicherdialog-, physischen Druck- oder NVDA-Livetests durchgeführt. Die Ursache der Feldaktualisierungsabfrage ist technisch entfernt; ihre Abwesenheit unter echtem Microsoft Word ist noch nicht live bestätigt. SDK-, Python-, Chromium-, veraPDF- und LibreOffice-Prüfungen ersetzen dies nicht. Maschinelle PDF/UA-Regeln allein bestätigen keine vollständige menschlich geprüfte Barrierefreiheit.

Bis zu dieser Abnahme Entwicklungskandidat. Update ersetzt nur Notenblick.exe und den vollständigen Ordner Programm. Der vorhandene Ordner Daten bleibt unangetastet.
