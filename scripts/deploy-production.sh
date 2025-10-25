#!/bin/bash

# Production Deployment Script for Reconciliation Platform
# This script handles the complete deployment process for production environment

set -e

# Configuration
NAMESPACE="reconciliation"
APP_NAME="reconciliation"
REGISTRY="your-registry.com"
VERSION="${VERSION:-latest}"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if required tools are installed
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local tools=("kubectl" "docker" "helm" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    log_success "All prerequisites are installed"
}

# Check if kubectl is connected to a cluster
check_kubectl_connection() {
    log_info "Checking kubectl connection..."
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl is not connected to a cluster. Please configure your kubeconfig."
        exit 1
    fi
    
    log_success "kubectl is connected to cluster"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t "$REGISTRY/$APP_NAME-backend:$VERSION" -f infrastructure/docker/Dockerfile.backend .
    docker push "$REGISTRY/$APP_NAME-backend:$VERSION"
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t "$REGISTRY/$APP_NAME-frontend:$VERSION" -f infrastructure/docker/Dockerfile.frontend .
    docker push "$REGISTRY/$APP_NAME-frontend:$VERSION"
    
    log_success "Docker images built and pushed successfully"
}

# Create namespace if it doesn't exist
create_namespace() {
    log_info "Creating namespace $NAMESPACE..."
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE already exists"
    else
        kubectl create namespace "$NAMESPACE"
        log_success "Namespace $NAMESPACE created"
    fi
}

# Apply Kubernetes secrets
apply_secrets() {
    log_info "Applying Kubernetes secrets..."
    
    # Check if secrets file exists
    if [ ! -f "config/secrets.yaml" ]; then
        log_error "Secrets file config/secrets.yaml not found. Please create it first."
        exit 1
    fi
    
    kubectl apply -f config/secrets.yaml -n "$NAMESPACE"
    log_success "Secrets applied successfully"
}

# Apply Kubernetes configuration
apply_config() {
    log_info "Applying Kubernetes configuration..."
    
    # Apply the main deployment configuration
    kubectl apply -f infrastructure/kubernetes/production-deployment.yaml
    
    log_success "Kubernetes configuration applied successfully"
}

# Wait for deployments to be ready
wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."
    
    local deployments=("postgres" "redis" "backend" "frontend")
    
    for deployment in "${deployments[@]}"; do
        log_info "Waiting for $deployment deployment..."
        kubectl wait --for=condition=available --timeout=300s deployment/"$deployment" -n "$NAMESPACE"
        log_success "$deployment deployment is ready"
    done
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Get a backend pod
    local backend_pod=$(kubectl get pods -n "$NAMESPACE" -l app=backend -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$backend_pod" ]; then
        log_error "No backend pod found"
        exit 1
    fi
    
    # Run migrations
    kubectl exec -n "$NAMESPACE" "$backend_pod" -- /app/migrate up
    
    log_success "Database migrations completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if all pods are running
    local pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Running -o json | jq -r '.items[].metadata.name')
    
    if [ -z "$pods" ]; then
        log_error "No running pods found"
        exit 1
    fi
    
    log_success "All pods are running"
    
    # Check services
    local services=$(kubectl get services -n "$NAMESPACE" -o json | jq -r '.items[].metadata.name')
    log_info "Services created: $services"
    
    # Check ingress
    if kubectl get ingress -n "$NAMESPACE" &> /dev/null; then
        log_success "Ingress is configured"
    else
        log_warning "No ingress found"
    fi
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Get backend service URL
    local backend_url=$(kubectl get service backend-service -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    if [ -z "$backend_url" ]; then
        log_error "Backend service not found"
        exit 1
    fi
    
    # Check backend health
    local health_response=$(kubectl run health-check --rm -i --restart=Never --image=curlimages/curl -- curl -s "http://$backend_url:8080/health")
    
    if echo "$health_response" | grep -q "healthy"; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend
    local frontend_url=$(kubectl get service frontend-service -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    if [ -z "$frontend_url" ]; then
        log_error "Frontend service not found"
        exit 1
    fi
    
    local frontend_response=$(kubectl run frontend-check --rm -i --restart=Never --image=curlimages/curl -- curl -s "http://$frontend_url:3000")
    
    if [ -n "$frontend_response" ]; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Check if Prometheus is installed
    if kubectl get pods -n monitoring &> /dev/null; then
        log_info "Prometheus is already installed"
    else
        log_info "Installing Prometheus..."
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
        helm repo update
        helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
    fi
    
    # Check if Grafana is installed
    if kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana &> /dev/null; then
        log_success "Grafana is already installed"
    else
        log_info "Installing Grafana..."
        helm install grafana grafana/grafana -n monitoring
    fi
    
    log_success "Monitoring setup completed"
}

# Setup logging
setup_logging() {
    log_info "Setting up logging..."
    
    # Check if Elasticsearch is installed
    if kubectl get pods -n logging &> /dev/null; then
        log_info "Elasticsearch is already installed"
    else
        log_info "Installing Elasticsearch..."
        helm repo add elastic https://helm.elastic.co
        helm repo update
        helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
    fi
    
    # Check if Kibana is installed
    if kubectl get pods -n logging -l app=kibana &> /dev/null; then
        log_success "Kibana is already installed"
    else
        log_info "Installing Kibana..."
        helm install kibana elastic/kibana -n logging
    fi
    
    log_success "Logging setup completed"
}

# Setup backup
setup_backup() {
    log_info "Setting up backup..."
    
    # Check if Velero is installed
    if kubectl get pods -n velero &> /dev/null; then
        log_info "Velero is already installed"
    else
        log_info "Installing Velero..."
        helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
        helm repo update
        helm install velero vmware-tanzu/velero -n velero --create-namespace
    fi
    
    log_success "Backup setup completed"
}

# Main deployment function
deploy() {
    log_info "Starting production deployment for $APP_NAME..."
    
    check_prerequisites
    check_kubectl_connection
    build_and_push_images
    create_namespace
    apply_secrets
    apply_config
    wait_for_deployments
    run_migrations
    verify_deployment
    run_health_checks
    setup_monitoring
    setup_logging
    setup_backup
    
    log_success "Production deployment completed successfully!"
    
    # Display access information
    log_info "Deployment Summary:"
    log_info "Namespace: $NAMESPACE"
    log_info "Backend URL: http://backend-service.$NAMESPACE.svc.cluster.local:8080"
    log_info "Frontend URL: http://frontend-service.$NAMESPACE.svc.cluster.local:3000"
    log_info "Health Check: http://backend-service.$NAMESPACE.svc.cluster.local:8080/health"
    
    # Display ingress URLs if available
    local ingress_host=$(kubectl get ingress reconciliation-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "Not configured")
    if [ "$ingress_host" != "Not configured" ]; then
        log_info "External URL: https://$ingress_host"
    fi
}

# Rollback function
rollback() {
    log_info "Rolling back deployment..."
    
    # Get previous deployment
    local previous_deployment=$(kubectl rollout history deployment/backend -n "$NAMESPACE" --no-headers | tail -2 | head -1 | awk '{print $1}')
    
    if [ -z "$previous_deployment" ]; then
        log_error "No previous deployment found"
        exit 1
    fi
    
    # Rollback to previous deployment
    kubectl rollout undo deployment/backend -n "$NAMESPACE" --to-revision="$previous_deployment"
    kubectl rollout undo deployment/frontend -n "$NAMESPACE" --to-revision="$previous_deployment"
    
    log_success "Rollback completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up deployment..."
    
    # Delete all resources in the namespace
    kubectl delete namespace "$NAMESPACE"
    
    log_success "Cleanup completed"
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy the application to production"
    echo "  rollback   Rollback to previous deployment"
    echo "  cleanup    Clean up all resources"
    echo "  status     Show deployment status"
    echo "  logs       Show application logs"
    echo ""
    echo "Environment Variables:"
    echo "  VERSION    Docker image version (default: latest)"
    echo "  REGISTRY   Docker registry URL (default: your-registry.com)"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  VERSION=v1.0.0 $0 deploy"
    echo "  $0 rollback"
    echo "  $0 status"
}

# Show status
show_status() {
    log_info "Deployment Status:"
    
    # Show namespace status
    kubectl get namespace "$NAMESPACE" 2>/dev/null || log_warning "Namespace $NAMESPACE not found"
    
    # Show pods status
    kubectl get pods -n "$NAMESPACE" 2>/dev/null || log_warning "No pods found in namespace $NAMESPACE"
    
    # Show services status
    kubectl get services -n "$NAMESPACE" 2>/dev/null || log_warning "No services found in namespace $NAMESPACE"
    
    # Show ingress status
    kubectl get ingress -n "$NAMESPACE" 2>/dev/null || log_warning "No ingress found in namespace $NAMESPACE"
}

# Show logs
show_logs() {
    log_info "Application Logs:"
    
    # Show backend logs
    log_info "Backend logs:"
    kubectl logs -n "$NAMESPACE" -l app=backend --tail=50
    
    # Show frontend logs
    log_info "Frontend logs:"
    kubectl logs -n "$NAMESPACE" -l app=frontend --tail=50
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    cleanup)
        cleanup
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
