# Notenblick: technischer Einstieg

Programmversion 1.17.0, Windows/.NET Framework 4.8/WinForms/WebView2, vollständig offline. Nur privates `sappelmueller/Notenblick` (ID 1432518047); Actions aus. Echte Schülerdaten, Sicherungen, Schlüssel und generierte Dateien niemals einchecken. Vor Schreiben `python3 dev/guard.py`.

## Aufbau und kritische Verträge

- `src/domain/arithmetic.js`: exakte rationale Rechnung. `evaluation.js` nutzt dieselben individuellen/gruppierten/direkten Gewichte; fehlende Noten sind keine Null.
- `domain/finals.js`: `classFinalAverages` mittelt ausschließlich passende manuelle Festlegungen aktiver Fachschüler; `app/context.js` verwendet dieselben Ergebnisse für Übersicht und Exporte. Fehlende Werte und inkompatible Altwerte bleiben aus dem Nenner, bestehende Einzelrechnungen unverändert. `sortedYears` sortiert nur Kopien nach dem tatsächlichen Beginn.
- `domain/finals.js`: Datumsabgrenzung und exakte Viertel-/Ganznotenvorschläge. Festgelegte Noten sind unabhängige Schnappschüsse, niemals aus späteren Durchschnitten überschreiben.
- `domain/records.js`, `migrations.js`, `transfers.js`: Validierung, kompatible Altbestände, Klassenwechsel/Archive. Historische Abschnittsnoten sind keine neuen Halbjahresnoten.
- `src/storage.js`, `session.js`, `app/changes.js`, `native/Storage.cs`/`Migration.cs`: vorhandene atomare Speicherung, Konfliktschutz, Sicherungen, TXT-Listen und Entwurfstransaktionen. Portable Ablage: EXE / Programm / Daten; beim Update Daten behalten.
- `dialogs/finals.js`: gemeinsame Abschlussdialoge, numerische Viertelnoten, Status ohne Live-Ansage. Native Enter-Bedienung unverändert; ausdrückliches Strg+Enter wechselt zum nächsten sichtbaren Schüler. `dialogs/window.js` setzt optional direkt den gewünschten Anfangsfokus. Name und vorhandener Durchschnitt stehen gemeinsam im Auswahllabel. Regressionen `v1150`/`v1150-browser`/`v1160-browser`, numerische Exporte zusätzlich in `v1140-files`.
- `domain/text-lists.js`: gemeinsame zentrale Berechnung für automatische TXT-Übersichten/Leistungslisten/Schülernoten; Verzeichnisversion 17. `storage.js` prüft tatsächliche Inhalte, SHA-256 und read-back; aktualisiert vor Bereinigung, löscht nur belegte unveränderte eigene Altdateien. TXT-Reparatur schreibt kein Noten-JSON.
- `app/startup.js`, `dialogs/setup.js`: Ersteinrichtung nur bei nachweislich fehlendem Datenbestand; fünf Schritte als flüchtiger Entwurf. `commitDraft` veröffentlicht nach atomarer JSON-Annahme. Optionale vorhandene workspace-Struktur mit setupCommitId sichert initiale Einstellungen bei unterbrochener Ansichtsspeicherung; keine neue Datenbank/Migration. `v1160`/`v1160-storage`/`v1160-browser` prüfen Wiederholung und beschädigte Altbestände.
- `dialogs/window.js`: `confirmInDialog` hält die ursprünglichen Eingabeknoten, Ereignisse, Dialogzustände und Fokus während der Bestätigung fest; `events.js` routet geschütztes Escape vor nativer Dialogschließung. `dialogs/setup.js` bestätigt Verwerfen/ausgefüllte Klassen, bearbeitet Schüler inline und veröffentlicht weiterhin nur über `commitDraft`. Neue Regressionen `v1170`, `v1170-storage`, `v1170-browser`, `v1170-files` im gemeinsamen Katalog.
- `src/state.js`, `app/`, `views/`, `dialogs/`, `tabs.js`/`events.js`: gemeinsame Oberflächen-/Fokuskonzepte. Hauptnavigation als Links, echte manuell aktivierte Tabs, kurze Labels, echte Tabellen, Escape und Rückkehrfokus. Keine unnötigen Regionen oder section-Elemente.
- `src/exports/report.js`: gemeinsames unveränderliches Berichtsmodell. `text.js`, `office.js`, `pdf.js`, `dialog.js`: TXT/CSV, DOCX/XLSX, PDF/UA und Druck/Sammelexporte. Keine parallele Exportberechnung.
- `native/Launcher.cs`, `ProgramLibraries.cs`, `Window.cs`: AnyCPU-Starter, vollständige Hashliste, WebView2 und native Datei-/Druckkanäle. Abhängigkeiten unter `dev` gesperrt. Keine Internetressourcen in der Anwendung.

## Ablauf mit wenig KI-Kontext

1. Git-Status/Kopf und GitHub-Kopf/Baum vergleichen. Passende vorhandene Arbeitskopie weiterverwenden; nur bei Bedarf abrufen/einrichten. Diese Übersicht genügt zum Einstieg, weitere Dokumente gezielt lesen.
2. Betroffene Dateien und direkte Abhängigkeiten ansehen. Bei unbekannter Architektur erweitern; unveränderten Code nicht pauschal neu lesen.
3. `python3 dev/manage.py plan --base HEAD`, dann `test changed --base HEAD`. Gegen einen anderen ursprünglichen Commit ausdrücklich `--base <Commit>` verwenden; Index, Arbeitskopie, neue/gelöschte Dateien werden erfasst.
4. Nach zusammenhängenden Änderungen `test changed --stage integration --base <Ausgangsstand>`. Ein unmittelbar folgender vollständiger Release-Lauf deckt diese Integration mit ab; keine doppelte Vollprüfung vorschalten. Fehler: `failure.json` und benanntes Log gezielt lesen; `--retry reports/<Lauf>` nutzt den ursprünglichen Plan plus neue Auswirkungen. `--no-reuse` erzwingt gezielte Wiederholung.
5. Vor Programmveröffentlichung **vollständig frisch** `release`. Für reine Entwicklungspflege `release --check-only`: identische Prüfungen, zwei saubere Builds, temporäres vollständiges ZIP und Entpacktest; keine neue Programmversion/Downloaddatei.
6. Letzte Quell-/Dokumentationsänderung vor diesem Lauf erledigen und die vorgesehene Dateiauswahl vollständig stagen. `status --report reports/<Lauf>/summary.json` prüft aktuelle Freigabe anhand Quelle, Werkzeuge und Programmausgabe. Danach privat sichern, Ziel und deaktivierte Actions erneut bestätigen. Längere Arbeiten durch private Zwischenstände gegen Verlust der temporären Umgebung schützen.

## Auswahl und Nachweise

`dev/testplan.py` ist die einzige Zuordnung. Entwicklung: Rechenreferenzen bei Domänenänderungen, vollständiger Speicherbereich bei Speicherung, UI/Tastatur/Fokus/axe bei Oberfläche, acht repräsentative Exportfälle bei Export. Integration erweitert auf Wechselwirkungen und sämtliche passenden Exportvalidatoren. Gemeinsame/unklare Infrastruktur und native Brücken konservativ vollständig. `quick/storage/browser/stress/full` bleiben explizit verfügbar, kein bisheriger Test entfällt.

`dev/evidence.py` prüft Inhalte, Dateimodi, relevante Werkzeuge/Abhängigkeiten, Umgebung und erzeugte Dateien. Nur gezielte Entwicklungsprüfungen dürfen Erfolgsergebnisse wiederverwenden; unabhängige Exportvalidatoren, Infrastruktur, Last- und Loaderprüfungen werden nicht aus Erfolgsnachweisen übersprungen. Release verwendet keine Testwiederverwendung und erzwingt zwei frische Programmkompilierungen. Unveränderte Compilerprodukte und der gesperrte Office-Prüfer dürfen außerhalb dieser Reproduzierbarkeitsgrenze bytegeprüft wiederverwendet werden.

Vollständige Logs unter `reports/<Lauf>`, kompakte `summary.json`/`failure.json`; keine großen JSON-/PDF-/Screenshot-Sammlungen im Chat lesen. Bei visuellen Änderungen repräsentative Ansichten und konkret auffällige Seiten untersuchen, automatische vollständige Inhalts-/Schema-/Bounding-Box-Prüfungen weiterlaufen lassen. Keine unbelegten Token-Prozente nennen.

Werkzeuge/Caches sind temporär und müssen nach einem Umgebungsreset ggf. erneut eingerichtet werden. GitHub bewahrt Quellcode, Tests, Sperren und Anleitungen. Linux-/Chromium-/axe-/LibreOffice-/PDF/UA-Erfolge sind keine tatsächlichen Windows-, UIA-, NVDA- oder Microsoft-Office-Livetests.
