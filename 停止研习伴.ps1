$pidFile = Join-Path $PSScriptRoot 'data\server.pid'
if (Test-Path -LiteralPath $pidFile) {
    $serverPid = [int](Get-Content -LiteralPath $pidFile)
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid"
    $expected = Join-Path $PSScriptRoot 'server.mjs'
    if ($processInfo.Name -eq 'node.exe' -and $processInfo.CommandLine.Contains($expected)) {
        Stop-Process -Id $serverPid
        Write-Output '研习伴服务已停止。'
    } else { Write-Output '没有找到本项目启动的服务进程。' }
}
