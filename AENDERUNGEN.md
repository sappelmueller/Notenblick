# Änderungen

## 1.25.1 – 4. November 2026

- Bei aktivierter Startprüfung einmal pro Programmstart nach Aktualisierungen suchen. Die bisherige 24-Stunden-Sperre entfällt, auch nach fehlgeschlagenen Prüfungen. Manuelle und automatische Anfragen werden zusammengeführt.
- Neue Versionen erscheinen unmittelbar auf der bereits geöffneten Startseite. Automatische Prüfungen bleiben ohne Ansage oder Fokuswechsel; gespeicherte Hinweise und versionsbezogenes Ausblenden bleiben erhalten.
- Einheitliche Bestätigung von Startseite und Einstellungen: „Notenblick X.Y.Z installieren?“, „Abbrechen“ und „Aktualisierung starten“. Nur diese Bestätigung verzichtet auf den oberen Schließen-Schalter. Die Neuerungenansicht zeigt ausschließlich die tatsächlichen Neuerungen.
- Hilfe und Hinweise zu bereits gefundenen Versionen aktualisiert. Sicherheitsprüfung, Installation, Wiederherstellung und Schutz von Daten bleiben erhalten.

Nach erfolgreicher Windows-Praxisabnahme ausdrücklich zur Veröffentlichung freigegeben. Die getesteten Programmdateien und das Windows-ZIP werden unverändert übernommen. [Prüfstand](docs/PRUEFBERICHT-1.25.1.md).

## 1.25.0 – 4. November 2026

- Navigation, Auswahlfelder und Schülerübersichten passen sich bei starker Vergrößerung besser an. Kontrollfelder, Dialoge, Fokus und Rückmeldungen verwenden gemeinsame Regeln.
- Aktionsmenüs nennen die zugehörige Zeile, bleiben im Fenster und verändern die Tabellenbreite nicht mehr.
- Automatische Sicherungsbereinigung entfernt nur nachweislich eigene, unveränderte Speicherstände. Fremde, veränderte und nach einem Abbruch verbliebene Dateien werden erhalten; Zugriffsfehler beim Wiederherstellen werden verständlich gemeldet.
- Die Hilfe erklärt die freiwillige Aktualisierung im Programm. Das Datenformat und die exakte Notenberechnung bleiben erhalten.
- Die Testverwaltung aus Phase 1 wird vollständig verwendet. Ein Fehler bei der Erkennung eingebauter Node-Module wurde behoben, damit Protokolle gültige Nachweise nicht entwerten.

Nach erfolgreichem Qualitätsaudit und bestätigter Windows-Praxisabnahme auf x86 und ARM ausdrücklich freigegeben. Das geprüfte Programm wird unverändert veröffentlicht; die Aktualisierungsdatei ist ausschließlich für diese Version freigegeben. [Prüfstand](docs/PRUEFBERICHT-1.25.0.md).

## 1.24.0 – 3. November 2026

- Notenblick startet maximiert; Fenster lassen sich weiterhin verkleinern und wiederherstellen.
- Fach- und Registerkurzbefehle bestätigen den Bereich zuverlässiger. Die doppelte Fachansage beim Wechsel aus anderen Hauptbereichen wird gezielt vermieden.
- Neue Versionen lassen sich im Programm finden und nach Zustimmung installieren. Die Prüfung beim Start ist freiwillig und zunächst ausgeschaltet.
- Neuerungen stehen kurz im Programm. Hinweise können für eine Sitzung oder genau diese Version ausgeblendet werden.
- Die GitHub-Seite erklärt Funktionen, Downloads und Datensicherung übersichtlicher.

Enthält die Zwischenentwicklung 1.23.3. Aktualisierungsprüfung unter Windows bestätigt; klare Rückmeldungen, kopierbare Fehlerdetails, versionsbezogene Hinweise und Fokus auf Weiterarbeiten ergänzt. „Deine Version“ und nebeneinander ausgerichtete Kontrollfelder schließen die Oberfläche ab.

Auf ausdrücklichen Wunsch mit gezielten Abschlussprüfungen veröffentlicht; kein erneuter vollständiger Release-Testlauf. Automatische Windows-Installation und Wiederherstellung bleiben praktisch offen. [Prüfumfang](docs/PRUEFBERICHT-1.24.0.md).

## 1.23.3 – Zwischenentwicklung, in 1.24.0 enthalten

- Startet maximiert; Verkleinern, Verschieben und Wiederherstellen bleiben möglich.
- Wiederholte Fach- und Registerkurzbefehle bestätigen den Bereich; unbesetzte Ziffern melden sich zuverlässig über die zentrale Statusquelle.
- Derselbe Fachbereich bleibt erhalten; Fenstergrößenänderungen verursachen weniger unnötige Aktualisierungen. Geöffnete Menüs geben den Fokus sicher zurück.
- GitHub-Texte zeigen den vollständigen Funktionsumfang. Windows-, NVDA-, Braille- und native ARM64-Praxistests von 1.23.2 sind dokumentiert; die geänderten Abläufe von 1.23.3 benötigen eine erneute Nutzerabnahme.

## Open-Source-Vorbereitung von 1.23.2

GPLv3, vollständige Lizenzbeigaben, kurze Projektdokumentation und Schutzregeln für private wie öffentliche Repositories. Keine Änderungen an Notenberechnung, Oberfläche oder Datenspeicherung. Die lizenzierte Paketfassung verwendet den ergänzenden Tag `v1.23.2-oss.1`; der ursprüngliche Tag und Download bleiben als historischer Build-Kandidat erhalten.

## 1.23.2

- Native ARM64-Ausführung derselben portablen AnyCPU-EXE für Windows 11 ab 24H2 vorbereitet: Manifest für amd64/arm64, .NET Framework 4.8.1 auf ARM64.
- WebView2-Loader nach tatsächlicher Prozess-Ausführungsumgebung statt Umgebungsvariable auswählen; x86/x64/ARM64-Dateien unverändert erhalten.
- Architektur-/Manifest-/Bibliotheksprüfungen und Windows-Praxisprüfweg ergänzt. Keine Änderungen an Oberfläche, Berechnungen oder Daten. Reale Windows-/ARM64-/NVDA-Abnahme noch offen.

## Notenblick 1.23.1

- Hauptbereiche/Fächer per Alt-Kurzbefehlen erschließen die vorhandene H1; Fachüberschrift bleibt unter der Auswahl und nennt zugänglich einmal den aktiven Notenbereich. Fachöffnungsregel gilt auch für Alt+N.
- Stabile nummerierte Fachzugriffe ohne Einfügen des aktiven Fremdfachs; Alt+0 öffnet/schließt die Auswahl. Unbelegte Ziffern melden kurz ihren Zustand ohne Fokuswechsel.
- Strg+1–9 und Strg+Tab wechseln die Hauptregister mit Inhaltsfokus; normale Registerbedienung bleibt erhalten. Strg+Umschalt+1/2 öffnet Alle Schüler/Einzeln, auch mit deutschen Umschalt-Ziffern. Strg+Umschalt+A öffnet das bestehende Abschlussnotenmenü; abgeschlossene Daten bieten nur Anzeigen an.
- Teilnehmer erhalten native explizite Checkboxlabels mit unmittelbar folgendem Inline-Namen, ohne blockweise getrennte Namen. Responsive ein-/zweispaltig; Auswahl-, Such-, Schutzfunktionen erhalten.
- Kompakte automatische TXT-Leistungslisten und Schülerberichte mit einer Zeile je Ergebnis. Schlüssel einmal im Leistungskopf; manuelle Abweichungen, relevante historische Werte, Status, Bemerkungen und Gewichte bleiben lesbar. Nur TXT-Darstellung und Verzeichnisversion 19, keine Daten-/Berechnungsänderung. Die sichere Browser-TXT-Bereinigung berücksichtigt die aktuelle zentrale Verzeichnisversion.
- Neun Hilfethemen/77 Abschnitte wortgetreu aus der verbindlichen 1.23.1-Fassung; 49 bestehende F1-Kontexte mit konkreter Feld-/Aktionspriorität und Rückkehr zu erhaltenen Formularen beziehungsweise Menüaktionen.
- Zielgerichtete dauerhafte Regressionen und vollständiger frischer lokaler Release-Lauf vorgeschrieben. Reale Windows/WebView2/NVDA/Braille/UIA-Abnahme bleibt getrennt offen. Details: docs/PRUEFBERICHT-1.23.1.md.

## Notenblick 1.23.0

- Vollständig ersetzte Benutzerhilfe: neun echte Registerkarten, 77 wortgetreue Abschnitte aus der gelieferten JSON und 49 konkrete F1-Kontexte. Dialoghilfe erhält dieselben Formknoten, Entwürfe und den Rückkehrfokus; Escape schließt zuerst die Hilfe.
- Ein zentraler Shortcut-Router für Hauptbereiche, tatsächliche Klasse-Fach-Zugriffe, sichtbare Tabs, innere Eingabetabs, Leistungsmenü, direkte K/T/M-Aktionen, Gewichtung, Export und Speicherung. AltGr, Dialoge, Fehler und vorhandene Schnell-Eingabe bleiben geschützt. WebView2 reicht Strg+Tab an denselben Router weiter; Windows-Liveabnahme steht aus.
- Teilnehmerliste einspaltig mit nebeneinander angeordnetem Kontrollfeld und Namen, anklickbarer Zeile und allen vorhandenen Such-, Auswahl- und Schutzfunktionen.
- Startseite behält drei Karten: Weiterarbeiten führt zum letzten Fachbereich, ausdrückliche Übersicht bleibt erreichbar, offene Leistungen werden gezählt und über fünf hinaus eingeblendet.
- Klassenreihenfolge Aufsteigend/Absteigend als reine Darstellungseinstellung; natürliche Zahlenordnung und alphabetische Fächer, passende Nummerierung der ersten neun Fachzugriffe.
- Gemeinsame mündliche Bewertungen und mündliche Einzelnoten eindeutig getrennt benannt. Doppeltes q-weight-Feld/Faktor bei vorhandenen mündlichen Einzelnoten beseitigt; bisherige Gewichte und Ergebnisse bleiben erhalten.
- Escape wird nicht mehr von Hintergrund-Details vor einem offenen Dialog abgefangen. Mündliche Dialoge bleiben auch bei sehr schmalen Fenstern und hohem Zoom innerhalb des Fensters. Die Hilfe bleibt auch bei 320 Pixeln/200 Prozent Zoom ohne horizontalen Seitenüberlauf.
- Neue dauerhafte Gruppen v1230/v1230-storage/v1230-browser; wortgetreuer Hilfevergleich, 49 F1-Kontexte, 63 Axe-Fälle und produktive native Speicherung. Vollständige frische lokale Release-Prüfung erforderlich. Windows/WebView2/NVDA/Braille/UIA-Liveabnahme separat offen; bis dahin Build-Kandidat. Details: docs/PRUEFBERICHT-1.23.0.md.

## Notenblick 1.22.0

- Einheitlicher Kontextfokus: neue Arbeitsbereiche und Dialoge beginnen bei ihrer Überschrift. Hauptlinks, Tabs und Auswahlfelder behalten ihren Fokus; schnelle Eingabe/Umschalt+Eingabe bleibt direkt. Fertig, Schließen, Escape und Abbrechen führen zum passenden Auslöser zurück. Gemeinsame Zielprüfung schützt unsichtbare oder deaktivierte Elemente.
- Fachöffnungsregel bei allen ausdrücklichen Öffnungen, einschließlich desselben Fachs. Programmstart und normale Tabs unabhängig. Zur Notenübersicht, Fortsetzen und bewusste Schüler-/Leistungsansichten behalten Vorrang.
- Teilnehmer auswählen: Ganze Klasse oder Nur ausgewählte Schüler, Suche, Gesamtzähler und Sammelaktionen. Alphabetische begrenzte Liste, responsive Spalten. Gespeicherte Einträge bleiben unmittelbar erkennbar gesperrt; Suchfilter und Abbruch verlieren keine Zuordnungen.
- Gewichtung der Leistung mit kurzer Erklärung statt Faktor, einschließlich neuer mündlicher Einzelnoten. Standard 1, Dezimalwerte, Grenzen und Mathematik unverändert.
- Ruhiger Leistungsarbeitsbereich mit eindeutiger Überschrift, Aktionen, Kontext, Bewertungsstand und Klassendurchschnitt. Zusätzliche letzte Durchschnittszeile in Ergebnisansicht und Alle Schüler, ab zwei gewerteten Noten, auch bei Suchfiltern; Punktezelle bewusst leer.
- Kurze natürliche Schlüsselbestätigungen auf Basis der vorhandenen Änderungsberechnung; korrekte null/eine/mehrere Auswirkungen und gezielter Hinweis auf direkte Noten. PDF im Schlüsseldialog direkt oben, danach Prüffeld und Punktetabelle.
- Einzelansicht mit Name und Position, Note anpassen, eindeutiger Vorschau/Übernahme und Kennzeichnung manueller/nicht gewerteter Werte. Eine zentrale Punkteansage je erfolgter Übernahme; veraltete/ausstehende Meldungen werden beim Kontextwechsel oder neuen Eingaben bereinigt.
- Punktebearbeitung aus Schülernoten verwendet dieselbe geschützte Eingabekomponente. Aufbewahrte Punktfelder bleiben auch bei direkter Notenbearbeitung erhalten. Fehlerfokus bei ungültigen Noten, Gewichten und Schlüsselfeldern verbessert.
- Datumseingaben, Dialogüberschriften, Teilnehmerliste, Aktionen und Einzelansicht bei sehr schmalen/zoomvergrößerten Fenstern verbessert. Keine neue Abhängigkeit oder Speicherarchitektur; Domänenmathematik, Speicherung, Sicherungen und Exportrenderer unverändert.
- Neue dauerhafte Gruppen v1220/v1220-browser, synthetische Großklasse und gespeicherte Neustartansichten. Vollständige frische lokale Freigabe mit 83 Testgruppen/90 Schritten erforderlich. Windows-/UIA-/NVDA-/Microsoft-Word-Liveabnahme bleibt separat offen. Details in docs/PRUEFBERICHT-1.22.0.md.

## Notenblick 1.21.1

- Vorhandene Leistungen öffnen eine nicht bearbeitbare Ergebnisansicht. Noten bearbeiten und Fertig wechseln im selben Bereich; Schließen führt zur auslösenden Tabellenposition zurück. Neue Leistungen und Fortsetzen beginnen direkt mit der Bearbeitung. Genau ein unterer Arbeitsbereich, Schutz ausstehender und ungültiger Eingaben.
- Jede neue Bearbeitung startet mit Alle Schüler. Einzeln bleibt verfügbar und wird innerhalb derselben Bearbeitung bei Aktualisierungen erhalten. Mündliche Einzelnoten nutzen dieselben Zustände im vorhandenen Dialog; Anzeigen bleibt auch bei abgeschlossenen Daten möglich.
- Neue dauerhafte Einstellung Beim Öffnen eines Fachs: zuletzt verwendeter Bereich oder immer Übersicht. Echte Fachöffnungen und Schnellzugriffe berücksichtigen sie; Programmstart, normale Tabs, Zur Notenübersicht und Fortsetzen behalten ihre eigene Bedeutung.
- Punkteinstellungen eingeklappt, Zusammenfassung und Notenschlüssel anzeigen bleiben erreichbar. Notenschlüssel ändern nutzt dieselben Felder, Validierung und Bestätigungen. Abbruch verändert keine Schlüssel.
- Verständliche Tabelle Punkte / Note statt technischer Grenzintervalle. Ganze, halbe und Zehntelpunktschritte betreffen nur die Darstellung; Punktzahl prüft Zwischenwerte ohne Speicherung. Dasselbe Modell im Notenschlüssel-PDF mit natürlicher Seitenfortsetzung und wiederholten Köpfen.
- Sofortige ungespeicherte Punkte-Notenvorschau, einschließlich berechneter und manuell festgelegter Note. Übernahme über Eingabe, Umschalt+Eingabe und Tabulator nutzt die zentrale Berechnung und eine vorhandene Statusquelle. Keine Ansage je Tastendruck.
- Einheitliche Aktionen Noten bearbeiten / Fertig, Leistung exportieren und Schließen. Kurze Erklärungen zur Eingabeart. Fokus nach Fertig, Dialogen und Schließen stabilisiert; ungültige ARIA-Verknüpfung ausgeblendeter Leistungen entfernt.
- Einzelberichte mit kurzen Punkten, einer Datumsangabe, ohne unnötige Noten-Überschrift und mit leerem Durchschnittspunktefeld. Filter nur bei tatsächlicher Einschränkung. Word, PDF, Druck, Excel, TXT und CSV behalten das gemeinsame Modell; ZIP-Struktur, grüne Gestaltung und gemeinsame Notenübersichten erhalten.
- Bereits mit Tab erfasste neue mündliche Noten behalten Punkte und direkte Eingaben bei späterem Eingabeartwechsel. Zusatzangaben bleiben beim ursprünglichen Schüler; ungültige Eingaben blockieren einen Schülerwechsel. Die Vorschau zeigt nur tatsächlich vorhandene manuelle Festlegungen.
- Zentrale Bruchrechnung, Punkteumrechnung, Gewichtung, Noten, JSON-/TXT-Sicherung und portable Struktur unverändert. Neue Gruppen v1211, v1211-browser und v1211-files, ausschließlich synthetische Daten. Windows-/NVDA-/Microsoft-Word-Liveabnahme gesondert offen.

## Notenblick 1.21.0

- Eingabeart pro Klassenarbeit, Test und mündlicher Klassen-/Einzelleistung; direkte Noten bleiben Standard. Punkte mit individuellen Maximalwerten, Linear, Mit Knick oder individuellen Mindestgrenzen und ganzen, halben, Viertel- oder Zehntelnoten. Eine zentrale exakte Bruchrechnung, genau eine Rundung, gleiche Regeln für Vorschau, Speicherung und Export.
- Eingabe/Umschalt+Eingabe übernehmen Punkte und führen zum nächsten/vorherigen sichtbaren Schüler. Die bestehende Statusquelle meldet Punkte und Note nach dem Fokuswechsel; im modalen mündlichen Dialog bleibt sie im zugänglichen Dialogbaum. Tabellen- und Einzelansicht, Suche, Sortierung und Status bleiben erhalten.
- Punkte, berechnete Note, manuelle Leistungsnote und aufbewahrte direkte Eingaben getrennt gesichert. Manuelle Noten ausdrücklich übernehmen/zurücknehmen. Nachträgliche Schlüsseländerungen zeigen Auswirkungen und werden bei vorhandenen Daten bestätigt; kleinere Maxima dürfen gespeicherte Punkte nicht ungültig machen. Letzten Fachschlüssel ohne Maximalpunkte vorschlagen.
- Geltende exakte Grenzen im vorhandenen Dialog anzeigen und über den bestehenden PDF-Renderer speichern. Exakte Bruchgrenzen bleiben nachvollziehbar; keine zusätzliche Verwaltung.
- „Diese Leistung exportieren“ verwendet den gemeinsamen Exportdialog für genau diese Klassenarbeit, diesen Test oder diese mündliche Klassen-/Einzelbewertung. Einzelberichte mit Schlüssel enthalten Punkte und Note sowie eine einmalige Zusammenfassung. Gemeinsame Übersichten und Fachberichte behalten ihre Notenspalten. Schülerberichte erhalten eine optionale, zunächst ausgeschaltete Punktdarstellung, auch im Sammelexport.
- Vollständige TXT-/Word-/PDF-ZIPs behalten denselben Plan und dieselben Pfade; Punkte ausschließlich in den einzelnen Leistungsdokumenten. Automatische TXT-Notfalllisten ergänzen die neuen Sicherungsangaben; bestehende Inhalte ohne Punkte bleiben gleich. JSON-Datenformat und portable Struktur bleiben erhalten.
- Einzelne mündliche Berichte zeigen Klassendurchschnitte erst ab zwei benoteten Personen. Normale TXT-Leistungsberichte verwenden eine Zeile je Schüler und zugeordnete Bemerkungszeilen. Bestehende Word-/PDF-Gestaltung und Seitenaufteilung unverändert.
- Neue dauerhafte Gruppen v1210, v1210-storage, v1210-browser und v1210-files: ausschließlich synthetische Daten, 158.484 exakte Referenzumrechnungen, echte Dateiformate und ZIPs, native Speicherung/Wiederherstellung, Browser/Tastatur/Fokus/axe, Open XML und PDF/UA. Tatsächliche Windows-/NVDA-Liveabnahme gesondert offen.

## Notenblick 1.20.3

- Nach Leistungsarten zeigt ausschließlich Übersicht, aktivierte Leistungsarten und Schüler. Leistungen bleibt der kompakten Ansicht vorbehalten. Vorhandene ausgeblendete Leistungen sind über die Übersicht erreichbar; Tastatur und Fokus bleiben gültig.
- Der zentrale Exportdialog ergänzt eine alphabetische, vom Arbeitskontext unabhängige Schülerauswahl. Gleiche Namen werden unterschieden, ehemalige Schüler ausdrücklich einbezogen; ohne Auswahl kein Export. Ausgabewechsel erhalten Eingaben.
- Dünn besetzte mündliche Klassenbewertungen werden kompakt zeilenweise dargestellt. Echte Klassenrunden und mündliche Einzelnoten bleiben getrennt; eindeutige fachweit stabile Bezeichnungen bei gleichem Titel/Datum. Einzelberichte zeigen nur relevante Teilnehmer, alle Noten, Status, Faktoren/GFS und Bemerkungen bleiben erhalten.
- PDF nutzt kompaktere lesbare Abstände und die tatsächliche A4-Fläche. Kurze Schüler-, Test- und Fachübersichten vermeiden Restseiten; Tags, Tabellenköpfe und Lesereihenfolge bleiben erhalten. Word-Struktur und ungeteilte Notenübersichten geschützt.
- Gesamtexporte lassen ausschließlich Schülerberichte ohne relevante Angaben weg. Abschlussnoten, Bemerkungen, Status und Historie genügen weiterhin. Alle Klassenlisten/Fächer bleiben auffindbar; leere Fächer erhalten eine kurze Fachinformation. Identischer gefilterter Plan für TXT, Word und PDF; ausdrücklich angeforderte leere Einzelberichte bleiben möglich.
- Schülerlisten ohne falsche Fachbezeichnung; gültiger Excel-Export und sinnvolle CSV-Ausgabe auch für kurze Fachinformationen. Automatische TXT-Notfalllisten, Noten-JSON und Sicherungen unverändert.
- Referenzvergleich: je 167 zu 51 Dokumente, 139 zu 23 Schülerberichte, 191 zu 51 PDF-Seiten und 169 zu 53 gerenderte Word-Seiten. Alle 236 Einzelnoteneinträge und 40 manuellen Abschlussnoten erhalten. Dauerhafte Tests ausschließlich synthetisch; vollständiger Nachweis und Liveprüfgrenzen im Prüfbericht.

## Notenblick 1.20.2

- „Fachbericht mit Einzelnoten“ ersetzt den überladenen vollständigen Fachbericht: eine Fachübersicht, gemeinsame Tabellen je tatsächlich verwendeter Leistungsart, kompakte mündliche Einzelnoten und einmalige tatsächliche Bemerkungen. Eigenständige Schülerberichte bleiben verfügbar; nur vorhandene Einträge sind dort vorausgewählt.
- Notenübersichten bleiben immer eine zusammenhängende Tabelle. Acht wesentliche Spalten passen gemeinsam auf A4 quer; ausschließlich vertikale Fortsetzung mit wiederholtem Tabellenkopf. Kurze eindeutige Spaltennamen, dynamische Leistungsarten und gezielt begrenzte Übersicht bei zusätzlichen Arten; sämtliche Details bleiben in den Leistungstabellen.
- Fachgewichtung einmal kompakt am Anfang, GFS und besondere Faktoren unmittelbar an der Leistung. Keine normalen Berechnungsstatus-, Vorläufigkeits- oder offenen Platzhaltertabellen. Echte Sonderzustände, historische Angaben und ungeklärte Altbestände bleiben erkennbar. Exakte Berechnungen und festgelegte Abschlussnoten unverändert.
- Leistungsliste, Klassenarbeiten, Tests, mündliche und weitere Noten, Schülerberichte und ZIP-Dokumente nutzen die gemeinsamen verbesserten Vorlagen. Leere Bemerkungs-/Gewichtungsspalten entfallen; Bemerkungsauswahl wird auch für historische Angaben berücksichtigt.
- Word, PDF und Druck behalten grüne Tabellenköpfe, lesbare Schrift, echte Überschriften, wiederholte Köpfe und Seitenzahlen bei kompakteren Abständen ohne erzwungene Seitenumbrüche. Excel hat ein Blatt je sinnvoller Tabelle sowie echte Zahlen mit bis zu vier Nachkommastellen. Gemischte CSV-Berichte verwenden ein einheitliches langes Fünfspaltenschema statt einer überwiegend leeren Spaltenunion; Formelschutz bleibt erhalten.
- „Inhalt“ erläutert Notenübersicht, Leistungsliste, Fachbericht und Schülerberichte dynamisch über eine zugeordnete Beschreibung. Gesamtexporte behalten identische ZIP-Pfade und die produktive native Prüfung für TXT, Word und PDF. Automatische TXT-Notfalllisten und gespeicherte Daten bleiben unverändert.
- Dauerhafte synthetische Qualitätsregressionen für 23 Schüler/wenige Leistungen, große Klassen, lange/gleiche Namen, Status, GFS, Bemerkungen, Abschlussnoten und Historie. Tatsächliche Dokumente unabhängig geöffnet, gerendert und validiert; Windows-/NVDA-Liveprüfungen separat ausstehend. Einzelheiten im Prüfbericht.

## Notenblick 1.20.1

- Kritischen Windows-Gesamtexportfehler behoben: sichere Unterordner werden akzeptiert, vollständige Archivpfade und einzelne Dateinamen getrennt geprüft. Dieselbe Struktur nach Schuljahr/Klasse/Fach für TXT, Word und PDF; flache Schüler-ZIPs bleiben möglich.
- Pfadsegmente, reservierte Windows-Namen, Groß-/Kleinschreibung und Unicode-Namenskollisionen, Datei-/Ordnerkonflikte, lokale/zentral abgeglichene ZIP-Daten, CRC, Inhalt und Grenzen geprüft. Keine Prüfung deaktiviert. ZIP-Dateifilter heißt einheitlich „ZIP-Archiv“.
- Klassendurchschnitt einzelner Leistungen in allen drei Formaten aus der vorhandenen exakten Funktion; aktive bewertete Teilnehmer, keine Null für fehlende Noten, individuelle Anzeigevorgaben, „–“ ohne Grundlage. Präzision null in erweiterten Berichten korrekt erhalten. TXT-Gesamtexport ergänzt Gewichtungs-/Status-/Bereichsmittelwerte; automatische TXT-Ausgabe und Notenberechnung bleiben erhalten.
- Gesamtexport nutzt weiterhin dieselben Berichtsmodelle und Word-/PDF-Renderer wie der Einzelexport. Fortschritt unterscheidet Dokumente, ZIP-Erstellung, native Prüfung und tatsächliche Speicherung. Erfolg erst nach abschließender positiver Antwort, abgebrochene Dateiauswahl ohne Erfolg.
- Kritische Übergabe gegen wiederholtes Escape geschützt; nach korrigierbaren Fehlern wieder bedienbarer Dialog mit sinnvoller Fokusrückgabe. Eine sichtbare Erfolgsmeldung über die vorhandene Statusquelle.
- Dauerhafte native Tests akzeptieren echte verschachtelte Archive; vollständige erzeugte TXT-/Word-/PDF-ZIPs durchlaufen produktive Validierung und atomare Erst-/Ersetzungsspeicherung. JS-Download/Bridge zusätzlich gegen C#-Host, Sicherheitskorpus, Inhalts-/Layoutvergleich, Open XML, veraPDF und Chromium ergänzt. Windows-/NVDA-Liveprüfung bleibt gesondert offen.

## Notenblick 1.20.0

- Einrichtung abschließen: neue Abschlussbeschriftung, eindeutige sichtbare Bestätigung und erste Notenübersicht.
- Speicherstatus mit drei erklärten Aktionen und einmaligen tatsächlichen Rückmeldungen. JSON-Speicherung, TXT-Reparatur und offene Einstellungen bleiben klar getrennt.
- Alle Wiederherstellungswege mit tatsächlichen Arbeitsschritten, Schutz des vorherigen Standes und Rückkehr zu Sicherung → Wiederherstellen. Einstellungen bleiben erhalten, Fokus steht auf dem Tab. Fehlerdialoge bleiben wiederholbar; offene Zusatzarbeiten werden nicht als Vollerfolg gemeldet.
- Ungeklärte Altbestände nur bei Bedarf im geschlossenen Bereich Weitere Möglichkeiten; keine historischen Daten entfernt.
- Anzahl und Speicherplatz automatischer/geschützter Sicherungen. Bestätigte manuelle Bereinigung älterer eigener Stände mit vollständiger Inhalts-/Bestandsprüfung, mindestens 30 gültigen verbleibenden eigenen Ständen, Konfliktsperren und atomarer Indexpflege. Geschützte, fremde und veränderte Dateien bleiben erhalten. Reguläre Aufbewahrung und Schuljahre unverändert.
- Unabhängige Exportauswahl nach Schuljahr/Klasse/Fach/Inhalt. Leistungsübersicht und vollständiger Fachbericht unterschieden; zentraler Exportdialog und sämtliche Formate/Schüler-ZIPs bleiben erhalten.
- Alle Noten immer als ZIP in identischer Struktur für TXT/Word/PDF. Abgeschlossene Jahre, frühere Schüler, individuelle Teilnahmen, Noten/Status, Gewichtungen, Bemerkungen und Abschluss-/Altangaben erhalten; eindeutige Namen ohne leere Ordner. Historische sonstige Leistungen werden auch ohne eingetragene Bewertung dokumentiert.
- Begrenzte sequenzielle Dokumenterstellung, echter Fortschritt, Abbruch ohne Teilarchiv; bestehende Grenzen 64 MB/4096 Dokumente mit verständlicher Meldung. Keine zweite Berechnungs- oder Speicherarchitektur.
- Betroffene Hilfe und neue dauerhafte Funktions-, Speicher-, Chromium- und unabhängige Exportprüfungen ergänzt. Tatsächliche Windows-/NVDA-Liveabnahme bleibt gesondert offen; siehe docs/PRUEFBERICHT-1.20.0.md.

## Notenblick 1.19.0

- Neue Standards nur für neue Bestände: Kürzen und Notenansicht nach Leistungsarten. Gespeicherte Entscheidungen sowie bisherige implizite Standards alter Bestände bleiben erhalten; exakte Rechnungen und Zeugnisnotenvorschläge unverändert.
- Ersteinrichtung mit Zurück, Einrichtung beenden und Weiter beziehungsweise Notenblick einrichten in einer gemeinsamen Fußzeile. Fünf Schritte, Fokus, Scrollposition und Verwerfschutz erhalten.
- Hilfe als sechster echter Hauptnavigationslink und eigener H1/H2-Bereich. Sämtliche bisherigen Hilfetexte und ihre Themenreihenfolge erhalten, keine inhaltliche Überarbeitung.
- Sicherung mit derselben Tabkomponente wie Verwaltung/Einstellungen: Speicherstatus, Sicherung erstellen, Wiederherstellen und Exportieren. Keine zusätzlichen Regionen oder vier gleichzeitig sichtbaren Karten.
- Speicherstatus unterscheidet ungespeicherte Noten, unvollständige zusätzliche TXT-Dateien und noch offene Ansichtsspeicherung. Tatsächlichen JSON-Speicherzeitpunkt auch bei TXT-Fehlern anzeigen. Aktionen: Datenordner öffnen, Automatische Notenlisten prüfen und Erneut speichern.
- Bei Lesefehlern der Hauptdatei keine TXT-Neuerstellung oder scheinbare Sicherung/Exporte des leeren Ersatzstands; vorhandene TXT-Dateien und frühere Speicherstände bleiben geschützt.
- Datei- und Standwiederherstellung mit beschrifteten Angaben und ausdrücklicher Ersetzungsbestätigung. Ausgewählter Stand mit dynamischer Vorschau; SHA-256-Kontrolle verhindert Übernahme inzwischen veränderter Quelldateien. Bestehende atomare Speicherung und zusätzliche Schutzsicherung erhalten.
- Rückgängig mit sinnvoller Fokuswiederherstellung. Ungespeicherte Arbeitskopien nur bei Verfügbarkeit und einschließlich ihrer gespeicherten Einstellungen wiederherstellen. Historische Daten und mündliche Zuordnungen bleiben zugänglich.
- Zentralen Exportdialog aus Sicherung öffnen; alle Formate und Schüler-Sammelexporte erhalten. Doppelten CSV-Schalter entfernt; TXT-Prüfung ausschließlich unter Speicherstatus.
- Gezielter Umbruch langer Sicherungsaktionen und Texte; Dialoge aus Sicherung bei kleiner effektiver Breite erreichbar. Die bestehende Scrollprüfung reagiert zusätzlich auf Layout-/Zoomänderungen, damit auch leere scrollbare Tabellen tastaturerreichbar bleiben.
- Dauerhafte v1190-Funktions-, produktive C#-Speicher- und Chromium/axe-Prüfungen mit 65 Fenster-/CSS-Zoomfällen. Hilfe-Textdigest, Altstand 1.18.0 bytegleich, Fehler-/Abbruch-/Wiederherstellungsfälle. Infrastrukturprüfung unterstützt Abschlusscommits mit identischem Quellbaum.

## Notenblick 1.18.0

- Ersteinrichtung gezielt vereinfacht: Halbjahresoptionen nennen Viertelnoten beziehungsweise ganze Noten direkt; doppelte Erklärungen entfallen.
- Fachliste ohne wiederholte Klassenüberschrift/Anzahl, dauerhaftes Feldlabel „Fachname“ und eindeutige dynamische Entfernen-Aktionen. Leere Entwürfe sind weiterhin keine eingerichteten Fächer.
- Schülerlisten ohne doppelte Klassenüberschrift; kompakte dynamische Überschrift „Schüler (Anzahl)“. Einstellungen werden ausschließlich im fünften Schritt zusammengefasst.
- Kompakte einheitliche Klassenbereiche, natürlich umbrechende Eingaben/Aktionen auch bei hohem Zoom. Sichtbare Fokusmarkierungen und bisherige Komponenten bleiben erhalten.
- Nach Entfernen Fokus zum benachbarten Feld/Schüler beziehungsweise zur Hinzufügen-Aktion. Schrittüberschriften erhalten den Fokus; beim Zurückgehen wird die vorherige Scrollposition wiederhergestellt.
- Bestehende atomare Abschlussspeicherung und Abbruchbestätigungen bleiben erhalten. Berechnung, Abschlussnoten, Exporte, TXT-Verzeichnisversion 17, Datenformat und native Speicherung unverändert.
- Dauerhafte Funktions-/Browserregressionen, zusätzliche bytegleiche Öffnungsprüfung von 1.17.0 und vollständiger lokaler Release-Ablauf. Windows-/NVDA-/Braille-/Microsoft-Office-Liveabnahme bleibt separat erforderlich.

## Notenblick 1.17.0

- Fehler in der Notenübersicht behoben: Die beiden Abschlussnoten-Klassendurchschnitte waren bisher fest als Striche ausgegeben. Jetzt zählen bereits teilweise festgelegte passende Noten aktiver Fachschüler; keine Nullwerte für fehlende Noten, keine Veränderung gespeicherter Entscheidungen. Bildschirm, TXT-Übersicht und gemeinsame Exportmodelle verwenden dieselbe exakte Berechnung. Suche, angezeigte Seite und Exportumfang beeinflussen die Grundlage nicht.
- TXT-Schülerberichte ohne technische normale Zeitabschnitte oder wiederholten Faktor 1. Abweichende Faktoren direkt bei Leistungen, GFS weiterhin deutlich. Abweichende historische Halbjahre und frühere Zeugnisnoten verständlich benannt. Ordnerstruktur, Vollständigkeit, SHA-256, Inhaltsreparatur und geschützte Bereinigung bleiben erhalten; Verzeichnisversion 17.
- Schuljahre nach tatsächlichem Beginn absteigend, ohne gespeicherte Reihenfolge oder Arbeitsjahr zu ändern. Bei Schülern und Fächern stehen Jahr/Klasse vor den Aktionen. Dialogtitel nennen die Klasse; Fächer stehen alphabetisch.
- Fünfstufiger Assistent mit dynamischen Klassen-/Fachnamen, bevorzugtem Listenimport, kompakter Schülertabelle und Inline-Bearbeitung. Grundeinstellungen getrennt von letzter Überprüfungsseite; einfache Standardgewichtung erst nach Wunsch bearbeiten, Gegenanteile unmittelbar sichtbar. Erweiterte Vorgaben unverändert geschützt.
- Gemeinsamer Schutz bei Escape, X, Einrichtung beenden und Programm-Schließanfrage. Fortsetzen und Escape der Bestätigung bewahren Eingaben, Auswahl, Fokus und Scrollposition. Erst ausdrückliches Verwerfen beendet den Entwurf; ausgefüllte Klassen benötigen ebenfalls Bestätigung. Wiederholtes Escape wird vor der nativen Dialogschließung behandelt. Keine Teildatenspeicherung; bestehende atomare Abschlusstransaktion erhalten.
- Schnellzugriff standardmäßig bei neuen Datenbeständen, einschließlich Ersteinrichtung. Gespeicherte Darstellungen und ältere implizite Auswahlfelder bleiben erhalten; vollständige Auswahl und Darstellungswechsel bestehen weiter.
- Neue Domänen-, produktive C#-Speicher-, Chromium-/axe-/Tastatur-/Zoom- und unabhängige Office-/PDF-/Druckregressionen. Tatsächliche Windows-/NVDA-/Microsoft-Office-/Druckabnahme bleibt gesondert erforderlich.

## Notenblick 1.16.0

- TXT-Notfalllisten: Halbjahres- und Zeugnisnote immer sichtbar, offene Werte als „–“, genau ein berechneter Gesamtdurchschnitt pro Schüler. Gewichtungen, Bemerkungen, ehemalige Schüler und historische Noten erhalten; lesbare Übersichten auch ohne Leistungen. Zusätzliche eindeutige Windows-kompatible TXT-Dateien unter „Schülernoten“ für jeden Fachschüler.
- TXT-Aktualisierung prüft tatsächliche Inhalte und liest geschriebene Dateien zurück. SHA-Verzeichnis unterscheidet vollständig/unterbrochen. Fehlende oder geänderte Listen werden sicher erneuert, alte Dateien erst danach und nur bei nachgewiesen unverändertem eigenen Inhalt bereinigt. TXT-only-Wiederholung verändert gespeicherte JSON-Noten nicht.
- Verwaltung: einheitliche H2/Aktionen/Auswahl/Tabelle, kompakte Klassen/Fächer mit direkten Verweisen, getrenntes Arbeitsjahr in der Statusspalte, verständliche Bestätigungen und natürliche Teilnahmebegriffe. Bestehende Zuordnungen und interne Statuswerte bleiben erhalten.
- Ersteinrichtung: Willkommen nur bei wirklich neuen Daten; vier Schritte für beliebig mehrere Klassen, Fächer und Schülerlisten mit Importvorschau, Dublettenprüfung und Fachteilnahme. Zurück/Abbruch ohne Teilspeicherung. Gemeinsame validierte Veröffentlichung mit wiederholbaren Speicherfehlern und initialer Einstellungswiederherstellung.
- Abschlussnoten: sichtbaren Tastaturhinweis entfernt; Strg+Enter bleibt erhalten und in der Hilfe erklärt. Auswahlfelder nennen zentral Schüler und vorhandenen passenden Durchschnitt, ohne zusätzliche Live-Region. Native Enter-/Pfeiltastenbedienung bleibt erhalten.
- Versionierte Struktur-, Browser-/axe-, Speicher-/Fehler-/Update-Regressionen ergänzt. Rechenmodule, atomarer C#-Speicherkern, Exporte und portable Struktur bleiben erhalten. Tatsächliche Windows-/NVDA-/Office-Abnahme weiterhin gesondert erforderlich.

## Notenblick 1.15.0 – Abschlussnoten einfacher bedienen

- „Halbjahresausgabe festlegen“ mit Klassen-/Jahreskontext und dynamisch zugeordneter Erklärung; Einstellungen und Bestandsnotenschutz bleiben erhalten.
- Einheitliche Einzel-/Klassendialoge mit kurzen Überschriften, Fach/Klasse/Jahr und Zeitraum; Schülername als H3, Durchschnitt und Vorschlag kompakt nebeneinander, wichtigste Noteneingabe darunter.
- Viertelnoten ausschließlich numerisch mit zwei Nachkommastellen in Auswahl, Übersicht, Schüleransicht und sämtlichen Exporten/Notenlisten; gespeicherte Werte und exakte Rechnung unverändert.
- „Offene Vorschläge übernehmen“ schützt gespeicherte und bewusst bearbeitete Eingaben. Klassenstatus ohne häufige Live-Ansagen; Tabelle über „Noten der Klasse“ beschriftet, ohne zusätzliche Region.
- Kompakte Notenauswahl, breite Namensspalte, dezent hervorgehobene Eingabespalte und fixierte Tabellenköpfe; horizontales und vertikales Scrollen bleiben möglich.
- Strg+Enter führt nach geschlossener Auswahlliste zum nächsten sichtbaren Schüler, ohne Speicherung. Enter/Pfeile/Maus/Tab behalten ihre native Funktion; kein Fokuswechsel allein durch Wertänderung. Automatische Enter-Navigation ist mangels tatsächlicher Windows-/NVDA-Abnahme nicht aktiviert.
- Anfangsfokus direkt auf erste offene Note; keine vorangehende Fokussierung eines anderen Notenfelds. Escape/Abbrechen, Fehlerfokus und Rückkehrfokus bleiben erhalten.
- Neue Struktur-/Browserregressionen und erweiterte unabhängige Export-/Updateprüfungen; keine Migration oder Änderung am produktiven Speicherkern.

## Notenblick 1.14.0 – Abschlussnoten

- Ausgabe zum Halbjahr einmal je Klasse/Schuljahr festlegen: Viertelnoten oder ganze Noten; spätere Änderungen lassen Bestandsnoten unverändert.
- „Abschlussnoten“ über der Notenübersicht: vollständige Klassenliste, Vorschläge nur für unberührte leere Felder, Filter für offene Noten und gemeinsames Speichern.
- Zwei feste Ergebnisspalten und drei Schülerkarten; derselbe Dialog für Einzel- und Klassenbearbeitung mit nativer Notenauswahl, Bemerkung und nachvollziehbaren gespeicherten Informationen.
- Exakte rationale Vorschläge ohne Doppelrundung; Halbjahr nach Leistungsdatum bis 31. Januar. Neue Leistungen ab Februar werden automatisch dem zweiten Halbjahr zugeordnet.
- Festgelegte Noten einschließlich damaligem Durchschnitt, Zeitraum und Datum bleiben unabhängig von späteren Leistungs-/Gewichtsänderungen erhalten.
- Historische Abschnittsnoten und abweichende frühere Zeugniswerte bleiben erhalten und gezielt korrigierbar; Prüfungs-/Abschlussnoten in Abschlussklassen werden manuell entschieden.
- Atomare Speicherung über den vorhandenen Speicherkern; Dialogentwürfe bleiben bei Fehlern erhalten. JSON-Sicherungen, TXT-Listen sowie Word/PDF/Excel/Text/CSV/Druck vollständig ergänzt.
- Automatische Rechen-, Kompatibilitäts-, native Speicher-, Browser-/Tastatur-/axe- und unabhängige Exportprüfungen ergänzt. Tatsächliche Windows-/NVDA-Abnahme bleibt gesondert erforderlich.

## Notenblick 1.13.0

- Schülerexport: beide Ausgabeoptionen haben eine sichtbare, dynamisch zugeordnete Erklärung. Die tatsächliche ZIP-Berichtszahl bleibt erhalten; kein zusätzlicher Live-Bereich oder Fokuswechsel.
- Drucken: vorhandene A4-Ausrichtung aus der gemeinsamen Seitenplanung, ausdrücklicher Aufruf der WebView2-Browser-Druckvorschau, Fallback für ältere Laufzeiten und kurze Empfehlung im Exportdialog. Druckvorschau und Druckerauswahl bleiben erhalten; keine stille Ausgabe. ShowPrintUI kann keine PrintSettings entgegennehmen, deshalb bleibt die tatsächliche Windows-Vorbelegung manuell zu prüfen.
- Klassendurchschnitt als dezente letzte Ergebniszeile in passenden Klassen-Notenübersichten in Word, PDF, Druck, Excel, CSV und Text. Gemeinsame zentrale Grundlage mit der Bildschirmansicht: alle aktiven Fachteilnehmer, unabhängig von Suche und Exportumfang; fehlende Noten bleiben fehlend, Zeugnisnote bleibt „–“. Grundlage wird erklärt; Excel enthält echte Zahlen, CSV weiterhin genau eine Kopfzeile.
- Ergebniszeile bleibt nach Möglichkeit beim letzten Schüler; wiederholte Tabellenköpfe und statische Fortsetzungsköpfe bleiben erhalten. Unveränderte sichere PAGE-/NUMPAGES-Felder, keine globale Word-Feldaktualisierung oder externen Verknüpfungen.
- Gezielte Regressions-, Update-, Accessibility-, Schema-, PDF/UA- und Renderprüfungen ergänzt. Keine Änderung am Notendatenformat, den mathematischen Domänenmodulen oder der produktiven Datenspeicherung. Windows/WebView2/Office/NVDA und physischer Druck bleiben gesonderte manuelle Abnahmen.

## Notenblick 1.12.0

- Schüleransicht: ausgewählten Schüler oder alle aktiven Schüler einzeln exportieren. PDF, Word, Excel, Text oder CSV werden pro Schüler als eigene Datei in einem ZIP gespeichert. Ausgeschiedene Schüler nur auf Wunsch; historische Fachzuordnungen bleiben erhalten.
- Exportdialog: einheitliche Reihenfolge, dynamische Erklärung der Anordnung, tatsächliche Berichtszahl, gedrosselter Fortschritt und sicherer Abbruch. Die sechs bisherigen Einzelexporte bleiben erhalten.
- Dokumente: dezente Fortsetzungsköpfe mit Fach, Klasse und Schuljahr, sichere lokale Seitenzahlen sowie etwas deutlicheres Gesamtergebnis. Wiederholte Tabellenköpfe mit tatsächlich gerenderten Fortsetzungsseiten geprüft.
- ZIP-Erstellung und native Speicherung: eindeutige Windows-Dateinamen, CRC-/Inhaltsprüfung jedes Eintrags, ein Format pro Archiv, 64-MiB-Grenze, atomare Speicherung und Bereinigung temporärer Dateien. Keine Änderung an Notenberechnung oder Datenformat.
- Vollständige Open-XML-, PDF/UA-, Browser-, Speicher- und Regressionstests erweitert. Microsoft-Office-, Windows-, NVDA- und physische Druckabnahme bleiben gesondert erforderlich.

## Notenblick 1.11.0

- Word erzwingt beim Öffnen keine globale Feldaktualisierung mehr. Lokale PAGE-/NUMPAGES-Felder bleiben erhalten; keine externen Beziehungen. Fehlerhafte OOXML-Reihenfolgen und fehlende Pflichtattribute korrigiert, vollständige SDK-Schemavalidierung ergänzt.
- Gemeinsame inhaltsabhängige Seiten- und Spaltenplanung für Word, PDF und Druck: zuerst lesbares Hochformat, dann Querformat, 10 beziehungsweise mindestens 9 Punkt. Übliche sieben bis zehn Spalten bleiben zusammen; erst tatsächlicher Platzmangel erzeugt eindeutig bezeichnete Teile mit wiederholten Schülernamen. Excel und CSV behalten sämtliche zusammengehörigen Spalten.
- Kompaktere Word-Zeilen ohne überflüssige Abschlussabsätze; keine dadurch verursachte leere Schlussseite. Lange Bemerkungen bleiben vollständig und eindeutig zugeordnet.
- Exportumfang heißt einheitlich „Mit aktuellen Filtern“ oder „Alle Einträge“. Dynamische Erklärung nennt die tatsächlichen Schüler, Leistungen oder Einzelnoten unabhängig von der Bildschirmseite. Druck, PDF und Word zeigen das automatisch bestimmte A4-Seitenformat.
- Erstellen, Speichern und nicht erreichbare Speicherorte erhalten unterschiedliche sichere Fehlermeldungen. Bewusster Abbruch ist fehlerfrei; ein abgebrochener Export erzeugt keinen verspäteten Download und beeinflusst keinen späteren Dialog. Native Speicherdialoge besitzen keinen zweiminütigen Bedienungs-Timeout.
- Native Office-Dateiprüfung untersucht ZIP-Inhalt, CRC, XML und lokale Paketbeziehungen vor atomarer Speicherung. Keine zusätzlichen Laufzeitprogramme, keine Office-Installation und kein Internet für Exporte erforderlich.
- Versionszeile unverändert dezent. Der einmalig gemeldete Effekt darunter war unter Chromium nicht reproduzierbar. Bei extremer Vergrößerung wurde ein unabhängig gefundener Überlauf des Programmkopfs korrigiert.
- Berechnungs- und Speicherkern unverändert; keine Migration. Update von 1.10.0, Sicherung und Wiederherstellung werden mit synthetischen Daten geprüft.

### Update auf 1.11.0

Notenblick schließen. Nur Notenblick.exe und den vollständigen Ordner Programm ersetzen. Daten mit Noten, Ansicht.json, Sicherungen und Notenlisten vollständig erhalten.

Prüfergebnisse und offene tatsächliche Windows-/Word-/NVDA-Abnahme: docs/PRUEFBERICHT-1.11.0.md. Bis zu dieser Abnahme Entwicklungskandidat.

---

## Notenblick 1.10.0

- Einheitliche H2-Überschriften und gemeinsame responsive Aktionsleisten in allen Notenansichten; Hauptaktion links, Exportieren rechts. Suche bleibt sichtbar, seltene Optionen unter Ansicht anpassen.
- Dezente Versionsanzeige unten auf Start. Anwendung, Starter und Paketmetadaten beziehen die Version aus package.json.
- Ein kontextbezogener Exportdialog für Notenübersicht, Leistungsarten, mündliche Klassenübersicht/Einzelnoten, allgemeine Leistungsliste und einzelne Schüler. Aktuelle Auswahl oder alle Einträge über sämtliche Bildschirmseiten; Bemerkungen optional.
- Echte Offline-Dateien für PDF, Word und Excel zusätzlich zu Druck, TXT und CSV. Gemeinsames grünes Notenblick-Layout, semantische Word-Überschriften, strukturierte PDF-Tabellen und typisierte Excel-Zellen. Schülerberichte trennen berechnete Durchschnitte von manuellen Zeugnisnoten.
- Vollständige breite Tabellen in Spaltengruppen für Druck, Word und PDF. Lange Bemerkungen als zugeordnete Absätze. Druckinhalt bleibt bis zum Abschluss des Druckvorgangs erhalten.
- Binärdateien werden unverändert über den Windows-Speicherdialog atomar geschrieben; Abbruch erhält die Auswahl. CSV-Injection-Schutz erweitert, sichere begrenzte Dateinamen.
- Berechnungen und Datenformat unverändert; keine Migration, keine doppelten Noten. Automatische TXT-Notenlisten bleiben erhalten.

### Update auf 1.10.0

Notenblick schließen. Nur Notenblick.exe und den vollständigen Ordner Programm ersetzen. Den vorhandenen Ordner Daten einschließlich Noten, Ansicht.json, Sicherungen und Notenlisten unverändert behalten. Keine Office-Installation oder Netzwerkverbindung zur Dateierstellung erforderlich.

Automatisierte und tatsächliche manuelle Prüfungen sowie offene Windows-/NVDA-Abnahme stehen in docs/PRUEFBERICHT-1.10.0.md und docs/EXPORT-PRUEFUNG.md. Bis zur Windows-/NVDA-Abnahme Entwicklungskandidat.

---

## Notenblick 1.9.0

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

### Update auf 1.9.0

Notenblick schließen. Ausschließlich Notenblick.exe und den vollständigen Ordner Programm ersetzen. Den vorhandenen Ordner Daten unverändert behalten. Das Programmarchiv enthält keine Nutzerdaten; bei einer Neuinstallation entsteht Daten beim ersten Start.

Die Auslieferung ist ein lokal unter Linux und Chromium geprüfter Windows-Build-Kandidat. Tatsächlicher Windows-Programmstart, WebView2/UI Automation, Windows-Skalierung und gesprochene NVDA-Ausgaben sind hier nicht live geprüft. Einzelheiten stehen in PRUEFBERICHT.md.

---

## Notenblick 1.8.0

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

### Update

Notenblick schließen. Ausschließlich Notenblick.exe und den vollständigen Ordner Programm ersetzen. Den vorhandenen Ordner Daten behalten. Das Programmarchiv enthält keine Nutzerdaten; bei einer Neuinstallation wird Daten automatisch angelegt.

Bisherige mündliche Leistungen werden nicht anhand der Teilnehmerzahl geraten. Unter Mündlich → Klassenleistungen → Zuordnung prüfen können sie nach Prüfung zugeordnet werden. Vor der bestätigten Übernahme entsteht eine geprüfte vollständige Sicherung. Die Originalnoten werden dabei nicht verändert.

Tatsächliche Prüfungen und verbleibende Windows-/NVDA-Testgrenzen stehen in PRUEFBERICHT.md.
