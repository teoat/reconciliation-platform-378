#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Shared logging/validation functions
# shellcheck source=./lib/common-functions.sh
source "$SCRIPT_DIR/lib/common-functions.sh"

# ---------------------------------------------------------------------------
# SQL Sync Table Validation
# ---------------------------------------------------------------------------
# Compares a source and target table for:
#   - Row count equality
#   - Primary key set differences
#   - Simple aggregate checks on numeric columns (optional)
#
# Usage:
#   DATABASE_URL=postgres://... \
#   SOURCE_TABLE=public.source_table \
#   TARGET_TABLE=public.target_table \
#   PRIMARY_KEY=id \
#   ./scripts/sync-validate-tables.sh
#
# Optional environment variables:
#   NUMERIC_COLUMNS="amount,quantity"  # comma-separated numeric columns to sum
# ---------------------------------------------------------------------------

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${SOURCE_TABLE:?SOURCE_TABLE must be set}"
: "${TARGET_TABLE:?TARGET_TABLE must be set}"
PRIMARY_KEY="${PRIMARY_KEY:-id}"
NUMERIC_COLUMNS="${NUMERIC_COLUMNS:-}"

log_info "Validating sync between source=$SOURCE_TABLE and target=$TARGET_TABLE (pk=$PRIMARY_KEY)"

# Helper to run a psql command quietly and return a single value
pg_scalar() {
  local sql="$1"
  PGPASSWORD="${PGPASSWORD:-}" psql "$DATABASE_URL" -t -A -q -c "$sql"
}

# 1) Row count comparison
log_info "Checking row counts"
SRC_COUNT="$(pg_scalar "SELECT COUNT(*) FROM ${SOURCE_TABLE};")"
TGT_COUNT="$(pg_scalar "SELECT COUNT(*) FROM ${TARGET_TABLE};")"

log_info "Source count: $SRC_COUNT"
log_info "Target count: $TGT_COUNT"

if [[ "$SRC_COUNT" == "$TGT_COUNT" ]]; then
  log_success "Row counts match"
else
  log_warning "Row count mismatch: source=$SRC_COUNT, target=$TGT_COUNT"
fi

# 2) Primary key set differences
log_info "Checking primary key differences on $PRIMARY_KEY"

MISSING_IN_TARGET="$(pg_scalar "SELECT COUNT(*) FROM (SELECT ${PRIMARY_KEY} FROM ${SOURCE_TABLE} EXCEPT SELECT ${PRIMARY_KEY} FROM ${TARGET_TABLE}) AS diff;")"
EXTRA_IN_TARGET="$(pg_scalar "SELECT COUNT(*) FROM (SELECT ${PRIMARY_KEY} FROM ${TARGET_TABLE} EXCEPT SELECT ${PRIMARY_KEY} FROM ${SOURCE_TABLE}) AS diff;")"

log_info "Missing in target (present in source only): $MISSING_IN_TARGET"
log_info "Extra in target (not in source): $EXTRA_IN_TARGET"

if [[ "$MISSING_IN_TARGET" == "0" && "$EXTRA_IN_TARGET" == "0" ]]; then
  log_success "Primary key sets are identical"
else
  log_warning "Primary key differences detected (missing=$MISSING_IN_TARGET, extra=$EXTRA_IN_TARGET)"
fi

# 3) Simple aggregate checks for numeric columns (optional)
if [[ -n "$NUMERIC_COLUMNS" ]]; then
  IFS="," read -r -a COLS <<< "$NUMERIC_COLUMNS"
  for col in "${COLS[@]}"; do
    col_trimmed="${col// /}"
    if [[ -z "$col_trimmed" ]]; then
      continue
    fi
    log_info "Checking aggregate sums for column '$col_trimmed'"
    SRC_SUM="$(pg_scalar "SELECT COALESCE(SUM(${col_trimmed}), 0) FROM ${SOURCE_TABLE};")"
    TGT_SUM="$(pg_scalar "SELECT COALESCE(SUM(${col_trimmed}), 0) FROM ${TARGET_TABLE};")"
    log_info "Source sum($col_trimmed): $SRC_SUM"
    log_info "Target sum($col_trimmed): $TGT_SUM"
    if [[ "$SRC_SUM" == "$TGT_SUM" ]]; then
      log_success "Sum($col_trimmed) matches"
    else
      log_warning "Sum($col_trimmed) mismatch: source=$SRC_SUM, target=$TGT_SUM"
    fi
  done
fi

log_info "Sync validation completed for $SOURCE_TABLE -> $TARGET_TABLE"