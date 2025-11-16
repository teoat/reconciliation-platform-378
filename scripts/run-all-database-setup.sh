#!/bin/bash
# Complete database setup script
# Runs all database setup tasks: migrations, indexes, verification

set -e

echo "🗄️  Complete Database Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database configuration
DEV_DB="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
TEST_DB="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"

# Check if database is running
echo -e "${YELLOW}📋 Checking database status...${NC}"
if ! docker ps | grep -q reconciliation-postgres; then
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    echo "   Start it with: ./scripts/start-database.sh test"
    exit 1
fi
echo -e "${GREEN}✅ Database container is running${NC}"
echo ""

# Function to run migrations
run_migrations() {
    local db_name=$1
    local db_url=$2
    
    echo -e "${YELLOW}🔄 Running migrations for $db_name...${NC}"
    cd "$(dirname "$0")/../backend" || exit 1
    
    export DATABASE_URL="$db_url"
    
    if diesel migration run 2>&1; then
        echo -e "${GREEN}✅ Migrations applied to $db_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Some migrations may have failed (check output above)${NC}"
    fi
    echo ""
}

# Function to verify tables
verify_tables() {
    local db_name=$1
    
    echo -e "${YELLOW}📊 Verifying tables in $db_name...${NC}"
    local tables=$(docker exec reconciliation-postgres psql -U postgres -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$tables" ] && [ "$tables" -gt 0 ]; then
        echo -e "${GREEN}✅ Found $tables table(s) in $db_name${NC}"
        docker exec reconciliation-postgres psql -U postgres -d "$db_name" -c "\dt" 2>&1 | grep -v "Did not find" || true
    else
        echo -e "${YELLOW}⚠️  No tables found in $db_name${NC}"
    fi
    echo ""
}

# Run migrations for both databases
run_migrations "development" "$DEV_DB"
run_migrations "test" "$TEST_DB"

# Verify tables
verify_tables "reconciliation_app"
verify_tables "reconciliation_test"

# Check migration status
echo -e "${YELLOW}📋 Migration Status:${NC}"
echo ""
echo "Development Database:"
cd "$(dirname "$0")/../backend" || exit 1
export DATABASE_URL="$DEV_DB"
diesel migration list 2>&1 | grep -E "\[|Migrations" || true
echo ""

echo "Test Database:"
export DATABASE_URL="$TEST_DB"
diesel migration list 2>&1 | grep -E "\[|Migrations" || true
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Connection Strings:"
echo "  Development: $DEV_DB"
echo "  Test:        $TEST_DB"
echo ""
echo "Next steps:"
echo "  1. Run tests: cd backend && export DATABASE_URL=\"$TEST_DB\" && cargo test"
echo "  2. Start backend: cd backend && export DATABASE_URL=\"$DEV_DB\" && cargo run"

