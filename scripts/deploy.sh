#!/bin/bash

# Deployment Script for 378 Reconciliation Platform
# Usage: ./deploy.sh [environment] [version]
# Environment: staging, production
# Version: optional, defaults to latest

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
PROJECT_NAME="reconciliation-platform"
DEPLOY_DIR="/opt/reconciliation-platform"
BACKUP_DIR="/opt/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    # Check if required files exist
    if [[ ! -f "docker-compose.${ENVIRONMENT}.yml" ]]; then
        error "Docker Compose file for ${ENVIRONMENT} not found"
    fi
    
    if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
        error "Environment file for ${ENVIRONMENT} not found"
    fi
    
    log "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p ${BACKUP_DIR}
    
    # Create database backup
    if docker-compose -f docker-compose.${ENVIRONMENT}.yml ps postgres | grep -q "Up"; then
        log "Creating database backup..."
        docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T postgres pg_dump -U reconciliation_user -d reconciliation_platform > ${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql
        log "Database backup created"
    else
        warning "PostgreSQL container is not running, skipping database backup"
    fi
    
    # Create file backup
    if [[ -d "${DEPLOY_DIR}/uploads" ]]; then
        log "Creating file backup..."
        sudo tar -czf ${BACKUP_DIR}/uploads_$(date +%Y%m%d_%H%M%S).tar.gz -C ${DEPLOY_DIR} uploads
        log "File backup created"
    fi
    
    # Clean up old backups (keep last 7 days)
    find ${BACKUP_DIR} -name "backup_*.sql" -mtime +7 -delete
    find ${BACKUP_DIR} -name "uploads_*.tar.gz" -mtime +7 -delete
    
    log "Backup completed"
}

# Pull latest code
pull_code() {
    log "Pulling latest code..."
    
    cd ${DEPLOY_DIR}
    git fetch origin
    git checkout master
    git pull origin master
    
    if [ $? -ne 0 ]; then
        error "Failed to pull from master branch. Please ensure the master branch exists."
    fi
    
    log "Code updated"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    cd ${DEPLOY_DIR}
    
    # Copy environment file
    cp .env.${ENVIRONMENT} .env
    
    # Pull latest images
    log "Pulling Docker images..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml pull
    
    # Build custom images
    log "Building custom images..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml build
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    
    # Start services
    log "Starting services..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T backend diesel migration run
    
    log "Deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if services are running
    if ! docker-compose -f docker-compose.${ENVIRONMENT}.yml ps | grep -q "Up"; then
        error "Some services are not running"
    fi
    
    # Check application health
    local health_url="http://localhost:8080/health"
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        health_url="https://api.378reconciliation.com/health"
    fi
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s ${health_url} > /dev/null; then
            log "Health check passed"
            return 0
        fi
        
        log "Health check attempt ${attempt}/${max_attempts} failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after ${max_attempts} attempts"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    cd ${DEPLOY_DIR}
    
    # Stop current services
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    
    # Restore from backup
    local latest_backup=$(ls -t ${BACKUP_DIR}/backup_*.sql | head -n1)
    if [[ -n "${latest_backup}" ]]; then
        log "Restoring database from ${latest_backup}"
        docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d postgres
        sleep 10
        docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T postgres psql -U reconciliation_user -d reconciliation_platform < ${latest_backup}
    fi
    
    # Start services
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    
    log "Rollback completed"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused Docker volumes
    docker volume prune -f
    
    # Remove unused Docker networks
    docker network prune -f
    
    log "Cleanup completed"
}

# Notification function
notify() {
    local status=$1
    local message=$2
    
    # Send Slack notification if webhook is configured
    if [[ -n "${SLACK_WEBHOOK}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Deployment ${status}: ${message}\"}" \
            ${SLACK_WEBHOOK}
    fi
    
    # Send email notification if configured
    if [[ -n "${EMAIL_RECIPIENTS}" ]]; then
        echo "Deployment ${status}: ${message}" | mail -s "Deployment ${status}" ${EMAIL_RECIPIENTS}
    fi
}

# Main deployment function
main() {
    log "Starting deployment to ${ENVIRONMENT} environment"
    
    # Check if running as root
    check_root
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Pull latest code
    pull_code
    
    # Deploy
    deploy
    
    # Health check
    if health_check; then
        log "Deployment successful"
        notify "SUCCESS" "Deployment to ${ENVIRONMENT} completed successfully"
        cleanup
    else
        error "Deployment failed"
        notify "FAILURE" "Deployment to ${ENVIRONMENT} failed"
        rollback
        exit 1
    fi
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"