# Open-Source-Prüfung vom 2. November 2026

## Gesicherter Ausgangsstand

Repository `sappelmueller/Notenblick`, ID `1432518047`, privat. Ausgangscommit `cf77c7c2237c646ab7d42f09af4149910057e030`. Vor Änderungen wurden alle 70 Commits, sechs Branches, acht Tags, 401 Baumobjekte und 1.285 Dateiobjekte mit ihren ursprünglichen Git-SHAs wiederhergestellt und mit `git fsck --full` geprüft. Ein vollständiges Bundle wurde in einen frischen Checkout zurückgespielt und als private Sicherung außerhalb des Repositorys abgelegt.

Alle neun Release-Einträge samt Entwurf und Metadaten wurden erfasst. Nur 1.23.2 hatte angehängte Dateien. Windows-ZIP, Quellcode-ZIP und Prüfsummendatei wurden heruntergeladen; alle drei SHA-256-Werte stimmen mit GitHub und dem ursprünglichen Prüfsummenbericht überein.

## Sicherheitsprüfung

Alle erreichbaren historischen Dateiobjekte, Dateipfade, Commit-Metadaten und vorhandenen Release-Archive wurden untersucht. Schlüssel-/Tokenmuster, private Datenpfade, mögliche Passwortzuweisungen, E-Mail-Adressen und persönliche Pfade wurden geprüft. Gefundene Inhaltsmuster waren eingebettete Bibliotheksdaten, erforderliche Urheberhinweise oder synthetische Tests. Keine echten Zugangsdaten oder Schülerbestände wurden festgestellt. Die Testdaten sind als erfundene Beispiele angelegt.

**Offener Datenschutzpunkt:** Alle 70 ursprünglichen Commits enthalten eine persönliche Autoren-/Committer-E-Mail-Adresse. Sie würde bei öffentlicher Sichtbarkeit abrufbar. Deshalb besteht keine uneingeschränkte Veröffentlichungsfreigabe. Die Adresse wird hier nicht wiederholt. Eine bloße Änderung der GitHub-E-Mail-Einstellung anonymisiert alte Commits nicht. Vor Freigabe ist entweder die bewusste Zustimmung zu ihrer Sichtbarkeit oder eine vollständige, gesicherte Bereinigung aller betroffenen Referenzen einschließlich möglicher GitHub-Restkopien erforderlich. Historie wurde nicht nur teilweise umgeschrieben.

`python3 dev/audit.py --archives <Windows-ZIP> <Quellcode-ZIP>` wiederholt die erreichbare Historien-/Archivprüfung mit redigierten Befunden. Rückgabewert 2 verhindert bei persönlichen Autorenadressen oder Inhaltsfunden eine pauschale Veröffentlichungsfreigabe. Musterprüfungen sind eine zusätzliche Schutzschicht, keine Garantie gegen beliebig versteckte Daten.

Die Schutzskripte akzeptieren weiterhin nur den festen Repository-Namen und die feste ID. Sie prüfen private Dateien, vorgemerkte Inhalte, wirksame Remote-URLs, Zugangsdatenmuster und deaktivierte Actions. Private und öffentliche Sichtbarkeit sind ausdrücklich zugelassen; widersprüchliche oder unbekannte Angaben werden abgewiesen.

## Abhängigkeiten und Lizenz

19 übernommene NuGet-Dateien wurden bytegleich mit den offiziellen Paketen verglichen. PDFKit 0.20.2 entspricht exakt dem offiziellen npm-Standalone-Bundle. Die beiden DejaVu-Dateien stimmen mit der vorhandenen Systemreferenz überein. Die 43 gesperrten npm-Pakete besitzen Lizenzangaben; `npm audit` meldete bei dieser Prüfung keine bekannten Lücken. Die NuGet-Hinweise werden zusätzlich im Abschlussnachweis ausgewertet. Solche Datenbankabfragen bestätigen nur die zum Prüfzeitpunkt bekannten Meldungen.

Eigene Quellen: **GPLv3 mit standardisierter Bibliotheksausnahme gemäß §7** (`GPL-3.0-only WITH GPL-3.0-linking-exception`). Die Ausnahme nennt WebView2 SDK, Newtonsoft.Json und das unveränderte PDFKit-Bundle ausdrücklich; die eigenen Quellen bleiben unter GPLv3. Sie vermeidet unklare Quellpflichten für vorgefertigte Drittkomponenten. Vollständiger GPL-Text, Ausnahme, Copyright und Drittanbieterübersicht gehören in Quellcode und Windows-Paket. Die fehlende MIT-Lizenz der .NET-Referenzassemblies wurde anhand ihres offiziellen Lizenzverweises ergänzt. Bestehende Lizenztexte und Bibliotheken bleiben erhalten.

### Nachkontrolle der Python-Prüfwerkzeuge

Nach Aktivierung der GitHub-Abhängigkeitsprüfung wurden 49 offene Hinweise zu `pypdf==6.10.0` sichtbar. Die erste npm-/NuGet-Prüfung deckte diese Python-Abhängigkeit nicht ab. Alle 49 betreffen `dev/export-qa-requirements.txt`; GitHub nennt 6.21.4 als gemeinsame korrigierte Version. Die Datei legt jetzt genau `pypdf==6.21.4` fest. Das Paket ist ein unabhängiger PDF-Leser für Entwicklertests und gehört nicht zum Windows-Download. Die Hinweise werden durch die Aktualisierung behoben, nicht als unbeachtlich geschlossen.

Die Wartung folgt dem vollständigen Ablauf `release --check-only`. Der vorherige Release-Prüfnachweis bleibt dem unveränderten Tag `v1.23.2-oss.1` zugeordnet. Er bescheinigt keinen Scan der damaligen Python-Abhängigkeiten. Neue Prüfwerte werden im zugehörigen Wartungs-Pull-Request dokumentiert; weder alte Tags noch Download-Dateien werden ersetzt. Die Datenschutz- und Livetestgrenzen bleiben bestehen.

## Organisation und Veröffentlichungen

Die fünf zusätzlichen Ausgangsbranches sind vollständig in `main` enthalten. Ihre Spitzen und historischen Stände bleiben in Historie und privater Sicherung erhalten. Alte Versions-Tags und historische Release-Nachweise werden bewahrt. 31 ältere Dokumente liegen gebündelt unter `docs/archiv/`; aktive Anleitungen verweisen auf den aktuellen Ablauf.

Der ursprüngliche Tag `v1.23.2` und seine unveränderten Downloads bleiben als historischer Build-Kandidat erhalten. Die vollständig lizenzierte Paketfassung wird unter dem ergänzenden Tag **v1.23.2-oss.1** derselben Programmversion bereitgestellt. Sie erhält einen passenden Quellcode-Download und neue Prüfsummen. So werden frühere Hashes und Tags nicht still ersetzt.

Programmquellen unter `src/` und `native/` bleiben unverändert. Zusätzliche Lizenzdateien werden vor der Erzeugung der Integritätsliste eingebunden; dadurch ändern sich Paket und Starter, aber keine Notenberechnung, Oberfläche oder Speicherung. Neue Dateien nicht nachträglich in den streng geprüften Programmordner kopieren.

GitHub Actions sind nachweislich deaktiviert; keine Workflows oder kostenpflichtigen Dienste wurden eingerichtet. Der Regelsatz „main schützen“ (ID 26349914) ist für den Standardbranch mit Status Active gespeichert: Pull Request, keine Löschung, keine Force-Pushes, gelöste Gespräche und null notwendige Fremdfreigaben. GitHub meldet, dass die Regel im kostenlosen privaten Repository noch nicht durchgesetzt wird. Nach öffentlicher Freischaltung die wirksame Durchsetzung kontrollieren.

## Abschlussnachweis und Prüfgrenzen

Die Infrastrukturregressionen einschließlich Sichtbarkeitswechsel, falscher ID, fremdem Repository, aktivierten Actions, weiteren Tokenformaten und gelöschten historischen Geheimnissen wurden ausgeführt. Ein frischer vollständiger Lauf von `python3 dev/manage.py release` ist für die lizenzierte Ausgabe erforderlich. Der maschinenlesbare Abschlussnachweis wird außerhalb des Quellbaums erzeugt und dem Release beigelegt; er nennt tatsächlich ausgeführte Schritte, Laufzeit, Quellbaum und Prüfsummen. `status --report reports/<Lauf>/summary.json` prüft die Übereinstimmung mit den getesteten Inhalten.

Reale Windows-x86-/x64-/ARM64-Starts, WebView2/UIA, gesprochene NVDA-Ausgaben, Braille, Microsoft Office und physischer Druck wurden hier nicht live geprüft. Das Release bleibt deshalb eine Vorabversion. Linux-/Chromium-, Datei-, Export- und reproduzierbare Buildprüfungen sind keine solche Liveabnahme.
