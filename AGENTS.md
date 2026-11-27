# Notenblick – verbindliche Entwicklungs- und Testrichtlinien

## 1. Oberstes Ziel

Kontingent, Modell-Tokens, Rechenzeit und Entwicklungsaufwand konsequent schonen. Korrekte Notenberechnung, Datensicherheit und Barrierefreiheit erhalten. Ausschließlich den beauftragten Umfang bearbeiten. Keine vorsorglichen Zusatzarbeiten.

## 2. Projekt- und Datenschutz

- Ausschließlich `sappelmueller/Notenblick` (Repository-ID `1432518047`) bearbeiten. Private und öffentliche Sichtbarkeit sind zulässig. Keine anderen Projekte als Arbeits- oder Ablageort verwenden.
- Vor lokalen Schreibvorgängen `python3 dev/guard.py` ausführen. Vor entfernten Code-Schreibvorgängen Zielname, ID, Sichtbarkeit und deaktivierte GitHub Actions prüfen; `dev/guard.py --remote` oder gleichwertige GitHub-Anbindung verwenden. Bei fehlender Prüfung keine Code-Pushes. Keine Force-Pushes.
- GitHub Actions bleiben deaktiviert. Keine Workflows, Runner, Dependabot-Konfigurationen, kostenpflichtigen oder fremden Hosting-Dienste aktivieren.
- Ausschließlich synthetische Testdaten verwenden. Keine echten Schülerdaten, Notenlisten, Sicherungen, Zugangsdaten oder privaten Angaben in Git oder Berichten. Vorgemerkte Änderungen vor dem Commit prüfen; Git-Autorenadresse bewusst wählen, für den Eigentümer GitHub-noreply verwenden.
- Architektur, GPLv3 und Drittanbieter-Lizenzhinweise erhalten. Abhängigkeiten nur bei Bedarf ändern; Sperrdateien und Prüfsummen konsistent pflegen. Beim Update nur EXE und vollständigen Programmordner ersetzen; Benutzerdaten unangetastet lassen.

## 3. Ressourcenschonendes Arbeiten

- Mit `docs/PROJEKTUEBERSICHT.md`, Git-Status und aktuellem Ausgangsstand beginnen, soweit für den Auftrag relevant. Nur benötigte Dateien, Funktionen und direkte Abhängigkeiten lesen.
- Arbeitskopien, Werkzeuge und vorhandene Komponenten wiederverwenden. Keine alten ZIPs suchen; Setup nur bei fehlenden oder geänderten Werkzeugen.
- Keine wiederholten Repository-Analysen, vollständigen Audits, unnötigen Refactorings, Testskripte, Hilfsdateien oder Dokumentationen.
- Zusammengehörige Änderungen bündeln und anschließend gezielt prüfen. Erfolgreiche Prüfungen nicht ohne relevante Änderung wiederholen.
- Vorhandene Entwicklungswerkzeuge nur mit geeigneten, eng begrenzten Profilen nutzen. Keine automatischen Volltests durch Standardbefehle auslösen. Falls ein Werkzeug die erforderliche Begrenzung nicht unterstützt, gezielte vorhandene Einzeltests nutzen.
- Keine absoluten temporären Pfade, Doppelimplementierungen oder beschönigten Testerwartungen.

## 4. Verbindliche Teststrategie

- Nur geänderte Funktionen und unmittelbar betroffene Abhängigkeiten testen. Vorhandene Einzeltests oder gefilterte Testgruppen bevorzugen.
- Keine vollständigen Testsuiten, pauschalen Integrationstests, Regressionstests oder Gesamtaudits ohne ausdrücklichen Auftrag. Dies gilt auch bei Releases.
- Bei Logikänderungen normalerweise ein Standardfall und ein relevanter Grenz- oder Fehlerfall. Weitere Fälle nur bei einem konkreten Risiko.
- Normalerweise höchstens drei bis fünf Einzelnoten; bei klassenbezogenen Funktionen möglichst eine Klasse, ein Fach und ein bis drei Schüler. Größere Datenmengen nur, wenn für einen konkreten Fehlerfall unvermeidbar.
- Massentests mit beispielsweise 180.000 Ergebnissen, Lasttests, Stresstests und umfangreiche Zufallstests ohne ausdrücklichen Auftrag untersagt.
- Nach einem Fehler ausschließlich den betroffenen Bereich korrigieren und nachprüfen. Gültige vorhandene Testnachweise wiederverwenden, sofern die relevanten Eingaben, Werkzeuge und geprüften Ausgaben unverändert sind.
- Reine Text- und Dokumentationsänderungen benötigen keine automatisierten Funktionstests oder Builds; kleine kosmetische Änderungen bevorzugt anhand des Codes prüfen.
- Kritische Änderungen an Notenberechnung, Gewichtung, Rundung, Speicherung, Migration, Sicherung, Wiederherstellung, Passwortschutz, Verschlüsselung, Löschung und Updates mit wenigen gezielten, risikogerechten Fällen absichern. Kontingentschonung rechtfertigt keine Auslassung notwendiger Sicherheits- oder Korrektheitsprüfungen.
- Nur betroffene Exportformate prüfen, auch bei Änderungen gemeinsamer Exportfunktionen. Kleinstmöglichen repräsentativen Datensatz verwenden. Keine pauschalen PDF-, Word-, Excel-, CSV-, TXT-, JSON-, Office- oder Drucktests.

## 5. Oberfläche und Barrierefreiheit

- Einheitliche Oberfläche und barrierefreie Bedienung erhalten: Hauptnavigation als Links, echte Tabs, stabiler Fokus, semantische Bedienelemente, kurze natürliche Beschriftungen und Meldungen.
- NVDA, Braillezeilen und Tastaturbedienung berücksichtigen. Nur geänderte Elemente und betroffene Navigationswege prüfen. Keine vollständigen visuellen oder barrierefreien Audits ohne ausdrücklichen Auftrag.
- Tatsächlich ausgeführte Prüfungen von offenen Windows-, ARM64-, UIA-, NVDA-, Braille- und Office-Livetests unterscheiden. Keine praktische Prüfung behaupten, die nicht stattgefunden hat; keine Windows-Freigabe aus Linux-/Chromium-Ergebnissen ableiten.

## 6. Builds, Entwicklungsbranches und Releases

- Programmentwicklung auf separatem Entwicklungsbranch. Reine Projektregel- oder Dokumentationsänderungen dürfen bei ausdrücklichem Auftrag über den vorgesehenen GitHub-Änderungsweg in den Hauptbranch übernommen werden.
- Änderungen bündeln; notwendige Builds erst nach Abschluss der Implementierung. Keine wiederholten Paketierungen, Neuinstallationen oder obligatorischen Doppelbuilds.
- x64- und ARM64-Pakete erstellen, wenn für die beauftragte Testversion oder Veröffentlichung erforderlich. Geeignete vorhandene Artefakte und Abhängigkeiten wiederverwenden.
- Vor Veröffentlichung nur notwendige gezielte Prüfungen und Paket-/Archivkontrollen durchführen. Keine erneuten Volltests, Massentests, pauschalen Integrationstests oder bytegleichen Doppelbuilds erzwingen. Bereits erfolgreich geprüfte unveränderte Funktionen nicht erneut testen.
- Vorhandene Release-Werkzeuge und `docs/VEROEFFENTLICHUNG.md` hinsichtlich dieser Teststrategie beachten: Bei widersprüchlichen älteren Testpflichten gilt diese AGENTS.md. Keine Freigabenachweise vortäuschen. Falls ein vorhandenes Release-Werkzeug weiterhin umfangreiche Pflichtprüfungen erzwingt, diesen Konflikt offenlegen und nur im beauftragten Umfang gezielt anpassen.
- Ein fehlgeschlagener relevanter Test verhindert die Programmfreigabe. Offene notwendige Prüfungen benennen.
- Ablauf: Entwicklungsbranch → gezielte Prüfungen → Testversion → ausdrückliche Freigabe durch den Projekteigentümer → `main`, eindeutiger Versions-Tag und offizielles GitHub-Release. Keine automatische Veröffentlichung. Bestehende Tags und Downloads nicht ohne ausdrücklichen Auftrag ersetzen.
- Quellen, Tests und kompakte notwendige Nachweise im Repository sichern. Downloads, Browsercache, Buildausgaben und vollständige Logs außerhalb von Git halten. Zusammenhängende geprüfte Änderungen als Zwischenstand sichern; dies ist keine Programmfreigabe. Bei GitHub-Abgaben vorhandene Exportwerkzeuge nutzen, soweit erforderlich, und den endgültigen Baum gezielt vergleichen.

## 7. Ausgaben und Abschluss

- Tool- und Konsolenausgaben auf relevante Informationen begrenzen. Keine vollständigen Logs, umfangreichen Testtabellen, Dummy-Daten oder wiederholten Planungsberichte ausgeben.
- Erfolgreiche Tests in ein bis zwei Zeilen zusammenfassen; bei Fehlern nur relevante Ausschnitte untersuchen.
- Abschlussbericht kurz halten: Änderungen, tatsächliche Prüfungen und Ergebnisse, bereitgestellte Version/Dateien sowie verbleibende Fehler, Risiken und notwendige nicht durchgeführte Prüfungen.

## 8. Vorrang und Ausnahmen

Diese Richtlinien gelten für Entwicklung, Testversionen und Releases. Ältere Vorgaben zu verpflichtenden Volltests, Massentests, Doppelbuilds oder pauschalen Testnachweisen sind nicht mehr verbindlich. Umfassende Prüfungen nur bei ausdrücklichem Auftrag; auch dann redundante Arbeit vermeiden.

**So wenig Analyse, Tests, Builds und Ausgaben wie möglich – so viel wie für eine zuverlässige, sichere und barrierefreie Umsetzung erforderlich.**
