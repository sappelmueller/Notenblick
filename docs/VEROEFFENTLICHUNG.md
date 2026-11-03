# Versionen veröffentlichen

1. Ausschließlich `sappelmueller/Notenblick`, ID `1432518047`, auf einem Entwicklungsbranch bearbeiten. Das Repository ist öffentlich. Name, ID, Sichtbarkeit und deaktivierte Actions vor entfernten Änderungen live prüfen. Keine Daten oder Zugangsdaten einchecken.
2. Änderungen, Versionsnummer und Hilfe abschließen. `package.json` enthält `releaseNotes`: drei bis fünf ausdrücklich gepflegte Aussagen zur jeweiligen Version. Aus Sicht einer Lehrkraft, kurz und freundlich; keine Dateinamen, Commits, Prüfsummen oder Teststatistiken. Keine automatisch erzeugten GitHub-Änderungslisten verwenden.
3. Gezielte Prüfungen durchführen, Quellen und Dokumente vollständig stagen, dann frisch `TZ=UTC python3 dev/manage.py release`. Alle Gruppen, 180.000 Ergebnisse, Office/PDF/UA/Druck, zwei bytegleiche Builds und vollständige ZIP-/Entpackprüfung müssen bestehen. Fehler stoppen die Freigabe.
4. `TZ=UTC python3 dev/manage.py status --report reports/<Lauf>/summary.json` auswerten. Quellen, Werkzeuge, Ausgabe und Index müssen passen. Windows-/ARM64-/NVDA-/Braille- und Office-Livetests getrennt dokumentieren.
5. Geprüfte Quellen im Entwicklungsbranch sichern und Windows-ZIP, passenden Quellcode und Prüfsummen als **Testversion** bereitstellen. Ihr Aktualisierungsdeskriptor enthält `approved: false`; sie darf durch den Updater nicht angeboten werden.
6. **Sebastian Müller gibt die konkrete Version ausdrücklich frei.** Erst danach gemäß Branchschutz nach `main` übernehmen. Der aktive Regelsatz „main schützen“ (26349914) verlangt einen Pull Request, verbietet Löschen und Force-Pushes und hat keinen Bypass für den aktuellen Benutzer. Vor dem tatsächlichen Merge erneut prüfen. Keine zusätzlichen PRs während der Testphase erzeugen.
7. Nur nach ausdrücklicher Freigabe auf dem geprüften Stand `TZ=UTC python3 dev/package.py --approve-update reports/<Lauf>/summary.json` ausführen. Der Befehl verlangt den gültigen Release-Nachweis, erzeugt dieselben vollständigen Archive und setzt den separaten Deskriptor auf `approved: true`. Archive, Deskriptor, Quellbaum und Prüfsummen erneut abgleichen. Bei geänderten Quellen neu prüfen.
8. Eindeutigen Tag `vX.Y.Z` am freigegebenen Commit und ein stabiles offizielles GitHub Release erstellen. Beifügen: `Notenblick_X.Y.Z.zip`, `Notenblick_X.Y.Z_Quellcode.zip`, `Notenblick_X.Y.Z_Pruefsummen.json` und `Notenblick_X.Y.Z_Aktualisierung.json`. Ein neuer Commit in `main`, ein Entwurf oder ein Prerelease ist keine Aktualisierung. Bei fehlender Windows-Abnahme ausschließlich Testversion/Prerelease und `approved: false` verwenden.
9. Veröffentlichte Downloads erneut abrufen. Hashes, vollständige Dateiliste, Version, Tag/Quellbaum und Lizenzen abgleichen. Tatsächlichen GitHub-Stand kontrollieren. Bestehende Tags und Downloads nicht ersetzen.
10. Erst danach vollständig übernommene Entwicklungsbranches löschen. Für 1.24.0 betrifft dies `codex/1.23.3-bedienung-github` und `entwicklung/1.24.0`. 1.23.3 wird nicht separat veröffentlicht. Die drei historischen PR-Referenzen bleiben beim Support; keine weitere Historienbereinigung.

## Texte

Release-Titel: **Notenblick X.Y.Z**. Unter **Was ist neu?** ausschließlich die gepflegten kurzen Aussagen verwenden. Unter **Download** Windows-ZIP, Quellcode und Prüfsummen verlinken. Unter **Hinweise** nur notwendige Voraussetzungen und bekannte Einschränkungen nennen. Technische Prüfergebnisse separat verlinken. Auf `main` nennt die README immer die freigegebene Version und bietet direkt nach der Vorstellung „Aktuelle Version herunterladen“ mit `/releases/latest` an.

## Quelle und Grenzen

Der Updater prüft feste Repository-ID und HTTPS-Quelle, stabile höhere Versionsnummer, Freigabe, Datenkompatibilität, gepflegte Neuerungen, Archivgröße/SHA-256 und sämtliche Dateigrößen/-hashes. Die bestehende ZIP-Prüfung kontrolliert zusätzlich Verzeichnis, CRC, Pfade, doppelte Namen, Verknüpfungen und Vollständigkeit. AnyCPU sowie x86-/x64-/ARM64-Loader bleiben gemeinsam in der Ausgabe. Vorhandene GitHub-Asset-Digests werden ebenfalls abgeglichen.

Prüfsummen sind keine digitale Herausgebersignatur. Vertrauen beruht auf HTTPS, fester Repository-ID und kontrollierten Veröffentlichungsrechten. Codesignierung kann später ergänzt werden; signierte Dateien werden bereits über vollständige Bytes erfasst. Änderungen am Datenformat benötigen ein eigenes abgesichertes Konzept. `dataSchema` ungleich 1 beziehungsweise ein höherer `minimumUpdater` wird von 1.24.0 nicht automatisch installiert.

Der externe Helfer läuft mit vorhandenen Benutzerrechten außerhalb der Installation. Er tauscht nur EXE und vollständiges Programm aus, bewahrt die alte Ausgabe und prüft vor Neustart ohne Öffnen von Daten. Das Journal erlaubt Wiederherstellung vor dem normalen Start. Ungeeignete, verknüpfte, schreibgeschützte oder belegte Installationen werden sicher abgewiesen. Ein manuelles Update bleibt möglich. Updateoptionen liegen getrennt von Daten; keine Zugangsdaten oder Nutzungsstatistiken senden.

GitHub Actions bleiben deaktiviert. Kein technischer Prüflauf ersetzt die ausdrückliche Freigabe.
