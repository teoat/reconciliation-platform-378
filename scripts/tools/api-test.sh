#!/bin/bash

# =============================================================================
# Developer Tools - API Testing Script
# =============================================================================
# Quick API testing and endpoint validation for development
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:2000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TIMEOUT="${TIMEOUT:-30}"
VERBOSE="${VERBOSE:-false}"

log() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1" >&2; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Print response with formatting
print_response() {
    local status="$1"
    local body="$2"
    local duration="$3"
    
    if [[ "$status" =~ ^2 ]]; then
        echo -e "${GREEN}Status: $status${NC} (${duration}ms)"
    elif [[ "$status" =~ ^4 ]]; then
        echo -e "${YELLOW}Status: $status${NC} (${duration}ms)"
    else
        echo -e "${RED}Status: $status${NC} (${duration}ms)"
    fi
    
    if [ "$VERBOSE" = "true" ] || [ -n "$body" ]; then
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
}

# Make HTTP request
http_request() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    
    local url="${API_BASE_URL}${endpoint}"
    local auth_header=""
    
    if [ -n "$AUTH_TOKEN" ]; then
        auth_header="-H \"Authorization: Bearer $AUTH_TOKEN\""
    fi
    
    local start_time=$(date +%s%N)
    
    local response
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            ${auth_header:+$auth_header} \
            -d "$data" \
            --max-time "$TIMEOUT" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Accept: application/json" \
            ${auth_header:+$auth_header} \
            --max-time "$TIMEOUT" 2>&1)
    fi
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    local status=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | sed '$d')
    
    print_response "$status" "$body" "$duration"
}

# Health check
health_check() {
    info "Health Check: ${API_BASE_URL}/health"
    http_request "GET" "/health"
}

# API info
api_info() {
    info "API Info: ${API_BASE_URL}/api"
    http_request "GET" "/api"
}

# List endpoints
list_projects() {
    info "List Projects: ${API_BASE_URL}/api/v2/projects"
    http_request "GET" "/api/v2/projects"
}

list_reconciliations() {
    info "List Reconciliations: ${API_BASE_URL}/api/v2/reconciliations"
    http_request "GET" "/api/v2/reconciliations"
}

list_rules() {
    info "List Rules: ${API_BASE_URL}/api/v2/rules"
    http_request "GET" "/api/v2/rules"
}

# Authentication tests
test_login() {
    local email="${1:-test@example.com}"
    local password="${2:-password123}"
    
    info "Testing Login"
    http_request "POST" "/api/v2/auth/login" "{\"email\":\"$email\",\"password\":\"$password\"}"
}

test_register() {
    local email="${1:-newuser@example.com}"
    local password="${2:-password123}"
    local name="${3:-Test User}"
    
    info "Testing Registration"
    http_request "POST" "/api/v2/auth/register" "{\"email\":\"$email\",\"password\":\"$password\",\"name\":\"$name\"}"
}

# CRUD operations
create_project() {
    local name="${1:-Test Project}"
    local description="${2:-A test project}"
    
    info "Creating Project"
    http_request "POST" "/api/v2/projects" "{\"name\":\"$name\",\"description\":\"$description\"}"
}

get_project() {
    local id="$1"
    
    if [ -z "$id" ]; then
        error "Project ID required"
        return 1
    fi
    
    info "Getting Project: $id"
    http_request "GET" "/api/v2/projects/$id"
}

update_project() {
    local id="$1"
    local name="${2:-Updated Project}"
    local description="${3:-Updated description}"
    
    if [ -z "$id" ]; then
        error "Project ID required"
        return 1
    fi
    
    info "Updating Project: $id"
    http_request "PUT" "/api/v2/projects/$id" "{\"name\":\"$name\",\"description\":\"$description\"}"
}

delete_project() {
    local id="$1"
    
    if [ -z "$id" ]; then
        error "Project ID required"
        return 1
    fi
    
    info "Deleting Project: $id"
    http_request "DELETE" "/api/v2/projects/$id"
}

# Performance test
perf_test() {
    local endpoint="${1:-/health}"
    local requests="${2:-10}"
    
    info "Performance Test: $requests requests to $endpoint"
    
    local total_time=0
    local success=0
    local failure=0
    
    for i in $(seq 1 "$requests"); do
        local start=$(date +%s%N)
        local status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${API_BASE_URL}${endpoint}" --max-time "$TIMEOUT")
        local end=$(date +%s%N)
        local duration=$(( (end - start) / 1000000 ))
        total_time=$((total_time + duration))
        
        if [[ "$status" =~ ^2 ]]; then
            success=$((success + 1))
            echo -e "  Request $i: ${GREEN}$status${NC} (${duration}ms)"
        else
            failure=$((failure + 1))
            echo -e "  Request $i: ${RED}$status${NC} (${duration}ms)"
        fi
    done
    
    local avg=$((total_time / requests))
    echo ""
    echo "Results:"
    echo "  Total requests: $requests"
    echo "  Successful: $success"
    echo "  Failed: $failure"
    echo "  Average response time: ${avg}ms"
    echo "  Total time: ${total_time}ms"
}

# Run all health checks
full_health_check() {
    info "Running full health check..."
    echo ""
    
    echo "=== Basic Health ==="
    health_check
    echo ""
    
    echo "=== API Info ==="
    api_info
    echo ""
    
    echo "=== Database Health ==="
    http_request "GET" "/api/v2/health/database"
    echo ""
    
    echo "=== Redis Health ==="
    http_request "GET" "/api/v2/health/redis"
    echo ""
}

# Show help
show_help() {
    cat << EOF
${CYAN}=== API Testing Tool ===${NC}

Usage: $0 [OPTIONS] COMMAND [ARGS]

Commands:
    health                          Basic health check
    info                            API information
    full-health                     Complete health check
    
    projects                        List all projects
    project:get <id>                Get project by ID
    project:create <name> [desc]    Create new project
    project:update <id> <name>      Update project
    project:delete <id>             Delete project
    
    reconciliations                 List reconciliations
    rules                           List rules
    
    login <email> <password>        Test login
    register <email> <password>     Test registration
    
    perf <endpoint> [requests]      Performance test
    custom <method> <endpoint>      Custom request

Options:
    -u, --url URL                   API base URL (default: http://localhost:2000)
    -t, --token TOKEN               Authorization token
    -v, --verbose                   Show full response bodies
    --timeout SEC                   Request timeout (default: 30)
    -h, --help                      Show this help

Examples:
    $0 health
    $0 -v projects
    $0 -t "your-token" project:create "My Project" "Description"
    $0 perf /health 100
    $0 custom GET /api/v2/users/me

Environment Variables:
    API_BASE_URL                    API base URL
    AUTH_TOKEN                      Bearer token for authentication
    TIMEOUT                         Request timeout in seconds
    VERBOSE                         Enable verbose output (true/false)
EOF
}

# Main
main() {
    local command=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -u|--url)     API_BASE_URL="$2"; shift 2;;
            -t|--token)   AUTH_TOKEN="$2"; shift 2;;
            -v|--verbose) VERBOSE="true"; shift;;
            --timeout)    TIMEOUT="$2"; shift 2;;
            -h|--help)    show_help; exit 0;;
            health)       health_check; exit 0;;
            info)         api_info; exit 0;;
            full-health)  full_health_check; exit 0;;
            projects)     list_projects; exit 0;;
            reconciliations) list_reconciliations; exit 0;;
            rules)        list_rules; exit 0;;
            project:get)  get_project "$2"; exit 0;;
            project:create) create_project "$2" "$3"; exit 0;;
            project:update) update_project "$2" "$3" "$4"; exit 0;;
            project:delete) delete_project "$2"; exit 0;;
            login)        test_login "$2" "$3"; exit 0;;
            register)     test_register "$2" "$3" "$4"; exit 0;;
            perf)         perf_test "$2" "$3"; exit 0;;
            custom)       http_request "$2" "$3" "$4"; exit 0;;
            *)
                error "Unknown command: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    show_help
}

main "$@"
