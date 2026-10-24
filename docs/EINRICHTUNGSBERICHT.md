# Einrichtung der Entwicklungsbasis

Stand: 24. Oktober 2026. Programmversion weiterhin **1.8.0**, keine neuen Programmfunktionen.

## Ausgangsbasis und Schutz

Verwendet wurden die neuesten vollständigen Programm- und Quellcodearchive von Notenblick 1.8.0. Der ursprüngliche Quellstand ist als lokaler Commit mit Tag `baseline-1.8.0` erhalten. Alle Dateien unter `src` und `native` sind gegenüber dieser Ausgangsbasis bytegleich; ein zusätzlicher Regressionstest prüft dies für den Einrichtungsauftrag. Bei späteren autorisierten Funktionsänderungen ist diese einmalige Erhaltungsprüfung bewusst auf einen neuen überprüften Ausgangsstand umzustellen.

TrainScope wurde nicht verändert. Sämtliche Einrichtungsschritte und Git-Konfigurationen sind auf diesen separaten Notenblick-Ordner beschränkt. Es wurden keine echten Schülerdaten verwendet oder übernommen.

## GitHub eingerichtet

Das private Repository **sappelmueller/Notenblick**, Repository-ID **1432518047**, wurde am 24. Oktober 2026 im bestätigten Konto angelegt. Vor der Übertragung des Quellcodes wurde dort in Einstellungen → Actions → General **Disable actions** gespeichert. GitHub bestätigte „Actions policy updated“ und den ausgewählten deaktivierten Zustand; Workflows können dort nicht laufen. Es wurden keine Runner, Workflows oder kostenpflichtigen Dienste aktiviert. Der Actions-Minutenverbrauch dieser Einrichtung ist null.

Die Quellcodeübertragung erfolgt ausschließlich über die verbundene GitHub-Anbindung mit festem Zielnamen und vorheriger Prüfung von Repository-ID und privater Sichtbarkeit. Die Git-CLI dieser Umgebung besitzt keine GitHub-Anmeldedaten; ein zusätzlicher persönlicher Zugriffsschlüssel wird nicht angelegt. Bei Verwendung der CLI bleibt die entfernte Schutzprüfung ohne bestehendes gh/Token absichtlich gesperrt. Die Browser-Anmeldung wird nur für die nicht über die Anbindung verfügbaren Verwaltungsfunktionen benötigt.

Der Originalstand 1.8.0 und die eingerichtete Entwicklungsbasis werden als aufeinanderfolgende Commits und als gesondert erreichbarer Ausgangsstand gesichert. Die Identität der übertragenen Quellbäume wird mit den lokalen Git-Baum-Prüfsummen verglichen. Alle Dateien von TrainScope bleiben unberührt; keine persönlichen Schülerdaten oder Sicherungen werden übertragen. Verbindliche Arbeitsregeln und der festgelegte Repository-Eigentümer stehen in AGENTS.md und dev/repository.json.

## Werkzeuge und Wiederverwendung

- .NET SDK **8.0.426**, Downloadmetadaten und SHA-512-Prüfsummen für Linux x64/ARM64 und Windows x64/ARM64 festgelegt; lokal Linux x64 installiert und benutzt.
- Zielanwendung unverändert .NET Framework **4.8**, WebView2 SDK **1.0.2903.40**, Newtonsoft.Json **13.0.3**; benötigte DLLs einschließlich x86/x64/ARM64-WebView2-Loader enthalten und per SHA-256 gesperrt.
- Node **24.22.1**, Python **3.12.14** im tatsächlichen Prüflauf; npm-Abhängigkeiten vollständig über `package-lock.json` gesperrt.
- Lokaler Testbrowser Chrome Headless Shell **156.0.8078.47**, offizieller Download und SHA-256 gesperrt. Der ursprünglich von Playwright angeforderte Browserdownload war unvollständig; deshalb wird auf Linux x64 der explizit festgelegte offizielle Testbrowser verwendet. Browserprüfungen mit der enthaltenen Playwright-Version sind erfolgreich ausgeführt.
- Alle Skripte verwenden Projektpfade. Alte `/tmp`-Abhängigkeiten sind entfernt. `setup` wurde nach der Erstinstallation erneut erfolgreich ausgeführt und verwendet vorhandene passende Werkzeuge wieder.
- Die Windows-Bibliotheken und der Anwendungskern brauchen beim Build keine Paketdownloads. Eine zurückgesetzte Umgebung benötigt für SDK, Node-Testpakete und Testbrowser erneut Internetzugriff; die Konfiguration und Tests müssen nicht rekonstruiert werden.

## Tatsächlich ausgeführte Gesamtprüfung

Der vollständige lokale Ablauf `python3 dev/manage.py release` war erfolgreich; **29 Prozessschritte**, sämtlich mit Rückgabewert 0. Dauer des damaligen Gesamtlaufs rund drei Minuten. Im Gesamtlauf liefen elf neue Infrastrukturregressionen; die anschließend ergänzte Prüfung des tatsächlich vorgemerkten Commit-Inhalts und des Optimierungsschutzes brachte die Sammlung auf 13 ebenfalls erfolgreich ausgeführte Infrastrukturregressionen. Die anschließend dauerhaft ergänzte GitHub-Exportprüfung wurde ebenfalls ausgeführt; damit stehen nun 14 Infrastrukturregressionen bereit.

| Prüfbereich | Ergebnis |
| --- | --- |
| Berechnungen und Speichervalidierung | 16.160 bestandene Prüfgruppen |
| Direkte Gewichtung | 992 exakte Referenzfälle bestanden |
| Umrechnung von Gewichtsmodellen | 441 exakte Fälle bestanden |
| Bestehende UI-/Versionsregressionen | alle neun Standard-Testprogramme bestanden |
| Nativer produktiver C#-Speicherkern | sechs Testprogramme mit insgesamt 48 Szenarien bestanden |
| Großer Bestand | 10 Schuljahre, 3.000 Schüler, 6.000 Bewertungen, 180.000 Noteneinträge; Speicherung, Export, Wiederherstellung bestanden |
| Produktiver Assembly-Lader | 17 Prüfungen bestanden, nach Wiederholungsbuild erneut bestanden |
| Browser, Tastatur, Fokus, Accessibility | 91 + 30 + 38 Prüfpunkte; keine axe-Verstöße in den geprüften Zuständen |
| Wiederholter sauberer Build | sämtliche Programmdateien bytegleich |
| Vollständige ZIP-Dateien | Programm und Quellcode erzeugt; Dateibestand und Prüfsummen geprüft |
| Frisch entpackte Ausgabe | Start im Testhost, Einrichtung, Navigation und mündliche Note erfolgreich |
| Neue Schutzmechanismen | falsches Pushziel, fremde effektive Push-URL, private Dateipfade, Actions-Dateien, fehlende Repository-ID und fehlgeschlagene Tests werden abgewiesen |

Der aktuelle Quellstand wurde außerdem direkt aus dem privaten GitHub-Repository erneut heruntergeladen; sämtliche 145 Dateien dieses ersten eingerichteten Stands waren bytegleich. Der vollständige Abruf einschließlich der binären Bibliotheken ist damit tatsächlich geprüft. Der wiederverwendbare Export und der genaue Ablauf sind zusätzlich unter dev/github-export.py und docs/GITHUB-ANBINDUNG.md hinterlegt.

Die Angaben sind unterschiedliche Prüfgranularitäten und werden nicht zu einer künstlichen Gesamtzahl addiert. Das vollständige maschinenlesbare Protokoll liegt im Sicherungspaket unter `Pruefung`.

## Grenzen

Ein tatsächlicher Windows-Programmstart, Windows-Sicherheitszonen, WebView2/UI Automation, Windows-Skalierung und NVDA wurden **nicht** ausgeführt. Hier ist keine Windows-Laufzeit verfügbar. Windows-Start oder gesprochene NVDA-Ausgaben werden daher nicht als bestanden bezeichnet. Ein Windows-Prüfskript und ein manueller Prüfplan liegen bei. Die ZIP ist ein unter Linux geprüfter Build-Kandidat derselben Programmversion, keine neue Windows-geprüfte Veröffentlichung.

Die Windows-Anwendung benötigt weiterhin .NET Framework 4.8 und eine vorhandene WebView2-Laufzeit; die ZIP enthält weder das Betriebssystem noch die komplette WebView2-Engine. Kein Codesignierungszertifikat ist vorhanden. Es wurden keine Sicherheitsmechanismen abgeschaltet.
