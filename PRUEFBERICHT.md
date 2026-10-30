# Aktueller Stand 1.21.0

Der Funktions- und Prüfumfang steht in [docs/PRUEFBERICHT-1.21.0.md](docs/PRUEFBERICHT-1.21.0.md). Der abschließende Git-Commit dokumentiert den frischen Release-Lauf und die Archivprüfsummen. Historische Nachweise bleiben erhalten.

# Aktueller Stand 1.20.3

Der aktuelle Funktions- und Prüfnachweis steht in [docs/PRUEFBERICHT-1.20.3.md](docs/PRUEFBERICHT-1.20.3.md). Historische Nachweise bleiben nachfolgend erhalten.

# Aktueller Stand 1.20.2

Der aktuelle Funktions- und Prüfnachweis steht in [docs/PRUEFBERICHT-1.20.2.md](docs/PRUEFBERICHT-1.20.2.md). Historische Nachweise bleiben nachfolgend erhalten.

# Aktueller Stand 1.20.0

Der aktuelle Funktions- und Prüfnachweis steht in [docs/PRUEFBERICHT-1.20.0.md](docs/PRUEFBERICHT-1.20.0.md). Historische Nachweise bleiben nachfolgend erhalten.

Aktueller versionsbezogener Bericht: [Notenblick 1.19.0](docs/PRUEFBERICHT-1.19.0.md). Die folgenden früheren Nachweise bleiben erhalten.

# Prüfbericht – Notenblick 1.9.0

Stand: 24. Oktober 2026. Grundlage ausschließlich `sappelmueller/Notenblick`, `main`, Commit `c42c7390540d6b6a56756dd221abae9f292b3791`, Quellbaum `eb187f9ff4b526387575b743dcfe8a284fbe30c2`. Alle 147 Quelldateien wurden beim Abruf anhand ihrer Git-Blob-Prüfsummen bestätigt. Wiederverwendete lokale Bibliotheken waren bytegleich. Der ursprüngliche 1.8.0-Prüfbericht bleibt unter `docs/PRUEFBERICHT-1.8.0.md` erhalten.

## Automatisierte Prüfungen

Der Ausgangsstand bestand zunächst die schnelle Standardprüfung. Die vorhandenen lokalen Werkzeuge und gesperrten Abhängigkeiten wurden wiederverwendet. Der verbindliche Abschlusslauf ist `python3 dev/manage.py release`: alle Testgruppen, sauberer Wiederholungsbuild mit bytegleichen Programmdateien, erneute Laderprüfung, ZIP-Integrität und Start der frisch entpackten Ausgabe im Testhost. Kleine versionsbezogene Nachweise stehen unter `docs/qa-1.9.0.json`; vollständige Laufprotokolle werden unter `reports` erzeugt.

| Bereich | Geprüfter Umfang |
| --- | --- |
| Entwicklungsschutz | 14 Infrastrukturregressionen; festes Zielrepository, private Dateipfade, keine Actions-Dateien, Testfehler stoppen den Ablauf |
| Berechnung/Validierung/Speicherung | 16.160 bestehende Prüfgruppen |
| Übernahmen, bisherige Oberfläche und Bedienung | 13 + 44 + 13 Abläufe |
| Ansichten 1.4/1.5 | 14 + 15 Prüfgruppen, einschließlich 32 Teilmengen sichtbarer Leistungsarten |
| Direkte Gewichtung 1.6 | 16 Prüfgruppen, 992 exakte unabhängige Referenzfälle |
| Gewichtung 1.7 | 13 Prüfgruppen, 441 exakte Referenzfälle sowie bestehende inverse Umrechnungsprüfungen |
| Mündliche Funktionen 1.8 | 18 Prüfgruppen, einschließlich Sicherungsschutz, Speichern und nächste, Bearbeiten, Löschen und Rückweg |
| Neue Oberfläche 1.9 | 11 Prüfgruppen; sechs Spalten, beide Gliederungen, Suche, kombinierter Filter, unabhängige Zustände, Doppelspeicherschutz, Gruppenrunde, historische Fortsetzung |
| Produktiver C#-Speicherkern | 5 + 5 + 6 + 6 + 7 + 5 + 19 Integrationsgruppen; neue 1.9-Tests mit ursprünglichen 1.8-Dateien und 250 Einzelnoten/60 Schülern |
| Großer Datenbestand | 10 Schuljahre, 3.000 Schüler, 6.000 Bewertungen, 180.000 Noteneinträge; atomare Speicherung, Export, Wiederherstellung |
| Produktiver Assembly-Lader | 17 Prüfungen; vollständige Dateiliste und Bibliotheksintegrität |
| Chromium | 91 + 30 + 38 + 30 Prüfschritte; 63 + 22 + 29 + 23 axe-Zustände ohne erkannte Verstöße |
| JavaScript-Syntax | 77 Quell- und Testdateien separat mit Node geprüft |

Diese Zahlen beschreiben unterschiedliche Prüfgranularitäten und werden nicht künstlich addiert. Anpassungen alter Tests betreffen die beauftragten Beschriftungen, die Bezeichnungsspalte, den nach Sicherung verschobenen Zugang und die aktuelle Ausgabeversion. Ein alter Nichtteilnahmetest prüft jetzt die konkrete Datensatzaktion statt eines zufälligen Titelvorkommens im allgemeinen Schaltertext. Mathematische Referenzwerte und Speicheranforderungen wurden nicht gelockert.

Die einmalige Einrichtungssperre für sämtliche Anwendungsdateien wurde für den autorisierten Entwicklungsauftrag gezielt ersetzt: Die ursprünglichen SHA-256-Werte bleiben erhalten. Berechnungs-, Bewertungs-, Gewichtungs-, Übernahme-, Export- und mündliche Datenmodule sowie nativer Speicher, Migration und Fensterhost müssen weiterhin bytegleich zu 1.8.0 sein. Nur Version, Oberfläche und Ansichtszustände wurden angepasst.

## Wesentliche Nachweise und Korrekturen

- Start besitzt genau drei benannte Regionen und maximal fünf echte offene Klassen-/Gruppenleistungen. Statusangaben und individuelle mündliche Noten erzeugen keine falschen Aufgaben. Historische Fortsetzungsfächer tragen ihr eigenes Schuljahr; aktuelle offene Einträge übernehmen keine historische Jahresbeschriftung.
- Jeweils eine passende Hauptaktion; Ansicht anpassen ist zunächst geschlossen. Enter/Leertaste, Escape und Fokusrückgabe werden im Chromium tatsächlich automatisiert bedient. Einzelnotensuche bleibt sichtbar und kombiniert Namen/Bezeichnung mit dem Schülerfilter.
- Mündliche Darstellung und beide Klassensuchen beeinflussen andere Leistungsarten nicht. Alle Zustände stehen ausschließlich in Ansicht.json. Beschädigte alte Suchwerte werden sicher verworfen.
- 40, 100 und 250 Einzelnoten bleiben im Browser vollständig verfügbar. 250 Einträge mit 60 Schülern werden außerdem über alle fünf Seiten auf Eindeutigkeit geprüft. Gleicher Schüler, gleiches Datum und gleiche Bezeichnung behalten getrennte Kennungen. Lange Bezeichnungen und vollständige mehrzeilige Bemerkungen bleiben zugänglich.
- Ein bekannter Schüler führt direkt zur Note, ein allgemeiner Aufruf zur Schülerauswahl. Gleichzeitiges Speichern erzeugt nur einen Datensatz. Bereits gespeicherte Bezeichnung, Teilnahme, Faktor und GFS bleiben erhalten. Eine alte Eingabesuche verdeckt die neue Bewertungsrunde nicht.
- Bearbeiten erhält Tabellenfokus und Fensterposition. Schüleransicht und Eingabe schließen besitzen den vorhandenen Rückweg. Ein bei 320 Pixeln reproduzierter Überlauf im neuen Bedienraster wurde korrigiert und erneut geprüft.
- Ein originaler 1.8.0-Datenstand bleibt beim Öffnen, Filtern, Sortieren und Navigieren bytegleich. Neue Noten schreiben 1.9.0; vorhandene historische Datensätze bleiben unverändert. Vollständige Sicherung und Wiederherstellung einschließlich TXT-Ausgabe sind mit dem produktiven C#-Speicherkern geprüft.
- Altbestände werden nicht automatisch umklassifiziert. Gezielte Klärung steht unter Sicherung bereit; eine erfolglose vollständige Schutzsicherung blockiert die Übernahme.

## Darstellung und Prüfgrenzen

Chromium 156.0.8078.47 unter Linux. Geprüft wurden unter anderem 1440, 1024, 800, 640 und 320 CSS-Pixel Fensterbreite, geringe Fensterhöhe, Pixelratio 2, bestehende DPI-Emulation und CSS-Browserzoom 200 Prozent. Die erzeugten Ansichten von Start und mündlicher Verwaltung wurden zusätzlich visuell gesichtet. Sämtliche Testdaten sind synthetisch.

Nicht ausgeführt: tatsächlicher Windows-Programmstart, Windows-Sicherheitszonen/SmartScreen, WebView2/UI Automation unter Windows, reale Windows-Skalierung, gesprochene NVDA-Ausgaben und Windows ARM64. Browser-/ARIA-Prüfungen ersetzen keine NVDA-Freigabe und belegen keine Freiheit von gesprochenen Doppelansagen. Der ergänzte manuelle Prüfplan steht unter `docs/WINDOWS-PRUEFUNG.md`.

Die Ausgabe ist deshalb ein unter Linux und Chromium geprüfter Windows-Build-Kandidat 1.9.0. Er benötigt weiterhin .NET Framework 4.8 und eine installierte WebView2-Laufzeit. Kein Codesignierungszertifikat ist vorhanden; Windows-Schutzmechanismen werden nicht umgangen.

GitHub Actions bleiben deaktiviert. Keine Runner, Workflows oder kostenpflichtigen CI-Dienste wurden benutzt. Keine echten Schülerdaten, privaten Sicherungen oder Zugangsdaten werden ins Repository oder die Archive übernommen. Beim Update ausschließlich Notenblick.exe und den vollständigen Ordner Programm ersetzen; Daten bleibt unangetastet.
