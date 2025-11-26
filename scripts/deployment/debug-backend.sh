#!/bin/bash
# Debug script for backend startup issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

log_info "Starting backend debug investigation..."

# Check if backend container is running
if ! docker-compose -f docker-compose.dev.yml ps backend | grep -q "Up"; then
    log_error "Backend container is not running"
    exit 1
fi

log_info "Checking backend container status..."
docker-compose -f docker-compose.dev.yml ps backend

log_info "Checking recent backend logs..."
docker-compose -f docker-compose.dev.yml logs --tail=100 backend | tail -50

log_info "Checking if binary exists and is executable..."
docker-compose -f docker-compose.dev.yml exec -T backend sh -c "ls -la /app/reconciliation-backend && file /app/reconciliation-backend" 2>&1 || true

log_info "Checking environment variables..."
docker-compose -f docker-compose.dev.yml exec -T backend sh -c "env | grep -E '(JWT|CSRF|DATABASE|REDIS)' | sed 's/=.*/=***/'" 2>&1 || true

log_info "Checking for panic files..."
docker-compose -f docker-compose.dev.yml exec -T backend sh -c "ls -la /tmp/backend-* 2>&1 || echo 'No panic files found'" 2>&1 || true

log_info "Attempting to run binary with strace (if available)..."
docker-compose -f docker-compose.dev.yml exec -T backend sh -c "which strace && strace -e trace=write,writev,exit_group -s 200 /app/reconciliation-backend 2>&1 | head -100 || echo 'strace not available or binary failed'" 2>&1 || true

log_info "Checking database connectivity from backend..."
docker-compose -f docker-compose.dev.yml exec -T backend sh -c "timeout 2 nc -zv postgres 5432 2>&1 || echo 'Database connection test failed'" 2>&1 || true

log_info "Checking Redis connectivity from backend..."
docker-compose -f docker-compose.dev.yml exec -T backend sh -c "timeout 2 nc -zv redis 6379 2>&1 || echo 'Redis connection test failed'" 2>&1 || true

log_info "Debug investigation complete"

