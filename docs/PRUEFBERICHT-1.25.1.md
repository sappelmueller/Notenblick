# Notenblick 1.25.1 – gezielte Updaterprüfung

Stand: 4. November 2026. Basis: offizielles 1.25.0, Commit `f6eb7a3d910855804932acde01079f273bc762f9`. Arbeit ausschließlich auf `entwicklung/1.25.1`. Nach erfolgreichem Windows-Praxistest am 4. November 2026 durch Sebastian Müller ausdrücklich zur unveränderten offiziellen Veröffentlichung freigegeben. Geprüfter Programmstand: `892dd24a5365b6f5153bff2e31ac7777a59b1e8f`. GitHub Actions bleiben deaktiviert.

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

Der Herausgeber bestätigt für 1.25.0 Windows x86 und ARM einschließlich erfolgreicher echter Aktualisierung. Für 1.25.1 hat er inzwischen ebenfalls die erfolgreiche praktische Verwendung unter Windows bestätigt und die Veröffentlichung freigegeben. Nicht einzeln protokollierte Hilfetechnik-/UIA-Messungen werden nicht aus dieser allgemeinen Bestätigung abgeleitet. Linux/.NET 8, jsdom und Chromium werden davon getrennt ausgewiesen. Kontrollierte Rückfallprüfungen sind keine tatsächlich ausgeführten Windows-Störfalltests.

Die unverändert übernommene portable Ausgabe enthält eine AnyCPU-EXE sowie vollständiges Programm mit x86-/x64-/ARM64-Bibliotheken und Lizenzen, keinen Datenordner. Version, vollständige Dateiliste, eingebettete Integrität, ZIP-CRC und bytegleiche Entpackung werden im Paketabschluss kontrolliert; dessen Ergebnisse stehen in den lokalen Berichten und im kompakten Nachweis dieser Version.

Kompakte Nachweise: [qa-1.25.1.json](qa-1.25.1.json). Die abschließende Wiederaufnahme bindet dieselben gültigen Anwendungsbelege an die fertige Dokumentation; nur die betroffene Infrastrukturprüfung wird erneut ausgeführt. Die ZIP-Prüfsumme bleibt unverändert.

## Offizielle Veröffentlichung ohne neue Programmprüfung

Das vorhandene Windows-ZIP wird bytegleich übernommen: 2.099.485 Bytes, SHA-256 `6d0f2efd7946e2aa1a446369e102399b8d98590733ac388c866280afa95cee41`. Dateiliste, CRC, alle Dateihashes, die eingebetteten Integritätswerte, Laufzeitquellen, Hilfe, Bibliotheken und Lizenzen stimmen mit dem freigegebenen Stand überein. Die 18 im kompakten Nachweis erfassten unveränderten Fach-/Speicher-/Export-/Installationsmodule wurden anhand ihrer Hashes bestätigt.

Die im Entwicklungscommit gesicherten Testberichte und Prüfsummen werden als ursprüngliche Nachweise übernommen. Es werden keine neuen Erfolgsergebnisse für alte Tests oder einen vollständigen 1.25.1-Release-Lauf erzeugt. Zur Veröffentlichung ändern sich ausschließlich Dokumentation, Quellcodearchiv und externe Freigabe-/Prüfsummenmetadaten; keine Anwendungstests, Browserreihen, Berechnungs-/Exportprüfreihen oder Programmbuilds.

Die Herkunfts-, Versions-, Freigabe- und Extraktionslogik von 1.24.0 ist in 1.25.0 und 1.25.1 identisch. Eine isolierte Veröffentlichungskontrolle mit dieser unveränderten Produktionslogik bestätigt Deskriptor, Datenschema, Mindest-Updater, ZIP/Einzelhashes, EXE-Version, AnyCPU und x86-/x64-/ARM64-Loader für beide Ausgangsversionen. Nach Veröffentlichung werden zusätzlich die echte GitHub-Suche für 1.24.0/1.25.0 und alle vier heruntergeladenen Dateien abgeglichen. Dabei wird keine Windows-Installation gestartet; eine neue Windows-Störfall-/Rückfallprüfung wird nicht behauptet.
