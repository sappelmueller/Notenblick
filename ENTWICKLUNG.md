# Notenblick 1.10.0 – Projekt und Erstellung

## Aufbau und zentrale Funktionen

`src/domain` enthält Validierung, exakte rationale Berechnung, Namensimport, Übernahmen, Altbestandsmigration und TXT-Export. `src/app` enthält gemeinsame Navigation, Ansichten, Fokus, Datumseingabe, Speicherung und Komponenten. `src/views` und `src/dialogs` verwenden diese Funktionen. `native` enthält den Windows-Starter, WebView2-Fenster, atomare Speicherung, Sperren und kontrollierte Migration. Es gibt weiterhin nur eine Leistungsverwaltung und einen Berechnungskern.

Das Format bleibt `notenraum`, Version 1. Vorhandene Kennungen, Schüler, Klassen, Fächer, Leistungen, Noten, Faktoren, Status und manuelle Zeugnisnoten bleiben erhalten. `NR.ACTIVE_VERSIONS` erkennt 1.3.0 bis 1.10.0; ein Update aus 1.9.0 braucht keine fachliche Migration. Ein reiner Programmstart schreibt vorhandene Noten nicht um.

`NR.calculateCore()` führt beide Berechnungsarten mit rationalen Zahlen aus. Fehlt `calculationMode`, gilt unverändert `grouped`. Dann entstehen zunächst Schriftlich aus Klassenarbeiten/Tests und anschließend der Gesamtdurchschnitt aus den Gesamtanteilen. Bei `direct` stehen die fünf Leistungsarten direkt in `weights.overall`. `weights.written` bleibt als historische Einstellung vorhanden. Standard ist weiterhin 50:50 mit 80:20 innerhalb Schriftlich. Fehlende Arten und Anteile 0 werden nicht als Nullnoten berücksichtigt. Nur die Anzeige wird gerundet/gekürzt. Manuelle Zeugnisnoten bleiben unabhängig.

Die Notentabelle und Leistungsliste verwenden dieselben Datensätze. Die Matrix enthält höchstens acht Leistungsspalten je Abschnitt; ihr Durchschnitt umfasst alle Leistungen der Art. Die bestehende Eingabe darunter heißt „Noteneingabe“ mit „Alle Schüler | Einzeln“. „Eingabe schließen“ entfernt den Arbeitsbereich in beiden Darstellungen und stellt Auswahl, Fokus und möglichst Scrollposition wieder her. Offene Eingaben werden zuerst validiert und übernommen. Schüleransichten verwenden dieselben zentralen Ergebnisse und dieselben Zeilenrenderer; historische Noten werden bei Bedarf geladen.

`participantIds` legt bei gezielten Leistungen ausdrücklich die Beteiligten fest. Ohne diese Eigenschaft bleibt das bisherige Klassenverhalten bestehen. Neue schnelle mündliche Einzelnoten betreffen genau eine Person. Validator, Fortschritt, Eingabe, Matrix, Schüleransicht und Export verwenden dieselbe Zuordnung; alte mehrdeutige Leistungen werden nicht automatisch umgedeutet.

## Startseite und mündliche Erfassungsart

`views/home.js` verwendet dieselben `courseChoices`, `shortcutChoices` und `quickLinks` wie die bisherige Fachauswahl. Offene Aufgaben verwenden `NR.assessmentProgress` und berücksichtigen aktive Teilnahme und ausdrücklich gesetzte Statusangaben. Höchstens fünf echte offene Klassen-/Gruppenleistungen erscheinen. Individuelle sowie nicht eindeutig zugeordnete alte mündliche Einträge werden nicht als offene Klassenaufgaben ausgegeben. Geschlossene Schuljahre und ausgeblendete Klassen/Fächer erzeugen keine Aufgaben.

Die optionale Eigenschaft `oralEntry` eines mündlichen Leistungsdatensatzes hat ausschließlich die Werte `individual` oder `class`. Sie ist eine Erfassungsinformation, kein weiterer Notendatensatz. Neue schnelle Einzelnoten erhalten `individual` und genau eine `participantIds`-Kennung. Allgemein angelegte mündliche Leistungen erhalten `class`, auch bei nur einem Teilnehmer. Ohne die neue Eigenschaft bleibt der Altbestand unverändert und wird als ungeklärt behandelt. Die Teilnehmerzahl allein beweist keine Erfassungsart. Es gibt deshalb keine automatische fachliche Migration beim Start.

`domain/oral.js` enthält Erkennungs-/Validierungshilfen, ausdrückliche Zuordnung und gemeinsamen Erfassungsstand. `views/oral.js` erzeugt die Einzelnoten-Zeilen direkt aus denselben Bewertungen. Klassenmatrix und Einzelnotenansicht teilen die bisherigen Ansichts- und Navigationskomponenten. Die Klassenmatrix zeigt keine expliziten Einzelnotenspalten; ihr mündlicher Durchschnitt berücksichtigt weiterhin sämtliche Noten dieser Art. Die Berechnungsformeln wurden nicht verändert.

Die alltägliche mündliche Oberfläche enthält keine Altbestandshinweise. Bei unklaren älteren Einträgen bietet ausschließlich Sicherung → Wiederherstellen → Mündliche Altbestände eine gezielte Prüfung je Fach. `dialogs/oral-review.js` erlaubt nur ausdrücklich ausgewählte Zuordnungen. Individuell kann ein Altbestand nur zugeordnet werden, wenn seine vorhandenen Teilnehmer und Einträge sicher einem Schüler zugeordnet werden können. Vorher erzeugt `FolderStore.protect` eine vollständige geprüfte JSON-Schutzkopie einschließlich Ansichtseinstellungen in Sicherungen. Fehlgeschlagene Sicherung blockiert jede Übernahme. Die Schutzkopie ist in der normalen Wiederherstellung erreichbar und von der automatischen Bereinigung ausgenommen. Beim zusätzlichen Browser-Testbetrieb wird zuvor im vorhandenen Sitzungszustand gesichert und eine vollständige JSON-Datei angeboten. Originalnoten und Faktoren bleiben erhalten.

`settings.startupView` ist `last` (Standard) oder `home`. Mündliche Ansicht, Suche, Schülerfilter, Sortierung, Seite und Fokuskennung stehen in den vorhandenen fachbezogenen Workspaces in Ansicht.json. Es gibt keine zweite globale Einstellung zur mündlichen Ansicht. Die Datenbank und die zentrale Notendatei werden nicht aufgeteilt.

Die Auswahl „Ansicht: Klassenübersicht | Einzelnoten“ steht unter H2 „Mündliche Noten“. Jeweils eine Hauptaktion gehört zur aktiven Fläche. „Ansicht anpassen“ ist zunächst geschlossen; in der Klassenübersicht enthält es Notentabelle/Leistungsliste, bei Einzelnoten Schülerfilter und Sortierung. Die Einzelnotensuche berücksichtigt Vorname, Nachname, beide Namensdarstellungen und Leistungsbezeichnung. Sechs Spalten trennen Datum und Bezeichnung. Umfangreiche Bemerkungen bleiben über details vollständig erreichbar.

Die fachbezogenen Workspace-Felder `oralAreaView`, `oralClassSearch` und `oralListSearch` trennen mündliche Darstellung und Klassensuchen von `settings.areaView`, `search` und `assessmentSearch`. Vorhandene Einstellungen werden beim Lesen in Ansicht.json sinnvoll übernommen, ohne Noten umzuschreiben. `oralView`, `oralSearch`, `oralStudent`, `oralSort`, `oralPage` und `oralFocusId` bleiben die bisherige einzige Steuerung der Einzelnoten. Es gibt keine neue globale Standardansicht. `lastNotesCourse` hält das zuletzt tatsächlich unter Noten geöffnete Fach fest; Weiterarbeiten kennzeichnet historische Schuljahre und nutzt die vorhandene Fachnavigation.

Der gemeinsame Dialog unterstützt `small`, `medium` und `wide`. Sein Inhalt scrollt vertikal, Kopf und Aktionen bleiben erreichbar. Bei sehr geringer Fensterhöhe scrollt der gesamte Dialog. Ein zusätzlicher Fokusstop wird nur bei tatsächlich scrollbarem Inhalt ohne erreichbare Steuerelemente gesetzt. Nachkommastellen und Verfahren stehen unmittelbar im gemeinsamen Gewichtungseditor; interne Kennung `truncate` und exakte Berechnung bleiben unverändert.

## Gewichtungseditor und Vorgaben

`app/weight-editor.js` erzeugt und bindet die gemeinsamen Prozentfelder für vorhandene Fächer und Vorgaben. `dialogs/weights.js` ergänzt den vorhandenen Fachdialog mit vollständigem Vergleich und Übernahme innerhalb desselben Dialogs. Es gibt keine zweite Gewichtungsverwaltung oder zweite Berechnung.

Prozentfelder sind normale HTML-Texteingaben mit dem standardisierten ARIA-Drehfeldmuster. Dies verhindert den tatsächlich reproduzierten Chromium-Fehler, bei dem eine deutsche Kommaeingabe im nativen number-Feld zu einem anderen Wert wird. Komma und Punkt werden zentral validiert. Pfeil hoch/runter ändern exakt fünf Prozentpunkte, Pos1/Ende setzen 0/100; Auswahltasten mit Umschalt/Steuerung bleiben für die Textbearbeitung erhalten. `aria-valuenow`, Grenzen und eine kurze lokalisierte Wertdarstellung werden synchron gehalten; bei ungültiger Eingabe wird kein erfundener Zahlenwert angesagt. Keine zusätzlichen Plus-/Minus-Schalter und keine zusätzlichen Live-Regionen.

Gegenwerte werden nur für Klassenarbeiten/Tests und für Schriftlich/Mündlich bei gleichzeitig 0 % Hausaufgaben/Heftführung ergänzt. Komplexere Verteilungen bleiben unverändert. Summen zeigen den Gesamtwert und fehlende beziehungsweise überzählige Anteile; vorhandene Dezimalgewichte werden nicht auf Fünferschritte gerundet.

`domain/weighting.js` rechnet Gewichtsmodelle rational um. Gruppenanteil × Anteil innerhalb Schriftlich ergibt den direkten Anteil; die inverse Umrechnung bildet die Summe und anschließend das Verhältnis. Nicht ohne mehr als vier Nachkommastellen darstellbare Prozentwerte verlangen eine ausdrückliche Entscheidung über gerundete Werte. Das Verfahren erhält die Summe 100 %; gespeicherte Daten bleiben bis „Speichern“ unverändert. Bei schriftlichem Anteil 0 bleibt die bisherige innere Verteilung erhalten, weil sie nicht bestimmbar und für die Gesamtnote wirkungslos ist. Ein kurzer Hinweis erklärt diesen Fall.

Der Vergleich verwendet `NR.calculate` für alle zugeordneten Schüler einschließlich ausgeschiedener Schüler. Unveränderte Zeilen werden niemals ausgeblendet. Vorherige Werte werden aus dem vorhandenen Berechnungscache gelesen; Entwurfswerte werden ohne Änderung des Datenbestands berechnet. Anzeigeänderungen und Unterschiede unterhalb der gewählten Anzeigegenauigkeit werden nachvollziehbar gekennzeichnet.

„Aus anderem Fach übernehmen“ füllt nur den Entwurf. Berechnungsart und Prozentwerte werden standardmäßig übernommen; Nachkommastellen und Rundung bleiben erhalten, solange das entsprechende Kontrollkästchen nicht ausdrücklich gesetzt wird. Vor dem Ersetzen bereits geänderter Felder gibt es eine Bestätigung innerhalb des Dialogs. Escape schließt zunächst diese Bestätigung beziehungsweise den Übernahmebereich. Erst der abschließende Speichern-Schalter übernimmt die Gewichtung.

Abgeschlossene Schuljahre und ausgeblendete Klassen/Fächer sind nur lesbar. Der gleiche Schutz gilt in Noten, Verwaltung und Einstellungen sowie beim Altbestandszugang. Vor dem Speichern wird die Bearbeitbarkeit erneut geprüft. Die frühere Freigabe für abgeschlossene Testklassen aus 1.6.0 ist entsprechend dem Auftrag 1.7.0 aufgehoben.

## Einstellungen und portable Ablage

Nur `Ansicht.json/settings` ist für Darstellung, Sortierung und allgemeine Vorgaben maßgeblich. `defaultCalculationMode` und `defaultWeights` ergänzen dort die bestehenden Werte `defaultPrecision` und `defaultRounding`. „Vorgaben speichern“ bestätigt den gesamten Entwurf; geänderte Vorgaben werden vor einem Navigationswechsel geschützt. Sie wirken nur über `newCourseConfig()` beim erstmaligen Einrichten und beim Anlegen eines neuen Fachs. Fach-/Klassenübernahmen behalten ausdrücklich ihre Quellkonfiguration. Bestehende Fächer werden nicht angepasst.

Die Auswahl des vorhandenen Fachs unter Notenberechnung berücksichtigt alle Schuljahre, Klassen und Fächer. `weightClass`/`weightCourse` sind reine Navigationseinstellungen und verändern nicht den täglichen Noten-Kontext. Beide Zugänge öffnen denselben Fachdialog.

Die Auslieferung enthält ausschließlich `Notenblick/Notenblick.exe` und `Notenblick/Programm`. `Daten` wird beim ersten Start daneben angelegt:

- `notenverwaltung.json`: vollständiger zentraler Datenbestand.
- `Ansicht.json`: Darstellung, Navigation, Arbeitsjahr, letzte Auswahlen und allgemeine Vorgaben.
- `Sicherungen`: automatische und geschützte Wiederherstellungspunkte.
- `Notenlisten`: lesbare TXT-Dateien nach Schuljahr, Klasse, Fach und Leistungsart.

Vollständige JSON-Sicherungen enthalten zusätzlich eine Momentaufnahme der benötigten Ansichtseinstellungen. Reine Navigation und Vorgabenänderungen erzeugen keine Notenrevision oder vollständige Notensicherung. Beim Update die Anwendung schließen und ausschließlich EXE und den vollständigen Ordner Programm ersetzen; Daten behalten. Zum Umziehen den gesamten geschlossenen Programmordner einschließlich Daten kopieren.

## Speicherung, Schutz und Kompatibilität

Temporäre Dateien werden geschrieben, geflusht und geprüft; erst danach wird atomar ersetzt. Validierung prüft Kennungen, Beziehungen und fachliche Werte. Datenordnersperre sowie Daten-ID/Commit-ID verhindern konkurrierende Änderungen. Beschädigte Dateien werden nicht durch leere Daten ersetzt. Die Grenze bleibt 256 MiB je Datei. Die letzten 30 Stände plus tägliche, wöchentliche und ältere jährliche Wiederherstellungspunkte bleiben erhalten; geschützte Vorher-Stände werden nicht automatisch gelöscht. Caches vermeiden erneutes vollständiges Einlesen unveränderter Wiederherstellungspunkte und unnötige TXT-Berechnungen.

Frühere Ablagen `Datensicherung/Daten/notenverwaltung.json` und flache Altordner werden weiter erkannt. Vor einer notwendigen Migration entsteht ein vollständiges geprüftes ZIP mit Prüfsummen; Kopieren und Aktivieren sind kontrolliert, Ursprungsdateien bleiben erhalten. Mehrdeutige Bestände verlangen eine Auswahl. Alte „Sonstige Leistungen“ bleiben ausschließlich im gesicherten Altbestand, niemals als neue aktive Leistungsart. Ihre ausdrücklich bestätigte Übernahme bleibt nachvollziehbar; in abgeschlossenen Schuljahren ist nur die Archivansicht erreichbar.

1.8.0-Daten und frühere unterstützte Stände bleiben unverändert nutzbar. Die Quellen des alten 1.5.0-Validators unter `tests/compat150` dienen nur dem Regressionstest: Er lehnt direkte Gewichte sicher ab. Diese Testquellen gehören nicht zur Programmausgabe.

## Build und Prüfungen

Python 3 und .NET SDK ab Version 8 werden zum Erstellen benötigt. `NOTENBLICK_DOTNET` kann den Pfad zu dotnet festlegen. Die benötigten .NET-Framework-4.8-Referenzen, WebView2 SDK 1.0.2903.40 und Newtonsoft.Json 13.0.3 samt Lizenzen sind enthalten. Die Windows-Ausgabe verwendet net45/net462, der Linux-Testhost die net6.0-Ausgabe von Newtonsoft.Json. Für den Programm-Build ist kein Paketdownload notwendig.

```text
python dev/build.py
python dev/compile.py
python dev/package.py
```

Der Paketbau prüft vollständige Dateien, Verweise, SHA-256-Liste und AnyCPU-Flags. Der Starter prüft alle Dateien vor dem Laden; fehlende, geänderte, zusätzliche oder verknüpfte Programminhalte werden abgelehnt. Die begrenzte Assembly-Ladelösung bleibt erhalten, ohne Root-Konfigurationsdatei oder Änderungen an Windows-Sicherheitszonen.

Node-Testabhängigkeiten stehen in package.json und gehören nicht zur Programmausgabe. `npm install` richtet die Tests ein. Für Browserprüfungen wird Chromium benötigt; `NOTENBLICK_CHROMIUM` kann den Pfad festlegen. Für native Linux-Tests wird .NET 8 verwendet.

```text
python dev/test-native.py
npm test
node tests/view-storage.cjs
node tests/v150-storage.cjs
node tests/v160-storage.cjs
node tests/v170-storage.cjs
node tests/v180-storage.cjs
node tests/v190.cjs
node tests/v190-storage.cjs
node tests/workflow.cjs
node --max-old-space-size=4096 tests/large.cjs
python tests/loader.py
npm run test:browser
```

Den nativen Testhost nicht während laufender Speichertests neu erstellen. Ergebnisdateien und Einzeltests sind enthalten. Tatsächliche Prüfumgebung und Grenzen stehen in PRUEFBERICHT.md.

## Windows-Voraussetzungen und Grenzen

Wie bisher werden .NET Framework 4.8 und eine installierte Microsoft-WebView2-Laufzeit benötigt. Verwaltete Bibliotheken sowie WebView2-Loader für x86, x64 und arm64 sind enthalten. Die Anwendung arbeitet lokal ohne Server oder Internet; Host und Content-Security-Policy blockieren externe Ressourcen. Der Enginecache unter LocalAppData ist keine maßgebliche Datenablage.

Es liegt kein Codesignierungszertifikat vor. SmartScreen und Windows-Sicherheitsmechanismen werden nicht umgangen. Linux-.NET-, Chromium-, ARIA- und axe-Prüfungen ersetzen keinen ausgeführten Windows-Start und keinen tatsächlichen NVDA-Livetest.

## Gemeinsame Berichte und Version

`package.json` ist die verbindliche Programmversion. Der Build erzeugt daraus `version.js`, Starter-/Bibliotheksattribute und Windows-Manifest. `src/exports/report.js` erzeugt unveränderliche Berichtszellen aus denselben Daten und zentralen NR-Berechnungen wie die Oberfläche. Text/CSV, semantisches Druck-HTML, DOCX, XLSX und strukturierte PDF verwenden diese Grundlage. Filter werden aus einer Kopie der aktuellen Ansicht gelesen; Bildschirmpaginierung beschränkt den Export nicht. Lange Bemerkungen erhalten in Dokumenten Absätze mit Bezug zu Datum, Schüler und Leistung. Breite Matrizen teilen Druck, Word und PDF in Spaltengruppen mit wiederholten Namen. Excel bewahrt die breite Tabelle mit fixierter Namensspalte.

PDFKit 0.20.2 (MIT) und DejaVu-Schriften werden lokal mitgeliefert und über `dev/export-assets-lock.json` gesperrt. Es gibt keine neuen Laufzeitprozesse, Office-Abhängigkeiten oder Netzwerkdienste. DOCX/XLSX entstehen mit einem kleinen zentralen OOXML-/ZIP-Schreiber. `native/ExportFiles.cs` verarbeitet Binärdaten, prüft Format und Größe und schreibt atomar nach bestätigtem Windows-Speicherdialog. Bestehende JSON-/TXT-Sicherungswege bleiben erhalten.
