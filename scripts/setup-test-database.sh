#!/bin/bash
# Setup test database for backend tests
# Usage: ./scripts/setup-test-database.sh

set -e

echo "🧪 Setting up test database..."

# Check if database is running
if ! docker ps | grep -q reconciliation-postgres; then
    echo "❌ PostgreSQL container is not running"
    echo "   Start it with: ./scripts/start-database.sh test"
    exit 1
fi

# Database connection details
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres_pass"
DB_NAME="reconciliation_test"

# Create test database
echo "📦 Creating test database: $DB_NAME"
docker exec -i reconciliation-postgres psql -U $DB_USER <<EOF
-- Create test database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Connect to test database and set up extensions
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

echo "✅ Test database created!"

# Set environment variable for tests
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
export TEST_DATABASE_URL="$DATABASE_URL"

echo ""
echo "📋 Test Database Configuration:"
echo "   DATABASE_URL=$DATABASE_URL"
echo ""
echo "💡 To run tests:"
echo "   export DATABASE_URL=\"$DATABASE_URL\""
echo "   cd backend && cargo test"
echo ""
echo "💡 Or use the test database URL:"
echo "   export TEST_DATABASE_URL=\"$DATABASE_URL\""

