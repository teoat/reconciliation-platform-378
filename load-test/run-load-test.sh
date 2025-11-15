#!/bin/bash
# Run Load Tests with K6
# Tests system scalability under load

set -e

echo "🚀 Starting Load Test..."

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ K6 is not installed"
    echo "Install: brew install k6 (Mac) or visit https://k6.io/docs/getting-started/installation/"
    exit 1
fi

API_URL="${API_URL:-http://localhost:2000}"

echo "Testing API at: $API_URL"
echo ""
echo "Load Test Configuration:"
echo "  - Stage 1: 1K users (2m ramp, 5m hold)"
echo "  - Stage 2: 5K users (2m ramp, 5m hold)"
echo "  - Stage 3: 10K users (2m ramp, 5m hold)"
echo "  - Target: p95 latency < 500ms"
echo "  - Target: Error rate < 1%"
echo ""

# Run load test
echo "🔥 Running load test..."
k6 run --out json=load-test-results.json \
  -e API_URL=$API_URL \
  k6-load-test.js

echo ""
echo "✅ Load test complete!"
echo ""
echo "Results saved to: load-test-results.json"
echo ""

# Summary
if [ -f load-test-results.json ]; then
    echo "📊 Quick Summary:"
    echo "  - Max VUs: $(cat load-test-results.json | grep -o '"max_vus":[0-9]*' | cut -d: -f2)"
    echo "  - Total Requests: $(cat load-test-results.json | grep -o '"http_reqs":[0-9]*' | cut -d: -f2)"
    echo "  - Error Rate: $(cat load-test-results.json | grep -o '"http_req_failed":0\.[0-9]*' | cut -d: -f2)"
    echo ""
fi

echo "📝 Next steps:"
echo "1. Review detailed results in load-test-results.json"
echo "2. Check for bottlenecks"
echo "3. Optimize based on findings"
echo ""

