$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonCommand = Get-Command python -ErrorAction Stop
$validatorPython = Join-Path $projectRoot '.venv-ocr\Scripts\python.exe'

if (-not (Test-Path -LiteralPath $validatorPython)) {
    & $pythonCommand.Source -c "import sys; assert sys.version_info >= (3, 10), 'Python 3.10+ is required'"
    if ($LASTEXITCODE -ne 0) { throw 'Python 3.10+ is required.' }
    & $pythonCommand.Source -m venv (Join-Path $projectRoot '.venv-ocr')
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the isolated validation environment.' }
}

& $validatorPython -m pip install -r (Join-Path $projectRoot 'requirements-course.txt')
if ($LASTEXITCODE -ne 0) { throw 'Could not install the validation dependency.' }
& $validatorPython -c "import pydantic; print('Validation ready. Pydantic:', pydantic.__version__); print('No local AI model was downloaded.')"
if ($LASTEXITCODE -ne 0) { throw 'Validation environment check failed.' }
