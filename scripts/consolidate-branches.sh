#!/bin/bash

# Comprehensive Branch Consolidation Script
# Consolidates all non-master branches into master by deleting them
# Provides options for conservative or aggressive approach

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="teoat"
REPO_NAME="reconciliation-platform-378"

echo -e "${BLUE}==================================================================="
echo "BRANCH CONSOLIDATION SCRIPT"
echo "===================================================================${NC}"
echo ""
echo "This script will consolidate all branches into master by deleting them."
echo ""

# Check for required tools
command -v git >/dev/null 2>&1 || { echo -e "${RED}Error: git is not installed${NC}" >&2; exit 1; }

# Detect if gh CLI is available
GH_AVAILABLE=false
if command -v gh >/dev/null 2>&1; then
    GH_AVAILABLE=true
    echo -e "${GREEN}✓ GitHub CLI detected${NC}"
else
    echo -e "${YELLOW}⚠ GitHub CLI not detected. Will use git push --delete instead.${NC}"
fi

echo ""
echo -e "${YELLOW}Choose consolidation approach:${NC}"
echo "1. Conservative - Review recent work branches, delete rest"
echo "2. Aggressive - Delete all non-master branches immediately"
echo "3. Custom - Select specific branches to delete"
echo "4. Cancel"
echo ""
read -p "Enter choice (1-4): " CHOICE

case $CHOICE in
    1)
        MODE="conservative"
        echo -e "${GREEN}Conservative mode selected${NC}"
        ;;
    2)
        MODE="aggressive"
        echo -e "${YELLOW}Aggressive mode selected${NC}"
        ;;
    3)
        MODE="custom"
        echo -e "${BLUE}Custom mode selected${NC}"
        ;;
    4)
        echo "Cancelled"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""

# Recent work branches that might need review
RECENT_BRANCHES=(
    "audit-report-and-fixes"
    "bugfix-frontend-api-and-ui-fixes"
    "comprehensive-diagnostic-plan"
)

# Consolidation branches safe to delete
CONSOLIDATION_BRANCHES=(
    "copilot/check-integration-sync-links-modules"
    "copilot/consolidate-all-branches"
    "copilot/consolidate-all-pull-requests"
    "copilot/consolidate-branches-into-master"
    "copilot/consolidate-branches-into-master-again"
    "copilot/consolidate-close-old-prs"
    "copilot/consolidate-codebase-to-master"
    "copilot/consolidate-documentation-files"
    "copilot/consolidate-documentation-repository"
    "copilot/consolidate-documentation-updates"
    "copilot/consolidate-project-documentation"
    "copilot/deploy-all-services-successfully"
    "copilot/diagnose-failed-checks"
    "copilot/fix-errors-and-code-issues"
    "copilot/fix-typescript-errors-and-tests"
    "copilot/resolve-typescript-errors"
    "copilot/standardize-default-branch-to-master"
    "copilot/sub-pr-5"
    "copilot/sub-pr-5-again"
    "copilot/sub-pr-5-another-one"
    "copilot/sub-pr-5-yet-again"
    "copilot/sub-pr-65"
    "copilot/sub-pr-65-again"
    "copilot/sub-pr-65-another-one"
    "copilot/update-quality-gates-workflow"
    "cursor/analyze-and-diagnose-repository-40e5"
    "cursor/app-quality-assurance-and-error-resolution-0bd1"
    "cursor/complete-todos-in-recommendations-status-file-b6a1"
)

# Function to delete a branch
delete_branch() {
    local branch=$1
    local success=false
    
    if [ "$GH_AVAILABLE" = true ]; then
        # Try using GitHub CLI
        if gh api -X DELETE "repos/$REPO_OWNER/$REPO_NAME/git/refs/heads/$branch" >/dev/null 2>&1; then
            success=true
        fi
    fi
    
    # Fallback to git push delete
    if [ "$success" = false ]; then
        if git push origin --delete "$branch" >/dev/null 2>&1; then
            success=true
        fi
    fi
    
    if [ "$success" = true ]; then
        echo -e "${GREEN}✓ Deleted: $branch${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to delete: $branch${NC}"
        return 1
    fi
}

# Function to review a branch
review_branch() {
    local branch=$1
    echo ""
    echo -e "${YELLOW}Reviewing branch: $branch${NC}"
    echo "Options:"
    echo "  1. Delete this branch"
    echo "  2. Skip this branch (keep it)"
    echo "  3. Show diff with master"
    echo "  4. Cancel consolidation"
    echo ""
    read -p "Enter choice (1-4): " REVIEW_CHOICE
    
    case $REVIEW_CHOICE in
        1)
            delete_branch "$branch"
            ;;
        2)
            echo -e "${BLUE}⊘ Skipped: $branch${NC}"
            ((SKIPPED_COUNT++))
            ;;
        3)
            echo ""
            git fetch origin "$branch" >/dev/null 2>&1
            git log master..origin/$branch --oneline || echo "Could not fetch branch"
            echo ""
            review_branch "$branch"
            ;;
        4)
            echo "Cancelled"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice, skipping${NC}"
            ((SKIPPED_COUNT++))
            ;;
    esac
}

# Main execution
DELETED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

if [ "$MODE" = "conservative" ]; then
    echo -e "${BLUE}=== Phase 1: Review Recent Branches ===${NC}"
    for branch in "${RECENT_BRANCHES[@]}"; do
        review_branch "$branch"
    done
    
    echo ""
    echo -e "${BLUE}=== Phase 2: Delete Consolidation Branches ===${NC}"
    for branch in "${CONSOLIDATION_BRANCHES[@]}"; do
        if delete_branch "$branch"; then
            ((DELETED_COUNT++))
        else
            ((FAILED_COUNT++))
        fi
    done
    
elif [ "$MODE" = "aggressive" ]; then
    echo -e "${RED}WARNING: This will delete ALL non-master branches!${NC}"
    echo "Type 'DELETE ALL' to confirm (case-sensitive):"
    read CONFIRM
    
    if [ "$CONFIRM" != "DELETE ALL" ]; then
        echo "Confirmation failed. Cancelled."
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}Deleting all branches...${NC}"
    
    ALL_BRANCHES=("${RECENT_BRANCHES[@]}" "${CONSOLIDATION_BRANCHES[@]}")
    for branch in "${ALL_BRANCHES[@]}"; do
        if delete_branch "$branch"; then
            ((DELETED_COUNT++))
        else
            ((FAILED_COUNT++))
        fi
    done
    
elif [ "$MODE" = "custom" ]; then
    echo ""
    echo "Available branches:"
    ALL_BRANCHES=("${RECENT_BRANCHES[@]}" "${CONSOLIDATION_BRANCHES[@]}")
    for i in "${!ALL_BRANCHES[@]}"; do
        echo "  $((i+1)). ${ALL_BRANCHES[$i]}"
    done
    echo ""
    echo "Enter branch numbers to delete (space-separated, e.g., '1 3 5'), or 'all' for all branches:"
    read SELECTION
    
    if [ "$SELECTION" = "all" ]; then
        for branch in "${ALL_BRANCHES[@]}"; do
            if delete_branch "$branch"; then
                ((DELETED_COUNT++))
            else
                ((FAILED_COUNT++))
            fi
        done
    else
        for num in $SELECTION; do
            idx=$((num-1))
            if [ $idx -ge 0 ] && [ $idx -lt ${#ALL_BRANCHES[@]} ]; then
                branch="${ALL_BRANCHES[$idx]}"
                if delete_branch "$branch"; then
                    ((DELETED_COUNT++))
                else
                    ((FAILED_COUNT++))
                fi
            else
                echo -e "${RED}Invalid selection: $num${NC}"
            fi
        done
    fi
fi

# Summary
echo ""
echo -e "${BLUE}==================================================================="
echo "CONSOLIDATION SUMMARY"
echo "===================================================================${NC}"
echo -e "${GREEN}Deleted: $DELETED_COUNT${NC}"
echo -e "${RED}Failed: $FAILED_COUNT${NC}"
if [ $SKIPPED_COUNT -gt 0 ]; then
    echo -e "${BLUE}Skipped: $SKIPPED_COUNT${NC}"
fi
echo ""

if [ $DELETED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Branch consolidation completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify only master remains: git ls-remote --heads origin"
    echo "2. Update repository settings (default branch, protection rules)"
    echo "3. Clean local repository: git fetch --all --prune"
    echo "4. Update documentation"
else
    echo -e "${YELLOW}⚠ No branches were deleted${NC}"
fi

echo ""
echo "Full analysis report available in: BRANCH_ANALYSIS_REPORT.md"
echo "Consolidation guide available in: FINAL_CONSOLIDATION_GUIDE.md"
echo ""
