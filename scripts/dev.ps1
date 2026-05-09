# dev.ps1 — Run frontend and backend locally without Docker (Windows)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

# Bootstrap backend .env if missing
if (-not (Test-Path "$Root\backend\.env")) {
    Write-Host "No backend\.env found — copying from .env.example"
    Copy-Item "$Root\.env.example" "$Root\backend\.env"
}

# Install deps if needed
if (-not (Test-Path "$Root\backend\node_modules")) {
    Write-Host "Installing backend dependencies..."
    Push-Location "$Root\backend"; npm install; Pop-Location
}
if (-not (Test-Path "$Root\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..."
    Push-Location "$Root\frontend"; npm install; Pop-Location
}

Write-Host "Starting backend on :4000 and frontend on :3000..."
Write-Host "Press Ctrl+C to stop both servers."

$backend  = Start-Process -PassThru -NoNewWindow -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory "$Root\backend"
$frontend = Start-Process -PassThru -NoNewWindow -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory "$Root\frontend"

try {
    Wait-Process -Id $backend.Id, $frontend.Id
} finally {
    if (-not $backend.HasExited)  { Stop-Process -Id $backend.Id  -Force }
    if (-not $frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
}