#!/bin/bash

# User Acceptance Testing Execution Script
# This script automates the execution of UAT tests for the Reconciliation Platform

set -e

# Configuration
UAT_ENVIRONMENT="uat"
UAT_URL="https://uat.reconciliation.example.com"
API_URL="https://api-uat.reconciliation.example.com"
WS_URL="wss://ws-uat.reconciliation.example.com"
TEST_REPORTS_DIR="reports/uat"
TEST_DATA_DIR="tests/uat/fixtures"
LOG_FILE="uat_execution.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local tools=("python3" "pip" "pytest" "selenium" "requests")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    log_success "All prerequisites are installed"
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create reports directory
    mkdir -p "$TEST_REPORTS_DIR"
    
    # Create test data directory
    mkdir -p "$TEST_DATA_DIR"
    
    # Install Python dependencies
    if [ -f "requirements-test.txt" ]; then
        pip install -r requirements-test.txt
    fi
    
    # Setup test configuration
    create_test_config
    
    log_success "Test environment setup completed"
}

# Create test configuration
create_test_config() {
    log_info "Creating test configuration..."
    
    cat > "tests/uat/config/test_config.yaml" << EOF
test_suite:
  name: "Reconciliation Platform UAT"
  version: "1.0.0"
  environment: "$UAT_ENVIRONMENT"

environments:
  $UAT_ENVIRONMENT:
    base_url: "$UAT_URL"
    api_url: "$API_URL"
    ws_url: "$WS_URL"
    database_url: "postgresql://uat_user:uat_password@uat-db:5432/reconciliation_uat"
    redis_url: "redis://uat-redis:6379"

test_data:
  users:
    admin:
      username: "admin@example.com"
      password: "Admin123!"
      role: "admin"
    user1:
      username: "user1@example.com"
      password: "User123!"
      role: "user"
    user2:
      username: "user2@example.com"
      password: "User123!"
      role: "user"

  files:
    csv_valid: "fixtures/sample_files/valid_data.csv"
    csv_invalid: "fixtures/sample_files/invalid_data.csv"
    json_valid: "fixtures/sample_files/valid_data.json"
    json_invalid: "fixtures/sample_files/invalid_data.json"

browser_config:
  headless: false
  window_size: [1920, 1080]
  timeout: 30
  implicit_wait: 10

reporting:
  format: ["html", "json", "xml"]
  output_dir: "$TEST_REPORTS_DIR"
  screenshots: true
  videos: false
EOF
    
    log_success "Test configuration created"
}

# Create test data
create_test_data() {
    log_info "Creating test data..."
    
    # Create sample CSV files
    mkdir -p "$TEST_DATA_DIR/sample_files"
    
    # Valid CSV data
    cat > "$TEST_DATA_DIR/sample_files/valid_data.csv" << EOF
id,name,amount,date
1,John Doe,1000.00,2024-01-01
2,Jane Smith,2000.00,2024-01-02
3,Bob Johnson,1500.00,2024-01-03
EOF
    
    # Invalid CSV data
    cat > "$TEST_DATA_DIR/sample_files/invalid_data.csv" << EOF
id,name,amount
1,John Doe
2,Jane Smith,2000.00,2024-01-02,extra_field
EOF
    
    # Valid JSON data
    cat > "$TEST_DATA_DIR/sample_files/valid_data.json" << EOF
[
  {
    "id": 1,
    "name": "John Doe",
    "amount": 1000.00,
    "date": "2024-01-01"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "amount": 2000.00,
    "date": "2024-01-02"
  },
  {
    "id": 3,
    "name": "Bob Johnson",
    "amount": 1500.00,
    "date": "2024-01-03"
  }
]
EOF
    
    # Invalid JSON data
    cat > "$TEST_DATA_DIR/sample_files/invalid_data.json" << EOF
[
  {
    "id": 1,
    "name": "John Doe",
    "amount": 1000.00
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "amount": "invalid_amount",
    "date": "2024-01-02"
  }
]
EOF
    
    log_success "Test data created"
}

# Verify environment health
verify_environment_health() {
    log_info "Verifying environment health..."
    
    # Check if UAT environment is accessible
    if ! curl -s "$UAT_URL/health" > /dev/null; then
        log_error "UAT environment is not accessible"
        exit 1
    fi
    
    # Check API health
    if ! curl -s "$API_URL/health" > /dev/null; then
        log_error "API environment is not accessible"
        exit 1
    fi
    
    log_success "Environment health verified"
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    local smoke_tests=(
        "tests/uat/test_cases/authentication/test_login.py"
        "tests/uat/test_cases/project_management/test_create_project.py"
        "tests/uat/test_cases/file_upload/test_upload_csv.py"
        "tests/uat/test_cases/reconciliation/test_exact_match.py"
    )
    
    local passed=0
    local failed=0
    
    for test in "${smoke_tests[@]}"; do
        if [ -f "$test" ]; then
            log_info "Running smoke test: $test"
            if python -m pytest "$test" -v --tb=short; then
                log_success "Smoke test passed: $test"
                ((passed++))
            else
                log_error "Smoke test failed: $test"
                ((failed++))
            fi
        else
            log_warning "Smoke test file not found: $test"
        fi
    done
    
    log_info "Smoke tests completed: $passed passed, $failed failed"
    
    if [ $failed -gt 0 ]; then
        log_error "Smoke tests failed. Stopping execution."
        exit 1
    fi
}

# Run functional tests
run_functional_tests() {
    log_info "Running functional tests..."
    
    local test_suites=(
        "tests/uat/test_cases/authentication"
        "tests/uat/test_cases/project_management"
        "tests/uat/test_cases/file_upload"
        "tests/uat/test_cases/reconciliation"
        "tests/uat/test_cases/collaboration"
        "tests/uat/test_cases/reporting"
        "tests/uat/test_cases/admin"
    )
    
    for suite in "${test_suites[@]}"; do
        if [ -d "$suite" ]; then
            log_info "Running test suite: $suite"
            python -m pytest "$suite" -v --tb=short --html="$TEST_REPORTS_DIR/$(basename "$suite")_report.html" --self-contained-html
        else
            log_warning "Test suite directory not found: $suite"
        fi
    done
    
    log_success "Functional tests completed"
}

# Run performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    if [ -d "tests/uat/test_cases/performance" ]; then
        python -m pytest "tests/uat/test_cases/performance" -v --tb=short --html="$TEST_REPORTS_DIR/performance_report.html" --self-contained-html
    else
        log_warning "Performance test suite not found"
    fi
    
    log_success "Performance tests completed"
}

# Run security tests
run_security_tests() {
    log_info "Running security tests..."
    
    if [ -d "tests/uat/test_cases/security" ]; then
        python -m pytest "tests/uat/test_cases/security" -v --tb=short --html="$TEST_REPORTS_DIR/security_report.html" --self-contained-html
    else
        log_warning "Security test suite not found"
    fi
    
    log_success "Security tests completed"
}

# Run compatibility tests
run_compatibility_tests() {
    log_info "Running compatibility tests..."
    
    if [ -d "tests/uat/test_cases/compatibility" ]; then
        python -m pytest "tests/uat/test_cases/compatibility" -v --tb=short --html="$TEST_REPORTS_DIR/compatibility_report.html" --self-contained-html
    else
        log_warning "Compatibility test suite not found"
    fi
    
    log_success "Compatibility tests completed"
}

# Generate test reports
generate_test_reports() {
    log_info "Generating test reports..."
    
    # Generate summary report
    cat > "$TEST_REPORTS_DIR/uat_summary.md" << EOF
# UAT Test Execution Summary

## Test Execution Details
- **Date**: $(date)
- **Environment**: $UAT_ENVIRONMENT
- **Test URL**: $UAT_URL
- **API URL**: $API_URL

## Test Results
- **Smoke Tests**: Completed
- **Functional Tests**: Completed
- **Performance Tests**: Completed
- **Security Tests**: Completed
- **Compatibility Tests**: Completed

## Reports Generated
- HTML reports for each test suite
- Screenshots of failed tests
- Detailed logs

## Next Steps
1. Review test reports
2. Address any failed tests
3. Re-run failed tests if necessary
4. Proceed with production deployment if all tests pass
EOF
    
    log_success "Test reports generated"
}

# Cleanup test environment
cleanup_test_environment() {
    log_info "Cleaning up test environment..."
    
    # Cleanup test data
    if [ -d "$TEST_DATA_DIR" ]; then
        rm -rf "$TEST_DATA_DIR"
    fi
    
    # Cleanup temporary files
    find . -name "*.pyc" -delete
    find . -name "__pycache__" -delete
    
    log_success "Test environment cleanup completed"
}

# Main execution function
run_uat() {
    local test_type="${1:-all}"
    
    log_info "Starting UAT execution for type: $test_type"
    
    check_prerequisites
    setup_test_environment
    create_test_data
    verify_environment_health
    
    case "$test_type" in
        smoke)
            run_smoke_tests
            ;;
        functional)
            run_functional_tests
            ;;
        performance)
            run_performance_tests
            ;;
        security)
            run_security_tests
            ;;
        compatibility)
            run_compatibility_tests
            ;;
        all)
            run_smoke_tests
            run_functional_tests
            run_performance_tests
            run_security_tests
            run_compatibility_tests
            ;;
        *)
            log_error "Unknown test type: $test_type"
            exit 1
            ;;
    esac
    
    generate_test_reports
    cleanup_test_environment
    
    log_success "UAT execution completed successfully!"
}

# Show usage
usage() {
    echo "Usage: $0 [TEST_TYPE]"
    echo ""
    echo "Test Types:"
    echo "  smoke         Run smoke tests only"
    echo "  functional    Run functional tests only"
    echo "  performance   Run performance tests only"
    echo "  security      Run security tests only"
    echo "  compatibility Run compatibility tests only"
    echo "  all           Run all tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0 smoke"
    echo "  $0 functional"
    echo "  $0 all"
    echo ""
    echo "Environment Variables:"
    echo "  UAT_URL       UAT environment URL"
    echo "  API_URL       API environment URL"
    echo "  WS_URL        WebSocket environment URL"
}

# Main script logic
case "${1:-all}" in
    smoke|functional|performance|security|compatibility|all)
        run_uat "$1"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
