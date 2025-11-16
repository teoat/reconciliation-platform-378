#!/bin/bash
# Quick memory monitoring script for Logstash

LOGSTASH_URL="http://localhost:9600"
THRESHOLD_WARNING=80
THRESHOLD_CRITICAL=90

echo "Logstash Memory Monitor"
echo "======================"
echo ""

# Get stats
STATS=$(curl -sf "${LOGSTASH_URL}/_node/stats" 2>/dev/null)

if [ -z "$STATS" ]; then
    echo "ERROR: Cannot connect to Logstash API"
    exit 1
fi

# Extract metrics
HEAP_PERCENT=$(echo "$STATS" | jq -r '.jvm.mem.heap_used_percent // 0')
MEM_USAGE=$(docker stats reconciliation-logstash --no-stream --format "{{.MemUsage}}" 2>/dev/null)

echo "JVM Heap Usage: ${HEAP_PERCENT}%"
echo "Container Memory: ${MEM_USAGE}"
echo ""

# Check thresholds
if (( $(echo "$HEAP_PERCENT > $THRESHOLD_CRITICAL" | bc -l 2>/dev/null || echo "0") )); then
    echo "⚠️  CRITICAL: Heap usage is ${HEAP_PERCENT}% (threshold: ${THRESHOLD_CRITICAL}%)"
    exit 2
elif (( $(echo "$HEAP_PERCENT > $THRESHOLD_WARNING" | bc -l 2>/dev/null || echo "0") )); then
    echo "⚠️  WARNING: Heap usage is ${HEAP_PERCENT}% (threshold: ${THRESHOLD_WARNING}%)"
    exit 1
else
    echo "✅ Heap usage is within acceptable range"
    exit 0
fi
