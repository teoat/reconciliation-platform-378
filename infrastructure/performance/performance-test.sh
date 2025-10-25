#!/bin/bash

# Performance Testing Script for Reconciliation Platform
# This script runs comprehensive performance tests using Artillery

set -e

# Configuration
TEST_DIR="/app/infrastructure/performance"
REPORT_DIR="/reports/performance"
ARTILLERY_CONFIG="$TEST_DIR/load-test.yml"
TEST_DATA_DIR="$TEST_DIR/test-data"
TARGET_URL="${TARGET_URL:-http://localhost:1000}"
TEST_DURATION="${TEST_DURATION:-300}"
ARRIVAL_RATE="${ARRIVAL_RATE:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Create directories
create_directories() {
    log "Creating performance test directories..."
    
    mkdir -p "$REPORT_DIR"
    mkdir -p "$TEST_DATA_DIR"
    
    log "Directories created"
}

# Install Artillery
install_artillery() {
    log "Installing Artillery..."
    
    if ! command -v artillery &> /dev/null; then
        npm install -g artillery@latest
        log "Artillery installed successfully"
    else
        log "Artillery already installed"
    fi
}

# Create test data
create_test_data() {
    log "Creating test data..."
    
    # Create users CSV
    cat > "$TEST_DATA_DIR/users.csv" << EOF
email,password,firstName,lastName
test1@example.com,password123,Test,User1
test2@example.com,password123,Test,User2
test3@example.com,password123,Test,User3
test4@example.com,password123,Test,User4
test5@example.com,password123,Test,User5
EOF

    # Create sample CSV data
    cat > "$TEST_DATA_DIR/sample-data.csv" << EOF
id,amount,currency,date,description
1,100.00,USD,2024-01-01,Test transaction 1
2,200.00,USD,2024-01-02,Test transaction 2
3,300.00,USD,2024-01-03,Test transaction 3
4,400.00,USD,2024-01-04,Test transaction 4
5,500.00,USD,2024-01-05,Test transaction 5
EOF

    log "Test data created"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local health_url="$TARGET_URL/health"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url")
    
    if [ "$response" = "200" ]; then
        log "Health check passed: $health_url"
        return 0
    else
        error "Health check failed: $health_url (HTTP $response)"
        return 1
    fi
}

# Run load test
run_load_test() {
    local test_name="$1"
    local config_file="$2"
    local report_file="$REPORT_DIR/load-test-$test_name-$(date +'%Y%m%d_%H%M%S').json"
    
    log "Running load test: $test_name"
    
    if artillery run --config "$config_file" --output "$report_file" "$ARTILLERY_CONFIG"; then
        log "Load test completed: $test_name"
        
        # Generate HTML report
        local html_report="$REPORT_DIR/load-test-$test_name-$(date +'%Y%m%d_%H%M%S').html"
        artillery report --output "$html_report" "$report_file"
        log "HTML report generated: $html_report"
        
        return 0
    else
        error "Load test failed: $test_name"
        return 1
    fi
}

# Run stress test
run_stress_test() {
    local test_name="stress"
    local config_file="$TEST_DIR/stress-test.yml"
    
    log "Running stress test..."
    
    # Create stress test configuration
    cat > "$config_file" << EOF
config:
  target: '$TARGET_URL'
  phases:
    - duration: 60
      arrivalRate: 1
      name: "Warm-up"
    - duration: 120
      arrivalRate: 10
      rampTo: 100
      name: "Stress Test"
    - duration: 60
      arrivalRate: 100
      name: "Peak Load"

scenarios:
  - name: "Stress Test"
    weight: 100
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200
EOF

    run_load_test "$test_name" "$config_file"
}

# Run spike test
run_spike_test() {
    local test_name="spike"
    local config_file="$TEST_DIR/spike-test.yml"
    
    log "Running spike test..."
    
    # Create spike test configuration
    cat > "$config_file" << EOF
config:
  target: '$TARGET_URL'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Normal Load"
    - duration: 30
      arrivalRate: 100
      name: "Spike"
    - duration: 60
      arrivalRate: 5
      name: "Recovery"

scenarios:
  - name: "Spike Test"
    weight: 100
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200
EOF

    run_load_test "$test_name" "$config_file"
}

# Run volume test
run_volume_test() {
    local test_name="volume"
    local config_file="$TEST_DIR/volume-test.yml"
    
    log "Running volume test..."
    
    # Create volume test configuration
    cat > "$config_file" << EOF
config:
  target: '$TARGET_URL'
  phases:
    - duration: 600
      arrivalRate: 50
      name: "Volume Test"

scenarios:
  - name: "Volume Test"
    weight: 100
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200
EOF

    run_load_test "$test_name" "$config_file"
}

# Run endurance test
run_endurance_test() {
    local test_name="endurance"
    local config_file="$TEST_DIR/endurance-test.yml"
    
    log "Running endurance test..."
    
    # Create endurance test configuration
    cat > "$config_file" << EOF
config:
  target: '$TARGET_URL'
  phases:
    - duration: 3600
      arrivalRate: 10
      name: "Endurance Test"

scenarios:
  - name: "Endurance Test"
    weight: 100
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200
EOF

    run_load_test "$test_name" "$config_file"
}

# Analyze results
analyze_results() {
    log "Analyzing performance test results..."
    
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local analysis_file="$REPORT_DIR/performance-analysis-$timestamp.md"
    
    cat > "$analysis_file" << EOF
# Performance Test Analysis - Reconciliation Platform

**Generated**: $(date)
**Analysis ID**: $timestamp

## Test Summary

### Load Test Results
- **Total Tests Run**: $(find "$REPORT_DIR" -name "load-test-*.json" | wc -l)
- **Success Rate**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.counters."http.codes.200"' {} \; | awk '{sum+=$1} END {print sum+0}')
- **Error Rate**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.counters."http.codes.5xx"' {} \; | awk '{sum+=$1} END {print sum+0}')

### Response Time Analysis
- **Average Response Time**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.summaries."http.response_time".mean' {} \; | awk '{sum+=$1; count++} END {print sum/count+0}')
- **95th Percentile**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.summaries."http.response_time".p95' {} \; | awk '{sum+=$1; count++} END {print sum/count+0}')
- **99th Percentile**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.summaries."http.response_time".p99' {} \; | awk '{sum+=$1; count++} END {print sum/count+0}')

### Throughput Analysis
- **Requests per Second**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.rates."http.request_rate"' {} \; | awk '{sum+=$1; count++} END {print sum/count+0}')
- **Total Requests**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.counters."http.requests"' {} \; | awk '{sum+=$1} END {print sum+0}')

## Performance Recommendations

### Immediate Actions
1. **Optimize Slow Endpoints**: Identify and optimize endpoints with response times > 1s
2. **Database Optimization**: Review database queries and add indexes
3. **Caching Strategy**: Implement caching for frequently accessed data
4. **Load Balancing**: Ensure proper load balancing configuration

### Long-term Improvements
1. **Horizontal Scaling**: Implement auto-scaling based on load
2. **CDN Implementation**: Use CDN for static assets
3. **Database Sharding**: Consider database sharding for large datasets
4. **Microservices**: Break down monolithic components

## Test Reports

EOF

    # Add individual test reports
    find "$REPORT_DIR" -name "load-test-*.json" | while read -r file; do
        local test_name=$(basename "$file" .json | sed 's/load-test-//')
        echo "- **$test_name**: \`$(basename "$file")\`" >> "$analysis_file"
    done

    log "Performance analysis completed: $analysis_file"
}

# Generate performance report
generate_performance_report() {
    log "Generating performance report..."
    
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local report_file="$REPORT_DIR/performance-report-$timestamp.md"
    
    cat > "$report_file" << EOF
# Performance Test Report - Reconciliation Platform

**Generated**: $(date)
**Report ID**: $timestamp

## Executive Summary

This report contains the results of comprehensive performance testing performed on the Reconciliation Platform.

## Test Configuration

- **Target URL**: $TARGET_URL
- **Test Duration**: $TEST_DURATION seconds
- **Arrival Rate**: $ARRIVAL_RATE requests/second
- **Test Types**: Load, Stress, Spike, Volume, Endurance

## Key Metrics

### Response Time
- **Target**: < 500ms average
- **Actual**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.summaries."http.response_time".mean' {} \; | awk '{sum+=$1; count++} END {print sum/count+0}')ms

### Throughput
- **Target**: > 100 requests/second
- **Actual**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.rates."http.request_rate"' {} \; | awk '{sum+=$1; count++} END {print sum/count+0}') requests/second

### Error Rate
- **Target**: < 1%
- **Actual**: $(find "$REPORT_DIR" -name "load-test-*.json" -exec jq '.aggregate.counters."http.codes.5xx"' {} \; | awk '{sum+=$1} END {print sum+0}')%

## Recommendations

1. **Performance Optimization**: Implement caching and database optimization
2. **Scaling Strategy**: Plan for horizontal scaling
3. **Monitoring**: Implement comprehensive performance monitoring
4. **Testing**: Regular performance testing in CI/CD pipeline

EOF

    log "Performance report generated: $report_file"
}

# Cleanup old reports
cleanup_reports() {
    log "Cleaning up old performance reports..."
    
    find "$REPORT_DIR" -name "*.json" -mtime +7 -delete
    find "$REPORT_DIR" -name "*.html" -mtime +7 -delete
    find "$REPORT_DIR" -name "*.md" -mtime +7 -delete
    
    log "Old reports cleaned up"
}

# Main performance testing function
run_performance_tests() {
    log "Starting comprehensive performance testing..."
    
    create_directories
    install_artillery
    create_test_data
    
    # Health check
    if ! health_check; then
        error "Health check failed, aborting performance tests"
        return 1
    fi
    
    # Run all test types
    run_load_test "load" "$ARTILLERY_CONFIG"
    run_stress_test
    run_spike_test
    run_volume_test
    run_endurance_test
    
    # Analyze results
    analyze_results
    generate_performance_report
    
    # Cleanup
    cleanup_reports
    
    log "Performance testing completed successfully"
}

# Main script logic
main() {
    case "${1:-}" in
        "test")
            run_performance_tests
            ;;
        "load")
            create_directories && install_artillery && create_test_data && health_check && run_load_test "load" "$ARTILLERY_CONFIG"
            ;;
        "stress")
            create_directories && install_artillery && health_check && run_stress_test
            ;;
        "spike")
            create_directories && install_artillery && health_check && run_spike_test
            ;;
        "volume")
            create_directories && install_artillery && health_check && run_volume_test
            ;;
        "endurance")
            create_directories && install_artillery && health_check && run_endurance_test
            ;;
        "analyze")
            analyze_results
            ;;
        "report")
            generate_performance_report
            ;;
        "cleanup")
            cleanup_reports
            ;;
        *)
            echo "Usage: $0 {test|load|stress|spike|volume|endurance|analyze|report|cleanup}"
            echo
            echo "Commands:"
            echo "  test       - Run comprehensive performance tests"
            echo "  load       - Run load test"
            echo "  stress     - Run stress test"
            echo "  spike      - Run spike test"
            echo "  volume     - Run volume test"
            echo "  endurance  - Run endurance test"
            echo "  analyze    - Analyze test results"
            echo "  report     - Generate performance report"
            echo "  cleanup    - Clean up old reports"
            echo
            echo "Environment variables:"
            echo "  TARGET_URL     - Target URL for testing (default: http://localhost:1000)"
            echo "  TEST_DURATION  - Test duration in seconds (default: 300)"
            echo "  ARRIVAL_RATE   - Arrival rate for tests (default: 10)"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
