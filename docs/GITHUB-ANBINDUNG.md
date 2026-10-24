# Arbeit über die verbundene GitHub-Anbindung

Ziel ausschließlich `sappelmueller/Notenblick`, private Repository-ID `1432518047`. `main` ist der aktuelle Stand; `baseline-1.8.0` bewahrt den vollständigen ursprünglichen Quellstand. Neue Versionen werden als Folgecommits auf main gesichert; vor dem Aktualisieren muss der vollständige entfernte Quellbaum mit dem lokal geprüften Baum übereinstimmen.

Die Git-CLI dieser Ausführungsumgebung hat keine eigenen GitHub-Anmeldedaten. Die bereits verbundene GitHub-Anbindung kann Quellcode lesen und schreiben; die Browser-Anmeldung wird für Repository-Verwaltung und gegebenenfalls den vollständigen Abruf benötigt. Es werden keine zusätzlichen Schlüssel erzeugt oder Passwörter im Projekt gespeichert.

## Eine neue Sitzung beginnen

1. Zuerst das vorhandene Notenblick-Arbeitsverzeichnis prüfen. Bei vorhandenem aktuellem Checkout keine Archive erneut suchen oder entpacken.
2. Fehlt der Checkout: das festgelegte private Repository über die GitHub-Anbindung auflösen und seine ID/Privatsphäre prüfen. Falls eine authentifizierte Git-CLI verfügbar ist, normal klonen.
3. Die derzeitige Anbindung liefert binäre DLLs nicht zuverlässig als Download. In diesem Fall direkt im bestätigten Repository unter Code → Download ZIP den aktuellen Stand abrufen. Dieser konkrete Abruf wurde mit sämtlichen 145 Dateien des Einrichtungsstands byteweise gegen das Repository geprüft. Keine Suche nach früheren Notenblick-ZIPs und kein Zugriff auf TrainScope.
4. In ein neues isoliertes Arbeitsverzeichnis entpacken. Falls die Git-Metadaten fehlen, Git lokal initialisieren; als einzige entfernte Quelle die kanonische Notenblick-URL setzen. Den über die Anbindung bestätigten Commit und Quellbaum als Grundlage verwenden. Einen separat erzeugten lokalen Import-Commit nicht ungeprüft auf die entfernte Hauptversion pushen.
5. `python3 dev/manage.py setup` und die benötigte Testgruppe ausführen. Versionssperren, Bibliotheken und sämtliche Tests sind bereits im Quellstand enthalten.

## Änderungen sichern

Unmittelbar davor Repository-Name, ID und private Sichtbarkeit über die Anbindung prüfen. Die Einstellung Disable actions anhand der gespeicherten GitHub-Einstellungen bestätigen. Ein vorhandenes authentifiziertes `gh` bzw. Token ermöglicht alternativ die vollständige API-Prüfung mit `python3 dev/guard.py --remote`. Fehlende CLI-Authentifizierung ist keine Erlaubnis, die Prüfung abzuschalten.

Mit den GitHub-Werkzeugen neue Blob-/Baum-/Commit-Objekte ausschließlich im festgelegten Repository erstellen. Für neue Bibliotheken `create_blob` mit Base64 verwenden; Textdateien können über `create_tree` übertragen werden. Bereits vorhandene unveränderte Blobs erneut verwenden. Die gesamte erzeugte Baum-SHA muss vor dem Aktualisieren von `main` mit der lokal geprüften Baum-SHA übereinstimmen. Einen normalen Folgecommit auf den zuvor gelesenen entfernten Commit setzen und `update_ref` mit `expected_sha` und `force: false` ausführen. Bei gleichzeitig veränderter Hauptversion neu lesen und zusammenführen.

`dev/github-export.py` stellt die übertragbaren Daten reproduzierbar bereit:

```text
python3 dev/github-export.py plan HEAD
python3 dev/github-export.py texts HEAD 0 15
python3 dev/github-export.py blob BLOB_SHA OFFSET LAENGE
```

`plan` liefert Dateinamen, Modi, Git-SHAs und Quellbaum. `texts` liefert einen Ausschnitt der Textdateien einschließlich exakter Inhalte. `blob` liefert einen Bytebereich als Base64; für das Zusammensetzen eine durch drei teilbare Länge verwenden, beispielsweise 491520 Bytes. Große Ausgaben innerhalb der Werkzeuglaufzeit verarbeiten und nicht im Chat ausgeben. Vor dem Sichern alle Dateien auf echte personenbezogene Daten prüfen. Die tatsächlich vorgemerkten Commit-Inhalte werden zusätzlich vom Commit-Hook geprüft.

GitHub Actions bleiben deaktiviert. Es gibt keine Workflows, Runner oder automatischen GitHub-Testläufe. `actions/runs` wurde nach dem ersten vollständigen Quellcodeimport mit `total_count: 0` bestätigt.
