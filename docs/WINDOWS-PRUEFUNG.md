# Windows-Prüfung vor Freigabe

Ein Linux-Build ersetzt diese Prüfung nicht. Unter Windows 11 zunächst die ZIP-Prüfsumme mit der erzeugten Prüfsummendatei vergleichen. Die Anwendung in einen neuen Ordner ohne bestehende Schülerdaten entpacken. `dev/windows-qa.ps1 -Archive <ZIP-Pfad>` prüft Entpackung, Grundstruktur, .NET-Voraussetzung und vorhandene WebView2-Registrierung. `-Launch` startet ausschließlich diese frisch entpackte Kopie; die folgenden Punkte bleiben manuell zu bestätigen.

- EXE direkt nach dem Entpacken starten; Fehlermeldungen, fehlende Bibliotheken und .NET-Ladefehler prüfen. Reguläre Windows-Sicherheitswarnungen nicht umgehen oder abschalten.
- Ersteinrichtung mit erfundenem Schuljahr, Klasse, Fach und Schülern durchführen. Die portable Ausgabe darf keine Beispieldaten automatisch mitbringen.
- Note erfassen, schließen, erneut starten; Noten und letzte Ansicht müssen erhalten bleiben.
- Sicherung erzeugen, Note ändern, Sicherung wiederherstellen; Originalwerte prüfen.
- Anwendung schließen und vollständigen Ordner in einen Pfad mit Leerzeichen/Umlauten kopieren; erneut öffnen.
- Mit NVDA alle Hauptlinks, internen Tabs und Dialoge prüfen. Eingabe/Leertaste, Pfeiltasten, Pos1/Ende, Escape, kurze Ansagen und Fokusrückkehr kontrollieren.
- Notentabellen, mündliche Einzelnoten, Gewichtung einschließlich Kommaeingabe und manuelle Zeugnisnoten prüfen.
- Fenstergrößen und 100/150/200 Prozent Windows-Skalierung visuell prüfen; keine abgeschnittenen Bedienelemente.
- Nach Möglichkeit getrennt auf Windows x64 und Windows ARM64 prüfen. Vorhandene Loaderdateien allein belegen keine ausgeführte ARM64-Prüfung.

Prüfdatum, Windows-Version/Architektur, WebView2-Version, NVDA-Version und die Ergebnisse dokumentieren. Offene Punkte bleiben offen; keine automatische Umwandlung in eine Freigabe. Falls der Linux-Build künftig scheitert: dieselben mitgelieferten Python-Buildskripte mit dem gesperrten SDK auf einem vorhandenen Windows-Rechner verwenden. Keine kostenpflichtigen Dienste und keine GitHub Actions einschalten.
