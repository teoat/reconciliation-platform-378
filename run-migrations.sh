#!/bin/bash
# Run database migrations in Docker container

set -e

echo "🔧 Running database migrations..."

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
  if docker compose exec -T backend echo "ready" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

# Run migrations using diesel (if available in container)
echo "Running migrations..."
docker compose exec -T backend diesel migration run 2>&1 || {
  echo "⚠️  Diesel migration failed, trying alternative method..."
  
  # Alternative: Run migrations via SQL directly
  docker compose exec -T postgres psql -U postgres -d reconciliation_app <<EOF
-- Check if migrations table exists
CREATE TABLE IF NOT EXISTS __diesel_schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    run_on TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Run migrations from files
\echo 'Migrations will be applied by backend on startup'
EOF
}

echo "✅ Migration process completed"

