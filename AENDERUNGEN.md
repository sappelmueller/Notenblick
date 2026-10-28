# Notenblick 1.19.0

- Neue Standards nur für neue Bestände: Kürzen und Notenansicht nach Leistungsarten. Gespeicherte Entscheidungen sowie bisherige implizite Standards alter Bestände bleiben erhalten; exakte Rechnungen und Zeugnisnotenvorschläge unverändert.
- Ersteinrichtung mit Zurück, Einrichtung beenden und Weiter beziehungsweise Notenblick einrichten in einer gemeinsamen Fußzeile. Fünf Schritte, Fokus, Scrollposition und Verwerfschutz erhalten.
- Hilfe als sechster echter Hauptnavigationslink und eigener H1/H2-Bereich. Sämtliche bisherigen Hilfetexte und ihre Themenreihenfolge erhalten, keine inhaltliche Überarbeitung.
- Sicherung mit derselben Tabkomponente wie Verwaltung/Einstellungen: Speicherstatus, Sicherung erstellen, Wiederherstellen und Exportieren. Keine zusätzlichen Regionen oder vier gleichzeitig sichtbaren Karten.
- Speicherstatus unterscheidet ungespeicherte Noten, unvollständige zusätzliche TXT-Dateien und noch offene Ansichtsspeicherung. Tatsächlichen JSON-Speicherzeitpunkt auch bei TXT-Fehlern anzeigen. Aktionen: Datenordner öffnen, Automatische Notenlisten prüfen und Erneut speichern.
- Datei- und Standwiederherstellung mit beschrifteten Angaben und ausdrücklicher Ersetzungsbestätigung. Ausgewählter Stand mit dynamischer Vorschau; SHA-256-Kontrolle verhindert Übernahme inzwischen veränderter Quelldateien. Bestehende atomare Speicherung und zusätzliche Schutzsicherung erhalten.
- Rückgängig mit sinnvoller Fokuswiederherstellung. Ungespeicherte Arbeitskopien nur bei Verfügbarkeit und einschließlich ihrer gespeicherten Einstellungen wiederherstellen. Historische Daten und mündliche Zuordnungen bleiben zugänglich.
- Zentralen Exportdialog aus Sicherung öffnen; alle Formate und Schüler-Sammelexporte erhalten. Doppelten CSV-Schalter entfernt; TXT-Prüfung ausschließlich unter Speicherstatus.
- Gezielter Umbruch langer Sicherungsaktionen und Texte; Dialoge aus Sicherung bei kleiner effektiver Breite erreichbar. Die bestehende Scrollprüfung reagiert zusätzlich auf Layout-/Zoomänderungen, damit auch leere scrollbare Tabellen tastaturerreichbar bleiben.
- Dauerhafte v1190-Funktions-, produktive C#-Speicher- und Chromium/axe-Prüfungen mit 65 Fenster-/CSS-Zoomfällen. Hilfe-Textdigest, Altstand 1.18.0 bytegleich, Fehler-/Abbruch-/Wiederherstellungsfälle. Infrastrukturprüfung unterstützt Abschlusscommits mit identischem Quellbaum.

# Notenblick 1.18.0

- Ersteinrichtung gezielt vereinfacht: Halbjahresoptionen nennen Viertelnoten beziehungsweise ganze Noten direkt; doppelte Erklärungen entfallen.
- Fachliste ohne wiederholte Klassenüberschrift/Anzahl, dauerhaftes Feldlabel „Fachname“ und eindeutige dynamische Entfernen-Aktionen. Leere Entwürfe sind weiterhin keine eingerichteten Fächer.
- Schülerlisten ohne doppelte Klassenüberschrift; kompakte dynamische Überschrift „Schüler (Anzahl)“. Einstellungen werden ausschließlich im fünften Schritt zusammengefasst.
- Kompakte einheitliche Klassenbereiche, natürlich umbrechende Eingaben/Aktionen auch bei hohem Zoom. Sichtbare Fokusmarkierungen und bisherige Komponenten bleiben erhalten.
- Nach Entfernen Fokus zum benachbarten Feld/Schüler beziehungsweise zur Hinzufügen-Aktion. Schrittüberschriften erhalten den Fokus; beim Zurückgehen wird die vorherige Scrollposition wiederhergestellt.
- Bestehende atomare Abschlussspeicherung und Abbruchbestätigungen bleiben erhalten. Berechnung, Abschlussnoten, Exporte, TXT-Verzeichnisversion 17, Datenformat und native Speicherung unverändert.
- Dauerhafte Funktions-/Browserregressionen, zusätzliche bytegleiche Öffnungsprüfung von 1.17.0 und vollständiger lokaler Release-Ablauf. Windows-/NVDA-/Braille-/Microsoft-Office-Liveabnahme bleibt separat erforderlich.

# Notenblick 1.17.0

- Fehler in der Notenübersicht behoben: Die beiden Abschlussnoten-Klassendurchschnitte waren bisher fest als Striche ausgegeben. Jetzt zählen bereits teilweise festgelegte passende Noten aktiver Fachschüler; keine Nullwerte für fehlende Noten, keine Veränderung gespeicherter Entscheidungen. Bildschirm, TXT-Übersicht und gemeinsame Exportmodelle verwenden dieselbe exakte Berechnung. Suche, angezeigte Seite und Exportumfang beeinflussen die Grundlage nicht.
- TXT-Schülerberichte ohne technische normale Zeitabschnitte oder wiederholten Faktor 1. Abweichende Faktoren direkt bei Leistungen, GFS weiterhin deutlich. Abweichende historische Halbjahre und frühere Zeugnisnoten verständlich benannt. Ordnerstruktur, Vollständigkeit, SHA-256, Inhaltsreparatur und geschützte Bereinigung bleiben erhalten; Verzeichnisversion 17.
- Schuljahre nach tatsächlichem Beginn absteigend, ohne gespeicherte Reihenfolge oder Arbeitsjahr zu ändern. Bei Schülern und Fächern stehen Jahr/Klasse vor den Aktionen. Dialogtitel nennen die Klasse; Fächer stehen alphabetisch.
- Fünfstufiger Assistent mit dynamischen Klassen-/Fachnamen, bevorzugtem Listenimport, kompakter Schülertabelle und Inline-Bearbeitung. Grundeinstellungen getrennt von letzter Überprüfungsseite; einfache Standardgewichtung erst nach Wunsch bearbeiten, Gegenanteile unmittelbar sichtbar. Erweiterte Vorgaben unverändert geschützt.
- Gemeinsamer Schutz bei Escape, X, Einrichtung beenden und Programm-Schließanfrage. Fortsetzen und Escape der Bestätigung bewahren Eingaben, Auswahl, Fokus und Scrollposition. Erst ausdrückliches Verwerfen beendet den Entwurf; ausgefüllte Klassen benötigen ebenfalls Bestätigung. Wiederholtes Escape wird vor der nativen Dialogschließung behandelt. Keine Teildatenspeicherung; bestehende atomare Abschlusstransaktion erhalten.
- Schnellzugriff standardmäßig bei neuen Datenbeständen, einschließlich Ersteinrichtung. Gespeicherte Darstellungen und ältere implizite Auswahlfelder bleiben erhalten; vollständige Auswahl und Darstellungswechsel bestehen weiter.
- Neue Domänen-, produktive C#-Speicher-, Chromium-/axe-/Tastatur-/Zoom- und unabhängige Office-/PDF-/Druckregressionen. Tatsächliche Windows-/NVDA-/Microsoft-Office-/Druckabnahme bleibt gesondert erforderlich.

# Notenblick 1.16.0

- TXT-Notfalllisten: Halbjahres- und Zeugnisnote immer sichtbar, offene Werte als „–“, genau ein berechneter Gesamtdurchschnitt pro Schüler. Gewichtungen, Bemerkungen, ehemalige Schüler und historische Noten erhalten; lesbare Übersichten auch ohne Leistungen. Zusätzliche eindeutige Windows-kompatible TXT-Dateien unter „Schülernoten“ für jeden Fachschüler.
- TXT-Aktualisierung prüft tatsächliche Inhalte und liest geschriebene Dateien zurück. SHA-Verzeichnis unterscheidet vollständig/unterbrochen. Fehlende oder geänderte Listen werden sicher erneuert, alte Dateien erst danach und nur bei nachgewiesen unverändertem eigenen Inhalt bereinigt. TXT-only-Wiederholung verändert gespeicherte JSON-Noten nicht.
- Verwaltung: einheitliche H2/Aktionen/Auswahl/Tabelle, kompakte Klassen/Fächer mit direkten Verweisen, getrenntes Arbeitsjahr in der Statusspalte, verständliche Bestätigungen und natürliche Teilnahmebegriffe. Bestehende Zuordnungen und interne Statuswerte bleiben erhalten.
- Ersteinrichtung: Willkommen nur bei wirklich neuen Daten; vier Schritte für beliebig mehrere Klassen, Fächer und Schülerlisten mit Importvorschau, Dublettenprüfung und Fachteilnahme. Zurück/Abbruch ohne Teilspeicherung. Gemeinsame validierte Veröffentlichung mit wiederholbaren Speicherfehlern und initialer Einstellungswiederherstellung.
- Abschlussnoten: sichtbaren Tastaturhinweis entfernt; Strg+Enter bleibt erhalten und in der Hilfe erklärt. Auswahlfelder nennen zentral Schüler und vorhandenen passenden Durchschnitt, ohne zusätzliche Live-Region. Native Enter-/Pfeiltastenbedienung bleibt erhalten.
- Versionierte Struktur-, Browser-/axe-, Speicher-/Fehler-/Update-Regressionen ergänzt. Rechenmodule, atomarer C#-Speicherkern, Exporte und portable Struktur bleiben erhalten. Tatsächliche Windows-/NVDA-/Office-Abnahme weiterhin gesondert erforderlich.

# Notenblick 1.15.0 – Abschlussnoten einfacher bedienen

- „Halbjahresausgabe festlegen“ mit Klassen-/Jahreskontext und dynamisch zugeordneter Erklärung; Einstellungen und Bestandsnotenschutz bleiben erhalten.
- Einheitliche Einzel-/Klassendialoge mit kurzen Überschriften, Fach/Klasse/Jahr und Zeitraum; Schülername als H3, Durchschnitt und Vorschlag kompakt nebeneinander, wichtigste Noteneingabe darunter.
- Viertelnoten ausschließlich numerisch mit zwei Nachkommastellen in Auswahl, Übersicht, Schüleransicht und sämtlichen Exporten/Notenlisten; gespeicherte Werte und exakte Rechnung unverändert.
- „Offene Vorschläge übernehmen“ schützt gespeicherte und bewusst bearbeitete Eingaben. Klassenstatus ohne häufige Live-Ansagen; Tabelle über „Noten der Klasse“ beschriftet, ohne zusätzliche Region.
- Kompakte Notenauswahl, breite Namensspalte, dezent hervorgehobene Eingabespalte und fixierte Tabellenköpfe; horizontales und vertikales Scrollen bleiben möglich.
- Strg+Enter führt nach geschlossener Auswahlliste zum nächsten sichtbaren Schüler, ohne Speicherung. Enter/Pfeile/Maus/Tab behalten ihre native Funktion; kein Fokuswechsel allein durch Wertänderung. Automatische Enter-Navigation ist mangels tatsächlicher Windows-/NVDA-Abnahme nicht aktiviert.
- Anfangsfokus direkt auf erste offene Note; keine vorangehende Fokussierung eines anderen Notenfelds. Escape/Abbrechen, Fehlerfokus und Rückkehrfokus bleiben erhalten.
- Neue Struktur-/Browserregressionen und erweiterte unabhängige Export-/Updateprüfungen; keine Migration oder Änderung am produktiven Speicherkern.

# Notenblick 1.14.0 – Abschlussnoten

- Ausgabe zum Halbjahr einmal je Klasse/Schuljahr festlegen: Viertelnoten oder ganze Noten; spätere Änderungen lassen Bestandsnoten unverändert.
- „Abschlussnoten“ über der Notenübersicht: vollständige Klassenliste, Vorschläge nur für unberührte leere Felder, Filter für offene Noten und gemeinsames Speichern.
- Zwei feste Ergebnisspalten und drei Schülerkarten; derselbe Dialog für Einzel- und Klassenbearbeitung mit nativer Notenauswahl, Bemerkung und nachvollziehbaren gespeicherten Informationen.
- Exakte rationale Vorschläge ohne Doppelrundung; Halbjahr nach Leistungsdatum bis 31. Januar. Neue Leistungen ab Februar werden automatisch dem zweiten Halbjahr zugeordnet.
- Festgelegte Noten einschließlich damaligem Durchschnitt, Zeitraum und Datum bleiben unabhängig von späteren Leistungs-/Gewichtsänderungen erhalten.
- Historische Abschnittsnoten und abweichende frühere Zeugniswerte bleiben erhalten und gezielt korrigierbar; Prüfungs-/Abschlussnoten in Abschlussklassen werden manuell entschieden.
- Atomare Speicherung über den vorhandenen Speicherkern; Dialogentwürfe bleiben bei Fehlern erhalten. JSON-Sicherungen, TXT-Listen sowie Word/PDF/Excel/Text/CSV/Druck vollständig ergänzt.
- Automatische Rechen-, Kompatibilitäts-, native Speicher-, Browser-/Tastatur-/axe- und unabhängige Exportprüfungen ergänzt. Tatsächliche Windows-/NVDA-Abnahme bleibt gesondert erforderlich.

# Notenblick 1.13.0

- Schülerexport: beide Ausgabeoptionen haben eine sichtbare, dynamisch zugeordnete Erklärung. Die tatsächliche ZIP-Berichtszahl bleibt erhalten; kein zusätzlicher Live-Bereich oder Fokuswechsel.
- Drucken: vorhandene A4-Ausrichtung aus der gemeinsamen Seitenplanung, ausdrücklicher Aufruf der WebView2-Browser-Druckvorschau, Fallback für ältere Laufzeiten und kurze Empfehlung im Exportdialog. Druckvorschau und Druckerauswahl bleiben erhalten; keine stille Ausgabe. ShowPrintUI kann keine PrintSettings entgegennehmen, deshalb bleibt die tatsächliche Windows-Vorbelegung manuell zu prüfen.
- Klassendurchschnitt als dezente letzte Ergebniszeile in passenden Klassen-Notenübersichten in Word, PDF, Druck, Excel, CSV und Text. Gemeinsame zentrale Grundlage mit der Bildschirmansicht: alle aktiven Fachteilnehmer, unabhängig von Suche und Exportumfang; fehlende Noten bleiben fehlend, Zeugnisnote bleibt „–“. Grundlage wird erklärt; Excel enthält echte Zahlen, CSV weiterhin genau eine Kopfzeile.
- Ergebniszeile bleibt nach Möglichkeit beim letzten Schüler; wiederholte Tabellenköpfe und statische Fortsetzungsköpfe bleiben erhalten. Unveränderte sichere PAGE-/NUMPAGES-Felder, keine globale Word-Feldaktualisierung oder externen Verknüpfungen.
- Gezielte Regressions-, Update-, Accessibility-, Schema-, PDF/UA- und Renderprüfungen ergänzt. Keine Änderung am Notendatenformat, den mathematischen Domänenmodulen oder der produktiven Datenspeicherung. Windows/WebView2/Office/NVDA und physischer Druck bleiben gesonderte manuelle Abnahmen.

# Notenblick 1.12.0

- Schüleransicht: ausgewählten Schüler oder alle aktiven Schüler einzeln exportieren. PDF, Word, Excel, Text oder CSV werden pro Schüler als eigene Datei in einem ZIP gespeichert. Ausgeschiedene Schüler nur auf Wunsch; historische Fachzuordnungen bleiben erhalten.
- Exportdialog: einheitliche Reihenfolge, dynamische Erklärung der Anordnung, tatsächliche Berichtszahl, gedrosselter Fortschritt und sicherer Abbruch. Die sechs bisherigen Einzelexporte bleiben erhalten.
- Dokumente: dezente Fortsetzungsköpfe mit Fach, Klasse und Schuljahr, sichere lokale Seitenzahlen sowie etwas deutlicheres Gesamtergebnis. Wiederholte Tabellenköpfe mit tatsächlich gerenderten Fortsetzungsseiten geprüft.
- ZIP-Erstellung und native Speicherung: eindeutige Windows-Dateinamen, CRC-/Inhaltsprüfung jedes Eintrags, ein Format pro Archiv, 64-MiB-Grenze, atomare Speicherung und Bereinigung temporärer Dateien. Keine Änderung an Notenberechnung oder Datenformat.
- Vollständige Open-XML-, PDF/UA-, Browser-, Speicher- und Regressionstests erweitert. Microsoft-Office-, Windows-, NVDA- und physische Druckabnahme bleiben gesondert erforderlich.

# Notenblick 1.11.0

- Word erzwingt beim Öffnen keine globale Feldaktualisierung mehr. Lokale PAGE-/NUMPAGES-Felder bleiben erhalten; keine externen Beziehungen. Fehlerhafte OOXML-Reihenfolgen und fehlende Pflichtattribute korrigiert, vollständige SDK-Schemavalidierung ergänzt.
- Gemeinsame inhaltsabhängige Seiten- und Spaltenplanung für Word, PDF und Druck: zuerst lesbares Hochformat, dann Querformat, 10 beziehungsweise mindestens 9 Punkt. Übliche sieben bis zehn Spalten bleiben zusammen; erst tatsächlicher Platzmangel erzeugt eindeutig bezeichnete Teile mit wiederholten Schülernamen. Excel und CSV behalten sämtliche zusammengehörigen Spalten.
- Kompaktere Word-Zeilen ohne überflüssige Abschlussabsätze; keine dadurch verursachte leere Schlussseite. Lange Bemerkungen bleiben vollständig und eindeutig zugeordnet.
- Exportumfang heißt einheitlich „Mit aktuellen Filtern“ oder „Alle Einträge“. Dynamische Erklärung nennt die tatsächlichen Schüler, Leistungen oder Einzelnoten unabhängig von der Bildschirmseite. Druck, PDF und Word zeigen das automatisch bestimmte A4-Seitenformat.
- Erstellen, Speichern und nicht erreichbare Speicherorte erhalten unterschiedliche sichere Fehlermeldungen. Bewusster Abbruch ist fehlerfrei; ein abgebrochener Export erzeugt keinen verspäteten Download und beeinflusst keinen späteren Dialog. Native Speicherdialoge besitzen keinen zweiminütigen Bedienungs-Timeout.
- Native Office-Dateiprüfung untersucht ZIP-Inhalt, CRC, XML und lokale Paketbeziehungen vor atomarer Speicherung. Keine zusätzlichen Laufzeitprogramme, keine Office-Installation und kein Internet für Exporte erforderlich.
- Versionszeile unverändert dezent. Der einmalig gemeldete Effekt darunter war unter Chromium nicht reproduzierbar. Bei extremer Vergrößerung wurde ein unabhängig gefundener Überlauf des Programmkopfs korrigiert.
- Berechnungs- und Speicherkern unverändert; keine Migration. Update von 1.10.0, Sicherung und Wiederherstellung werden mit synthetischen Daten geprüft.

## Update auf 1.11.0

Notenblick schließen. Nur Notenblick.exe und den vollständigen Ordner Programm ersetzen. Daten mit Noten, Ansicht.json, Sicherungen und Notenlisten vollständig erhalten.

Prüfergebnisse und offene tatsächliche Windows-/Word-/NVDA-Abnahme: docs/PRUEFBERICHT-1.11.0.md. Bis zu dieser Abnahme Entwicklungskandidat.

---

# Notenblick 1.10.0

- Einheitliche H2-Überschriften und gemeinsame responsive Aktionsleisten in allen Notenansichten; Hauptaktion links, Exportieren rechts. Suche bleibt sichtbar, seltene Optionen unter Ansicht anpassen.
- Dezente Versionsanzeige unten auf Start. Anwendung, Starter und Paketmetadaten beziehen die Version aus package.json.
- Ein kontextbezogener Exportdialog für Notenübersicht, Leistungsarten, mündliche Klassenübersicht/Einzelnoten, allgemeine Leistungsliste und einzelne Schüler. Aktuelle Auswahl oder alle Einträge über sämtliche Bildschirmseiten; Bemerkungen optional.
- Echte Offline-Dateien für PDF, Word und Excel zusätzlich zu Druck, TXT und CSV. Gemeinsames grünes Notenblick-Layout, semantische Word-Überschriften, strukturierte PDF-Tabellen und typisierte Excel-Zellen. Schülerberichte trennen berechnete Durchschnitte von manuellen Zeugnisnoten.
- Vollständige breite Tabellen in Spaltengruppen für Druck, Word und PDF. Lange Bemerkungen als zugeordnete Absätze. Druckinhalt bleibt bis zum Abschluss des Druckvorgangs erhalten.
- Binärdateien werden unverändert über den Windows-Speicherdialog atomar geschrieben; Abbruch erhält die Auswahl. CSV-Injection-Schutz erweitert, sichere begrenzte Dateinamen.
- Berechnungen und Datenformat unverändert; keine Migration, keine doppelten Noten. Automatische TXT-Notenlisten bleiben erhalten.

## Update auf 1.10.0

Notenblick schließen. Nur Notenblick.exe und den vollständigen Ordner Programm ersetzen. Den vorhandenen Ordner Daten einschließlich Noten, Ansicht.json, Sicherungen und Notenlisten unverändert behalten. Keine Office-Installation oder Netzwerkverbindung zur Dateierstellung erforderlich.

Automatisierte und tatsächliche manuelle Prüfungen sowie offene Windows-/NVDA-Abnahme stehen in docs/PRUEFBERICHT-1.10.0.md und docs/EXPORT-PRUEFUNG.md. Bis zur Windows-/NVDA-Abnahme Entwicklungskandidat.

---

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
