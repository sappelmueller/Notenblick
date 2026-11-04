# Effizient entwickeln

Die Anwendung bleibt in Phase 1 unverändert bei 1.24.0. Auf `entwicklung/1.25.0` wird ausschließlich die Testverwaltung vorbereitet. GitHub Actions bleiben aus. Ein erfolgreicher Infrastrukturtest ist keine Programm- oder Windows-Freigabe.

## Ablauf

1. Vorhandene Arbeitskopie und Werkzeuge verwenden; `setup` nur bei fehlenden/geänderten Voraussetzungen. Den Ausgangsstand während der Aufgabe beibehalten.
2. `python3 dev/manage.py plan --base <Ausgangsstand>` zeigt betroffene Gruppen. `--paths` simuliert einen Plan und führt nichts aus.
3. `test changed --base <Ausgangsstand>` für Entwicklungsänderungen; vor einer Programmfreigabe Integration oder unmittelbar `release`. Nicht beide Gesamtläufe vorsorglich doppelt ausführen.
4. Bei einem Fehler den benannten Test und sein lokales Log bearbeiten. Danach denselben Befehl mit `--retry reports/<Lauf>` aufrufen. Bereits bestätigte Gruppen werden übernommen, betroffene/offene nachgeprüft. `release --retry reports/<Lauf>` funktioniert genauso. Ohne `--retry` findet der Runner passende Einzelbelege ebenfalls automatisch.
5. `status --report reports/<Lauf>/summary.json` bestätigt die vollständige aktuelle Release-Evidenz. Freigabe/Veröffentlichung bleiben eigene ausdrücklich beauftragte Schritte.

`--only` ist Diagnose, keine Freigabe. `--no-reuse` erzwingt bei begründetem Bedarf eine Neuausführung einschließlich der Rechenabschnitte; nicht routinemäßig benutzen. `release --check-only` hat denselben vollständigen Pflichtumfang wie `release`, mit temporärer Verpackung.

## Was als gültig gilt

`dev/evidence.py` verwendet Nachweisschema 2. Jede erfolgreiche Gruppe sichert sofort atomar und mit `fsync` einen eigenen Beleg unter `.build/evidence/tasks/<Gruppe>/<Inhaltsschlüssel>/`. Er enthält bestätigten Exitcode, Abschlusszustand, Prüfsummen, Dateimodi, unveränderliche Kopien der geschriebenen Ausgaben sowie das vollständige Log. Auch Prüfungen ohne eigene Ergebnisdatei haben einen Lognachweis. Erst danach wird der Gesamtbericht fortgeschrieben. Ein späterer Fehler oder Prozessabbruch verwirft frühere Erfolge nicht.

Die nächste Ausführung prüft Schlüssel, Struktur und sämtliche gespeicherten Ausgabebytes. Fehlende, beschädigte, unvollständige oder veränderte Belege werden abgelehnt. Benötigte Erzeugerausgaben werden aus bestätigten Kopien wiederhergestellt; gelöschte Arbeitsausgaben allein erzwingen dadurch keine Neuberechnung. Ein fehlgeschlagener erzwungener Wiederholungslauf widerruft den früheren Erfolg desselben Schlüssels. Unterschiedliche gültige Quellstände dürfen eigene Belege behalten.

Ein Schlüssel bindet Testcode und Helfer, fachlich benötigte Quellen, Abhängigkeiten, kanonischen Befehl, Zeitlimit und relevante tatsächliche Werkzeug-/Umgebungsinhalte. Werkzeugdateien werden nach Bytes geprüft; unveränderte Dateiidentitäten werden innerhalb eines Prozesses für das Hashen zwischengespeichert. Node-Pakete werden einschließlich ihrer installierten transitiven Abhängigkeiten erfasst, statt ein ganzes fremdes Laufzeitpaket zu scannen. Datum und Orchestrierungskennungen sind keine Prüfvoraussetzungen; Zeitzone, Sprache, Node-Optionen und andere wirksame Bedingungen bleiben gebunden.

Reine Kern-/Transferprüfungen benötigen keine CSS-/Dialogquellen, nativen Dateien oder allgemeinen Dokumente. Andere Oberflächenprüfungen bleiben bewusst breiter gebunden, weil sie gemeinsame Anwendungsteile laden. Änderungen an der Steuerung/Evidenz selbst entwerten die davon abhängigen Belege einmalig. Änderungen etwa am GitHub-Exporthelfer entwerten nicht alle fachlichen Gruppen. Der Infrastrukturtest darf die gesamte Quelle und Dokumentation kontrollieren. `export-files` liest die README tatsächlich und bleibt daran gebunden.

Unabhängige Office-/PDF-Prüfer binden die bestätigten erzeugten Datei-Inhalte. Läuft ein Erzeuger nach einer CSS-Korrektur neu und liefert exakt dieselben Dokumente, darf der gültige Prüfernachweis bleiben. Geänderte Dokumentbytes oder Prüfer/Werkzeuge erzwingen eine neue Validierung. Unbekannte Auswirkungen werden weiterhin konservativ geplant.

Die vollständige Quellidentität einschließlich Dokumentation bleibt im neuen Gesamtbericht erhalten. Ein alter Gesamtbericht wird nach einer Dokumentänderung ungültig; der nächste Lauf setzt seine weiterhin gültigen fachlichen Einzelbelege zu einem neuen vollständigen Nachweis zusammen. Kein Freigabe-Flag und keine bloße Anzahl bestandener Schritte ersetzen die Einzelbelege.

## Lange Prüfung und Builds

Der vorhandene große Datenbestand bleibt vollständig: zehn Schuljahre, 3.000 Schüler, 6.000 Leistungen und 180.000 Ergebnisse. Die 3.000 vollständigen Durchschnittsprüfungen über diese Ergebnisse sind nun 100 unabhängig bestätigte Fachabschnitte mit je 30 Schülern. Jeder Abschnitt prüft dieselben bisherigen Sollwerte und sichert erst nach sämtlichen Assertions einen Beleg. Nach Unterbrechung wird höchstens der gerade offene Rechenabschnitt wiederholt. Berechnungsquellen, Fixtures, Prüflogik, Werkzeuge oder relevante Eingaben geändert: die betroffenen Abschnitte sind ungültig. Direkter Aufruf von `large.cjs` ohne den vom Runner erzeugten Schlüssel rechnet bewusst alles neu.

Die zustandsabhängigen nativen Schreib-, Sicherungs- und Wiederherstellungsaktionen im Lasttest werden nicht mitten in einer Transaktion fortgesetzt. Ihr Teil läuft nach einem Abbruch erneut; sie dürfen nach vollständig bestandener Gesamtgruppe insgesamt wiederverwendet werden. Keine Fälle oder Assertions wurden entfernt.

Builds sind an Programmquellen, Compiler/SDK, Buildskripte, Version, Bibliotheks-Sperrdateien und tatsächlich ausgelieferte Lizenztexte gebunden. Dateiliste und Bytes der Ausgabe einschließlich generierter Integritätslisten müssen vollständig passen. Allgemeine Dokumentänderungen erzeugen keinen neuen Windows-Build. Fehlende/fremde/geänderte Ausgabedateien erzwingen eine Korrektur.

Zwei saubere unabhängige bytegleiche Builds werden einmal pro unverändertem Build-Schlüssel nachgewiesen und sofort gesichert. Ein späterer Testfehler erzwingt keine weiteren Doppelbuilds. Ohne gültigen Nachweis werden beide Builds vollständig neu und ohne Compilerkomponenten-Cache erstellt. Die abschließende Verpackung und CRC-/Datei-/Hash-/Entpackkontrolle bleiben erhalten; der Startnachweis identischer entpackter Programmbytes ist wiederverwendbar.

## Kleine Kontrollen und bisheriger Vergleich

Nur die Testinfrastruktur prüfen, ohne Programm-/Release-Suiten oder Entwicklungswerkzeuge neu aufzubauen:

```sh
python3 tests/test_management.py
python3 tests/test_management.py --benchmark
python3 - <<'PY'
import sys, unittest
sys.path.insert(0, 'tests')
from infrastructure import Efficiency
result = unittest.TextTestRunner(verbosity=1).run(
    unittest.defaultTestLoader.loadTestsFromTestCase(Efficiency))
sys.exit(not result.wasSuccessful())
PY
```

Die kleinen Kontrollen verwenden isolierte synthetische Arbeitskopien, kurze Testprozesse und einen simulierten Release-Katalog. Sie starten keine echten Anwendungs-/Release-/Exporttests und keinen Windows-Build. Der echte Release-Katalog wird nur auf Vollständigkeit und unveränderte Zeitlimits kontrolliert: alle bisherigen 87 Gruppen bleiben erhalten; die zwei vorhandenen Updater-Gruppen werden zusätzlich regulär eingebunden (89 insgesamt).

| Szenario | Bisher | Jetzt |
| --- | --- | --- |
| Zwei gültige Gruppen, dritte fehlerhaft und korrigiert | Release-Wiederholung führt alle drei erneut aus | Zwei übernehmen, nur dritte neu |
| Prozess endet nach einem Erfolg ohne Abschlussroutine | Noch nicht endgültig gespeicherter Erfolg geht verloren | Sofort gespeicherter Einzelbeleg bleibt gültig |
| Gelöschte oder von anderer Gruppe überschriebene Testausgabe | Nachweis am gemeinsamen Arbeitsort ungültig | Bestätigte unveränderliche Kopie wiederherstellen |
| Reine Dokumentänderung | Viele fachliche Schlüssel und Release-Neustart betroffen | Fachlich unbeteiligte Gruppen und Build bleiben gültig; neue vollständige Zusammenstellung |
| Nur CSS geändert | Breite Schlüssel, Lastgruppe ohne Wiederverwendung | Keine Wiederholung gültiger Kernprüfungen/Rechenabschnitte; UI prüfen |
| Unveränderte Exportdateien nach neuem Erzeugerlauf | Validatoren grundsätzlich neu | Bytegebundene Prüfernachweise übernehmen |
| Später Fehler nach gültigem Doppelbuild | Erneuter frischer Build, später nochmals Doppelbuild | Gültigen Doppelbuild-Nachweis übernehmen |

Gemessen am 4. November 2026: drei synthetische 40-ms-Prüfungen, Fehler in der dritten, danach Korrektur. Die bisherige Frischlauf-Strategie führte beim Wiederholen drei Prüfungen aus (0,4115 s), die neue eine (0,1601 s); zwei vermieden, 0,2514 s gemessene Ersparnis in diesem kleinen Szenario. Das ist kein Laufzeitvergleich der gesamten Anwendung. Bei zwei bereits gültigen jeweils zehnminütigen Gruppen entfielen rechnerisch rund 20 Minuten Wiederholung zuzüglich der verbleibenden Hash-/Kontrollkosten; diese Minuten wurden hier nicht gemessen. Eine belastbare Gesamtersparnis wird erst beim separat beauftragten Audit ermittelt. Aus lokaler Rechenzeit lässt sich kein direkter KI-Tokenverbrauch ableiten.

## Grenzen und Aufbewahrung

- Die erste Prüfung nach Einführung von Schema 2 benötigt neue Belege. Alte pauschale Cache-/Release-Berichte ohne vollständige Ausgabekopien werden nicht als Erfolg importiert. Werkzeuge und passende Kompilatkomponenten werden anhand ihrer Nachweise weiterverwendet.
- `.build`, `reports`, `tests/exports`, Werkzeuge und ausführliche Logs bleiben lokal und außerhalb von Git. Nachweise überstehen Fehler und Neustarts derselben erhaltenen Arbeitskopie. Wird sie gelöscht, müssen fehlende Nachweise neu entstehen; Git transportiert sie nicht automatisch. Keine automatische Übertragung an Dienste.
- Prüfsummen erkennen Beschädigung und Manipulation vorhandener Belege; sie sind keine digitale Signatur gegen einen Angreifer mit vollständiger Kontrolle über Maschine, Runner und alle Nachweisdateien. Nur eigene lokale Nachweise verwenden.
- Eine Betriebssystem-Sperre verhindert parallele Runner in derselben Arbeitskopie. Bei hartem Beenden auch eventuell noch laufende Testkindprozesse beenden, bevor dieselbe Kopie wieder benutzt wird. Normales Abbrechen/Timeout beendet die vom Runner gestartete Prozessgruppe unter Linux.
- Kein künstlicher Gesamterfolg, keine gestrichenen Programmfälle, keine geänderte Berechnungslogik. Der reale lange Datenlauf und der vollständige automatische Windows-Installations-/Wiederherstellungsablauf wurden in Phase 1 ausdrücklich nicht ausgeführt. Windows/ARM64, NVDA, Braille und echte Office-Anwendungen bleiben gesonderte Praxistests.
- Im Chat nur Status, Anzahl, Dauer, betroffene Gruppen und konkrete Fehler. Vollständige Logs verbleiben in `reports/`; keine wiederholten vollständigen Codeanalysen.

Historische Messungen stehen im [Archiv](archiv/ENTWICKLUNGSOPTIMIERUNG-1.14.md); maßgeblich sind der aktuelle Code und [Veröffentlichungsablauf](VEROEFFENTLICHUNG.md).
