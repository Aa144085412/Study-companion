$ErrorActionPreference = 'Stop'
$dir = 'C:\Users\a1440\Desktop\Study companion'
$pidFile = Join-Path $dir 'data\server.pid'
if (Test-Path -LiteralPath $pidFile) {
    $serverPid = [int](Get-Content -LiteralPath $pidFile)
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid" -ErrorAction SilentlyContinue
    if ($proc -and $proc.Name -eq 'node.exe' -and $proc.CommandLine -like "*server.mjs*") {
        Stop-Process -Id $serverPid -Force
        Write-Output ('STOPPED pid=' + $serverPid)
    } else {
        Write-Output ('PID_MISMATCH pid=' + $serverPid)
    }
} else { Write-Output 'NO_PID_FILE' }
Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*asr_worker*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Output ('KILLED_WORKER ' + $_.ProcessId) }
Start-Sleep -Milliseconds 500
Write-Output ('PORT8765_LISTEN=' + (Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count)
