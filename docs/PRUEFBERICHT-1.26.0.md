# Notenblick 1.26.0 – Testbericht

Stand: 6. November 2026. Entwicklungsbranch `entwicklung/1.26.0`. Kein offizielles Release, Tag, Merge nach `main` oder öffentlich freigegebenes Update.

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

## Vollständiger technischer Testkatalog

Der bestehende Ablauf `python3 dev/manage.py release` wurde verwendet und nach Korrekturen mit `--retry` fortgesetzt. Testverwaltung und Nachweisprüfung wurden nicht ersetzt.

**93 von 93 Pflichtgruppen erfolgreich.** Vollständiger erfolgreicher Lauf: `reports/20261106T132051469707Z/summary.json`. In diesem Lauf wurden 88 Gruppen ausgeführt und fünf gültige Ergebnisse wiederverwendet. Die anschließende Statusprüfung bestätigte aktuellen Quellstand, Werkzeuge, Programmausgabe, unveränderten Arbeitsbaum und gültige vollständige Nachweise.

Abgedeckt sind Gewichtungen und beide Umrechnungsrichtungen, unveränderte und veränderte Durchschnitte, Zuordnung und Übernahme, Assistent und Vorgaben, Hilfe/F1, Tastatur, Fokus, ARIA, Ansichten, Speicherung, Sicherungen, Wiederherstellung, Altdaten, sämtliche Exportformate und automatische TXT-Notenlisten. Zusätzlich geprüft wurden 25 gleichmäßige Verteilungen sowie Umrechnungen mit 3, 5, 8 und 20 Bereichen.

Der große synthetische Bestand umfasst 3.000 Schüler, 6.000 Leistungen, 180.000 Noteneinträge und 9.200 TXT-Dateien. Seine 100 weiterhin gültigen mathematischen Teilnachweise mit 3.000 Referenzberechnungen wurden wiederverwendet. Erfolgreiche unveränderte Prüfungen wurden bei Wiederaufnahme nicht pauschal erneut ausgeführt.

Zwei unabhängige saubere Builds waren bytegleich. Das vollständige Windows-Paket enthielt 92 Dateien: `Notenblick.exe` und 91 Dateien im vollständigen Ordner `Programm`, einschließlich der bisherigen architekturabhängigen Bibliotheken. CRC, Prüfsummen, bytegleiche Entpackung und Start der entpackten Web-Oberfläche bestanden im vollständigen Lauf.

SHA-256 des dabei geprüften Programmpakets: `20b578857d097aa75f5928709d2d31c95423b6c2303e1f7cc995cb2dd5192948` (2.111.858 Bytes). Diese Angabe dokumentiert den damaligen erfolgreichen Lauf und stellt keinen aktuell verfügbaren Download dar.

## Ausfall beim Abschluss der Auslieferung

Nach Ergänzung der Abschlussdokumentation sollten die unveränderten erfolgreichen Prüfungen wiederverwendet und die Archive abschließend neu erstellt werden. Dabei wurden unvollständige Dateien in der Arbeitsumgebung erkannt. Die Auslieferungsprüfung hat sie korrekt abgelehnt. Wiederaufnahmen: `reports/20261106T134228845262Z` und `reports/20261106T134516699696Z`.

Während eines weiteren Wiederholungsversuchs fiel die Ausführungsumgebung vollständig aus; zuletzt war selbst `package.json` nicht mehr erreichbar. Der Ausführungsdienst meldete anschließend „No usable execution environment is available“. Eine abschließende aktuelle Paketprüfung und das Speichern des neuen Download-ZIPs konnten deshalb nicht abgeschlossen werden.

Die letzten beiden geprüften Dateien wurden aus dem gesicherten Entwicklungsstand exakt rekonstruiert und anhand ihrer Git-Blob-Kennungen mit dem bereits vollständig getesteten lokalen Stand abgeglichen:

- `src/styles/responsive.css`: `90e07a139a3e2749685e1be2877a3c43709acdaa`
- `tests/v190-browser.cjs`: `4f16222c1021a39553e5dabf98725fbd3b62e5dd`

Der Programmstand und dieser Bericht sind im Entwicklungsbranch gesichert. **Die angeforderte abschließende ZIP-Auslieferung ist noch offen. Ein älteres oder unvollständiges Archiv wird nicht als fertige neue Testversion angeboten.** Die lokalen ausführlichen Einzelbelege konnten nach dem Umgebungsausfall nicht zusätzlich exportiert werden.

## Aktualisierung und praktische Abnahme

Der direkte Updateweg 1.25.1 → 1.26.0 bleibt erhalten. Der native Updater ersetzt ausschließlich `Notenblick.exe` und den vollständigen Ordner `Programm`; `Daten` bleibt unangetastet. Die Testausgabe ist nicht öffentlich freigegeben (`approved: false`).

Tatsächlich ausgeführt wurden automatisierte Linux-, .NET-8-, Chromium-, LibreOffice-, Open-XML- und PDF/UA-Prüfungen. Echte Windows-/WebView2-/UIA-/NVDA-/Braille-/ARM64-Tests, Microsoft Office, physischer Druck und die vollständige Windows-Updateinstallation stehen noch aus. CSS-Zoom und simulierte Tastaturbedienung ersetzen diese praktische Abnahme nicht.

Eine offizielle Veröffentlichung erfolgt erst nach Windows-Praxistest und ausdrücklicher Freigabe durch Sebastian Müller.
