# run.ps1 — Start the full stack via Docker (Windows)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

# Check Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Bootstrap .env from example if missing
if (-not (Test-Path ".env")) {
    Write-Host "No .env found — copying from .env.example"
    Copy-Item ".env.example" ".env"
    Write-Host "Edit .env and set JWT_SECRET before running in production."
}

Write-Host "Starting Kanban Board (Docker)..."
docker compose up --build