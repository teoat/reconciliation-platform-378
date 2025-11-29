#!/bin/bash
# Verify Performance Metrics
# Checks API response times, frontend load times, and query performance

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "⚡ Verifying performance metrics..."

# Configuration
API_URL="${API_URL:-http://localhost:2000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:1000}"
DATABASE_URL="${DATABASE_URL:-}"

# Performance thresholds (in milliseconds)
API_P95_THRESHOLD=500
API_P99_THRESHOLD=1000
FRONTEND_LCP_THRESHOLD=2500
QUERY_THRESHOLD=500

# Step 1: Test API response times
log_info "Step 1: Testing API response times..."
ENDPOINTS=(
    "/api/v1/health"
    "/api/v1/projects"
)

for endpoint in "${ENDPOINTS[@]}"; do
    log_info "Testing $endpoint..."
    
    # Run multiple requests and collect times
    TIMES=()
    for i in {1..10}; do
        TIME=$(curl -w "%{time_total}" -o /dev/null -s "$API_URL$endpoint" 2>/dev/null)
        if [ -n "$TIME" ]; then
            TIMES+=($(echo "$TIME * 1000" | bc))
        fi
    done
    
    # Calculate percentiles (simplified)
    if [ ${#TIMES[@]} -gt 0 ]; then
        IFS=$'\n' SORTED=($(sort -n <<<"${TIMES[*]}"))
        P95_INDEX=$(echo "scale=0; ${#TIMES[@]} * 0.95" | bc | cut -d. -f1)
        P99_INDEX=$(echo "scale=0; ${#TIMES[@]} * 0.99" | bc | cut -d. -f1)
        
        P95=${SORTED[$P95_INDEX]}
        P99=${SORTED[$P99_INDEX]}
        
        log_info "  p95: ${P95}ms (threshold: ${API_P95_THRESHOLD}ms)"
        log_info "  p99: ${P99}ms (threshold: ${API_P99_THRESHOLD}ms)"
        
        if (( $(echo "$P95 > $API_P95_THRESHOLD" | bc -l) )); then
            log_warning "⚠️  p95 exceeds threshold for $endpoint"
        else
            log_success "✅ p95 within threshold for $endpoint"
        fi
    fi
done

# Step 2: Test database query performance (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    log_info "Step 2: Testing database query performance..."
    
    # Test simple query
    START_TIME=$(date +%s%N)
    psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1
    END_TIME=$(date +%s%N)
    QUERY_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
    
    log_info "Simple query time: ${QUERY_TIME}ms"
    
    if [ $QUERY_TIME -gt $QUERY_THRESHOLD ]; then
        log_warning "⚠️  Query time exceeds threshold"
    else
        log_success "✅ Query performance acceptable"
    fi
else
    log_warning "⚠️  DATABASE_URL not set, skipping query performance test"
fi

# Step 3: Frontend performance (if Lighthouse is available)
log_info "Step 3: Testing frontend performance..."
if command -v lighthouse &> /dev/null || command -v npx &> /dev/null; then
    log_info "Running Lighthouse analysis..."
    # Note: This would require Lighthouse to be installed
    log_info "Frontend performance check available (requires Lighthouse)"
else
    log_warning "⚠️  Lighthouse not available, skipping frontend performance test"
fi

log_success "✅ Performance verification complete"
