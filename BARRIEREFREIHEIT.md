# Barrierefreiheit

Notenblick wird für blinde und sehende Lehrkräfte entwickelt. Tastaturbedienung, NVDA und Braille haben hohe Priorität. Ein Nachweis vollständiger Barrierefreiheit liegt bisher nicht vor.

- Hauptbereiche sind über Links und Kurzbefehle erreichbar.
- Registerkarten lassen sich mit Pfeiltasten, Pos1 und Ende auswählen und mit Eingabe oder Leertaste aktivieren. Bei normaler Bedienung bleibt der Fokus auf der Registerkarte.
- Neue Arbeitsbereiche und Dialoge beginnen an einer Überschrift. Escape schließt geeignete Dialoge; der Fokus kehrt zum Auslöser zurück.
- Die schnelle Noteneingabe verwendet Eingabe und Umschalt+Eingabe. F1 öffnet die Hilfe zum aktuellen Arbeitsschritt.

Automatische Chromium-, Tastatur-, Fokus-, Layout- und axe-Prüfungen gehören zur Testsammlung. Sebastian Müller hat am 2. November 2026 erfolgreiche Windows- und NVDA-Tests zurückgemeldet. Das ist eine persönliche Abnahme, kein automatisch erhobener oder unabhängiger Nachweis vollständiger Barrierefreiheit. Braille und die tatsächliche native ARM64-Prozessarchitektur wurden nicht gesondert bestätigt. Der [Windows-Prüfplan](docs/WINDOWS-PRUEFUNG.md) beschreibt die Einzelprüfungen; `dev/windows-qa.ps1` erfasst die tatsächliche Prozessarchitektur.

Probleme bitte mit Version, Tastenschritten und erwartetem Verhalten als Issue melden. Keine echten Schülerdaten hochladen.
