#!/bin/bash

# 🎯 SSOT ENFORCEMENT SCRIPT - SINGLE SOURCE OF TRUTH VERIFICATION
# This script enforces SSOT principles and detects violations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 SSOT ENFORCEMENT SCRIPT - SINGLE SOURCE OF TRUTH VERIFICATION${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# Initialize violation tracking
VIOLATION_COUNT=0

# Function to log violations
log_violation() {
    local violation_type="$1"
    local description="$2"
    local file_path="$3"
    
    echo -e "${RED}❌ VIOLATION: $violation_type${NC}"
    echo -e "${RED}   Description: $description${NC}"
    echo -e "${RED}   File: $file_path${NC}"
    echo ""
    
    ((VIOLATION_COUNT++))
}

# Function to check for forbidden directories
check_forbidden_directories() {
    echo -e "${YELLOW}🔍 Checking for forbidden directories...${NC}"
    
    local forbidden_dirs=(
        "app"
        "frontend-simple"
        "components"
        "pages"
        "hooks"
        "services"
        "types"
        "utils"
        "contexts"
        "store"
        "styles"
    )
    
    for dir in "${forbidden_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_violation "FORBIDDEN_DIRECTORY" "Directory '$dir' should not exist at root level" "$dir"
        fi
    done
    
    echo -e "${GREEN}✅ Directory check completed${NC}"
    echo ""
}

# Function to check SSOT directory structure
check_ssot_structure() {
    echo -e "${YELLOW}🔍 Checking SSOT directory structure...${NC}"
    
    # Check required SSOT directories exist
    local required_dirs=(
        "frontend"
        "backend"
        "infrastructure"
        "docs"
        "tests"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log_violation "MISSING_SSOT_DIRECTORY" "Required SSOT directory '$dir' is missing" "root"
        fi
    done
    
    echo -e "${GREEN}✅ SSOT structure check completed${NC}"
    echo ""
}

# Function to check file counts
check_file_counts() {
    echo -e "${YELLOW}🔍 Checking file counts...${NC}"
    
    # Count TypeScript files (excluding node_modules and backend)
    local ts_files=$(find . -name "*.ts" -not -path "./node_modules/*" -not -path "./backend/*" -not -path "./backup_*/*" | wc -l)
    local tsx_files=$(find . -name "*.tsx" -not -path "./node_modules/*" -not -path "./backend/*" -not -path "./backup_*/*" | wc -l)
    local total_frontend_files=$((ts_files + tsx_files))
    
    echo -e "${BLUE}  Frontend TypeScript files: $total_frontend_files${NC}"
    
    # Count documentation files (excluding backups)
    local doc_files=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./backup_*/*" | wc -l)
    echo -e "${BLUE}  Documentation files: $doc_files${NC}"
    
    # Count Docker files (excluding backups)
    local docker_files=$(find . -name "Dockerfile*" -o -name "docker-compose*" | grep -v "./backup_" | wc -l)
    echo -e "${BLUE}  Docker files: $docker_files${NC}"
    
    # Check if file counts are reasonable
    if [ "$total_frontend_files" -gt 200 ]; then
        log_violation "EXCESSIVE_FRONTEND_FILES" "Too many frontend files ($total_frontend_files)" "frontend"
    fi
    
    if [ "$doc_files" -gt 20 ]; then
        log_violation "EXCESSIVE_DOCUMENTATION" "Too many documentation files ($doc_files)" "docs"
    fi
    
    if [ "$docker_files" -gt 5 ]; then
        log_violation "EXCESSIVE_DOCKER_FILES" "Too many Docker files ($docker_files)" "infrastructure"
    fi
    
    echo -e "${GREEN}✅ File count check completed${NC}"
    echo ""
}

# Function to display summary
display_summary() {
    echo -e "${BLUE}📊 SSOT COMPLIANCE SUMMARY${NC}"
    echo -e "${BLUE}===========================${NC}"
    echo ""
    
    if [ $VIOLATION_COUNT -eq 0 ]; then
        echo -e "${GREEN}🎉 CONGRATULATIONS!${NC}"
        echo -e "${GREEN}✅ The codebase is fully compliant with SSOT principles!${NC}"
        echo -e "${GREEN}✅ No violations found${NC}"
        echo -e "${GREEN}✅ All checks passed${NC}"
    else
        echo -e "${RED}⚠️  ATTENTION REQUIRED${NC}"
        echo -e "${RED}❌ $VIOLATION_COUNT violations found${NC}"
        echo -e "${RED}❌ Codebase is not SSOT compliant${NC}"
        echo -e "${RED}❌ Immediate action required${NC}"
    fi
    
    echo ""
    
    if [ $VIOLATION_COUNT -gt 0 ]; then
        echo -e "${YELLOW}🔧 Next Steps:${NC}"
        echo -e "${YELLOW}  1. Review violations listed above${NC}"
        echo -e "${YELLOW}  2. Fix all violations${NC}"
        echo -e "${YELLOW}  3. Re-run this script to verify compliance${NC}"
        echo -e "${YELLOW}  4. Read docs/SSOT_GUIDANCE.md for guidance${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting SSOT Enforcement Check...${NC}"
    echo ""
    
    # Run all checks
    check_forbidden_directories
    check_ssot_structure
    check_file_counts
    
    # Display summary
    display_summary
    
    # Exit with appropriate code
    if [ $VIOLATION_COUNT -eq 0 ]; then
        echo -e "${GREEN}🎉 SSOT ENFORCEMENT CHECK COMPLETED SUCCESSFULLY!${NC}"
        exit 0
    else
        echo -e "${RED}❌ SSOT ENFORCEMENT CHECK FAILED - VIOLATIONS FOUND!${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
