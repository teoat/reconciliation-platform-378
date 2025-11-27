#!/bin/bash
# Script to clear Cargo build locks and kill stuck processes

echo "🔧 Clearing Cargo build locks..."

# Kill all cargo processes (except cargo itself if needed)
echo "Killing cargo processes..."
pkill -f "cargo (run|test|check|build)" 2>/dev/null
sleep 1

# Remove lock file if it exists
if [ -f "target/debug/.cargo-lock" ]; then
    echo "Removing lock file..."
    rm -f target/debug/.cargo-lock
fi

# Also check for other lock locations
if [ -f "target/.cargo-lock" ]; then
    echo "Removing target lock file..."
    rm -f target/.cargo-lock
fi

echo "✅ Done! You can now run: cargo run"

