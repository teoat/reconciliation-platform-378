#!/bin/sh
# Don't exit on error - let the binary handle its own errors
set +e

# Set unbuffered output for immediate log visibility
# This ensures logs appear immediately in Docker output
export RUST_LOG_STYLE=always
export RUST_BACKTRACE=${RUST_BACKTRACE:-full}

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

# Run the backend with unbuffered output
# Use exec to replace shell - this ensures signals are handled correctly
# Redirect stderr to stdout for Docker log capture, but keep them unbuffered
# The binary writes to both stdout and stderr, Docker captures both
echo "▶️  Executing binary with unbuffered output..." >&2
# Check if JWT_REFRESH_SECRET is set
if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ ERROR: JWT_REFRESH_SECRET is not set!" >&2
    echo "   This is a required environment variable." >&2
    exit 1
fi
echo "✅ JWT_REFRESH_SECRET is set" >&2

# Set default HOST and PORT if not set
export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-2000}

echo "About to execute binary..." >&2
echo "  HOST: $HOST" >&2
echo "  PORT: $PORT" >&2

# Use exec to replace shell process (proper signal handling)
# This ensures the binary receives signals correctly
exec /app/reconciliation-backend

