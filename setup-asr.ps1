$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonPath = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) {
    uv venv --python 3.10 .venv
    if ($LASTEXITCODE -ne 0) { throw 'Python 环境创建失败' }
}
uv pip install --python $pythonPath 'faster-whisper==1.2.1' 'opencc-python-reimplemented'
if ($LASTEXITCODE -ne 0) { throw '依赖安装失败' }
& $pythonPath download_model.py
if ($LASTEXITCODE -ne 0) { throw '模型下载失败，请稍后重试；已下载的内容会保留' }
Write-Output '本地语音识别已就绪，刷新研习伴页面即可。'
