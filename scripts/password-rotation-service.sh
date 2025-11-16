#!/bin/bash
# Password Rotation Service
# Runs password rotation scheduler as a background service

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/data/password-rotation.pid"
LOG_FILE="$PROJECT_ROOT/data/password-rotation.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            # Stale PID file
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Start the rotation service
start() {
    if check_running; then
        echo_warn "Password rotation service is already running (PID: $(cat "$PID_FILE"))"
        return 1
    fi

    echo_info "Starting password rotation service..."
    
    # Create data directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/data"
    
    # Start the rotation service via API endpoint (runs in background)
    # In production, this would be a proper service/daemon
    cd "$PROJECT_ROOT/backend"
    
    # For now, we'll use a simple cron-like approach
    # In production, use systemd, supervisor, or similar
    (
        while true; do
            # Call the rotate-due endpoint every hour
            curl -X POST http://localhost:2000/api/passwords/rotate-due \
                -H "Content-Type: application/json" \
                >> "$LOG_FILE" 2>&1 || true
            
            # Sleep for 1 hour (3600 seconds)
            sleep 3600
        done
    ) &
    
    echo $! > "$PID_FILE"
    echo_info "Password rotation service started (PID: $(cat "$PID_FILE"))"
    echo_info "Logs: $LOG_FILE"
}

# Stop the rotation service
stop() {
    if ! check_running; then
        echo_warn "Password rotation service is not running"
        return 1
    fi

    PID=$(cat "$PID_FILE")
    echo_info "Stopping password rotation service (PID: $PID)..."
    
    kill "$PID" 2>/dev/null || true
    rm -f "$PID_FILE"
    
    echo_info "Password rotation service stopped"
}

# Restart the rotation service
restart() {
    stop
    sleep 2
    start
}

# Show status
status() {
    if check_running; then
        PID=$(cat "$PID_FILE")
        echo_info "Password rotation service is running (PID: $PID)"
        echo_info "Log file: $LOG_FILE"
        if [ -f "$LOG_FILE" ]; then
            echo_info "Last 10 lines of log:"
            tail -n 10 "$LOG_FILE"
        fi
    else
        echo_warn "Password rotation service is not running"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the password rotation service"
    echo "  stop    - Stop the password rotation service"
    echo "  restart - Restart the password rotation service"
    echo "  status  - Show service status"
}

# Main
case "${1:-}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    *)
        usage
        exit 1
        ;;
esac

exit 0

