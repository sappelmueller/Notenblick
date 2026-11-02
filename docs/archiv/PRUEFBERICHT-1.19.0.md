# Notenblick 1.19.0 – Sicherung, Hilfe und Bedienkomfort

Ausgangspunkt: vollständiger privater Quellbaum von 1.18.0, Commit 175be2667936b9f498f7d26dbf96cb0fea130cb6, Baum ad3f34c5a9a383d1987f37a80e9f97d399b027e6. Bestehende gesperrte Werkzeuge werden wiederverwendet; keine neuen Laufzeitabhängigkeiten. Ausschließlich synthetische Testdaten. GitHub Actions bleiben deaktiviert.

## Änderungen

Neue Datenbestände verwenden zentral `defaultRounding: truncate` und `notesLayout: kinds`. Ersteinrichtung und neue Fächer übernehmen dieselben Vorgaben. Vorhandene explizite Werte bleiben unverändert; vorhandene Bestände ohne globale Auswahl verwenden weiterhin Runden und Kompakt. Kurswerte, exakte rationale Rechnungen und unabhängige mathematische Zeugnisnotenvorschläge bleiben unverändert. Kürzen ist ein Produktstandard und keine pauschale Rechtsvorgabe.

Die bestehende Dialogfußzeile enthält beim Assistenten den ursprünglichen Zurück-Schalter links, Einrichtung beenden als sekundäre Aktion und Weiter beziehungsweise Notenblick einrichten rechts. Bei Verwerf-/Klassenbestätigungen wird der Fußzeilenteil ausgesetzt und anschließend samt Fokus wiederhergestellt. Fünf Schritte, Eingaben, Scrollposition und atomarer Abschluss bleiben erhalten.

Hilfe ist der sechste echte Hauptnavigationslink. Derselbe vollständige Text erscheint unter H1 Hilfe mit H2-Themen; Reihenfolge und sämtliche Absätze bleiben erhalten. Keine inhaltliche Neufassung. Ein fester SHA-256-Textdigest gegen den 1.18.0-Hilfetext prüft das unabhängig von der neuen HTML-Struktur und der Versionsanzeige. Hilfe bleibt auch bei Datenlesefehlern oder offener fehlerhafter Eingabe erreichbar; Eingaben werden dadurch nicht verworfen.

Sicherung nutzt dieselbe manuell aktivierte Tabkomponente wie Verwaltung und Einstellungen. Nur der aktive Inhalt ist sichtbar, Fokus bleibt auf der aktivierten Registerkarte. Pfeile/Pos1/Ende bewegen den Fokus, Enter/Leertaste aktivieren. Keine vier zusätzlichen Regionen und keine verschachtelte Kartenansicht. Der aktive Sicherungstab wird ausschließlich in der vorhandenen Ansicht gespeichert.

Speicherstatus trennt noch nicht gespeicherte Noten von bereits gesicherten Noten mit ausstehender TXT-Aktualisierung und von noch nicht gespeicherter Ansicht. Der erfolgreiche JSON-Zeitpunkt wird bereits vor einer möglichen TXT-Fehlermeldung gesetzt. Globale Fehlermeldungen bleiben zusätzlich erhalten. Textlistenprüfung und Reparatur nutzen unverändert `refreshTextLists`/`FolderStore`; kein zweiter Speicherweg. Bei einem Lesefehler der Hauptdatei sind TXT-Neuerstellung sowie Sicherung/Export des leeren Ersatzstands gesperrt; vorhandene Textlisten und ihr Manifest bleiben geschützt, lesbare frühere Stände sind weiterhin auswählbar.

Vollständige Sicherung nutzt unverändert die gemeinsame JSON-Sicherung mit Einstellungen. Datei- und Standvorschauen nennen Datum, Schuljahre, Schüler und Leistungen; die Dateivorschau zusätzlich Klassen und vorhandene historische Leistungen. Ein Auswahlschritt allein verändert keine Daten. Früherer Stand und abschließende Bestätigung vergleichen die ausgewählte Datei erneut mit ihrer SHA-256-Prüfsumme. Bestehende Validierung, atomare Speicherung, geschützte vorherige Sicherung und Aufbewahrung bleiben unverändert. Ungespeicherte Arbeitskopien werden nur bei tatsächlicher Verfügbarkeit angeboten und übernehmen jetzt auch ihre vorhandenen Einstellungen. Rückgängig bleibt von dauerhaften Sicherungen getrennt und erhält einen sinnvollen Fokus.

Exportieren öffnet denselben zentralen Fachdialog mit Drucken/PDF/Word/Excel/TXT/CSV einschließlich Filtern und Schüler-ZIPs. Ohne Fach gibt es einen verständlichen Weg zur Auswahl. Alle Noten als TXT bleibt erhalten; doppelter CSV-Schalter entfällt, automatische TXT-Prüfung bleibt ausschließlich im Speicherstatus. Der Hilfetext wird entsprechend dem Auftrag noch nicht redaktionell an neue Aktionsbezeichnungen angepasst.

## Dauerhafte gezielte Prüfungen

- `v1190`: Erststart, bestehende explizite/implizite Vorgaben, unveränderte Rechnung, Fußzeilenreihenfolge, sechs Links und vollständiger Hilfe-Textdigest, vier exklusive Tabs, getrennte JSON-/TXT-Zustände, vollständige JSON-Sicherung, Datei-Abbruch/ungültige Datei, Rückgängig-Fokus und Arbeitskopie einschließlich eigener Einstellungen.
- `v1190-storage`: produktiver C#-Speicherkern auf .NET 8/Linux, 1.18.0 bytegleich geöffnet, Kurswerte und Abschlussnoten erhalten, Sicherung mit Einstellungen, Datei-Abbruch und bestätigte Wiederherstellung mit geschütztem vorherigem Stand, frühere Stände mit Vorschau und zweiter Bestätigung, inzwischen veränderte Quellen abgewiesen, JSON-Schreibfehler ohne Überschreiben, separate TXT-Fehler und SHA-256-Reparatur ohne JSON-Revision, Neustart und bytegleicher Erhalt aller TXT-/Manifestdateien bei defekter Hauptdatei.
- `v1190-browser`: echter lokaler Chromium mit axe, alle fünf Einrichtungsschritte und gemeinsame Fußzeile; fünf Hauptansichten aus Hilfe/Sicherung sowie drei Wiederherstellungsdialoge bei 1280/640/320 Pixeln und 200 Prozent CSS-Zoom bei 640/320. Insgesamt 65 Fenster-/Zoomfälle mit tatsächlichen Grenzen, Erreichbarkeit und Überlappungsprüfung. Sechs native Hauptlinks, manuelle Tabbedienung, zentraler Exportdialog mit allen Formaten, Datei-/Stand-Abbruch, Rückkehrfokus und Hilfe trotz Lesefehler. JavaScript-Fehler/axe-Verstöße verhindern Erfolg.

Bestehende Regressionen bleiben erhalten; ausdrücklich geänderte Texte/Strukturen und aktuelle Schreibversionen werden angepasst. Alte kompakte Szenarien wählen ihre Ansicht ausdrücklich, statt von einem neuen Erststartstandard abhängig zu sein. Die Infrastrukturprüfung berücksichtigt, dass ein Abschlusscommit denselben Baum wie sein Vorgänger enthalten kann.

## Vollständiger Release-Nachweis

Nach Abschluss sämtlicher Änderungen folgt frisch `python3 dev/manage.py release`: alle 58 Testsuiten und 65 Prozessschritte ohne Testwiederverwendung, 180.000 Ergebnisse, vollständige TXT-/JSON-/Sicherungs-/Wiederherstellungsprüfungen, Browser/Tastatur/Accessibility, alle bisherigen Office/PDF/UA-/Druckvalidatoren, zwei saubere bytegleiche Windows-Builds, produktiver Assembly-Lader, vollständige ZIP-/Entpackprüfung und Start im Testhost. Kein identischer vollständiger Integrationslauf wird vorgeschaltet.

Die tatsächliche erfolgreiche Laufkennung, geprüfter Quellbaum, Inhaltsnachweis, Dauer und Prüfsummen der beiden vollständigen ZIPs stehen im abschließenden Versionscommit. Lokale Vollnachweise unter `reports/<Lauf>`; `status --report` muss Quelle, Werkzeuge, Laufzeit und vollständig gestagten Stand bestätigen. Gezielte oder fehlgeschlagene Zwischenläufe sind keine Release-Freigabe. Der entpackte Paketstart prüft die neuen Standards ausdrücklich und öffnet die mündliche Ansicht über dieselbe zentrale Ansichtsauswahl wie die Anwendung.

## Verbleibende Abnahme

Echte Windows-x64-/ARM64-Starts, WebView2/UIA, NVDA-Sprache/Braille, Windows-Skalierung, Microsoft Office und physischer Druck sind hier nicht live geprüft. Linux/.NET, Chromium/axe, CSS-Zoom, LibreOffice, Open XML SDK und veraPDF ersetzen diese Abnahme nicht. Der abschließende Linux-Lauf wird mit dokumentierter Testzeitzone UTC ausgeführt; Windows verwendet weiterhin seine tatsächliche Systemzeitzone. Die Ausgabe bleibt ein lokal geprüfter Entwicklungskandidat.

Portable Struktur: Notenblick.exe / Programm / Daten. Vor Update schließen und sichern; nur EXE und vollständigen Programmordner ersetzen. Daten, Ansicht, Sicherungen und TXT-Listen behalten. Das Windows-ZIP enthält keine Nutzerdaten; Quellcode und Tests werden als eigenes vollständiges ZIP ausgeliefert.
