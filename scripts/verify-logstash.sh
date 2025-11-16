#!/bin/bash
# Logstash Verification Script
# Verifies Logstash connectivity, health, and functionality

set -e

CONTAINER_NAME="reconciliation-logstash"
LOGSTASH_HOST="logstash"
LOGSTASH_PORT_5044=5044
LOGSTASH_PORT_9600=9600

echo "=========================================="
echo "Logstash Verification Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# 1. Check if container is running
echo "1. Checking container status..."
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_status 0 "Container '${CONTAINER_NAME}' is running"
    CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' ${CONTAINER_NAME})
    echo "   Status: ${CONTAINER_STATUS}"
else
    print_status 1 "Container '${CONTAINER_NAME}' is not running"
    exit 1
fi
echo ""

# 2. Check health check status
echo "2. Checking health check status..."
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null || echo "none")
if [ "$HEALTH_STATUS" = "healthy" ]; then
    print_status 0 "Health check: ${HEALTH_STATUS}"
elif [ "$HEALTH_STATUS" = "starting" ]; then
    echo -e "${YELLOW}⚠${NC} Health check: ${HEALTH_STATUS} (may still be initializing)"
else
    print_status 1 "Health check: ${HEALTH_STATUS}"
fi
echo ""

# 3. Verify Port 5044 (Beats Input) is listening
echo "3. Verifying Port 5044 (Beats Input)..."
if docker exec ${CONTAINER_NAME} netstat -tlnp 2>/dev/null | grep -q ":${LOGSTASH_PORT_5044}"; then
    print_status 0 "Port 5044 is listening (Beats input ready)"
    LISTENING=$(docker exec ${CONTAINER_NAME} netstat -tlnp 2>/dev/null | grep ":${LOGSTASH_PORT_5044}")
    echo "   ${LISTENING}"
else
    print_status 1 "Port 5044 is not listening"
fi
echo ""

# 4. Verify Port 9600 (HTTP API) is listening
echo "4. Verifying Port 9600 (HTTP API)..."
if docker exec ${CONTAINER_NAME} netstat -tlnp 2>/dev/null | grep -q ":${LOGSTASH_PORT_9600}"; then
    print_status 0 "Port 9600 is listening (HTTP API ready)"
    LISTENING=$(docker exec ${CONTAINER_NAME} netstat -tlnp 2>/dev/null | grep ":${LOGSTASH_PORT_9600}")
    echo "   ${LISTENING}"
else
    print_status 1 "Port 9600 is not listening"
fi
echo ""

# 5. Test HTTP API from within container
echo "5. Testing HTTP API from within container..."
if docker exec ${CONTAINER_NAME} curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats > /dev/null 2>&1; then
    print_status 0 "HTTP API accessible from within container"
    STATS=$(docker exec ${CONTAINER_NAME} curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats | head -c 200)
    echo "   API Response: ${STATS}..."
else
    print_status 1 "HTTP API not accessible from within container"
fi
echo ""

# 6. Test HTTP API from host (localhost)
echo "6. Testing HTTP API from host (localhost)..."
if curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats > /dev/null 2>&1; then
    print_status 0 "HTTP API accessible from host (localhost)"
    NODE_NAME=$(curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
    echo "   Node name: ${NODE_NAME}"
else
    print_status 1 "HTTP API not accessible from host (may be expected if bound to localhost only)"
fi
echo ""

# 7. Test HTTP API from another container (Docker network)
echo "7. Testing HTTP API from Docker network..."
if docker run --rm --network reconciliation-network curlimages/curl:latest curl -sf http://${LOGSTASH_HOST}:${LOGSTASH_PORT_9600}/_node/stats > /dev/null 2>&1; then
    print_status 0 "HTTP API accessible from Docker network"
else
    echo -e "${YELLOW}⚠${NC} HTTP API not accessible from Docker network (may require network configuration)"
fi
echo ""

# 8. Check pipeline status
echo "8. Checking pipeline status..."
PIPELINE_STATS=$(docker exec ${CONTAINER_NAME} curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats 2>/dev/null | grep -o '"pipelines":{[^}]*}' || echo "")
if [ -n "$PIPELINE_STATS" ]; then
    print_status 0 "Pipeline statistics available"
    EVENTS_IN=$(docker exec ${CONTAINER_NAME} curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats 2>/dev/null | grep -o '"in":[0-9]*' | head -1 | cut -d':' -f2 || echo "0")
    EVENTS_OUT=$(docker exec ${CONTAINER_NAME} curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats 2>/dev/null | grep -o '"out":[0-9]*' | head -1 | cut -d':' -f2 || echo "0")
    echo "   Events in: ${EVENTS_IN}"
    echo "   Events out: ${EVENTS_OUT}"
else
    print_status 1 "Pipeline statistics not available"
fi
echo ""

# 9. Check Filebeat connectivity (if Filebeat containers exist)
echo "9. Checking Filebeat connectivity..."
FILEBEAT_BACKEND=$(docker ps --format '{{.Names}}' | grep -i filebeat | grep -i backend || echo "")
FILEBEAT_FRONTEND=$(docker ps --format '{{.Names}}' | grep -i filebeat | grep -i frontend || echo "")

if [ -n "$FILEBEAT_BACKEND" ] || [ -n "$FILEBEAT_FRONTEND" ]; then
    echo "   Filebeat containers found:"
    [ -n "$FILEBEAT_BACKEND" ] && echo "   - ${FILEBEAT_BACKEND}"
    [ -n "$FILEBEAT_FRONTEND" ] && echo "   - ${FILEBEAT_FRONTEND}"
    
    # Check if Filebeat can reach Logstash
    if [ -n "$FILEBEAT_BACKEND" ]; then
        if docker exec ${FILEBEAT_BACKEND} nc -z ${LOGSTASH_HOST} ${LOGSTASH_PORT_5044} 2>/dev/null; then
            print_status 0 "Backend Filebeat can reach Logstash:${LOGSTASH_PORT_5044}"
        else
            print_status 1 "Backend Filebeat cannot reach Logstash:${LOGSTASH_PORT_5044}"
        fi
    fi
    
    if [ -n "$FILEBEAT_FRONTEND" ]; then
        if docker exec ${FILEBEAT_FRONTEND} nc -z ${LOGSTASH_HOST} ${LOGSTASH_PORT_5044} 2>/dev/null; then
            print_status 0 "Frontend Filebeat can reach Logstash:${LOGSTASH_PORT_5044}"
        else
            print_status 1 "Frontend Filebeat cannot reach Logstash:${LOGSTASH_PORT_5044}"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} No Filebeat containers found (may not be running)"
fi
echo ""

# 10. Check Elasticsearch connectivity
echo "10. Checking Elasticsearch connectivity..."
if docker exec ${CONTAINER_NAME} nc -z elasticsearch 9200 2>/dev/null; then
    print_status 0 "Logstash can reach Elasticsearch:9200"
else
    print_status 1 "Logstash cannot reach Elasticsearch:9200"
fi
echo ""

# 11. Check recent logs for errors
echo "11. Checking recent logs for errors..."
RECENT_ERRORS=$(docker logs ${CONTAINER_NAME} --tail 50 2>&1 | grep -i "error\|exception\|failed" | head -5 || echo "")
if [ -z "$RECENT_ERRORS" ]; then
    print_status 0 "No recent errors in logs"
else
    echo -e "${YELLOW}⚠${NC} Recent errors/warnings found:"
    echo "$RECENT_ERRORS" | sed 's/^/   /'
fi
echo ""

# 12. Check resource usage
echo "12. Checking resource usage..."
STATS=$(docker stats ${CONTAINER_NAME} --no-stream --format "CPU: {{.CPUPerc}}, Memory: {{.MemUsage}}" 2>/dev/null || echo "Unable to retrieve stats")
if [ -n "$STATS" ]; then
    echo "   ${STATS}"
    print_status 0 "Resource usage retrieved"
else
    print_status 1 "Unable to retrieve resource usage"
fi
echo ""

# 13. Check JVM heap usage
echo "13. Checking JVM heap usage..."
HEAP_STATS=$(docker exec ${CONTAINER_NAME} curl -sf http://localhost:${LOGSTASH_PORT_9600}/_node/stats 2>/dev/null | grep -o '"heap_used_percent":[0-9]*' | cut -d':' -f2 || echo "")
if [ -n "$HEAP_STATS" ]; then
    print_status 0 "JVM heap usage: ${HEAP_STATS}%"
    if [ "$HEAP_STATS" -gt 80 ]; then
        echo -e "${YELLOW}⚠${NC} Heap usage is high (>80%)"
    fi
else
    print_status 1 "Unable to retrieve JVM heap stats"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "For detailed information, see:"
echo "  - LOGSTASH_COMPREHENSIVE_ANALYSIS.md"
echo "  - LOGSTASH_TROUBLESHOOTING_RUNBOOK.md"
echo ""

