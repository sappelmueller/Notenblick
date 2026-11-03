# Notenblick 1.24.0 – Testversion

Ausgang: vollständiger Entwicklungsstand 1.23.3, `b4491164f6c6ada1a68327362b0d57b96dd4e46e`. `main` bleibt die offizielle 1.23.2, `f6bb26b0cf5c004c4c6191f5fe14d6df6cec043e`. Entwicklung ausschließlich in `entwicklung/1.24.0`. Repository `sappelmueller/Notenblick`, ID 1432518047, ist öffentlich; Actions bleiben aus. 1.23.3 bleibt unveröffentlicht. Keine bestehenden Tags, Releases, Downloads oder historischen Prüfberichte verändern.

## Bedienung

Maximierter Start, Wiederholungsansage, stabiler Fachbereich und Menüfokus aus 1.23.3 bleiben erhalten. Beim Alt-Fachwechsel aus anderen Hauptbereichen werden Inhalt und zugänglicher H1-Name vor dem Einblenden fertiggestellt. Anschließend folgt nur die beabsichtigte Fokusquelle. Innerhalb von Noten bleiben Wiederholungen über die bestehende Statusquelle bestätigt. Die vermutete Ursache ist die Reihenfolge von Einblenden und Namensänderung; die tatsächliche NVDA-Ausgabe muss erneut geprüft werden.

Allgemein enthält Aktualisierungen mit installierter Version, manueller Prüfung und freiwilliger, zunächst ausgeschalteter Startprüfung. Automatisch wird höchstens alle 24 Stunden geprüft, ohne den Start abzuwarten. Fehlversuche zählen zum automatischen Abstand; manuelle Prüfungen bleiben unabhängig möglich.

Die Startkarte erhält die bestehenden Bereiche und deren Elemente. Später gilt für die Sitzung, Ausblenden für genau eine Version; eine neuere Version erscheint wieder. Keine Start-Pop-ups oder automatischen Fokuswechsel. Optionen und letzter bekannter Hinweis liegen außerhalb von Daten im lokalen Windows-Benutzerprofil, gebunden an den Installationspfad. Sie werden nicht mit Noten oder Ansichtseinstellungen übertragen.

„Was ist neu?“ zeigt ausschließlich die gepflegten `releaseNotes` des freigegebenen Deskriptors. Drei bis fünf kurze Aussagen statt technischer GitHub-Listen. Der vorhandene Dialograhmen übernimmt Überschrift, Escape, F1 und Rückkehr. Der bestehende Fortschrittsdialog zeigt Phasen und Fortschritt ohne fortlaufende Prozentansagen. Lange Einstellungsregister dürfen auch bei sehr schmaler Ansicht umbrechen.

## Quelle und Integrität

Die Weboberfläche erhält keine Netzwerkfreigabe. Nur der native Client kontaktiert nach freiwilliger Prüfung die feste GitHub-API und kontrolliert die Repository-ID. Es werden weder Notendaten, Dateipfade, Anmeldedaten, Gerätekennungen noch Nutzungsstatistiken übertragen. Die installierte Version wird nicht als Anfrageparameter gesendet.

Entwürfe, Prereleases, Branches, normale Commits sowie ungültige oder nicht höhere Versionen werden nicht angeboten. Ein stabiles Release benötigt den passenden ausdrücklich freigegebenen Deskriptor. Testpakete haben `approved: false`. Version, Mindest-Updater und unveränderte Datenkompatibilität müssen passen. Nur zugehörige Asset-URLs und HTTPS-Weiterleitungen zu erlaubten GitHub-Release-Hosts sind zugelassen. Keine Anmeldung erforderlich.

Vor Installation werden Herkunft, Archivgröße/SHA-256, vollständige Dateiliste, Einzelgrößen/-hashes, ZIP-Verzeichnis und CRC geprüft. Der vorhandene ZIP-Prüfer wird wiederverwendet. Zusätzliche Dateien, Datenpfade, Traversierung, Geräte-/ADS-Namen, doppelte/casegleiche Pfade, Symlinks, überlappende Einträge, fremde Anhänge und übergroße Inhalte sind unzulässig. Die tatsächliche EXE-Version, AnyCPU aller verwalteten Komponenten und die drei nativen Loader-Architekturen werden geprüft. Vorhandene GitHub-Asset-Digests werden abgeglichen.

SHA-256 ist keine Herausgebersignatur. Vertrauen beruht derzeit auf HTTPS, fester GitHub-Quelle und deren Veröffentlichungsrechten. Keine behauptete Codesignierung. Später signierte Dateien bleiben über vollständige Dateihashes abgedeckt; eine zusätzliche Herausgeberprüfung kann ergänzt werden.

## Austausch und Rückfall

Geprüfte neue Dateien, Journal und alte Ausgabe liegen außerhalb der Installation. Vor Übergabe verwendet die Oberfläche dieselbe Speicherabschlussprüfung wie normales Schließen. Ungültige Eingaben oder fehlgeschlagene Speicherung verhindern die Installation. Das native Dateitor lässt vorherige Schreibaufträge abschließen.

Erst nach „Jetzt aktualisieren“, vollständiger Vorbereitung und Speicherabschluss wird der externe AnyCPU-Helfer autorisiert. Er wartet auf die eindeutig identifizierte alte Prozessinstanz und erhält keine höheren Rechte. Ausschließlich `Notenblick.exe` und der komplette Ordner `Programm` werden ausgetauscht. Die EXE wird atomar ersetzt, die Verzeichnisschritte werden journalisiert. Bei Fehler oder Unterbrechung wird die alte vollständige Ausgabe wiederhergestellt. Der Bootstrap kann den Rückfall vor Laden von Programmdateien an einen eingebetteten Helfer außerhalb der Installation übergeben.

Vor dem normalen Neustart werden alle Dateien und der neue Starter mit `--verify-update` geprüft. Dieser Prüfstart öffnet weder Fenster noch Storage und legt Daten nicht an. Erst danach wird die Transaktion festgeschrieben und Notenblick normal geöffnet. Die letzte alte Ausgabe bleibt außerhalb von Daten erhalten. Ältere eindeutig zugeordnete abgeschlossene Bereiche können bereinigt werden; unsichere oder veränderte Bereiche bleiben erhalten.

Der Updater selbst erstellt, liest, löscht, verschiebt oder überschreibt keinen Datenordner. Der ausdrücklich verlangte normale Speicherabschluss bleibt Bestandteil der bisherigen Anwendung. Ungeeignete Pfade, fehlende Rechte oder belegte/verknüpfte Programmdateien führen zum sicheren Abbruch. Manuelles Aktualisieren bleibt möglich. Künftige Datenformatwechsel benötigen ein eigenes Sicherungs-/Migrationskonzept; dieses Protokoll übernimmt sie nicht automatisch.

## Automatisierte Prüfungen

Erweitert werden die vorhandenen Gruppen `loader`, `v1231` und `v1230-browser`. Native Tests führen produktiven Client, Deskriptor-/Archivprüfer und Transaktionscode aus. Kontrollierte Release-JSONs und Transportantworten simulieren Update/kein Update/ungeprüft/offline; öffentliche Releases bleiben unverändert. Zeit und Prozessidentität sind im Test injiziert, da diese Linux-Umgebung Windows-Prozessinformationen nicht bereitstellt.

Auf realem Linux-Dateisystem werden vollständiger Austausch, Journalgrenzen, abgelehnter neuer Prüfstart, gesperrtes Lesen, Retargeting, Abbruch und idempotente Wiederherstellung geprüft. Synthetische Daten einschließlich Zeitstempeln bleiben unverändert. Windows-Schreibrechte, Windows-Dateisperren und Stromausfälle werden über kontrollierte Fehlergrenzen simuliert; kein echter Windows-Austauschtest. Browserprüfungen verwenden echte Chromium-Tastaturereignisse, Accessibility-Baum, axe und fünf Fenster-/Zoomfälle. Die Brückenattrappe startet keinen echten Installer.

Vor Auslieferung folgt frisch `TZ=UTC python3 dev/manage.py release`: sämtliche bestehenden Gruppen, 180.000 Ergebnisse, exakte Berechnungen, native Speicherung/Sicherung/Wiederherstellung, Exporte, Office/Open XML, PDF/UA, gerenderte Druckseiten, zwei bytegleiche Builds und vollständige ZIP-/Entpackprüfung. Anschließend muss `status --report` Quelle, Werkzeuge, Ausgabe und Index bestätigen. Der Abschlusscommit dokumentiert den tatsächlich erfolgreichen Lauf, Quellbaum und Archivprüfsummen. Dieser Bericht erklärt keinen noch laufenden Test für bestanden.

## Praxisstand und Freigabe

Die Nutzerbestätigung vom **2. November 2026** gilt für 1.23.2: Windows-PC und Windows auf ARM in Parallels mit NVDA und Braille; tatsächlicher ARM64-Prozess und `Programm\Windows\arm64\WebView2Loader.dll` per PowerShell bestätigt. Das ist eine praktische Bestätigung in dieser Umgebung, keine vollständige Barrierefreiheitszertifizierung.

Für **1.24.0** fehlen echte Windows-x86/x64-/ARM64-, NVDA-/Braille- und Updater-Praxistests. Insbesondere Start/Taskleiste/Monitore/DPI, einmalige Fachansage aus anderen Bereichen, Dialoge, reale Downloadweiterleitungen, Rechte/Dateisperren, unterbrochener Austausch und Rückfall sind abzunehmen. Nicht bestätigte Microsoft-Office-, UIA- und physische Druck-Einzeltests bleiben offen. Linux-/Chromium-Ergebnisse sind keine solche Abnahme.

Zunächst ausschließlich Test-ZIPs und Quellen auf dem Entwicklungsbranch. Erst ausdrückliche Freigabe erlaubt Übernahme gemäß Branchschutz, Tag und stabiles Release mit freigegebenem Deskriptor. Danach veröffentlichte Downloads erneut prüfen und beide übernommenen Entwicklungsbranches löschen. Erster Wechsel von 1.23.2 auf 1.24.0 manuell.

Vorbereiteter Release-Text: **Notenblick 1.24.0 – Was ist neu?**

- Notenblick startet jetzt maximiert.
- Tastenkombinationen werden mit NVDA zuverlässiger angesagt.
- Neue Versionen lassen sich direkt im Programm finden und installieren.
- Die GitHub-Seite ist übersichtlicher und erklärt die Funktionen verständlicher.

Download: Windows-ZIP, passender Quellcode und Prüfsummen. Technische Ergebnisse separat hier verlinken. Nur notwendige Voraussetzungen und bekannte Einschränkungen im Release nennen.
