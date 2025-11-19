#!/bin/bash

# Branch Consolidation - Delete Obsolete Branches
# This script deletes all branches except 'master' from the remote repository
# Requires: GitHub repository admin permissions

set -e

REPO_OWNER="teoat"
REPO_NAME="reconciliation-platform-378"

echo "================================================================"
echo "  Branch Consolidation - Delete Obsolete Branches"
echo "  Repository: $REPO_OWNER/$REPO_NAME"
echo "================================================================"
echo ""

# List of branches to delete (all except master)
BRANCHES_TO_DELETE=(
  "copilot/check-integration-sync-links-modules"
  "copilot/consolidate-all-branches"
  "copilot/consolidate-branches-into-master"
  "copilot/consolidate-codebase-to-master"
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
  "copilot/update-quality-gates-workflow"
  "cursor/analyze-and-diagnose-repository-40e5"
  "cursor/app-quality-assurance-and-error-resolution-0bd1"
)

# Dependabot branches are intentionally excluded from automated deletion
# as they may be needed for ongoing dependency management.
# To delete them, uncomment the lines below and add them to BRANCHES_TO_DELETE array:
# BRANCHES_TO_DELETE+=(
#   "dependabot/npm_and_yarn/development-dependencies-3e6f6454af"
#   "dependabot/npm_and_yarn/production-dependencies-850c8e665e"
# )

echo "⚠️  WARNING: This script will delete ${#BRANCHES_TO_DELETE[@]} branches from the remote repository."
echo ""
echo "Branches to be deleted:"
for branch in "${BRANCHES_TO_DELETE[@]}"; do
  echo "  - $branch"
done
echo ""
echo "The following branches will be KEPT:"
echo "  - master (protected)"
echo "  - dependabot/* (optional, commented out in script)"
echo ""

# Safety check
read -p "Are you sure you want to proceed? (type 'DELETE' to confirm): " confirmation

if [ "$confirmation" != "DELETE" ]; then
  echo "❌ Deletion cancelled. No branches were deleted."
  exit 0
fi

echo ""
echo "Starting branch deletion..."
echo ""

# Track successes and failures
SUCCESS_COUNT=0
FAILURE_COUNT=0
FAILED_BRANCHES=()

# Delete each branch
for branch in "${BRANCHES_TO_DELETE[@]}"; do
  echo "Deleting: $branch"
  
  if git push origin --delete "$branch" 2>/dev/null; then
    echo "  ✅ Deleted successfully"
    ((SUCCESS_COUNT++))
  else
    echo "  ❌ Failed to delete (may not exist or protected)"
    ((FAILURE_COUNT++))
    FAILED_BRANCHES+=("$branch")
  fi
  echo ""
done

# Summary
echo "================================================================"
echo "  Deletion Summary"
echo "================================================================"
echo ""
echo "✅ Successfully deleted: $SUCCESS_COUNT branches"
echo "❌ Failed to delete: $FAILURE_COUNT branches"
echo ""

if [ $FAILURE_COUNT -gt 0 ]; then
  echo "Failed branches:"
  for branch in "${FAILED_BRANCHES[@]}"; do
    echo "  - $branch"
  done
  echo ""
  echo "Note: Some branches may have already been deleted or are protected."
  echo "You may need to manually delete protected branches through GitHub UI."
fi

echo ""
echo "================================================================"
echo "  Next Steps"
echo "================================================================"
echo ""
echo "1. Verify remaining branches with: git ls-remote --heads origin"
echo "2. Set 'master' as default branch in GitHub repository settings"
echo "3. Update branch protection rules to protect only 'master'"
echo "4. Close related PRs that referenced deleted branches"
echo "5. Update CI/CD workflows to target 'master' branch"
echo "6. Update team documentation about the new single-branch workflow"
echo ""
echo "✅ Branch consolidation complete!"
