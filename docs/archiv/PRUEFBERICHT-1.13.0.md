# Notenblick 1.13.0 – Prüfbericht

Stand: 26. Oktober 2026. Tests ausschließlich mit synthetischen Schülern und Leistungen.

## Grundlage und Schutz

Privates Repository `sappelmueller/Notenblick`, ID 1432518047, Branch main. Ausgangsbasis 1.12.0: Commit `7e928f6580e13496047a8334bbf825fa648cb188`, Quellbaum `48149adb20321080c741f20890fda5410196f171`; lokaler Ausgangsbaum exakt verglichen. GitHub Actions bleiben deaktiviert. Keine Runner/Workflows angelegt, TrainScope nicht bearbeitet.

Die gesperrten mathematischen Domänenmodule sowie produktive Datenspeicherung und Migration bleiben bytegleich. Die neue Version ist als kompatible Anwendungsversion aufgenommen; keine neue Datenmigration. Portable Struktur EXE/Programm/Daten bleibt erhalten. Die Windows-Ausgabe enthält keine Nutzerdaten, Beispielnoten oder Sicherungen.

## Gezielte Änderungen

- Ausgabe-Erklärung bei ausgewähltem Schüler und beim ZIP-Sammelexport immer sichtbar und über aria-describedby zugeordnet. Tatsächliche Anzahl, keine zusätzliche Live-Region, kein Fokuswechsel; vorhandene Leistungs- und Anordnungserklärungen erhalten.
- Vorhandener Druckinhalt mit A4 und gemeinsam berechneter Orientierung wird nach fertigen Schriften an die WebView2-Browser-Druckvorschau übergeben. Printerwahl/Vorschau, Escape, afterprint-Bereinigung und Ausgangsfokus bleiben erhalten. Nicht unterstützte Laufzeit fällt auf window.print zurück; kein stiller Druck und kein eigener Dialog.
- Klassendurchschnitt in passenden Klassenübersichten und Leistungsmatrizen in allen sechs Ausgabeformen. Bildschirm und Export verwenden dieselben aktiven Fachteilnehmer und zentralen individuellen Berechnungen, unabhängig von Suche/Umfang. Zentrale Rundung erst zur Darstellung, keine Nullnote für fehlende Werte, keine Mittelung manueller Zeugnisnoten. Die aktive Klassenbasis wird auch in CSV/Excel verständlich benannt.
- Ergebniszeile dezent hervorgehoben, pro zusammenhängender Tabelle genau einmal und nach Möglichkeit mit dem letzten Schüler verbunden. Keine künstlichen Seitenumbrüche. Excel-Zahlen, Autofilter, fixierte Überschriften/Drucktitel und eine einzige CSV-Kopfzeile bleiben erhalten. Keine Klassenergebniszeile in Schülerberichten oder Einzelnoten-/Leistungslisten.
- Word-Kopf-/Fußzeilen und sichere lokale PAGE-/NUMPAGES-Felder unverändert. Kein updateFields, keine zusätzlichen Datums-/Verknüpfungsfelder und keine externen Beziehungen. Tabellenkopfwiederholung und PDF-TH/TD-Struktur bleiben erhalten.

## Druckschnittstellengrenze

ShowPrintUI bietet keinen PrintSettings-Parameter. Die Ausrichtung wird über CSS @page festgelegt; eine zuverlässige Vorbelegung der installierten Windows-/Druckertreiberoberfläche lässt sich damit nicht zusichern. PrintAsync mit Einstellungen wäre stille Ausgabe und wird nicht verwendet. Der vorhandene Exportdialog zeigt beim Drucken daher zusätzlich „Empfohlen: A4 quer/hoch. Bitte in der Druckvorschau prüfen.“ Offizielle Quellen und manuelle Fälle stehen in EXPORT-PRUEFUNG.md und WINDOWS-PRUEFUNG.md.

## Prüfumfang

Neue permanente Prüffälle: v1130.cjs, v1130-browser.cjs, v1130-storage.cjs und v1130-files.py. Unabhängige Leser für alle sechs Formen; Berechnungs-/Bildschirmparität bei Suche und leeren Treffern, aktive/ausgeschiedene Schüler, fehlende Noten, direkte Fachgewichte und Faktoren, Rundung/Abschneiden mit 0/1/2 Stellen, historische Fachzuordnung. 60 Schüler mit 7/8/10/20 Spalten, schmale Hochformattabelle und echte mehrseitige Word-/PDF-/Chromium-Druckrender. Word-Referenz außerhalb des Repositorys gerendert und strukturell verglichen; keine ihrer Schülerdaten als Testdaten übernommen.

Chromium-Accessibility-Baum, Tastaturwahl und Tab-Reihenfolge, beide Ausgabe-Erklärungen, Fokus und Escape, zwölf Fenster-/Zoomfälle mit axe, simulierte native Vorschau einschließlich Fallback. Die tatsächlichen Druckseiten werden gerendert; dies ist kein Windows-WebView2-Livetest. Alle vorhandenen Berechnungs-, Speicher-, Wiederherstellungs-, ZIP-, Belastungs-, Schema-, PDF/UA- und Browserprüfungen werden im lokalen Releaseablauf erneut ausgeführt. Nur der abschließend erfolgreiche Gesamtlauf gilt als Prüfergebnis.

## Abnahmegrenzen

Keine Windows-/WebView2-/Microsoft-Office-/NVDA- oder physischen Druck-Livetests verfügbar. Linux/.NET-Assembly-Prüfung, Chromium, LibreOffice, Open XML SDK und veraPDF sind ausdrücklich getrennte automatisierte Prüfungen. Keine tatsächliche Word-Reparatur-/Feldwarnungsfreiheit unter Microsoft Word behauptet: Der technische Schutz wird an den erzeugten Paketen geprüft, die unveränderten Felder und Beziehungen werden validiert, LibreOffice öffnet/rendert sie. Keine Sicherheitsmechanismen verändert.

Bis zur manuellen Windows-/Office-/NVDA-Abnahme bleibt diese Ausgabe ein lokal geprüfter Entwicklungskandidat.

## Korrigierter Prüfablauf

Ein erster Gesamtlauf stoppte bei der neuen Druckprüfung: Das neue Browser-Prüfskript emulierte vor der PDF-Aufnahme bereits das Ende des Druckmediums. Die produktive, beabsichtigte Bereinigung entfernte dadurch den Druckinhalt und seine A4-Regel; je nach Ereigniszeitpunkt wurde eine leere Hochformatseite aufgenommen. Der Test hält das Druckmedium nun bis nach der Aufnahme aktiv und prüft unmittelbar vorher den vorhandenen Druckinhalt. Die Sollprüfung für A4-Orientierung, vollständige Inhalte und Ergebniswerte wurde nicht abgeschwächt. Der Vorlauf ist keine Freigabe; maßgeblich ist ausschließlich der anschließend vollständig erfolgreiche Release-Lauf.

## Abschließender Release-Lauf

`python3 dev/manage.py release` vollständig erfolgreich: **47 Prozessschritte, sämtliche Rückgabewerte 0**. Erneuter sauberer Windows-Build bytegleich; produktiver Assembly-Lader vor und nach Wiederholungsbuild bestanden. Beide ZIP-Archive wurden auf Integrität und vollständigen Dateibestand geprüft; die entpackte Ausgabe startet und besteht Einrichtung/Navigation/Einstellungen/mündliche Eingabe im Linux-Testhost. Dies ist ausdrücklich kein tatsächlicher Windows-Programmstart.

- 14 Infrastrukturregressionen sowie 16.160 Berechnungs-/Speicherprüfgruppen und alle bisherigen Gewichtungs-, Speicher-, Wiederherstellungs-, Browser- und Belastungsprüfungen bestanden. Diese unterschiedlichen Prüfgranularitäten werden nicht zu einer künstlichen Gesamtzahl addiert.
- Neuer 1.12.0-Update-/Speichertest mit fünf Prüfgruppen bestanden. Einzel-, Klassen- und Sammelexporte lassen die bestehende Notendatei bytegleich; Sicherung/Wiederherstellung und automatische Notenlisten erhalten historische Daten.
- Neue 1.13.0-Matrix: 23 Fälle in allen sechs Ausgabeformen, 128 tatsächlich gerenderte Seiten mit 59 Tabellenfortsetzungen. Ergebniswerte unabhängig gelesen; Hoch-/Querformat, Kopfzeilen, Seitenzahlen, einmalige Ergebniszeile, letzte Schülerzeile und Textgrenzen geprüft. Zusätzlich vollständige Schemaprüfung von 46 Office-Dateien und veraPDF-PDF/UA-1-Prüfung von 23 nativen PDFs.
- Bestehende 1.12.0-Matrix erneut bestanden: 758 tatsächlich gerenderte Seiten mit 644 Tabellenfortsetzungen, 905 unabhängig gelesene Berichte aus 26 ZIP-Archiven, 396 vollständige Office-Schema- und 217 PDF/UA-Prüfungen. Alle fünf tatsächlichen Chromium-ZIP-Downloads einschließlich Fortschritt/Abbruch ebenfalls bestanden.
- Bestehende Exportprüfungen: weitere 56 gültige Office-Dateien und 28 PDF/UA-Dateien bestanden; drei absichtlich beschädigte Office-Pakete korrekt abgewiesen. Zusammen 498 gültige Office-Pakete und 268 native PDFs maschinell validiert. Die beiden Render-Matrizen umfassen zusammen 886 Seiten und 703 Tabellenfortsetzungen.
- Chromium: alle vorhandenen Prüfgruppen bestanden, in den ausgeführten axe-Prüfungen keine Verletzungen. Neu: beide Ausgabe-Beschreibungen im Accessibility-Baum, echte Tastaturwahl, logische Tab-Reihenfolge, stabiler Fokus, zwölf Fenster-/Zoomfälle und simulierte native Vorschau/Fallback ohne Bedienungs-Timeout. Keine Aussage über tatsächliche NVDA-Sprachausgabe.
- Word-Schutz an den erzeugten Paketen bestätigt: keine globale Öffnungsaktualisierung, keine externen Beziehungen, ausschließlich die unveränderten lokalen PAGE-/NUMPAGES-Felder. LibreOffice rendert die Dokumente mit wiederholten Tabellenköpfen. Microsoft-Word-Öffnung, Feldabfragen und Reparaturmeldungen bleiben als Livetest offen.

Nach Abschluss wurden ausschließlich diese Prüfdokumentation und die maschinenlesbare Zusammenfassung ergänzt und die Quellcodeauslieferung erneut gepackt. Anwendung und Tests entsprechen dem erfolgreichen Gesamtlauf. GitHub Actions bleiben deaktiviert.
