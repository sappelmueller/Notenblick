# Notenblick 1.21.1 – Prüfbericht

Ausgangspunkt: privates sappelmueller/Notenblick, Repository-ID 1432518047, Hauptzweig 41fd6a89ead73cd882477ef569e965142ac797e8, Baum 57323f2ca411cd7ffa54d23b6fd3e855b65eb73f. Das Quellarchiv 1.21.0 wurde mit allen 269 versionierten Dateien gegen GitHub abgeglichen. Actions bleiben deaktiviert. Private Entwicklungszwischenstände sind keine Programmfreigabe.

## Funktions- und Datenschutzprüfung

Vorhandene Leistungen zeigen zuerst Ergebnisse. Noten bearbeiten aktiviert dieselbe Eingabe, Fertig kehrt zur Ansicht zurück, Schließen stellt Tabellenposition und Fokus wieder her. Neue Leistungen und Fortsetzen beginnen sofort mit Bearbeitung. Jede neue Bearbeitung startet mit Alle Schüler; eine bewusste Einzelansicht bleibt bei normalen Aktualisierungen erhalten. Genau ein unterer Bereich in Kompakt, Leistungsarten und ausgeblendeten Arten. Ungültige Eingaben verhindern Wechsel und Schließen.

Mündliche Einzelnoten verwenden denselben vorhandenen Dialog und dieselbe Speichertransaktion. Bereits mit Tab erfasste neue Einzelnoten werden bei weiteren Änderungen als gespeicherte Leistung behandelt: Punkte/Direkt/Punkte bleibt verlustfrei, Punkte und manuelle Daten bleiben erhalten, Schülerwechsel übernimmt gültige Zusatzangaben am ursprünglichen Schüler und blockiert bei ungültigen Eingaben. Diese Grenzfälle sind dauerhaft automatisiert geprüft. Anzeigen ist bei abgeschlossenen Daten verfügbar, Bearbeitung bleibt geschützt. Tatsächliche Leistungsbezeichnung als Überschrift, gleiche Punkte-/Direkteingabe und schnelle Navigation. Fertig wechselt innerhalb desselben geöffneten Dialogs zur Ansicht und direkt auf Noten bearbeiten, ohne zwischenzeitlichen Außenfokus. Der vorhandene Modalbaustein unterstützt diesen gezielten Zustandstausch und den unmittelbaren Überschriftenfokus. Schlüsseländerungen verwenden die bisherigen Auswirkungenbestätigungen und schützen Punkte sowie manuelle Noten; Abbruch verändert keinen gespeicherten Schlüssel.

courseOpenView gehört zu den bisherigen Ansichtseinstellungen: Standard letzter Bereich, alternativ Übersicht. Echte Fachöffnungen über Klasse/Fach/Schnellzugriff berücksichtigen sie. Normale Tabs und Programmstart bleiben unabhängig. Zur Notenübersicht öffnet die Übersicht, Fortsetzen die konkrete Bearbeitung. Native Speicherung, Neustart und Wiederherstellung bleiben geprüft.

Punkte-Noten-Tabellen, Punktzahlprüfung und sichtbare Vorschau verwenden ausschließlich die unveränderte zentrale Umrechnung. Ganze, halbe und Zehntelpunktschritte betreffen nur die Darstellung; ein nicht auf dem Raster liegendes Maximum und null sind enthalten. Prüfer/Vorschau speichern nichts und sprechen nicht bei jedem Tastendruck. Übernahme verwendet die vorhandene Statusquelle. Berechnete, manuelle und tatsächlich gewertete Note bleiben getrennt.

Lange Bildschirmtabellen werden geblättert. Zum Schutz vor unbrauchbar großen Dokumenten werden höchstens 100.001 Rasterwerte aufgebaut. Die gültige Punkteingabe und Berechnung werden dadurch nicht eingeschränkt. PDF verwendet dieselbe Tabelle, keine zusätzliche technische Grenzansicht.

Bruchrechnung, Punkteumrechnung, Gewichtung, Bewertungslogik, Notfalllisten und produktive Speicherung bleiben gegenüber 1.21.0 bytegleich. Keine Umrechnung alter Noten, erfundenen Punkte oder neue Speicherarchitektur. Dauerhafte Tests und Dokumente verwenden ausschließlich synthetische Daten; echte Referenzen bleiben außerhalb des Repositorys.

## Automatisierte Prüfungen

Der vollständige lokale Umfang umfasst 81 Prüfgruppen. Neue Gruppen: v1211, v1211-browser und v1211-files. Bestehende Tests wurden nur für ausdrücklich geänderte Bedienabläufe, Beschriftungen und aktuelle Versionsausgaben angepasst. v1210-storage prüft zusätzlich dauerhafte Fachöffnungs- und Programmstarteinstellungen.

- 158.484 exakte Umrechnungen gegen eine unabhängige Auswahl der nächsten erlaubten Notenstufe: zwölf Schlüssel-/Notenstufenkombinationen, sieben Maxima, Grenzen, Monotonie, Null-/Voll-/Leerpunkte, manuelle Noten und Status.
- Zusätzlich 22.464 Tabellenwerte: zwölf Kombinationen, fünf Maxima einschließlich Dezimalwerten und drei Punkteschritte. Jeder Wert stimmt mit der zentralen Umrechnung überein.
- Chromium/Playwright: Anzeigen/Bearbeiten/Fertig, Leistungswechsel, beide Layouts, ausgeblendete Arten, direkte/Punkteingabe, Hausaufgaben/Heftführung, neue Leistung, Fortsetzen, Fachöffnungsoptionen, explizite Übersicht, geschützte Daten, Schlüsseländerung/Abbruch, Vorschau, Punktprüfung, Enter/Shift+Enter/Tab, manuelle Note, Fehler und Rückkehrfokus.
- 13 zusätzliche axe-Prüfungen: zehn Kombinationen aus Ansicht/Bearbeitung und Fenster-/CSS-Zoom sowie Notenschlüssel und mündliche Anzeige/Bearbeitung. Vorhandene Accessibility-Prüfungen bleiben erhalten. Geprüft werden DOM, Tastatur, Fokus und Statusquelle, keine tatsächliche NVDA-Sprachausgabe.
- Produktiver C#-Speicherpfad: Alt-/Neudaten, Neustart, automatische Speicherung, JSON-Sicherung, Schutzstand, Wiederherstellung und vollständige automatische TXT-Punktdaten.
- Großer synthetischer Bestand: zehn Schuljahre, 3.000 Schüler, 6.000 Leistungen, 180.000 Ergebnisse; Berechnungen, Speicherung und Wiederherstellung.
- Alle bisherigen Office-, PDF/UA-, ZIP-, CSV-, Druck-, Verwaltungs-, Registerkarten-, Abschlussnoten- und Assembly-Lader-Prüfungen bleiben im vollständigen Release-Lauf.

## Tatsächliche Dokumente und Vergleich

Neun zusätzliche Fälle entstehen tatsächlich in TXT, CSV, Excel, Word und PDF: vier Punkte-Leistungsfälle, eine direkte Leistung, drei Schlüssel-Schrittweiten und ein synthetischer Vergleichsfall. Inhalte werden mit python-docx, openpyxl, CSV-Leser, pypdf und Poppler unabhängig geöffnet. Word wird zusätzlich mit LibreOffice gerendert und erneut inhaltlich geprüft. 18 zusätzliche Open-XML- und neun PDF/UA-1-Prüfungen begleiten Überschriften, Tabellenköpfe, Tags, Lesereihenfolge und Inhaltsgrenzen.

Die bereitgestellten Word-/PDF-Testberichte wurden außerhalb des Repositorys geöffnet und visuell verglichen. Sie und der bewusst mit anderen synthetischen Punktzahlen erzeugte Vergleichsfall besitzen jeweils eine Seite und eine gemeinsame Tabelle. Grüne Gestaltung erhalten; wiederholte Maximalpunkte, Noten-Zwischenüberschrift, doppelter sichtbarer Datumsblock und Gedankenstrich im Durchschnittspunktefeld entfallen. Der synthetische Vergleich besitzt den unabhängig erwarteten Durchschnitt 2,83. Keine personenbezogenen Referenzdateien oder tatsächlichen Schülernamen werden eingecheckt.

Die geprüften kurzen Einzelberichte bleiben in Word und PDF jeweils einseitig. Der Schlüssel mit 25,5 Punkten umfasst bei ganzen Schritten eine Seite, bei halben zwei und bei Zehntelschritten sechs PDF- beziehungsweise sieben LibreOffice-Word-Seiten. Echte vertikale Fortsetzung mit wiederholten Köpfen; keine künstliche Einseitigkeit. Repräsentative Leistungsseiten und erste/letzte Schlüsselseiten werden visuell geprüft.

Die drei vollständigen TXT-/Word-/PDF-ZIPs behalten identische kollisionsfreie Verzeichnisse, vollständige Inhalte und die produktive native ZIP-/Dateischreibprüfung. Punkte ausschließlich in einzelnen Leistungsdateien; gemeinsame Fach-/Klassenübersichten behalten ihre Notenspalten. Schülerberichte behalten die standardmäßig ausgeschaltete Punkteoption. Keine zweite Exportverwaltung.

## Abschließende Freigabeschranke und Grenzen

Vor Auslieferung ist ein vollständiger frischer Lauf von python3 dev/manage.py release erforderlich: alle 81 Gruppen, zwei saubere bytegleiche Windows-Builds, ZIP-Integrität, vollständiger Entpackvergleich und Startprüfung des entpackten Programms über die vorhandene lokale Infrastruktur. Insgesamt 88 ausgeführte Freigabeschritte ohne Wiederverwendung. Anschließend muss status aktuelle Quellen, Werkzeuge, Programmdateien, Release-Nachweis und übereinstimmenden Index bestätigen. Der abschließende Release-Commit dokumentiert die tatsächliche Laufkennung, Ergebnisse, Dauer, Baum- und Archivprüfsummen. Ein fehlgeschlagener oder veralteter Nachweis sperrt die Auslieferung.

Nicht durchgeführt: tatsächlicher Windows-GUI-/UIA-Start, reale Windows-Skalierung, Microsoft Word unter Windows, NVDA-Sprache/Braille und physischer Druck. Linux-/Chromium-, DOM-/axe-, LibreOffice- und PDF/UA-Prüfungen ersetzen diese Liveabnahme nicht. Die Downloads sind ein vollständig lokal geprüfter Entwicklungsstand, keine behauptete Windows-/NVDA-Livefreigabe.
