# Technischer Einstieg

Notenblick 1.24.0: Windows, .NET Framework 4.8, WinForms und WebView2. Ziel ausschließlich `sappelmueller/Notenblick`, ID `1432518047`; privat oder öffentlich. Actions aus. Eigene Quellen: GPLv3 mit der Bibliotheksausnahme in LICENSE-EXCEPTION. Vor Änderungen [AGENTS.md](../AGENTS.md) beachten.

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
- Der Starter prüft alle vorgesehenen Programmdateien. IL-only AnyCPU und x86-/x64-/ARM64-Loader erhalten. Native ARM64-Ausführung benötigt Windows 11 24H2+, .NET Framework 4.8.1 und ARM64-WebView2. Native ARM64-Ausführung sowie Windows/NVDA/Braille wurden für 1.23.2 durch den Nutzer bestätigt; geänderte Abläufe und den Updater von 1.24.0 erneut abnehmen.
- Portable Ablage: EXE / Programm / Daten. Updates ersetzen nur EXE und vollständigen Programmordner.

## Arbeitsablauf

Passende Arbeitskopie und Werkzeuge wiederverwenden. GitHub-Kopf und lokalen Kopf/Baum vergleichen. `plan --base <Ausgangsstand>`, dann `test changed --base <Ausgangsstand>`. `dev/testplan.py` ist die einzige Testzuordnung; unbekannte Auswirkungen werden breit geprüft.

Vor Programmveröffentlichungen frisch `release`, für reine Infrastrukturpflege `release --check-only`. Beide führen alle bestehenden Tests, Lasttests, Exportvalidatoren, zwei saubere bytegleiche Builds und ZIP-/Entpackprüfungen aus. Quellen und Dokumente vorher abschließen und stagen; danach `status --report reports/<Lauf>/summary.json` prüfen. Ein unmittelbar folgender Release-Lauf ersetzt eine doppelte Integrationsprüfung.

`dev/evidence.py` prüft Inhalte, Dateimodi, Werkzeuge und Ausgaben. Wiederverwendung nur mit gültigem Nachweis; vollständige Releases verwenden keine früheren Testerfolge. Logs bleiben unter `reports/`; im Chat nur Status, Anzahl, Dauer und konkrete Fehler.

Weitere Einzelheiten: [Entwicklung](../ENTWICKLUNG.md), [effiziente Prüfungen](ENTWICKLUNGSOPTIMIERUNG.md), [Exportprüfung](EXPORT-PRUEFUNG.md), [GitHub-Anbindung](GITHUB-ANBINDUNG.md), [Veröffentlichung](VEROEFFENTLICHUNG.md), [Prüfberichte](../PRUEFBERICHT.md).

`package.json` enthält absichtlich `private: true`: Das verhindert eine versehentliche npm-Veröffentlichung und hat keinen Einfluss auf die GitHub-Sichtbarkeit. Historische Nachweise liegen in `docs/archiv/`.

1.23.3: `focusTarget(..., {announceIfFocused:true})` ergänzt nur bei direkten Kurzbefehlen eine verzögerte Bestätigung ohne Refokus. Der bestehende Announcer verwirft überholte Meldungen. Aktive Tabs und dasselbe Fach bleiben bei passender Öffnungsregel montiert; `queueScrollSync` bündelt Größenprüfungen ohne gleiche tabindex-Werte neu zu schreiben. `WindowState.Maximized` steht vor `Shown`; kein späteres Größenumschalten. Regressionen in den vorhandenen Gruppen v1231, v1230-browser und loader.

1.24.0: `app/updates.js` verwendet die vorhandenen Dialog-, Fokus- und Meldungskomponenten. `UpdateClient.cs` prüft freiwillig ausschließlich die feste GitHub-Quelle, speichert Updateoptionen außerhalb von Daten und prüft Download/Dateiliste. `UpdateTransaction.cs` hält Austausch und Rückfall auf EXE/Programm begrenzt; der eingebettete AnyCPU-Helfer startet außerhalb der Installation. Der Bootstrap kann einen abgebrochenen Austausch vor dem Laden von Programmdateien wiederherstellen. Technische Grenzen und Ablauf: [Prüfbericht 1.24.0](PRUEFBERICHT-1.24.0.md).

Veröffentlichung 1.24.0: ausdrücklich freigegebener reduzierter Prüfumfang, kein neuer vollständiger Release-Lauf. Die Windows-Aktualisierungsprüfung wurde bestätigt; vollständige automatische Installation/Rückfall und umfassende erneute NVDA-/Braille-/ARM64-Abnahme bleiben offen. [Nachweis](PRUEFBERICHT-1.24.0.md). Die datierten UPDATER-Berichte beschreiben historische Entwicklungsschritte.
