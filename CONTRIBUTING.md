# Mitmachen

Fehler bitte mit Programmversion, Windows-Version und nachvollziehbaren Schritten melden. Bei Bedienproblemen helfen Tastenkombination sowie NVDA- und WebView2-Version. Beispiele müssen vollständig erfunden sein.

## Entwickeln

Python ab 3.12, Git und Node.js gemäß `.node-version` bereitstellen. Dann im geklonten Repository:

```sh
python3 dev/manage.py setup
git switch -c work/meine-aenderung
python3 dev/manage.py plan --base main
python3 dev/manage.py test changed --base main
```

Die Einrichtung lädt gesperrte Werkzeuge lokal. Entwicklungsabhängigkeiten werden nicht mit dem Windows-Programm ausgeliefert. Für vollständige Exportprüfungen siehe [Exportprüfung](docs/EXPORT-PRUEFUNG.md).

Vor einem Pull Request die betroffenen Bereiche mit `test changed --stage integration --base main` prüfen. Kleine, zusammenhängende Änderungen einreichen. Problem, neues Verhalten und ausgeführte Tests kurz beschreiben; offene Livetests nennen. Notenberechnung, Speicherung und Tastaturbedienung müssen erhalten bleiben. Technische Regeln: [AGENTS.md](AGENTS.md).

Beiträge werden unter GPLv3 mit der in LICENSE-EXCEPTION beschriebenen Bibliotheksausnahme angenommen. Bitte nur eigene oder passend lizenzierte Inhalte beitragen und deren Herkunft angeben. Fremde Copyright-Vermerke erhalten. Für Git-Commits kann eine GitHub-noreply-Adresse verwendet werden.

Offizielle Releases gibt Sebastian Müller ausdrücklich frei. GitHub Actions bleiben deaktiviert; Prüfungen laufen lokal.
