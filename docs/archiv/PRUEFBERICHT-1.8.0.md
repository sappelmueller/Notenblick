# Prüfbericht – Notenblick 1.8.0

Stand: 24. Oktober 2026. Grundlage ist das separat entpackte finale Quellcodearchiv 1.7.0, SHA-256 `f7adf07a57cd9dac06ff504ed15ef4a6682988172f8b7f5955da2b7cd624a80e`. Bestehende Module, Speichermechanismen und rationale Berechnungen wurden fortgeführt.

## Tatsächlich ausgeführte automatisierte Prüfungen

| Bereich | Ergebnis |
| --- | --- |
| Berechnung, Validierung, Speicherung | 16.160 Prüfungen bestanden |
| Übernahmen, Herkunft und Versetzungen | 13 bestanden |
| Bisherige Oberfläche | 44 Abläufe bestanden |
| Bestehende Bedienfunktionen | 13 Abläufe bestanden |
| Darstellung 1.4 | 14 Prüfgruppen; alle 32 Kombinationen von Namen, Sortierung, Gliederung und Auswahl |
| Leistungsverwaltung 1.5 | 15 Prüfgruppen; alle 32 Teilmengen sichtbarer Arten und 1.003 Leistungen |
| Funktionen 1.6 | 16 Prüfgruppen; 992 direkte Gewichtungskombinationen gegen unabhängige rationale Referenz |
| Gewichtungen 1.7 | 13 Prüfgruppen; 441 exakte und 5.151 inverse Umrechnungsfälle, vollständiger Vergleich mit 1.006 Schülern |
| Neue Funktionen 1.8 | 18 Prüfgruppen bestanden; 40, 100 und 250 Einzelnoten sowie mehr als 120 Noten im vollständigen Bedienablauf |
| Bestehende Speicherung/Ansichten/Updates | 5 + 5 + 6 + 6 + 19 Integrationsabläufe bestanden |
| Update 1.7 auf 1.8 und neue Erfassungsart | 7 Integrationsprüfgruppen bestanden |
| Produktionsloader und vollständige Dateiprüfung | 17 Prüfungen bestanden |
| Großer Datenbestand | 10 Prüfgruppen: 10 Schuljahre, 3.000 Schüler, 6.000 Leistungen, 180.000 Einzelbewertungen |
| Bestehender tatsächlicher Chromium | 91 Prüfschritte, 63 axe-Prüfungen, keine erkannten Verstöße |
| Gewichtungsabläufe im tatsächlichen Chromium | 30 Prüfschritte, 22 axe-Prüfungen, keine erkannten Verstöße |
| Neue tatsächliche Chromium-Abläufe | 38 Prüfschritte, 29 axe-Prüfungen, keine erkannten Verstöße |
| JavaScript-Syntax | 73 Quellmodule und Testdateien geprüft |

Chromium-Version: 156.0.8078.47. Die Prüfungen umfassen echte automatisierte Tastaturereignisse, DOM und Accessibility-Baum. Es gab keine JavaScript-Seitenfehler. Die vorhandenen Tests wurden erneut ausgeführt. Geänderte Oberflächenerwartungen betreffen die fünf Hauptlinks, drei Einstellungstabs, passende mündliche Regionsnamen und die aktuelle Versionsnummer. Mathematische, Import-, Daten- und Speicherprüfungen wurden nicht abgeschwächt. Ausführbare Tests und maschinenlesbare Ergebnisse sind enthalten.

## Neue Prüfungen und Befunde

Die Startseite zeigt genau die drei angeforderten Bereiche. Schnellzugriffe verwenden dieselbe Auswahl und Reihenfolge wie die Notenansicht. Offene Aufgaben sind auf fünf begrenzt und beachten wirkliche Teilnahme, aktive Schüler und ausdrückliche Statusangaben. Individuelle mündliche Noten erzeugen keine falschen offenen Klassenaufgaben. Nicht zugeordnete Altbestände werden nicht geraten und sind über einen kurzen Hinweis sowie die Klassenansicht erreichbar. Startseite und letzte Ansicht wurden durch tatsächliches erneutes Laden mit Chromium/IndexedDB und mit dem C#-Speicherkern geprüft.

Die mündliche Klassenmatrix enthält höchstens acht gemeinsame Leistungsspalten. Neue eindeutige Einzelnoten erscheinen ausschließlich als Zeilen in der Einzelnotenansicht; in der kompakten Gesamtleistungsliste bleiben sie ebenfalls erreichbar. Eine Klassenleistung mit einem Teilnehmer bleibt Klassenleistung. Die Schüleransicht und sämtliche Berechnungen verwenden dieselben Datensätze, ohne doppelte Erfassung.

40, 100 und 250 mündliche Einzelnoten wurden auf vollständige Verfügbarkeit und Seitenbegrenzung geprüft. Im realen Browser wurden 125 gleichartig beziehungsweise gleichnamig bezeichnete Einzelnoten, vollständige Bemerkungen, Suche, Schülerfilter, Datum-/Namenssortierung, Bearbeiten, Speichern und nächste sowie Rückkehr aus der Schüleransicht geprüft. Zeilen haben korrekte Tabellenüberschriften und kurze Aktionen. Faktoren, GFS, Status und manuelle Zeugnisnoten bleiben erhalten. 15 Tabellenaufbereitungen mit über 120 Leistungen benötigten im jsdom-Lauf etwa 8 ms; dies ist keine Windows-Leistungszusage.

Ein vollständiger repräsentativer 1.7.0-Bestand bleibt beim Start, beim Ändern der Ansichten und über mehrere Neustarts bytegleich. Einstellungen stehen ausschließlich in Ansicht.json. Es entstehen keine vollständigen Notensicherungen durch reine Navigation. Neue Noten speichern die optionale Erfassungsart `oralEntry` sowie die bisherige Teilnahme. Bestehende Kennungen, Noten, Faktoren und Fächer bleiben unverändert.

Mehrdeutige alte mündliche Leistungen werden erst nach ausdrücklich bestätigter Zuordnung verändert. Eine fehlgeschlagene vollständige Schutzsicherung blockiert die Übernahme. Die geprüfte Schutzkopie enthält den gesamten Datenbestand und die Ansichtseinstellungen. Die bestätigte Zuordnung erhält Rohnoten, Status, GFS, Faktoren und exakte Durchschnitte. Schutzstände sind in der normalen Wiederherstellung erreichbar und gekennzeichnet. Vollständiger Export und Wiederherstellung wurden einschließlich neuer Einstellungen und Metadaten geprüft.

Der neue Startseiten-Einstieg deckte einen Fokusfehler auf: Beim Schließen einer von dort fortgesetzten Eingabe ging der Fokus verloren. Der Rückweg führt jetzt zur betreffenden Leistung. Ein weiterer realer Browserbefund betraf ausschließlich lesbare lange Dialoge ohne erreichbares Steuerelement im Inhalt: Sie erhalten nur bei wirklichem Scrollbedarf einen zusätzlichen Fokusstop, damit der Inhalt per Tastatur scrollbar bleibt.

## Unveränderte Berechnungen und Sicherheit

Die zentralen rationalen Notenformeln bleiben erhalten. Standard sind schriftlich/mündlich 50:50 und innerhalb Schriftlich Klassenarbeiten/Tests 80:20. Individuelle und direkte Prozentwerte, Faktoren, fehlende Bereiche, Statusangaben, Runden und Kürzen sowie getrennte manuelle Zeugnisnoten wurden weiterhin geprüft. Die neue Erfassungsart beeinflusst keine Notenformel. Ansicht und bestätigte Zuordnung erzeugen keine zusätzlichen Noten.

Atomare Speicherung, Prüfung, Konfliktschutz, Sperre des Datenordners, Wiederherstellungsschutz, Übernahme alter Datenordner und Aufbewahrung automatischer Speicherstände bleiben bestehen. Die vorhandenen Fehlerprüfungen umfassen beschädigte beziehungsweise unterbrochene Schreibvorgänge und konkurrierende Änderungen. Vollständige JSON-Sicherungen sowie TXT-/CSV-Ausgaben bleiben erhalten. Persönliche Daten werden ausschließlich lokal verarbeitet; keine neue Laufzeitabhängigkeit und keine zusätzliche Datenbank wurden eingeführt.

Der große Datenbestand umfasst 37.001.727 Bytes und 6.200 TXT-Dateien. Unter Linux: Start etwa 2,1 s, vollständige automatische Speicherung einschließlich TXT etwa 12,2 s, inkrementelle Speicherung etwa 6,8 s. Diese Werte stammen aus dem tatsächlichen Testlauf und sind keine Zusage für Windows oder andere Rechner.

## Darstellung und Prüfgrenzen

Gerenderte Startseite, mündliche Zeilentabelle, Gewichtungsdialog und schmale Darstellungen wurden tatsächlich visuell angesehen. Automatische Layoutprüfungen umfassen 1440, 1280, 800, 640 und 320 Pixel Breite, geringe Fensterhöhen, lange Namen, viele Fächer, beide Notengliederungen, drei Dialoggrößen und vollständige Gewichtungsvergleiche. Bestehende Prüfungen berücksichtigen Druckansichten, Kontrastmodus sowie emulierte 200/400-Prozent-Skalierung. Horizontal überlaufende Tabellen bleiben per Tastatur erreichbar. Die Inhalte scrollen innerhalb des Dialogs; dessen Aktionen bleiben erreichbar.

Axe prüft seine verfügbaren WCAG-2/2.1-AA- und Best-Practice-Regeln und beweist keine vollständige Barrierefreiheit. Chromium-Automation ist kein manueller NVDA-Test. Die tatsächlichen C#-Quellen wurden unter .NET 8/Linux für Speicher- und Loaderprüfungen ausgeführt. Die Windows-EXE wurde gegen .NET Framework 4.8 kompiliert und ihre vollständige SHA-256-Dateiliste geprüft; dies ist kein ausgeführter Windows-Programmstart.

Nicht durchgeführt: interaktiver Windows-Start nach Entpacken, reale Windows-Skalierung, tatsächlich gesprochene NVDA-/JAWS-Ausgabe und manuelle Bedienung mit Windows-Hilfstechniken. Diese Prüfungen bleiben separat erforderlich. Es sind keine weiteren reproduzierten Fehler aus den durchgeführten Prüfungen offen. Wie bisher sind .NET Framework 4.8 und die installierte WebView2-Laufzeit erforderlich. Die Anwendung ist nicht codesigniert; Windows-/SmartScreen-Schutz wird nicht umgangen.

## Auslieferungsprüfung

Programmarchiv: nur Notenblick.exe und Programm, keine vorbereiteten Nutzerdaten. Neuinstallationen erstellen Daten automatisch. Updates ersetzen ausschließlich EXE und den vollständigen Programmordner. Der vorhandene Ordner Daten bleibt bestehen.

Quellcodearchiv: vollständige Module, Tests, Ergebnisse, Dokumentation, Buildskripte und benötigte Referenz-/Programmbibliotheken. Keine persönlichen Daten und keine Bildschirmaufnahmen. Beide Archive wurden kontrolliert entpackt und auf ZIP-Integrität geprüft. Die entpackte Oberfläche bestand Start, Navigation, erste Einrichtung mit neuen Vorgaben, Startseite, Allgemein und mündliche Einzelnoteneingabe. Der entpackte Quellcode wurde ohne Paketdownload neu gebaut; alle 53 HTML-/JavaScript-/CSS-Dateien stimmen bytegleich mit der Auslieferung überein. Diese Linux-Prüfungen sind kein Windows-EXE-Start. Einzelheiten stehen in tests/package-results.json.
