# Notenblick 1.17.0 – Klassenergebnisse und sichere Ersteinrichtung

Ausgangspunkt ist der vollständig bytegeprüfte private Quellbaum von 1.16.0, Commit a96263213568a0172fa2b1a359fe70a76a985987. Architektur, exakte Einzelberechnung, Dateiformat, native Speicherung, Sicherungen, portable Ablage und bisherige Exportwege bleiben erhalten. Es gibt keine zusätzliche Datenmigration und keine neue Laufzeitabhängigkeit.

## Fachlicher Befund

Die Abschlussnotenfelder der bisherigen Klassendurchschnittszeile waren im Bildschirm und Berichtsmodell fest als „–“ ausgegeben; eine entsprechende Mittelung fehlte. Die vorhandene individuelle Berechnung offener Leistungsbereiche lässt fehlende Werte bereits korrekt aus und bleibt unverändert.

`NR.classFinalAverages` verwendet die vorhandene rationale Mittelwertfunktion und ausschließlich aktive Fachschüler. Es zählen nur tatsächliche zur Klassen-Zeugnisart passende Festlegungen, einschließlich eindeutig gültiger ganzer historischer Jahreszeugnisnoten. Fehlende, inkompatible oder nicht mehr aktiv zugeordnete Werte stehen niemals im Nenner. Ohne Werte erscheint „–“. Suche, Bildschirmseite, Anzeige ehemaliger Schüler und Exportumfang sind unabhängig. Gespeicherte Einzelnoten und Schnappschüsse werden nicht verändert. App und Exportmodell übernehmen denselben Wert; automatische TXT-Übersichten ebenfalls. Keine zusätzliche Kennzeichnung „vorläufig“.

## Umsetzung

TXT-Verzeichnisversion 17 erhält sämtliche bisherigen Übersichten/Schülerberichte/Leistungsarten und die bestehende Ordnerstruktur. Normale Zeitabschnitte und Faktor 1 entfallen in Schülerberichten; abweichende Faktoren/GFS stehen bei der Leistung. Nur abweichende oder unklare historische Zuordnungen werden erklärt; frühere Halbjahresnoten verständlich benannt. Bestehende Inhaltsprüfung, SHA-256, Read-back, Reparatur und nur belegte eigene Altdatei-Bereinigung bleiben bestehen. Der Verzeichnisleser akzeptiert auch den neuen eigenen Stand; alte oder manuell veränderte Texte bleiben geschützt.

Verwaltung: Schuljahreskopien absteigend nach explizitem Beginn bzw. eindeutigem Schuljahreslabel; unbekannte Anfänge bleiben nachgeordnet. Auswahlfelder stehen bei Schülern/Fächern vor Aktionen, Dialogtitel nennen die Klasse, Fächer stehen alphabetisch. Keine Änderung der Datenreihenfolge oder des Arbeitsjahres.

Assistent: fünf Schritte, dynamische tatsächliche Namen, kompakte Fachliste, bevorzugter Listenimport und eine Schülertabelle mit Inline-Bearbeitung. Klassenwechsel, Rückwärtsnavigation, Vorschau, Dubletten und Fachteilnahmen bleiben erhalten. Einfache Gewichtungen sind zunächst eine Zusammenfassung, bearbeiten sich auf Wunsch mit automatischen Gegenanteilen. Erweiterte Vorgaben werden unverändert übernommen. Die fünfte Seite enthält ausschließlich Prüfung/Abschluss, gespeichert wird weiterhin über die atomare vorhandene Transaktion.

Die gemeinsame Dialogkomponente hält bei Bestätigungen die tatsächlichen Eingabeknoten und Ereignisse fest. Fortsetzen oder Escape stellt Fokus und Scrollposition wieder her. Escape wird bei geschützten Dialogen bereits vor der nativen Browser-Schließaktion abgefangen, damit wiederholtes Escape keinen Entwurf verlieren kann. Escape, X, Einrichtung beenden und Programm-Schließanfrage verwenden dieselbe Prüfung. Unveränderter Entwurf schließt direkt; ausgefüllte Klassen werden vor Entfernung bestätigt. Die Browser-Seitenschließung erkennt ebenfalls ungespeicherte Einrichtungseingaben. Keine Teildaten in Noten-JSON oder Einstellungen.

Schnellzugriff ist der Standard neuer Installationen und fertig eingerichteter Datenbestände; gespeicherte Werte haben Vorrang. Bei älteren bestehenden Daten ohne gespeicherten Darstellungswert bleiben die zuvor impliziten Auswahlfelder erhalten.

## Automatisierte Prüfungen

Die neuen dauerhaft integrierten Gruppen `v1170`, `v1170-storage`, `v1170-browser`, `v1170-files` prüfen:

- Alle drei Abschlussarten, 0/1/5/12/28 Festlegungen, gruppierte/direkte Gewichte, unabhängige rationale Referenzen, 0/1/2 Nachkommastellen mit Runden/Kürzen, ehemalige Schüler/Fachteilnahme, Zeugnisartwechsel und unveränderte individuelle Rechnung/Entscheidungen.
- Bildschirm/Export mit Suche, keinen Treffern, aktueller/gesamter Auswahl und beliebiger Bildschirmseite. Vier echte Berichte mit nur einem angezeigten Schüler und zwölf tatsächlichen Festlegungen in TXT/CSV/DOCX/XLSX/PDF und echtem Chromium-Druck; unabhängige Leser, LibreOffice, Open XML SDK und veraPDF PDF/UA-1.
- Faktor 1/2/1,5, GFS, alle Leistungsarten, normale und abweichende Halbjahre, frühere Noten, Bemerkungen/Status, eindeutige Schülerdateien. Produktiver C#-Kern: 1.16.0 beim Öffnen bytegleich, alle Dateiinhalte/Hashes geprüft, Reparatur ohne JSON-Commit, neue Verzeichnisbereinigung, geschützte manuelle Alttexte sowie Wiederherstellung/Neustart.
- Fünf Schritte mit zwei Klassen, vier Fächern, getrennten Listen und Inline-Änderungen, Fachteilnahme/Dubletten, Rückwärtsnavigation, Rundung/Gegenanteile, Zusammenfassung, Fehler/Wiederholung vor Veröffentlichung und Schutz erweiterter Vorgaben.
- Escape, wiederholtes Escape, X, Einrichtung beenden, Fortsetzen, Bestätigungs-Escape, ausdrückliches Verwerfen und ausgefüllte/leere Klassenentfernung. Eingaben, Fokus und identische Formknoten bleiben erhalten; keine gespeicherten Teildaten.
- Neue Installation, eingerichteter/neugestarteter Bestand, gespeicherte Darstellung, ältere implizite Auswahlfelder, echte Schnellzugriffslinks, vollständige Auswahl und Darstellungswechsel.
- Neue Browsergruppe mit axe, echter Tastaturbedienung sowie 25 Fenster-/CSS-Zoomfällen über alle fünf Schritte (1280/640/320 Pixel, zusätzlich 200 Prozent bei 640/320); Dialoggrenzen sowie Erreichbarkeit von Abschluss und X per Fokus.

Bisherige Assertions wurden nur für die beauftragten fünf Schritte, geschützten Abbruch, kompakte Bearbeitung, TXT-Sprache und aktuelle Versionswerte angepasst. Bestehende Rechen-, Speicher-, Wiederherstellungs- und Exportassertionen bleiben erhalten.

## Vollständiger Release-Nachweis

Vor Auslieferung frischer `python3 dev/manage.py release`: alle 53 Testsuiten/60 Prozessschritte, alle bisherigen Regressionen, 180.000 Ergebnisse und 9.200 TXT-Dateien mit 3.000 Schülerberichten, sämtliche Office-/PDF-UA-/Druck-/Schüler-ZIP-Validatoren, produktiver Assembly-Lader, zwei saubere bytegleiche Windows-Builds, ZIP-Integritäts-/Entpackprüfung und Testhost-Start der entpackten Ausgabe. Keine Testwiederverwendung und keine GitHub Actions. Der vollständige Release-Lauf deckt Integration ab.

Die tatsächliche erfolgreiche Laufkennung, Dauer, Quellbaum und ZIP-Prüfsummen werden im abschließenden Versionscommit festgehalten. `reports/<Lauf>/summary.json`, Einzellogs, `determinism.json` und `status --report` sind die lokalen Nachweise. Zwischenstände oder fehlgeschlagene Läufe sind keine Freigabe. Dokumentation und vorgesehene Dateiauswahl werden vor dem abschließenden Lauf fertiggestellt.

## Verbleibende Abnahme und Update

Echte Windows-x64-/ARM64-Starts, WebView2/UIA, NVDA-Sprache/Braille, Windows-Skalierung, Microsoft Office und physischer Druck sind in dieser Linux-Umgebung nicht live durchgeführt. Chromium/axe, CSS-Zoom, .NET unter Linux, LibreOffice, Open XML und veraPDF ersetzen diese Abnahme nicht. Ausgabe bis dahin als lokal geprüften Kandidaten behandeln.

Vor Update Programm schließen und Sicherung erstellen. Nur Notenblick.exe und den vollständigen Ordner Programm ersetzen; Daten einschließlich Notenlisten, Sicherungen und Einstellungen behalten. Programm-ZIP enthält keine Nutzerdaten, Quellcode-ZIP ist getrennt.
