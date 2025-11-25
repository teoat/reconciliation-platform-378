#!/bin/bash
# Script to apply auth_provider migration
# Requires database admin access

set -e

echo "Applying auth_provider migration..."

# Try to detect database connection method
if command -v psql &> /dev/null; then
    # Check if we can connect as postgres
    if sudo -u postgres psql -l &> /dev/null; then
        echo "Using postgres superuser..."
        sudo -u postgres psql -d reconciliation_app -f backend/migrations/20250125000000_add_auth_provider_to_users.sql
    else
        echo "Attempting with application user..."
        cd backend
        source .env 2>/dev/null || true
        PGPASSWORD="${DATABASE_URL##*:}" psql "$DATABASE_URL" -f migrations/20250125000000_add_auth_provider_to_users.sql || {
            echo ""
            echo "⚠️  Permission denied. Please run as database superuser:"
            echo "   sudo -u postgres psql -d reconciliation_app -f backend/migrations/20250125000000_add_auth_provider_to_users.sql"
            exit 1
        }
    fi
else
    echo "psql not found. Please apply migration manually."
    exit 1
fi

echo "✅ Migration applied successfully!"
