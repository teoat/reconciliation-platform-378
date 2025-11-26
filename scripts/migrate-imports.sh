#!/bin/bash
# ============================================================================
# Import Migration Script
# ============================================================================
# This script helps migrate imports from old paths to new consolidated paths.
# Run this script after consolidating files to update import statements.
#
# Usage:
#   ./scripts/migrate-imports.sh [--dry-run] [--file <file>]
#
# Options:
#   --dry-run    Show what would be changed without making changes
#   --file       Migrate a specific file instead of all files
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
SPECIFIC_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --file)
      SPECIFIC_FILE="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Import migration mappings
# Format: "old_path|new_path"
declare -a MIGRATIONS=(
  "@/utils/passwordValidation|@/utils/common/validation"
  "@/utils/inputValidation|@/utils/common/validation"
  "@/utils/fileValidation|@/utils/common/validation"
  "@/utils/errorExtraction|@/utils/common/errorHandling"
  "@/utils/errorExtractionAsync|@/utils/common/errorHandling"
  "@/utils/errorSanitization|@/utils/common/errorHandling"
  "@/utils/sanitize|@/utils/common/sanitization"
  "@/utils/ariaLiveRegionsHelper|@/utils/accessibility"
  "@/utils/dynamicImports|@/utils/codeSplitting"
  "@/services/utils|@/services/utils/helpers"
  "@/services/constants|@/constants"
)

# Function to migrate a single file
migrate_file() {
  local file="$1"
  local temp_file="${file}.tmp"
  local changed=false
  
  # Read file content
  local content
  content=$(cat "$file")
  local original_content="$content"
  
  # Apply each migration
  for migration in "${MIGRATIONS[@]}"; do
    IFS='|' read -r old_path new_path <<< "$migration"
    
    # Replace import statements
    # Pattern: from 'old_path' or from "old_path"
    if echo "$content" | grep -qE "from ['\"]${old_path}['\"]"; then
      content=$(echo "$content" | sed "s|from ['\"]${old_path}['\"]|from '${new_path}'|g")
      changed=true
    fi
    
    # Replace require statements
    if echo "$content" | grep -qE "require\(['\"]${old_path}['\"]\)"; then
      content=$(echo "$content" | sed "s|require(['\"]${old_path}['\"])|require('${new_path}')|g")
      changed=true
    fi
  done
  
  # Write changes if file was modified
  if [ "$changed" = true ]; then
    if [ "$DRY_RUN" = true ]; then
      echo -e "${YELLOW}Would update:${NC} $file"
      echo -e "${GREEN}Changes:${NC}"
      diff -u <(echo "$original_content") <(echo "$content") || true
    else
      echo "$content" > "$temp_file"
      mv "$temp_file" "$file"
      echo -e "${GREEN}Updated:${NC} $file"
    fi
    return 0
  fi
  
  return 1
}

# Main execution
main() {
  echo -e "${GREEN}Import Migration Script${NC}"
  echo "================================"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN MODE - No files will be modified${NC}"
  fi
  
  # Find files to migrate
  local files_to_migrate=()
  
  if [ -n "$SPECIFIC_FILE" ]; then
    if [ -f "$SPECIFIC_FILE" ]; then
      files_to_migrate=("$SPECIFIC_FILE")
    else
      echo -e "${RED}File not found: $SPECIFIC_FILE${NC}"
      exit 1
    fi
  else
    # Find all TypeScript/TSX files
    while IFS= read -r -d '' file; do
      files_to_migrate+=("$file")
    done < <(find "$PROJECT_ROOT/frontend/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0)
  fi
  
  echo -e "${GREEN}Found ${#files_to_migrate[@]} files to check${NC}"
  echo ""
  
  local updated_count=0
  
  for file in "${files_to_migrate[@]}"; do
    if migrate_file "$file"; then
      ((updated_count++)) || true
    fi
  done
  
  echo ""
  echo "================================"
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Would update $updated_count files${NC}"
    echo -e "${YELLOW}Run without --dry-run to apply changes${NC}"
  else
    echo -e "${GREEN}Updated $updated_count files${NC}"
    echo -e "${GREEN}Please review changes and run tests${NC}"
  fi
}

# Run main function
main

