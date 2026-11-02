# Notenblick 1.14.0 – Halbjahres- und Zeugnisnoten

Stand: 27. Oktober 2026. Ausgangspunkt ist der aktuelle private GitHub-Stand 1.13.0, Commit `c17324ab312bcd49eff2b6aef06745f941cb70ef`, Baum `db7a1e1d0e8fb64213d48c05e75cb804417233ab`. Das frisch heruntergeladene Archiv mit 202 Dateien ergibt exakt denselben Git-Baum einschließlich der binären Bibliotheken und Dateimodi. Eine vorherige temporäre Arbeitskopie war nicht mehr verfügbar; die Erweiterung wurde wiederhergestellt und alle nachfolgend ausgewiesenen Prüfungen neu ausgeführt. Ausschließlich synthetische Daten, ausschließlich lokale Tests und Builds. GitHub Actions bleiben deaktiviert.

## Änderungen

Die Klassenverwaltung speichert die Ausgabe zum Halbjahr für alle Fächer einer Klasse und eines Schuljahres. Fehlende Einstellungen werden einmalig abgefragt. Halbjahresinformationen erlauben Viertelnoten mit verständlichen Tendenzen, Halbjahreszeugnisse und Jahreszeugnisse ganze Noten. Das Menü „Abschlussnoten“, zwei Ergebnisfelder der Übersicht und drei Schülerkarten öffnen dieselbe erweiterte Dialogimplementierung. Klassenlisten behalten Sortierung und Entwürfe beim Filtern. Sammelübernahme schützt gespeicherte und bewusst bearbeitete Noten.

Vorschläge nutzen unverändert die zentrale rationale Berechnung, einschließlich aller Gewichtungsmodelle und Altbestandsschutz. Gerundet wird direkt aus dem exakten Ergebnis auf das nächste zulässige Intervall, exakte Mitte zur numerisch höheren Note. Die Lehrkraft kann jede zulässige Note unabhängig vom Vorschlag festlegen. Fehlende bewertete Leistungen erzeugen keinen Durchschnitt. Die Jahresnote einer Abschlussklasse wird ausschließlich manuell festgelegt; der Jahresdurchschnitt ist Orientierung ohne Prüfungsnotenberechnung.

Gespeicherte Ergebnisse enthalten Zeugnisart, Zuordnung, damaligen exakten Durchschnitt, Bezugsdaten, Festlegungsdatum und optionale Bemerkung. Änderungen an Leistungen/Gewichten verändern sie nicht. Bestandswerte, historische Abschnitte, Wechsel und Archive bleiben erhalten. Fehler vor JSON-Annahme verändern keine aktiven Daten; bei einem späteren TXT-Fehler wird die bereits erfolgreiche Notenspeicherung ausdrücklich benannt. Wiederholen ist möglich. JSON-Sicherungen, TXT-Listen und alle vorhandenen Berichtsausgaben verwenden die vorhandene Architektur.

## Zeitabgrenzung und fachliche Grenzen

Die amtlichen Fassungen von NVO § 3 und § 4 wurden am 27. Oktober 2026 direkt im Landesrechtsportal gelesen (Fassung 04.02.2025, gültig ab 05.02.2025): [Zeugnisse](https://www.landesrecht-bw.de/perma?j=NotBildV_BW_!_3), [Halbjahresinformation](https://www.landesrecht-bw.de/perma?j=NotBildV_BW_!_4). Die erste Jahreshälfte endet am 31. Januar, das Schuljahr am 31. Juli. Halbjahresinformationen erlauben ganze Noten, Tendenzen und halbe Noten. Die interne Viertelnotendarstellung bildet diese Auswahl entsprechend dem Auftrag ab; sie ist keine gesetzliche automatische Notenbildung.

Implementiert sind reguläre Schuljahre vom 1. August bis 31. Juli. Abweichende Kalender beruflicher Bildungsgänge und besondere offizielle Prüfungs-/Abschlussberechnungen sind nicht implementiert und werden nicht als berechnet ausgewiesen. Alte Leistungen außerhalb des zugeordneten Schuljahres bleiben sichtbar und erhalten; sie werden nicht stillschweigend umklassifiziert oder in begrenzte Abschlussvorschläge aufgenommen. Bei unbekanntem Jahresbeginn verlangt die Abschlussnotenverwaltung eine ausdrückliche Zuordnung.

## Prüfungen und behobene Prüffehler

Die neuen Regressionen decken alle 20 Anforderungsszenarien ab: drei Zeugnisarten und exakte Rundung, Gewichte/Leistungsarten/fehlende Leistungen, pädagogische Abweichung, gemeinsame Übernahme und Schutz, Datumsgrenzen/neue Märzleistungen, nachträgliche Änderungen und unveränderliche Abschlüsse, Speichern/Neustart/Wiederherstellen, Altversionen/Artwechsel/Versetzen/Übernahme/Archive, sämtliche Exportformen sowie Tastatur/Dialog/Fokus/Tabellen. Die zusätzlichen Programme sind in die vorhandenen Gruppen integriert: `v1140.cjs`, `v1140-storage.cjs`, `v1140-browser.cjs`, `v1140-files.py`.

Vorbereitende Prüfläufe deckten erwartete Änderungen alter Testorakel auf: zusätzliche Ergebnisspalte/-karte, verschobene Jahresnoten-Zeile und neue datumsabhängige Periodenzuordnung. Die Orakel wurden ausdrücklich auf das beauftragte Verhalten angepasst; die mathematischen Referenzen bleiben unabhängig. Die unveränderten Rechen-/Migrations-/Gewichts-/Wechselmodule und der native Speicherkern bleiben per Prüfsumme geschützt. An der allgemeinen Layoutgestaltung wurden nur notwendige Dialoganpassungen und die dritte Schülerkarte ergänzt.

Die neuen Skalierungstests verwenden die effektive CSS-Fenstergröße (physische Fenstergröße geteilt durch Skalierung); ein Zoom nur am HTML-Wurzelelement bildet die Größe nativer Dialoge nicht zuverlässig ab. Bekannte synthetische LibreOffice-PDF-Ausgaben werden vor jeder erneuten Konvertierung gezielt entfernt, damit niemals eine alte Renderdatei als neues Ergebnis gilt. Es werden keine Testfehler übersprungen.

Der abschließende vollständige `python3 dev/manage.py release` wurde erfolgreich abgeschlossen: alle 51 Prozessschritte mit Rückgabewert 0. Frühere Teilläufe zählen nicht als Freigabenachweis. Der maschinenlesbare Nachweis steht in `docs/qa-1.14.0.json`.

## Nicht ausgeführt

Tatsächlicher Windows-Programmstart, WebView2/UI Automation, reale Windows-Skalierung, NVDA-Sprache/Braille, echte Microsoft-Office-Programme und physischer Druck wurden hier nicht ausgeführt. Linux/.NET-/Chromium-/axe-, LibreOffice-, Open-XML- und PDF/UA-Prüfungen ersetzen diese Abnahme nicht. Die Ausgabe bleibt bis dahin ein lokal geprüfter Windows-Build-Kandidat. Kein Codesignierungszertifikat; vorhandene Windows-Sicherheitsmechanismen werden nicht umgangen. Der konkrete offene Prüfplan steht in `docs/WINDOWS-PRUEFUNG.md`.

## Update

Notenblick schließen, vorherige Daten sichern, `Notenblick.exe` und den vollständigen Ordner `Programm` ersetzen. Den vorhandenen Ordner `Daten` behalten. Die portable Struktur und alle Sicherungsmechanismen bleiben erhalten. Das Programmarchiv enthält keine Schülerdaten, Quelltexte oder Tests; Quellcode und Tests gehören ausschließlich ins private Repository.


## Abschließender Gesamtlauf – tatsächlich bestanden

| Bereich | Ergebnis |
| --- | --- |
| Infrastruktur | 14 Schutz-, Versions-, Werkzeug- und Quellregressionen |
| Zentrale Berechnung/Speichervalidierung | 16.160 Prüfgruppen; zusätzlich 992 direkte Gewichtsreferenzen und 441 exakte Modellumrechnungen |
| Neue Abschlussnoten | 15 Funktionsgruppen, 6 Gruppen am produktiven C#-Speicherkern, 8 Chromium-Gruppen, 3 unabhängige Dateiprüfgruppen |
| Bestehende Oberfläche/Versionen/Transfers | alle im Ablauf aufgeführten Regressionen bestanden |
| Nativer Speicher und Binärexporte | vorhandene Speicher-/Wiederherstellungsgruppen und 33 Binärexport-Prüfungen bestanden |
| Großer Bestand | 10 Schuljahre, 3.000 Schüler, 6.000 Leistungen, 180.000 Ergebnisse, etwa 37 MB: Rechnen, TXT, Speichern, Start, Sicherung/Wiederherstellung bestanden |
| Browser und Accessibility | 91 + 30 + 38 + 30 + 5 + 10 + 4 + 3 + 8 Gruppen, keine axe-Verstöße in den geprüften Zuständen; neue 60-/300-Schüler-Fälle, echte Tastatur und Accessibility-Baum |
| Grundexporte | 30 unabhängige Dateiprüfgruppen; 56 Office-Pakete gültig, 3 absichtlich ungültige Pakete korrekt abgewiesen; 28 native PDFs PDF/UA-1-konform nach maschineller Prüfung |
| Bestehende Sammelexporte | 905 enthaltene Dokumente unabhängig gelesen; 396 Office-Pakete und 217 PDFs validiert; 758 gerenderte Seiten mit 644 Tabellenfortsetzungen geprüft |
| Klassendurchschnitte | 23 Fälle, 128 gerenderte Seiten, 59 Tabellenfortsetzungen; 46 Office-Pakete und 23 PDFs validiert |
| Neue Abschlussnotenexporte | 8 Optionsfälle in Word/PDF/Excel/TXT/CSV/Druck; 32 gerenderte Seiten, 16 Office-Pakete, 8 native PDF/UA-Dateien; Werte, Notentendenzen, Bemerkungen und Seitenbegrenzungen korrekt |
| Assembly-Lader | 17 Prüfungen vor und nach Wiederholungsbuild |
| Wiederholungsbuild | sämtliche Programmdateien bytegleich |
| Programmarchiv | vollständiger Dateibestand und SHA-256 geprüft, sauber entpackt, Testhost-Start/Einrichtung/Navigation/Einzelnote erfolgreich; keine Nutzerdaten enthalten |

Die unterschiedlichen Prüfgranularitäten werden nicht zu einer künstlichen Gesamtsumme addiert. Word-/PDF-/Druckrender wurden mit LibreOffice, PDFKit und Chromium tatsächlich erzeugt und unabhängig gelesen. Die neue Klassenoberfläche und ein Word-Klassenbericht wurden zusätzlich visuell angesehen. Das sind keine Windows-/NVDA- oder echten Microsoft-Office-Livetests.

### Alle 51 ausgeführten Prozessschritte

| Nr. | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Web-Programm erstellen | bestanden (0) |
| 2 | Windows-Programm kompilieren | bestanden (0) |
| 3 | Entwicklungsregressionen | bestanden (0) |
| 4 | domain-storage | bestanden (0) |
| 5 | transfers | bestanden (0) |
| 6 | ui | bestanden (0) |
| 7 | new-features | bestanden (0) |
| 8 | v140 | bestanden (0) |
| 9 | v150 | bestanden (0) |
| 10 | v160 | bestanden (0) |
| 11 | v170 | bestanden (0) |
| 12 | v180 | bestanden (0) |
| 13 | v190 | bestanden (0) |
| 14 | v1100 | bestanden (0) |
| 15 | v1110 | bestanden (0) |
| 16 | v1120 | bestanden (0) |
| 17 | v1130 | bestanden (0) |
| 18 | v1140 | bestanden (0) |
| 19 | Nativen Testhost erstellen | bestanden (0) |
| 20 | view-storage | bestanden (0) |
| 21 | v150-storage | bestanden (0) |
| 22 | v160-storage | bestanden (0) |
| 23 | v170-storage | bestanden (0) |
| 24 | v180-storage | bestanden (0) |
| 25 | v190-storage | bestanden (0) |
| 26 | v1110-storage | bestanden (0) |
| 27 | v1120-storage | bestanden (0) |
| 28 | v1130-storage | bestanden (0) |
| 29 | v1140-storage | bestanden (0) |
| 30 | workflow | bestanden (0) |
| 31 | Großer Datenbestand | bestanden (0) |
| 32 | Produktiven Assembly-Lader prüfen | bestanden (0) |
| 33 | browser | bestanden (0) |
| 34 | v170-browser | bestanden (0) |
| 35 | v180-browser | bestanden (0) |
| 36 | v190-browser | bestanden (0) |
| 37 | v1100-browser | bestanden (0) |
| 38 | v1110-browser | bestanden (0) |
| 39 | v1120-browser | bestanden (0) |
| 40 | v1130-browser | bestanden (0) |
| 41 | v1140-browser | bestanden (0) |
| 42 | Exportdateien und PDF/UA prüfen | bestanden (0) |
| 43 | Vollständige Office-Schemata prüfen | bestanden (0) |
| 44 | Sammelexporte und gerenderte Fortsetzungsseiten prüfen | bestanden (0) |
| 45 | Klassendurchschnitte und Druckseiten unabhängig lesen | bestanden (0) |
| 46 | Abschlussnotenexporte unabhängig lesen | bestanden (0) |
| 47 | Web-Programm erstellen | bestanden (0) |
| 48 | Windows-Programm kompilieren | bestanden (0) |
| 49 | Assembly-Lader nach Wiederholungsbuild | bestanden (0) |
| 50 | ZIP-Archive vollständig erstellen | bestanden (0) |
| 51 | Entpackte Auslieferung starten | bestanden (0) |

Programm-ZIP: `Notenblick_1.14.0.zip`. 1.926.541 Bytes; SHA-256 `437ea128a5a01de7b4e370da570bc3501600327a94ea9a414b6c502b37d9d1a8`.
