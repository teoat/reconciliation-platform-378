#!/bin/bash
# Monitor Deployment Metrics
# Continuously monitors deployment health and metrics

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

API_BASE_URL="${API_BASE_URL:-http://localhost:2000}"
MONITOR_INTERVAL="${MONITOR_INTERVAL:-30}"

echo "📊 Starting Deployment Monitoring..."
echo "API Base URL: $API_BASE_URL"
echo "Monitor Interval: ${MONITOR_INTERVAL}s"
echo ""

while true; do
    echo "=========================================="
    echo "📊 Metrics Snapshot - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    
    # Health check
    echo ""
    echo "🏥 Health Status:"
    if health_response=$(curl -s -f "$API_BASE_URL/api/health" 2>/dev/null); then
        echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
    else
        echo "❌ Health check failed"
    fi
    
    # Metrics summary
    echo ""
    echo "📈 Metrics Summary:"
    if metrics_response=$(curl -s -f "$API_BASE_URL/api/metrics/summary" 2>/dev/null); then
        echo "$metrics_response" | jq '.' 2>/dev/null || echo "$metrics_response"
    else
        echo "⚠️  Metrics not available"
    fi
    
    # Metrics health
    echo ""
    echo "💚 Metrics Health:"
    if metrics_health=$(curl -s -f "$API_BASE_URL/api/metrics/health" 2>/dev/null); then
        echo "$metrics_health" | jq '.' 2>/dev/null || echo "$metrics_health"
    else
        echo "⚠️  Metrics health not available"
    fi
    
    echo ""
    echo "Sleeping for ${MONITOR_INTERVAL}s..."
    echo ""
    
    sleep "$MONITOR_INTERVAL"
done
