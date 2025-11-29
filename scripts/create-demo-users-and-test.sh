#!/bin/bash

# Create Demo Users and Test Authentication Script
# This script creates demo users and tests the authentication flow

set -e

API_URL="http://localhost:2000/api"
ORIGIN="http://localhost:5173"

echo "🧪 Creating Demo Users and Testing Authentication"
echo "=================================================="
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
MAX_WAIT=30
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:2000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "❌ Backend is not ready. Please start it first:"
    echo "   cd backend && cargo run --bin reconciliation-backend"
    exit 1
fi

# Test health endpoint
echo ""
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s http://localhost:2000/health)
if echo "$HEALTH" | grep -q "Identity verification failed"; then
    echo "   ❌ ERROR: Still getting 'Identity verification failed'"
    echo "   The backend needs to be restarted with the zero-trust fix"
    exit 1
else
    echo "   ✅ Health endpoint working"
fi

# Create admin user
echo ""
echo "2️⃣  Creating admin user..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }')

if echo "$ADMIN_RESPONSE" | grep -q "Identity verification failed"; then
    echo "   ❌ ERROR: Registration blocked by zero-trust"
    exit 1
elif echo "$ADMIN_RESPONSE" | grep -q "already exists"; then
    echo "   ℹ️  Admin user already exists (skipped)"
else
    echo "   ✅ Admin user created"
fi

# Create manager user
echo ""
echo "3️⃣  Creating manager user..."
MANAGER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d '{
    "email": "manager@example.com",
    "password": "ManagerPassword123!",
    "first_name": "Manager",
    "last_name": "User",
    "role": "manager"
  }')

if echo "$MANAGER_RESPONSE" | grep -q "already exists"; then
    echo "   ℹ️  Manager user already exists (skipped)"
else
    echo "   ✅ Manager user created"
fi

# Create regular user
echo ""
echo "4️⃣  Creating regular user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d '{
    "email": "user@example.com",
    "password": "UserPassword123!",
    "first_name": "Demo",
    "last_name": "User",
    "role": "user"
  }')

if echo "$USER_RESPONSE" | grep -q "already exists"; then
    echo "   ℹ️  User already exists (skipped)"
else
    echo "   ✅ Regular user created"
fi

# Test login
echo ""
echo "5️⃣  Testing login with admin credentials..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "   ✅ Login successful!"
    echo "   Token received: $(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -c 20)..."
else
    echo "   ❌ Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ All demo users created and authentication tested!"
echo ""
echo "📋 Demo Credentials:"
echo "   Admin:   admin@example.com / AdminPassword123!"
echo "   Manager: manager@example.com / ManagerPassword123!"
echo "   User:    user@example.com / UserPassword123!"
echo ""
echo "🌐 Test in browser: http://localhost:5173/login"
echo ""


