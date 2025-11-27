#!/bin/bash

# Test Runner Script for Reconciliation Backend
# This script runs all tests including unit tests, integration tests, and API tests

set -e

echo "🧪 Starting Reconciliation Backend Test Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DB_URL="postgresql://test_user:test_pass@localhost:5432/reconciliation_test"
TEST_REDIS_URL="redis://localhost:6379/1"
TEST_PORT=3001

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
service_running() {
    if command_exists "$1"; then
        "$1" --version >/dev/null 2>&1
    else
        return 1
    fi
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Rust is installed
if ! command_exists cargo; then
    print_error "Cargo is not installed. Please install Rust first."
    exit 1
fi

# Check if PostgreSQL is running
if ! command_exists psql; then
    print_warning "PostgreSQL client not found. Some tests may fail."
else
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        print_warning "PostgreSQL is not running. Some tests may fail."
    else
        print_success "PostgreSQL is running"
    fi
fi

# Check if Redis is running
if ! command_exists redis-cli; then
    print_warning "Redis client not found. Some tests may fail."
else
    if ! redis-cli ping >/dev/null 2>&1; then
        print_warning "Redis is not running. Some tests may fail."
    else
        print_success "Redis is running"
    fi
fi

# Set up test environment
print_status "Setting up test environment..."

# Create test database if it doesn't exist
if command_exists createdb; then
    createdb -h localhost -p 5432 -U test_user reconciliation_test 2>/dev/null || true
    print_success "Test database ready"
fi

# Create test directories
mkdir -p test_uploads
mkdir -p test_data
print_success "Test directories created"

# Set environment variables for tests
export DATABASE_URL="$TEST_DB_URL"
export REDIS_URL="$TEST_REDIS_URL"
export JWT_SECRET="test-jwt-secret-key-for-testing-only"
export JWT_EXPIRATION="3600"
export HOST="127.0.0.1"
export PORT="$TEST_PORT"
export LOG_LEVEL="debug"
export MAX_FILE_SIZE="10485760"
export UPLOAD_PATH="./test_uploads"

print_success "Environment variables set"

# Function to run tests with proper error handling
run_tests() {
    local test_type="$1"
    local test_command="$2"
    
    print_status "Running $test_type tests..."
    
    if eval "$test_command"; then
        print_success "$test_type tests passed"
        return 0
    else
        print_error "$test_type tests failed"
        return 1
    fi
}

# Run unit tests
print_status "Starting unit tests..."
if run_tests "Unit" "cargo test --lib -- --nocapture"; then
    UNIT_TESTS_PASSED=true
else
    UNIT_TESTS_PASSED=false
fi

# Run integration tests
print_status "Starting integration tests..."
if run_tests "Integration" "cargo test --test integration_tests -- --nocapture"; then
    INTEGRATION_TESTS_PASSED=true
else
    INTEGRATION_TESTS_PASSED=false
fi

# Run API endpoint tests
print_status "Starting API endpoint tests..."
if run_tests "API Endpoint" "cargo test --test api_endpoint_tests -- --nocapture"; then
    API_TESTS_PASSED=true
else
    API_TESTS_PASSED=false
fi

# Run performance tests
print_status "Starting performance tests..."
if run_tests "Performance" "cargo test --test performance_tests -- --nocapture"; then
    PERFORMANCE_TESTS_PASSED=true
else
    PERFORMANCE_TESTS_PASSED=false
fi

# Run security tests
print_status "Starting security tests..."
if run_tests "Security" "cargo test --test security_tests -- --nocapture"; then
    SECURITY_TESTS_PASSED=true
else
    SECURITY_TESTS_PASSED=false
fi

# Generate test report
print_status "Generating test report..."

echo ""
echo "📊 Test Results Summary"
echo "======================="

if [ "$UNIT_TESTS_PASSED" = true ]; then
    print_success "✅ Unit Tests: PASSED"
else
    print_error "❌ Unit Tests: FAILED"
fi

if [ "$INTEGRATION_TESTS_PASSED" = true ]; then
    print_success "✅ Integration Tests: PASSED"
else
    print_error "❌ Integration Tests: FAILED"
fi

if [ "$API_TESTS_PASSED" = true ]; then
    print_success "✅ API Endpoint Tests: PASSED"
else
    print_error "❌ API Endpoint Tests: FAILED"
fi

if [ "$PERFORMANCE_TESTS_PASSED" = true ]; then
    print_success "✅ Performance Tests: PASSED"
else
    print_error "❌ Performance Tests: FAILED"
fi

if [ "$SECURITY_TESTS_PASSED" = true ]; then
    print_success "✅ Security Tests: PASSED"
else
    print_error "❌ Security Tests: FAILED"
fi

# Calculate overall result
TOTAL_TESTS=5
PASSED_TESTS=0

[ "$UNIT_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$INTEGRATION_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$API_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$PERFORMANCE_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$SECURITY_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))

echo ""
echo "📈 Overall Test Results"
echo "======================="
echo "Tests Passed: $PASSED_TESTS/$TOTAL_TESTS"
echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    print_success "🎉 All tests passed! Backend is ready for production."
    exit 0
else
    print_error "⚠️  Some tests failed. Please review the errors above."
    exit 1
fi

# Cleanup function
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Remove test files
    rm -rf test_uploads/*
    rm -rf test_data/*
    
    # Drop test database
    if command_exists dropdb; then
        dropdb -h localhost -p 5432 -U test_user reconciliation_test 2>/dev/null || true
    fi
    
    print_success "Cleanup completed"
}

# Set up cleanup trap
trap cleanup EXIT

echo ""
print_status "Test suite completed!"
