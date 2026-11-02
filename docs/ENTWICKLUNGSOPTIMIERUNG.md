# Effizient entwickeln

Vorhandene passende Arbeitskopien und Werkzeuge wiederverwenden. Zuerst Git-Status, GitHub-Kopf und betroffene Dateien prüfen. Die [Projektübersicht](PROJEKTUEBERSICHT.md) genügt zum Einstieg; weitere Quellen gezielt vertiefen.

- Mit `plan --base <Ausgangsstand>` und `test changed --base <Ausgangsstand>` beginnen.
- Zusammenhängende Änderungen zentral umsetzen. Unbekannte Auswirkungen breit prüfen; keine Tests zur Beschönigung ausschließen.
- Vor dem Abschluss Integration oder unmittelbar den vollständigen Release-Lauf ausführen. Keinen identischen Volltest doppelt vorschalten.
- Fehler über benannte Logs untersuchen. `--retry reports/<Lauf>` nutzt nur inhaltlich bestätigte Ergebnisse; vollständige Releases bleiben frisch.
- Im Chat Status, Anzahl, Dauer und konkrete Fehler nennen. Große JSON-, Export- und Bildsammlungen nur bei einem konkreten Befund lesen.
- Geprüfte Zwischenstände auf dem Entwicklungsbranch sichern. Ein Zwischenstand ersetzt keine Freigabe.

Der größte vermeidbare Aufwand entsteht durch wiederholte Quelltextsichten, verlorene Arbeitsstände und unnötig wiederholte Gesamtläufe. Ein Lasttest mit vielen Datensätzen verbraucht vor allem lokale Rechenzeit; daraus lässt sich kein KI-Tokenverbrauch ableiten.

Historische Messungen vom 27. Oktober 2026 stehen im [Archiv](archiv/ENTWICKLUNGSOPTIMIERUNG-1.14.md). Ihre damaligen Testzahlen sind keine aktuelle Testübersicht. Verbindlich sind AGENTS.md und der aktuelle Katalog in `dev/testplan.py`.
