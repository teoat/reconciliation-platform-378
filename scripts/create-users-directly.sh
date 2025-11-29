#!/bin/bash

# Create Demo Users Directly in Database
# This script creates users directly in the database, bypassing rate limits

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🔧 Creating Demo Users Directly in Database..."
echo ""

cd "$BACKEND_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    exit 1
fi

# Extract database connection info
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Hash passwords using Python (bcrypt)
echo "🔐 Hashing passwords..."
ADMIN_HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw('AdminPassword123!'.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8'))")
MANAGER_HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw('ManagerPassword123!'.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8'))")
USER_HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw('UserPassword123!'.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8'))")

if [ -z "$ADMIN_HASH" ]; then
    echo "❌ ERROR: Failed to hash passwords. Install bcrypt: pip3 install bcrypt"
    exit 1
fi

echo "✅ Passwords hashed"
echo ""

# Create users using psql
echo "👤 Creating admin user..."
psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" <<EOF
INSERT INTO users (
    id, email, password_hash, username, name, first_name, last_name, status,
    email_verified, auth_provider, created_at, updated_at,
    password_expires_at, password_last_changed, password_history,
    is_initial_password, initial_password_set_at
) VALUES (
    gen_random_uuid(),
    'admin@example.com',
    '$ADMIN_HASH',
    NULL,
    'Admin User',
    'Admin',
    'User',
    'admin',
    true,
    'password',
    NOW(),
    NOW(),
    NOW() + INTERVAL '90 days',
    NOW(),
    '[]'::jsonb,
    false,
    NULL
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    updated_at = NOW();
EOF

echo "👤 Creating manager user..."
psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" <<EOF
INSERT INTO users (
    id, email, password_hash, username, name, first_name, last_name, status,
    email_verified, auth_provider, created_at, updated_at,
    password_expires_at, password_last_changed, password_history,
    is_initial_password, initial_password_set_at
) VALUES (
    gen_random_uuid(),
    'manager@example.com',
    '$MANAGER_HASH',
    NULL,
    'Manager User',
    'Manager',
    'User',
    'manager',
    true,
    'password',
    NOW(),
    NOW(),
    NOW() + INTERVAL '90 days',
    NOW(),
    '[]'::jsonb,
    false,
    NULL
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    updated_at = NOW();
EOF

echo "👤 Creating regular user..."
psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" <<EOF
INSERT INTO users (
    id, email, password_hash, username, name, first_name, last_name, status,
    email_verified, auth_provider, created_at, updated_at,
    password_expires_at, password_last_changed, password_history,
    is_initial_password, initial_password_set_at
) VALUES (
    gen_random_uuid(),
    'user@example.com',
    '$USER_HASH',
    NULL,
    'Demo User',
    'Demo',
    'User',
    'user',
    true,
    'password',
    NOW(),
    NOW(),
    NOW() + INTERVAL '90 days',
    NOW(),
    '[]'::jsonb,
    false,
    NULL
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    updated_at = NOW();
EOF

echo ""
echo "✅ All demo users created!"
echo ""
echo "📋 Demo Credentials:"
echo "   Admin:   admin@example.com / AdminPassword123!"
echo "   Manager: manager@example.com / ManagerPassword123!"
echo "   User:    user@example.com / UserPassword123!"
echo ""

