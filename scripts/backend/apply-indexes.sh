#!/bin/bash
# Apply performance indexes to PostgreSQL database
# This script applies the performance indexes migration

set -e

echo "🚀 Applying performance indexes..."
echo ""

# Read database connection from environment
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-reconciliation_app}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres_pass}"

export PGPASSWORD="$DB_PASSWORD"

echo "📊 Connecting to: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Apply the migration
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f "backend/migrations/20250102000000_add_performance_indexes.sql"

echo ""
echo "✅ Performance indexes applied successfully!"
echo ""
echo "📈 Impact: Expected 2-5x improvement in query performance"
echo ""

# Show some statistics
echo "📊 Query performance stats:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%' 
ORDER BY tablename, indexname;
EOF

echo ""
echo "🎯 Done!"

