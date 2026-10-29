# Prüfbericht – Notenblick 1.20.2

Stand 29. Oktober 2026. Ausgangspunkt: privates `sappelmueller/Notenblick`, Repository-ID 1432518047, `main` bei `1cc28c8371de24cca962942a39f3ae9862f570c3`, Baum `5a32815ba0b03ec3982cc64064138c74bace03d7`, 248 anhand ihrer Git-Objekte bestätigte Quelldateien. GitHub Actions deaktiviert. Ausschließlich lokale Werkzeuge und synthetische Testdaten. Keine neuen Laufzeitabhängigkeiten.

## Ursachen und neue Berichtsstruktur

Der alte vollständige Fachbericht hängte die gesamten Einzelberichte sämtlicher Schüler an: Gesamtergebnis, Gewichtung, Leistungsbereiche und Einzelnoten wiederholten sich je Person. Dazu kamen offene Zeilen, allgemeine Berechnungsstatusabschnitte und künstliche Umbrüche. Die Breitenplanung behandelte lange Überschriften der zentralen Notenübersicht wie beliebige Leistungsmatrizen und teilte selbst acht Spalten horizontal.

`buildReport` und `buildExtendedReport` erzeugen jetzt eine Fachübersicht und gemeinsame Klassentabellen je verwendeter Leistungsart. Mündliche Einzelnoten werden kompakt gesondert zugeordnet. Tatsächliche Bemerkungen erscheinen einmal gesammelt; abgeschaltete Bemerkungen entfernen auch historische Bemerkungsspalten. Originale historische Leistungen, Zuordnungsabweichungen, frühere Zeugnisse und tatsächlich ungeklärte Altbestände bleiben gezielt sichtbar. Normale fehlende Noten verursachen keinen Sonderabschnitt. Die Leistungsliste enthält nur die angelegten Leistungen, erfasste Bewertungen, Datum, Art und Klassendurchschnitt. Selbständige Schülerberichte bleiben ausführlich, enthalten standardmäßig vorhandene Einträge und erlauben weiterhin ausdrücklich alle Leistungen.

`reportLayout` hält zentrale Notenübersichten immer in einer einzigen Tabelle. Acht wesentliche Spalten mit kurzen Bezeichnungen passen bei lesbarer Schrift auf A4 quer. Zusätzliche Leistungsarten konzentrieren die zentrale Übersicht auf die wesentlichen Bereiche; vollständige Einzelnoten bleiben in den Leistungsteilen. Nur umfangreiche Leistungsmatrizen dürfen in zusammengehörige Gruppen mit Schülernamen und Durchschnitt aufgeteilt werden. Alle Tabellen laufen vertikal weiter und wiederholen ihre Köpfe. Keine erzwungenen Seitenumbrüche. Klassenmittelwerte kommen aus den bestehenden exakten Domainfunktionen; fehlende Noten zählen nie als Null, festgelegte Abschlussnoten bleiben unabhängig.

TXT, Word, PDF, Excel, CSV und Druck verwenden dasselbe zentrale Modell und die bestehenden Renderer. Word/PDF/Druck behalten grüne Tabellenköpfe, Überschriftenhierarchie, Kopf-/Fußzeilen und Seitenzahlen bei kompakteren Abständen. Excel nutzt ein Blatt je logischer Tabelle mit echten Zahlen, passender Genauigkeit, Filtern und fixierten Köpfen. Gemischte CSV-Berichte verwenden eine kohärente lange Tabelle mit Abschnitt, Schüler, Bezug, Angabe und Wert; einfache Übersichtstabellen bleiben breit. Der vorhandene Formelschutz bleibt erhalten. Der normale TXT-Gesamtexport nutzt dasselbe Modell wie Word/PDF, denselben Verzeichnisplan und die bestehende native Prüfung. Automatische TXT-Notfalllisten bleiben separat und unverändert.

## Vergleich mit echten Dokumenten

Das benannte private Negativbeispiel wurde außerhalb des Repositorys ausschließlich zur anonymisierten Strukturanalyse und lokalen Darstellung geöffnet: 38 LibreOffice-Seiten, 138 Tabellen, darunter 23 Gesamtergebnistabellen. Keine Namen, Noten oder Dateiinhalte wurden in Quellcode, Prüfberichte oder GitHub übernommen. Dieser echte Datenbestand wurde nicht als Testfixture verwendet.

Ein dauerhaft synthetisch erzeugter Vergleichsfall mit 23 Schülern, sechs Leistungen einschließlich mündlicher Einzelnoten, langen und gleichen Namen, fehlenden Bewertungen, besonderem Status, GFS/Faktor, vier tatsächlichen Bemerkungen und manuellen Halbjahres-/Jahresnoten wurde mit beiden Programmständen verglichen:

| Kennzahl | 1.20.1 | 1.20.2 |
| --- | ---: | ---: |
| Word-Seiten, tatsächlich durch LibreOffice gerendert | 37 | 6 |
| PDF-Seiten, gemeinsamer PDF-Renderer | 42 | 6 |
| Word-Tabellen | 137 | 6 |
| Excel-Blätter | 136 | 6 |

Die Zahlen beziehen sich auf denselben synthetischen Datenbestand, nicht auf eine neu exportierte Kopie des privaten Beispiels. Die tatsächlichen Modellwerte, Einzelnoten, Bemerkungen und Abschlussnoten werden unabhängig in allen Formaten verglichen. Weitere Fälle decken 60 Schüler, 48 Leistungen, sämtliche verwendeten einschließlich ungewichteter Arten, Historie und vier Nachkommastellen ab. Repräsentative Word-/PDF-Seiten wurden visuell kontrolliert; die vollständigen Seiten werden zusätzlich automatisiert auf Inhalte, Köpfe, Seitenzahlen und Textgrenzen geprüft.

## Dauerhafte Prüfungen und Freigabe

Neue Gruppen `v1202`, `v1202-storage`, `v1202-browser`, `v1202-files`: 14 Berichtsfälle in fünf Dateiformaten, achtspaltige ungeteilte Übersicht, vollständige Leistungs-/Bemerkungszuordnung, echte Dokumentöffnung über python-docx/openpyxl/pypdf, vollständige LibreOffice-Darstellung, Open XML SDK und veraPDF PDF/UA-1; echte Chromium-Druckausgabe, axe, Tastatur, Fokus, Beschreibungen und fünf Breiten-/Zoomkombinationen. Die drei vollständigen ZIP-Formate und fünf Schüler-ZIP-Formate durchlaufen die produktive C#-Validierung und atomare Dateischreibung im Linux-Testhost. Notendatei eines vorhandenen 1.20.1-Bestands, Ansichten und automatische TXT-Inhalte bleiben bytegleich.

Bestehende Regressionen bleiben im Testkatalog. Geänderte Darstellungserwartungen prüfen nun kurze Überschriften mit vollständiger Bedeutung, gemeinsame Tabellen statt absichtlicher Redundanz, optionale Spalten und das kohärente CSV-Schema; die exakten Werte, Vollständigkeit, Native-Sicherheitsprüfungen und Datensicherheitsprüfungen bleiben verbindlich. Der abschließende frische vollständige Lauf erfolgt mit `TZ=UTC python3 dev/manage.py release`; gültige Freigabe nur bei vollständig bestandenem Ergebnis und anschließendem `status --report`. Lauf-ID, Inhalts-/Werkzeughash und Archivprüfsummen werden nach Abschluss im Git-Commitnachweis dokumentiert, ohne den geprüften Quellenbaum zu verändern.

## Grenzen und Windows-/NVDA-Prüfung

Linux-, Chromium-, C#-Host-, LibreOffice-, Open-XML- und PDF/UA-Prüfungen sind keine Windows-, Microsoft-Word- oder NVDA-Livetests. Nicht durchgeführt: echter Windows-Programmstart, Windows-Dateiauswahl/Drucker, Word unter Windows, NVDA-Sprachausgabe/Braille und reale Windows-Skalierung. Automatische PDF/UA-Konformität ersetzt keine menschliche Prüfung der vollständigen Lesereihenfolge. Vor einer entsprechenden Livefreigabe auf Windows 10/11: alle Exporttypen und Formate, Notenübersicht ohne horizontale Teilung, Dialogbeschreibungen/Fokus/Abbruch, große/mehrseitige Tabellen und NVDA-Navigation durch Überschriften/Tabellen prüfen. Keine pauschale Livefreigabe aus den automatisierten Ergebnissen.

Beim Update ausschließlich `Notenblick.exe` und den vollständigen Ordner `Programm` bei geschlossenem Programm ersetzen; vorhandenen Ordner `Daten` unverändert erhalten. ZIP-Ordnerstruktur, native Exportgrenzen und Pfad-/CRC-/Inhaltsprüfungen sowie Sicherungen, Wiederherstellung und Berechnungsarchitektur bleiben erhalten.
