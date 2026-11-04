# 1.25.0 – Phase 1: Testverwaltung

Stand: 4. November 2026. Basis ist der unveränderte offizielle Quellstand 1.24.0 (`v1.24.0`, Commit `462139f18052eec1f900dac2b12f07ce6f9b36b9`). Arbeit ausschließlich auf `entwicklung/1.25.0`. Keine Programmfreigabe, kein Windows-Build und kein Release.

## Änderungen und Ursachen

Bisher waren Release-Erfolge grundsätzlich nicht wiederverwendbar. Zahlreiche Gruppen waren vom Cache ausgeschlossen; Erfolge wurden erst am Laufende eingetragen. Tagesdatum, globale Entwicklungs-/Dokumentdateien, alle Werkzeuge und gemeinsam überschreibbare Ausgaben erzeugten unnötige Ungültigkeit. Der Doppelbuild wurde nach Fehlern erneut nötig. Die große Rechenprüfung hatte keine dauerhaften Abschnittsbelege.

Jetzt: unmittelbare atomare Einzelbelege mit gesicherten Ausgaben/Logs, inhaltsbezogene Gruppen- und Werkzeugvoraussetzungen, Wiederaufnahme aller Profile einschließlich Release, bytegebundene Erzeuger-/Verbrauchernachweise und wiederverwendbare Doppelbuild-Evidenz. Alle bisherigen 87 Pflichtgruppen bleiben erhalten; zwei vorhandene Updater-Gruppen sind zusätzlich im Katalog (89 insgesamt). Keine Fälle/Assertions des großen Tests entfallen: 100 unabhängige Abschnitte prüfen weiterhin 3.000 vollständige Mittelwerte über 180.000 Ergebnisse. Der zustandsabhängige native Teil wird nicht mitten in einer Transaktion fortgesetzt.

## Tatsächlich ausgeführte Kontrollen

- `python3 tests/test_management.py`: 21 kleine Infrastrukturkontrollen, bestanden (4,505 s im abschließenden Lauf).
- Bestehende Klasse `Efficiency` aus `tests/infrastructure.py`: 25 Kontrollen, bestanden (1,359 s). Die übrigen Anwendungs-/Infrastrukturklassen wurden dabei nicht gestartet.
- Enthalten: echte kurze Kindprozesse, sofortige Speicherung ohne Abschlussroutine, Wiederaufnahme nach abruptem Prozessende, Timeout, Fehler/Korrektur, unveränderte Erfolge, beschädigte/manipulierte Belege und Ausgaben, Pfadschutz, Abhängigkeiten, CSS-/Dokument-/Berechnungsänderungen, Komponenten-/Build-Wiederverwendung und Reproduzierbarkeitsnachweis.
- Die Release-Steuerung und ihr Freigabegatter wurden mit drei synthetischen Kurzprüfungen und simulierten Builds/Archiven kontrolliert. Das ist ausdrücklich kein vollständiger Release-Lauf.
- Der echte JavaScript-Checkpoint-Helfer wurde mit vier kleinen Abschnitten einschließlich Unterbrechung, Korruption und unvollständiger Fallzahl geprüft. Kein Lasttest/Notenberechnungslauf wurde dafür gestartet.
- Syntaxprüfung der geänderten Python-/JavaScript-Dateien, `git diff --check`, Repositoryschutz und Plan-Kontrolle bestanden. Der Python-Werkzeugfingerabdruck war bei zwei direkten Abfragen stabil (0,347 / 0,066 s); keine Neuinstallation von Werkzeugen.
- Abgleich mit der Basis: `src`, `native`, `package.json` und `package-lock.json` vollständig unverändert. Keine Nutzerdaten gelesen, geändert oder übertragen. Actions weiterhin deaktiviert.

## Gemessene Einsparung und Grenzen

Repräsentatives kleines Szenario: drei synthetische 40-ms-Prüfungen, die dritte schlägt fehl und wird korrigiert. Der Vergleich bildet die bisherige Release-Frischlauf-Strategie gegen die neue Wiederverwendung ab. Beim Wiederholen wurden drei gegenüber einer Prüfung ausgeführt; zwei wurden vermieden. Gemessen: 0,4115 gegenüber 0,1601 s, also 0,2514 s weniger. Diese Messung ist kein Gesamtbenchmark und kein Nachweis einer bestimmten Tokenersparnis.

Bei zwei bereits bestätigten zehnminütigen Gruppen entfallen rechnerisch rund 20 Minuten Wiederholung, abzüglich der verbleibenden Inhaltskontrollen. Tatsächliche Minutenwerte für Notenblick müssen im separat beauftragten Audit gemessen werden.

Kein vollständiger Programm-/Release-Lauf, keine 180.000-Ergebnis-Ausführung, keine Office-/PDF-/Exportprüfung, keine umfangreiche Browserreihe und kein echter Windows-Build wurden in dieser Phase durchgeführt. Der reale Zusammenschluss mit allen installierten Werkzeugen sowie Windows/ARM64, NVDA/Braille und die automatische Installation/Wiederherstellung bleiben offen. Erst neue Schema-2-Belege sind wiederverwendbar; die erste echte Ausführung muss sie erzeugen. Lokale Belege benötigen eine erhaltene Arbeitskopie. Zustandsabhängige lange Teilabläufe starten nach Abbruch erneut; unbekannte fachliche Abhängigkeiten bleiben konservativ.

Verfahren und Wiederaufnahme: [Effizient entwickeln](ENTWICKLUNGSOPTIMIERUNG.md). Freigaberegeln: [Veröffentlichung](VEROEFFENTLICHUNG.md).
