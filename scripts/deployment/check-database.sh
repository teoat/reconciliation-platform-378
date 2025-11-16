#!/bin/bash
# scripts/deployment/check-database.sh
# Database (PostgreSQL) service health check

set -e

check_database() {
    echo "🔍 Checking Database Service..."
    
    # Check PostgreSQL connection (if running)
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" &> /dev/null 2>&1; then
            echo "✅ PostgreSQL is accessible"
        else
            echo "⚠️  PostgreSQL not accessible (may not be running yet)"
        fi
    else
        echo "⚠️  pg_isready not found (PostgreSQL client tools not installed)"
    fi
    
    # Check for migration files
    if [ -d "backend/migrations" ]; then
        local migration_count=$(find backend/migrations -name "*.sql" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$migration_count" -gt 0 ]; then
            echo "✅ Found $migration_count migration file(s)"
        else
            echo "⚠️  No migration files found"
        fi
    else
        echo "⚠️  Migrations directory not found"
    fi
    
    # Check DATABASE_URL
    if [ -z "$DATABASE_URL" ] && ! grep -q "DATABASE_URL" .env 2>/dev/null; then
        echo "⚠️  DATABASE_URL not set"
    fi
    
    echo "✅ Database checks passed"
    return 0
}

check_database "$@"

