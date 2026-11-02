# Barrierefreiheit

Notenblick wird für blinde und sehende Lehrkräfte entwickelt. Tastaturbedienung, NVDA und Braille haben hohe Priorität. Ein Nachweis vollständiger Barrierefreiheit liegt bisher nicht vor.

- Hauptbereiche sind über Links und Kurzbefehle erreichbar.
- Registerkarten lassen sich mit Pfeiltasten, Pos1 und Ende auswählen und mit Eingabe oder Leertaste aktivieren. Bei normaler Bedienung bleibt der Fokus auf der Registerkarte.
- Neue Arbeitsbereiche und Dialoge beginnen an einer Überschrift. Escape schließt geeignete Dialoge; der Fokus kehrt zum Auslöser zurück.
- Die schnelle Noteneingabe verwendet Eingabe und Umschalt+Eingabe. F1 öffnet die Hilfe zum aktuellen Arbeitsschritt.

Automatische Chromium-, Tastatur-, Fokus-, Layout- und axe-Prüfungen gehören zur Testsammlung. Sie bestätigen weder gesprochene NVDA-Ausgaben noch Braille oder Windows UI Automation. Diese Livetests einschließlich ARM64 stehen noch aus. Der [Windows-Prüfplan](docs/WINDOWS-PRUEFUNG.md) beschreibt sie; `dev/windows-qa.ps1` erfasst die tatsächliche Prozessarchitektur.

Probleme bitte mit Version, Tastenschritten und erwartetem Verhalten als Issue melden. Keine echten Schülerdaten hochladen.
