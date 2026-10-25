# Exportentwicklung und Prüfgrenzen – 1.10.0

Alle Ausgaben werden im Programm lokal erzeugt. Für die Dateierstellung braucht Windows weder Python, Java, Office noch einen PDF-Drucker. Mitgeliefert werden PDFKit 0.20.2 (MIT) und DejaVu Sans einschließlich Lizenzen und ergänzenden Drittbibliotheks-Hinweisen. Die unveränderten Bibliotheksdateien und Schriftdateien sind in `dev/export-assets-lock.json` mit SHA-256 gesperrt.

## Lokale Entwicklungsprüfungen

1. `python3 dev/manage.py setup` einrichten.
2. `python3 -m pip install -r dev/export-qa-requirements.txt` in der vorgesehenen Entwicklungsumgebung ausführen.
3. Java ab 11 und veraPDF 1.30.3 CLI lokal bereitstellen. Offizielle Quelle: https://software.verapdf.org/rel/ ; Installer: https://software.verapdf.org/rel/verapdf-installer.zip . Version mit `verapdf --version` prüfen. Nicht in das Repository aufnehmen.
4. `NOTENBLICK_VERAPDF` auf das lokale veraPDF-Startskript setzen; alternativ `.tools/verapdf/verapdf` verwenden.
5. `python3 dev/manage.py release` ausführen. Fehlende Prüfwerkzeuge oder verletzte PDF/UA-Regeln stoppen den vollständigen Ablauf.

`tests/v1100.cjs` erstellt ausschließlich synthetische Berichte und echte Dateien unter dem ignorierten Ordner `tests/exports`. `tests/v1100-browser.cjs` prüft tatsächliche Chromium-Downloads, Dialoge, Fokus, Abbruch, responsive Darstellung und Druck-HTML. `tests/export-files.py` öffnet DOCX/XLSX/PDF mit unabhängigen Lesern, vergleicht Inhalte mit dem Berichtsmodell, prüft CSV-Struktur und führt veraPDF für alle Berichtstypen aus. Die nativen Exporttests kompilieren den produktiven C#-Helfer und prüfen Binärdaten, Formatfilter, abgewiesene Dateinamen und atomaren Ersatz.

## PDF-Details

PDFs enthalten eingebettete Schriften, ToUnicode-Zuordnung, Titel, deutsche Dokumentsprache, H1/H2, Table/TR/TH/TD, Spalten-/Zeilenbezug und als Artefakte ausgezeichnete Linien, wiederholte Köpfe und Seitenfüße. Text bleibt auswählbar. Lesereihenfolge folgt dem Berichtsmodell. Sehr breite Matrizen werden in Spaltengruppen aufgeteilt; lange Bemerkungen erscheinen in zugeordneten Absätzen.

Der PDF/UA-Preset von PDFKit 0.20.2 erzeugt eine unvollständige optionale CIDSet-Angabe. Der Export lässt diese nach PDF/UA-1 zulässigerweise weg und verwendet die öffentliche XMP-Schnittstelle für die UA-Identifikation. Zusätzlich maskiert ein schmaler Adapter die vom Bibliotheksserializer unmaskiert interpolierten Metadaten. Die Bibliotheksdatei selbst bleibt unverändert. Regressionen prüfen Sonderzeichen sowie veraPDF PDF/UA-1.

Ein anfänglicher Metadatenfehler trat im jsdom-Testhost durch einen fremden Typed-Array-Kontext des TextEncoder-Polyfills auf. Der Testhost liefert nun Arrays aus dem Browserkontext. Die echte Chromium-PDF wird zusätzlich unabhängig geprüft.

## Weiterhin erforderliche manuelle Abnahme

Automatische PDF/UA-Regeln ersetzen keine menschliche Prüfung von Tabellenverständlichkeit, Lesereihenfolge und NVDA-Navigation. Tatsächliche Windows-x64-/ARM64-Starts, WebView2-Speicherdialoge einschließlich Überschreiben/Abbruch, NVDA mit Word/Excel/Adobe Reader und physische A4-/Schwarz-Weiß-Drucke müssen unter Windows abgenommen werden. Linux-/Chromium- und LibreOffice-Renderprüfungen sind keine solchen Livetests. Die Auslieferung ist bis zu dieser Abnahme ein Entwicklungskandidat.
