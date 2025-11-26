#!/bin/bash
# ==============================================================================
# Environment Setup Script
# ==============================================================================
# Comprehensive script to set up database and environment for development/production
# Usage: ./scripts/setup-environment.sh [dev|prod|test]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

ENV="${1:-dev}"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

log_info "Setting up environment: $ENV"

# ==============================================================================
# STEP 1: Check Prerequisites
# ==============================================================================

log_info "=== Step 1: Checking Prerequisites ==="

# Check Docker
if ! check_docker; then
    log_error "Docker is required but not running"
    exit 1
fi

# Check docker-compose
if ! check_docker_compose; then
    log_error "docker-compose is required"
    exit 1
fi

# Check if postgres container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^reconciliation-postgres$"; then
    log_warning "PostgreSQL container not found. Starting services..."
    cd "$PROJECT_ROOT"
    docker-compose up -d postgres redis
    log_info "Waiting for services to start..."
    sleep 10
fi

log_success "Prerequisites check passed"

# ==============================================================================
# STEP 2: Check Database Connection
# ==============================================================================

log_info "=== Step 2: Checking Database Connection ==="

# Check if postgres is running
if docker ps --format '{{.Names}}' | grep -q "^reconciliation-postgres$"; then
    log_success "PostgreSQL container is running"
    
    # Test connection
    if docker exec reconciliation-postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL is ready"
    else
        log_error "PostgreSQL is not ready"
        exit 1
    fi
else
    log_error "PostgreSQL container is not running"
    log_info "Starting PostgreSQL..."
    cd "$PROJECT_ROOT"
    docker-compose up -d postgres
    sleep 10
fi

# Check Redis
if docker ps --format '{{.Names}}' | grep -q "^reconciliation-redis$"; then
    log_success "Redis container is running"
    
    # Test connection
    if docker exec reconciliation-redis redis-cli -a redis_pass ping > /dev/null 2>&1; then
        log_success "Redis is ready"
    else
        log_warning "Redis connection test failed (may need password)"
    fi
else
    log_warning "Redis container is not running (optional for migrations)"
fi

# ==============================================================================
# STEP 3: Create .env File
# ==============================================================================

log_info "=== Step 3: Creating .env File ==="

if [ -f "$ENV_FILE" ]; then
    log_warning ".env file already exists"
    read -p "Overwrite existing .env file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Keeping existing .env file"
        SKIP_ENV_CREATE=true
    else
        log_info "Backing up existing .env file"
        cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    fi
fi

if [ "${SKIP_ENV_CREATE:-false}" != "true" ]; then
    log_info "Generating .env file..."
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    CSRF_SECRET=$(openssl rand -hex 32)
    PASSWORD_MASTER_KEY=$(openssl rand -hex 32)
    
    # Get database password from docker-compose or generate
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres_pass}"
    REDIS_PASSWORD="${REDIS_PASSWORD:-redis_pass}"
    
    # Create .env file
    cat > "$ENV_FILE" <<EOF
# ============================================================================
# Reconciliation Platform - Environment Configuration
# ============================================================================
# Generated: $(date)
# Environment: $ENV
# ============================================================================

# Database Configuration
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/reconciliation_app
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis Configuration
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration (REQUIRED)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRATION=86400
JWT_REFRESH_EXPIRATION=604800

# Security Configuration
CSRF_SECRET=${CSRF_SECRET}
PASSWORD_MASTER_KEY=${PASSWORD_MASTER_KEY}

# Application Configuration
HOST=0.0.0.0
PORT=2000
BACKEND_PORT=2000
FRONTEND_PORT=1000
NODE_ENV=${ENV}
ENVIRONMENT=${ENV}
RUST_LOG=info
RUST_BACKTRACE=1

# Frontend Configuration (Vite)
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
VITE_APP_NAME=Reconciliation Platform
VITE_APP_VERSION=1.0.0
VITE_LOG_LEVEL=info
VITE_DEBUG=false

# CORS Configuration
CORS_ORIGINS=http://localhost:1000,http://localhost:3000,http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Database Pool Configuration
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30
REDIS_POOL_SIZE=10
REDIS_TIMEOUT=5

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_PASSWORD=admin
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
LOGSTASH_PORT=5044
APM_PORT=8200

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_METRICS=true
ENABLE_TRACING=true
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
ENABLE_COMPRESSION=true

# Development/Testing
DEBUG=${DEBUG:-false}
ENABLE_SWAGGER=true
RUST_LOG=${RUST_LOG:-info}

# Optional: Google OAuth
# VITE_GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: Email/SMTP
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USERNAME=your_username
# SMTP_PASSWORD=your_password
# SMTP_FROM_ADDRESS=noreply@example.com

# Optional: Monitoring
# SENTRY_DSN=your_sentry_dsn
# VITE_ELASTIC_APM_SERVER_URL=http://localhost:8200
# VITE_ELASTIC_APM_SERVICE_NAME=reconciliation-frontend
# VITE_ELASTIC_APM_ENVIRONMENT=${ENV}

EOF

    # Set secure permissions
    chmod 600 "$ENV_FILE"
    log_success ".env file created: $ENV_FILE"
fi

# ==============================================================================
# STEP 4: Verify Database Connection
# ==============================================================================

log_info "=== Step 4: Verifying Database Connection ==="

# Load environment variables
export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)

# Test database connection
if docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "Database connection verified"
else
    log_warning "Database connection test failed, but continuing..."
fi

# ==============================================================================
# STEP 5: Run Database Migrations
# ==============================================================================

log_info "=== Step 5: Running Database Migrations ==="

cd "$PROJECT_ROOT"

# Export DATABASE_URL for migration script
export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/reconciliation_app"

# Run migrations
if [ -f "scripts/execute-migrations.sh" ]; then
    log_info "Executing migrations..."
    if ./scripts/execute-migrations.sh; then
        log_success "Migrations completed successfully"
    else
        log_warning "Migrations encountered issues (may be expected if tables already exist)"
    fi
else
    log_warning "Migration script not found, skipping migrations"
fi

# ==============================================================================
# STEP 6: Apply Performance Indexes
# ==============================================================================

log_info "=== Step 6: Applying Performance Indexes ==="

if [ -f "scripts/apply-performance-indexes.sh" ]; then
    log_info "Applying performance indexes..."
    if ./scripts/apply-performance-indexes.sh; then
        log_success "Performance indexes applied"
    else
        log_warning "Performance indexes script encountered issues"
    fi
else
    log_warning "Performance indexes script not found, skipping"
fi

# ==============================================================================
# STEP 7: Verify Setup
# ==============================================================================

log_info "=== Step 7: Verifying Setup ==="

# Check critical tables
log_info "Checking critical database tables..."
TABLES=$(docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'projects', 'reconciliation_jobs', 'reconciliation_results');" 2>/dev/null | tr -d ' ')

if [ -n "$TABLES" ] && [ "$TABLES" -gt 0 ]; then
    log_success "Found $TABLES critical table(s) in database"
else
    log_warning "No critical tables found (migrations may need to be run)"
fi

# ==============================================================================
# SUMMARY
# ==============================================================================

log_success "=== Environment Setup Complete ==="
echo ""
log_info "Environment: $ENV"
log_info ".env file: $ENV_FILE"
log_info "Database: PostgreSQL (reconciliation-postgres)"
log_info "Redis: Redis (reconciliation-redis)"
echo ""
log_info "Next steps:"
echo "  1. Review .env file: cat $ENV_FILE"
echo "  2. Start backend: cd backend && cargo run"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Or use Docker: docker-compose up -d"
echo ""
log_info "Database connection string:"
echo "  DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/reconciliation_app"
echo ""
log_info "Useful commands:"
echo "  - Connect to database: docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_app"
echo "  - View logs: docker-compose logs -f postgres"
echo "  - Run migrations: ./scripts/execute-migrations.sh"
echo "  - Verify setup: ./scripts/verify-all-services.sh dev http://localhost:2000"

