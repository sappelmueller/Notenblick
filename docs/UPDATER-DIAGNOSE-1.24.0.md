# Updater-Diagnose 1.24.0 – 3. November 2026

Ausgangspunkt: `5e40868da235d884034039f176503eda1bed8ea5`, bestehender Branch
`entwicklung/1.24.0`. Ausschließlich Aktualisierungsprüfung, Fehlerdiagnose und
deren Oberfläche geändert. Keine offizielle Freigabe.

Die genaue Windows-Ursache ist weiterhin unbekannt. Die vorherige
TLS-Änderung hat den gemeldeten Fehler offenbar nicht beseitigt. Hier wird
keine weitere vermutete Ursache als behoben ausgegeben.

## Ergänzungen

- Fehler erhalten ihren Arbeitsschritt: Initialisierung, Repository-/Release-
  Abfrage, JSON-Auswertung, Versionsvergleich, Freigabeprüfung oder lokale
  Speicherung. Die bisher verdeckte Ursache ungültiger Freigabedateien bleibt
  jetzt ebenfalls in der Ausnahmekette erhalten.
- Diagnose mit Version, UTC-Prüfzeitpunkt, Fehlerkategorie, Ausnahmetypen,
  HResult, vollständiger Ursachenkette, Methoden ohne Dateipfade,
  HTTP-Status, relevanter GitHub-Fehlermeldung und .NET-/TLS-Vorgaben.
  TLS-Vorgaben werden ausdrücklich nicht als ausgehandeltes Protokoll ausgegeben.
- HTTP-Fehlerantworten sind auf 16 KiB und zwei Sekunden begrenzt. Es werden
  nur relevante JSON-Fehlerfelder übernommen, keine Kopfzeilen oder HTML-Inhalte.
- Persönliche Pfade, Konten, Geräte-/Hostnamen, Netzwerkadressen, E-Mail-Adressen,
  URL-Parameter und erkennbare Zugangsdaten werden entfernt. Keine Notendaten,
  Sicherungen, Exception.Data, Dateiinhalte, Cookies oder Proxyadressen erfasst.
- „Fehlerdetails kopieren“ erscheint nur nach einem Fehler. Der native
  Windows-Host kopiert den eigenen Diagnosebericht auf dem STA-Oberflächenthread
  in die Zwischenablage; er nimmt dafür keinen Text vom Browser entgegen.
  Rückmeldung: „Fehlerdetails kopiert.“ Bei Kopierfehler öffnet der bestehende
  Dialog ein beschriftetes, schreibgeschütztes und markierbares Textfeld.
  Escape schließt; der Fokus kehrt zum Schalter zurück.
- Diagnose ausschließlich im Arbeitsspeicher bis zur nächsten Prüfung bzw.
  zum Schließen des Programms. Keine Datei und kein automatischer Versand.
  Die drei normalen Rückmeldungen bleiben unverändert.

## Nur gezielt geprüft

`python3 tests/update.py --diagnostics --live` prüft ausschließlich die
geänderten Diagnose-/Abfragefunktionen und die Kopieroberfläche: 56 native
Prüfungen plus jsdom, erfolgreich in 5,83 Sekunden. Synthetische
DNS-, Proxy-, TLS-, Zertifikats-, JSON-, Versions-, Initialisierungs- und
Speicherfehler; tatsächliche HTTP-Fehlerantworten 403/407/429/500 eines lokalen
Testservers; Anonymisierung, verschachtelte Ursachen und Abbruchtyp.
Bestehende Quellenbeschränkungen und Datenordnerschutz bleiben aktiv.
Die echte öffentliche GitHub-Abfrage ergibt für 1.24.0 erfolgreich „aktuell“.

jsdom prüft zusätzlich alle drei Rückmeldungen, den Fehlerzustand des Schalters,
exakten Kopiertext, Rückmeldung, Kopierfehler, Textauswahl und Fokus sowie das
Löschen veralteter Diagnosen. Die echte JavaScript-Brücke übergibt Diagnosen
ausschließlich für `update-check`; andere Befehle erhalten keine neue Nutzlast.

`tests/update-browser.cjs` prüft ausschließlich die neue Oberfläche mit Chromium:
Enter/Tab, vollständige Textauswahl, Escape und Fokusrückkehr bei 1280 px,
640 px mit 200 % Skalierung und 320 px. Keine weiteren Browserfälle.

Windows-Build gegen die bestehenden .NET-Framework-4.8-Referenzen. Einzelnes
Windows-ZIP mit vorhandenen Verpackungsprüfungen, vollständigen Integritäts-
vorgaben, CRC und bytegleicher Entpackprüfung; ausschließlich EXE/Programm,
kein Datenordner. Keine zusätzlichen Diagnosebibliotheken.

## Offen

Tests liefen unter Linux/.NET 8, jsdom und Chromium mit kontrollierter
Zwischenablage. Kein tatsächlicher Windows-Zwischenablage-, NVDA-, Braille-
oder ARM64-Test. Die konkrete Windows-Diagnose muss nun mit dieser Testversion
kopiert werden. Vollständiger Release-Lauf, Massenberechnungen, Exporte,
Office/PDF und allgemeine Regressionen wurden ausdrücklich nicht ausgeführt.
`main`, Tags, Releases und GitHub-Einstellungen bleiben unverändert.
