# Notenblick 1.12.0 – Prüfbericht

Stand: 26. Oktober 2026. Ausschließlich synthetische Schüler und Leistungen.

## Grundlage und Schutz

Privates Repository `sappelmueller/Notenblick`, ID 1432518047, Branch main. Geprüfte Ausgangsbasis: Commit `f100e9b10dda74ef4c5e5e30651ebe5109988fee`, Quellbaum `267ad31328621c272f8530c759d33ae86c215c42`. Der lokal rekonstruierte Ausgangsbaum stimmt exakt überein. GitHub Actions sind deaktiviert; keine Runner oder Workflows angelegt. TrainScope wurde nicht bearbeitet.

Mathematische Domänenmodule und produktive Speicherung/Migration bleiben gegenüber der gesperrten Basis bytegleich. Neue Version ist als kompatible Anwendungsversion aufgenommen; beim Öffnen bestehender Daten ist keine fachliche Migration nötig.

## Umsetzung

- Ein vorhandener Exportdialog, ein gemeinsames Berichtsmodell und dieselben Dokumentgeneratoren für Einzel- und Sammelexport.
- Ausgabe „Ausgewählter Schüler“ bleibt Standard; „Alle Schüler einzeln“ erstellt ein ZIP in einem gewählten Format. Aktive Teilnehmer des ausgewählten Fachs, ausgeschiedene/archivierte Schüler nur zusätzlich auf Wunsch. Fehlende Noten bleiben fehlend.
- Optionen für Leistungsumfang, Anordnung und Bemerkungen auch im ZIP; tatsächliche Anzahl, ruhiger Fortschritt, Escape/Abbrechen und Wiederherstellung des Ausgangsfokus. Eingaben während Erstellung geschützt, keine nachträgliche Datei bei Abbruch.
- Einheitliche Fortsetzungsköpfe mit Fach/Klasse/Schuljahr. Dokumentkopf nur am Anfang; Kopfzeilen sind statischer Text. Die bestehenden lokalen PAGE-/NUMPAGES-Felder bleiben erhalten, ohne updateFields, externe Verknüpfungen oder zusätzliche Datumsfelder.
- Tabellenkopfzeilen werden automatisch wiederholt. PDF-Wiederholungen sind Pagination-Artefakte; semantische TH-Zuordnung bleibt erhalten. Excel enthält unveränderte fixierte Überschriften/Drucktitel; CSV genau eine Kopfzeile.
- Gesamtergebnis etwas deutlicher; Datumsbreite gegen getrennte Jahresziffern abgesichert. Keine Änderung der fachlichen Berichtsstruktur.
- Gemeinsamer ZIP-Schreiber mit begrenzten Chunks, eindeutigen Windows-Namen und 64-MiB-Limit. Native Prüfung des Archivs, jedes CRC und enthaltenen Office-Pakets vor der atomaren Speicherung. JSON-Sicherungsgrenze bleibt 256 MiB.

## Tatsächlich durchgeführte gezielte Prüfungen

- Sammelexportmatrix: 1/10/28/40/100 Schüler × PDF/Word/Excel/Text/CSV, zusätzlich ausdrücklich ausgeschiedene Teilnehmer. 26 Archive, 905 enthaltene Berichte unabhängig geöffnet und inhaltlich geprüft.
- 358 enthaltene Word-/Excel-Dateien sowie 38 neue einzelne Word-Berichte (zusammen 396 Dateien) wurden vollständig mit Microsoft Open XML SDK 3.3.0 validiert. ZIP-/XML-/Beziehungsprüfungen, keine globale Aktualisierung und keine externen Ziele.
- 217 native PDFs einschließlich aller PDF-Sammelberichte und neuer Layoutfälle mit veraPDF 1.30.3 PDF/UA-1 geprüft. Bestehende Exportprüfungen laufen zusätzlich vollständig.
- 38 Dokumentfälle: 10/20/28/40/60 Schüler; 3/7/8/10/15/24 Spalten; Hoch-/Querformat; umfangreiche Schülerberichte mit beiden Anordnungen, Leistungsumfängen und Bemerkungsoptionen. 758 gerenderte Seiten, darunter 644 Tabellen-Fortsetzungsseiten, wurden auf vollständigen Kopf, Orientierung, Seitenzahlen und Inhalte geprüft: native PDF, Chromium-Druck und LibreOffice-Word-Render. Datumsfragmente werden in Schülerberichten ausdrücklich abgewiesen.
- Chromium: fünf echte ZIP-Downloads, Reihenfolge und dynamische Beschreibungen, Teilnehmerauswahl, Formatwechsel, Abbruch während einer laufenden Erstellung, kein Einfluss auf einen danach geöffneten Dialog, Abbruch während der Blob-Übergabe vor dem nativen Speicherdialog, bytegleiche Base64-Chunks, Fokus und unveränderte Daten/Ansicht. Axe ohne Verletzungen im geprüften Dialog. 100/125/150/200 % CSS-Zoom und kleines Fenster geprüft. Renderseiten und Dialogansichten visuell kontrolliert.
- Nativer produktiver Exporthelfer: gültiges ZIP, atomarer Ersatz, Formatfilter, manipulierte CRC, gefährliche Pfade/reservierte Namen/fremde Formate, beschädigte Office-Dateien, Speicherfehlercodes und keine temporären Überreste.
- Vorhandene Berechnungs-, Speicher-, Wiederherstellungs-, Browser-, Belastungs- und Assembly-Prüfungen im lokalen Releaseablauf wiederverwendet. Die CSV-Prüfung wartet nun korrekt auf das asynchrone Exportergebnis; der geprüfte CSV-Injection-Schutz ist unverändert.

## Abnahmegrenzen

Linux/.NET-Testhost, Chromium, Open XML SDK, LibreOffice und veraPDF sind keine tatsächlichen Microsoft-Office-/Windows-/NVDA-Livetests. Windows-x64-/ARM64-Programmstart, WebView2-Speicherdialog, Word-/Excel-Öffnung, gesprochene NVDA-Ausgaben und physischer Druck stehen weiterhin aus. Keine Word-Abfrage oder Reparaturmeldung wird als unter Microsoft Word live ausgeschlossen bezeichnet. Technisch ist der Schutz anhand aller Paketbeziehungen, Einstellungen und Felder geprüft; LibreOffice öffnet und rendert die Dokumente.

Die Ausgabe bleibt bis zur manuellen Windows-/Office-/NVDA-Abnahme ein lokal geprüfter Entwicklungskandidat. Keine Sicherheitsmechanismen oder Office-Einstellungen verändert.

## Abschließender Release-Lauf

`python3 dev/manage.py release` vollständig erfolgreich: 43 Prozessschritte, alle Rückgabewerte 0. Erneuter sauberer Build bytegleich, produktiver Assembly-Lader vor/nach Wiederholungsbuild bestanden, beide ZIPs auf Integrität und vollständigen Dateibestand geprüft. Die entpackte Anwendung startet im Linux-Testhost; Einrichtung, Startseite, Navigation, Einstellungen und mündliche Eingabe funktionieren dort. Dies ist ausdrücklich kein tatsächlicher Windows-Programmstart.

Insgesamt 452 Office-Dateien vollständig schemavalidiert (56 bisherige, 396 neue); 245 PDFs mit veraPDF geprüft (28 bisherige, 217 neue). Zusätzlich 758 gerenderte Seiten mit 644 Tabellen-Fortsetzungen und 905 unabhängig gelesene Archivdateien. Der neue 1.11.0-Update-/Speichertest ist mit vier Szenarien im Gesamtlauf enthalten. 14 Infrastrukturregressionen, 16.160 Berechnungs-/Speicherprüfgruppen sowie bestehende Gewichtungs-, Wiederherstellungs-, Browser- und Belastungsprüfungen bestanden. Diese unterschiedlichen Prüfgranularitäten werden nicht zu einer künstlichen Gesamtzahl addiert.

Vorläufe wurden nicht als Freigabe verwendet. Eine neue Leerdatenprüfung fand eine typografische ff-Ligatur in Chromium-PDF-Text; die Leserprüfung normalisiert diese gleichwertige Unicode-Darstellung, ohne Berichtsinhalte oder Sollwerte zu verändern. Ein zusätzlicher Test weist nach, dass fehlender Text weiterhin abgewiesen wird. Der späte Abbruch während der Blob-Vorbereitung wird vor der nativen Übergabe berücksichtigt und ausdrücklich regressionsgeprüft.
