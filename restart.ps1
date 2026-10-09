$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$dataDir = Join-Path $projectDir 'data'
$serverFile = Join-Path $projectDir 'server.mjs'
node --check $serverFile
if ($LASTEXITCODE -ne 0) { throw '服务代码语法检查失败，未停止旧实例' }
node --check (Join-Path $projectDir 'public\app.js')
if ($LASTEXITCODE -ne 0) { throw '页面代码语法检查失败，未停止旧实例' }
$pidPath = Join-Path $dataDir 'server.pid'
if (Test-Path -LiteralPath $pidPath) {
    $serverPid = [int](Get-Content -LiteralPath $pidPath)
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid"
    if ($processInfo -and $processInfo.Name -eq 'node.exe' -and $processInfo.CommandLine.Contains($serverFile)) {
        Stop-Process -Id $serverPid
        Start-Sleep -Milliseconds 500
    }
}
$process = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @(('"'+$serverFile+'"')) -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $dataDir 'server.log') -RedirectStandardError (Join-Path $dataDir 'server-error.log')
Set-Content -LiteralPath $pidPath -Value $process.Id
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 300
    if ($process.HasExited) { throw '启动失败，请检查 data/server-error.log' }
    try {
        $health = Invoke-RestMethod 'http://127.0.0.1:8765/api/health' -TimeoutSec 1
        if ($health.app -eq 'study-companion') { $health | ConvertTo-Json -Depth 3; exit 0 }
    } catch {}
}
throw '服务健康检查超时'
