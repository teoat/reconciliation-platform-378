#!/bin/bash
# Apply database query optimization indexes
# This script applies the performance indexes for S-grade query performance

set -e

echo "🚀 Applying Database Query Optimization Indexes..."
echo ""

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    echo "   Set it with: export DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'"
    exit 1
fi

echo "📊 Database: ${DATABASE_URL}"
echo ""

# Check if migration file exists
MIGRATION_FILE="backend/migrations/20250102000000_add_performance_indexes.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ ERROR: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Applying migration: $MIGRATION_FILE"
echo ""

# Apply the migration
if psql "$DATABASE_URL" < "$MIGRATION_FILE" 2>&1; then
    echo ""
    echo "✅ Performance indexes applied successfully!"
    echo ""
    
    # Show index statistics
    echo "📈 Query Performance Indexes:"
    psql "$DATABASE_URL" <<EOF
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname
LIMIT 20;
EOF
    
    echo ""
    echo "🎯 Performance Target: P95 query time <50ms"
    echo "📊 Run queries in README-QUERY-OPTIMIZATION.md to verify performance"
    echo ""
    echo "✅ Done!"
else
    echo ""
    echo "❌ Failed to apply indexes"
    exit 1
fi

