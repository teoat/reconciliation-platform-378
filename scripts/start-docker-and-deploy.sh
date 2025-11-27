#!/bin/bash
# Start Docker Desktop and Deploy with Beeceptor
# Attempts to start Docker Desktop if not running, then deploys

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🚀 Starting Docker and Deploying with Beeceptor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    log_success "✅ Docker is already running"
else
    log_info "Docker is not running, attempting to start Docker Desktop..."
    
    # Try to start Docker Desktop on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "/Applications/Docker.app" ]; then
            log_info "Opening Docker Desktop..."
            open -a Docker
            log_info "Waiting for Docker to start (this may take 30-60 seconds)..."
            
            # Wait for Docker to start (max 2 minutes)
            MAX_WAIT=120
            ELAPSED=0
            while [ $ELAPSED -lt $MAX_WAIT ]; do
                if docker info > /dev/null 2>&1; then
                    log_success "✅ Docker started successfully"
                    break
                fi
                sleep 2
                ELAPSED=$((ELAPSED + 2))
                if [ $((ELAPSED % 10)) -eq 0 ]; then
                    log_info "Still waiting for Docker... (${ELAPSED}s/${MAX_WAIT}s)"
                fi
            done
            
            if ! docker info > /dev/null 2>&1; then
                log_error "❌ Docker did not start within ${MAX_WAIT} seconds"
                log_error "Please start Docker Desktop manually and run:"
                log_error "   ./scripts/setup-and-deploy-beeceptor.sh"
                exit 1
            fi
        else
            log_error "❌ Docker Desktop not found at /Applications/Docker.app"
            log_error "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
            exit 1
        fi
    else
        log_error "❌ Docker is not running"
        log_error "Please start Docker manually and run:"
        log_error "   ./scripts/setup-and-deploy-beeceptor.sh"
        exit 1
    fi
fi

# Run the complete setup and deployment
log_info "Running complete setup and deployment..."
cd "$SCRIPT_DIR/.."
./scripts/setup-and-deploy-beeceptor.sh

