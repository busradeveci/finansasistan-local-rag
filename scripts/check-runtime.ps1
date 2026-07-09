# Foundry Local — one-shot runtime verification (Windows PowerShell)
# Usage:  .\scripts\check-runtime.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== Foundry Local Runtime Check ===" -ForegroundColor Cyan

Push-Location $Root

# 1. Python environment + offline checks
Write-Host "`n[1/3] Offline diagnostics (paths, DB, extractors)..." -ForegroundColor Yellow
$env:RUNTIME_CHECK_HTTP = "0"
& "$Root\.venv\Scripts\python.exe" -m backend.runtime_diagnostics
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }

# 2. Backend health (if running)
Write-Host "`n[2/3] Backend HTTP probe (127.0.0.1:8000)..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/status" -TimeoutSec 8
    Write-Host "  OK  backend /api/status — $($status.vector_store.document_count) document(s)" -ForegroundColor Green
    $inv = Invoke-RestMethod -Uri "http://127.0.0.1:8000/documents/inventory" -TimeoutSec 8
    Write-Host "  OK  backend /documents/inventory — $($inv.documents.Count) row(s)" -ForegroundColor Green
} catch {
    Write-Host "  WARN backend not reachable on port 8000" -ForegroundColor Red
    Write-Host "       Start: python -m uvicorn backend.main:app --port 8000" -ForegroundColor DarkYellow
}

# 3. Frontend dev server (if running)
Write-Host "`n[3/3] Frontend dev-server probe (127.0.0.1:5173)..." -ForegroundColor Yellow
try {
    $fe = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  OK  Vite frontend responding (HTTP $($fe.StatusCode))" -ForegroundColor Green
    Write-Host "       Dev mode uses Vite proxy: /documents /query /api -> 127.0.0.1:8000" -ForegroundColor DarkGray
} catch {
    Write-Host "  WARN frontend not reachable on port 5173" -ForegroundColor Red
    Write-Host "       Start: cd frontend; npm run dev" -ForegroundColor DarkYellow
}

Pop-Location
Write-Host "`n=== Done ===" -ForegroundColor Cyan
