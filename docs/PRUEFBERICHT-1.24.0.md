# Notenblick 1.24.0 – Veröffentlichung am 3. November 2026

Sebastian Müller hat diese konkrete Version, das stabile GitHub Release und
den Aktualisierungsdeskriptor `approved: true` ausdrücklich freigegeben.
**Die Veröffentlichung erfolgt auf seinen ausdrücklichen Wunsch mit reduziertem
Prüfumfang, abweichend vom sonst vorgeschriebenen vollständigen Release-Lauf.**
Es wird kein aktueller vollständiger Release-Testnachweis behauptet.

## Letzter Änderungsumfang

Ausgangsstand `8069a5ac2fb0a7d1a02670803183b8037aa07f8c` enthält die vollständige
Entwicklung 1.23.3 und 1.24.0. Die letzten Programmänderungen betreffen nur
„Deine Version“ und die Anordnung der beiden Update-Kontrollfelder. Sie verwenden
wie die Teilnehmerauswahl eine feste linke Kontrollfeldspalte und umbrechenden
Text rechts. TLS-/GitHub-Abfrage, Versionsvergleich, Diagnose/Kopieren,
Installation, Wiederherstellung und Datensicherheit bleiben unverändert.

## Neu durchgeführte Kontrollen

- Gezielt `tests/update-browser.cjs --final-layout`: neue Versionsbeschriftung,
  beide Beschriftungen rechts neben dem Kontrollfeld, Textumbruch und Tastatur-
  bedienung/Fokus bei 1280 px, 640 px/200 % und 320 px/200 %. Chromium unter Linux;
  kontrollierte Windows-Brücke, keine echte Windows- oder NVDA-Ausführung.
- Ein regulärer Windows-Build gegen die gesperrten .NET-Framework-4.8-Referenzen.
  Keine geänderten nativen Komponenten; der Starter erhält nur die neuen
  Integritätsvorgaben. AnyCPU, x86-/x64-/ARM64-Loader und TLS-Zieldeklaration
  bleiben erhalten.
- Grundlegende Verpackungskontrolle: vollständige Bibliotheks-/Dateihashes,
  eingebettete Starter-Allowlist, Archiv-CRC, vollständiger Entpackvergleich,
  Programmversion 1.24.0 und Lizenzen. Windows-ZIP ausschließlich
  `Notenblick.exe`/`Programm`, kein `Daten`.
- Zugehörigkeit von Windows-ZIP, Quellcode-ZIP, Prüfsummen und Deskriptor:
  feste Herkunft/Repository-ID, Version, Freigabe, Datenkompatibilität,
  Dateivollständigkeit und Einzelhashes werden vor Veröffentlichung abgeglichen.
  Tag und veröffentlichte Downloads werden abschließend erneut abgeglichen.

Keine 180.000 Berechnungen, allgemeinen Regressionen, Office-/PDF-/Exporttests,
vollständigen Browserreihen oder wiederholten vollständigen Builds gestartet.
Frühere Prüfungen werden nicht als neu ausgeführt ausgegeben.

## Frühere Nachweise und Praxisstand

Die datierten [Updater-Oberflächenprüfungen](UPDATER-OBERFLAECHE-1.24.0.md),
[Diagnoseprüfungen](UPDATER-DIAGNOSE-1.24.0.md) und
[TLS-Korrektur](UPDATER-TLS-KORREKTUR-1.24.0.md) gelten als historische Nachweise
für den seither unveränderten Code. Sebastian Müller hat die erfolgreiche
Aktualisierungsprüfung unter Windows nach der TLS-Korrektur bestätigt.
Der [ursprüngliche Entwicklungsbericht](archiv/PRUEFBERICHT-1.24.0-ENTWICKLUNG.md)
bleibt zur Rückverfolgbarkeit erhalten; damalige Freigabepläne sind historisch.

**Offen:** der vollständige automatische Windows-Download-/Installations- und
Wiederherstellungsablauf einschließlich echter Dateisperren, Unterbrechung und
Rückfall. Ebenso umfassende erneute Windows-/NVDA-/Braille-/native ARM64-,
Monitor-/DPI-, Office- und Druck-Einzelprüfungen. Diese werden nicht als bestanden
ausgewiesen. Der umfassende technische/visuelle Audit und praktische Updatetest
folgen separat mit Version 1.25.0.

## Veröffentlichung

Geschützte Übernahme per Pull Request nach `main`, eindeutiger Tag `v1.24.0`,
stabiles Release **Notenblick 1.24.0** mit allen vier zugehörigen Dateien.
Erst nach erfolgreicher Veröffentlichung und Downloadkontrolle werden die
vollständig enthaltenen Entwicklungsbranches gelöscht. Lizenz, Actions-Status,
Branchschutz und historische PR-Referenzen werden nicht verändert.
