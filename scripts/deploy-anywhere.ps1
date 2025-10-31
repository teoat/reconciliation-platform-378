#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "[Deploy] Starting cross-platform deployment (PowerShell)"

# Pick docker compose command
function Get-ComposeCmd {
  try { docker compose version | Out-Null; return 'docker compose' } catch {}
  if (Get-Command docker-compose -ErrorAction SilentlyContinue) { return 'docker-compose' }
  throw "Docker Compose not found. Install Docker Desktop (includes compose v2)."
}
$DC = Get-ComposeCmd

# Optional clean DOCKER_CONFIG to bypass credential helpers
if ($env:CLEAN_DOCKER_CONFIG -eq '1') {
  $dir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath()) -Name ("docker_cfg_" + [System.Guid]::NewGuid())
  Set-Content -Path (Join-Path $dir 'config.json') -Value '{}'
  $env:DOCKER_CONFIG = $dir.FullName
  Write-Host "[Deploy] Using clean DOCKER_CONFIG at $($env:DOCKER_CONFIG)"
}

# Defaults
if (-not $env:POSTGRES_DB) { $env:POSTGRES_DB = 'reconciliation_app' }
if (-not $env:POSTGRES_USER) { $env:POSTGRES_USER = 'postgres' }
if (-not $env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD = 'postgres_pass' }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = 'change-this-in-production' }
if (-not $env:VITE_API_URL) { $env:VITE_API_URL = 'http://localhost:2000' }

# Build & start
& $DC -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for backend health
Write-Host "[Deploy] Waiting for backend health..."
for ($i=0; $i -lt 30; $i++) {
  try {
    Invoke-WebRequest -Uri 'http://localhost:2000/health' -UseBasicParsing -TimeoutSec 2 | Out-Null
    Write-Host "[Deploy] Backend healthy"
    break
  } catch {}
  Start-Sleep -Seconds 2
}

# Status
& $DC ps
Write-Host "[Deploy] Frontend: http://localhost:1000"
Write-Host "[Deploy] Backend:  http://localhost:2000"
Write-Host "[Deploy] Prometheus: http://localhost:9090"
Write-Host "[Deploy] Grafana: http://localhost:3001"

exit 0


