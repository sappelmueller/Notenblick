# Versionen veröffentlichen

1. Auf einem Entwicklungsbranch arbeiten. Name und ID des Zielrepositorys sowie deaktivierte Actions prüfen. Die Sichtbarkeit darf privat oder öffentlich sein. Keine Daten oder Zugangsdaten einchecken.
2. Änderungen, Hilfe und Versionsangaben abschließen. Betroffene Tests ausführen. Alle vorgesehenen Dateien stagen, dann frisch `python3 dev/manage.py release`. Der Lauf prüft alle Testgruppen, große Datenbestände, Exporte, zwei bytegleiche Builds und vollständige ZIPs. Fehler stoppen die Freigabe.
3. `python3 dev/manage.py status --report reports/<Lauf>/summary.json` auswerten. Nur passende aktuelle Dateien und Prüfsummen verwenden. Windows-/ARM64-/NVDA-/Braille- und Office-Livetests gesondert dokumentieren.
4. Geprüfte Quellen committen und eine **Testversion** auf dem Entwicklungsbranch bereitstellen. Sie ist keine offizielle Freigabe.
5. **Sebastian Müller gibt die konkrete Version ausdrücklich frei.** Danach den geprüften Branch nach `main` übernehmen. Vor entfernten Änderungen Name, feste ID, Sichtbarkeit und deaktivierte Actions erneut live prüfen. Bei CLI-Anmeldung `dev/guard.py --remote`; bei GitHub-Anbindung dieselben Werte über Anbindung und Einstellungen bestätigen.
6. Einen eindeutigen Tag `vX.Y.Z` am freigegebenen Commit setzen. Offizielles GitHub-Release mit kurzen Änderungen, Windows-ZIP, vollständigem passenden Quellcode und SHA-256-Prüfsummen erstellen. Fehlende Livetests nennen; bei ausstehender Windows-Abnahme die Testversion als Prerelease belassen. Vorhandene Tags und Downloads im normalen Ablauf nicht ersetzen.
7. Downloads erneut abrufen und Hashes, Tag, Quellbaum, Dateivollständigkeit und Lizenztexte abgleichen. Den tatsächlichen GitHub-Stand prüfen. Erst danach vollständig übernommene Entwicklungsbranches löschen.

Bei reiner Infrastrukturpflege ohne neue Programmausgabe `release --check-only` verwenden. Sobald sich Lizenzdateien der Windows-Ausgabe ändern, ein vollständiges neues Paket mit passender Integritätsliste erzeugen. Keine zusätzlichen Dateien ungeprüft in den streng geprüften Programmordner legen.

## main schützen

Für `main` ist ein aktiver Branch-Regelsatz vorgesehen: Änderungen über Pull Requests, keine Löschung, keine erzwungenen Pushes. Keine nicht vorhandenen Actions-Statusprüfungen verlangen. Bei einem einzelnen Maintainer keine unerfüllbare Fremdfreigabe erzwingen. Die ausdrückliche Release-Freigabe bleibt separat erforderlich.

Der Regelsatz „main schützen“ ist mit Status Active für den Standardbranch gespeichert. GitHub setzt ihn im aktuellen kostenlosen Privat-Repository noch nicht durch. Bei öffentlicher Sichtbarkeit kann er ohne kostenpflichtige Umstellung greifen. Nach dem Wechsel die wirksame Regel kontrollieren. Lokale Hooks schützen bereits vorher gegen falsche Ziele und private Dateien; sie ersetzen keinen serverseitigen Branchschutz.

GitHub Actions bleiben aus. Ein automatischer Updater ist noch nicht enthalten. Ein späterer Updater darf ausschließlich freigegebene Releases verwenden und nur EXE sowie vollständigen Programmordner ersetzen. Daten bleiben erhalten.
