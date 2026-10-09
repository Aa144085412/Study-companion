$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonPath = Join-Path $PSScriptRoot '.venv-tts\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) {
    uv venv --python 3.10 .venv-tts
    if ($LASTEXITCODE -ne 0) { throw 'Python venv creation failed' }
}
uv pip install --python $pythonPath 'edge-tts'
if ($LASTEXITCODE -ne 0) { throw 'dependency install failed' }

# ffmpeg is required to decode edge-tts Opus output into WAV.
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw 'ffmpeg not found on PATH. Install ffmpeg and re-run (it turns edge-tts audio into WAV).'
}

# Drop the old Kokoro models if still present (engine has moved to edge-tts).
$oldKokoro = Join-Path $PSScriptRoot 'models\kokoro'
if (Test-Path -LiteralPath $oldKokoro) { Remove-Item -LiteralPath $oldKokoro -Recurse -Force }

# One-shot synthesis probe: edge-tts (cloud) -> opus -> ffmpeg -> wav.
$stamp = [guid]::NewGuid().ToString()
$textFile = Join-Path $env:TEMP ("study-tts-precheck-$stamp.txt")
$outWav = Join-Path $env:TEMP ("study-tts-precheck-$stamp.wav")
Set-Content -LiteralPath $textFile -Value 'Local read-aloud self check: one two three.' -Encoding UTF8
$out = & $pythonPath (Join-Path $PSScriptRoot 'tts_worker.py') $textFile --out $outWav
$code = $LASTEXITCODE
Remove-Item -LiteralPath $textFile -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $outWav -ErrorAction SilentlyContinue
if ($code -ne 0) { throw ('TTS self-check failed: ' + (($out -join ' ') + " (exit $code)")) }
Set-Content -LiteralPath (Join-Path $PSScriptRoot '.venv-tts\tts-ready.flag') -Value 'edge-tts' -Encoding UTF8
Write-Output 'Read-aloud ready (edge-tts, cloud voices; needs internet). Refresh the Study Companion page to use it.'
