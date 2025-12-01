#!/bin/bash

# =============================================================================
# Log Viewer Script
# =============================================================================
# This script provides unified access to logs across different services
# and log aggregation systems (Elasticsearch/Kibana, Loki, local files)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
LOKI_URL="${LOKI_URL:-http://localhost:3100}"
LOG_DIR="${LOG_DIR:-/var/log/reconciliation-platform}"
DEFAULT_LINES=100
DEFAULT_SINCE="1h"

# Logging functions
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
info() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

show_help() {
    cat << EOF
${CYAN}=== Reconciliation Platform Log Viewer ===${NC}

Usage: $0 [OPTIONS] COMMAND [ARGS]

Commands:
    service <name>     View logs for a specific service (backend, frontend, auth-server, db)
    search <query>     Search logs across all services
    tail <service>     Tail logs in real-time for a service
    errors             Show error logs from all services
    audit              View audit logs
    kibana             Open Kibana dashboard URL
    export             Export logs to file

Options:
    -n, --lines NUM    Number of log lines to display (default: $DEFAULT_LINES)
    -s, --since TIME   Show logs since time ago (e.g., 1h, 30m, 2d) (default: $DEFAULT_SINCE)
    -e, --env ENV      Environment (development, staging, production)
    -f, --format FMT   Output format (text, json, csv)
    -l, --level LEVEL  Filter by log level (debug, info, warn, error)
    --from DATE        Start date (ISO format: YYYY-MM-DDTHH:MM:SS)
    --to DATE          End date (ISO format: YYYY-MM-DDTHH:MM:SS)
    -h, --help         Show this help message

Examples:
    $0 service backend -n 50
    $0 search "error" --since 2h
    $0 tail backend
    $0 errors --level error
    $0 export --from 2024-01-01T00:00:00 --to 2024-01-02T00:00:00
EOF
}

# Check if Elasticsearch is available
check_elasticsearch() {
    curl -s "$ELASTICSEARCH_URL/_cluster/health" > /dev/null 2>&1
}

# Check if Loki is available
check_loki() {
    curl -s "$LOKI_URL/ready" > /dev/null 2>&1
}

# Parse time duration to seconds
parse_duration() {
    local duration="$1"
    local value="${duration%[a-z]*}"
    local unit="${duration##*[0-9]}"
    
    case "$unit" in
        s) echo "$value";;
        m) echo $((value * 60));;
        h) echo $((value * 3600));;
        d) echo $((value * 86400));;
        w) echo $((value * 604800));;
        *) echo "$value";;
    esac
}

# Query Elasticsearch for logs
query_elasticsearch() {
    local index="$1"
    local query="$2"
    local size="${3:-$DEFAULT_LINES}"
    local since="${4:-now-1h}"
    
    local body=$(cat <<EOF
{
    "query": {
        "bool": {
            "must": [
                {"query_string": {"query": "$query"}},
                {"range": {"@timestamp": {"gte": "$since"}}}
            ]
        }
    },
    "size": $size,
    "sort": [{"@timestamp": {"order": "desc"}}]
}
EOF
)
    
    curl -s -X POST "$ELASTICSEARCH_URL/$index/_search" \
        -H "Content-Type: application/json" \
        -d "$body" | jq -r '.hits.hits[]._source | "\(.["@timestamp"]) [\(.level // "INFO")] \(.service // "unknown"): \(.message // .msg // .)"'
}

# Query Loki for logs
query_loki() {
    local labels="$1"
    local query="$2"
    local limit="${3:-$DEFAULT_LINES}"
    local since="${4:-1h}"
    
    local since_ns=$(( $(parse_duration "$since") * 1000000000 ))
    local start=$(( $(date +%s%N) - since_ns ))
    
    local url="$LOKI_URL/loki/api/v1/query_range"
    local loki_query="{$labels}"
    
    if [ -n "$query" ]; then
        loki_query="{$labels} |= \"$query\""
    fi
    
    curl -s -G "$url" \
        --data-urlencode "query=$loki_query" \
        --data-urlencode "start=$start" \
        --data-urlencode "limit=$limit" | jq -r '.data.result[].values[][1]'
}

# View local log files
view_local_logs() {
    local service="$1"
    local lines="${2:-$DEFAULT_LINES}"
    local log_file=""
    
    case "$service" in
        backend)     log_file="$LOG_DIR/backend.log";;
        frontend)    log_file="$LOG_DIR/frontend.log";;
        auth-server) log_file="$LOG_DIR/auth-server.log";;
        db)          log_file="$LOG_DIR/postgres.log";;
        nginx)       log_file="/var/log/nginx/access.log";;
        *)           log_file="$LOG_DIR/$service.log";;
    esac
    
    if [ -f "$log_file" ]; then
        tail -n "$lines" "$log_file"
    else
        # Try Docker logs as fallback
        docker logs --tail "$lines" "reconciliation-$service" 2>/dev/null || \
            error "Cannot find logs for service: $service"
    fi
}

# View logs for a specific service
view_service_logs() {
    local service="$1"
    local lines="${2:-$DEFAULT_LINES}"
    local since="${3:-$DEFAULT_SINCE}"
    
    log "Fetching logs for service: $service"
    
    if check_elasticsearch; then
        info "Using Elasticsearch"
        query_elasticsearch "logs-$service-*" "*" "$lines" "now-$since"
    elif check_loki; then
        info "Using Loki"
        query_loki "service=\"$service\"" "" "$lines" "$since"
    else
        info "Using local logs / Docker"
        view_local_logs "$service" "$lines"
    fi
}

# Search logs across all services
search_logs() {
    local query="$1"
    local lines="${2:-$DEFAULT_LINES}"
    local since="${3:-$DEFAULT_SINCE}"
    
    log "Searching logs for: $query"
    
    if check_elasticsearch; then
        query_elasticsearch "logs-*" "$query" "$lines" "now-$since"
    elif check_loki; then
        query_loki "" "$query" "$lines" "$since"
    else
        # Search local log files
        grep -r --include="*.log" "$query" "$LOG_DIR" 2>/dev/null | tail -n "$lines"
    fi
}

# Tail logs in real-time
tail_logs() {
    local service="$1"
    
    log "Tailing logs for service: $service (Ctrl+C to stop)"
    
    # Try Docker logs first
    if docker ps --format '{{.Names}}' | grep -q "reconciliation-$service"; then
        docker logs -f "reconciliation-$service"
    elif [ -f "$LOG_DIR/$service.log" ]; then
        tail -f "$LOG_DIR/$service.log"
    else
        error "Cannot find logs for service: $service"
        exit 1
    fi
}

# View error logs from all services
view_errors() {
    local lines="${1:-$DEFAULT_LINES}"
    local since="${2:-$DEFAULT_SINCE}"
    local level="${3:-error}"
    
    log "Fetching $level logs from all services"
    
    if check_elasticsearch; then
        query_elasticsearch "logs-*" "level:($level OR ERROR OR error)" "$lines" "now-$since"
    elif check_loki; then
        query_loki "" "level=$level" "$lines" "$since"
    else
        # Search local files
        grep -rhi --include="*.log" -E "(error|ERROR|Error|WARN|warning)" "$LOG_DIR" 2>/dev/null | tail -n "$lines"
    fi
}

# View audit logs
view_audit_logs() {
    local lines="${1:-$DEFAULT_LINES}"
    local since="${2:-$DEFAULT_SINCE}"
    
    log "Fetching audit logs"
    
    if check_elasticsearch; then
        query_elasticsearch "audit-*" "*" "$lines" "now-$since"
    else
        if [ -f "$LOG_DIR/audit.log" ]; then
            tail -n "$lines" "$LOG_DIR/audit.log"
        else
            error "Audit logs not found"
        fi
    fi
}

# Export logs to file
export_logs() {
    local from_date="$1"
    local to_date="$2"
    local output="${3:-logs_export_$(date +%Y%m%d_%H%M%S).json}"
    
    log "Exporting logs from $from_date to $to_date"
    
    if check_elasticsearch; then
        local body=$(cat <<EOF
{
    "query": {
        "range": {
            "@timestamp": {
                "gte": "$from_date",
                "lte": "$to_date"
            }
        }
    },
    "size": 10000,
    "sort": [{"@timestamp": {"order": "asc"}}]
}
EOF
)
        curl -s -X POST "$ELASTICSEARCH_URL/logs-*/_search" \
            -H "Content-Type: application/json" \
            -d "$body" > "$output"
        
        log "Logs exported to: $output"
    else
        error "Elasticsearch not available for export"
        exit 1
    fi
}

# Main script
main() {
    local command=""
    local lines=$DEFAULT_LINES
    local since=$DEFAULT_SINCE
    local env="development"
    local format="text"
    local level=""
    local from_date=""
    local to_date=""
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -n|--lines)   lines="$2"; shift 2;;
            -s|--since)   since="$2"; shift 2;;
            -e|--env)     env="$2"; shift 2;;
            -f|--format)  format="$2"; shift 2;;
            -l|--level)   level="$2"; shift 2;;
            --from)       from_date="$2"; shift 2;;
            --to)         to_date="$2"; shift 2;;
            -h|--help)    show_help; exit 0;;
            service|search|tail|errors|audit|kibana|export)
                command="$1"
                shift
                break
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Execute command
    case "$command" in
        service)
            view_service_logs "${1:-backend}" "$lines" "$since"
            ;;
        search)
            search_logs "${1:-*}" "$lines" "$since"
            ;;
        tail)
            tail_logs "${1:-backend}"
            ;;
        errors)
            view_errors "$lines" "$since" "${level:-error}"
            ;;
        audit)
            view_audit_logs "$lines" "$since"
            ;;
        kibana)
            log "Kibana Dashboard: $KIBANA_URL"
            log "Default dashboards:"
            echo "  - Application Logs: $KIBANA_URL/app/logs/stream"
            echo "  - Error Dashboard: $KIBANA_URL/app/dashboards#/view/error-dashboard"
            echo "  - Metrics: $KIBANA_URL/app/metrics/inventory"
            ;;
        export)
            export_logs "$from_date" "$to_date" "$1"
            ;;
        *)
            show_help
            ;;
    esac
}

main "$@"
