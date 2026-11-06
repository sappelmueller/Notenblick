# Notenblick 1.26.0 – Prüfung und Veröffentlichung

**Offiziell veröffentlicht am 6. November 2026.** Sebastian Müller hat die fertig entwickelte Ausgabe unter Windows praktisch getestet und ausdrücklich freigegeben. Freigegebener Entwicklungscommit: `9164005e538f5d64109bf53109435e8a8ab4b751`. Seit der Praxisprüfung wurde der Programmstand nicht verändert. Der vollständige Entwicklungsstand ist in `main` enthalten; das stabile Release trägt `v1.26.0`.

Die folgenden technischen Ergebnisse stammen aus der abgeschlossenen Entwicklung. Zur Veröffentlichung wurden keine Funktionsprüfungen und keine Programmbuilds wiederholt. Der unveränderte [kompakte Nachweis](qa-1.26.0.json) bewahrt den damaligen Testversionsstatus und ist kein aktueller Veröffentlichungsstatus.

## Umgesetzter Feinschliff

- Der Einrichtungsassistent verwendet denselben Gewichtungseditor wie Einstellungen und Fachdialog. Die veraltete Annahme über Hausaufgaben und Heftführung ist entfernt. Beide vollständigen Einrichtungsabläufe wurden mit geänderten Vorgaben geprüft; Zusammenfassung und gespeicherte Werte stimmen überein.
- Automatische Verteilungen und Umrechnungen speichern höchstens zwei Nachkommastellen und ergeben exakt 100 %. Drei gleiche Anteile werden 33,34 %, 33,33 % und 33,33 %. Bewusst gespeicherte vierstellige Gewichtungen bleiben bei unverändertem Öffnen erhalten. Die zentrale exakte Notenberechnung bleibt bestehen.
- Ohne Bewertungen beziehungsweise ohne veränderte Schülerdurchschnitte entfällt die zusätzliche Bestätigung. Bei tatsächlichen Änderungen erscheint „Neue Gewichtung prüfen“ mit Anzahl und Übernahmebestätigung direkt bei der Vorschau.
- Der gemeinsame Editor zeigt kompakte Zeilen. Zusammengefasste Berechnung besitzt weiterhin zwei getrennte Abschnitte, jeweils mit Summe und „Gleichmäßig verteilen“. Verwaltungsfunktionen bleiben unter „Bereich bearbeiten“. Fehlende Anteile werden handlungsorientiert erklärt.
- „Durchschnitte vergleichen“ zeigt zunächst eine kurze Zusammenfassung. „Unterschiede anzeigen“ bleibt auf Wunsch eingeklappt; zunächst erscheinen nur geänderte Schüler und Zeiträume. „Alle Schüler anzeigen“ erweitert die Tabelle. Spalten: Schüler, Zeitraum, Bisher, Neu. Bei unveränderten Durchschnitten erscheint keine unnötige Tabelle. Übernahme aus anderen Fächern und erforderliche Bestätigung sind eingebunden.
- Sichtbare H3 „Durchschnitte und Zeugnisnoten“ in der Notenübersicht. Tabellen werden über ihre sichtbaren Überschriften benannt; die Schüleransicht verbindet Inhalts- und Bereichsüberschrift.
- Hilfe gezielt abgeglichen. Alle neun Themen, 77 Abschnittskennungen, Listen, Tabellen und 49 Basiskontexte bleiben erhalten. F1 erklärt den aktuellen Einrichtungsschritt oder die Gewichtung; ungespeicherte Eingaben und Fokus bleiben erhalten.
- Beim vollständigen Browserlauf wurde ein echter Umbruchfehler bei schmalen Fenstern und 200-%-CSS-Zoom gefunden und in der zentralen responsiven Gestaltung behoben. Die Korrektur bestand die gezielte Prüfung und anschließend den vollständigen Katalog.
- Veraltete Oberflächenerwartungen in vorhandenen Tests wurden an die beauftragten Bezeichnungen und Bedienabläufe angepasst. Berechnungs-, Speicher- und Exportprüfungen wurden nicht umgangen.

Speicherformate, native Aktualisierung, festgelegte Abschlussnoten und Exportvorlagen wurden durch diesen Feinschliff nicht geändert. Fehlende Noten bleiben fehlende Noten und zählen niemals als 0.

Die Paketerstellung schreibt Archive und Prüfsummen zunächst vollständig in eine temporäre Datei. ZIP-Dateien werden vor dem atomaren Ersetzen auf CRC geprüft; eine Unterbrechung erhält die vorherige Ausgabe. Ein kleiner Infrastrukturtest prüft Abbruch, vollständige Veröffentlichung und Bereinigung.

## Vollständiger technischer Testkatalog

**93 von 93 Pflichtgruppen erfolgreich.** Nach Wiederherstellung der Arbeitsumgebung wurde der bestehende vollständige Ablauf `python3 dev/manage.py release` erfolgreich abgeschlossen: `reports/20261106T141037391510Z/summary.json`.

In diesem Lauf wurden 93 Gruppen ausgeführt und 0 gültige Nachweise wiederverwendet. Die zuvor verlorenen lokalen Belege wurden nicht als vorhandene Wiederverwendungsnachweise ausgegeben. Bei Fehlern oder Unterbrechungen setzt `--retry` den vorhandenen Plan fort; die Testverwaltung wurde nicht ersetzt oder umgangen.

Abgedeckt sind Gewichtungen, beide Umrechnungsrichtungen, Zuordnung und Übernahme, leere und vorhandene Notenbestände, veränderte und unveränderte Schülerdurchschnitte, Assistent, Standardvorgaben, Hilfe/F1, Tastatur, Fokus, ARIA, Ansichten, Speicherung, Sicherungen, Wiederherstellung und Altdaten. Alle Exportformate sowie automatische TXT-Notenlisten wurden geprüft. Gezielt enthalten sind 25 gleichmäßige Verteilungen und Umrechnungen mit 3, 5, 8 und 20 Bereichen.

Der große synthetische Bestand umfasst 3.000 Schüler, 6.000 Leistungen, 180.000 Noteneinträge und 9.200 TXT-Dateien sowie 3.000 referenzierte Schülerberechnungen. Die tatsächliche Wiederverwendung mathematischer Teilnachweise steht im kompakten [Prüfumfang](qa-1.26.0.json).

Zwei unabhängige saubere Builds waren bytegleich. Das vollständige Windows-Paket enthält 92 Dateien: `Notenblick.exe` und 91 Dateien im vollständigen Ordner `Programm`, einschließlich der bisherigen x64-/ARM64-Bibliotheken. CRC, Prüfsummen, bytegleiche Entpackung und Start der entpackten Web-Oberfläche bestanden. Keine persönlichen Schülerdaten sind enthalten.

SHA-256 des Programmpakets: `20b578857d097aa75f5928709d2d31c95423b6c2303e1f7cc995cb2dd5192948` (2,111,858 Bytes).

Der vollständige Bericht und die Einzelbeleg-Hashes sind im kompakten Nachweis dokumentiert. In dieser frisch geklonten Arbeitskopie liegen die damaligen lokalen Vollprotokolle und Ausgabekopien nicht vor; eine erneute Validierung dieser lokalen Belege oder ein neuer Release-Prüflauf wird nicht behauptet. Das vorhandene Windows-ZIP stimmt mit der oben dokumentierten Prüfsumme und Größe überein. Das Quellcode-ZIP enthält den endgültigen Git-Baum einschließlich der Freigabedokumentation.

## Aktualisierung und praktische Abnahme

Der direkte Updateweg **1.25.1 → 1.26.0** benötigt keine Zwischenversion. Der separate Aktualisierungsdeskriptor ist versionsgebunden auf `approved: true` freigegeben; `minimumUpdater: 1.24.0` und `dataSchema: 1` bleiben erhalten. Er enthält Größe und SHA-256 des unveränderten Archivs sowie alle 92 Datei-Einzelhashes. Der native Updater und seine sichere Austausch-/Wiederherstellungslogik bleiben unverändert: ausschließlich `Notenblick.exe` und den vollständigen Ordner `Programm` ersetzen, **Daten unangetastet lassen**.

Die allgemeine Windows-Praxisabnahme ist durch den Herausgeber bestätigt. Einzelne NVDA-/Braille-/UIA-/ARM64-, Microsoft-Office-, Druck-, Unterbrechungs- und Wiederherstellungsfälle wurden im Veröffentlichungsauftrag nicht gesondert bestätigt und werden nicht als neu geprüft geführt. Die automatisierten Linux-, .NET-8-, Chromium-, LibreOffice-, Open-XML- und PDF/UA-Ergebnisse bleiben die ursprünglichen Entwicklungsnachweise.

## Schlanke Veröffentlichungskontrolle

- Programmquellen, Test-/Buildwerkzeuge, Abhängigkeiten, Version und Datenstruktur gegenüber dem freigegebenen Entwicklungscommit unverändert.
- Windows-ZIP bytegleich mit dem dokumentierten Prüfartefakt; CRC, vollständige Dateiliste, EXE-Version, enthaltene Quellen, Bibliotheken und Lizenzdateien kontrolliert. Kein Ordner Daten und keine persönlichen Schülerdaten enthalten.
- Dokumentation aktualisiert; Quellcodearchiv aus dem endgültigen Git-Baum erzeugt. Externe Aktualisierungsdatei und Prüfsummen ergänzt, ohne das Windows-ZIP neu zu packen.
- Pull Request nach main, Tag v1.26.0 und stabiles öffentliches Release mit Windows-ZIP, vollständigem Quellcode, Aktualisierungsdatei und Prüfsummen. Veröffentlichte Downloads werden byteweise abgeglichen; erst danach wird entwicklung/1.26.0 gelöscht.

Keine offenen Fehler im abgeschlossenen automatisierten Katalog. Die damaligen [Testhinweise](TESTVERSION-1.26.0.md) bleiben ausdrücklich als historischer Plan erhalten.
