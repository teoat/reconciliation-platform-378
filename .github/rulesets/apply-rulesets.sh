#!/bin/bash

# GitHub Rulesets Application Script
# This script applies the optimized rulesets to your repository using the GitHub API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="teoat"
REPO_NAME="reconciliation-platform-378"
RULESETS_DIR=".github/rulesets"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}GitHub Rulesets Application Script${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with GitHub${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI is installed and authenticated${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "$RULESETS_DIR" ]; then
    echo -e "${RED}Error: Rulesets directory not found${NC}"
    echo "Please run this script from the repository root"
    exit 1
fi

echo -e "${GREEN}✓ Found rulesets directory${NC}"
echo ""

# Function to apply a ruleset
apply_ruleset() {
    local file=$1
    local name=$(basename "$file" .json)
    
    echo -e "${YELLOW}Applying ruleset: $name${NC}"
    
    # Apply the ruleset using GitHub API
    if gh api \
        --method POST \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "/repos/$REPO_OWNER/$REPO_NAME/rulesets" \
        --input "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Successfully applied: $name${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to apply: $name${NC}"
        echo -e "${YELLOW}Note: This may be due to existing rulesets or permission issues${NC}"
        return 1
    fi
}

# Main execution
echo "This script will apply the following rulesets:"
echo "  1. Protected Branches (master/main)"
echo "  2. Development Branches (develop/dev/staging)"
echo "  3. Feature Branches (feature/*, fix/*, etc.)"
echo "  4. Release Tags (v*, release-*)"
echo ""
echo -e "${YELLOW}WARNING: This will create new rulesets in your repository${NC}"
echo "Make sure you have:"
echo "  - Repository admin permissions"
echo "  - Reviewed the ruleset configurations"
echo "  - Backed up any existing branch protection rules"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted by user"
    exit 0
fi

echo ""
echo -e "${GREEN}Starting ruleset application...${NC}"
echo ""

# Apply each ruleset
SUCCESS_COUNT=0
FAIL_COUNT=0

if apply_ruleset "$RULESETS_DIR/protected-branches.json"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi

if apply_ruleset "$RULESETS_DIR/development-branches.json"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi

if apply_ruleset "$RULESETS_DIR/feature-branches.json"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi

if apply_ruleset "$RULESETS_DIR/release-tags.json"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Summary${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "Successfully applied: ${GREEN}$SUCCESS_COUNT${NC}"
echo -e "Failed to apply: ${RED}$FAIL_COUNT${NC}"
echo ""

# Verify applied rulesets
echo -e "${YELLOW}Verifying rulesets...${NC}"
echo ""

if gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$REPO_OWNER/$REPO_NAME/rulesets" \
    --jq '.[] | {id: .id, name: .name, enforcement: .enforcement, target: .target}' 2>/dev/null; then
    echo ""
    echo -e "${GREEN}✓ Rulesets verified${NC}"
else
    echo -e "${YELLOW}Could not verify rulesets${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
echo ""
echo "Next steps:"
echo "  1. Visit: https://github.com/$REPO_OWNER/$REPO_NAME/settings/rules"
echo "  2. Review the applied rulesets"
echo "  3. Test with a sample PR"
echo "  4. Adjust configurations as needed"
echo ""
echo "For more information, see:"
echo "  - .github/rulesets/README.md"
echo "  - .github/rulesets/IMPLEMENTATION.md"
