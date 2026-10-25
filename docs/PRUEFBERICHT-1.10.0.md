# Notenblick 1.10.0 – Prüfbericht

Prüfstand: 25.10.2026. Ausschließlich synthetische Daten; lokale Linux-Entwicklungsumgebung. Verbindliche Ausgangsbasis ist der private GitHub-Stand 1.9.0, Commit `c0b3f705d005348c3730439f1847e8edfe6a7ee7`.

## Geprüfte Änderungen

- Eine Buildversion aus package.json; unaufdringlicher Text am Ende der Startseite.
- Gemeinsame Überschriften, Aktionsleisten und geschlossene Ansichtseinstellungen in beiden Notenlayouts. Sichtbare Suche und kurze Exportaktion einschließlich mündlicher Einzelnoten und Schüleransicht.
- Eine gemeinsame Berichtsgrundlage mit vorhandener exakter Berechnung; eigene Zeilenliste für mündliche Einzelnoten. Aktuelle Auswahl und vollständiger Umfang berücksichtigen alle Seiten.
- Tatsächliche DOCX-, XLSX- und strukturierte PDF-Dateien sowie TXT, CSV und semantische Druckausgabe. Word-Formatvorlagen, wiederholte Kopfzeilen, deutsche Sprache; numerische Excel-Noten und Datumswerte, keine Formeln/Makros/externen Verbindungen.
- CSV-Schutz auch gegen durch Leer-, Steuer- und Unicode-Formatzeichen versteckte Formeln. Atomare Binärspeicherung mit Format-/Größenprüfung und Windows-Überschreibbestätigung.
- Bestehende mathematische und native Speichermodule bytegleich; Noten und Ansichtszustände bleiben beim Export unverändert.

## Tatsächliche Prüfungen

Der vollständige Release-Lauf vom 25.10.2026 hat 35 Schritte erfolgreich abgeschlossen: sämtliche bisherigen Berechnungs-, UI-, Speicher-, Browser-, Datenkompatibilitäts- und Leistungstests, neue Exportprüfungen, bytegleicher Wiederholungsbuild, Assembly-Lader, ZIP-Integrität und Start der entpackten Auslieferung. Der endgültige Lauf einschließlich Lizenzhinweisen ist `20261025T124751308252Z`; alle 35 Schritte bestanden. `docs/qa-1.10.0.json` enthält die kompakten Ergebnisse. 18 native Exportprüfungen umfassen auch vollständige JSON-Sicherungen über 64 MiB. Der große Bestand enthält 3.000 Schüler, 6.000 Leistungen und 180.000 Ergebnisse (37 MB JSON). Die bisherigen Chromium-Gruppen bestehen mit 91, 30, 38 und 30 Szenarien; die neue Gruppe ergänzt fünf umfangreiche Export-/Dialogabläufe ohne axe-Verstöße. Die Tests prüfen alle neun Exportkontexte, 40/100/250 Einzelnoten, breite Matrizen, individuelle Teilnehmer, Status, GFS, Faktoren, historische Jahre, manuelle Zeugnisnoten, lange Texte und Sonderzeichen.

veraPDF 1.30.3 überprüft die maschinellen PDF/UA-1-Regeln für zwölf tatsächliche PDFs, sämtliche erzeugten Berichtstypen und die tatsächlich im Browser heruntergeladene PDF. Unabhängige Dateileser sind python-docx, openpyxl und pypdf. Visuelle Kontrolle erfolgt an gerenderten Chromium-, PDF- und LibreOffice-Ausgaben.

## Abgrenzung

Nicht durchgeführt: echte Windows-Starts x64/ARM64, Microsoft Word/Excel, native Speicherdialoge, physische Drucke und NVDA-Livetests. Keine Behauptung vollständiger menschlich bestätigter PDF/UA-Konformität. Automatische Strukturprüfungen und gerenderte Kontrollen sind gesondert dokumentiert. Bis zur Windows-/NVDA-Abnahme Entwicklungskandidat. Update ersetzt nur Notenblick.exe und Programm; Daten bleibt bestehen.

Die finale Druckprüfung bestätigt tatsächlich gerendertes A4-Querformat bei langen Einzelnotenlisten. Spaltenbreiten folgen dem Inhalt. Die zwölf PDF/UA-Dateien schließen Sonderzeichen in Metadaten und eine tatsächliche Browser-PDF ein; keine maschinell verletzte Regel. Die Dateigruppe besteht aus 14 Prüfblöcken. Zwischenzeitlich fehlgeschlagene Prüfläufe wurden nicht als Freigabe verwendet.
