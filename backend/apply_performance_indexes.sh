#!/usr/bin/env bash
set -euo pipefail

echo "Applying performance indexes migration..."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set. Export DATABASE_URL and rerun."
  exit 1
fi

MIGRATION_FILE="migrations/20250102000000_add_performance_indexes.sql"

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "ERROR: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

psql "$DATABASE_URL" < "$MIGRATION_FILE"

echo "✅ Performance indexes applied."


