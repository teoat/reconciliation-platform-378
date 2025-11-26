#!/bin/bash
# Setup Redis and MCP Tools Configuration
# This script verifies and configures Redis and MCP tools

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Redis is running
check_redis() {
    log_info "Checking Redis connection..."
    
    # Try Docker Redis first
    if docker ps | grep -q reconciliation-redis; then
        log_info "Found Redis Docker container"
        
        # Test with password
        if docker exec reconciliation-redis redis-cli -a redis_pass ping >/dev/null 2>&1; then
            log_info "✅ Redis Docker container is accessible with password"
            return 0
        else
            log_warn "Redis Docker container exists but password authentication failed"
        fi
    fi
    
    # Try local Redis
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli ping >/dev/null 2>&1; then
            log_info "✅ Local Redis is accessible (no password)"
            return 0
        fi
    fi
    
    log_error "Redis is not accessible"
    return 1
}

# Check MCP configuration
check_mcp_config() {
    log_info "Checking MCP configuration..."
    
    local mcp_config="$PROJECT_ROOT/.cursor/mcp.json"
    
    if [ ! -f "$mcp_config" ]; then
        log_error "MCP configuration file not found: $mcp_config"
        return 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        log_warn "jq not found, skipping JSON validation"
        return 0
    fi
    
    if jq empty "$mcp_config" 2>/dev/null; then
        log_info "✅ MCP configuration file is valid JSON"
        
        # Check for Redis URLs
        local redis_urls=$(jq -r '.mcpServers | to_entries[] | select(.value.env.REDIS_URL != null) | "\(.key): \(.value.env.REDIS_URL)"' "$mcp_config" 2>/dev/null)
        
        if [ -n "$redis_urls" ]; then
            log_info "Redis URLs found in MCP config:"
            echo "$redis_urls" | while read -r line; do
                echo "  - $line"
            done
        else
            log_warn "No REDIS_URL found in MCP configuration"
        fi
        
        return 0
    else
        log_error "MCP configuration file is invalid JSON"
        return 1
    fi
}

# Check MCP servers are built
check_mcp_build() {
    log_info "Checking MCP servers are built..."
    
    local mcp_server_dir="$PROJECT_ROOT/mcp-server"
    local built=0
    
    if [ -f "$mcp_server_dir/dist/index.js" ]; then
        log_info "✅ reconciliation-platform server built"
        built=$((built + 1))
    else
        log_warn "reconciliation-platform server not built (dist/index.js missing)"
    fi
    
    if [ -f "$mcp_server_dir/dist/agent-coordination.js" ]; then
        log_info "✅ agent-coordination server built"
        built=$((built + 1))
    else
        log_warn "agent-coordination server not built (dist/agent-coordination.js missing)"
    fi
    
    if [ $built -eq 0 ]; then
        log_error "No MCP servers are built"
        return 1
    elif [ $built -eq 2 ]; then
        log_info "✅ All MCP servers are built"
        return 0
    else
        log_warn "Some MCP servers are missing"
        return 0
    fi
}

# Build MCP servers
build_mcp_servers() {
    log_info "Building MCP servers..."
    
    local mcp_server_dir="$PROJECT_ROOT/mcp-server"
    
    if [ ! -d "$mcp_server_dir" ]; then
        log_error "MCP server directory not found: $mcp_server_dir"
        return 1
    fi
    
    cd "$mcp_server_dir"
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found in MCP server directory"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing MCP server dependencies..."
        npm install
    fi
    
    # Build servers
    log_info "Building MCP servers..."
    if npm run build; then
        log_info "✅ MCP servers built successfully"
        return 0
    else
        log_error "Failed to build MCP servers"
        return 1
    fi
}

# Start Redis if not running
start_redis() {
    log_info "Starting Redis..."
    
    if docker ps | grep -q reconciliation-redis; then
        log_info "✅ Redis Docker container is already running"
        return 0
    fi
    
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        log_info "Starting Redis using docker-compose..."
        cd "$PROJECT_ROOT"
        docker-compose up -d redis
        
        # Wait for Redis to be ready
        local max_attempts=10
        local attempt=0
        while [ $attempt -lt $max_attempts ]; do
            if docker exec reconciliation-redis redis-cli -a redis_pass ping >/dev/null 2>&1; then
                log_info "✅ Redis is ready"
                return 0
            fi
            attempt=$((attempt + 1))
            sleep 1
        done
        
        log_error "Redis failed to start after $max_attempts attempts"
        return 1
    else
        log_error "docker-compose.yml not found"
        return 1
    fi
}

# Main function
main() {
    log_info "=== Redis and MCP Tools Setup ==="
    echo
    
    local errors=0
    
    # Check Redis
    if ! check_redis; then
        log_warn "Redis is not accessible. Attempting to start..."
        if ! start_redis; then
            log_error "Failed to start Redis"
            errors=$((errors + 1))
        fi
    fi
    
    echo
    
    # Check MCP configuration
    if ! check_mcp_config; then
        errors=$((errors + 1))
    fi
    
    echo
    
    # Check MCP build
    if ! check_mcp_build; then
        log_warn "MCP servers need to be built"
        read -p "Build MCP servers now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! build_mcp_servers; then
                errors=$((errors + 1))
            fi
        else
            log_warn "Skipping MCP server build"
        fi
    fi
    
    echo
    log_info "=== Setup Summary ==="
    
    if [ $errors -eq 0 ]; then
        log_info "✅ All checks passed!"
        echo
        log_info "Next steps:"
        echo "  1. Restart Cursor IDE to apply MCP configuration"
        echo "  2. Verify MCP tools are available in Cursor"
        echo "  3. Test Redis operations using MCP tools"
    else
        log_error "Some checks failed. Please review the errors above."
        exit 1
    fi
}

# Run main function
main "$@"

