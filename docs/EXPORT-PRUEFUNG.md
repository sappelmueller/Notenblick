# Exportentwicklung und Prüfgrenzen – 1.21.0

Alle Ausgaben werden im Programm lokal erzeugt. Für die Dateierstellung braucht Windows weder Python, Java, Office noch einen PDF-Drucker. Mitgeliefert werden PDFKit 0.20.2 (MIT) und DejaVu Sans einschließlich Lizenzen und ergänzenden Drittbibliotheks-Hinweisen. Die unveränderten Bibliotheksdateien und Schriftdateien sind in `dev/export-assets-lock.json` mit SHA-256 gesperrt.

## Lokale Entwicklungsprüfungen

1. `python3 dev/manage.py setup` einrichten.
2. `python3 -m pip install -r dev/export-qa-requirements.txt` in der vorgesehenen Entwicklungsumgebung ausführen.
3. Java ab 11 und veraPDF 1.30.3 CLI lokal bereitstellen. Offizielle Quelle: https://software.verapdf.org/rel/ ; Installer: https://software.verapdf.org/rel/verapdf-installer.zip . Version mit `verapdf --version` prüfen. Nicht in das Repository aufnehmen.
4. `NOTENBLICK_VERAPDF` auf das lokale veraPDF-Startskript setzen; alternativ `.tools/verapdf/verapdf` verwenden.
5. `python3 dev/manage.py release` ausführen. Fehlende Prüfwerkzeuge oder verletzte PDF/UA-Regeln stoppen den vollständigen Ablauf.

`tests/v1100.cjs` erstellt ausschließlich synthetische Berichte und echte Dateien unter dem ignorierten Ordner `tests/exports`. `tests/v1100-browser.cjs` prüft tatsächliche Chromium-Downloads, Dialoge, Fokus, Abbruch, responsive Darstellung und Druck-HTML. `tests/export-files.py` öffnet DOCX/XLSX/PDF mit unabhängigen Lesern, vergleicht Inhalte mit dem Berichtsmodell, prüft CSV-Struktur und führt veraPDF für alle Berichtstypen aus. Die nativen Exporttests kompilieren den produktiven C#-Helfer und prüfen Binärdaten, Formatfilter, abgewiesene Dateinamen und atomaren Ersatz.

## Word- und Paketvalidierung

`setup` richtet zusätzlich Microsoft Open XML SDK 3.3.0 als reines Entwicklungsprüfwerkzeug ein. Die drei offiziellen NuGet-Pakete sind mit Versionen, NuGet-Abhängigkeitssperre und SHA-256 der Archive unter `dev/openxml-validator` festgelegt. Der Compiler und die .NET-Referenzen stammen aus dem bestehenden gesperrten SDK. `python3 dev/openxml-check.py setup` darf die Pakete einmalig laden; spätere Validierungen laufen aus dem geprüften lokalen Cache offline. Open XML SDK und System.IO.Packaging stehen unter MIT (Projektquellen: https://github.com/dotnet/Open-XML-SDK und https://github.com/dotnet/runtime). Das Werkzeug und seine Abhängigkeiten werden nicht mit der Windows-Anwendung ausgeliefert.

`tests/office-schema.py` verwendet `OpenXmlValidator` für sämtliche erzeugten DOCX-/XLSX-Pakete und alle Teile, einschließlich semantischer Beziehungen. Zusätzliche unabhängige XML-/ZIP-Prüfungen kontrollieren CRC, interne Ziele, Tabellenraster, Zeileneigenschaften, Sprache, A4-Abschnitte und ausschließlich lokale PAGE-/NUMPAGES-Felder ohne `updateFields`. Absichtlich fehlerhafte Pakete müssen abgewiesen werden. Die Anwendung selbst prüft Office-Pakete vor Speicherung auf vollständige ZIP-/CRC-/XML-Integrität und lokale Beziehungen, benötigt dabei keine zusätzlichen Office-Bibliotheken.

`tests/v1110.cjs` ergänzt 4/5/6/7/8/9/10/12/15/20/24 Spalten, sehr kurze und sehr lange Inhalte, mindestens 9 Punkt sowie fehlerfreie unveränderte Daten. `tests/v1110-browser.cjs` prüft echte Downloads, dynamische Anzahlen, alle sechs Formate, Abbruch während der Erstellung, Seitenformat und Startseiten-DOM bei neuen/vorhandenen synthetischen Daten und verschiedenen CSS-Zoomstufen. `tests/v1110-storage.cjs` prüft das bytegleiche Öffnen von 1.10.0 sowie Exporte, Sicherung und Wiederherstellung.

Eine vollständige SDK-Validierung ist kein Microsoft-Word-Livetest. LibreOffice-Render und lokale Feldberechnung bestätigen die Darstellung in LibreOffice; die Abwesenheit einer Word-Warnmeldung muss zusätzlich unter echtem Word geprüft werden. Die frühere Zeileneigenschaftsreihenfolge wird vom SDK akzeptiert; die Ausgabe verwendet nun konsistent `cantSplit` vor `tblHeader` und prüft beide Funktionen ausdrücklich.

## PDF-Details

PDFs enthalten eingebettete Schriften, ToUnicode-Zuordnung, Titel, deutsche Dokumentsprache, H1/H2, Table/TR/TH/TD, Spalten-/Zeilenbezug und als Artefakte ausgezeichnete Linien, wiederholte Köpfe und Seitenfüße. Text bleibt auswählbar. Lesereihenfolge folgt dem Berichtsmodell. Die zentrale Layoutplanung schätzt Mindest- und Wunschbreiten anhand von Spaltenart, Überschrift und typischen/tatsächlichen Zellinhalten. Hochformat wird vor Querformat geprüft; 10 beziehungsweise mindestens 9 Punkt. Erst tatsächlicher Platzmangel teilt Matrizen in verständlich benannte Teile mit wiederholten Namen und Durchschnitten; lange Bemerkungen erscheinen in zugeordneten Absätzen.

Der PDF/UA-Preset von PDFKit 0.20.2 erzeugt eine unvollständige optionale CIDSet-Angabe. Der Export lässt diese nach PDF/UA-1 zulässigerweise weg und verwendet die öffentliche XMP-Schnittstelle für die UA-Identifikation. Zusätzlich maskiert ein schmaler Adapter die vom Bibliotheksserializer unmaskiert interpolierten Metadaten. Die Bibliotheksdatei selbst bleibt unverändert. Regressionen prüfen Sonderzeichen sowie veraPDF PDF/UA-1.

Ein anfänglicher Metadatenfehler trat im jsdom-Testhost durch einen fremden Typed-Array-Kontext des TextEncoder-Polyfills auf. Der Testhost liefert nun Arrays aus dem Browserkontext. Die echte Chromium-PDF wird zusätzlich unabhängig geprüft.

## Weiterhin erforderliche manuelle Abnahme

Automatische PDF/UA-Regeln ersetzen keine menschliche Prüfung von Tabellenverständlichkeit, Lesereihenfolge und NVDA-Navigation. Tatsächliche Windows-x64-/ARM64-Starts, WebView2-Speicherdialoge einschließlich Überschreiben/Abbruch, NVDA mit Word/Excel/Adobe Reader und physische A4-/Schwarz-Weiß-Drucke müssen unter Windows abgenommen werden. Linux-/Chromium- und LibreOffice-Renderprüfungen sind keine solchen Livetests. Die Auslieferung ist bis zu dieser Abnahme ein Entwicklungskandidat.

## Ergänzungen 1.12.0

`tests/v1120.cjs` erzeugt Sammelexporte für 1/10/28/40/100 Schüler in allen fünf Dateiformaten sowie 38 mehrseitige Word-/PDF-Testfälle. `tests/v1120-browser.cjs` prüft echte ZIP-Downloads, Auswahl, Abbruch während der Erstellung, Fokus, axe, Dialogskalierung und gerenderte Druckseiten. `tests/v1120-files.py` liest jede Archivdatei unabhängig, führt vollständige Open-XML- und veraPDF-Prüfungen aus und kontrolliert jede tatsächlich gerenderte Tabellen-Fortsetzungsseite in PDF, Chromium-Druck und LibreOffice. Die Prüfmatrix umfasst 10/20/28/40/60 Schüler, 3/7/8/10/15/24 Spalten und umfangreiche Schülerberichte in acht Optionskombinationen. Kein Test zählt nur CSS beziehungsweise `tblHeader` als Rendernachweis.

Der Seitenprüflauf benötigt LibreOffice. `NOTENBLICK_LIBREOFFICE` kann auf das lokale `soffice` zeigen; in der primären Codex-Laufzeit wird deren gebündelter Renderer automatisch verwendet. Die Prüfung verwendet isolierte Profile und beschreibbare HOME-/XDG-Verzeichnisse. Die Renderer und Prüfabhängigkeiten sind ausschließlich Entwicklungswerkzeuge und werden nicht in die Windows-Anwendung aufgenommen.

Die gemeinsame ZIP-Komponente wird auch für OOXML weiterverwendet. Sammelexporte behalten binäre Einträge als Chunks bis zur Blob-Erstellung; es wird keine zweite vollständige JavaScript-Archivkopie angelegt. Der native Kanal verarbeitet maximal 64 MiB für ZIP (bestehende JSON-Sicherungsgrenze weiterhin 256 MiB). Vor dem Speichern werden Archivverzeichnis, CRC, Dateinamen, einheitliches Format und die enthaltenen Office-Pakete einzeln geprüft. Native Übergabe und atomare Speicherung benötigen keine neuen temporären Schülerdateien.

Word-Kopfzeilen enthalten ausschließlich statischen Text. Die erste Kopfzeile bleibt leer; der vollständige Berichtskopf steht weiterhin im Dokument. Fortsetzungsseiten tragen die kurze Orientierung. Erste und folgende Fußzeilen verwenden dieselben bisherigen PAGE-/NUMPAGES-Felder, ohne globale Feldaktualisierung oder externe Beziehungen. PDF-Wiederholungen und Seitendekoration sind Artefakte; die eigentlichen Spaltenköpfe bleiben semantische TH-Zellen. Druck verwendet wiederholtes `thead` und Chromium-Seitenränder. Excel-Drucktitel und genau eine CSV-Kopfzeile bleiben unverändert.

## Ergänzungen 1.13.0

`tests/v1130.cjs` vergleicht die Klassendurchschnitte mit der Bildschirmzeile und unabhängigen Aufrufen der zentralen Berechnung: Suche/keine Treffer/Alle, aktive und ausgeschiedene Fachteilnehmer, leere Noten, direkte und gruppierte Fachgewichte, Faktoren und sämtliche Rundungsmodi. Schüler-/Leistungs-/Einzelnotenlisten erhalten keine unpassenden Ergebniszeilen. `v1130-storage.cjs` öffnet einen synthetischen 1.12.0-Bestand über den produktiven C#-Kern, prüft unveränderte Notendateien nach Einzel-/Sammel-/Klassenexporten und Sicherung/Wiederherstellung.

`v1130-browser.cjs` kontrolliert beide Ausgabe-Erklärungen im tatsächlichen Chromium-Accessibility-Baum, Tastatur und Tab-Reihenfolge, Fokus, axe sowie zwölf Fenster-/Zoomkombinationen. Druckvorschauanforderung wird ausschließlich simuliert; die Druckseiten werden tatsächlich mit Chromium gerendert. `v1130-files.py` öffnet alle sechs Formen unabhängig, kontrolliert jede gerenderte Fortsetzungsseite auch nach LibreOffice-Word-Konvertierung, die Werte/Zuordnung der Ergebniszeile, Seitennummern, Textbegrenzungen und vollständige Open-XML-/PDF/UA-Validierung. Excel-Fußzeilen bleiben außerhalb des Autofilters und der unveränderten Drucktitel; CSV bekommt keine wiederholten Kopfzeilen. HTML-tfoot wird beim Drucken als einmalige Zeilengruppe gesetzt.

Die bestehende WebView2-Version 1.0.2903.40 bleibt unverändert. Der feste lokale Nachrichtenkanal öffnet `ShowPrintUI(CoreWebView2PrintDialogKind.Browser)` auf dem UI-Thread; bei nicht unterstützter Laufzeit bleibt `window.print()` der Vorschau-Fallback. Der Kanal hat wie der Speicherdialog keinen Bedienungs-Timeout. CSS `@page` setzt A4 und die gemeinsam berechnete Ausrichtung. ShowPrintUI nimmt keine PrintSettings entgegen. Print/PrintAsync mit PrintSettings würde ohne Vorschau drucken und wird deshalb nicht verwendet. Die Anwendung verändert weder Druckertreiber-Voreinstellungen noch Office-/Windows-Sicherheit. Im vorhandenen Seitenformathinweis steht beim Drucken kurz „Empfohlen: A4 quer/hoch. Bitte in der Druckvorschau prüfen.“ Diese Empfehlung ist keine Zusicherung einer WebView2-/Treiber-Vorbelegung.

Offizielle Schnittstellenbeschreibung: https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/print und https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.core.corewebview2.showprintui . Tatsächliche Druckdialog-/Druckerorientierung muss weiterhin unter Windows mit der installierten WebView2-Laufzeit und dem verwendeten Drucker geprüft werden.

## Ergänzungen 1.20.2

Zentrale Notenübersichten sind unteilbare Tabellen mit höchstens acht wesentlichen Spalten auf A4 quer. Sie dürfen niemals horizontal aufgeteilt werden; zusätzliche Leistungsdetails stehen in den jeweiligen Leistungsarten. Die frühere allgemeine Matrixregel gilt nur für umfangreiche Leistungstabellen. `buildExtendedReport(complete)` verbindet Fachübersicht und gemeinsame Klassentabellen statt vollständiger Schülerberichte. `intro` enthält die einmalige Gewichtung und die Spaltenlegende. Normale fehlende Noten erzeugen keinen technischen Berechnungsstatus. Bemerkungen und echte historische Angaben bleiben optional und gezielt zugeordnet.

`v1202` erstellt 14 synthetische Fälle in fünf Formaten. `v1202-files` vergleicht alle Modellwerte mit unabhängig geöffneten Dateien, rendert jedes Word-Dokument über LibreOffice und prüft PDF-Seiten, Tabellen, Kopf-/Fußzeilen, Open XML und PDF/UA-1. `v1202-browser` ergänzt echte Chromium-Druckseiten, dynamische Beschreibungen, Fokus, axe und schmale/skalierte Ansichten. `v1202-storage` exportiert vollständige TXT-/Word-/PDF-ZIPs und alle Schüler-Sammelformate durch die produktive native C#-Prüfung und Dateischreibung. Das bytegleiche Öffnen von Altdaten und unveränderte automatische TXT-Notfalllisten sind verbindlich. Vergleichskennzahlen stehen in `tests/v1202-baseline.json`, ausschließlich anonymisierte Strukturzahlen; das private Negativbeispiel selbst ist kein Testdatum und wird niemals eingecheckt.

Heterogene CSV-Berichte besitzen das lange Schema Abschnitt/Schüler/Bezug/Angabe/Wert, einfache Übersichten weiterhin eine breite Tabelle. Excel-Daten bleiben numerisch, unverbunden und filterbar; nur die Metadatenzeile darf verbunden sein. Reale Windows-/Microsoft-Word-/NVDA-Livetests bleiben separat erforderlich.

## Ergänzungen 1.20.3

Die vier Gruppen v1203 prüfen gefilterte Gesamtexporte, unabhängige Schülerauswahl, mündliche Besetzungsfälle und gemeinsame Daten in allen Formaten. Fachinformationen ohne Tabellen benötigen ein gültiges Excel-Blatt und eine CSV-Hinweiszeile. Gleichnamige Leistungen erhalten fachweit stabile Zuordnungen. PDF-/Word-Seitentext wird einschließlich mehrseitiger Bemerkungen verglichen; ausschließlich bekannte Seitenkopf-/Fußzeilen dürfen aus dem linearen Vergleich entfernt werden. Native ZIP-Sicherheitsprüfungen bleiben vollständig aktiv. Konkrete Referenzzahlen und Nachweisgrenzen stehen in PRUEFBERICHT-1.20.3.md.

## Ergänzungen 1.21.0

Einzelne Leistungsberichte verwenden weiterhin das gemeinsame Modell und alle sechs Ausgaben. Der Kontext enthält genau eine assessmentId und eine unabhängige Datenkopie; aktuelle Filter betreffen die sichtbare Teilnehmerliste. Punkte stehen ausschließlich in Einzelberichten beziehungsweise optional kompakt in Schülernotenzellen. Normale TXT-Leistungsberichte sind linear, ohne künstliche Tabellen. CSV-Einzelberichte mit Punkten führen die einmaligen Schlüsselhinweise vor dem gleichbreiten Datenschema auf. Die v1210-Dateiprüfung öffnet 15 Fälle in fünf Formaten und drei vollständige ZIPs, vergleicht Zellinhalte, prüft 41 Open-XML-Pakete und 26 PDF/UA-Dateien sowie die native ZIP-Schreibkette. Der zusätzliche Chromium-Druck wird anhand desselben Modells geprüft. Keine allgemeinen Layout- oder Rendereränderungen.
