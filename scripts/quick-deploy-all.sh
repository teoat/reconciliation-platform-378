#!/bin/bash
# ============================================================================
# QUICK DEPLOY ALL SERVICES
# ============================================================================
# Fast deployment script for development/staging environments
# Skips safety checks and confirmation prompts
#
# Usage:
#   ./scripts/quick-deploy-all.sh [version]
#   ./scripts/quick-deploy-all.sh v1.0.0
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

VERSION=${1:-latest}
ENVIRONMENT=${ENVIRONMENT:-staging}

# Quick deploy settings
export DEPLOY_STAGING_FIRST=false
export SKIP_TESTS=false
export AUTO_APPROVE=true

log_info "🚀 Quick Deploy All Services"
log_info "Version: $VERSION"
log_info "Environment: $ENVIRONMENT"

# Run orchestration script with quick deploy settings
exec "$SCRIPT_DIR/orchestrate-production-deployment.sh" "$VERSION" "$ENVIRONMENT"

