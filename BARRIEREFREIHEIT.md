# Barrierefreiheit

Notenblick wird für blinde und sehende Lehrkräfte entwickelt. Tastatur, NVDA und Braille gehören zum Bedienkonzept.

## So ist die Bedienung aufgebaut

- **Hauptbereiche und Fächer:** Links und Kurzbefehle führen zum gewünschten Bereich. Direkte Kurzbefehle setzen den Fokus auf die vorhandene Überschrift; bei Fächern gehört der aktive Notenbereich zur Ansage.
- **Registerkarten:** Pfeiltasten, Pos1 und Ende wählen eine Registerkarte; Eingabe oder Leertaste aktiviert sie. Dabei bleibt der Fokus auf der Registerkarte. Direkte Strg-Ziffern führen zur Inhaltsüberschrift. Ein bewusst wiederholter Kurzbefehl bestätigt den Bereich kurz, auch wenn die Überschrift bereits fokussiert ist.
- **Dialoge und Hilfe:** Neue Arbeitsbereiche und Dialoge beginnen an einer Überschrift. Escape schließt geeignete Dialoge und führt zum Auslöser zurück. F1 erklärt den aktuellen Arbeitsschritt; Eingaben und vorheriger Fokus bleiben erhalten.
- **Noteneingabe:** Eingabe und Umschalt+Eingabe führen unmittelbar zur nächsten beziehungsweise vorherigen Eingabe. Fehler bleiben am betroffenen Feld nachvollziehbar.
- **Fenster:** Notenblick startet maximiert. Verkleinern, Verschieben und Wiederherstellen bleiben möglich; die Fokusregeln gelten auch im kleineren Fenster. Schließt sich dabei ein geöffnetes Menü, kehrt dessen Fokus zum Auslöser zurück.

## Aktualisierungen

Unter Einstellungen → Allgemein gibt es einen eigenen Abschnitt mit installierter Version, Prüfung und freiwilliger Startprüfung. Eine neue Version erscheint zusätzlich als Hinweiskarte auf Start, ohne den Fokus zu versetzen. „Später“ gilt für die Sitzung; das Kontrollfeld blendet genau diese Version aus.

„Was ist neu?“ beginnt an der Dialogüberschrift. Escape und „Schließen“ führen zum Auslöser zurück. Nach „Jetzt aktualisieren“ zeigt der gemeinsame Fortschrittsdialog die Schritte an. Abbrechen bleibt bis zur sicheren Übergabe möglich; danach wird Notenblick neu gestartet. Die separate Austauschkomponente verwendet Windows-Standardbedienelemente. Ihre tatsächlichen NVDA-/Braille-Ansagen müssen unter Windows geprüft werden.

## Bestätigte Praxistests

Am **4. November 2026** hat Sebastian Müller **1.25.0** unter Windows auf **x86 und ARM** sowie die Aktualisierungsprüfung und Updater-Bedienung als erfolgreich bestätigt und zur Veröffentlichung freigegeben. Einzelne Ansagen und technische Messungen werden nur dann als gesondert geprüft geführt, wenn sie ausdrücklich dokumentiert sind. Der vollständige Download-/Installations-/Rückfallablauf des Updaters ist durch diese Bestätigung nicht nachgewiesen.

Historischer Ausgangsstand:

Sebastian Müller hat am **2. November 2026** die praktische Verwendung von **Notenblick 1.23.2** auf einem Windows-PC und unter Windows auf ARM in Parallels mit **NVDA und Braille** bestätigt. Beide Systeme funktionieren grundsätzlich. Unter Windows auf ARM wies PowerShell die Prozessarchitektur `ARM64` und den geladenen Loader `Programm\Windows\arm64\WebView2Loader.dll` nach. Native ARM64-Ausführung innerhalb dieser Umgebung ist damit praktisch bestätigt.

Dabei wurden teilweise fehlende Ansagen bei wiederholten Strg-/Alt-Ziffern sowie gelegentliche Verzögerungen in kleineren Fenstern beobachtet. Version **1.24.0** übernimmt die zentrale Wiederholungsansage, weniger Neuaufbau und gebündelte Größenprüfungen aus 1.23.3. Beim Fachwechsel aus einem anderen Hauptbereich wird der zugängliche Überschriftenname bereits vor dem Einblenden fertiggestellt; es folgt genau eine beabsichtigte Fokusquelle. Diese Entwicklung ist im inzwischen praktisch freigegebenen Stand 1.25.0 enthalten.

## Automatisierte Prüfungen und Grenzen

Chromium-, Tastatur-, Fokus-, Layout-, Accessibility-Baum- und axe-Prüfungen ergänzen die Praxistests. Sie prüfen technische Zustände und Abläufe, nicht die tatsächlich gesprochene NVDA-Ausgabe oder die Darstellung auf einer Braillezeile.

Die Nutzerabnahme ist keine vollständige Barrierefreiheitszertifizierung. Nicht ausdrücklich bestätigte Einzelprüfungen – etwa mit Microsoft Office, physischem Druck oder allen Windows-Skalierungsstufen – bleiben offen. Aktueller Stand: [Prüfbericht 1.25.0](docs/PRUEFBERICHT-1.25.0.md). Weitere Schritte: [Windows-Prüfplan](docs/WINDOWS-PRUEFUNG.md).

Probleme bitte mit Version, Tastenschritten und erwartetem Verhalten als Issue melden. Keine echten Schülerdaten hochladen.

Version 1.25.0 hat zusätzlich den vollständigen automatisierten Qualitätsaudit bestanden. Die vorhandenen Nachweise werden für das unveränderte Release übernommen; ein erneuter Browser- oder Hilfetechniktest wird dadurch nicht behauptet.
