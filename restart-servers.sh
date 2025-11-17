#!/bin/bash

# Restart Frontend and Backend Servers for Google OAuth
# This script will stop existing servers and restart them with new environment variables

echo "🔄 Restarting servers to load Google OAuth configuration..."
echo ""

# Stop frontend (port 1000)
echo "⏹️  Stopping frontend on port 1000..."
FRONTEND_PID=$(lsof -ti:1000 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
    echo "   Found process: $FRONTEND_PID"
    kill $FRONTEND_PID 2>/dev/null
    sleep 2
    echo "   ✅ Frontend stopped"
else
    echo "   ℹ️  No frontend process found on port 1000"
fi

# Stop backend (port 2000)
echo "⏹️  Stopping backend on port 2000..."
BACKEND_PID=$(lsof -ti:2000 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
    echo "   Found process: $BACKEND_PID"
    kill $BACKEND_PID 2>/dev/null
    sleep 2
    echo "   ✅ Backend stopped"
else
    echo "   ℹ️  No backend process found on port 2000"
fi

echo ""
echo "🚀 Starting servers..."
echo ""

# Start backend in background
echo "📦 Starting backend..."
cd "$(dirname "$0")/backend"
cargo run > ../backend.log 2>&1 &
BACKEND_NEW_PID=$!
echo "   Backend started (PID: $BACKEND_NEW_PID)"
echo "   Logs: backend/backend.log"
sleep 3

# Start frontend in background
echo "🌐 Starting frontend..."
cd "$(dirname "$0")/frontend"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_NEW_PID=$!
echo "   Frontend started (PID: $FRONTEND_NEW_PID)"
echo "   Logs: frontend/frontend.log"
sleep 3

echo ""
echo "✅ Servers restarted!"
echo ""
echo "⏳ Waiting 10 seconds for servers to start..."
sleep 10

echo ""
echo "🔍 Verifying setup..."
echo ""

# Check if verification script exists and run it
if [ -f "$(dirname "$0")/verify-google-oauth.sh" ]; then
    "$(dirname "$0")/verify-google-oauth.sh"
    VERIFY_EXIT=$?
    echo ""
else
    echo "⚠️  Verification script not found, using basic checks..."
    if lsof -ti:1000 > /dev/null 2>&1; then
        echo "✅ Frontend is running"
    else
        echo "❌ Frontend is not running"
    fi
    if lsof -ti:2000 > /dev/null 2>&1; then
        echo "✅ Backend is running"
    else
        echo "❌ Backend is not running"
    fi
    VERIFY_EXIT=0
fi

echo ""
echo "📋 Next steps:"
echo "   1. Visit: http://localhost:1000/login"
echo "   2. Look for Google Sign-In button"
echo "   3. Test authentication flow"
echo ""
echo "📝 Check logs if needed:"
echo "   - Backend: tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "🔍 Run verification again:"
echo "   ./verify-google-oauth.sh"
echo ""

