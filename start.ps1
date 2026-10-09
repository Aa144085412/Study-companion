$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$dataDir = Join-Path $projectDir 'data'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
try {
    $response = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/state' -TimeoutSec 2
    if ($response.schema -ge 1 -and $null -ne $response.notebooks) { Start-Process 'http://127.0.0.1:8765'; exit }
} catch {}
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
$serverPath = Join-Path $projectDir 'server.mjs'
$process = Start-Process -FilePath $nodeExe -ArgumentList @(('"' + $serverPath + '"')) -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $dataDir 'server.log') -RedirectStandardError (Join-Path $dataDir 'server-error.log')
Set-Content -LiteralPath (Join-Path $dataDir 'server.pid') -Value $process.Id
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 300
    if ($process.HasExited) { exit 1 }
    try { $response = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/state' -TimeoutSec 1; if ($response.schema -ge 1) { Start-Process 'http://127.0.0.1:8765'; exit } } catch {}
}

