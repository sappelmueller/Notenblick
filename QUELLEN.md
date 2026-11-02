> Historischer Hintergrund zur Datumseingabe. Aktueller Einstieg: docs/PROJEKTUEBERSICHT.md; Bibliotheksquellen: THIRD-PARTY-NOTICES.md.

# Quellen und Datumsbeschriftung – Notenblick 1.7.0

Quellenstand aus Version 1.5.0 unverändert übernommen. Die externe Quellenprüfung wurde für 1.6.0 nicht erneut ausgeführt; die lokale Datumslogik und der Chromium-Accessibility-Baum wurden erneut geprüft.

Die Kürzelvorschläge stammen aus dem offiziellen Abkürzungsverzeichnis des Bildungsplans Baden-Württemberg: https://www.bildungsplaene-bw.de/,Lde/30914844. Der lokal mitgelieferte Vorschlagskatalog steht in `src/data/subjects.json`; Fachnamen bleiben vollständig gespeichert. Eigene Kürzel werden ausschließlich in Ansicht.json abgelegt. Der Katalog wird beim Erstellen in ein lokales JavaScript-Modul übersetzt, damit die Anwendung keine Internetverbindung oder JSON-Netzwerkabfrage benötigt.

Die Jahresansage wurde am Chromium-Quellcode untersucht:

- Definition `IDS_AX_YEAR_FIELD_TEXT`: https://chromium.googlesource.com/chromium/src/+/main/ui/strings/ax_strings.grd
- Deutsche Übersetzung: https://chromium.googlesource.com/chromium/src/+/main/ui/strings/translations/ax_strings_de.xtb

Die englische Ressourcenzeichenfolge Year besitzt die Grit-Kennung 6015796118275082299; diese Kennung ist in der deutschen Ressource mit Baujahr übersetzt. Die Kennung wurde durch den üblichen MD5-basierten Grit-Fingerprint der Zeichenfolge und den Ressourceneintrag abgeglichen. Die Definition beschreibt ausdrücklich das Jahresfeld eines Datums-/Zeit-Steuerelements. Das erklärt die gemeldete Bezeichnung; sie stammt nicht aus einem von Notenblick vergebenen Jahreslabel.

Ein HTML-Label am gesamten input[type=date] ersetzt nicht gezielt die Accessibility-Namen seiner internen Segmente. Notenblick greift weder in den internen Browser-DOM noch in WebView2-Sprachpakete ein. Die zwei fachlichen Datumsfelder nutzen deshalb eine gemeinsame, kompakte Gruppe aus nativen Zahlen-Drehfeldern mit den eigenen Labels Tag, Monat und Jahr. Pfeiltasten nach oben/unten, direkte Zifferneingabe, Links/Rechts zwischen Segmenten und das Einfügen vollständiger Datumswerte werden unterstützt. Die Werte bleiben im bestehenden ISO-Format; echte Kalenderdaten werden vor der Übernahme geprüft. Es wird kein eigener Kalender entwickelt. Die bisherige native Kalender-Schaltfläche entfällt bei dieser Eingabe.

Der erzeugte Accessibility-Baum wird in Chromium auf Tag/Monat/Jahr geprüft. Das ist ausdrücklich kein Nachweis der gesprochenen NVDA-Ansage unter Windows. Ein tatsächlicher Windows-/NVDA-Livetest bleibt separat erforderlich.


## Prozentfelder in 1.7.0

Chromium 156 wurde mit deutscher Sprach-/Gebietseinstellung im Browserkontext und echter Tastatureingabe geprüft. Ein natives number-Feld verwarf bei „33,33“ das Komma und lieferte 3333; dies ist für Gewichte ungeeignet. Der gemeinsame Editor verwendet deshalb die normale Texteingabe mit ARIA-Drehfeldsemantik, exakter Dezimalvalidierung und Pfeiltasten. Es gibt keine Eingriffe in interne Browser-Steuerelemente.

Die Ausführung folgt dem W3C-Muster für Texteingaben als Spinbutton:

- https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
- https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/quantity-spinbutton/
- https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/

Die aktuelle W3C-Anleitung erlaubt das Weglassen von aria-valuenow bei unbekanntem/ungültigem Eingabewert. Gültige Werte, Grenzen, kurze lokalisierte Wertdarstellung und aria-invalid werden gemeinsam aktualisiert. Die normale Textbearbeitung mit Auswahlmodifikatoren bleibt erhalten. Es gibt keine weiteren Plus-/Minus-Schalter oder Live-Regionen. Labels, Werte und die Kommatrennung der Leistungsnamen wurden im tatsächlichen Chromium-Accessibility-Baum geprüft. Ein NVDA-Livetest unter Windows wurde nicht durchgeführt.


## Weiterführung in 1.8.0

Die vorhandenen lokalen Kürzel, Datumskomponenten und ARIA-Bedienmuster wurden unverändert weiterverwendet. Für diese Version wurden keine neuen externen Informationsquellen oder Laufzeitdienste eingeführt. Programm und Datenverarbeitung bleiben vollständig lokal. Die erneut ausgeführten Browser-, Speicher- und Berechnungstests sind in PRUEFBERICHT.md dokumentiert.
