#!/bin/bash

# Start Backend and Test Script
# This script starts the backend and waits for it to be ready, then tests it

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🚀 Starting Backend Server..."
echo ""

cd "$BACKEND_DIR"

# Start backend in background
echo "🔨 Building and starting backend..."
cargo run > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start (PID: $BACKEND_PID)..."
echo "   (This may take 30-60 seconds)"

# Wait for backend to be ready
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:2000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo "   Still waiting... ($WAITED/$MAX_WAIT seconds)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "❌ Backend did not start in time"
    echo "   Check logs: tail -f /tmp/backend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🧪 Testing backend..."
echo ""

# Test health endpoint
echo "1. Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:2000/health)
if echo "$HEALTH_RESPONSE" | grep -q "Identity verification failed"; then
    echo "   ❌ Still getting identity verification error"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "   ✅ Health endpoint working"
fi

# Test registration
echo ""
echo "2. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"admin@example.com","password":"AdminPassword123!","first_name":"Admin","last_name":"User","role":"admin"}')

if echo "$REGISTER_RESPONSE" | grep -q "Identity verification failed"; then
    echo "   ❌ Still getting identity verification error"
    echo "   Response: $REGISTER_RESPONSE"
else
    echo "   ✅ Registration endpoint working"
    echo "   Response: $REGISTER_RESPONSE" | head -c 200
    echo ""
fi

echo ""
echo "✅ Backend is running (PID: $BACKEND_PID)"
echo "   Logs: tail -f /tmp/backend.log"
echo "   To stop: kill $BACKEND_PID"
echo ""


