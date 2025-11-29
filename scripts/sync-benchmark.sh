#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common-functions.sh
source "$SCRIPT_DIR/lib/common-functions.sh"

# ---------------------------------------------------------------------------
# SQL Sync Benchmark Runner
# ---------------------------------------------------------------------------
# Exercises a single sync configuration via the HTTP API and measures:
#   - Full sync duration
#   - Incremental sync duration and throughput
#
# Usage:
#   SYNC_CONFIG_ID=<uuid> \
#   SYNC_API_BASE="http://localhost:2000/api/v1/sync/sql-sync" \
#   ./scripts/sync-benchmark.sh
#
# Optional:
#   INCREMENTAL_RUNS=5  # number of incremental executions after the full sync
# ---------------------------------------------------------------------------

: "${SYNC_CONFIG_ID:?SYNC_CONFIG_ID must be set (UUID of sync configuration)}"
SYNC_API_BASE="${SYNC_API_BASE:-http://localhost:2000/api/v1/sync/sql-sync}"
INCREMENTAL_RUNS="${INCREMENTAL_RUNS:-5}"

log_info "Starting sync benchmark for config=$SYNC_CONFIG_ID"

execute_sync() {
  local label="$1"
  local start_ts end_ts duration

  start_ts=$(date +%s%3N)
  log_info "Triggering $label sync..."
  # Fire-and-forget style; in a real env you might poll an execution-status endpoint
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "${SYNC_API_BASE}/configurations/${SYNC_CONFIG_ID}/execute" \
    -H 'Content-Type: application/json' \
    -d '{"force_full_sync":false}')

  end_ts=$(date +%s%3N)
  duration=$((end_ts - start_ts))

  if [[ "$http_code" != "200" ]]; then
    log_warning "${label} sync returned HTTP $http_code (duration=${duration}ms)"
  else
    log_success "${label} sync completed (HTTP 200, duration=${duration}ms)"
  fi

  echo "$duration"
}

# 1) Full sync benchmark
FULL_DURATION_MS=$(execute_sync "full")

# 2) Incremental sync runs
TOTAL_INC_DURATION=0
for i in $(seq 1 "$INCREMENTAL_RUNS"); do
  d=$(execute_sync "incremental #$i")
  TOTAL_INC_DURATION=$((TOTAL_INC_DURATION + d))
  sleep 1
done

AVG_INC_DURATION=$((TOTAL_INC_DURATION / INCREMENTAL_RUNS))

log_info "Benchmark summary for config=$SYNC_CONFIG_ID"
log_info "  Full sync duration:      ${FULL_DURATION_MS} ms"
log_info "  Incremental runs:        ${INCREMENTAL_RUNS}"
log_info "  Total incremental time:  ${TOTAL_INC_DURATION} ms"
log_info "  Avg incremental time:    ${AVG_INC_DURATION} ms"

log_success "Sync benchmark completed"