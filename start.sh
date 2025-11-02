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

    if [ -d "frontend" ]; then
        cd frontend

        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            echo "Installing frontend dependencies..."
            npm install
        fi

        # Set environment variables
        export VITE_API_URL="${VITE_API_URL:-http://localhost:2000/api}"
        export VITE_WS_URL="${VITE_WS_URL:-ws://localhost:2000}"
        export NODE_ENV="${NODE_ENV:-development}"

        if [ "$MODE" = "prod" ]; then
            echo "Starting frontend in production mode..."
            npm run build
            npm run preview
        else
            echo "Starting frontend in development mode..."
            npm run dev
        fi
    else
        echo -e "${RED}Frontend directory not found${NC}"
        exit 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${YELLOW}Starting Backend...${NC}"

    if [ -d "backend" ]; then
        cd backend

        if [ "$MODE" = "prod" ]; then
            echo "Starting backend in production mode..."
            cargo build --release
            cargo run --release
        else
            echo "Starting backend in development mode..."
            cargo run
        fi
    else
        echo -e "${RED}Backend directory not found${NC}"
        exit 1
    fi
}

# Function to start with docker
start_docker() {
    echo -e "${YELLOW}Starting with Docker...${NC}"

    # Check if docker-compose file exists
    if [ -f "docker-compose.yml" ]; then
        echo "Starting services with docker-compose..."
        docker-compose up -d

        echo -e "${GREEN}Services started. Waiting for health checks...${NC}"
        sleep 10

        # Basic health check
        if curl -f -s http://localhost:2000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend health check failed${NC}"
        fi

        if curl -f -s http://localhost:1000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend check failed${NC}"
        fi

        echo ""
        echo "Access URLs:"
        echo "  Frontend: http://localhost:1000"
        echo "  Backend:  http://localhost:2000"
        echo ""
        echo "Useful commands:"
        echo "  View logs: docker-compose logs -f"
        echo "  Stop:      docker-compose down"
    else
        echo -e "${RED}docker-compose.yml not found${NC}"
        exit 1
    fi
}

# Function to start full stack
start_full() {
    echo -e "${YELLOW}Starting Full Stack...${NC}"

    # Check if we should use docker
    if [ -f "docker-compose.yml" ] && [ "$SERVICE" = "docker" ]; then
        start_docker
        return
    fi

    # Start backend in background
    start_backend &
    BACKEND_PID=$!

    # Wait a bit for backend to start
    sleep 5

    # Start frontend
    start_frontend &
    FRONTEND_PID=$!

    # Wait for user interrupt
    echo -e "${GREEN}Application started${NC}"
    echo "Press Ctrl+C to stop"
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
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
    docker)
        start_docker
        ;;
    full|all)
        start_full
        ;;
    *)
        echo -e "${RED}Unknown service: ${SERVICE}${NC}"
        echo "Usage: ./start.sh [mode] [service]"
        echo "Modes: dev, prod"
        echo "Services: frontend, backend, docker, full/all"
        echo ""
        echo "Examples:"
        echo "  ./start.sh dev frontend    # Start frontend in dev mode"
        echo "  ./start.sh prod backend    # Start backend in prod mode"
        echo "  ./start.sh dev docker      # Start with docker-compose"
        echo "  ./start.sh dev full        # Start full stack (backend + frontend)"
        exit 1
        ;;
esac

