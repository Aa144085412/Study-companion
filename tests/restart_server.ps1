$ErrorActionPreference = 'Stop'
$dir = 'C:\Users\a1440\Desktop\Study companion'
$pidFile = Join-Path $dir 'data\server.pid'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.mjs' -WorkingDirectory $dir -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 300
Set-Content -LiteralPath $pidFile -Value $proc.Id
for ($i = 0; $i -lt 40; $i++) {
    try {
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8765/api/state' -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { Write-Output ('STARTED pid=' + $proc.Id); exit 0 }
    } catch {}
    Start-Sleep -Milliseconds 500
}
Write-Output 'START_TIMEOUT'
exit 1
