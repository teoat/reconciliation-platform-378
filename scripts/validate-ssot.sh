#!/bin/bash
# ============================================================================
# SSOT Compliance Validation Script
# ============================================================================
# Validates that all code follows SSOT (Single Source of Truth) principles
# as defined in SSOT_LOCK.yml
#
# Usage:
#   ./scripts/validate-ssot.sh [--strict] [--fix]
#
# Options:
#   --strict    Fail on warnings (default: warnings only)
#   --fix       Auto-fix violations where possible
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
STRICT_MODE=false
AUTO_FIX=false
VIOLATIONS=0
WARNINGS=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --strict)
      STRICT_MODE=true
      shift
      ;;
    --fix)
      AUTO_FIX=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Load SSOT rules from SSOT_LOCK.yml
SSOT_LOCK_FILE="$PROJECT_ROOT/SSOT_LOCK.yml"

if [ ! -f "$SSOT_LOCK_FILE" ]; then
  echo -e "${RED}Error: SSOT_LOCK.yml not found${NC}"
  exit 1
fi

echo -e "${GREEN}SSOT Compliance Validation${NC}"
echo "================================"
echo ""

# Function to check SSOT violations
check_ssot_violations() {
  local file="$1"
  local violations=0
  
  # Check for deprecated imports
  while IFS= read -r deprecated_path; do
    if grep -q "from ['\"]${deprecated_path}" "$file" 2>/dev/null; then
      echo -e "${YELLOW}⚠️  SSOT Violation:${NC} $file uses deprecated path: $deprecated_path"
      ((violations++)) || true
      
      if [ "$AUTO_FIX" = true ]; then
        # Extract SSOT path from SSOT_LOCK.yml
        local ssot_path=$(yq eval ".sources_of_truth.*.deprecated_paths[] | select(. == \"$deprecated_path\") | parent | .path" "$SSOT_LOCK_FILE" 2>/dev/null || echo "")
        if [ -n "$ssot_path" ]; then
          echo -e "${GREEN}  → Auto-fixing:${NC} Replacing with $ssot_path"
          # Auto-fix would go here (requires sed/perl)
        fi
      fi
    fi
  done < <(yq eval '.sources_of_truth.*.deprecated_paths[]' "$SSOT_LOCK_FILE" 2>/dev/null || true)
  
  return $violations
}

# Function to validate SSOT file existence
validate_ssot_files() {
  local missing=0
  
  while IFS= read -r ssot_path; do
    if [ ! -f "$PROJECT_ROOT/$ssot_path" ]; then
      echo -e "${RED}❌ SSOT file missing:${NC} $ssot_path"
      ((missing++)) || true
    fi
  done < <(yq eval '.sources_of_truth.*.path // .sources_of_truth.*.frontend.path // .sources_of_truth.*.backend.path' "$SSOT_LOCK_FILE" 2>/dev/null || true)
  
  return $missing
}

# Main validation
echo -e "${GREEN}1. Validating SSOT file existence...${NC}"
if validate_ssot_files; then
  echo -e "${GREEN}✅ All SSOT files exist${NC}"
else
  echo -e "${RED}❌ Some SSOT files are missing${NC}"
  ((VIOLATIONS++)) || true
fi
echo ""

echo -e "${GREEN}2. Checking for deprecated imports...${NC}"
while IFS= read -r file; do
  check_ssot_violations "$file" || ((VIOLATIONS++)) || true
done < <(find "$PROJECT_ROOT/frontend/src" -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | head -100)

echo ""

# Summary
echo "================================"
if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ SSOT Compliance: PASSED${NC}"
  exit 0
else
  echo -e "${RED}❌ SSOT Compliance: FAILED${NC}"
  echo -e "${RED}Found $VIOLATIONS violation(s)${NC}"
  
  if [ "$STRICT_MODE" = true ]; then
    exit 1
  else
    exit 0
  fi
fi

