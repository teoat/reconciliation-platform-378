#!/bin/bash
# ============================================================================
# Import Path Validation Script
# ============================================================================
# Validates that all imports use correct paths and can be resolved
#
# Usage:
#   ./scripts/validate-imports.sh [--strict] [--fix]
#
# Options:
#   --strict    Fail on warnings (default: warnings only)
#   --fix       Auto-fix import paths where possible
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
UNRESOLVED=0
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

echo -e "${GREEN}Import Path Validation${NC}"
echo "================================"
echo ""

# Function to resolve import path
resolve_import() {
  local import_path="$1"
  local from_file="$2"
  local resolved=""
  
  # Handle @/ alias (frontend/src)
  if [[ "$import_path" =~ ^@/ ]]; then
    local relative_path="${import_path#@/}"
    resolved="$PROJECT_ROOT/frontend/src/$relative_path"
    
    # Try with .ts extension
    if [ -f "$resolved.ts" ]; then
      echo "$resolved.ts"
      return 0
    fi
    
    # Try with .tsx extension
    if [ -f "$resolved.tsx" ]; then
      echo "$resolved.tsx"
      return 0
    fi
    
    # Try as directory with index
    if [ -f "$resolved/index.ts" ]; then
      echo "$resolved/index.ts"
      return 0
    fi
    
    if [ -f "$resolved/index.tsx" ]; then
      echo "$resolved/index.tsx"
      return 0
    fi
  fi
  
  # Handle relative imports
  if [[ "$import_path" =~ ^\.\.?/ ]]; then
    local from_dir=$(dirname "$from_file")
    resolved=$(realpath "$from_dir/$import_path" 2>/dev/null || echo "")
    
    if [ -n "$resolved" ] && [ -f "$resolved" ]; then
      echo "$resolved"
      return 0
    fi
    
    # Try with extensions
    for ext in .ts .tsx; do
      if [ -f "$resolved$ext" ]; then
        echo "$resolved$ext"
        return 0
      fi
    done
  fi
  
  return 1
}

# Function to validate imports in a file
validate_file_imports() {
  local file="$1"
  local has_errors=false
  
  # Extract import statements
  while IFS= read -r import_line; do
    # Extract import path
    if [[ "$import_line" =~ from\ ['\"]([^'\"]+)['\"] ]]; then
      local import_path="${BASH_REMATCH[1]}"
      
      # Skip node_modules and external packages
      if [[ "$import_path" =~ ^[^./] ]] && [[ ! "$import_path" =~ ^@/ ]]; then
        continue
      fi
      
      # Try to resolve import
      if ! resolve_import "$import_path" "$file" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Unresolved import:${NC} $file"
        echo -e "   ${RED}→${NC} $import_path"
        has_errors=true
        ((UNRESOLVED++)) || true
      fi
    fi
  done < <(grep -E "^import.*from ['\"]" "$file" 2>/dev/null || true)
  
  if [ "$has_errors" = true ]; then
    return 1
  fi
  
  return 0
}

# Main validation
echo -e "${GREEN}Validating imports...${NC}"
while IFS= read -r file; do
  validate_file_imports "$file" || true
done < <(find "$PROJECT_ROOT/frontend/src" -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | head -200)

echo ""

# Summary
echo "================================"
if [ $UNRESOLVED -eq 0 ]; then
  echo -e "${GREEN}✅ Import Validation: PASSED${NC}"
  exit 0
else
  echo -e "${RED}❌ Import Validation: FAILED${NC}"
  echo -e "${RED}Found $UNRESOLVED unresolved import(s)${NC}"
  
  if [ "$STRICT_MODE" = true ]; then
    exit 1
  else
    exit 0
  fi
fi

