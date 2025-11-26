#!/bin/bash
# ==============================================================================
# Execute Aggressive Consolidation
# ==============================================================================
# Archives duplicates, combines files, and cleans up documentation
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

ARCHIVE_BASE="archive"
ARCHIVE_DOCS="$ARCHIVE_BASE/docs/consolidation-2025-01"
ARCHIVE_SCRIPTS="$ARCHIVE_BASE/scripts/duplicates-2025-01"

# Create archive directories
mkdir -p "$ARCHIVE_DOCS"
mkdir -p "$ARCHIVE_SCRIPTS"

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Aggressive Consolidation Execution${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# Function to move file to archive
move_to_archive() {
    local file="$1"
    local archive_dir="$2"
    local reason="$3"
    
    if [ -f "$file" ]; then
        mkdir -p "$archive_dir"
        mv "$file" "$archive_dir/"
        echo -e "${GREEN}✓${NC} Archived: $file → $archive_dir/ ($reason)"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Not found: $file"
        return 1
    fi
}

# 1. Archive consolidation completion reports (keep only CONSOLIDATION_SUMMARY.md)
echo -e "${YELLOW}1. Archiving consolidation completion reports...${NC}"
move_to_archive "docs/project-management/ALL_CONSOLIDATION_TODOS_COMPLETE.md" "$ARCHIVE_DOCS" "Consolidation completion report"
move_to_archive "docs/project-management/CONSOLIDATION_TODOS_COMPLETE.md" "$ARCHIVE_DOCS" "Consolidation completion report"
move_to_archive "docs/project-management/CONSOLIDATION_EXECUTION_SUMMARY.md" "$ARCHIVE_DOCS" "Consolidation execution summary"
move_to_archive "docs/project-management/DUPLICATE_FILES_CONSOLIDATION_COMPLETE.md" "$ARCHIVE_DOCS" "Duplicate files consolidation complete"
move_to_archive "docs/project-management/DUPLICATE_FILES_INVESTIGATION_COMPLETE.md" "$ARCHIVE_DOCS" "Duplicate files investigation complete"
move_to_archive "docs/project-management/DUPLICATE_FILES_CONSOLIDATION_PLAN.md" "$ARCHIVE_DOCS" "Duplicate files consolidation plan (superseded)"
echo ""

# 2. Archive root-level scripts that duplicate scripts/ directory
echo -e "${YELLOW}2. Archiving duplicate root-level scripts...${NC}"
move_to_archive "deploy-simple.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/deployment/"
move_to_archive "deploy-all-services.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/orchestrate-production-deployment.sh"
move_to_archive "check-deployment.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/deployment/check-health.sh"
move_to_archive "check-env-vars.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/deployment/setup-env.sh"
move_to_archive "validate-production.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/verify-production-readiness.sh"
move_to_archive "test_auth_flows.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/create-auth-tests.sh"
move_to_archive "diagnose-google-oauth.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/diagnose-mcp-server.sh"
move_to_archive "verify-google-oauth.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/verify-mcp-config.sh"
move_to_archive "apply_migration.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/execute-migrations.sh"
move_to_archive "fix_migrations.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/execute-migrations.sh"
move_to_archive "fix-frontend-imports.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/fix-frontend-lint-errors.sh"
move_to_archive "fix-use-toast.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/fix-frontend-lint-errors.sh"
move_to_archive "ssot-cleanup.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/manage-ssot.sh"
move_to_archive "ssot-enforcement.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/manage-ssot.sh"
move_to_archive "consolidate-all.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/consolidate-documentation.sh"
move_to_archive "consolidate-phase2.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/consolidate-documentation.sh"
move_to_archive "consolidate-final.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/consolidate-documentation.sh"
move_to_archive "setup-monitoring.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/setup-monitoring.sh"
move_to_archive "setup-production.sh" "$ARCHIVE_SCRIPTS" "Duplicate of scripts/deployment/setup-production-secrets.sh"
move_to_archive "START_BACKEND.sh" "$ARCHIVE_SCRIPTS" "Duplicate of backend/start_backend.sh"
echo ""

# 3. Archive old diagnostic reports (keep only COMPREHENSIVE_DIAGNOSTIC_REPORT.md)
echo -e "${YELLOW}3. Archiving old diagnostic reports...${NC}"
ARCHIVE_DIAGNOSTICS="$ARCHIVE_BASE/docs/diagnostics-2025-01"
mkdir -p "$ARCHIVE_DIAGNOSTICS"
move_to_archive "docs/operations/FINAL_DIAGNOSTIC_AND_FIX.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/FINAL_DIAGNOSTIC_CONFIRMATION.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/BACKEND_PANIC_DIAGNOSTIC.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/BUILD_DEPLOYMENT_DIAGNOSTIC.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/DOCKER_BUILD_DEPLOYMENT_DIAGNOSTIC.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/DOCKER_KUBERNETES_DIAGNOSTIC.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/OVERLAPPING_ERRORS_DIAGNOSTIC.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/PRE_BUILD_ERRORS_DIAGNOSTIC.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/SYNC_NOTES_DIAGNOSTIC_AND_FIXES.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/BACKEND_RESTART_INVESTIGATION.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/BACKEND_INVESTIGATION_REPORT.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
move_to_archive "docs/operations/REMAINING_ISSUES_FIXED_REPORT.md" "$ARCHIVE_DIAGNOSTICS" "Old diagnostic report"
echo ""

# 4. Archive old completion reports
echo -e "${YELLOW}4. Archiving old completion reports...${NC}"
ARCHIVE_COMPLETION="$ARCHIVE_BASE/docs/completion-reports-2025-01"
mkdir -p "$ARCHIVE_COMPLETION"
move_to_archive "docs/project-management/PHASE_1_COMPLETION_REPORT.md" "$ARCHIVE_COMPLETION" "Old completion report"
move_to_archive "docs/project-management/FOUR_AGENT_ORCHESTRATION_COMPLETION.md" "$ARCHIVE_COMPLETION" "Old completion report"
move_to_archive "docs/operations/DATABASE_ENVIRONMENT_SETUP_COMPLETE.md" "$ARCHIVE_COMPLETION" "Old completion report"
echo ""

# 5. Archive duplicate deployment guides (keep only DEPLOYMENT_GUIDE.md and PRODUCTION_DEPLOYMENT_PLAN.md)
echo -e "${YELLOW}5. Archiving duplicate deployment guides...${NC}"
ARCHIVE_DEPLOYMENT="$ARCHIVE_BASE/docs/deployment-2025-01"
mkdir -p "$ARCHIVE_DEPLOYMENT"
move_to_archive "docs/deployment/DEPLOYMENT_INSTRUCTIONS.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of DEPLOYMENT_GUIDE.md"
move_to_archive "docs/deployment/DEPLOY_NOW.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of DEPLOYMENT_GUIDE.md"
move_to_archive "docs/deployment/DEPLOY_NOW_INSTRUCTIONS.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of DEPLOYMENT_GUIDE.md"
move_to_archive "docs/deployment/RUN_DEPLOYMENT.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of DEPLOYMENT_GUIDE.md"
move_to_archive "docs/deployment/BACKEND_DEPLOYMENT.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of DEPLOYMENT_GUIDE.md"
move_to_archive "docs/deployment/DEPLOYMENT_QUICK_START.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of DEPLOYMENT_GUIDE.md"
move_to_archive "docs/deployment/QUICK_START.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of DEPLOYMENT_GUIDE.md"
move_to_archive "docs/deployment/PRODUCTION_DEPLOYMENT.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of PRODUCTION_DEPLOYMENT_PLAN.md"
move_to_archive "docs/deployment/PRODUCTION_DEPLOYMENT_ORCHESTRATION.md" "$ARCHIVE_DEPLOYMENT" "Duplicate of PRODUCTION_DEPLOYMENT_PLAN.md"
echo ""

# 6. Archive duplicate quick start guides (keep only docs/getting-started/QUICK_START.md)
echo -e "${YELLOW}6. Archiving duplicate quick start guides...${NC}"
ARCHIVE_QUICKSTART="$ARCHIVE_BASE/docs/quickstart-2025-01"
mkdir -p "$ARCHIVE_QUICKSTART"
move_to_archive "docs/ORCHESTRATION_QUICK_START.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
move_to_archive "docs/developer/QUICK_START_GUIDE.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
move_to_archive "docs/development/COORDINATION_QUICK_START.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
move_to_archive "docs/project-management/REFACTORING_QUICK_START.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
move_to_archive "docs/getting-started/QUICK_START_COMMANDS.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
move_to_archive "scripts/QUICK_START.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
move_to_archive "frontend/QUICK_START.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
move_to_archive "k8s/optimized/QUICK_START.md" "$ARCHIVE_QUICKSTART" "Duplicate of QUICK_START.md"
echo ""

# 7. Archive old MCP documentation (keep only MCP_SETUP_GUIDE.md)
echo -e "${YELLOW}7. Archiving duplicate MCP documentation...${NC}"
ARCHIVE_MCP="$ARCHIVE_BASE/docs/mcp-2025-01"
mkdir -p "$ARCHIVE_MCP"
move_to_archive "docs/development/MCP_THREE_AGENT_SETUP.md" "$ARCHIVE_MCP" "Duplicate of MCP_SETUP_GUIDE.md"
move_to_archive "docs/development/MCP_COORDINATION_VERIFICATION.md" "$ARCHIVE_MCP" "Duplicate of MCP_SETUP_GUIDE.md"
move_to_archive "docs/development/MCP_COORDINATION_OPTIMIZATION_RECOMMENDATIONS.md" "$ARCHIVE_MCP" "Duplicate of MCP_SETUP_GUIDE.md"
move_to_archive "docs/development/MCP_OPTIMIZATION_UNDER_80.md" "$ARCHIVE_MCP" "Duplicate of MCP_SETUP_GUIDE.md"
move_to_archive "docs/development/MCP_PROMETHEUS_OPTIMIZATION.md" "$ARCHIVE_MCP" "Duplicate of MCP_SETUP_GUIDE.md"
move_to_archive "docs/development/MCP_COORDINATION_DEEP_INTEGRATION_ANALYSIS.md" "$ARCHIVE_MCP" "Duplicate of MCP_SETUP_GUIDE.md"
echo ""

# 8. Archive old investigation reports
echo -e "${YELLOW}8. Archiving old investigation reports...${NC}"
ARCHIVE_INVESTIGATIONS="$ARCHIVE_BASE/docs/investigations-2025-01"
mkdir -p "$ARCHIVE_INVESTIGATIONS"
move_to_archive "docs/project-management/DIAGNOSTIC_ACTION_PLAN.md" "$ARCHIVE_INVESTIGATIONS" "Old investigation report"
move_to_archive "docs/project-management/DIAGNOSTIC_TODOS_INTEGRATED.md" "$ARCHIVE_INVESTIGATIONS" "Old investigation report"
move_to_archive "docs/operations/DIAGNOSTIC_SCORING_SYSTEM.md" "$ARCHIVE_INVESTIGATIONS" "Old investigation report"
echo ""

# Summary
echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Consolidation Complete${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""
echo -e "${GREEN}Files archived to:${NC}"
echo "  - $ARCHIVE_DOCS"
echo "  - $ARCHIVE_SCRIPTS"
echo "  - $ARCHIVE_DIAGNOSTICS"
echo "  - $ARCHIVE_COMPLETION"
echo "  - $ARCHIVE_DEPLOYMENT"
echo "  - $ARCHIVE_QUICKSTART"
echo "  - $ARCHIVE_MCP"
echo "  - $ARCHIVE_INVESTIGATIONS"
echo ""
echo -e "${GREEN}✓ Aggressive consolidation complete!${NC}"

