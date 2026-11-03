# Updater-Korrektur 1.24.0 – 3. November 2026

Testversion im bestehenden Branch `entwicklung/1.24.0`, Ausgangsstand
`0de54ba849be4c84c1c8e5d2094075e489a35ae6`. Keine offizielle Freigabe.

## Befund und Änderung

Der direkt kompilierte Windows-Starter enthält weder `TargetFrameworkAttribute`
noch eine EXE-Konfiguration. Die Referenzbibliotheken von .NET Framework 4.8
allein aktivieren deshalb nicht dessen moderne TLS-Vorgaben. Der Updater
übernahm die alten Prozessvorgaben unverändert; damit kann die HTTPS-Verbindung
zu GitHub bereits vor dem Versionsvergleich scheitern. Die Anfragen setzen nun
vor ihrer Erstellung `SecurityProtocolType.SystemDefault`: Windows handelt TLS
aus. Keine Zertifikatausnahmen, Registry-Eingriffe oder zusätzlichen Downloads.
Grundlage: [Microsofts TLS-Dokumentation](https://learn.microsoft.com/en-us/dotnet/framework/network-programming/tls).

Die echten GitHub-Antworten ergeben für die installierte Version 1.24.0 bereits
ohne Änderung des Versionsvergleichs „aktuell“. Die vorhandene stabile
Veröffentlichung trägt den Tag `v1.23.2-oss.1`; dieser nicht unterstützte Tag
wird sicher übersprungen. Ältere numerische Versionen und Vorabversionen
führen ebenfalls zu keinem Angebot. Ein Release-Katalog mit Nichtobjekten
wird jetzt ausdrücklich als fehlerhaft zurückgewiesen.

Die konkrete Windows-Ausnahme des Nutzers liegt nicht vor. Die TLS-Ursache ist
aus Windows-Build und Framework-Verhalten abgeleitet; die Bestätigung auf dem
betroffenen Windows-Rechner steht aus. Linux/.NET 8 verwendet schon moderne
TLS-Vorgaben und reproduziert diesen Windows-spezifischen Fehler nicht.

## Ausgeführte gezielte Prüfungen

`python3 tests/update.py --live`: 155 native Updater-Prüfungen sowie die
Oberflächenprüfung „aktuell / neue Version / fehlgeschlagen“, insgesamt 10,31 s.
Ausführung unter Linux mit .NET 8 und jsdom, ausschließlich synthetische Daten.

- Simulierte alte TLS-Prozessvorgabe wird vor API- und Asset-Anfragen ersetzt;
  Zertifikatsprüfung, Zeitgrenzen, Medienformate, Herkunfts- und Redirectschutz
  sowie der Verzicht auf Zugangsdaten und Cookies bleiben erhalten.
- Echte öffentliche GitHub-Abfrage über den produktiven HTTPS-Transport:
  Version 1.24.0 ist aktuell. Kein Download oder Installieren eines Updates.
- Ältere, gleiche, höhere, nicht freigegebene und inkompatible Versionen;
  Entwürfe, Vorabversionen, numerischer Vergleich und falsche Repository-ID.
- DNS-/Verbindungsfehler, Zeitüberschreitung, HTTP-Protokollfehler, ungültiges
  JSON, fehlerhafter Katalog und Abbruch werden nicht als „aktuell“ gewertet.
- Vorhandene Updater-Prüfungen für Dateilisten, Prüfsummen, manipulierte ZIPs,
  Pfadschutz, exklusiven Zugriff, Abbruch, Austausch und Rückfall bestehen.
  Synthetische Daten bleiben bei erfolgreichem Austausch und Fehlerfällen
  einschließlich Inhalt und Metadaten unverändert.
- Alle drei Rückmeldungen bleiben verständlich; Fokus und Arbeitsdaten bleiben
  unverändert. Keine geänderten Oberflächen-, Fokus- oder Navigationstexte.

Windows-Dateien wurden gegen die bestehenden .NET-Framework-4.8-Referenzen
kompiliert. Gegenüber dem unveränderten Ausgangsbuild ändern sich ausschließlich
`Notenblick.Fenster.dll` (Updater) und die EXE mit ihren aktualisierten
Integritätsvorgaben. Alle übrigen ausgelieferten Dateien sind bytegleich.

Das einzelne Windows-ZIP wurde mit den vorhandenen Verpackungsprüfungen
erstellt: vollständiger Dateibestand, eingebettete Integritätsvorgaben,
AnyCPU-Starter, Archiv-CRC und bytegleicher Inhalt nach Entpacken.
Enthalten sind ausschließlich `Notenblick.exe` und `Programm`, kein `Daten`.
Es werden kein Quellcode-ZIP und keine zusätzlichen Download-Dateien erstellt.

## Offen für die spätere Freigabe

Manuelle Prüfung auf dem betroffenen Windows-Rechner, NVDA/Braille,
ARM64 und tatsächlicher Windows-Update-/Wiederherstellungsablauf. Die vollständige
Release-Prüfung einschließlich der übrigen Funktionen bleibt ausdrücklich
ausstehend. Kein Massen-, Export-, Office-/PDF- oder allgemeiner Regressionstest;
`main`, Tags, Releases und GitHub-Einstellungen bleiben unverändert.
