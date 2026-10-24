# Entwicklungs- und Sicherungsablauf

1. Das private Repository abrufen, Ziel und aktuellen Arbeitsstand prüfen. Nur im Notenblick-Ordner arbeiten.
2. `python3 dev/manage.py setup` ausführen. Der Befehl ist wiederholbar; eine vollständig zurückgesetzte Umgebung braucht erneute Downloads. Diese Einschränkung kann ein Quellcode-Repository nicht beseitigen.
3. Änderungen umsetzen; passende Tests aus der dauerhaften Sammlung ergänzen und ausführen.
4. Vor einer neuen Version `python3 dev/manage.py release` ausführen. Jeder fehlgeschlagene Test stoppt den Ablauf. ZIPs und Protokolle können aus früheren Versuchen vorhanden sein; ausschließlich die Prüfsummen und Dateien des aktuellen erfolgreichen Laufs verwenden.
5. Windows-/NVDA-Prüfung mit dem mitgelieferten Plan dokumentieren. Bei fehlender Windows-Prüfung nur als Build-Kandidat ausgeben.
6. Dokumentation, Programmversion und Änderungsübersicht aktualisieren. `git status`, `git diff --check` und die gesamte vorgesehene Dateiauswahl prüfen. Keine echten Daten übernehmen.
7. Quellcode und Prüfbericht committen, etwa mit einem fachlich passenden Committext. Für neue Programmversionen einen eindeutigen Tag `vX.Y.Z` setzen; bestehende Tags nicht überschreiben.
8. Direkt vor entfernten Schreibvorgängen `python3 dev/guard.py --remote` ausführen (authentifiziertes gh oder vorhandenes Token nötig). Vollständigen Namen, gespeicherte Repository-ID, private Sichtbarkeit und Actions `enabled: false` bestätigen. Bei Connector-Schreibvorgängen dieselben Einstellungen prüfen. Anschließend Branch/Tag ausschließlich im Zielrepository sichern. Keine Actions auslösen.
9. Portables ZIP und kurze verständliche Änderungen bereitstellen. GitHub dient dem Quellcode einschließlich Bibliotheken, Konfiguration und Versionsgeschichte; Build-ZIPs und Daten nicht in Git einchecken.

Die ausgeführten Tests erzeugen Linux-/Chromium-Berichte. Ihre historischen Ausgaben sind keine neue Prüfung. Der archivierte ursprüngliche Bericht zur Version 1.8.0 bleibt unter PRUEFBERICHT.md erhalten; die Einrichtung wird unter docs/EINRICHTUNGSBERICHT.md dokumentiert.
