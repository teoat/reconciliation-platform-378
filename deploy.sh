#!/bin/bash

# ============================================================================
# RECONCILIATION PLATFORM - PRODUCTION DEPLOYMENT SCRIPT
# ============================================================================
# This script handles the complete production deployment of the Reconciliation Platform
# including backend, frontend, database, monitoring, and all supporting services.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="reconciliation-platform"
BACKEND_PORT=2000
FRONTEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379
NGINX_PORT=80
NGINX_SSL_PORT=443

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
INFRASTRUCTURE_DIR="$PROJECT_ROOT/infrastructure"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        log_error "Rust is not installed. Please install Rust first."
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Create environment files
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_info "Creating .env file..."
        cat > "$PROJECT_ROOT/.env" << EOF
# Database Configuration
DATABASE_URL=postgresql://reconciliation:reconciliation_password@postgres:5432/reconciliation_db
POSTGRES_DB=reconciliation_db
POSTGRES_USER=reconciliation
POSTGRES_PASSWORD=reconciliation_password

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=3600

# Server Configuration
HOST=0.0.0.0
PORT=2000

# Frontend Configuration
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
JAEGER_PORT=16686

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/reconciliation.crt
SSL_KEY_PATH=/etc/ssl/private/reconciliation.key
EOF
        log_success "Created .env file"
    fi
    
    # Create uploads directory
    mkdir -p "$PROJECT_ROOT/uploads"
    chmod 755 "$PROJECT_ROOT/uploads"
    
    log_success "Environment setup complete"
}

build_backend() {
    log_info "Building backend..."
    
    cd "$BACKEND_DIR"
    
    # Build Rust backend
    log_info "Compiling Rust backend..."
    cargo build --release
    
    if [ $? -eq 0 ]; then
        log_success "Backend build successful"
    else
        log_error "Backend build failed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

build_frontend() {
    log_info "Building frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm install
    
    # Build frontend
    log_info "Building frontend..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "Frontend build successful"
    else
        log_error "Frontend build failed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

setup_database() {
    log_info "Setting up database..."
    
    # Start PostgreSQL container
    log_info "Starting PostgreSQL container..."
    docker run -d \
        --name reconciliation-postgres \
        -e POSTGRES_DB=reconciliation_db \
        -e POSTGRES_USER=reconciliation \
        -e POSTGRES_PASSWORD=reconciliation_password \
        -p $POSTGRES_PORT:5432 \
        postgres:15
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    log_info "Running database migrations..."
    cd "$BACKEND_DIR"
    cargo run --bin migration
    cd "$PROJECT_ROOT"
    
    log_success "Database setup complete"
}

setup_redis() {
    log_info "Setting up Redis..."
    
    # Start Redis container
    log_info "Starting Redis container..."
    docker run -d \
        --name reconciliation-redis \
        -p $REDIS_PORT:6379 \
        redis:7-alpine
    
    log_success "Redis setup complete"
}

setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Start Prometheus
    log_info "Starting Prometheus..."
    docker run -d \
        --name reconciliation-prometheus \
        -p $PROMETHEUS_PORT:9090 \
        -v "$INFRASTRUCTURE_DIR/monitoring/prometheus.yml":/etc/prometheus/prometheus.yml \
        prom/prometheus:latest
    
    # Start Grafana
    log_info "Starting Grafana..."
    docker run -d \
        --name reconciliation-grafana \
        -p $GRAFANA_PORT:3000 \
        -e GF_SECURITY_ADMIN_PASSWORD=admin \
        grafana/grafana:latest
    
    # Start Jaeger
    log_info "Starting Jaeger..."
    docker run -d \
        --name reconciliation-jaeger \
        -p $JAEGER_PORT:16686 \
        -p 14268:14268 \
        jaegertracing/all-in-one:latest
    
    log_success "Monitoring setup complete"
}

deploy_backend() {
    log_info "Deploying backend..."
    
    # Create backend Docker image
    log_info "Creating backend Docker image..."
    docker build -t reconciliation-backend:latest -f "$INFRASTRUCTURE_DIR/docker/Dockerfile.backend" .
    
    # Start backend container
    log_info "Starting backend container..."
    docker run -d \
        --name reconciliation-backend \
        --link reconciliation-postgres:postgres \
        --link reconciliation-redis:redis \
        -p $BACKEND_PORT:2000 \
        -e DATABASE_URL=postgresql://reconciliation:reconciliation_password@postgres:5432/reconciliation_db \
        -e REDIS_URL=redis://redis:6379 \
        -e JWT_SECRET=your-super-secret-jwt-key-change-this-in-production \
        -e JWT_EXPIRATION=3600 \
        -e HOST=0.0.0.0 \
        -e PORT=2000 \
        reconciliation-backend:latest
    
    log_success "Backend deployed successfully"
}

deploy_frontend() {
    log_info "Deploying frontend..."
    
    # Create frontend Docker image
    log_info "Creating frontend Docker image..."
    docker build -t reconciliation-frontend:latest -f "$INFRASTRUCTURE_DIR/docker/Dockerfile.frontend" .
    
    # Start frontend container
    log_info "Starting frontend container..."
    docker run -d \
        --name reconciliation-frontend \
        --link reconciliation-backend:backend \
        -p $FRONTEND_PORT:3000 \
        -e VITE_API_URL=http://backend:2000/api \
        -e VITE_WS_URL=ws://backend:2000 \
        reconciliation-frontend:latest
    
    log_success "Frontend deployed successfully"
}

setup_nginx() {
    log_info "Setting up Nginx reverse proxy..."
    
    # Create Nginx configuration
    log_info "Creating Nginx configuration..."
    cat > "$INFRASTRUCTURE_DIR/nginx/nginx.conf" << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server reconciliation-backend:2000;
    }
    
    upstream frontend {
        server reconciliation-frontend:3000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # WebSocket
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Monitoring
        location /monitoring {
            proxy_pass http://reconciliation-grafana:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
    
    # Start Nginx container
    log_info "Starting Nginx container..."
    docker run -d \
        --name reconciliation-nginx \
        --link reconciliation-backend:backend \
        --link reconciliation-frontend:frontend \
        --link reconciliation-grafana:reconciliation-grafana \
        -p $NGINX_PORT:80 \
        -v "$INFRASTRUCTURE_DIR/nginx/nginx.conf":/etc/nginx/nginx.conf \
        nginx:alpine
    
    log_success "Nginx setup complete"
}

run_tests() {
    log_info "Running tests..."
    
    # Run backend tests
    log_info "Running backend tests..."
    cd "$BACKEND_DIR"
    cargo test
    cd "$PROJECT_ROOT"
    
    # Run frontend tests
    log_info "Running frontend tests..."
    cd "$FRONTEND_DIR"
    npm test
    cd "$PROJECT_ROOT"
    
    # Run integration tests
    log_info "Running integration tests..."
    cd "$BACKEND_DIR"
    cargo test --test integration_tests
    cd "$PROJECT_ROOT"
    
    log_success "All tests passed"
}

check_health() {
    log_info "Checking application health..."
    
    # Check backend health
    log_info "Checking backend health..."
    if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    log_info "Checking frontend health..."
    if curl -f http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    # Check database health
    log_info "Checking database health..."
    if docker exec reconciliation-postgres pg_isready -U reconciliation > /dev/null 2>&1; then
        log_success "Database is healthy"
    else
        log_error "Database health check failed"
        exit 1
    fi
    
    # Check Redis health
    log_info "Checking Redis health..."
    if docker exec reconciliation-redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis is healthy"
    else
        log_error "Redis health check failed"
        exit 1
    fi
    
    log_success "All services are healthy"
}

show_status() {
    log_info "Application Status:"
    echo ""
    echo "🌐 Application URLs:"
    echo "  Frontend: http://localhost:$NGINX_PORT"
    echo "  Backend API: http://localhost:$NGINX_PORT/api"
    echo "  WebSocket: ws://localhost:$NGINX_PORT/ws"
    echo "  Monitoring: http://localhost:$NGINX_PORT/monitoring"
    echo ""
    echo "📊 Monitoring URLs:"
    echo "  Prometheus: http://localhost:$PROMETHEUS_PORT"
    echo "  Grafana: http://localhost:$GRAFANA_PORT (admin/admin)"
    echo "  Jaeger: http://localhost:$JAEGER_PORT"
    echo ""
    echo "🐳 Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📝 Logs:"
    echo "  Backend: docker logs reconciliation-backend"
    echo "  Frontend: docker logs reconciliation-frontend"
    echo "  Database: docker logs reconciliation-postgres"
    echo "  Redis: docker logs reconciliation-redis"
    echo "  Nginx: docker logs reconciliation-nginx"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Stop and remove containers
    docker stop reconciliation-backend reconciliation-frontend reconciliation-postgres reconciliation-redis reconciliation-nginx reconciliation-prometheus reconciliation-grafana reconciliation-jaeger 2>/dev/null || true
    docker rm reconciliation-backend reconciliation-frontend reconciliation-postgres reconciliation-redis reconciliation-nginx reconciliation-prometheus reconciliation-grafana reconciliation-jaeger 2>/dev/null || true
    
    # Remove images
    docker rmi reconciliation-backend reconciliation-frontend 2>/dev/null || true
    
    log_success "Cleanup complete"
}

# Main deployment function
deploy() {
    log_info "Starting Reconciliation Platform deployment..."
    
    check_dependencies
    setup_environment
    build_backend
    build_frontend
    setup_database
    setup_redis
    setup_monitoring
    deploy_backend
    deploy_frontend
    setup_nginx
    run_tests
    check_health
    show_status
    
    log_success "🎉 Reconciliation Platform deployed successfully!"
    log_info "Visit http://localhost:$NGINX_PORT to access the application"
}

# Script options
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        show_status
        ;;
    "test")
        run_tests
        ;;
    "health")
        check_health
        ;;
    *)
        echo "Usage: $0 {deploy|cleanup|status|test|health}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the complete application"
        echo "  cleanup  - Remove all containers and images"
        echo "  status   - Show application status"
        echo "  test     - Run all tests"
        echo "  health   - Check application health"
        exit 1
        ;;
esac
