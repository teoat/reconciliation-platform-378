#!/bin/bash
# scripts/manage-passwords.sh
# SSOT Password Management Script
# Manages all application passwords/secrets from a single source of truth

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# SSOT: Single Source of Truth for passwords
ENV_FILE="${PROJECT_ROOT}/.env"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.example"

# Default passwords (for development only - change in production)
DEFAULT_POSTGRES_PASSWORD="postgres_pass"
DEFAULT_REDIS_PASSWORD="redis_pass"
DEFAULT_JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'change_me_in_production_min_32_chars')"
DEFAULT_JWT_REFRESH_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'change_me_in_production_min_32_chars')"

# Function to check if .env exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env file not found. Creating from template..."
        create_env_file
    fi
}

# Function to create .env file from template
create_env_file() {
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        log_success "Created .env from .env.example"
    else
        # Create basic .env file
        cat > "$ENV_FILE" << EOF
# ============================================================================
# RECONCILIATION PLATFORM - SSOT PASSWORD CONFIGURATION
# ============================================================================
# This is the SINGLE SOURCE OF TRUTH for all application passwords/secrets
# DO NOT commit this file to version control
# ============================================================================
# Generated: $(date)
# ============================================================================

# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DEFAULT_POSTGRES_PASSWORD}
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:${DEFAULT_POSTGRES_PASSWORD}@localhost:5432/reconciliation_app

# Redis Configuration
REDIS_PASSWORD=${DEFAULT_REDIS_PASSWORD}
REDIS_PORT=6379
REDIS_URL=redis://:${DEFAULT_REDIS_PASSWORD}@localhost:6379

# JWT Configuration
JWT_SECRET=${DEFAULT_JWT_SECRET}
JWT_REFRESH_SECRET=${DEFAULT_JWT_REFRESH_SECRET}
JWT_EXPIRATION_HOURS=24
JWT_REFRESH_EXPIRATION=86400

# Application Configuration
RUST_LOG=info
NODE_ENV=development
PORT=2000
BACKEND_URL=http://localhost:2000
FRONTEND_URL=http://localhost:1000

# CSRF Protection
CSRF_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'change_me_in_production_min_32_chars')

# Password Manager Master Key
PASSWORD_MASTER_KEY=$(openssl rand -base64 32 2>/dev/null || echo 'change_me_in_production_min_32_chars')
EOF
        log_success "Created new .env file with default passwords"
    fi
}

# Function to source .env file
source_env() {
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    else
        log_error ".env file not found. Run '$0 init' first."
        exit 1
    fi
}

# Function to get password from .env
get_password() {
    local password_name=$1
    source_env
    eval "echo \$${password_name}"
}

# Function to set password in .env
set_password() {
    local password_name=$1
    local password_value=$2
    
    if [ ! -f "$ENV_FILE" ]; then
        create_env_file
    fi
    
    # Update or add password in .env file
    if grep -q "^${password_name}=" "$ENV_FILE"; then
        # Update existing password
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${password_name}=.*|${password_name}=${password_value}|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^${password_name}=.*|${password_name}=${password_value}|" "$ENV_FILE"
        fi
    else
        # Add new password
        echo "${password_name}=${password_value}" >> "$ENV_FILE"
    fi
    
    log_success "Updated ${password_name} in .env"
}

# Function to generate secure password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# Function to validate password strength
validate_password() {
    local password=$1
    local min_length=${2:-16}
    
    if [ ${#password} -lt "$min_length" ]; then
        log_error "Password must be at least $min_length characters"
        return 1
    fi
    
    return 0
}

# Function to sync passwords to Docker containers
sync_docker_passwords() {
    log_info "Syncing passwords to Docker containers..."
    source_env
    
    # Restart Redis with new password if changed
    if docker ps | grep -q reconciliation-redis; then
        log_info "Restarting Redis container with updated password..."
        docker-compose restart redis
    fi
    
    # Restart Postgres with new password if changed
    if docker ps | grep -q reconciliation-postgres; then
        log_info "Restarting Postgres container with updated password..."
        docker-compose restart postgres
    fi
    
    log_success "Docker containers synced"
}

# Function to update MCP configuration
update_mcp_config() {
    log_info "Updating MCP server configuration..."
    source_env
    
    # Update MCP configuration script
    if [ -f "$PROJECT_ROOT/scripts/setup-mcp.sh" ]; then
        # Update Redis URL in setup-mcp.sh
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|REDIS_URL.*redis://:.*@localhost:6379|REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379|g" "$PROJECT_ROOT/scripts/setup-mcp.sh"
            sed -i '' "s|postgresql://postgres:.*@localhost|postgresql://postgres:${POSTGRES_PASSWORD}@localhost|g" "$PROJECT_ROOT/scripts/setup-mcp.sh"
        else
            sed -i "s|REDIS_URL.*redis://:.*@localhost:6379|REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379|g" "$PROJECT_ROOT/scripts/setup-mcp.sh"
            sed -i "s|postgresql://postgres:.*@localhost|postgresql://postgres:${POSTGRES_PASSWORD}@localhost|g" "$PROJECT_ROOT/scripts/setup-mcp.sh"
        fi
        
        # Regenerate MCP config
        "$PROJECT_ROOT/scripts/setup-mcp.sh"
        log_success "MCP configuration updated"
    fi
}

# Function to show current passwords (masked)
show_passwords() {
    log_info "Current password configuration (masked):"
    source_env
    
    echo ""
    echo -e "${BLUE}Database:${NC}"
    echo "  POSTGRES_USER: ${POSTGRES_USER}"
    echo "  POSTGRES_PASSWORD: $(mask_password "${POSTGRES_PASSWORD}")"
    echo ""
    echo -e "${BLUE}Redis:${NC}"
    echo "  REDIS_PASSWORD: $(mask_password "${REDIS_PASSWORD}")"
    echo "  REDIS_URL: $(echo "${REDIS_URL}" | sed "s|:.*@|:***@|g")"
    echo ""
    echo -e "${BLUE}JWT:${NC}"
    echo "  JWT_SECRET: $(mask_password "${JWT_SECRET}")"
    echo "  JWT_REFRESH_SECRET: $(mask_password "${JWT_REFRESH_SECRET}")"
    echo ""
}

# Function to mask password
mask_password() {
    local password=$1
    if [ ${#password} -gt 8 ]; then
        echo "${password:0:4}***${password: -4}"
    else
        echo "***"
    fi
}

# Function to check password consistency
check_consistency() {
    log_info "Checking password consistency across configuration files..."
    source_env
    
    local errors=0
    
    # Check Redis password in docker-compose.yml
    if grep -q "REDIS_PASSWORD.*redis_pass" docker-compose.yml 2>/dev/null && [ "$REDIS_PASSWORD" != "redis_pass" ]; then
        log_warning "Redis password mismatch in docker-compose.yml"
        errors=$((errors + 1))
    fi
    
    # Check MCP configuration
    if [ -f ".cursor/mcp.json" ]; then
        local mcp_redis_url=$(grep -o 'redis://:[^@]*@' .cursor/mcp.json | cut -d: -f3 | cut -d@ -f1 || echo "")
        if [ -n "$mcp_redis_url" ] && [ "$mcp_redis_url" != "$REDIS_PASSWORD" ]; then
            log_warning "Redis password mismatch in MCP configuration"
            errors=$((errors + 1))
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "All passwords are consistent"
    else
        log_warning "Found $errors inconsistency(ies). Run '$0 sync' to fix."
    fi
}

# Main command handler
case "${1:-}" in
    init)
        check_env_file
        log_success "Password management initialized"
        ;;
    show)
        show_passwords
        ;;
    get)
        if [ -z "$2" ]; then
            log_error "Usage: $0 get <PASSWORD_NAME>"
            exit 1
        fi
        get_password "$2"
        ;;
    set)
        if [ -z "$2" ] || [ -z "$3" ]; then
            log_error "Usage: $0 set <PASSWORD_NAME> <PASSWORD_VALUE>"
            exit 1
        fi
        if validate_password "$3"; then
            set_password "$2" "$3"
        else
            exit 1
        fi
        ;;
    generate)
        local password_name=${2:-}
        local length=${3:-32}
        if [ -z "$password_name" ]; then
            log_error "Usage: $0 generate <PASSWORD_NAME> [LENGTH]"
            exit 1
        fi
        local new_password=$(generate_password "$length")
        set_password "$password_name" "$new_password"
        echo -e "${GREEN}Generated password: ${new_password}${NC}"
        ;;
    sync)
        sync_docker_passwords
        update_mcp_config
        log_success "All configurations synced"
        ;;
    check)
        check_consistency
        ;;
    *)
        echo "SSOT Password Management Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  init              Initialize .env file (if not exists)"
        echo "  show              Show current passwords (masked)"
        echo "  get <name>        Get password value"
        echo "  set <name> <val>  Set password value"
        echo "  generate <name>   Generate and set secure password"
        echo "  sync              Sync passwords to Docker and MCP configs"
        echo "  check             Check password consistency"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 generate REDIS_PASSWORD"
        echo "  $0 set REDIS_PASSWORD my_new_password"
        echo "  $0 sync"
        echo "  $0 check"
        exit 1
        ;;
esac

