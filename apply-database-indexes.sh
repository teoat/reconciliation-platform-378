#!/bin/bash
# Apply database performance indexes
# This script applies performance indexes to the database

set -e

echo "🔧 Applying database performance indexes..."
echo ""

# Get database connection from docker-compose
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-reconciliation_app}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "📊 Connecting to: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Check if running in Docker or locally
if command -v docker &> /dev/null && docker ps | grep -q reconciliation-postgres; then
    echo "Using Docker container..."
    
    # Apply indexes via Docker
    docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" <<'EOF'
-- Performance indexes for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_project_id ON reconciliation_records(project_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_status ON reconciliation_records(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_created_at ON reconciliation_records(created_at);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_updated_at ON reconciliation_records(updated_at);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_project_status ON reconciliation_records(project_id, status);

-- Performance indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Performance indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Performance indexes for password entries
CREATE INDEX IF NOT EXISTS idx_password_entries_user_id ON password_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_password_entries_created_at ON password_entries(created_at);

-- Show created indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%' 
ORDER BY tablename, indexname;
EOF
    
    echo ""
    echo "✅ Performance indexes applied successfully!"
else
    echo "⚠️  Docker container not found. Please run this script when services are deployed."
    exit 1
fi

echo ""
echo "📈 Impact: Expected 2-5x improvement in query performance"
echo "🎯 Done!"

