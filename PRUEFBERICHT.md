# Prüfberichte

Entwicklung **1.25.0**: [vollständiger Qualitätsaudit und offene Praxisabnahme](docs/PRUEFBERICHT-1.25.0.md). Ausschließlich Testversion; keine Veröffentlichung und keine automatische Updatefreigabe.

Aktuelle offizielle Version: **Notenblick 1.24.0**. Sebastian Müller hat die Veröffentlichung am **3. November 2026** ausdrücklich mit reduziertem Prüfumfang freigegeben. Der [aktuelle Versionsbericht](docs/PRUEFBERICHT-1.24.0.md) nennt die tatsächlich neu ausgeführten Kontrollen, frühere Nachweise und die offenen Windows-Installations-/Wiederherstellungstests. Kein erneuter vollständiger Release-Testlauf. 1.23.3 ist vollständig in 1.24.0 enthalten und wird nicht separat veröffentlicht.

Für **1.23.2** bestätigte Sebastian Müller am 2. November 2026 die praktische Verwendung mit **Windows, NVDA und Braille** auf einem Windows-PC und unter Windows auf ARM in Parallels. PowerShell bestätigte Prozessarchitektur ARM64 und den geladenen ARM64-WebView2-Loader. Diese Nutzerabnahme ist von automatisierten Prüfungen und der erneuten Abnahme von 1.24.0 getrennt. Der [historische Versionsbericht](docs/PRUEFBERICHT-1.23.2.md) bleibt unverändert.

Die Open-Source-Prüfung steht in [docs/OPEN-SOURCE-PRUEFUNG.md](docs/OPEN-SOURCE-PRUEFUNG.md). Vollständige aktuelle Logs entstehen lokal unter `reports/`; der Quellen-, Werkzeug-, Ausgabe- und Indexnachweis wird mit `dev/manage.py status --report ...` geprüft.

Ältere Berichte unter `docs/archiv/`, `qa-*.json` und der Einrichtungsbericht sind historische Nachweise. Sie bleiben zur Rückverfolgbarkeit erhalten. Ihre damaligen Vorgaben zu privater Ablage und separaten Downloads beschreiben frühere Stände; für neue Arbeit gelten AGENTS.md und der aktuelle Veröffentlichungsablauf.
