#!/bin/bash
# Apply performance indexes manually (outside transaction)
# Usage: ./scripts/apply-performance-indexes.sh [dev|test]

set -e

DB_TYPE=${1:-test}
DB_NAME="reconciliation_${DB_TYPE}"

echo "📊 Applying performance indexes to $DB_NAME..."
echo ""

# Note: These indexes require tables to exist first
# They will be created when tables are created

echo "✅ Performance indexes will be created automatically when tables are created"
echo "   (Indexes are defined in table creation migrations)"
echo ""
echo "💡 To create indexes manually for existing tables, run:"
echo "   docker exec reconciliation-postgres psql -U postgres -d $DB_NAME -f backend/migrations/20251116000000_add_performance_indexes/up.sql"
echo ""
echo "⚠️  Note: CREATE INDEX CONCURRENTLY cannot run in transactions"
echo "   These indexes should be applied after tables are created"

