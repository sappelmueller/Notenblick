# Notenblick 1.16.0 – Datensicherung, Verwaltung und Ersteinrichtung

Die vorhandene Offline-Anwendung bleibt Grundlage. Zentrale exakte Berechnung, Datenvalidierung/-migration, historische Zuordnungen und nativer atomarer C#-Speicherkern bleiben bytegleich zu 1.15.0. Datenformat wird kompatibel um die bereits unterstützte optionale workspace-Sicherung bei der ersten Veröffentlichung verwendet; keine Datenbank oder Konvertierung vorhandener Noten.

## Verhalten

- Automatische TXT-Übersichten immer pro Fach, auch ohne Leistungen. Je Schüler genau ein berechneter Gesamtdurchschnitt, Leistungsbereiche und Gewichtungen, separate manuelle Halbjahres-/Zeugnisnoten mit „–“ für offen, Bemerkungen und historische Angaben. Halbjahresbezeichnung entspricht der Klasseneinstellung. Bestehende Leistungsdateien bleiben erhalten; zusätzlich jeder zugeordnete Schüler unter Schülernoten mit eindeutigen Windows-Dateinamen.
- TXT-Verzeichnis Version 16: tatsächliche Dateien lesen, fehlende/geänderte Inhalte erneuern, geschriebene Dateien zurücklesen und SHA-256 führen. „updating“ ist kein Vollständigkeitsnachweis. Neue Dateien vollständig vor Bereinigung; nur nachgewiesen unveränderte eigene Altdateien entfernen, andere behalten und unter Sicherung melden. Neustart und ausdrückliche Aktualisierung reparieren auch bei gleicher JSON-Commit-ID. TXT-only-Reparatur verändert JSON nicht; gleichzeitige Notenänderungen werden anschließend gespeichert.
- Verwaltung: H1 bleibt, pro Register genau eine H2, Hauptaktionen vor Auswahl/Filtern und Tabelle; keine zusätzliche Inhaltsregion. Arbeitsjahr separat im Status, direkte Klassen-/Fachnavigation und erhaltene Menüs/Zuordnungen. Abschließen ändert kein Arbeitsjahr. Ehemalige Klassenschüler und Nichtteilnahme an einem Fach bleiben unterschiedliche Zustände.
- Willkommen nur ohne Datenbestand. Vorhandene gültige, historische, beschädigte oder verdächtige Daten verhindern eine neue Einrichtung. Vier Schritte als flüchtiger Entwurf: mehrere Klassen/Halbjahresarten, mehrere Fächer, unabhängige optionale Schülerlisten mit vorhandener Namensvorschau/Dublettenprüfung/Fachteilnahmen, Grundeinstellungen und Zusammenfassung. Zurück bewahrt Eingaben, Abbruch speichert keine Teildaten. Abschließende validierte Veröffentlichung nutzt commitDraft. Fehler vor/nach JSON-Annahme bleiben wiederholbar ohne Duplikate. Initiale Einstellungen sind im atomaren JSON geschützt; später geänderte Ansichten/Einstellungen haben Vorrang.
- Abschlussnoten: Strg+Enter bleibt ausdrücklich; kein sichtbarer Tastaturhinweis. Zugänglicher Name enthält Schüler und bereits vorhandenen Durchschnitt des passenden Zeitraums oder „Noch kein Durchschnitt“. Keine zusätzliche Live-Region, unveränderte native Auswahl/Filter/Speicherlogik.

TXT ist die menschenlesbare Notfallübersicht. Vollständig wiederhergestellt wird mit JSON-Sicherung oder gesamtem Datenordner.

## Tatsächliche gezielte Prüfungen

Am 27. Oktober 2026 erfolgreich: neue Domänen-/UI-Gruppen v1160, produktive C#-Speicher-/Fehler-/Updateprüfungen v1160-storage und echte Chromium-/axe-/Tastaturprüfungen v1160-browser. Bestehende Berechnungs-, Export-, Speicher- und Browserregressionen werden über denselben Testkatalog weiter ausgeführt. Tests verwenden ausschließlich synthetische Daten.

Geprüft werden alle drei Zeugnisarten, fehlende Werte, genau ein TXT-Gesamtdurchschnitt, Namenskollisionen, ehemalige Schüler/Fachteilnahme, leere Fächer, fehlende/manipulierte Dateien, unterbrochene TXT-Phase, geschützte Altdateien, JSON-Bytegleichheit, Sicherung/Wiederherstellung, parallele Änderung sowie erste Einrichtung mit Abbruch, Fehlern und Neustart. Browserprüfungen umfassen mehrklassige Entwürfe, Namenimport/Teilnahme, Rückwärtsnavigation, alle Verwaltungsregister, Menütasten/Fokus, Mittelwertlabel und kleine effektive Fenster. Vorhandene 30/60/300-Schüler-Abschlussdialogprüfungen bleiben enthalten.

Ältere Testorakel wurden nur für beauftragte Texte und echte Willkommen-Startansicht angepasst; die bisherigen Speicher-/Mathematik-/Exportassertionen bleiben erhalten. Ein während der Entwicklung gefundener undefinierter Ergebnisbezug im Browser-Wiederherstellungspfad wurde behoben. Die Browser-Abschlussprüfung wartet auf tatsächliches Ende der asynchronen Speicherung. Der längere Verweis „Zur Notenübersicht“ bricht bei schmalem Fenster/200 Prozent CSS-Zoom innerhalb seines Bereichs um; die zwölf bestehenden Render-/Zoomfälle bestehen.

## Vollständiger Release-Nachweis

Vor Auslieferung frischer python3 dev/manage.py release: alle 49 Testsuiten, 180.000 Ergebnisse, alle Berechnungs-/Migrations-/Speicherregressionen, Browser/Tastatur/Fokus/axe, sämtliche Office-/PDF-UA-/Druck-/Schüler-ZIP-Prüfungen, Assembly-Lader/Abhängigkeiten, zwei saubere bytegleiche Builds, vollständige ZIP- und Entpackprüfung. Insgesamt 56 Prozessschritte, keine Ergebniswiederverwendung oder GitHub Actions. Der unmittelbare Release-Lauf deckt Integration mit ab.

Die konkrete erfolgreiche Laufkennung, Dauer, Quelle und ZIP-Prüfsummen stehen im abschließenden Versionscommit. Vollständige lokale Nachweise: reports/<Lauf>/summary.json, Einzellogs, determinism.json und status --report; vorbereitende oder fehlgeschlagene Läufe sind keine Freigabe. Diese Dokumentation wird vor dem abschließenden Lauf fertiggestellt.

## Grenzen und Update

Tatsächliche Windows-/WebView2-/UIA-/NVDA-Sprach-/Brailleprüfungen, Windows-Skalierung, Microsoft Office und physischer Druck sind nicht live durchgeführt. Chromium/axe, .NET unter Linux, Open-XML, veraPDF und LibreOffice ersetzen diese Abnahme nicht. Windows-Ausgabe bis dahin als lokal geprüften Kandidaten behandeln; offener Plan in WINDOWS-PRUEFUNG.md. Keine automatische Enter-Navigation behauptet.

Notenblick schließen, Sicherung erstellen und nur EXE sowie vollständigen Programmordner ersetzen. Daten einschließlich Sicherungen/Notenlisten/Einstellungen behalten. Programm-ZIP enthält keine Nutzerdaten; Quellcode-ZIP ist getrennt.
