# Barrierefreiheit

Notenblick wird für blinde und sehende Lehrkräfte entwickelt. Tastatur, NVDA und Braille gehören zum Bedienkonzept.

## So ist die Bedienung aufgebaut

- **Hauptbereiche und Fächer:** Links und Kurzbefehle führen zum gewünschten Bereich. Direkte Kurzbefehle setzen den Fokus auf die vorhandene Überschrift; bei Fächern gehört der aktive Notenbereich zur Ansage.
- **Registerkarten:** Pfeiltasten, Pos1 und Ende wählen eine Registerkarte; Eingabe oder Leertaste aktiviert sie. Dabei bleibt der Fokus auf der Registerkarte. Direkte Strg-Ziffern führen zur Inhaltsüberschrift. Ein bewusst wiederholter Kurzbefehl bestätigt den Bereich kurz, auch wenn die Überschrift bereits fokussiert ist.
- **Dialoge und Hilfe:** Neue Arbeitsbereiche und Dialoge beginnen an einer Überschrift. Escape schließt geeignete Dialoge und führt zum Auslöser zurück. F1 erklärt den aktuellen Arbeitsschritt; Eingaben und vorheriger Fokus bleiben erhalten.
- **Noteneingabe:** Eingabe und Umschalt+Eingabe führen unmittelbar zur nächsten beziehungsweise vorherigen Eingabe. Fehler bleiben am betroffenen Feld nachvollziehbar.
- **Fenster:** 1.23.3 startet maximiert. Verkleinern, Verschieben und Wiederherstellen bleiben möglich; die Fokusregeln gelten auch im kleineren Fenster. Schließt sich dabei ein geöffnetes Menü, kehrt dessen Fokus zum Auslöser zurück.

## Bestätigte Praxistests

Sebastian Müller hat am **2. November 2026** die praktische Verwendung von **Notenblick 1.23.2** auf einem Windows-PC und unter Windows auf ARM in Parallels mit **NVDA und Braille** bestätigt. Beide Systeme funktionieren grundsätzlich. Unter Windows auf ARM wies PowerShell die Prozessarchitektur `ARM64` und den geladenen Loader `Programm\Windows\arm64\WebView2Loader.dll` nach. Native ARM64-Ausführung innerhalb dieser Umgebung ist damit praktisch bestätigt.

Dabei wurden teilweise fehlende Ansagen bei wiederholten Strg-/Alt-Ziffern sowie gelegentliche Verzögerungen in kleineren Fenstern beobachtet. Version **1.23.3** bearbeitet diese Punkte mit zentraler Wiederholungsansage, weniger Neuaufbau und gebündelten Größenprüfungen. Eine erneute echte Windows-/NVDA-/Braille-Abnahme dieser Änderungen steht aus.

## Automatisierte Prüfungen und Grenzen

Chromium-, Tastatur-, Fokus-, Layout-, Accessibility-Baum- und axe-Prüfungen ergänzen die Praxistests. Sie prüfen technische Zustände und Abläufe, nicht die tatsächlich gesprochene NVDA-Ausgabe oder die Darstellung auf einer Braillezeile.

Die Nutzerabnahme ist keine vollständige Barrierefreiheitszertifizierung. Nicht ausdrücklich bestätigte Einzelprüfungen – etwa mit Microsoft Office, physischem Druck oder allen Windows-Skalierungsstufen – bleiben offen. Aktueller Stand: [Prüfbericht 1.23.3](docs/PRUEFBERICHT-1.23.3.md). Weitere Schritte: [Windows-Prüfplan](docs/WINDOWS-PRUEFUNG.md).

Probleme bitte mit Version, Tastenschritten und erwartetem Verhalten als Issue melden. Keine echten Schülerdaten hochladen.
