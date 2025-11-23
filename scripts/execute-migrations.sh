#!/bin/bash
# Execute Database Migrations Script
# Runs all pending database migrations with proper error handling

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "📊 Executing Database Migrations..."

# Set working directory
cd "$SCRIPT_DIR/.."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    echo "💡 Set DATABASE_URL before running migrations:"
    echo "   export DATABASE_URL='postgres://user:password@localhost:5432/database'"
    exit 1
fi

# Check if diesel is installed
if ! command -v diesel &> /dev/null; then
    log_warning "Diesel CLI not found. Installing..."
    cargo install diesel_cli --no-default-features --features postgres
    log_success "Diesel CLI installed"
fi

# Navigate to backend directory
cd backend

# Check if migrations directory exists
if [ ! -d "migrations" ]; then
    log_error "Migrations directory not found: backend/migrations"
    exit 1
fi

log_info "Running migrations on database: ${DATABASE_URL%%@*}" # Mask password

# Run migrations
if diesel migration run; then
    log_success "✅ All migrations completed successfully!"
    
    # List applied migrations
    echo ""
    log_info "Applied migrations:"
    diesel migration list
    
    # Verify critical tables exist
    echo ""
    log_info "Verifying critical tables..."
    if psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'projects', 'reconciliation_jobs', 'reconciliation_results');" 2>/dev/null | grep -q "4"; then
        log_success "✅ All critical tables exist"
    else
        log_warning "⚠️  Some critical tables may be missing. Check migration output above."
    fi
else
    log_error "❌ Migration failed"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check database connection: psql \$DATABASE_URL -c 'SELECT 1;'"
    echo "2. Verify DATABASE_URL is correct"
    echo "3. Check migration files in backend/migrations/"
    echo "4. Review error messages above"
    exit 1
fi

echo ""
log_success "🎉 Migration execution complete!"


