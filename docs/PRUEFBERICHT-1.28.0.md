# Notenblick 1.28.0 – Prüfumfang und Abnahme

Entwicklungsstand auf `entwicklung/1.28.0`, ausgehend vom offiziellen 1.27.0. Für alle folgenden Prüfungen werden erfundene Schülerdaten verwendet.

## Automatischer Prüfumfang

| Bereich | Zu prüfendes Verhalten |
| --- | --- |
| Leistungserfassung | Direkte Eingabe aus Übersicht, Notentabelle und Leistungsliste. Ganze Klasse als Vorgabe. Teilnahme und Einzelansicht getrennt prüfen. Noten, Punkte, manuelle Anpassungen, Status, Bemerkungen, GFS und Gewichte erhalten. |
| Entwürfe | Leeres Öffnen und bewusstes Anlegen ohne Noten unterscheiden. Ungültige Eingaben korrigieren und nach Neustart fortsetzen. Gültige Leistung nur einmal übernehmen. Letzten gültigen Stand bei Schreib- oder Eingabefehlern erhalten. Entwürfe aus Berechnung und Berichten ausschließen. |
| Verschlüsselung | Passwort- und Notfallschlüssel unabhängig testen. Unveränderte Daten nach Rückkehr aus dem geschützten Modus vergleichen. Manipulation, Kürzung, falschen Schlüssel sowie fehlerhafte und übergroße Eingaben abweisen. Alle personenbezogenen Ausgaben und Zwischenstände auf Klartextspuren prüfen. |
| Wechsel des Schutzes | Einrichtung, Änderung von Passwort und Notfallschlüssel, Austausch des Datenschlüssels, Abschalten und Wiederherstellung prüfen. Nach Fehlern und Unterbrechungen den letzten vollständigen Stand wieder öffnen. Historische Sicherungen und fremde Dateien erhalten. |
| Notfallzugriff | Sicherung geschützt kopieren, mit Passwort und Schlüssel öffnen, passende TXT-Listen lesen und vollständige Datenkopie erstellen. Kollidierende Pfade, Verknüpfungen, Schreibfehler, unvollständige Dateien und gleichzeitige Nutzung prüfen. Quelle nach jeder Aktion abgleichen. |
| Aktualisierung | Echte Paketdateien mit dem Produktionscode von 1.27.0 prüfen. Eingebettete und beigelegte Notfall-EXE abgleichen. Abbruch, blockierte Dateien und fehlende Schreibrechte prüfen. Bei Programmwechsel alle Daten erhalten. |
| Bestehender Testkatalog | Gezielte Prüfungen und vollständigen Abschluss über `dev/manage.py` ausführen. Gültige Belege wiederverwenden und bei einem Fehler den gleichen Prüflauf fortsetzen. |

## Erster Testbuild vom 25. November 2026

- **100 von 100 Prüfgruppen bestanden.** Erfolgreiche Gruppen wurden beim Fortsetzen wiederverwendet. Der große Referenzbestand umfasste 180.000 Noteneinträge. Exporte wurden in tatsächlichen Office-, PDF-, CSV- und TXT-Dateien geprüft. Für PDF/UA kam veraPDF 1.30.4 zum Einsatz.
- **Verschlüsselung und Notfallzugriff.** Zwölf native Schutzszenarien bestanden, darunter unabhängige Referenzwerte für Argon2id und AES-256-GCM, sieben erzwungene Prozessabbrüche, falsche Zugangsdaten, veränderte Dateien, Schlüsselwechsel und Sicherungen mit früheren Zugangsdaten. 44 zusätzliche Dateiprüfungen bestätigten den Zugriff auf Sicherungen und unveränderte Originale. Der Lesetest lief auch direkt aus der kompilierten Notfall-EXE mit ihren eingebetteten Bibliotheken unter .NET 8 auf Linux, ohne Notenblick, Programmordner oder WebView2.
- **Bedienung und Darstellung.** Die neue Leistungserfassung wurde in beiden Notenlayouts geprüft. Dazu gehören Entwürfe, Teilnehmerwahl, Punkte, Tastatur, Fokus und F1. Chromium-Prüfungen umfassten acht Passwortschutz-Ansichten, kleine Fenster, Vergrößerung bis 400 Prozent und simulierten Hochkontrast. Die F1- und Oberflächen-Audits bestanden mit 149 beziehungsweise 98 axe-Prüfungen.
- **Auslieferung.** Zwei saubere Builds waren bytegleich. Archivbestand, Prüfsummen und entpackte Anwendung wurden geprüft. Der unveränderte 1.27.0-Updatercode las das echte Updatearchiv. Das Bereitstellen der eingebetteten Notfall-EXE ließ den synthetischen Ordner `Daten` unverändert. Das Paket enthält die Loader für x64 und ARM64. Der Aktualisierungsdeskriptor der Testversion steht auf `approved: false`.

Vollständiges Windows-ZIP `Notenblick_1.28.0_Windows.zip` mit 10.412.141 Bytes und SHA-256 `7bad4393b9b0bb0f914061307bd7e844f2b38c900100fb9012bd0392ec1cd51f`.

## Überarbeiteter Testbuild

- Passwortschutz mit regulär erstellten, älteren und kopierten Sicherungen prüfen. Vorhandene geschützte Stände mit ihren bisherigen Zugangsdaten öffnen. Einrichtung, Unterbrechung, Ausschalten und erneutes Einschalten mit demselben Übungsbestand durchspielen.
- Neue Passwörter mit sieben und acht Zeichen sowie fehlenden Zeichenarten prüfen. Einen älteren Zugang beim Öffnen, beim Wechsel des Notfallschlüssels und beim Ausschalten prüfen.
- Ersteinrichtung, Passwortassistent und neue Leistung bei unterschiedlichen Fenstergrößen visuell und per Tastatur prüfen. Bei der Leistungseingabe beginnt die Tabfolge unter der Überschrift mit „Fertig“ und „Schließen“. Bei Datumsfehlern führt der Fokus zum passenden Feld.
- Notfallzugriff bei geschlossenem und geöffnetem Notenblick prüfen. Einen früheren Stand auswählen, die Vorschau lesen, Kopien erstellen und die unveränderte Quelle kontrollieren. Den eigenständigen Start auf Windows prüfen.

## Testbuild 3

Der Sperrschalter steht bei aktivem Schutz auf der Startseite. Die Passwortfenster unterscheiden Öffnen und Entsperren. Der Notfallzugriff gliedert Öffnen, Lesen und Speichern. Beim Ausschalten prüft Notenblick den wieder lesbaren Datenstand und bewahrt frühere Sicherungen mit ihrem Schutz im Ordner `Sicherungen` auf. Anschließend entfernt es seine verschlüsselten Arbeitsordner und Schutzdateien. Unterbrochene Umstellungen lassen sich fortsetzen.

- **Bestanden.** 16 gezielte Speicherszenarien und 54 Datei-, Sicherungs- und Schutzprüfungen des Notfallzugriffs. Geprüft wurden auch zwei Schutzwechsel, Abbrüche an den Übergängen, eine kollidierende Datei und ein archivierter Stand aus einem früheren Testbuild mit seinem ursprünglichen Notfallschlüssel.
- **Bestanden.** Vollständigkeit und Entpacken der portablen ZIP sowie Windows-x64-Proben `--verify-update` und `--verify-readers` aus der entpackten Ausgabe. Das Paket enthält die Loader für x64 und ARM64.
- **Offen.** Der reguläre Integrationslauf stoppte in der Vorprüfung an fehlendem Playwright. Das festgelegte SDK 8.0.426 konnte nicht geladen werden. Die Testausgabe wurde mit dem lokal verfügbaren Roslyn und den festgelegten, geprüften Bibliotheken gebaut. Laufende Oberflächenprüfung, Skalierung, UIA, NVDA, Braille, natives ARM64 und der Vergleich mit dem alten Speicherhost aus 1.27 bleiben für diesen Build offen.

Die vollständige Testausgabe `Notenblick_1.28.0_Windows_Testbuild_3.zip` hat 10.437.738 Bytes und SHA-256 `120d474243072b551c5954bd3ffaa6be667a5a5f0c76523b9dc298d6ffd8ed3d`. Der Aktualisierungsdeskriptor bleibt bei `approved: false`.

## Praktische Abnahme auf Windows

Teste auf **Windows x64 und ARM64** mit NVDA und Braille. Entpacke das vollständige Paket in einen neuen Ordner. Verwende in sämtlichen Schritten einen Übungsbestand mit erfundenen Namen.

1. **Leistung erfassen.** Lege je eine Klassenarbeit und einen Test an. Trage Noten in der Tabelle und Punkte in der Einzelansicht ein. Wechsle zwischen beiden Ansichten und prüfe Teilnehmer, Status, Bemerkungen und die Ansage der berechneten Note. Öffne F1 mitten in einer Eingabe und kehre mit Escape zurück.
2. **Entwurf fortsetzen.** Gib zuerst Noten ein und lasse die Bezeichnung offen. Verlasse das Fach, starte neu und setze den Entwurf fort. Ergänze die Bezeichnung und kontrolliere nach „Fertig“, dass es genau eine Leistung gibt. Lege zusätzlich bewusst einen Test ohne Einträge an.
3. **Schutz einrichten.** Prüfe den zunächst ausgeschalteten Passwortschutz. Richte ihn ein, speichere den Notfallschlüssel getrennt und lies die Schlüsseldatei zur Kontrolle wieder ein. Sperre Windows während der Arbeit und öffne Notenblick anschließend erneut. Prüfe den Fokus, die angefangene Eingabe, die Fehlermeldungen und dass NVDA Geheimnisse nur auf ausdrückliches Anzeigen preisgibt.
4. **Notfall üben.** Kopiere den Übungsbestand in einen eigenen Ordner und stelle dort nur `Notenblick-Notfallzugriff.exe` bereit. Öffne den Stand einmal mit Passwort und einmal mit Notfallschlüssel. Lies und markiere eine Notenliste. Erstelle eine geschützte Kopie, einen TXT-Export und eine entschlüsselte Datenkopie. Öffne die Kopie in einem separaten Übungsordner. Der Quellbestand muss gleich bleiben. Prüfe den Start nach Möglichkeit auch auf einem Windows-System ohne WebView2.
5. **Sicherung und Zugänge prüfen.** Erstelle eine Sicherung, ändere Passwort und Notfallschlüssel und öffne jeweils den passenden alten und neuen Stand. Prüfe den Hinweis bei einer falschen Eingabe und bei einer beschädigten Kopie. Deaktiviere den Schutz an einer Übungskopie und öffne sie erneut. Frühere geschützte Sicherungen bleiben lesbar, solange ihre Zugangsdaten vorhanden sind.
6. **Aktualisierung und Darstellung prüfen.** Aktualisiere 1.27.0 in einer kontrollierten Testumgebung direkt auf 1.28.0. Vergleiche den Datenordner vor und nach der Aktualisierung und starte den bereitgestellten Notfallzugriff. Bediene beide Programme per Tastatur bei 100, 150 und 200 Prozent Skalierung. Prüfe Fokus, erreichbare Aktionen, Lesereihenfolge, verständliche Meldungen und die Brailleausgabe.

Halte Windows-Version, Architektur, NVDA-Version und die beobachteten Ergebnisse fest. Linux-, Browser- und simulierte Prüfungen sind getrennt vom Windows-Praxisnachweis zu dokumentieren. Die öffentliche Freigabe folgt erst nach der praktischen Abnahme.
