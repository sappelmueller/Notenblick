# TLS-Korrektur 1.24.0 – 3. November 2026

Ausgangsstand: `b293006e308f2757a5032fd3b87e1f01bf2650b9`, bestehender Branch
`entwicklung/1.24.0`. Keine offizielle Freigabe.

Die Windows-Diagnose weist auf `SslState.ValidateCreateContext`:
`ReceiveFailure`, innere `ArgumentException`, ungültiger `SslProtocolType`.
Die Framework-Implementierung wirft genau diese Ausnahme, wenn der alte
Kompatibilitätsmodus System-TLS sperrt und gleichzeitig `SystemDefault` (0)
verwendet wird. Die bisherige Zuweisung dieses Werts allein genügte nicht.

Der Starter deklariert nun ausdrücklich `.NETFramework,Version=v4.8`.
Als erste Anweisungen vor Programm-/WebView2-Laden werden
`Switch.System.Net.DontEnableSystemDefaultTlsVersions` und
`Switch.System.Net.DontEnableSchUseStrongCrypto` auf `false` gesetzt.
So stehen die Vorgaben vor der erstmaligen, zwischengespeicherten
System.Net-Initialisierung fest. Der Updater verwendet weiterhin SystemDefault;
Windows/Schannel wählt die sicheren Protokolle. Keine feste TLS-Versionsgrenze,
kein unsicherer Rückfall, keine Zertifikatsausnahme oder Registry-Änderung.

Vorhandene Voraussetzungen bleiben bestehen: x86/x64 mit .NET Framework 4.8+
und WebView2; natives ARM64 mit Windows 11 24H2+, .NET Framework 4.8.1 und
ARM64-WebView2. AnyCPU, alle drei Loader und der Systemproxy bleiben erhalten.
Keine zusätzlichen Bibliotheken oder Installationsvoraussetzungen.
Updater, Diagnose-/Kopierschalter, Herkunfts-, Integritäts-, Zustimmungs-,
Rückfall- und Datenordnerschutz bleiben erhalten.

Nur Windows-Kompilierung und grundlegende ZIP-/Integritäts-/Entpackkontrolle;
keine Testreihen, Netzwerktests, allgemeinen Regressionen oder Release-Prüfung.
Praktisch offen: Programmstart und Aktualisierungsprüfung auf Windows x64 und
nativem ARM64; ohne neuere Freigabe muss „Dein Notenblick ist aktuell.“ erscheinen.
Bei einem tatsächlichen Fehler weiterhin „Fehlerdetails kopieren“ verwenden.
`main`, Tags und Releases unverändert; ZIP ausschließlich EXE/Programm, kein Daten.

Quellen: [Framework-Fehlerstelle](https://github.com/microsoft/referencesource/blob/main/System/net/System/Net/SecureProtocols/_SslState.cs),
[Microsofts TLS-Vorgaben](https://learn.microsoft.com/en-us/dotnet/framework/network-programming/tls).
