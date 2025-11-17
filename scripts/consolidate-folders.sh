#!/bin/bash
# ==============================================================================
# Master Folder Consolidation Script
# ==============================================================================
# Executes folder consolidation in safe phases with verification
# Usage: ./scripts/consolidate-folders.sh [phase]
# Phases: 1 (low risk), 2 (medium risk), 3 (medium risk), all
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

PHASE="${1:-all}"
BACKUP_DIR="archive/folder-consolidation-$(date +%Y%m%d_%H%M%S)"

log_info "Starting folder consolidation - Phase: $PHASE"
log_info "Backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Phase 1: Low Risk Consolidations
if [ "$PHASE" = "1" ] || [ "$PHASE" = "all" ]; then
    log_info "=== PHASE 1: Low Risk Consolidations ==="
    
    # Archive experimental directories
    if [ -d "data-science" ] || [ -d "ml" ] || [ -d "prototypes" ] || [ -d "venture-in-a-box" ]; then
        log_info "Archiving experimental directories..."
        mkdir -p "$BACKUP_DIR/experimental"
        [ -d "data-science" ] && mv data-science "$BACKUP_DIR/experimental/" && log_success "Archived data-science"
        [ -d "ml" ] && mv ml "$BACKUP_DIR/experimental/" && log_success "Archived ml"
        [ -d "prototypes" ] && mv prototypes "$BACKUP_DIR/experimental/" && log_success "Archived prototypes"
        [ -d "venture-in-a-box" ] && mv venture-in-a-box "$BACKUP_DIR/experimental/" && log_success "Archived venture-in-a-box"
        log_success "Experimental directories archived"
    fi
    
    # Archive legacy packages
    if [ -d "packages/legacy" ]; then
        log_info "Archiving legacy packages..."
        mkdir -p "$BACKUP_DIR/packages"
        mv packages/legacy "$BACKUP_DIR/packages/" && log_success "Archived packages/legacy"
    fi
    
    # Consolidate docker examples
    if [ -d "docker/examples" ]; then
        log_info "Moving docker examples to infrastructure..."
        mkdir -p infrastructure/docker/examples
        mv docker/examples/* infrastructure/docker/examples/ 2>/dev/null || true
        rmdir docker/examples 2>/dev/null || true
        [ -d "docker" ] && rmdir docker 2>/dev/null || true
        log_success "Docker examples consolidated"
    fi
    
    # Archive duplicate monitoring (after verification)
    if [ -d "monitoring" ] && [ -d "infrastructure/monitoring" ]; then
        log_info "Verifying monitoring directories..."
        ROOT_MON_FILES=$(find monitoring -type f 2>/dev/null | wc -l | tr -d ' ')
        INFRA_MON_FILES=$(find infrastructure/monitoring -type f 2>/dev/null | wc -l | tr -d ' ')
        
        if [ "$ROOT_MON_FILES" -lt "$INFRA_MON_FILES" ]; then
            log_info "Archiving root monitoring (infrastructure version is canonical)..."
            mkdir -p "$BACKUP_DIR/infrastructure"
            mv monitoring "$BACKUP_DIR/infrastructure/monitoring-legacy"
            log_success "Monitoring directory archived"
        else
            log_warning "Root monitoring has more files - manual review required"
        fi
    fi
fi

# Phase 2: Medium Risk - Infrastructure
if [ "$PHASE" = "2" ] || [ "$PHASE" = "all" ]; then
    log_info "=== PHASE 2: Infrastructure Consolidation ==="
    
    # Move terraform
    if [ -d "terraform" ] && [ ! -d "infrastructure/terraform" ]; then
        log_info "Moving terraform to infrastructure..."
        mv terraform infrastructure/terraform
        log_success "Terraform moved"
    elif [ -d "terraform" ] && [ -d "infrastructure/terraform" ]; then
        log_warning "Both terraform directories exist - manual review required"
        log_info "Comparing terraform directories..."
        diff -r terraform/ infrastructure/terraform/ > "$BACKUP_DIR/terraform-diff.txt" 2>&1 || true
        log_info "Differences saved to $BACKUP_DIR/terraform-diff.txt"
    fi
    
    # Consolidate nginx (if duplicate)
    if [ -d "nginx" ] && [ -d "infrastructure/nginx" ]; then
        log_warning "Both nginx directories exist - manual review required"
        log_info "Comparing nginx directories..."
        diff -r nginx/ infrastructure/nginx/ > "$BACKUP_DIR/nginx-diff.txt" 2>&1 || true
        log_info "Differences saved to $BACKUP_DIR/nginx-diff.txt"
        log_warning "Manual step: Review differences and consolidate manually"
    fi
    
    # Consolidate k8s (if duplicate)
    if [ -d "k8s" ] && [ -d "infrastructure/kubernetes" ]; then
        log_warning "Both k8s directories exist - manual review required"
        log_info "Comparing k8s directories..."
        diff -r k8s/ infrastructure/kubernetes/ > "$BACKUP_DIR/k8s-diff.txt" 2>&1 || true
        log_info "Differences saved to $BACKUP_DIR/k8s-diff.txt"
        log_warning "Manual step: Review differences and consolidate manually"
    fi
fi

# Phase 3: Medium Risk - Code Directories
if [ "$PHASE" = "3" ] || [ "$PHASE" = "all" ]; then
    log_info "=== PHASE 3: Code Directories Consolidation ==="
    log_warning "This phase requires manual verification of imports"
    
    # Types consolidation
    if [ -d "types" ] && [ -d "frontend/src/types" ]; then
        log_info "Types directories exist - manual consolidation required"
        log_info "See Section 1 of FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md for details"
        log_info "Affected files:"
        grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/types\|import.*['\"]\.\.\/\.\.\/\.\.\/types" frontend/ backend/ --include="*.{ts,tsx,js,jsx}" 2>/dev/null | head -5 || log_info "  No imports found"
    fi
    
    # Test directories
    log_info "Test directories consolidation - manual step required"
    log_info "See Section 5 of FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md for details"
    
    # Root code directories
    log_info "Root code directories (utils, hooks, constants) - manual step required"
    log_info "See Section 6 of FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md for details"
fi

log_success "Folder consolidation complete"
log_info "Backup location: $BACKUP_DIR"
log_info "Review changes and run tests before committing"
log_info "See FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md for detailed fixes"



