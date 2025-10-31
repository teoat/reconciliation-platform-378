#!/usr/bin/env sh
set -eu

# Cross-platform (Linux/macOS) Docker deployment script.
# Usage:
#   ./scripts/deploy-anywhere.sh               # normal
#   CLEAN_DOCKER_CONFIG=1 ./scripts/deploy-anywhere.sh   # bypass cred helpers

echo "[Deploy] Starting cross-platform deployment (sh)"

# Choose docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "[Deploy] ERROR: Docker Compose not found. Install Docker Desktop (includes compose v2)." >&2
  exit 1
fi

# Optionally use a clean DOCKER_CONFIG to avoid credential helper issues
if [ "${CLEAN_DOCKER_CONFIG:-0}" = "1" ]; then
  TMPCFG=$(mktemp -d)
  echo '{}' > "${TMPCFG}/config.json"
  export DOCKER_CONFIG="${TMPCFG}"
  echo "[Deploy] Using clean DOCKER_CONFIG at ${DOCKER_CONFIG}"
fi

# Basic env with defaults
export POSTGRES_DB=${POSTGRES_DB:-reconciliation_app}
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres_pass}
export JWT_SECRET=${JWT_SECRET:-change-this-in-production}
export VITE_API_URL=${VITE_API_URL:-http://localhost:2000}

# Build & start
${DC} -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for backend health (max ~60s)
echo "[Deploy] Waiting for backend health..."
ATTEMPTS=30
while [ $ATTEMPTS -gt 0 ]; do
  if command -v curl >/dev/null 2>&1 && curl -fsS http://localhost:2000/health >/dev/null 2>&1; then
    echo "[Deploy] Backend healthy"
    break
  fi
  ATTEMPTS=$((ATTEMPTS-1))
  sleep 2
done

# Status
${DC} ps
echo "[Deploy] Frontend: http://localhost:1000"
echo "[Deploy] Backend:  http://localhost:2000"
echo "[Deploy] Prometheus: http://localhost:9090"
echo "[Deploy] Grafana: http://localhost:3001"

exit 0


