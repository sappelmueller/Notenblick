param(
    [Parameter(Mandatory=$true)][string]$Archive,
    [switch]$Launch
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Diese Prüfung benötigt Windows.' }
$archivePath = (Resolve-Path -LiteralPath $Archive).Path
$target = Join-Path ([IO.Path]::GetTempPath()) ('Notenblick-Pruefung-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $target | Out-Null
Expand-Archive -LiteralPath $archivePath -DestinationPath $target
$app = Join-Path $target 'Notenblick'
$names = @(Get-ChildItem -LiteralPath $app | Select-Object -ExpandProperty Name)
if ($names.Count -ne 2 -or $names -notcontains 'Notenblick.exe' -or $names -notcontains 'Programm') {
    throw 'Unerwarteter Inhalt der portablen Ausgabe.'
}
$required = @('Notenblick.exe', 'Programm/Notenblick.html',
    'Programm/Windows/Notenblick.Fenster.dll', 'Programm/Windows/Notenblick.Speicherung.dll',
    'Programm/Windows/Newtonsoft.Json.dll', 'Programm/Windows/Microsoft.Web.WebView2.Core.dll',
    'Programm/Windows/Microsoft.Web.WebView2.WinForms.dll',
    'Programm/Windows/x86/WebView2Loader.dll', 'Programm/Windows/x64/WebView2Loader.dll',
    'Programm/Windows/arm64/WebView2Loader.dll')
foreach ($name in $required) {
    if (-not (Test-Path -LiteralPath (Join-Path $app $name) -PathType Leaf)) { throw "Fehlt: $name" }
}
$framework = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full' -ErrorAction SilentlyContinue
if (-not $framework -or $framework.Release -lt 528040) { throw '.NET Framework 4.8 oder neuer fehlt.' }
$webview = @()
foreach ($reg in @('HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\*',
                    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\*',
                    'HKCU:\SOFTWARE\Microsoft\EdgeUpdate\Clients\*')) {
    $webview += @(Get-ItemProperty $reg -ErrorAction SilentlyContinue | Where-Object { $_.name -like '*WebView2*' })
}
$report = [ordered]@{
    date = (Get-Date).ToString('o')
    windows = [Environment]::OSVersion.VersionString
    architecture = $env:PROCESSOR_ARCHITECTURE
    archive_sha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
    framework_release = $framework.Release
    webview_registered_versions = @($webview | Select-Object -ExpandProperty pv -Unique)
    extracted_folder = $app
    windows_gui_tested = $false
    nvda_tested = $false
}
if ($webview.Count -eq 0) { Write-Warning 'Keine registrierte WebView2-Laufzeit gefunden. Ein tatsächlicher Programmstart muss die Verfügbarkeit prüfen.' }
if ($Launch) {
    if (-not [Environment]::Is64BitProcess) { throw 'Für die Prozessprüfung bitte 64-Bit-PowerShell verwenden.' }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class NotenblickProcessProbe {
    [StructLayout(LayoutKind.Sequential)]
    public struct MachineInfo { public ushort Machine, Reserved; public uint Attributes; }
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool GetProcessInformation(IntPtr process, int informationClass, out MachineInfo info, uint size);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool IsWow64Process2(IntPtr process, out ushort processMachine, out ushort nativeMachine);
}
'@
    $process = Start-Process -FilePath (Join-Path $app 'Notenblick.exe') -WorkingDirectory $app -PassThru
    $report['process_id'] = $process.Id
    $report['process_architecture'] = 'Nicht ermittelt'
    $report['native_arm64_confirmed'] = $false
    $report['matching_loader_confirmed'] = $false
    try {
        $info = New-Object NotenblickProcessProbe+MachineInfo
        if (-not [NotenblickProcessProbe]::GetProcessInformation($process.Handle, 9, [ref]$info, 8)) {
            throw 'ProcessMachineTypeInfo nicht verfügbar; kein Architekturnachweis.'
        }
        $architectures = @{ 0x014c='x86'; 0x8664='x64'; 0xaa64='arm64' }
        $actual = $architectures[[int]$info.Machine]
        if (-not $actual) { throw 'Unbekannte Prozessarchitektur.' }
        $report['process_architecture'] = $actual
        [ushort]$guest = 0; [ushort]$hostMachine = 0
        if ([NotenblickProcessProbe]::IsWow64Process2($process.Handle, [ref]$guest, [ref]$hostMachine)) {
            $report['host_architecture'] = $architectures[[int]$hostMachine]
        }
        $deadline = [DateTime]::UtcNow.AddSeconds(20)
        $loader = $null; $clr = $null
        do {
            $process.Refresh()
            if ($process.HasExited) { throw 'Notenblick wurde vor dem Architekturnachweis beendet.' }
            $modules = @($process.Modules)
            $loader = $modules | Where-Object { $_.ModuleName -ieq 'WebView2Loader.dll' } | Select-Object -First 1
            $clr = $modules | Where-Object { $_.ModuleName -ieq 'clr.dll' } | Select-Object -First 1
            if (-not $loader -or -not $clr) { Start-Sleep -Milliseconds 200 }
        } while ((-not $loader -or -not $clr) -and [DateTime]::UtcNow -lt $deadline)
        if (-not $loader -or -not $clr) { throw 'Loader/CLR nicht im laufenden Prozess nachgewiesen.' }
        $expectedLoader = Join-Path $app ('Programm/Windows/' + $actual + '/WebView2Loader.dll')
        $report['loader_path'] = $loader.FileName
        $report['clr_path'] = $clr.FileName
        $report['matching_loader_confirmed'] = [string]::Equals($loader.FileName, $expectedLoader, [StringComparison]::OrdinalIgnoreCase) -and
            ((Get-FileHash -LiteralPath $loader.FileName).Hash -eq (Get-FileHash -LiteralPath $expectedLoader).Hash)
        if (-not $report['matching_loader_confirmed']) { throw 'Geladener Loader passt nicht zum Prozess.' }
        $report['native_arm64_confirmed'] = ($actual -eq 'arm64' -and $framework.Release -ge 533320)
        Write-Host ('Gemessene Prozessarchitektur: ' + $actual + '; passender Loader geladen.')
    } catch {
        $report['architecture_error'] = $_.Exception.Message
        Write-Warning $_.Exception.Message
    }
    Write-Host 'Die Testkopie bleibt geöffnet. Nach der manuellen Prüfung schließen. GUI, Fokus und NVDA bleiben gesondert zu prüfen.'
}
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $target 'Windows-Pruefung.json') -Encoding UTF8
Write-Host "Prüfordner: $target"
Write-Host 'Manuelle Prüfpunkte stehen in docs/WINDOWS-PRUEFUNG.md. Reale Schülerdaten nicht verwenden.'
