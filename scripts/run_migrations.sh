#!/bin/bash
# Database Migration Script
# Runs all database migrations including shard setup

set -e

echo "📊 Running database migrations..."

# Set working directory
cd "$(dirname "$0")/.."

# Check if diesel is installed
if ! command -v diesel &> /dev/null; then
    echo "❌ Diesel CLI not found. Installing..."
    cargo install diesel_cli --no-default-features --features postgres
fi

# Run migrations on primary database
echo ""
echo "Running migrations on primary database..."
cd backend
diesel migration run

# Check if shards are configured
if [ -n "$DATABASE_SHARD_COUNT" ]; then
    echo ""
    echo "Running migrations on ${DATABASE_SHARD_COUNT} shards..."
    
    for i in $(seq 1 $DATABASE_SHARD_COUNT); do
        env_var="DATABASE_SHARD_${i}_URL"
        if [ -n "${!env_var}" ]; then
            echo "Migrating shard ${i}..."
            DATABASE_URL="${!env_var}" diesel migration run
        fi
    done
fi

echo ""
echo "✅ All migrations completed successfully!"

