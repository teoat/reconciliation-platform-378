#!/bin/bash
# ============================================================================
# UNIFIED STARTUP SCRIPT - Reconciliation Platform
# ============================================================================
# Single entry point for starting the application
# Supports: dev, prod, frontend, backend, full
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default mode
MODE="${1:-dev}"
SERVICE="${2:-full}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🚀 Reconciliation Platform - Unified Startup${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "Mode: ${GREEN}${MODE}${NC}"
echo -e "Service: ${GREEN}${SERVICE}${NC}"
echo ""

# Function to start frontend
start_frontend() {
    echo -e "${YELLOW}Starting Frontend...${NC}"
    cd frontend
    bash start.sh
}

# Function to start backend
start_backend() {
    echo -e "${YELLOW}Starting Backend...${NC}"
    cd backend
    
    if [ "$MODE" = "prod" ]; then
        echo "Starting in production mode..."
        cargo build --release
        cargo run --release
    else
        echo "Starting in development mode..."
        cargo run
    fi
}

# Function to start full stack
start_full() {
    echo -e "${YELLOW}Starting Full Stack...${NC}"
    
    # Start backend in background
    start_backend &
    BACKEND_PID=$!
    
    # Wait a bit
    sleep 3
    
    # Start frontend
    start_frontend &
    FRONTEND_PID=$!
    
    # Wait for user interrupt
    echo -e "${GREEN}Application started${NC}"
    echo "Press Ctrl+C to stop"
    trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
    wait
}

# Main logic
case "$SERVICE" in
    frontend)
        start_frontend
        ;;
    backend)
        start_backend
        ;;
    full)
        start_full
        ;;
    *)
        echo -e "${RED}Unknown service: ${SERVICE}${NC}"
        echo "Usage: ./start.sh [mode] [service]"
        echo "Modes: dev, prod"
        echo "Services: frontend, backend, full"
        exit 1
        ;;
esac

