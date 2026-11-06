# Historischer Praxisprüfplan 1.26.0

Dieser Plan dokumentiert die Testphase vor der Freigabe. **1.26.0 ist seit dem 6. November 2026 offiziell veröffentlicht.** Sebastian Müller hat die unveränderte Ausgabe unter Windows praktisch getestet und freigegeben. Die folgenden Testanweisungen und damaligen offenen Punkte bleiben als historische Dokumentation erhalten; sie sind kein Auftrag zu erneuten Tests. Aktuell: [Freigabe](PRUEFBERICHT-1.26.0.md) und [Download und Verwendung](../README.md).

## Damalige Hinweise zum Starten und Aktualisieren

ZIP vollständig entpacken und Notenblick.exe starten. Der vollständige Ordner Programm muss daneben liegen. Daten wird beim ersten Start angelegt. Dieselbe Ausgabe enthält die vorhandenen x86-, x64- und ARM64-Bibliotheken.

Zum Testen neben der bisherigen Ausgabe einen eigenen Ordner verwenden. Für einen vorhandenen Testbestand: Notenblick schließen, Daten zusätzlich sichern und nur Notenblick.exe sowie den vollständigen Ordner Programm ersetzen. Daten behalten. Die Testversion wird vom öffentlichen Updater noch nicht angeboten. Nach späterer Freigabe ist das direkte Update von 1.25.1 auf 1.26.0 vorbereitet; es benötigt keine Zwischenversion.

Wenn du zur bisherigen Version zurückkehren möchtest, verwende dafür einen getrennten Ordner mit einer passenden Sicherung.

## Letzter Feinschliff vom 6. November

- „Gleichmäßig verteilen“ und Umrechnungen erzeugen höchstens zwei Nachkommastellen, beispielsweise 83,33 % und 16,67 %. Die gespeicherten Werte entsprechen der Anzeige und ergeben genau 100 %.
- Die Umrechnung erfolgt sofort. Wenn sich Schülerdurchschnitte ändern, erscheint vor dem Speichern „Neue Gewichtung prüfen“. „Unterschiede anzeigen“ klappt die Tabelle auf und wieder zu; „Alle Schüler anzeigen“ erweitert sie. Mit „Änderungen übernehmen“ und „Speichern“ bestätigst du.
- F1 im Assistenten erklärt den aktuellen Schritt. Beim Bearbeiten der Gewichtung öffnet F1 die Berechnungshilfe und kehrt mit Escape zur unveränderten Eingabe zurück.
- Die Notenübersicht besitzt die Tabellenüberschrift „Durchschnitte und Zeugnisnoten“.

## Weitere Verbesserungen dieser Testfassung vom 6. November

- Unter „Notengewichtung“ stehen die schriftliche Note und die Gesamtnote getrennt untereinander. Beide Verteilungen ergeben jeweils 100 %. Mit F1 findest du die Erklärung und Beispiele.
- „Nach oben“ und „Nach unten“ stehen im Abschnitt „Bereich bearbeiten“. Vor einer neuen Zuordnung muss der Bereich 0 % haben.
- Im mündlichen Bereich zwischen „Gemeinsame Bewertungen“ und „Einzelnoten“ wechseln. „Ansicht anpassen“ steuert weiterhin die Darstellung.
- In allen Leistungsbereichen stehen „Leistung hinzufügen“, „Einzelnote eintragen“ und „Exportieren“ in derselben Reihenfolge.
- Die vollständig neue Hilfe mit Schrittlisten und Tabellen auch aus offenen Dialogen mit F1 öffnen und mit Escape zur Eingabe zurückkehren.

## Damaliger praktischer Prüfplan

1. Einrichten, ein Fach öffnen und den Standard Klassenarbeiten 50 %, Tests 10 %, Mündlich 40 % prüfen.
2. Unter Notengewichtung Kopfrechnen hinzufügen. Der neue Bereich beginnt mit 0 %. Noten eintragen und den Bereichsdurchschnitt mit dem unveränderten Gesamtschnitt vergleichen.
3. Namen ändern, Bereiche verschieben, verteilen und wieder eigene Anteile eingeben. Den Vergleich vor geänderten Durchschnitten prüfen. Mit Abbrechen darf nichts übernommen werden.
4. Schriftliche Note zusammenfassen wählen; Anteile innen und außen prüfen, auch mit fehlenden Noten. Festgelegte Halbjahres- und Zeugnisnoten müssen erhalten bleiben.
5. Mündlich umbenennen; Einzelnoten und Klassenrunden anlegen und in einen anderen Bereich übertragen. Sie müssen weiter bearbeitbar bleiben. Eine Einzelnote mit Punkten und manueller Note in einem eigenen Bereich erfassen.
6. Vorlage aus einem anderen Fach übernehmen. Bei abweichenden belegten Bereichen die Zuordnung prüfen. Die Quelle muss unverändert bleiben.
7. Beide Notenlayouts sowie Tab/Pfeile/Pos1/Ende, Kurzbefehle, Escape und F1 mit NVDA und Braille prüfen. Nach Dialogen muss der Fokus sinnvoll zurückkehren. Auch schmale Fenster und Windows-Skalierung ausprobieren.
8. Speichern, neu starten, sichern und wiederherstellen. PDF/Word mit fünf und mehr Bereichen sowie Excel, CSV, TXT und Gesamtexport kontrollieren. Eine manuell geänderte TXT-Datei muss erhalten bleiben.

Automatische Linux-/Chromium-/LibreOffice-Prüfungen ersetzen keine reale Windows-, NVDA-, Braille-, ARM64- oder Microsoft-Office-Abnahme. Diese Praxisprüfungen sowie die vollständige Updateinstallation unter Windows bleiben ausdrücklich offen.
