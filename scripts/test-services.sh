#!/bin/bash
# Quick test script for database and Redis

echo "🧪 Testing Services..."
echo "======================"
echo ""

echo "1️⃣ Testing PostgreSQL Database..."
docker exec reconciliation-postgres psql -U reconciliation_user -d reconciliation_app -c "SELECT version();"

echo ""
echo "2️⃣ Showing Database Tables..."
docker exec reconciliation-postgres psql -U reconciliation_user -d reconciliation_app -c "\dt"

echo ""
echo "3️⃣ Testing Redis..."
docker exec reconciliation-redis redis-cli ping

echo ""
echo "4️⃣ Checking Redis Info..."
docker exec reconciliation-redis redis-cli info server | head -10

echo ""
echo "✅ Tests Complete!"

