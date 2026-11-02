# Prüfbericht Notenblick 1.20.3

## Änderungen und Datenverträge

Die Ansicht nach Leistungsarten enthält ausschließlich Übersicht, die bestehenden `visibleKinds` und Schüler. Leistungen bleibt der kompakten Ansicht vorbehalten. Ausgeblendete vorhandene Leistungen sind über eine kurze aufklappbare Liste in der Übersicht erreichbar; ihre Eingabe verwendet die vorhandene Komponente. Ausblenden verändert weder Daten noch Einstellungen anderer Arten. Aktivierung, manuelle Tastatursteuerung und Rückkehrfokus bleiben zentral; beim Wegfall eines Reiters wird eine vorhandene Registerkarte gewählt.

Der zentrale Exportdialog bietet unmittelbar nach Ausgabe eine reguläre Schülerauswahl. Sie ist unabhängig vom aktuell geöffneten Schüler, alphabetisch nach Nachnamen geordnet und auf Fachzuordnungen begrenzt. Gleiche Namen erhalten stabile Unterscheidungen; ehemalige Schüler lassen sich ausdrücklich einbeziehen. Ohne Auswahl bleibt der Export mit verständlichem Fehler und Fokus im Auswahlfeld offen. Ausgabewechsel behalten Auswahl, Bemerkungen, Anordnung und weitere Optionen. Alle Schüler einzeln bleibt ein ausdrücklich angeforderter vollständiger Schüler-Sammelexport, einschließlich noch leerer Einzelberichte.

Das gemeinsame Berichtsmodell stellt dünn besetzte mündliche Klassenbewertungen zeilenweise mit Datum, Schüler, Bewertung und Note oder Status dar. Tatsächliche Klassenrunden mit mindestens zwei relevanten Teilnehmern und mindestens halber Besetzung bleiben Matrizen. Auch die gemeinsame Matrix wird auf ihre Besetzung geprüft; getrennte kleine Teilnehmergruppen dürfen keine neue Leermatrix erzeugen. Echte mündliche Einzelnoten bleiben getrennt. Eindeutige Bezeichnungen bei gleichem Titel und Datum werden aus dem gesamten Fach stabil gebildet. Bemerkungen und besondere Faktoren/GFS bleiben zugeordnet; vorhandene Klassen- und Bereichsmittelwerte bleiben aus den unveränderten Domainfunktionen erhalten. Eigenständige mündliche Leistungsberichte enthalten nur tatsächlich relevante Teilnehmer. Keine Umwandlung gespeicherter Klassenbewertungen und keine Änderung ihrer Gewichtung.

Der Gesamtexport filtert ausschließlich seine Dokumentauswahl: Schülerberichte bleiben bei Noten, besonderen Bewertungszuständen, Bemerkungen, manuellen Abschlussnoten oder historischen Angaben erhalten. Ein offener Zustand ohne Eintrag genügt nicht. Berechnete Durchschnitte sind kein Auswahlkriterium. Alle Fächer und Klassenlisten bleiben auffindbar. Ein Fach ohne relevante Angaben enthält eine kurze Fachinformation statt einer Tabelle leerer Ergebnisse. JSON-Sicherungen und automatische TXT-Notfalllisten verwenden unverändert ihren bisherigen Datenbestand und Plan. Der reguläre TXT-Gesamtexport folgt wie Word und PDF dem zentralen Berichtsmodell. Schülerlisten tragen keine falsche Fachbezeichnung mehr; Kopf-/Fußzeilen und Druck verwenden die passende Metadatenzeile.

Der PDF-Renderer nutzt die tatsächliche A4-Höhe und unteren Seitenränder, kompaktere Absatz-/Tabellenabstände und lesbare Schrift ab 9 pt. Kurze Tabellen passen dadurch häufig auf eine Seite; große Tabellen und lange Bemerkungen dürfen natürlich fortgesetzt werden. Wiederholte Tabellenköpfe, semantische Tags und Seitenzahlen bleiben erhalten. Word-Abstände wurden nicht pauschal verändert. Die zentrale Notenübersicht bleibt immer eine einzige, höchstens achtspaltige Tabelle mit rein vertikaler Fortsetzung. Excel und CSV unterstützen auch die neue kurze Fachinformation; ein Excel-Export ohne Noten enthält weiterhin ein gültiges Blatt.

## Vergleich der drei privaten Referenzarchive

Die drei ausdrücklich benannten ZIP-Dateien wurden ausschließlich außerhalb des Repositorys analysiert. Ihre tatsächlichen TXT-Inhalte wurden vorübergehend zu einem lokalen Vergleichsstand rekonstruiert und erneut durch dieselben zentralen Exportfunktionen ausgegeben. Das ist kein Zugriff auf die ursprüngliche JSON-Datei. Die Referenzinhalte, rekonstruierten Personen/Noten und Vergleichsdokumente sind keine dauerhaften Testfixtures und wurden nicht in Git oder die Quellcodeauslieferung aufgenommen. Alle dauerhaften Tests erzeugen ausschließlich synthetische Daten.

| Kennzahl | Referenz 1.20.2 | Neue Ausgabe |
| --- | ---: | ---: |
| Dokumente je TXT-, Word- und PDF-ZIP | 167 | 51 |
| Schülerberichte je ZIP | 139 | 23 |
| Schülerberichte ohne relevante Angaben | 116 | 0 |
| PDF-Seiten im vollständigen ZIP | 191 | 51 |
| Schülerberichte mit zweiter PDF-Seite | 23 | 0 |
| Word-Seiten nach unabhängiger LibreOffice-Darstellung | 169 | 53 |
| Word-Tabellen | 259 | 137 |

Alle 236 Einzelnoteneinträge der Schülerberichte und 40 manuellen Halbjahres-/Zeugnisnoten wurden gegen die TXT-Referenz geprüft und erhalten. Die berechneten Gesamtdurchschnitte stimmen überein. Alle neuen relativen Pfade stammen aus der bisherigen Struktur; TXT, Word und PDF verwenden dieselben 51 Dokumente. Die bereits vorher mehrseitige Word-Fachübersicht und ein Word-Schülerbericht behalten ihre Seitenzahl. Die neuen PDF-Dokumente dieses Vergleichs sind jeweils einseitig. Daraus folgt keine künstliche Seitenbegrenzung für größere Bestände.

## Dauerhafte Qualitätsprüfungen

Die neuen Gruppen `v1203`, `v1203-storage`, `v1203-browser` und `v1203-files` sind im bestehenden lokalen Testkatalog integriert. Ein synthetischer Vergleich mit fünf Klassen, sieben Fächern, zwei Schuljahren einschließlich abgeschlossenem Jahr, 139 Fach-Schülerzuordnungen und 16 Leistungen prüft ebenfalls 167 zu 51 Dokumente. Zusätzliche Fälle decken ausschließlich Abschlussnoten, Bemerkungen, besonderen Status, offene leere Ergebnisse, historische Festlegungen und Altleistungen ab. Langtexte und ein 60-Schüler-Bestand bleiben mehrseitig möglich.

17 tatsächliche Berichtsfälle werden in TXT, CSV, Word, Excel und PDF erzeugt und mit unabhängigen Lesern geöffnet. Die drei echten ZIPs enthalten 153 Formatdokumente. Die Prüfung vergleicht alle Modellwerte, echte Zahlentypen, Bemerkungen und Zuordnungen, öffnet Word zusätzlich in LibreOffice und kontrolliert Seitenzahlen, Textgrenzen sowie wiederholbare Tabellenköpfe. 85 Office-Dateien werden mit dem Open XML SDK, 68 PDF-Dateien mit veraPDF gegen PDF/UA-1 geprüft. Seitenübergreifende Textvergleiche entfernen ausschließlich bekannte Kopf-/Fußzeilenartefakte; keine fachlichen Texte werden ignoriert. Repräsentative PDF-/Word-Seiten wurden zusätzlich visuell kontrolliert. Die automatische Prüfung umfasst 100 gerenderte Berichtseiten zuzüglich 51 PDF-Seiten im neuen Gesamtexport.

Chromium prüft echte ARIA-Tabs, Pfeile/Pos1/Ende/Eingabe/Leertaste, Fokus bei ausgeblendeten Arten und den Bedienweg einer ausgeblendeten Hausaufgabe. Der Exportdialog wird einschließlich Fehlerfokus, Ausgabewechsel und Escape geprüft. axe und fünf Fenster-/CSS-Zoomkombinationen prüfen die Oberfläche. Eine echte Chromium-Druckausgabe kontrolliert dieselben Inhalte und die ungeteilte Übersicht. Die bestehende Regression deckt außerdem alle 32 Kombinationen sichtbarer Arten und deren gespeicherte Einstellungen ab.

Ein synthetischer 1.20.2-Datenstand wird über den produktiven C#-Testhost bytegleich geöffnet. Alle drei gefilterten Gesamtexporte durchlaufen die native Bridge, ZIP-Validierung und atomare Dateischreibung. Noten-JSON, automatische TXT-Listen und Arbeitskontext bleiben unverändert. Die vorhandenen Sicherheits-, Speicher-, Wiederherstellungs-, Mathematik-, CSV-/Excel-, Office-, PDF/UA- und Druckprüfungen bleiben im Release-Katalog.

Der verbindliche abschließende Nachweis ist der frische vollständige Lauf mit `TZ=UTC python3 dev/manage.py release`: alle Testgruppen einschließlich 180.000 Ergebnissen, zwei saubere bytegleiche Builds und vollständiger ZIP-/Entpack-/Starttest. Der Lauf ist nur bei vollständig bestandenem Ergebnis und anschließendem `status --report` gültig. Konkrete Lauf-ID, Schrittzahl, Quell-/Werkzeughash, endgültiger GitHub-Baum und Archivprüfsummen werden im abschließenden Release-Commit dokumentiert, ohne danach den geprüften Quellenbaum zu verändern.

## Verbleibende Liveprüfungen

Nicht durchgeführt: tatsächlicher Windows-GUI-Programmstart, Windows-Dateiauswahl/Drucker, Microsoft Word unter Windows, Windows UIA, NVDA-Sprache/Braille und reale Windows-Skalierung. Linux-/Chromium-/C#-Host-/LibreOffice-/Open-XML-/PDF/UA-Erfolge sind keine solche Livefreigabe. Automatische PDF/UA-Konformität ersetzt keine menschliche Prüfung der vollständigen Lesereihenfolge. Der bestehende Windows-Prüfplan wurde um die neuen Bedienwege ergänzt.

Beim Update das Programm schließen und ausschließlich `Notenblick.exe` sowie den vollständigen Ordner `Programm` ersetzen. Den vorhandenen Ordner `Daten` erhalten. Portable Architektur, Offlinebetrieb, Berechnungen, individuelle Gewichtungen, manuelle Festlegungen, JSON-Sicherungen und automatische Notfalllisten bleiben erhalten. GitHub Actions bleiben deaktiviert.
