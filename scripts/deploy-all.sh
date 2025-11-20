#!/usr/bin/env bash
set -euo pipefail

echo "[Deploy] Building and starting all services with production overrides"

export POSTGRES_DB=${POSTGRES_DB:-reconciliation_app}
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres_pass}
export JWT_SECRET=${JWT_SECRET:-change-this-in-production}
export VITE_API_URL=${VITE_API_URL:-http://localhost:2000}

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "[Deploy] Waiting for backend health..."
for i in {1..30}; do
  if curl -fsS http://localhost:2000/health >/dev/null 2>&1; then
    echo "[Deploy] Backend healthy"
    break
  fi
  sleep 2
done

echo "[Deploy] Services running:")
docker compose ps

echo "[Deploy] Frontend: http://localhost:1000"
echo "[Deploy] Backend:  http://localhost:2000"


