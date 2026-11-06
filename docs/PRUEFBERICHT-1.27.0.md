# Qualitätsaudit und Veröffentlichung 1.27.0

Basis: offizielles `main`/`2de1783e9d2a7d1b20ec01ddf2245986a839987e` (1.26.0). Geprüfter Entwicklungscommit: `345c293ff09f5695038beb06187bfd98ab501188`. Nach praktischer Prüfung durch Sebastian Müller am 6. November 2026 ausdrücklich freigegeben: Windows x64 und ARM64 einschließlich NVDA, Braille und Aktualisierung. Offizielles Release `v1.27.0`; direkter Updateweg aus 1.26.0.

## Konkrete Korrekturen

- Wiederherstellen: Die geprüften Schutzsicherungen `Vor_Leistungsbereichen_` werden jetzt zusätzlich angeboten und mit „vor Änderung der Leistungsbereiche“ bezeichnet. Auswahl und Abbruch verändern keine Noten. Tatsächlicher nativer Dateitest in `v1260-storage`.
- Gemeinsamer Gewichtungseditor: Derselbe Sichtbarkeitsfilter bestimmt Anzeige und gleichmäßige Verteilung. Ein belegter Altbereich mit gespeichertem Ausblendmerkmal wurde bisher angezeigt, beim Verteilen aber ausgelassen. Weiterhin nur Entwurf; vorhandene Bestätigung geänderter Durchschnitte bleibt erhalten.
- Nach dem Übertragen von Leistungen steht der Fokus im Anteil des Zielbereichs. Leere oder doppelte Bereichsnamen bleiben am fehlerhaften Feld korrigierbar, statt beim Speichern das erste Namensfeld zu fokussieren. Neue Einzelnoten ohne erforderliche Note markieren und fokussieren das Notenfeld; ein unpassender Status fokussiert das Statusfeld.
- Startseite: Fachzugriffe verwenden die natürliche Breite des gemeinsamen Bausteins; ausgeschriebene Fachnamen werden nicht in unnötig schmale Rasterspalten gezwängt. Abstände vor Exportaktionen und dem Hinzufügen eines Bereichs ergänzt. Der Null-Prozent-Hinweis erhält denselben Innenabstand wie die Tabelle. Die Halbjahresauswahl verwendet die einzeilige native Darstellung; bei schmalen Fenstern wird keine zweite Textzeile mehr unten abgeschnitten.
- Exportfehler nennen einen konkreten nächsten Schritt bei unerreichbarem oder nicht beschreibbarem Ordner. Der TXT-Fehlerhinweis spricht von gespeicherten Noten und Textlisten. Die neun Hilfethemen, 77 Abschnitte und F1-Zuordnungen bleiben erhalten; keine geänderten Bedienbegriffe oder neuen Schritte.
- Version 1.27.0 auch als aktuelle Datendatei anerkannt. Die Prüfung auf zukünftige Versionen bezieht ihre Obergrenze aus derselben Versionsliste, statt eine zweite feste Versionsnummer zu pflegen. Dateiformat und Schema bleiben 1.

## Auditumfang

| Bereich | Kontrolle und Nachweis |
| --- | --- |
| Berechnung, Gewichtung, Rundung, Abschlussnoten | Zentrale Bruchrechnung und Validatoren gelesen; bestehende unabhängige Referenzen, Notenlücken, Nullgewichte, Punkte und unveränderliche Festlegungen im Katalog |
| Noten, Leistungen, Schüler, Verwaltung | Beide Notenlayouts, Listen/Matrix, Einzel-/Klassenbewertungen, Bearbeiten, Teilnahme, Import, Klassen-/Fachübernahme und Archivzustände |
| Speicherung, Altdaten, Sicherungen | Native Dateifunktionen, atomare Ablage, Konfliktschutz, Versionserkennung, Wiederherstellung und Schutzsicherungen; ausschließlich synthetische Daten |
| Exporte und Notfalllisten | Unverändertes Berichtsmodell und TXT-Struktur; tatsächliche PDF-/Word-/Excel-/CSV-/TXT-Dateien, Open XML, PDF/UA, LibreOffice und Druckregressionen im vollständigen Katalog |
| Updater und Auslieferung | Unveränderte native Transaktion und Rückfalllogik geprüft; ausschließlich EXE/Programm als Ziele, Daten ausgeschlossen; AnyCPU und x86/x64/ARM64-Bibliotheken sowie Integritätsliste |
| Gestaltung und Sprache | Gerenderte Hauptbereiche, Dialoge, Menüs, Register, Formulare, Tabellen, leere Ansichten, Fehler, Schreibschutz, Hinweise, Vorlagen, Vergleich, Altbestände und alle Hilfethemen |
| Barrierefreiheit | Browser-Tastatur, Fokus, Tabaktivierung, Escape, F1, Beschriftungen, ARIA-Ziele, Chromium-AX und axe; bestehende Fokusregeln und Kurzbefehle beibehalten |

`v1230-browser` deckt die vorhandenen 49 F1-Kontexte zusätzlich mit langen Namen, 42 Schülern, 196 Fenster-/Zoomfällen, leeren Hauptbereichen, Menükollisionen und erzwungenen Kontrastfarben ab. `v1260-browser` prüft freie Bereiche, neue ARIA-Tabs und gemeinsame Gewichtung. `v1270-browser` ergänzt vollständige Bildschirmaufnahmen dieser 49 Kontexte, 19 zusätzliche Dialog-/Sonderzustände und alle fünf Einrichtungsschritte. Geprüft werden auch 20 lange Leistungsbereichsnamen und 42 Schüler bei 1280, 1024, 640 und 320 Pixel sowie 150, 200 und 400 Prozent CSS-Zoom.

Die Aufnahmen unter `tests/visual/v1270` werden tatsächlich visuell betrachtet, zunächst als Übersicht und bei Auffälligkeiten einzeln. Dazu kommen Layoutmessung, axe und echte Chromium-Tastaturereignisse. Screenshots und vollständige Logs bleiben außerhalb von Git. Die Hilfe wurde inhaltlich gegen vorhandene Bedienabläufe geprüft und gerendert; keine pauschale Umschreibung bereits verständlicher Texte.

## Automatischer Abschluss

**Abgeschlossen: 95 von 95 Pflichtgruppen erfolgreich**, einschließlich 180.000 synthetischer Noteneinträge, zwei sauberer bytegleicher Builds sowie vollständiger Paket-/Entpackprüfung. Zusätzlicher gerenderter Audit: 155 Aufnahmen und 98 axe-Prüfungen. [Kompakte Nachweise](qa-1.27.0.json). Die anschließend vom Herausgeber bestätigte Windows-Abnahme ist unten getrennt dokumentiert.

Der abgeschlossene Lauf `TZ=UTC python3 dev/manage.py release` umfasst: der vollständige Katalog mit 95 Gruppen, dem vorhandenen 180.000-Ergebnisse-Test, zwei sauberen bytegleichen Builds, vollständigen Archiv-/Hash-/Entpackprüfungen und Startprüfung der entpackten Oberfläche. Vorherige gültige Einzelbelege werden übernommen. Fehler werden innerhalb desselben Plans mit `release --retry` fortgesetzt; keine zusätzliche große Lastprüfung außerhalb des vorhandenen Katalogs.

Endstatus und kompakte Prüfdaten sind in `qa-1.27.0.json` festgehalten. Dieser Nachweis bleibt als historischer Stand vor der praktischen Freigabe unverändert. Eine Anzahl erfolgreicher Diagnoseläufe allein ist kein vollständiger Abschlussnachweis. Vollständige lokale Berichte besitzen Quellen-, Werkzeug-, Ausgaben- und Einzelbelegbindungen; `manage.py status` muss sie bestätigen. Der reine Veröffentlichungsabschluss übernimmt diese Entwicklungsnachweise und ergänzt die ausdrückliche Praxisfreigabe. Nur das Quellcode-ZIP wird aus dem endgültigen Git-Baum neu verpackt.

## Prüfgrenzen und Praxisabnahme

Automatisiert wird unter Linux/.NET und Chromium geprüft. Der ausführende Entwicklungsagent hat keine reale Windows-, NVDA-, Braille-, UIA-, ARM64- oder Microsoft-Office-Praxisprüfung durchgeführt. Die spätere Praxisprüfung durch Sebastian Müller umfasst Windows x64 und ARM64, NVDA, Braille und Aktualisierung. CSS-Zoom ist keine echte Windows-Anzeigeskalierung. Native Speicher- und Updatertests unter .NET auf Linux sind keine vollständige Windows-Updateinstallation oder Windows-Rückfallprüfung. Der Starter wird als Windows-Programm gebaut und auf seine Architektur und Dateivollständigkeit geprüft; der wirkliche Windows-Start ist durch die Herausgeberprüfung bestätigt.

## Freigabe und Veröffentlichung am 6. November 2026

Sebastian Müller bestätigt die erfolgreiche praktische Prüfung unter Windows x64 und ARM64 einschließlich NVDA, Braille und Aktualisierung. Die konkrete Version ist ausdrücklich zur offiziellen Veröffentlichung freigegeben. [Abgeschlossener Praxisprüfplan](TESTVERSION-1.27.0.md).

Keine Programmänderungen, erneuten Programmtests oder Builds beim Release. Der freigegebene Programmstand wird vollständig nach `main` übernommen; nur Dokumentation und externe Veröffentlichungsmetadaten ändern sich. Historische Prüfnachweise bleiben erhalten.

Das geprüfte Windows-ZIP bleibt bytegleich: **2.112.066 Bytes**, SHA-256 `9233425f6fdcc39eeab3d00d90426373f46d691c46f447d21ff93dae08714810`. Die vollständige Dateiliste und sämtliche Einzelhashes stimmen mit dem geprüften Deskriptor überein. Der externe Deskriptor erhält `approved: true`, `minimumUpdater: 1.24.0` und unverändert `dataSchema: 1`; damit ist der direkte Wechsel von 1.26.0 möglich. Der unveränderte Installer ersetzt ausschließlich `Notenblick.exe` und den vollständigen Ordner `Programm`. `Daten` bleibt unangetastet.

Stabiles Release mit Tag `v1.27.0`, Windows-ZIP, vollständigem Quellcode, Prüfsummen und freigegebenem Deskriptor. Öffentliche Downloads und endgültigen Git-Baum abgleichen; erst danach den vollständig übernommenen Entwicklungsbranch löschen. Kein neuer automatischer Gesamtprüflauf wird behauptet.
