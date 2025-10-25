#!/bin/bash

# Release Management and Versioning System
# Reconciliation Platform - Production Release Operations

set -e

# Configuration
REPO_URL="https://github.com/your-org/reconciliation-platform"
REGISTRY="ghcr.io/your-org"
APP_NAME="reconciliation"
RELEASE_BRANCH="main"
DEVELOPMENT_BRANCH="develop"
CHANGELOG_FILE="CHANGELOG.md"
VERSION_FILE="VERSION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Get current version
get_current_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0"
    fi
}

# Get next version based on type
get_next_version() {
    local current_version="$1"
    local version_type="$2"
    
    # Parse version components
    local major=$(echo "$current_version" | cut -d. -f1)
    local minor=$(echo "$current_version" | cut -d. -f2)
    local patch=$(echo "$current_version" | cut -d. -f3)
    
    case "$version_type" in
        "major")
            echo "$((major + 1)).0.0"
            ;;
        "minor")
            echo "$major.$((minor + 1)).0"
            ;;
        "patch")
            echo "$major.$minor.$((patch + 1))"
            ;;
        *)
            log_error "Invalid version type: $version_type"
            exit 1
            ;;
    esac
}

# Validate version format
validate_version() {
    local version="$1"
    if [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        return 0
    else
        log_error "Invalid version format: $version"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking release prerequisites..."
    
    local tools=("git" "docker" "kubectl" "jq" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
        log_error "Working directory is not clean. Please commit or stash changes."
        exit 1
    fi
    
    # Check if we're on the correct branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$RELEASE_BRANCH" ]; then
        log_warning "Not on release branch ($RELEASE_BRANCH). Current branch: $current_branch"
    fi
    
    log_success "Prerequisites check completed"
}

# Run pre-release tests
run_pre_release_tests() {
    log_info "Running pre-release tests..."
    
    # Run unit tests
    log_info "Running unit tests..."
    if [ -f "backend/Cargo.toml" ]; then
        cd backend
        if cargo test; then
            log_success "Backend unit tests passed"
        else
            log_error "Backend unit tests failed"
            exit 1
        fi
        cd ..
    fi
    
    if [ -f "frontend/package.json" ]; then
        cd frontend
        if npm test; then
            log_success "Frontend unit tests passed"
        else
            log_error "Frontend unit tests failed"
            exit 1
        fi
        cd ..
    fi
    
    # Run integration tests
    log_info "Running integration tests..."
    if [ -f "test-integration.sh" ]; then
        if ./test-integration.sh; then
            log_success "Integration tests passed"
        else
            log_error "Integration tests failed"
            exit 1
        fi
    fi
    
    # Run security scans
    log_info "Running security scans..."
    if [ -f "infrastructure/security/security-scan.sh" ]; then
        if ./infrastructure/security/security-scan.sh scan all; then
            log_success "Security scans passed"
        else
            log_warning "Security scans completed with warnings"
        fi
    fi
    
    log_success "Pre-release tests completed"
}

# Update version files
update_version_files() {
    local new_version="$1"
    
    log_info "Updating version files to $new_version..."
    
    # Update VERSION file
    echo "$new_version" > "$VERSION_FILE"
    log_success "Updated $VERSION_FILE"
    
    # Update package.json (if exists)
    if [ -f "frontend/package.json" ]; then
        jq --arg version "$new_version" '.version = $version' frontend/package.json > frontend/package.json.tmp
        mv frontend/package.json.tmp frontend/package.json
        log_success "Updated frontend/package.json"
    fi
    
    # Update Cargo.toml (if exists)
    if [ -f "backend/Cargo.toml" ]; then
        sed -i "s/^version = \".*\"/version = \"$new_version\"/" backend/Cargo.toml
        log_success "Updated backend/Cargo.toml"
    fi
    
    # Update Docker Compose files
    for file in docker-compose*.yml; do
        if [ -f "$file" ]; then
            sed -i "s/image: ${APP_NAME}.*/image: ${APP_NAME}:${new_version}/g" "$file"
            log_success "Updated $file"
        fi
    done
    
    # Update Kubernetes deployment files
    for file in infrastructure/kubernetes/*.yaml; do
        if [ -f "$file" ]; then
            sed -i "s/image: ${REGISTRY}\/${APP_NAME}.*/image: ${REGISTRY}\/${APP_NAME}:${new_version}/g" "$file"
            log_success "Updated $file"
        fi
    done
}

# Generate changelog
generate_changelog() {
    local new_version="$1"
    local version_type="$2"
    
    log_info "Generating changelog for version $new_version..."
    
    # Get commits since last release
    local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    local commits=""
    
    if [ -n "$last_tag" ]; then
        commits=$(git log --pretty=format:"- %s (%h)" "$last_tag"..HEAD)
    else
        commits=$(git log --pretty=format:"- %s (%h)" HEAD)
    fi
    
    # Create changelog entry
    local changelog_entry="## [$new_version] - $(date +%Y-%m-%d)

### $version_type

$commits

"
    
    # Add to changelog file
    if [ -f "$CHANGELOG_FILE" ]; then
        # Insert at the beginning of the file (after the header)
        local header=$(head -n 1 "$CHANGELOG_FILE")
        local rest=$(tail -n +2 "$CHANGELOG_FILE")
        echo -e "$header\n\n$changelog_entry$rest" > "$CHANGELOG_FILE"
    else
        echo -e "# Changelog\n\n$changelog_entry" > "$CHANGELOG_FILE"
    fi
    
    log_success "Generated changelog entry"
}

# Build and push Docker images
build_and_push_images() {
    local version="$1"
    
    log_info "Building and pushing Docker images for version $version..."
    
    # Build backend image
    log_info "Building backend image..."
    if docker build -t "${REGISTRY}/${APP_NAME}-backend:${version}" -f infrastructure/docker/Dockerfile.backend .; then
        log_success "Backend image built successfully"
        
        if docker push "${REGISTRY}/${APP_NAME}-backend:${version}"; then
            log_success "Backend image pushed successfully"
        else
            log_error "Failed to push backend image"
            exit 1
        fi
    else
        log_error "Failed to build backend image"
        exit 1
    fi
    
    # Build frontend image
    log_info "Building frontend image..."
    if docker build -t "${REGISTRY}/${APP_NAME}-frontend:${version}" -f infrastructure/docker/Dockerfile.frontend .; then
        log_success "Frontend image built successfully"
        
        if docker push "${REGISTRY}/${APP_NAME}-frontend:${version}"; then
            log_success "Frontend image pushed successfully"
        else
            log_error "Failed to push frontend image"
            exit 1
        fi
    else
        log_error "Failed to build frontend image"
        exit 1
    fi
    
    # Tag as latest
    log_info "Tagging images as latest..."
    docker tag "${REGISTRY}/${APP_NAME}-backend:${version}" "${REGISTRY}/${APP_NAME}-backend:latest"
    docker tag "${REGISTRY}/${APP_NAME}-frontend:${version}" "${REGISTRY}/${APP_NAME}-frontend:latest"
    
    docker push "${REGISTRY}/${APP_NAME}-backend:latest"
    docker push "${REGISTRY}/${APP_NAME}-frontend:latest"
    
    log_success "All images built and pushed successfully"
}

# Deploy to staging
deploy_to_staging() {
    local version="$1"
    
    log_info "Deploying version $version to staging..."
    
    # Update staging deployment with new version
    kubectl set image deployment/backend-staging backend="${REGISTRY}/${APP_NAME}-backend:${version}" -n reconciliation-staging
    kubectl set image deployment/frontend-staging frontend="${REGISTRY}/${APP_NAME}-frontend:${version}" -n reconciliation-staging
    
    # Wait for deployment to complete
    kubectl rollout status deployment/backend-staging -n reconciliation-staging
    kubectl rollout status deployment/frontend-staging -n reconciliation-staging
    
    # Run staging tests
    log_info "Running staging tests..."
    if [ -f "scripts/run-uat.sh" ]; then
        if ./scripts/run-uat.sh; then
            log_success "Staging tests passed"
        else
            log_error "Staging tests failed"
            exit 1
        fi
    fi
    
    log_success "Deployment to staging completed"
}

# Deploy to production
deploy_to_production() {
    local version="$1"
    
    log_info "Deploying version $version to production..."
    
    # Update production deployment with new version
    kubectl set image deployment/backend backend="${REGISTRY}/${APP_NAME}-backend:${version}" -n reconciliation
    kubectl set image deployment/frontend frontend="${REGISTRY}/${APP_NAME}-frontend:${version}" -n reconciliation
    
    # Wait for deployment to complete
    kubectl rollout status deployment/backend -n reconciliation
    kubectl rollout status deployment/frontend -n reconciliation
    
    # Run production health checks
    log_info "Running production health checks..."
    if [ -f "scripts/go-live.sh" ]; then
        if ./scripts/go-live.sh testing; then
            log_success "Production health checks passed"
        else
            log_error "Production health checks failed"
            exit 1
        fi
    fi
    
    log_success "Deployment to production completed"
}

# Create Git tag and release
create_git_release() {
    local version="$1"
    local version_type="$2"
    
    log_info "Creating Git tag and release for version $version..."
    
    # Commit version changes
    git add .
    git commit -m "chore: release version $version"
    
    # Create and push tag
    git tag -a "v$version" -m "Release version $version"
    git push origin "v$version"
    
    # Push changes
    git push origin "$RELEASE_BRANCH"
    
    # Create GitHub release
    local release_notes=$(awk "/## \[$version\]/,/## \[/" "$CHANGELOG_FILE" | head -n -1)
    
    if command -v gh &> /dev/null; then
        gh release create "v$version" \
            --title "Release $version" \
            --notes "$release_notes" \
            --target "$RELEASE_BRANCH"
        log_success "GitHub release created"
    else
        log_warning "GitHub CLI not available. Please create release manually."
    fi
    
    log_success "Git tag and release created"
}

# Rollback deployment
rollback_deployment() {
    local environment="$1"
    local namespace=""
    
    case "$environment" in
        "staging")
            namespace="reconciliation-staging"
            ;;
        "production")
            namespace="reconciliation"
            ;;
        *)
            log_error "Invalid environment: $environment"
            exit 1
            ;;
    esac
    
    log_info "Rolling back deployment in $environment..."
    
    # Rollback backend
    kubectl rollout undo deployment/backend -n "$namespace"
    kubectl rollout status deployment/backend -n "$namespace"
    
    # Rollback frontend
    kubectl rollout undo deployment/frontend -n "$namespace"
    kubectl rollout status deployment/frontend -n "$namespace"
    
    log_success "Rollback completed in $environment"
}

# Show release status
show_release_status() {
    log_info "Release Status:"
    
    # Show current version
    local current_version=$(get_current_version)
    echo "Current Version: $current_version"
    
    # Show recent tags
    echo "Recent Tags:"
    git tag --sort=-version:refname | head -5
    
    # Show deployment status
    echo "Deployment Status:"
    kubectl get deployments -n reconciliation
    kubectl get deployments -n reconciliation-staging
    
    # Show image versions
    echo "Image Versions:"
    kubectl get deployments -n reconciliation -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.template.spec.containers[0].image}{"\n"}{end}'
}

# Main release function
perform_release() {
    local version_type="${1:-patch}"
    local skip_tests="${2:-false}"
    local skip_staging="${3:-false}"
    
    log_info "Starting release process for $version_type version..."
    
    # Get current and next versions
    local current_version=$(get_current_version)
    local new_version=$(get_next_version "$current_version" "$version_type")
    
    log_info "Current version: $current_version"
    log_info "New version: $new_version"
    
    # Validate version
    if ! validate_version "$new_version"; then
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Run pre-release tests
    if [ "$skip_tests" != "true" ]; then
        run_pre_release_tests
    fi
    
    # Update version files
    update_version_files "$new_version"
    
    # Generate changelog
    generate_changelog "$new_version" "$version_type"
    
    # Build and push images
    build_and_push_images "$new_version"
    
    # Deploy to staging
    if [ "$skip_staging" != "true" ]; then
        deploy_to_staging "$new_version"
    fi
    
    # Deploy to production
    deploy_to_production "$new_version"
    
    # Create Git tag and release
    create_git_release "$new_version" "$version_type"
    
    log_success "Release $new_version completed successfully!"
    
    # Display release summary
    echo ""
    echo "Release Summary:"
    echo "================"
    echo "Version: $new_version"
    echo "Type: $version_type"
    echo "Images: ${REGISTRY}/${APP_NAME}-backend:${new_version}"
    echo "Images: ${REGISTRY}/${APP_NAME}-frontend:${new_version}"
    echo "Git Tag: v$new_version"
    echo "Changelog: Updated $CHANGELOG_FILE"
    echo ""
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  release [TYPE]           Perform release (major|minor|patch)"
    echo "  rollback [ENV]           Rollback deployment (staging|production)"
    echo "  status                   Show release status"
    echo "  version                  Show current version"
    echo "  changelog                Show changelog"
    echo "  help                     Show this help message"
    echo ""
    echo "Options:"
    echo "  --skip-tests             Skip running tests"
    echo "  --skip-staging           Skip staging deployment"
    echo "  --dry-run                Show what would be done without executing"
    echo ""
    echo "Environment Variables:"
    echo "  REPO_URL                 Git repository URL"
    echo "  REGISTRY                 Docker registry URL"
    echo "  APP_NAME                 Application name"
    echo "  RELEASE_BRANCH           Release branch name"
    echo "  DEVELOPMENT_BRANCH       Development branch name"
    echo ""
    echo "Examples:"
    echo "  $0 release patch"
    echo "  $0 release minor --skip-staging"
    echo "  $0 release major --skip-tests"
    echo "  $0 rollback production"
    echo "  $0 status"
    echo "  $0 version"
}

# Show current version
show_version() {
    local current_version=$(get_current_version)
    echo "Current version: $current_version"
}

# Show changelog
show_changelog() {
    if [ -f "$CHANGELOG_FILE" ]; then
        cat "$CHANGELOG_FILE"
    else
        log_warning "Changelog file not found: $CHANGELOG_FILE"
    fi
}

# Main script logic
case "${1:-help}" in
    release)
        perform_release "${2:-patch}" "${3:-false}" "${4:-false}"
        ;;
    rollback)
        rollback_deployment "${2:-production}"
        ;;
    status)
        show_release_status
        ;;
    version)
        show_version
        ;;
    changelog)
        show_changelog
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
