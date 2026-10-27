# Entwicklungsoptimierung – 27. Oktober 2026

Reine Infrastrukturpflege auf dem geprüften Notenblick-1.14.0-Quellbaum. Programmversion, Fachlogik, Datenformat und Oberfläche bleiben unverändert. Keine zusätzlichen Dienste, Abhängigkeiten oder GitHub Actions.

## Befund

Der alte Einstieg baute vor jedem Testprofil das vollständige Programm sauber neu. Selbst `quick` enthielt 15 Sammlungen einschließlich großer Exportgenerierung (`v1120`: 905 enthaltene Berichte/38 Dokumentfälle). Der Open-XML-Prüfer wurde vor jeder Validierungsgruppe erneut kompiliert. Ergebnisdateien wurden nach jedem Schritt gesammelt erneut kopiert. Quellstände/Prüfbedingungen waren im Gesamtbericht nicht inhaltlich identifiziert; erfolgreiche Schritte konnten daher nicht sicher wiederverwendet werden.

Der alte Runner begrenzte seine Terminalausgabe bereits auf acht Zeilen je Schritt. Die 180.000-Ergebnis-Prüfung selbst läuft lokal und meldet nur wenige Messwerte. Es gibt keinen Nachweis, dass ihre Rechenlast viele KI-Tokens verbraucht. Größere Kostentreiber sind wiederholte KI-Sichtung von Quelltext/Dateien, zusätzliche Diagnoseaufrufe, unnötige Gesamtläufe und verlorene temporäre Arbeitsstände mit anschließender Rekonstruktion. Eine tatsächliche KI-Verbrauchsstatistik liegt nicht vor.

## Umsetzung

- `testplan.py`: nachvollziehbare Git-basierte Auswahl für Entwicklung/Integration, einschließlich neuer/gelöschter/umbenannter Dateien und Abhängigkeiten. Gemeinsame/unklare Änderungen konservativ breit. `plan --paths ...` simuliert ausschließlich; daraus entsteht kein Testnachweis. Alle ursprünglichen 44 Testprogramme bleiben im vollständigen Ablauf enthalten.
- `test changed`: sichere Wiederverwendung einzelner vollständiger Erfolge; eigene Tests, gemeinsame Helfer und abhängige Erzeuger sind gebunden. Andere bekannte Testdateien invalidieren keine unabhängigen Sammlungen. `--retry` behält auch noch nicht ausgeführte Aufgaben des ursprünglichen Plans und ergänzt neue Auswirkungen. `--only` dient ausdrücklich nur der gezielten Diagnose.
- `evidence.py`: SHA-256-basierte Inhalts-/Modusprüfung von Quelle, echten Werkzeugdateien und Abhängigkeiten, Umgebung und erzeugten Ausgaben. Defekte/fehlende Ausgaben, unvollständige oder fehlgeschlagene Belege gelten nicht als Erfolg. Compilerprodukte werden nur mit übereinstimmenden Eingaben/Werkzeugen und intakten gespeicherten Bytes zurückkopiert. Ein Betriebssystem-Lock verhindert vermischte parallele Läufe.
- Toolaufrufe erhalten wechselnde authentifizierte Proxy-URLs/Tracekennungen. Diese verursachten zunächst trotz identischem Code ungültige Wiederverwendungskennungen. Die lokalen Testunterprozesse entfernen solche Metadaten nun tatsächlich aus ihrer Umgebung; relevante Einstellungen wie PATH, TZ, NODE_OPTIONS, Java-/Python- und Notenblick-Optionen bleiben gebunden. `setup` behält den normalen Downloadzugang. Es werden keine Umgebungswerte/Zugangsdaten in Belegen gespeichert.
- Build-Erfolge prüfen sämtliche Ausgabedateien einschließlich zusätzlichen/fehlenden Dateien. Bei unverändertem Programm wird der komplette Build vermieden; bei reinen Webänderungen können unveränderte C#-Bibliotheken übernommen werden. Einrichtung prüft vorhandene npm-Inhalte und Abhängigkeitssperren; reine Paketversions-/Skriptpflege löst keine überflüssige Neuinstallation der unveränderten Abhängigkeiten aus. Compilerauflösung und unveränderter Open-XML-Prüfer werden wiederverwendet.
- Vollständige Logs werden direkt in Dateien geschrieben. Standardausgabe enthält kurze Status-/Zeitangaben, Wiederverwendungsanzahl und Berichtspfad. Fehler bekommen eine begrenzte konkrete Diagnose samt vollständigem Log und `failure.json`. Neue Ergebnisdateien werden einmal übernommen; große Erfolgssammlungen werden nicht in den Chat geladen.
- GitHub-Exporthilfe unterstützt optional einen Ausgangsstand; nur geänderte Blobs/Modi und Löschungen werden übertragen. Exakte Git-Bytes und abschließender Baumvergleich bleiben erhalten. Projektübersicht/AGENTS und npm-Standardbefehle machen die neue Vorgehensweise zum normalen Einstieg.

## Unveränderte Freigabegrenze

`release` führt weiterhin alle bisherigen mathematischen, nativen Speicher-/Restore-, 180.000-Ergebnis-, Browser-/Tastatur-/Fokus-/axe-, Office-/PDF/UA-/Druck-, Loader- und Paketprüfungen aus. Keine Testwiederverwendung, keine gekürzte Exportmatrix. Beide Programmbuilds werden frisch kompiliert und müssen bytegleich sein. Der reine Office-Validator ist ein geprüfter Entwicklungsbaustein, kein Reproduzierbarkeitsziel des Windows-Programms.

`release --check-only` ist derselbe Ablauf mit temporären vollständigen Programm-/Quellarchiven und echtem Entpacktest, ohne neue Veröffentlichung. `summary.json` unterscheidet laufend/fehlgeschlagen/bestanden und speichert Quelle, Werkzeuge, Aufgaben, vollständige Logbezüge, Dauer und Programmausgabe. Nur ein vollständiger frischer Release-Lauf ist freigabefähig. Der Status verlangt außerdem, dass Index und Arbeitskopie dieselben geprüften Dateien enthalten (keine ungestagten oder nicht erfassten Quelldateien). Änderungen danach machen `status --report ...` ungültig; ein Commit ohne Inhaltsänderung entwertet den Nachweis nicht.

Die Infrastrukturregressionen prüfen Auswahl für Mathematik, Speicherung, Export, Accessibility und gemeinsame Komponenten, transitive Abhängigkeiten, Git-Änderungen, Quell-/Dateimodusnachweise, unbekannte Änderungen, beschädigte/fehlende/alte Erfolge, andere Befehle/Werkzeuge, Wiederholen fehlgeschlagener Schritte, Kompilierwiederverwendung, Lock und Freigabeinvalidierung. Der abschließende gesamte Prüflauf bleibt zusätzlich erforderlich.

## Messgrenzen

Gemessene Schritte, Laufzeiten und Ausgabe-Bytes sind technische Einsparindikatoren, keine KI-Token- oder Kontingentmessung. Vollständige Release-Laufzeiten hängen zudem von Rechnerlast und Renderern ab. Ein verlorener Werkzeugcache kann jederzeit neu aufgebaut werden; daraus folgt weder ein Datenverlust noch eine Freigabe ohne erneute Prüfung. Tatsächliche Windows-/NVDA-/Office-Abnahme bleibt gesondert offen.


## Tatsächlich erhobene Vergleichswerte

- Vorheriger vollständiger 1.14.0-Release: 51 erfolgreiche Schritte, 388,50 Sekunden summierte Kindprozesszeit; 4.897 Bytes vollständige lokale Kindprozesslogs. Diese geringe Logmenge belegt gerade keinen hohen Tokenverbrauch des Lasttests. Der aktuelle Auftrag verändert keine Programmdatei.
- Gleiche gezielte UI-/Abschlussnotenprüfung mit der neuen Steuerung: erster gemessener Aufruf 11,26 Sekunden Gesamtzeit, drei ausgeführte Testprogramme; Wiederholung bei unveränderten Eingaben 5,42 Sekunden, eine ausgeführte Schutzprüfung und zwei verifizierte Übernahmen. Beide Male kein Programmbuild; der bisherige Runner startete vor jedem Testaufruf beide Buildschritte.
- Gesamte Terminalausgabe dieser beiden Aufrufe: 230 beziehungsweise 236 UTF-8-Bytes. Wiederverwendung braucht nicht zwingend weniger Text; sie verhindert die erneute Ausführung und zusätzliche Diagnosearbeit.
- Reine Formatwiedergabe **derselben drei gespeicherten Kindprozesslogs**: bisherige Schrittformatierung 564 Bytes, neue Erfolgszeilen 73 Bytes. Dies ist ein nachvollziehbarer Formatvergleich ohne zusätzlichen Testlauf, keine Tokenabrechnung.
- 36 Infrastrukturregressionen tatsächlich bestanden (vorher 14), einschließlich echter Unterprozess-Erfolge/Fehler und Wiederverwendung, Auswahlmatrix, Cachekorruption, geänderter Bedingungen, Quelldateien/Modi, Indexabweichung, Compilerprodukten und Parallelitätsschutz.
- Exportauswahl in Stufe Entwicklung: vier bestehende Testprogramme einschließlich acht echter Berichtskombinationen und unabhängiger Validatoren; Integration erweitert auf sämtliche Export-/Browserregressionen. Bei Infrastrukturänderungen wie hier wird konservativ der vollständige Bereich ausgewählt.

Die finale Abnahme erfolgt mit `python3 dev/manage.py release --check-only`. Ergebnis und tatsächliche Gesamtdauer werden in der abschließenden Commitbeschreibung festgehalten; alle Details stehen lokal im zugehörigen maschinenlesbaren Bericht. Der vollständige Umfang ist mit den bisherigen 44 Testprogrammen plus sieben Build-/Paket-/Entpackschritten weiterhin 51 Schritte, ergänzt um die neuen Infrastruktur-Testfälle.

Zu erwarten sind deutlich weniger wiederholte KI-Dateisichtungen, weniger unnötige Tool-Ausgaben und Wiederholungen sowie schnellere lokale Prüfschleifen. Dafür wird ausdrücklich keine unbelegte Kontingent-Prozentzahl angegeben. Die vollständige Schlussabnahme bleibt umfangreich und wird nicht durch die Entwicklungsnachweise ersetzt.


## Im Gesamtlauf erkannter und behobener Buildfehler

Der erste Gesamtlauf stoppte korrekt am Assembly-Lader: Der Arbeitsordner hatte während der schnellen DLL-Kopie kurzzeitig eine `.rsync-tmp`-Datei gezeigt, die in die generierte Allowlist gelangt war und später fehlte. Die Anwendung wurde deshalb nicht freigegeben. Der Build wartet nun auf das Verschwinden solcher Transportzwischenstände und mehrere inhaltlich gleiche Dateischnappschüsse. Bleibt der Ordner instabil, bricht er ab; weder Loader noch ZIP-Prüfung ignorieren Zusatzdateien. Eine Regression prüft beide Fälle. Fehlerzusammenfassungen zeigen nun auch die eigentliche .NET-Exception hinter einer äußeren Assertion. Sämtliche bisherigen Test-Zeitgrenzen werden unverändert übernommen und ausdrücklich geprüft.

Nach der Korrektur bestanden auch die gezielte echte Assembly-Laderprüfung (17 Fälle) und 38 Infrastrukturregressionen. Der anschließende vollständige Abnahmelauf wird erneut frisch durchgeführt; der gestoppte Vorlauf wird nicht als Freigabe gewertet.

Die zusätzliche reale Wiederholung von `setup` deckte einen Namenskonflikt zwischen Download-Hash und Cache-Fingerabdruck auf. Der Konflikt wurde getrennt benannt und durch eine eigene Setup-Regression abgesichert: vorhandenes SDK/Browser ohne Download, unveränderte npm-Inhalte ohne Neuinstallation, reine Versionsmetadaten unverändert wiederverwendet, veränderte Inhalte neu eingerichtet. Diese Prüfung findet nun vor der abschließenden Gesamtabnahme statt.

Reale Einrichtungsmessung nach der Korrektur: erster Aufruf 2,29 Sekunden einschließlich einmaligem Aufbau des neuen Inhaltsnachweises; zweiter Aufruf 0,75 Sekunden, vorhandene npm-Dateien unverändert. Die abschließende gezielte Sammlung umfasst jetzt 39 bestandene Infrastrukturregressionen. Die vorangehende vollständige Abnahme hatte 51 Schritte/412,53 Sekunden Kindprozesszeit bestanden; nach der Setup-Korrektur wird der gesamte Stand erneut geprüft. Daraus wird kein Zeitgewinn für die weiterhin vollständige Freigabe behauptet.
