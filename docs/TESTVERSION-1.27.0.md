# Praxisprüfung 1.27.0 – abgeschlossen

**Am 6. November 2026 bestätigt:** Sebastian Müller hat die unveränderte Ausgabe unter Windows x64 und ARM64 einschließlich NVDA, Braille und Aktualisierung praktisch getestet und ausdrücklich freigegeben. Dieser Plan bleibt zur Nachvollziehbarkeit erhalten. [Freigabe und Prüfstand](PRUEFBERICHT-1.27.0.md).

Verwendeter Prüfplan:

ZIP vollständig in einen eigenen Testordner entpacken und `Notenblick.exe` starten. Der vollständige Ordner `Programm` muss daneben liegen. Die Ausgabe enthält die vorhandenen x86-, x64- und ARM64-Bibliotheken. `Daten` wird beim ersten Start angelegt.

Für einen vorhandenen Testbestand Notenblick schließen und Daten zusätzlich sichern. Beim manuellen Aktualisieren ausschließlich `Notenblick.exe` und den vollständigen Ordner `Programm` ersetzen. Den vorhandenen Ordner `Daten` behalten.

1. Notengewichtung öffnen und einen Bereich mit Leistungen in einen anderen Bereich übertragen. Der Fokus soll im Anteil des Zielbereichs stehen. Abbrechen muss die bisherigen Noten unverändert lassen.
2. Einen Bereich vorübergehend wie einen anderen benennen. Die Meldung soll am tatsächlichen Namensfeld korrigierbar sein. F1 und Escape sollen zur unveränderten Eingabe zurückkehren.
3. Eine neue Einzelnote ohne Note speichern. Der Fokus soll zum Notenfeld gehen. Anschließend eine Note eingeben und wie gewohnt weiterarbeiten.
4. Unter Sicherung → Wiederherstellen → Früheren Stand auswählen nach einer Bereichsänderung den Eintrag „vor Änderung der Leistungsbereiche“ prüfen. Eine Auswahl allein darf nichts wiederherstellen.
5. Startseite, Exportbereich, Gewichtung und Notenübersicht mit NVDA/Braille, kleinen Fenstern und der eigenen Windows-Skalierung verwenden. Start unter x64 beziehungsweise ARM64 prüfen.

Berechnung, gespeicherte Abschlussnoten und automatische TXT-Listen verwenden weiterhin die bestehenden Verfahren. Die praktische Prüfung und ausdrückliche Freigabe sind abgeschlossen. Der öffentliche Updater bietet die offizielle Ausgabe 1.27.0 an; beim Update bleibt Daten unangetastet.
