# Updater-Oberfläche 1.24.0 – 3. November 2026

Ausgangspunkt `d8374f0947ab35e8c687f1ff103c34cfe550ea85`, bestehender Branch
`entwicklung/1.24.0`. Ausschließlich `src/app/updates.js` und die zugehörigen
Updater-Regeln in `src/styles/views.css` ändern das Programmverhalten.
Native TLS-, GitHub-, Diagnose-, Installations-, Rückfall- und Datenregeln
bleiben unverändert. Die funktionierende Windows-Prüfung wurde vom Nutzer
für die vorherige TLS-Korrektur bestätigt.

Einstellungen: kurze Erklärung und Startoption, dynamische Versionsnummer im
Ergebnis. Ergebnisse erhalten Innenabstand, Hintergrund und zustandsabhängige
Rahmen; der Zustand bleibt auch durch den Text erkennbar. Kein zusätzlicher
Live-Bereich. Die Prüftaste bleibt während einer laufenden Prüfung fokussierbar,
wird als beschäftigt/nicht verfügbar ausgezeichnet und löst durch erneutes
Aktivieren keine weitere Anfrage aus. Andere Eingaben behalten Fokus und Wert.

Startkarte: „Später aktualisieren“ blendet nur die konkrete Version in der
Sitzung aus; der dauerhafte Schalter nennt die Versionsnummer. Eine neuere
Version erscheint wieder. Nach explizitem Ausblenden folgt der Fokus erst
nach dem Verbergen auf „Weiterarbeiten“, ersatzweise auf einen vorhandenen
Arbeitsbereich. Zwischenzeitlich andernorts gesetzter Fokus wird nicht
zurückgeholt. Keine weitere Ansage zusätzlich zum Überschriftenfokus.

Zwischengespeicherte oder nach einem Prüffehler erhaltene Angebote heißen
„Zuletzt gefunden: Notenblick X.“ Die Startkarte kennzeichnet zusätzlich,
wenn die Verfügbarkeit nicht erneut geprüft werden konnte. Erst ein erfolgreicher
Check zeigt „Notenblick X ist verfügbar.“ Einstellungen und Aktualisierungsdialog
unterscheiden diese Zustände ebenfalls. Keine zusätzliche Hintergrundabfrage;
die unveränderte native Installation prüft das Angebot weiterhin erneut.

Gezielt geprüft: `tests/update.py --live-only` mit genau einer echten
HTTPS-Aktualisierungsprüfung und den jsdom-Updaterfällen; separat ausschließlich
`tests/update-browser.cjs` für die Updater-Oberfläche. Dynamische Texte,
aktuell/neu/Fehler, bekannte Angebote, erneute Prüfung, Sitzungs-/Versionsgrenzen,
Ausblenden, Fokus/Ersatzfokus, verzögerte Antwort, erhaltene Eingabe, keine
zusätzlichen Anfragen/Installation sowie bestehende Diagnose/Kopierfunktion.
Chromium prüft Tastatur, Fokus und Umbruch bis 320 px bei 200 % Skalierung.
Die Erwartungen der vorhandenen umfassenderen Testdateien wurden nur an den
geänderten Updater-Text und Fokus angepasst; diese Testreihen wurden nicht gestartet.

Ein Windows-Build und die grundlegenden Verpackungs-/Integritäts-/Entpackprüfungen.
Nur ein Windows-ZIP, ausschließlich EXE/Programm, kein Datenordner.
Keine Massen-, Export-, Office/PDF-, allgemeinen Browser- oder Release-Prüfungen.
Ausführung unter Linux/.NET 8/jsdom/Chromium; tatsächliche Windows-/NVDA-/Braille-
und ARM64-Abnahme der geänderten Oberfläche bleibt offen. Keine offizielle
Veröffentlichung; `main`, Tags und Releases bleiben unverändert.
