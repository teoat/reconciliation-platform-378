#!/bin/bash

# Seed Demo Users Script (Shell Version)
# This script creates demo users using curl

API_BASE_URL="${VITE_API_URL:-http://localhost:2000/api}"
REGISTER_ENDPOINT="${API_BASE_URL}/auth/register"

echo "🌱 Seeding Demo Users..."
echo ""
echo "API URL: ${API_BASE_URL}"
echo ""

# Check backend health
echo "Checking backend health..."
if curl -s -f "${API_BASE_URL%/api}/health" > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running or not accessible!"
    echo "   Please ensure the backend is running at ${API_BASE_URL%/api}"
    echo "   Start the backend with: cd backend && cargo run"
    exit 1
fi
echo ""

# Function to create a user
create_user() {
    local email=$1
    local password=$2
    local first_name=$3
    local last_name=$4
    local role=$5
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "${REGISTER_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${email}\",
            \"password\": \"${password}\",
            \"first_name\": \"${first_name}\",
            \"last_name\": \"${last_name}\",
            \"role\": \"${role}\"
        }" 2>&1)
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        echo "✅ Created ${role} user: ${email}"
        return 0
    elif [ "$http_code" = "409" ] || echo "$body" | grep -q "already exists"; then
        echo "ℹ️  User already exists: ${email} (skipped)"
        return 0
    else
        echo "❌ Failed to create ${role} user: ${email}"
        echo "   HTTP Code: ${http_code}"
        echo "   Response: ${body}"
        return 1
    fi
}

# Create demo users
echo "Results:"
echo "────────────────────────────────────────────────────────────"

create_user "admin@example.com" "AdminPassword123!" "Admin" "User" "admin"
create_user "manager@example.com" "ManagerPassword123!" "Manager" "User" "manager"
create_user "user@example.com" "UserPassword123!" "Demo" "User" "user"

echo "────────────────────────────────────────────────────────────"
echo ""
echo "✨ Demo users seeding complete!"
echo ""
echo "You can now:"
echo "  1. Go to http://localhost:1000/login"
echo "  2. Use the demo credentials section to auto-fill and login"
echo "  3. Or use the \"Quick Login with Demo Account\" button"
echo ""

