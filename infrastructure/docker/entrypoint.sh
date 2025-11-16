#!/bin/sh
set -e

# Print environment for debugging
echo "🚀 Starting backend with environment:" >&2
if [ -n "$DATABASE_URL" ]; then
    DB_PREVIEW=$(echo "$DATABASE_URL" | cut -c1-50)
    echo "  DATABASE_URL: ${DB_PREVIEW}..." >&2
else
    echo "  DATABASE_URL: (not set)" >&2
fi
if [ -n "$REDIS_URL" ]; then
    REDIS_PREVIEW=$(echo "$REDIS_URL" | cut -c1-50)
    echo "  REDIS_URL: ${REDIS_PREVIEW}..." >&2
else
    echo "  REDIS_URL: (not set)" >&2
fi
echo "  HOST: ${HOST:-not set}" >&2
echo "  PORT: ${PORT:-not set}" >&2
if [ -n "$JWT_SECRET" ]; then
    echo "  JWT_SECRET: SET" >&2
else
    echo "  JWT_SECRET: (not set)" >&2
fi
echo "  JWT_EXPIRATION: ${JWT_EXPIRATION:-not set}" >&2
echo "  RUST_LOG: ${RUST_LOG:-not set}" >&2
echo "  RUST_BACKTRACE: ${RUST_BACKTRACE:-not set}" >&2

# Ensure binary exists and is executable
if [ ! -f /app/reconciliation-backend ]; then
    echo "❌ Error: Binary not found at /app/reconciliation-backend" >&2
    exit 1
fi

if [ ! -x /app/reconciliation-backend ]; then
    echo "❌ Error: Binary is not executable" >&2
    exit 1
fi

echo "✅ Binary found and executable" >&2

# Run the backend with explicit output redirection
echo "▶️  Executing binary..." >&2
exec /app/reconciliation-backend 2>&1

