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
    $process = Start-Process -FilePath (Join-Path $app 'Notenblick.exe') -WorkingDirectory $app -PassThru -Wait
    $report['exit_code'] = $process.ExitCode
    Write-Host 'Der Prozess wurde ausgeführt. GUI, Fokus und NVDA sind damit noch nicht als geprüft bestätigt.'
}
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $target 'Windows-Pruefung.json') -Encoding UTF8
Write-Host "Prüfordner: $target"
Write-Host 'Manuelle Prüfpunkte stehen in docs/WINDOWS-PRUEFUNG.md. Reale Schülerdaten nicht verwenden.'
