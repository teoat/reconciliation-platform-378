#!/bin/bash
# ==============================================================================
# Common Functions Library
# ==============================================================================
# Shared utility functions for shell scripts across the reconciliation platform
# Source this file in your scripts: source "$(dirname "$0")/lib/common-functions.sh"
# ==============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================

# Log info message
log_info() {
    local message="$1"
    local log_file="${2:-}"
    if [ -n "$log_file" ]; then
        echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$log_file"
    else
        echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message"
    fi
}

# Log success message
log_success() {
    local message="$1"
    local log_file="${2:-}"
    if [ -n "$log_file" ]; then
        echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$log_file"
    else
        echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message"
    fi
}

# Log warning message
log_warning() {
    local message="$1"
    local log_file="${2:-}"
    if [ -n "$log_file" ]; then
        echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$log_file"
    else
        echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message"
    fi
}

# Log error message
log_error() {
    local message="$1"
    local log_file="${2:-}"
    if [ -n "$log_file" ]; then
        echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$log_file" >&2
    else
        echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" >&2
    fi
}

# Print status (alternative naming)
print_status() {
    log_info "$1" "${2:-}"
}

# Print success (alternative naming)
print_success() {
    log_success "$1" "${2:-}"
}

# Print error (alternative naming)
print_error() {
    log_error "$1" "${2:-}"
}

# Echo info (alternative naming)
echo_info() {
    log_info "$1" "${2:-}"
}

# Echo warn (alternative naming)
echo_warn() {
    log_warning "$1" "${2:-}"
}

# Echo error (alternative naming)
echo_error() {
    log_error "$1" "${2:-}"
}

# ==============================================================================
# VALIDATION FUNCTIONS
# ==============================================================================

# Check if command exists
check_command() {
    local cmd="$1"
    if ! command -v "$cmd" &> /dev/null; then
        log_error "$cmd is not installed. Please install it first."
        return 1
    fi
    return 0
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        return 1
    fi
    return 0
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
        log_error "docker-compose is not installed"
        return 1
    fi
    return 0
}

# Check prerequisites (common tools)
check_prerequisites() {
    local tools=("docker" "docker-compose" "git")
    local missing=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing+=("$tool")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing prerequisites: ${missing[*]}"
        return 1
    fi
    
    check_docker || return 1
    log_success "Prerequisites check passed"
    return 0
}

# Validate file exists
validate_file_exists() {
    local file="$1"
    local description="${2:-File}"
    
    if [ ! -f "$file" ]; then
        log_error "$description not found: $file"
        return 1
    fi
    return 0
}

# Validate directory exists
validate_directory_exists() {
    local dir="$1"
    local description="${2:-Directory}"
    
    if [ ! -d "$dir" ]; then
        log_error "$description not found: $dir"
        return 1
    fi
    return 0
}

# Validate port is available
validate_port() {
    local port="$1"
    local service="${2:-Service}"
    
    if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "$service port $port is already in use"
        return 1
    fi
    return 0
}

# Validate environment variable is set
validate_env_var() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        log_error "Environment variable $var_name is not set"
        return 1
    fi
    return 0
}

# ==============================================================================
# HEALTH CHECK FUNCTIONS
# ==============================================================================

# Check HTTP endpoint
check_endpoint() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-5}"
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        return 0
    else
        log_warning "Endpoint $url returned status $status_code (expected $expected_status)"
        return 1
    fi
}

# Health check with retries
health_check() {
    local url="$1"
    local max_attempts="${2:-30}"
    local delay="${3:-10}"
    local description="${4:-Service}"
    
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if check_endpoint "$url" "200" 5; then
            log_success "$description health check passed"
            return 0
        fi
        
        log_info "$description health check attempt $attempt/$max_attempts failed, retrying in ${delay}s..."
        sleep "$delay"
        ((attempt++))
    done
    
    log_error "$description health check failed after $max_attempts attempts"
    return 1
}

# ==============================================================================
# BACKUP FUNCTIONS
# ==============================================================================

# Create backup directory
create_backup_dir() {
    local backup_dir="${1:-./backups}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local full_path="$backup_dir/$timestamp"
    
    mkdir -p "$full_path"
    echo "$full_path"
}

# Backup PostgreSQL database
backup_postgresql() {
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-5432}"
    local db_name="${DB_NAME:-reconciliation_app}"
    local db_user="${DB_USER:-postgres}"
    local backup_dir="${1:-./backups/database}"
    local backup_file="$backup_dir/postgresql-$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    log_info "Starting PostgreSQL backup..."
    
    if command -v pg_dump > /dev/null 2>&1; then
        if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" > "$backup_file" 2>/dev/null; then
            log_success "PostgreSQL backup created: $backup_file"
            echo "$backup_file"
            return 0
        fi
    elif docker ps | grep -q postgres; then
        local container=$(docker ps --format "{{.Names}}" | grep -i postgres | head -1)
        if docker exec "$container" pg_dump -U "$db_user" -d "$db_name" > "$backup_file" 2>/dev/null; then
            log_success "PostgreSQL backup created: $backup_file"
            echo "$backup_file"
            return 0
        fi
    fi
    
    log_error "Failed to create PostgreSQL backup"
    return 1
}

# List backups
list_backups() {
    local backup_dir="${1:-./backups}"
    local pattern="${2:-*.sql*}"
    
    if [ ! -d "$backup_dir" ]; then
        log_warning "Backup directory not found: $backup_dir"
        return 1
    fi
    
    log_info "Available backups in $backup_dir:"
    find "$backup_dir" -name "$pattern" -type f -exec ls -lh {} \; | awk '{print $9, $5, $6, $7, $8}'
    return 0
}

# Cleanup old backups
cleanup_old_backups() {
    local backup_dir="${1:-./backups}"
    local retention_days="${2:-30}"
    
    if [ ! -d "$backup_dir" ]; then
        return 0
    fi
    
    log_info "Cleaning up backups older than $retention_days days..."
    local deleted
    deleted=$(find "$backup_dir" -type f -mtime +$retention_days -delete -print | wc -l)
    
    if [ "$deleted" -gt 0 ]; then
        log_success "Deleted $deleted old backup(s)"
    else
        log_info "No old backups to clean up"
    fi
}

# ==============================================================================
# DEPLOYMENT FUNCTIONS
# ==============================================================================

# Verify deployment
verify_deployment() {
    local health_url="${1:-http://localhost:2000/health}"
    local max_attempts="${2:-10}"
    
    log_info "Verifying deployment..."
    
    if health_check "$health_url" "$max_attempts" 5 "Deployment"; then
        log_success "Deployment verified successfully"
        return 0
    else
        log_error "Deployment verification failed"
        return 1
    fi
}

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        return 1
    fi
    return 0
}

# Send notification (webhook)
send_notification() {
    local status="$1"
    local message="$2"
    local webhook="${3:-${SLACK_WEBHOOK_URL:-}}"
    
    if [ -z "$webhook" ]; then
        return 0
    fi
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$status: $message\"}" \
        "$webhook" 2>/dev/null || log_warning "Failed to send notification"
}

# Get script directory
get_script_dir() {
    local script_path="${BASH_SOURCE[0]}"
    if [ -L "$script_path" ]; then
        script_path=$(readlink "$script_path")
    fi
    dirname "$(cd "$(dirname "$script_path")" && pwd -P)"
}

# ==============================================================================
# EXPORT FUNCTIONS
# ==============================================================================

# Export all functions for use in other scripts
export -f log_info log_success log_warning log_error
export -f print_status print_success print_error
export -f echo_info echo_warn echo_error
export -f check_command check_docker check_docker_compose check_prerequisites
export -f validate_file_exists validate_directory_exists validate_port validate_env_var
export -f check_endpoint health_check
export -f create_backup_dir backup_postgresql list_backups cleanup_old_backups
export -f verify_deployment
export -f check_root send_notification get_script_dir

