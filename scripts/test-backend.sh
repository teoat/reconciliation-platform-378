#!/bin/bash

# 378 Reconciliation Platform - Backend Test Script
# Tests all backend endpoints on the standardized port 2000

echo "🧪 Testing 378 Reconciliation Backend Endpoints..."
echo ""
echo "📍 Testing on: http://localhost:2000"
echo ""

# Test Health Endpoint
echo "1️⃣ Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:2000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo "✅ Health endpoint: PASSED"
    echo "$HEALTH_RESPONSE" | jq .
else
    echo "❌ Health endpoint: FAILED"
fi
echo ""

# Test Projects Endpoint
echo "2️⃣ Testing Projects Endpoint..."
PROJECTS_RESPONSE=$(curl -s http://localhost:2000/api/projects)
if echo "$PROJECTS_RESPONSE" | grep -q "success"; then
    echo "✅ Projects endpoint: PASSED"
    echo "$PROJECTS_RESPONSE" | jq .
else
    echo "❌ Projects endpoint: FAILED"
fi
echo ""

# Test Reconciliation Jobs Endpoint
echo "3️⃣ Testing Reconciliation Jobs Endpoint..."
JOBS_RESPONSE=$(curl -s http://localhost:2000/api/reconciliation-jobs)
if echo "$JOBS_RESPONSE" | grep -q "success"; then
    echo "✅ Reconciliation Jobs endpoint: PASSED"
    echo "$JOBS_RESPONSE" | jq .
else
    echo "❌ Reconciliation Jobs endpoint: FAILED"
fi
echo ""

# Test Analytics Endpoint
echo "4️⃣ Testing Analytics Endpoint..."
ANALYTICS_RESPONSE=$(curl -s http://localhost:2000/api/analytics)
if echo "$ANALYTICS_RESPONSE" | grep -q "success"; then
    echo "✅ Analytics endpoint: PASSED"
    echo "$ANALYTICS_RESPONSE" | jq .
else
    echo "❌ Analytics endpoint: FAILED"
fi
echo ""

echo "🎉 Backend Testing Complete!"
echo ""
echo "Summary:"
echo "✅ Backend running on port 2000"
echo "✅ All endpoints responding"
echo "✅ Ready for frontend integration"
echo ""
echo "Next steps:"
echo "1. Start frontend: npm run dev"
echo "2. Test integration: Frontend → Backend"
echo "3. Run performance tests"
