# Notenblick 1.23.2 – ARM64-Kompatibilität und Prüfgrenzen

Ausgang: vollständiger GitHub-Stand 1.23.1, Commit `420484249d0fbac192ccd9b916477a1ea04e3113`, alle 289 Dateien bytegleich abgeglichen. Entwicklung im eigenen Branch `codex/1.23.2-native-arm64`. Repository `sappelmueller/Notenblick`, ID 1432518047, privat; Actions deaktiviert. Keine Schülerdaten in Tests, Quellcode oder Paketen.

## Gezielte Änderungen

- `native/app.manifest`: genau ein `supportedArchitectures` mit `amd64 arm64` unter application/windowsSettings, Namespace `http://schemas.microsoft.com/SMI/2024/WindowsSettings`. Bestehende DPI-, Long-Path-, Berechtigungs- und Betriebssystemeinträge erhalten. Microsoft unterstützt diesen Eintrag ab Windows 11 24H2.
- Compiler weiterhin IL-only AnyCPU, weder 32BITREQUIRED noch 32BITPREFERRED. Keine zweite EXE, kein Installer und kein Frameworkwechsel. Zielreferenzen weiterhin .NET Framework 4.8; dessen kompatible In-place-Laufzeit 4.8.1 ermöglicht auf unterstütztem Windows ARM64 die native Ausführung. Für den vorgesehenen nativen Pfad: Windows 11 ab 24H2, .NET Framework 4.8.1, ARM64-WebView2-Runtime. Keine Zusage nativer Ausführung auf älteren ARM64-Windows-Versionen; Emulation wird nicht erzwungen.
- Starter wählt über `GetSystemInfo` die Ausführungsumgebung des aktuellen Prozesses. Keine Abhängigkeit von veränderlichen/geerbten Umgebungsvariablen oder vom physischen Hostprozessor; ein emulierter x86-/x64-Prozess benötigt entsprechend seinen x86-/x64-Loader. Unbekannte oder zur Zeigerbreite widersprüchliche Architekturen brechen kontrolliert ab.
- Anschließend explizite WebView2-Loaderfestlegung durch `CoreWebView2Environment.SetLoaderDllFolderPath` vor dem ersten WebView2-Aufruf. Der bestehende vollständige Programmdatei-/Hashschutz wird unverändert vorher ausgeführt. WebView2 SDK 1.0.2903.40, Newtonsoft.Json 13.0.3 und die drei nativen Loader bleiben bytegleich. Eigene und fremde verwaltete DLLs werden auf IL-only/AnyCPU geprüft. WinForms stammt aus der Windows-.NET-Framework-Laufzeit, nicht aus einer mitgelieferten x64-DLL.
- Im Fachcode ausschließlich die bestehende Versionsliste um 1.23.2 ergänzt, damit eigene neue Speicherstände als aktuell erkannt und nicht erneut migriert werden. Keine Änderungen an Fachlogik, Tastatur, Fokus, Berechnungen, Datenformat, Speicherung, Sicherungen oder Exportdarstellung. ZIP enthält ausschließlich EXE und vollständigen Programmordner; `Daten` wird nicht ausgeliefert oder ersetzt.

## Automatisierte Nachweise

In die vorhandene Loader-Testgruppe integriert: tatsächliches RT_MANIFEST/1 der kompilierten EXE einschließlich richtigem Namespace; PE-Maschinenkennungen aller nativen Loader; CLR-Flags aller sechs verwalteten Programmdateien; kompilierter produktiver Architekturwähler für x86/x64/ARM64, falsche Zeigerbreiten und nicht unterstützte Architekturen; SYSTEM_INFO-Strukturgröße; vorhandene öffentliche Loaderpfad-Methode im gesperrten WebView2-SDK. Bestehende Loader-, Integritäts- und Manipulationsprüfungen erhalten. Die Infrastrukturprüfung verlangt zusätzlich, dass die aktuelle Programmversion eigene Speicherstände ohne Migration byteinhaltlich unverändert erkennt; die vorhandenen Speichertests prüfen Neustart und Wiederherstellung weiterhin vollständig.

Abschlussverfahren: frisches `TZ=UTC python3 dev/manage.py release` mit allen 87 Testgruppen, Belastungstest mit 180.000 synthetischen Ergebnissen, Speicher-/Wiederherstellungs-, Chromium/Axe-, Office-/PDF/UA-/Druckprüfungen, zwei sauberen bytegleichen Builds, ZIP-Prüfung und Start der entpackten Weboberfläche. Nur ein erfolgreicher Lauf mit aktuellem Quellen-/Index-/Werkzeug-/Programmnachweis ist gültig. Dieser vorbereitete Bericht weist keinen noch laufenden Test als bestanden aus; der Abschlusscommit enthält tatsächlichen Status und Archivprüfsummen.

## Echte Windows-Prüfung noch erforderlich

Linux-.NET-/Chromium-Prüfungen bestätigen keine native Windows-Ausführung. Kein Windows-x64-/x86-/ARM64-, WebView2-, UIA-, NVDA- oder Braille-Livetest wurde in dieser Umgebung durchgeführt. Native ARM64-Ausführung ist vorbereitet, bis zur Messung auf echter Windows-ARM64-Hardware nicht bestätigt. Keine Codesignierung ergänzt.

`dev/windows-qa.ps1 -Archive <ZIP> -Launch` startet ausschließlich eine frische temporäre Testkopie. Eine 64-Bit-PowerShell liest mit `GetProcessInformation(ProcessMachineTypeInfo)` die tatsächliche Prozessarchitektur und dokumentiert geladene CLR und WebView2Loader.dll samt Pfad-/Hashabgleich. Der Prozess bleibt für die manuelle Abnahme geöffnet. Fehlende Messwerte werden ausdrücklich als Fehler dokumentiert; weder Umgebungsvariable noch AnyCPU-PE-Kennung gelten als Prozessnachweis. Erwartet auf ARM64: Prozess `arm64`, Loader `Programm/Windows/arm64/WebView2Loader.dll`, Framework-Release mindestens 533320. Getrennt dieselbe ZIP auf x64 (Prozess/Loader x64) und möglichst x86 (Prozess/Loader x86) prüfen; Start, NVDA, schnelle Noteneingabe, Speicherung/Neustart, Wiederherstellung und Exporte mit synthetischen Daten abnehmen. Bei regulärem Update vorhandenen Ordner `Daten` vollständig erhalten.

## Nachtrag: Windows und NVDA bestätigt

Sebastian Müller hat am 2. November 2026 mitgeteilt, dass die Windows- und NVDA-Tests erfolgreich verliefen, und den Abschluss der Veröffentlichungsvorbereitung beauftragt. Diese Rückmeldung ist die Nutzerabnahme für Version 1.23.2; die oben beschriebenen automatischen Nachweise bleiben davon getrennt.

Gerätearchitektur, Windows-/WebView2-/NVDA-Versionen und ein einzelnes Abnahmeprotokoll wurden nicht übermittelt. Deshalb werden daraus keine zusätzlichen Nachweise für native ARM64-Ausführung, Braille, Microsoft Office, physischen Druck oder sämtliche Einzelpunkte des Prüfplans abgeleitet. Die damaligen offenen Angaben oben dokumentieren den Stand vor dieser Rückmeldung.

## Microsoft-Quellen

- https://learn.microsoft.com/windows/win32/sbscs/application-manifests#supportedarchitectures
- https://learn.microsoft.com/visualstudio/releases/2022/release-notes-v17.11
- https://devblogs.microsoft.com/dotnet/announcing-dotnet-framework-481/
- https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution
- https://learn.microsoft.com/dotnet/api/microsoft.web.webview2.core.corewebview2environment.setloaderdllfolderpath
- https://learn.microsoft.com/windows/arm/apps-on-arm-x86-emulation
- https://learn.microsoft.com/windows/win32/api/sysinfoapi/nf-sysinfoapi-getsysteminfo
- https://learn.microsoft.com/windows/win32/api/processthreadsapi/ns-processthreadsapi-process_machine_information
