#!/bin/bash
# ==============================================================================
# Folder Consolidation Verification Script
# ==============================================================================
# Verifies that directories can be safely consolidated/archived
# Usage: ./scripts/verify-folder-consolidation.sh [directory]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

TARGET_DIR="${1:-}"

if [ -z "$TARGET_DIR" ]; then
    log_error "Usage: $0 <directory>"
    log_info "Example: $0 monitoring"
    exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
    log_error "Directory not found: $TARGET_DIR"
    exit 1
fi

log_info "Verifying directory: $TARGET_DIR"
echo ""

# Check for imports/references
log_info "Checking for code references..."
echo ""

# TypeScript/JavaScript imports
TS_REFS=$(grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/$TARGET_DIR\|import.*['\"]\.\.\/\.\.\/\.\.\/$TARGET_DIR" frontend/ backend/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$TS_REFS" -gt 0 ]; then
    log_warning "Found $TS_REFS TypeScript/JavaScript references"
    grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/$TARGET_DIR\|import.*['\"]\.\.\/\.\.\/\.\.\/$TARGET_DIR" frontend/ backend/ 2>/dev/null | head -10
else
    log_success "No TypeScript/JavaScript references found"
fi

# Rust imports
RS_REFS=$(grep -r "mod $TARGET_DIR\|use.*$TARGET_DIR" backend/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$RS_REFS" -gt 0 ]; then
    log_warning "Found $RS_REFS Rust references"
    grep -r "mod $TARGET_DIR\|use.*$TARGET_DIR" backend/ 2>/dev/null | head -10
else
    log_success "No Rust references found"
fi

# Docker compose references
DOCKER_REFS=$(grep -r "$TARGET_DIR" docker-compose*.yml 2>/dev/null | wc -l | tr -d ' ')
if [ "$DOCKER_REFS" -gt 0 ]; then
    log_warning "Found $DOCKER_REFS docker-compose references"
    grep -r "$TARGET_DIR" docker-compose*.yml 2>/dev/null
else
    log_success "No docker-compose references found"
fi

# Script references
SCRIPT_REFS=$(grep -r "$TARGET_DIR" scripts/*.sh 2>/dev/null | wc -l | tr -d ' ')
if [ "$SCRIPT_REFS" -gt 0 ]; then
    log_warning "Found $SCRIPT_REFS script references"
    grep -r "$TARGET_DIR" scripts/*.sh 2>/dev/null | head -10
else
    log_success "No script references found"
fi

# Configuration file references
CONFIG_REFS=$(grep -r "$TARGET_DIR" *.json *.yml *.yaml *.toml 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONFIG_REFS" -gt 0 ]; then
    log_warning "Found $CONFIG_REFS configuration references"
    grep -r "$TARGET_DIR" *.json *.yml *.yaml *.toml 2>/dev/null | head -10
else
    log_success "No configuration references found"
fi

echo ""
log_info "Directory statistics:"
FILE_COUNT=$(find "$TARGET_DIR" -type f | wc -l | tr -d ' ')
DIR_COUNT=$(find "$TARGET_DIR" -type d | wc -l | tr -d ' ')
SIZE=$(du -sh "$TARGET_DIR" 2>/dev/null | cut -f1)

echo "  Files: $FILE_COUNT"
echo "  Directories: $DIR_COUNT"
echo "  Size: $SIZE"

echo ""
if [ "$TS_REFS" -eq 0 ] && [ "$RS_REFS" -eq 0 ] && [ "$DOCKER_REFS" -eq 0 ] && [ "$SCRIPT_REFS" -eq 0 ] && [ "$CONFIG_REFS" -eq 0 ]; then
    log_success "✅ Directory appears safe to archive/consolidate"
    echo ""
    log_info "Recommended action: Archive or consolidate this directory"
else
    log_warning "⚠️  Directory has references - review before archiving"
    echo ""
    log_info "Review the references above before proceeding"
fi

