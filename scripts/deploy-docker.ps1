# Inkloom AI - Docker Full-Stack Deployment for Windows / PowerShell
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Inkloom AI - Docker Full-Stack Production Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if Docker command exists
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop from https://www.docker.com/"
    exit 1
}

# Check if Docker engine is running
try {
    docker info > $null 2>&1
} catch {
    Write-Warning "Docker daemon is not running. Attempting to start Docker Desktop..."
    $dockerPaths = @(
        "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe",
        "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    foreach ($p in $dockerPaths) {
        if (Test-Path $p) {
            Start-Process $p
            break
        }
    }
    Write-Host "Waiting 20 seconds for Docker to initialize..."
    Start-Sleep -Seconds 20
}

Write-Host "Building and launching containers via docker-compose..." -ForegroundColor Yellow
docker compose down 2>$null
docker compose up --build -d

Write-Host "Waiting for services to become healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

$maxAttempts = 15
$attempt = 0
$isHealthy = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($res.status -eq "healthy") {
            $isHealthy = $true
            break
        }
    } catch {}
    Write-Host "Waiting for backend health check ($attempt/$maxAttempts)..."
    Start-Sleep -Seconds 2
}

if ($isHealthy) {
    Write-Host "✓ Backend API is healthy at: http://localhost:8000" -ForegroundColor Green
    Write-Host "✓ Next.js Frontend is live at: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Warning "Backend took longer than expected to report healthy. Check 'docker compose logs backend'."
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host " - Web UI:  http://localhost:3000" -ForegroundColor Cyan
Write-Host " - API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
