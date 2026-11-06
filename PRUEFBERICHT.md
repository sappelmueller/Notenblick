# Prüfberichte

Aktuelle offizielle Version: **Notenblick 1.27.0**, veröffentlicht am **6. November 2026**. Sebastian Müller hat die unveränderte Testversion unter Windows x64 und ARM64 einschließlich NVDA, Braille und Aktualisierung praktisch getestet und ausdrücklich freigegeben. [Versionsbericht](docs/PRUEFBERICHT-1.27.0.md).

Der vorhandene technische Abschluss dokumentiert **95 von 95 erfolgreiche Pflichtgruppen**, 180.000 synthetische Noteneinträge, zwei bytegleiche Builds und die vollständige Paketprüfung. Zum gerenderten Audit gehören 155 Aufnahmen und 98 axe-Prüfungen. Die [kompakten Nachweise](docs/qa-1.27.0.json) bleiben unverändert als historischer Prüfstand vor der praktischen Freigabe erhalten; ihre damaligen Testversions- und Praxisstatusfelder beschreiben den Zeitpunkt des automatischen Abschlusses.

Zur Veröffentlichung wurden keine Programmtests und keine Programmbuilds wiederholt. Kontrolliert wurden Git-/Quellstand, Version, Archividentität, vollständige Dateiliste, Prüfsummen und Veröffentlichungsinformationen. Die bestätigte Praxisprüfung ersetzt keine gesonderte Messung aller UIA-, Microsoft-Office-, Druck- oder Update-Störfälle.

## Frühere Versionen

- [1.26.0](docs/PRUEFBERICHT-1.26.0.md): 93 Pflichtgruppen, zwei bytegleiche Builds und bestätigte Windows-Praxisfreigabe.

- [1.25.1](docs/PRUEFBERICHT-1.25.1.md): sechs gezielte Updater-/Dialoggruppen und ausdrückliche Windows-Praxisfreigabe vom 4. November 2026.
- [1.25.0](docs/PRUEFBERICHT-1.25.0.md): vollständiger Qualitätsaudit mit 89 Pflichtgruppen und 180.000 Rechenergebnissen; unveränderte Grundlage für 1.25.1. Windows x86 und ARM einschließlich tatsächlicher Aktualisierung durch den Herausgeber bestätigt.
- [1.24.0](docs/PRUEFBERICHT-1.24.0.md): ausdrücklich freigegebener reduzierter Abschlussumfang vom 3. November 2026; enthält die Zwischenentwicklung 1.23.3.
- [1.23.2](docs/PRUEFBERICHT-1.23.2.md): Windows, NVDA und Braille praktisch bestätigt, einschließlich nativer ARM64-Prozessarchitektur und ARM64-WebView2-Loader in Parallels.
- [Open-Source-Prüfung](docs/OPEN-SOURCE-PRUEFUNG.md).

Ältere Berichte unter `docs/archiv/`, `qa-*.json` und der Einrichtungsbericht bleiben historische Nachweise. Für neue Arbeit gelten [AGENTS.md](AGENTS.md) und der [Veröffentlichungsablauf](docs/VEROEFFENTLICHUNG.md). Vollständige lokale Logs und Einzelbelege werden nicht als Download veröffentlicht.
