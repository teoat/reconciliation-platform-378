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
  
  # Skip test files
  if [[ "$file" =~ (__tests__|\.test\.|\.spec\.) ]]; then
    return 0
  fi
  
  # Check for actual import statements (not comments)
  # Match: import ... from "path" or import ... from 'path'
  local deprecated_patterns=(
    "errorExtraction['\"]"  # errorExtraction.ts (removed)
    "passwordValidation['\"]"  # passwordValidation.ts (deprecated)
    "/services/errorHandler['\"]"  # services/errorHandler.ts (deprecated)
  )
  
  # Extract import lines (excluding comments and errorExtractionAsync which is a wrapper)
  local import_lines=$(grep -E "^[[:space:]]*import.*from" "$file" 2>/dev/null | grep -v "^[[:space:]]*//" | grep -v "errorExtractionAsync" || true)
  
  if [ -z "$import_lines" ]; then
    return 0
  fi
  
  for pattern in "${deprecated_patterns[@]}"; do
    if echo "$import_lines" | grep -qE "$pattern"; then
      local matching_line=$(echo "$import_lines" | grep -E "$pattern" | head -1 | sed 's/^[[:space:]]*//')
      echo -e "${YELLOW}⚠️  SSOT Violation:${NC} $file"
      echo -e "   ${RED}→${NC} Uses deprecated import: $matching_line"
      ((violations++)) || true
    fi
  done
  
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
DEPRECATED_FILES=0
TEMP_FILE=$(mktemp)
while IFS= read -r file; do
  if check_ssot_violations "$file" > "$TEMP_FILE" 2>&1; then
    if [ -s "$TEMP_FILE" ]; then
      cat "$TEMP_FILE"
      ((DEPRECATED_FILES++)) || true
      ((VIOLATIONS++)) || true
    fi
  fi
done < <(find "$PROJECT_ROOT/frontend/src" -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/__tests__/*" ! -name "*.test.*" ! -name "*.spec.*" 2>/dev/null)
rm -f "$TEMP_FILE"

if [ $DEPRECATED_FILES -eq 0 ]; then
  echo -e "${GREEN}✅ No deprecated imports found${NC}"
else
  echo -e "${YELLOW}Found $DEPRECATED_FILES file(s) with deprecated imports${NC}"
fi
echo ""

echo -e "${GREEN}3. Checking for root-level directory violations...${NC}"
ROOT_VIOLATIONS=0
for dir in utils hooks pages types store contexts constants; do
  if [ -d "$PROJECT_ROOT/$dir" ] && [ "$(find "$PROJECT_ROOT/$dir" -type f 2>/dev/null | wc -l)" -gt 0 ]; then
    echo -e "${RED}❌ Root-level directory violation:${NC} $dir/ still contains files"
    echo -e "   ${YELLOW}→${NC} Should be moved to frontend/src/$dir/"
    ((ROOT_VIOLATIONS++)) || true
    ((VIOLATIONS++)) || true
  fi
done

if [ $ROOT_VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ No root-level directory violations${NC}"
else
  echo -e "${RED}Found $ROOT_VIOLATIONS root-level directory violation(s)${NC}"
fi
echo ""

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

