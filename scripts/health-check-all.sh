#!/bin/bash
# ==============================================================================
# Comprehensive Health Check Script
# ==============================================================================
# Validates all services, dependencies, and system health
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

FAILED=0
PASSED=0

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Reconciliation Platform - Comprehensive Health Check${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# Function to check service
check_service() {
    local service_name=$1
    local check_command=$2
    local expected_output=$3
    
    echo -n "  Checking $service_name... "
    
    if eval "$check_command" 2>/dev/null | grep -q "$expected_output"; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "  Checking $name... "
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$STATUS" == "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $STATUS)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $STATUS, expected $expected_code)"
        ((FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}1. Docker Containers${NC}"
check_service "Frontend Container" "docker ps --filter name=reconciliation-frontend --format '{{.Status}}'" "Up"
check_service "Backend Container" "docker ps --filter name=reconciliation-backend --format '{{.Status}}'" "Up"
check_service "PostgreSQL Container" "docker ps --filter name=reconciliation-postgres --format '{{.Status}}'" "Up"
check_service "Redis Container" "docker ps --filter name=reconciliation-redis --format '{{.Status}}'" "Up"
check_service "Elasticsearch Container" "docker ps --filter name=reconciliation-elasticsearch --format '{{.Status}}'" "Up"
echo ""

echo -e "${YELLOW}2. HTTP Endpoints${NC}"
check_http "Frontend" "http://localhost:1000" "200"
check_http "Backend Health" "http://localhost:2000/health" "200"
check_http "Grafana" "http://localhost:3001" "302"
check_http "Prometheus" "http://localhost:9090" "302"
check_http "Kibana" "http://localhost:5601" "302"
echo ""

echo -e "${YELLOW}3. Database Services${NC}"
check_service "PostgreSQL" "docker exec reconciliation-postgres pg_isready" "accepting connections"
check_service "Redis" "docker ps --filter name=reconciliation-redis --format '{{.Status}}'" "healthy"
check_service "Elasticsearch" "curl -s http://localhost:9200/_cluster/health" "status"
echo ""

echo -e "${YELLOW}4. Backend API Endpoints${NC}"
check_http "API Health" "http://localhost:2000/health" "200"
check_http "API Version" "http://localhost:2000/api/v1" "404"
echo ""

echo -e "${YELLOW}5. Resource Usage${NC}"
echo -n "  Docker disk usage... "
DISK_USAGE=$(docker system df --format "{{.Type}}\t{{.Size}}" 2>/dev/null | grep "Images" | awk '{print $2}' || echo "N/A")
echo -e "${GREEN}✓${NC} ($DISK_USAGE)"
((PASSED++))

echo -n "  Running containers... "
RUNNING=$(docker ps --format "{{.Names}}" | wc -l)
echo -e "${GREEN}✓${NC} ($RUNNING containers)"
((PASSED++))
echo ""

# Volume checks
echo -e "${YELLOW}6. Data Volumes${NC}"
check_service "Postgres Volume" "docker volume ls --format '{{.Name}}'" "postgres"
check_service "Redis Volume" "docker volume ls --format '{{.Name}}'" "redis"
echo ""

# Summary
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Health Check Summary${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo -e "  Total Checks: $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo -e "  Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some services are unhealthy. Please check the logs.${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting commands:${NC}"
    echo -e "  docker-compose ps              # Check container status"
    echo -e "  docker-compose logs -f         # View all logs"
    echo -e "  docker-compose restart         # Restart all services"
    echo ""
    exit 1
fi

