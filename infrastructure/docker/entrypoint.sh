#!/bin/sh
set -e

# Print environment for debugging
echo "🚀 Starting backend with environment:" >&2
echo "  DATABASE_URL: ${DATABASE_URL:0:50}..." >&2
echo "  REDIS_URL: ${REDIS_URL:0:50}..." >&2
echo "  HOST: $HOST" >&2
echo "  PORT: $PORT" >&2
echo "  JWT_SECRET: ${JWT_SECRET:+SET}" >&2
echo "  JWT_EXPIRATION: $JWT_EXPIRATION" >&2
echo "  RUST_LOG: $RUST_LOG" >&2
echo "  RUST_BACKTRACE: $RUST_BACKTRACE" >&2

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

# Run the backend with explicit output
exec /app/reconciliation-backend

