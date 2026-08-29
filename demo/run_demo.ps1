# BobSwarm demo launcher for Windows PowerShell.
param(
    [string]$PythonPath
)

$ErrorActionPreference = 'Stop'

$demoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$validator = Join-Path $demoDir 'validate_demo.py'

$pythonCommand = $null
if ($PythonPath) {
    if (-not (Test-Path -LiteralPath $PythonPath -PathType Leaf)) {
        throw "Python executable not found: $PythonPath"
    }
    $pythonExecutable = (Resolve-Path -LiteralPath $PythonPath).Path
} else {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCommand) {
        $pythonCommand = Get-Command py -ErrorAction SilentlyContinue
    }
    if ($pythonCommand) {
        $pythonExecutable = $pythonCommand.Source
    }
}
if (-not $pythonExecutable) {
    throw 'Python 3.10+ is required. Add it to PATH or pass -PythonPath <python.exe>.'
}

Write-Host 'BobSwarm demo preflight'
Write-Host '======================='
& $pythonExecutable $validator
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Preflight passed. Complete the explicit Bob handoff:'
Write-Host ''
Write-Host '1. Submit this task in the BobSwarm dashboard:'
Write-Host '   Analyse demo/sample-project: find bugs, document the public API,'
Write-Host '   suggest targeted refactoring, trace data lineage, and create onboarding.'
Write-Host ''
Write-Host '2. Copy the exact run UUID displayed by the dashboard.'
Write-Host ''
Write-Host "3. In Bob, select 'BobSwarm Orchestrator' and paste:"
Write-Host '   runId: <RUN_ID_FROM_DASHBOARD>'
Write-Host '   Task: Analyse demo/sample-project. Find all bugs, document the public API,'
Write-Host '   suggest targeted refactoring, trace the data flow, and create an onboarding guide.'
Write-Host ''
Write-Host 'The dashboard creates and visualises the run; Bob performs the dispatch.'
Write-Host "Expected source-backed targets: $(Join-Path $demoDir 'expected_output.md')"
Write-Host ''
Write-Host 'Optional final verification:'
Write-Host "  python $validator --report <finalize_run.json>"
