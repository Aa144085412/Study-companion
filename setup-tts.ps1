$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonPath = Join-Path $PSScriptRoot '.venv-tts\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) {
    uv venv --python 3.10 .venv-tts
    if ($LASTEXITCODE -ne 0) { throw 'Python venv creation failed' }
}
uv pip install --python $pythonPath 'kokoro-onnx' 'soundfile'
if ($LASTEXITCODE -ne 0) { throw 'dependency install failed' }

$modelDir = Join-Path $PSScriptRoot 'models\kokoro'
New-Item -ItemType Directory -Force -Path $modelDir | Out-Null
$modelPath = Join-Path $modelDir 'kokoro-v1.0.int8.onnx'
$voicesPath = Join-Path $modelDir 'voices-v1.0.bin'
$relBase = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
if (-not (Test-Path -LiteralPath $modelPath)) {
    Invoke-WebRequest -Uri ($relBase + 'kokoro-v1.0.int8.onnx') -OutFile $modelPath
    if ($LASTEXITCODE -ne 0) { throw 'model download failed; retry later (partial download is kept)' }
}
if (-not (Test-Path -LiteralPath $voicesPath)) {
    Invoke-WebRequest -Uri ($relBase + 'voices-v1.0.bin') -OutFile $voicesPath
    if ($LASTEXITCODE -ne 0) { throw 'voices download failed; retry later' }
}
# One-shot synthesis probe to verify the full chain (model + voices + espeak + synth)
$stamp = [guid]::NewGuid().ToString()
$textFile = Join-Path $env:TEMP ("study-tts-precheck-$stamp.txt")
$outWav = Join-Path $env:TEMP ("study-tts-precheck-$stamp.wav")
Set-Content -LiteralPath $textFile -Value 'Local read-aloud self check: one two three.' -Encoding UTF8
$out = & $pythonPath (Join-Path $PSScriptRoot 'tts_worker.py') $textFile --out $outWav
$code = $LASTEXITCODE
Remove-Item -LiteralPath $textFile -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $outWav -ErrorAction SilentlyContinue
if ($code -ne 0) { throw ('TTS self-check failed: ' + (($out -join ' ') + " (exit $code)")) }
Set-Content -LiteralPath (Join-Path $PSScriptRoot '.venv-tts\tts-ready.flag') -Value 'kokoro-onnx' -Encoding UTF8
Write-Output 'Local read-aloud ready; refresh the Study Companion page to use it.'
