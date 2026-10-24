# Notenblick 1.9.0

1. Start bleibt bei Weiterarbeiten, Meine Fächer und Offene Noteneingaben. Kompaktere Bereiche, gleichmäßige Fachflächen und klar getrennte Leistungsbezeichnung/Erfassungsstand. Historische Weiterarbeitsfächer zeigen ihr tatsächliches Schuljahr und öffnen ihre letzte Fachansicht.
2. Mündliche Erfassung heißt einheitlich Klassenübersicht | Einzelnoten. Unter H2 Mündliche Noten steht nur die zur Ansicht passende Hauptaktion: Noten für Klasse erfassen beziehungsweise Einzelnote eintragen. Andere Bereiche behalten Mündliche Note eintragen.
3. Ansicht anpassen bündelt seltene Optionen und ist zunächst geschlossen. Klassenübersicht behält Notentabelle/Leistungsliste, Schüler-/Leistungssuche und Export. Einzelnoten behalten ihre sichtbare Suche; Schülerfilter und Sortierung stehen in den Zusatzoptionen.
4. Einzelnotensuche umfasst Vorname, Nachname, vollständigen Namen und Leistungsbezeichnung. Die Tabelle besitzt sechs Spalten: Datum, Schüler, Bezeichnung, Note, Bemerkung, Aktion. Höchstens 50 Einträge je Seite; Schülernamen führen mit Rückweg zur Schüleransicht.
5. Neue Einzelnoten heißen standardmäßig Mündliche Note; vorhandene Bezeichnungen bleiben erhalten. Ein über den Filter bekannter Schüler ist vorausgewählt, der Fokus steht auf Note. Allgemeine Aufrufe beginnen bei Schüler. Speichern und nächste und Schutz vor doppelter Speicherung bleiben erhalten.
6. Neue Klassen-/Gruppenrunden öffnen unmittelbar die bestehende individuelle Noteneingabe. Ein alter Eingabesuchbegriff verdeckt die neue Runde nicht. Eingabe schließen führt zurück; Dialoge erhalten Tabellenposition, Fokus und Scrollposition.
7. Mündliche Darstellung und Klassensuchen beeinflussen andere Leistungsarten nicht mehr. Sämtliche Ansichtszustände stehen ausschließlich in Ansicht.json; Navigation schreibt keine Notendaten um.
8. Dauerhafte Zuordnungshinweise und Zuordnung prüfen sind von Start und Mündlich entfernt. Mehrdeutige historische Datensätze bleiben unverändert lesbar. Eine ausdrückliche Klärung steht bei Bedarf unter Sicherung → Wiederherstellen → Mündliche Altbestände; vorher wird weiterhin vollständig und geprüft gesichert.
9. Berechnungskern, Gewichtung, Teilnahme, Status, GFS, Zeugnisnoten, portable Ablage, automatische Speicherung, Sicherung, TXT/CSV und Verwaltung bleiben erhalten. Der produktive C#-Speicherkern und die Berechnungsmodule sind gegenüber 1.8.0 bytegleich.
10. Lokale Prüfungen um 1.9-Abläufe, Update-/Speichertests und Chromium-Prüfungen mit 40, 100 und 250 Einzelnoten, 60 Schülern, historischen Schuljahren, langen Texten und hohem Browserzoom erweitert. Tatsächliche Windows-/NVDA-Prüfungen bleiben ausdrücklich gesondert.

## Update auf 1.9.0

Notenblick schließen. Ausschließlich Notenblick.exe und den vollständigen Ordner Programm ersetzen. Den vorhandenen Ordner Daten unverändert behalten. Das Programmarchiv enthält keine Nutzerdaten; bei einer Neuinstallation entsteht Daten beim ersten Start.

Die Auslieferung ist ein lokal unter Linux und Chromium geprüfter Windows-Build-Kandidat. Tatsächlicher Windows-Programmstart, WebView2/UI Automation, Windows-Skalierung und gesprochene NVDA-Ausgaben sind hier nicht live geprüft. Einzelheiten stehen in PRUEFBERICHT.md.

---

# Notenblick 1.8.0

1. Neue Startseite mit Weiterarbeiten, gemeinsamen Fach-Schnellzugriffen und höchstens fünf tatsächlich offenen Noteneingaben. Fünf echte Hauptlinks: Start, Noten, Verwaltung, Sicherung, Einstellungen.
2. Einstellungen → Allgemein: Startseite oder letzte Ansicht öffnen. Standard bleibt die letzte Ansicht; Fach, Registerkarte und mündliche Auswahl werden wiederhergestellt.
3. Mündlich: Klassenleistungen behalten die Notentabelle mit höchstens acht Leistungsspalten. Eindeutig erfasste Einzelnoten stehen als kompakte Zeilen ohne leere Leistungsspalten darunter. Die beiden Ansichten werden über ein Auswahlfeld gewechselt, ohne zusätzliche Registerkartenhierarchie.
4. Einzelnoten bieten Datum und Bezeichnung, Schüler, Note, Bemerkung und kurze Bearbeiten-/Löschen-Aktionen. Suche, Schülerfilter, Datum-/Namenssortierung und Seiten mit höchstens 50 Einträgen erleichtern große Bestände. Schülernamen öffnen die vorhandene Schüleransicht mit Rückweg zur ursprünglichen Zeile.
5. Neue mündliche Einträge speichern ihre Erfassungsart eindeutig. Eine Klassenleistung mit einem Teilnehmer bleibt Klassenleistung. Mehrdeutige Altbestände bleiben unverändert in der Klassenansicht und lassen sich ausdrücklich nach vollständiger Sicherung zuordnen.
6. Einzelnoten und Klassenleistungen verwenden dieselben gespeicherten Leistungen und denselben exakten Berechnungskern. Faktoren, Statusangaben, GFS, Schülerzuordnungen und manuelle Zeugnisnoten bleiben erhalten. Kompakte Leistungsverwaltung und Schüleransicht zeigen weiterhin alle zugehörigen Noten.
7. „Mündliche Note eintragen“ und „Mündliche Leistung anlegen“ bleiben direkt erreichbar. Speichern und nächste vermeidet doppelte Erfassung. Einzelnoten sind vollständig bearbeitbar; abgeschlossene Bestände bleiben lesbar und geschützt.
8. Nachkommastellen und Verfahren stehen im Gewichtungsdialog unmittelbar unter „Durchschnitt anzeigen“. „Kürzen“ ersetzt „Abschneiden“ in der Oberfläche. Beispiele erläutern Runden und Kürzen; der unnötige Prozent-Tastaturhinweis entfällt, die Tastaturfunktionen bleiben erhalten.
9. Gemeinsame kleine, mittlere und breite Dialoggrößen. Ein vertikal scrollbarerer Inhaltsbereich und erreichbare Dialogaktionen berücksichtigen kleine Fenster. Der vollständige Durchschnittsvergleich nutzt die breite Größe. Rein lesbare lange Dialoginhalte sind auch per Tastatur scrollbar.
10. Behoben: falsche offene Aufgaben für gezielte Einzelnoten, zahlreiche leere mündliche Spalten bei neuen Einzelnoten, fehlender Fokus-Rückweg aus dem Startseiten-Einstieg und nicht erreichbare Schutzstände der mündlichen Zuordnung. Schutzstände sind in der Wiederherstellung eindeutig beschriftet.
11. Automatische Speicherung, Sicherungen, Wiederherstellung, TXT/CSV, Verwaltung, Übernahmen, Import, Gewichtungsmodelle und vorhandene Darstellungsoptionen bleiben erhalten. Reine Navigation ändert keine Notendaten.

## Update

Notenblick schließen. Ausschließlich Notenblick.exe und den vollständigen Ordner Programm ersetzen. Den vorhandenen Ordner Daten behalten. Das Programmarchiv enthält keine Nutzerdaten; bei einer Neuinstallation wird Daten automatisch angelegt.

Bisherige mündliche Leistungen werden nicht anhand der Teilnehmerzahl geraten. Unter Mündlich → Klassenleistungen → Zuordnung prüfen können sie nach Prüfung zugeordnet werden. Vor der bestätigten Übernahme entsteht eine geprüfte vollständige Sicherung. Die Originalnoten werden dabei nicht verändert.

Tatsächliche Prüfungen und verbleibende Windows-/NVDA-Testgrenzen stehen in PRUEFBERICHT.md.
