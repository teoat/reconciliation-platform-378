#!/bin/bash
# Deployment Script for Reconciliation Platform Frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="reconciliation-frontend"
DOCKER_REGISTRY="ghcr.io"
IMAGE_TAG=${1:-latest}
ENVIRONMENT=${2:-staging}

echo -e "${BLUE}🚀 Starting deployment of ${APP_NAME}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Image Tag: ${IMAGE_TAG}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "All dependencies are available"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    npm ci
    npm run lint
    npm run type-check
    npm run test:coverage
    
    print_status "All tests passed"
}

# Build the application
build_app() {
    print_status "Building application..."
    
    # Set environment variables based on environment
    case $ENVIRONMENT in
        "production")
            export VITE_API_URL="https://api.reconciliation.com/api"
            export VITE_WS_URL="wss://api.reconciliation.com/ws"
            ;;
        "staging")
            export VITE_API_URL="https://staging-api.reconciliation.com/api"
            export VITE_WS_URL="wss://staging-api.reconciliation.com/ws"
            ;;
        "development")
            export VITE_API_URL="http://localhost:8080/api"
            export VITE_WS_URL="ws://localhost:8080/ws"
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi
    
    print_status "Application built successfully"
}

# Build Docker image
build_docker_image() {
    print_status "Building Docker image..."
    
    IMAGE_NAME="${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}"
    
    docker build -t $IMAGE_NAME .
    
    if [ $? -eq 0 ]; then
        print_status "Docker image built successfully: $IMAGE_NAME"
    else
        print_error "Docker build failed"
        exit 1
    fi
}

# Push Docker image
push_docker_image() {
    print_status "Pushing Docker image..."
    
    IMAGE_NAME="${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}"
    
    docker push $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        print_status "Docker image pushed successfully"
    else
        print_error "Docker push failed"
        exit 1
    fi
}

# Deploy to environment
deploy_to_environment() {
    print_status "Deploying to $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        "production")
            # Production deployment commands
            print_warning "Production deployment requires manual approval"
            read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_warning "Production deployment cancelled"
                exit 0
            fi
            
            # Add production deployment commands here
            # kubectl apply -f k8s/production/
            # kubectl rollout restart deployment/frontend
            ;;
        "staging")
            # Staging deployment commands
            # kubectl apply -f k8s/staging/
            # kubectl rollout restart deployment/frontend-staging
            ;;
        "development")
            # Development deployment commands
            docker-compose up -d frontend
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    print_status "Deployment completed successfully"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    case $ENVIRONMENT in
        "production")
            HEALTH_URL="https://reconciliation.com/health"
            ;;
        "staging")
            HEALTH_URL="https://staging.reconciliation.com/health"
            ;;
        "development")
            HEALTH_URL="http://localhost/health"
            ;;
    esac
    
    # Wait for deployment to be ready
    sleep 30
    
    # Check health endpoint
    for i in {1..10}; do
        if curl -f $HEALTH_URL > /dev/null 2>&1; then
            print_status "Health check passed"
            return 0
        fi
        print_warning "Health check attempt $i failed, retrying..."
        sleep 10
    done
    
    print_error "Health check failed after 10 attempts"
    exit 1
}

# Cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Remove build artifacts
    rm -rf dist/
    
    # Remove unused Docker images
    docker image prune -f
    
    print_status "Cleanup completed"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_dependencies
    run_tests
    build_app
    build_docker_image
    
    if [ "$ENVIRONMENT" != "development" ]; then
        push_docker_image
    fi
    
    deploy_to_environment
    health_check
    cleanup
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Application is now running in $ENVIRONMENT environment${NC}"
}

# Run main function
main "$@"

