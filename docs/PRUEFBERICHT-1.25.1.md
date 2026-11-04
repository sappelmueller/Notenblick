# Notenblick 1.25.1 – gezielte Updaterprüfung

Stand: 4. November 2026. Basis: offizielles 1.25.0, Commit `f6eb7a3d910855804932acde01079f273bc762f9`. Arbeit ausschließlich auf `entwicklung/1.25.1`. Testversion, keine Übernahme nach main, kein Tag/Release, Aktualisierungsdeskriptor `approved: false`. GitHub Actions bleiben deaktiviert.

## Änderungen

Die gespeicherte 24-Stunden-Sperre entfällt. Der native Client führt bei aktivierter Einstellung pro Prozess höchstens eine Startprüfung aus; alte oder zukünftige Zeitstempel unterdrücken keinen neuen Programmstart. Eine schon laufende manuelle/automatische Prüfung wird gemeinsam verwendet. Spätere manuelle Prüfungen bleiben möglich. Nach einem Fehler bleibt ein gespeichertes Angebot erhalten und beim nächsten Start wird erneut geprüft. Eine deaktivierte Einstellung stellt keine automatische Internetverbindung her.

Die Oberfläche aktualisiert den vorhandenen Startseitenbereich ohne Neuaufbau der übrigen Arbeitsansicht. Automatische Prüfungen sind still, vorhandene Eingaben und Fokus bleiben erhalten. Bereits gefundene Angebote werden eindeutig als noch nicht erneut geprüft bezeichnet; das Ausblenden je Version bleibt erhalten.

Beide Einstiegspunkte verwenden denselben zentralen Dialog mit dem gewünschten Titel, Text und den beiden Aktionen. Die gemeinsame Dialogkomponente erhält eine ausdrückliche Option zum Ausblenden des oberen Schließen-Schalters; alle anderen Dialoge behalten ihn. Überschriftenfokus, Escape, Abbrechen, F1, Rückkehr zum Auslöser und Fortschrittsanzeige bleiben erhalten. „Was ist neu?“ zeigt ausschließlich die gepflegten Neuerungen und startet keinen Austausch.

`UpdateClient.Prepare`, Herkunft/TLS, Freigabe, erneute Versionsprüfung, Download-/Dateiprüfungen, Installation und Wiederherstellung sind unverändert. Dasselbe gilt für Berechnungen, Speicherung, Exporte und Navigation. Die Liste eigener Datenversionen wird nur um 1.25.1 ergänzt; das Datenformat bleibt unverändert.

## Gezielte Nachweise

Der kontrollierte Lauf `reports/20261104T144836271356Z` bestand alle sechs ausgewählten Gruppen: Infrastruktur, allgemeine Oberfläche, F1/Hilfe, Bedienregressionen, nativer Updater mit DOM-Bridge und Updater im Chromium-Browser. Fünf Gruppen wurden ausgeführt, eine bereits erfolgreiche Gruppe unverändert übernommen. Ein voriger gültiger Build wurde ohne erneute Kompilierung wiederverwendet. Ein fest hinterlegter Hilfetexthash wurde nach Prüfung der beabsichtigten Textänderung aktualisiert; bestandene Gruppen wurden nach diesem Testfehler erhalten.

168 native Updaterprüfungen bestehen einschließlich Prozessstarts ohne Wartefrist, deaktivierter Einstellung, Cache, Offline-Neustart, manuellen Wiederholungen, parallelen Anfragen, TLS/Quellen/Freigabe/Integrität, Downloadabbruch, Staging-Manipulation, Installation, kontrollierten Unterbrechungen und Datenordnerschutz. Die DOM-Prüfung ergänzt Timer, sofortige Startseitenanzeige, stille automatische Ergebnisse, erhaltene Eingaben, gespeicherte/ausgeblendete Hinweise und beide Dialogeinstiege.

Chromium: zwölf zusätzliche Dialog-/axe-Fälle aus zwei Einstiegspunkten und sechs Fenster-/Zoomkombinationen bis 400 %. Echte Tastatureingaben prüfen Tab/Umschalt+Tab, Escape, Abbrechen, F1, Fokus-Rückkehr und Fortschrittsabbruch. Zwei repräsentative Screenshots wurden visuell kontrolliert. Keine horizontalen Überläufe des Dialogs; bei extrem schmalen Fenstern bleibt vertikales Scrollen möglich.

## Wiederverwendung und Grenzen

Die vollständigen 89 Pflichtgruppen, 180.000 Rechenergebnisse und Exporte von 1.25.0 bleiben als historische Basis erhalten. Unveränderte Rechen-, Speicher-, Export- und Installationsmodule werden über den Git-Vergleich abgeglichen. Ihre alten Belege werden nicht als frisch ausgeführte 1.25.1-Vollprüfung ausgegeben. Die konservative Gesamtauswahl aufgrund der Versions- und Dialogänderung wurde entsprechend dem ausdrücklichen Auftrag nicht gestartet. Keine erneuten 180.000 Berechnungen, Office-/PDF-Prüfreihen, vollständigen Browserreihen oder Doppelbuilds.

Der Herausgeber bestätigt für 1.25.0 Windows x86 und ARM einschließlich erfolgreicher echter Aktualisierung. Für die geänderte 1.25.1 stehen die realen Windows-/WebView2-/NVDA-/Braille-Prüfungen noch aus. Linux/.NET 8, jsdom und Chromium werden davon getrennt ausgewiesen. Kontrollierte Rückfallprüfungen sind keine tatsächlich ausgeführten Windows-Störfalltests.

Die portable Testausgabe enthält eine AnyCPU-EXE sowie vollständiges Programm mit x86-/x64-/ARM64-Bibliotheken und Lizenzen, keinen Datenordner. Version, vollständige Dateiliste, eingebettete Integrität, ZIP-CRC und bytegleiche Entpackung werden im Paketabschluss kontrolliert; dessen Ergebnisse stehen in den lokalen Berichten und im kompakten Nachweis dieser Testversion.

Kompakte Nachweise: [qa-1.25.1.json](qa-1.25.1.json). Die abschließende Wiederaufnahme bindet dieselben gültigen Anwendungsbelege an die fertige Dokumentation; nur die betroffene Infrastrukturprüfung wird erneut ausgeführt. Die ZIP-Prüfsumme bleibt unverändert.
