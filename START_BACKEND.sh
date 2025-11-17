#!/bin/bash

# Script to start backend with correct PostgreSQL library path

cd "$(dirname "$0")/backend"

# Set PostgreSQL library path
export DYLD_LIBRARY_PATH=/usr/local/Cellar/postgresql@15/15.15/lib:/opt/homebrew/lib:$DYLD_LIBRARY_PATH

# Also try common locations
if [ ! -f "/usr/local/Cellar/postgresql@15/15.15/lib/libpq.5.dylib" ]; then
    # Try to find libpq
    LIBPQ_PATH=$(find /opt/homebrew /usr/local -name "libpq.5.dylib" 2>/dev/null | head -1)
    if [ -n "$LIBPQ_PATH" ]; then
        export DYLD_LIBRARY_PATH=$(dirname "$LIBPQ_PATH"):$DYLD_LIBRARY_PATH
    fi
fi

echo "🚀 Starting backend..."
echo "📋 Library path: $DYLD_LIBRARY_PATH"
cargo run

