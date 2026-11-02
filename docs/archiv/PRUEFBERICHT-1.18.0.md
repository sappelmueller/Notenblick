# Notenblick 1.18.0 – gezielter Feinschliff der Ersteinrichtung

Ausgangspunkt ist der vollständige aktuelle private GitHub-Quellbaum von 1.17.0, Commit 117c04bbfb954ed2a5f6eab7a62906a09b7ba377, Baum 6a747f06cfe9e49f4d609dbf89b637204ab075da. Alle 229 Dateien wurden byteweise gegen die Git-Objekthashes geprüft. Die vorhandenen gesperrten Entwicklungswerkzeuge und Tests werden wiederverwendet; nach Bereinigung der temporären Umgebung wurden sie aus den unveränderten Sperren eingerichtet.

## Änderungen und Abgrenzung

Die Willkommensseite, alle fünf Schritte und die atomare Abschlusstransaktion bleiben erhalten. Keine neue Einrichtung, Datenmigration, Berechnungs- oder Speicherlogik und keine Laufzeitabhängigkeit. Einzelberechnung, Klassendurchschnitte, Abschlussnoten, Exporte, automatische TXT-Listen (Verzeichnisversion 17), JSON-Sicherungen, Wiederherstellung und Verwaltung bleiben fachlich unverändert.

1. Schuljahr/Klassen: Die beiden zusätzlichen Halbjahreserklärungen entfallen. Die vorhandenen Optionen heißen „Halbjahresinformation – Viertelnoten“ und „Halbjahreszeugnis – ganze Noten“. Keine zusätzliche Beschreibung unter dem Auswahlfeld. Tatsächliche Klassenüberschrift und Entfernen-Aktionsname aktualisieren sich während der Eingabe. Leere Klassenentwürfe werden direkt entfernt, ausgefüllte weiterhin bestätigt.
2. Fächer: Nur Schrittüberschrift, Klassenauswahl, kompakte Liste mit dauerhaftem Feldlabel „Fachname“, Entfernen, Hinzufügen und der bisherige Standardgewichtungshinweis. Keine zusätzliche Klassenüberschrift oder Anzahl und kein wechselndes „Neues Fach“-Label. Entfernen nennt den tatsächlichen Namen; leere Einträge werden als leere Facheinträge eindeutig unterschieden. Leere/ungültige/gleichnamige Fächer und fehlende Fächer je Klasse bleiben blockiert und gelangen nicht in die Abschlussübersicht oder Speicherung.
3. Schülerlisten: Keine redundante Klassenüberschrift; Import/Vorschau, Einzelanlage und die bestehende kompakte Tabelle bleiben erhalten. „Schüler (Anzahl)“ folgt den tatsächlich erfassten Schülern. Klassenauswahl, unabhängige Listen, Bearbeitung, Fachteilnahmen, Dubletten und optionale Erfassung bleiben bestehen.
4. Grundeinstellungen: Die zusätzliche Einstellungszusammenfassung entfällt vollständig, auch während der Eingabe. Auswahlfelder, kurzer Hinweis, Standardgewichtung und optionaler Gewichtungseditor bleiben erhalten. Gegenanteile und mathematische Validierung unverändert; erweiterte Vorgaben werden nicht zurückgesetzt.
5. Einrichtung überprüfen: Dieselbe vollständige Übersicht und nachvollziehbare Eingabereihenfolge; gespeichert wird ausschließlich über „Notenblick einrichten“. Die Zusammenfassung verwendet bei einer Nachkommastelle die korrekte Singularform.

## Gestaltung und Fokus

Bestehende Farben, Kontraste, Fokusmarkierungen und Komponenten bleiben erhalten. Klassenbereiche stehen kompakt untereinander; zusammengehörige Eingaben und Entfernen-Aktionen stehen bei Platz nebeneinander und umbrechen bei schmaler effektiver Breite. Der Abstand zu „Weitere Klasse hinzufügen“ trennt die Aktion von der letzten Klasse. Fachlisten bleiben einfache Listen ohne zusätzliche Karten oder Überschriften. Flex-Umbruch berücksichtigt den tatsächlich verfügbaren Raum auch bei CSS-Zoom; reine Viewport-Breakpoints reichen dafür nicht aus.

Nach Entfernen wird das benachbarte Klassen-/Fachfeld beziehungsweise der benachbarte Schüler erreicht; ohne verbleibenden Eintrag die Hinzufügen-/Importmöglichkeit. Beim Schrittwechsel erhält die neue H2 den Fokus. Flüchtige Scrollpositionen je Schritt/Klasse stellen beim Zurückgehen die Leseposition wieder her, ohne die Eingaben zu verändern. Diese Werte sind weder Änderungsinhalt noch gespeicherte Nutzerdaten. Neu erzeugte Schritte beginnen oben. Das Rendern schließt ausstehende native Änderungsereignisse vor dem Entfernen der Eingabeknoten ab; Enter und die vorhandene Abbruchbestätigung bleiben sicher.

Escape, X und „Einrichtung beenden“ verwenden weiterhin dieselbe Bestätigung. Fortsetzen und Escape der Abfrage erhalten Eingaben/Fokus/Scrollposition. Verwerfen löscht nur den flüchtigen Entwurf, ohne Teildaten zu speichern. Keine neue Region, keine section-Elemente und keine zusätzliche Ansage oder Tastaturfalle.

## Dauerhaft integrierte Prüfungen

`v1180` prüft alle Texte/Label, dynamische Aktionsnamen, leere/ausgefüllte Klassenentfernung, leere/fehlende Fächer, Klassenwechsel, benachbarten Fokus, Scrollposition, optionale Schüler und dynamische Anzahl. Zusätzlich Gegenanteile, Zusammenfassung ausschließlich in Schritt 5, Speicherfehler und Verwerfen ohne Teilspeicherung. Die vorhandenen `v1160`/`v1170`-Regressionen behalten ihre bisherigen Funktionen; nur ausdrücklich geänderte Text-/DOM-Erwartungen und aktuelle gespeicherte Versionswerte wurden angepasst.

`v1180-browser` arbeitet mit lokalem Chromium 156 und axe: zwei Klassen, dreizehn Fächer, 28 importierte Namen, Vorschau, Inline-Bearbeitung, getrennte Listen, Fachteilnahme, Entfernung, Enter, Schrittüberschriften, Rückkehrfokus und tatsächliche Scrollwiederherstellung. Alle fünf Schritte werden bei 1280/640/320 Pixeln sowie 200 Prozent CSS-Zoom bei 640/320 Pixeln geprüft (25 Fälle). Dialoggrenzen, horizontaler Überlauf, erreichbare Abschluss-/Schließen-Aktionen und neben-/untereinander angeordnete Eingaben/Aktionen werden tatsächlich gemessen. JavaScript-Fehler und axe-Verstöße verhindern den Erfolg. Repräsentative große und vergrößerte schmale Ansichten wurden visuell kontrolliert.

Die produktive C#-Speichergruppe `v1170-storage` öffnet zusätzlich einen synthetischen 1.17.0-Bestand bytegleich und prüft unveränderte Abschlussnoten sowie gespeicherte Darstellung. Ihre bisherigen 1.16.0-, TXT-Integritäts-/Reparatur- und Wiederherstellungsprüfungen bleiben erhalten.

## Vollständiger lokaler Release-Nachweis

Vor Auslieferung folgt ein frischer `python3 dev/manage.py release` mit allen 55 Testsuiten/62 Prozessschritten, ohne Testwiederverwendung: sämtliche bisherigen Berechnungs-/Speicher-/Wiederherstellungs-/Browser-/Accessibility-/Office-/PDF-UA-/Druckprüfungen, 180.000 Ergebnisse und 9.200 TXT-Dateien einschließlich 3.000 Schülerberichten. Zwei saubere bytegleiche Windows-Builds, produktiver Assembly-Lader, vollständige ZIP-/Entpackprüfung und Start der entpackten Ausgabe im Testhost sind verbindlich. Der Release-Lauf deckt die Integration ab; kein identischer vollständiger Integrationslauf wird vorgeschaltet.

Tatsächliche erfolgreiche Laufkennung, Dauer, geprüfter Quellbaum und beide ZIP-Prüfsummen stehen im abschließenden Versionscommit. Lokale Nachweise: `reports/<Lauf>/summary.json`, Einzellogs, `determinism.json` und `status --report`. Dokumentation und vollständige Dateiauswahl werden vor dem finalen Lauf fertiggestellt und gestagt. Fehlgeschlagene/gezielte Zwischenläufe sind keine Release-Freigabe. GitHub Actions bleiben deaktiviert; ausschließlich synthetische Testdaten.

## Verbleibende Abnahme und Update

Echte Windows-x64-/ARM64-Starts, WebView2/UIA, NVDA-Sprache/Braille, Windows-Skalierung, Microsoft Office und physischer Druck sind hier nicht live durchgeführt. Chromium/axe, CSS-Zoom, .NET unter Linux, LibreOffice, Open XML SDK und veraPDF ersetzen diese Abnahme nicht. Deshalb lokal geprüfter Kandidat, keine behauptete Windows-/NVDA-Freigabe.

Portable Struktur unverändert: Notenblick.exe / Programm / Daten. Vor Update Programm schließen und Sicherung erstellen; ausschließlich EXE und vollständigen Programmordner ersetzen, Daten einschließlich Einstellungen, Sicherungen und TXT-Listen behalten. Das vollständige Windows-ZIP enthält keine Nutzerdaten, das vollständige Quellcode-ZIP wird getrennt bereitgestellt.
