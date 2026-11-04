# Technischer Einstieg

Entwicklung 1.25.1 auf `entwicklung/1.25.1` (Testversion; offizielle Basis 1.25.0): Windows, .NET Framework 4.8, WinForms und WebView2. Ziel ausschließlich `sappelmueller/Notenblick`, ID `1432518047`; privat oder öffentlich. Actions aus. Eigene Quellen: GPLv3 mit der Bibliotheksausnahme in LICENSE-EXCEPTION. Vor Änderungen [AGENTS.md](../AGENTS.md) beachten.

## Aufbau

| Ordner | Aufgabe |
| --- | --- |
| `src/domain` | Exakte Bruchrechnung, Noten, Punkte, Gewichtung und Abschlussnoten |
| `src/app`, `views`, `dialogs` | Gemeinsamer Kontext, Ansichten, Dialoge, Kurzbefehle und Fokus |
| `src/exports` | Ein Berichtsmodell für TXT, CSV, Word, Excel, PDF und Druck |
| `native` | AnyCPU-Starter, kontrollierter Bibliothekslader, Windows-Fenster und atomare Speicherung |
| `tests` | Gemeinsame Regressionen; ausschließlich synthetische Daten |
| `dev` | Einrichtung, gesperrte Werkzeuge, Build, Prüfsteuerung und Verpackung |
| `docs` | Arbeitsabläufe, Prüfgrenzen und datierte historische Nachweise |

## Unverzichtbare Verträge

- `arithmetic.js` und `evaluation.js` rechnen zentral und exakt. Fehlende Noten sind nie null. `finals.js` hält festgelegte Abschlussnoten unabhängig von späteren Durchschnitten.
- `Storage.cs`, `Migration.cs`, `storage.js` und `session.js` sichern kompatible Daten, atomare Speicherung, Konfliktschutz und Wiederherstellung. `text-lists.js` erzeugt Notfalllisten; deren Hash-/Bereinigungsschutz erhalten.
- `components.js`, `tabs.js`, `dialogs/window.js` und `shortcuts.js` teilen Fokus- und Tastaturregeln. F1 verwendet neun Hilfethemen, 77 Abschnitte und 49 Basiskontexte.
- `exports/report.js` und `collection.js` liefern gemeinsame Werte. Renderer berechnen keine eigenen Notendurchschnitte. Native ZIP-/Dateiprüfungen niemals umgehen.
- Der Starter prüft alle vorgesehenen Programmdateien. IL-only AnyCPU und x86-/x64-/ARM64-Loader erhalten. Native ARM64-Ausführung benötigt Windows 11 24H2+, .NET Framework 4.8.1 und ARM64-WebView2. Native ARM64-Ausführung sowie Windows/NVDA/Braille wurden für 1.23.2 durch den Nutzer bestätigt. Für 1.25.0 sind Windows auf x86 und ARM sowie Aktualisierungsprüfung und Updater-Bedienung praktisch bestätigt; vollständige Updateinstallation und Rückfall sind davon getrennt.
- Portable Ablage: EXE / Programm / Daten. Updates ersetzen nur EXE und vollständigen Programmordner.

## Arbeitsablauf

Passende Arbeitskopie und Werkzeuge wiederverwenden. GitHub-Kopf und lokalen Kopf/Baum vergleichen. `plan --base <Ausgangsstand>`, dann `test changed --base <Ausgangsstand>`. `dev/testplan.py` ist die einzige Testzuordnung; unbekannte Auswirkungen werden breit geprüft.

Vor Programmveröffentlichungen `release`; mit `release --retry reports/<Lauf>` nach Fehlern/Unterbrechungen fortsetzen. Der vollständige Katalog einschließlich Lasttests, Exportvalidatoren, Doppelbuild und ZIP-/Entpackprüfungen bleibt erforderlich; gültige unveränderte Einzelbelege werden übernommen. Für reine Änderungen an der Testverwaltung kleine kontrollierte Infrastrukturtests verwenden. `release --check-only` bedeutet vollständige Release-Anforderungen mit temporärer Verpackung, keine verkürzte Infrastrukturprüfung. Quellen und Dokumente vorher abschließen und stagen; danach `status --report reports/<Lauf>/summary.json` prüfen. Ein unmittelbar folgender Release-Lauf ersetzt eine doppelte Integrationsprüfung.

`dev/evidence.py` prüft Inhalte, Dateimodi, Werkzeuge und Ausgaben. Wiederverwendung in allen Profilen nur mit gültigem Nachweis. Erfolge werden sofort atomar samt unveränderlichen Ausgabekopien gesichert. Ein neuer Gesamtbericht bindet alle Belege an den endgültigen Quellstand. Logs bleiben unter `reports/`; im Chat nur Status, Anzahl, Dauer und konkrete Fehler.

Weitere Einzelheiten: [Entwicklung](../ENTWICKLUNG.md), [effiziente Prüfungen](ENTWICKLUNGSOPTIMIERUNG.md), [Exportprüfung](EXPORT-PRUEFUNG.md), [GitHub-Anbindung](GITHUB-ANBINDUNG.md), [Veröffentlichung](VEROEFFENTLICHUNG.md), [Prüfberichte](../PRUEFBERICHT.md).

`package.json` enthält absichtlich `private: true`: Das verhindert eine versehentliche npm-Veröffentlichung und hat keinen Einfluss auf die GitHub-Sichtbarkeit. Historische Nachweise liegen in `docs/archiv/`.

1.23.3: `focusTarget(..., {announceIfFocused:true})` ergänzt nur bei direkten Kurzbefehlen eine verzögerte Bestätigung ohne Refokus. Der bestehende Announcer verwirft überholte Meldungen. Aktive Tabs und dasselbe Fach bleiben bei passender Öffnungsregel montiert; `queueScrollSync` bündelt Größenprüfungen ohne gleiche tabindex-Werte neu zu schreiben. `WindowState.Maximized` steht vor `Shown`; kein späteres Größenumschalten. Regressionen in den vorhandenen Gruppen v1231, v1230-browser und loader.

1.24.0: `app/updates.js` verwendet die vorhandenen Dialog-, Fokus- und Meldungskomponenten. `UpdateClient.cs` prüft freiwillig ausschließlich die feste GitHub-Quelle, speichert Updateoptionen außerhalb von Daten und prüft Download/Dateiliste. `UpdateTransaction.cs` hält Austausch und Rückfall auf EXE/Programm begrenzt; der eingebettete AnyCPU-Helfer startet außerhalb der Installation. Der Bootstrap kann einen abgebrochenen Austausch vor dem Laden von Programmdateien wiederherstellen. Technische Grenzen und Ablauf: [Prüfbericht 1.24.0](PRUEFBERICHT-1.24.0.md).

Historischer Veröffentlichungsstand 1.24.0: ausdrücklich freigegebener reduzierter Prüfumfang, kein neuer vollständiger Release-Lauf. Damals wurde die Windows-Aktualisierungsprüfung bestätigt; weitere Praxisprüfungen waren noch offen. [Nachweis](PRUEFBERICHT-1.24.0.md). Die datierten UPDATER-Berichte beschreiben historische Entwicklungsschritte.

1.25.0: Gemeinsame Gestaltungsvariablen, fließende Auswahl-/Schülerlayouts und im Fenster begrenzte Aktionsmenüs. Die Sicherungsaufbewahrung verbindet eigene Metadaten mit Inhaltsprüfsummen; automatische Bereinigung übernimmt keine fremden Dateien. Die kurze aktuelle Auditbeschreibung steht in [PRUEFBERICHT-1.25.0.md](PRUEFBERICHT-1.25.0.md).

Veröffentlichung 1.25.0: vollständiger Audit und ausdrückliche Praxisfreigabe. Programmquellen und Windows-ZIP bleiben gegenüber `f7d7909e96c0da99d70beab150a2644dcff5664e` unverändert. Nur Dokumentation und externe Veröffentlichungsmetadaten werden abgeschlossen; kein erneuter Test-/Buildlauf. Aktueller Nachweis: [Prüfbericht 1.25.0](PRUEFBERICHT-1.25.0.md).

1.25.1: Nur Startprüfung und zentralen Bestätigungsdialog optimiert. `UpdateClient.Check` begrenzt automatische Anfragen pro Prozess statt nach einer gespeicherten Uhrzeit; parallele Prüfungen teilen dieselbe Task. `modal` blendet den oberen Schließen-Schalter nur mit ausdrücklicher Option aus. Installations-/Rückfallcode bleibt unverändert. [Gezielte Nachweise](PRUEFBERICHT-1.25.1.md).
