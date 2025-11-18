#!/bin/bash
# ============================================================================
# MASTER DIAGNOSTIC RUNNER
# ============================================================================
# Orchestrates all diagnostic tools across 15 diagnostic areas
# Usage: ./scripts/run-all-diagnostics.sh [area] [options]
# ============================================================================

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Diagnostic areas
declare -A DIAGNOSTIC_AREAS=(
    ["all"]="Run all diagnostics"
    ["1"]="Dependency & Package Analysis"
    ["2"]="Code Quality & Complexity"
    ["3"]="Security Vulnerabilities"
    ["4"]="Performance & Optimization"
    ["5"]="Testing Coverage & Quality"
    ["6"]="Dead Code Detection"
    ["7"]="Import/Export Analysis"
    ["8"]="Database & Schema Analysis"
    ["9"]="API Consistency & Documentation"
    ["10"]="Build & Bundle Analysis"
    ["11"]="Git History & Code Churn"
    ["12"]="Environment & Configuration"
    ["13"]="Docker & Container Analysis"
    ["14"]="License Compliance"
    ["15"]="Accessibility Compliance"
    ["system"]="System Health (Docker, Services, Network)"
    ["frontend"]="Frontend Diagnostics (E2E, Playwright)"
    ["oauth"]="Google OAuth Diagnostic"
)

# Results directory
RESULTS_DIR="${RESULTS_DIR:-./diagnostic-results}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
CURRENT_RESULTS_DIR="$RESULTS_DIR/$TIMESTAMP"
mkdir -p "$CURRENT_RESULTS_DIR"

# JSON results file
RESULTS_JSON="$CURRENT_RESULTS_DIR/diagnostic-results.json"

# Initialize results JSON
init_results() {
    cat > "$RESULTS_JSON" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0",
  "areas": []
}
EOF
}

# Add area result
add_area_result() {
    local area=$1
    local status=$2
    local message=$3
    local details=$4
    local duration=$5
    
    jq --arg area "$area" \
       --arg status "$status" \
       --arg message "$message" \
       --arg details "$details" \
       --arg duration "$duration" \
       '.areas += [{
         "area": $area,
         "status": $status,
         "message": $message,
         "details": $details,
         "duration_seconds": $duration,
         "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
       }]' \
       "$RESULTS_JSON" > "${RESULTS_JSON}.tmp" && mv "${RESULTS_JSON}.tmp" "$RESULTS_JSON"
}

# Run diagnostic area
run_diagnostic() {
    local area_num=$1
    local area_name="${DIAGNOSTIC_AREAS[$area_num]}"
    
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Running Diagnostic Area $area_num: $area_name"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local start_time=$(date +%s)
    local script_path="$SCRIPT_DIR/diagnostics/diagnostic-$area_num.sh"
    local output_file="$CURRENT_RESULTS_DIR/area-$area_num.log"
    local status="success"
    local message="Diagnostic completed successfully"
    local details=""
    
    # Check if diagnostic script exists
    if [ ! -f "$script_path" ]; then
        log_warning "Diagnostic script not found: $script_path"
        log_info "Creating placeholder diagnostic..."
        status="warning"
        message="Diagnostic script not yet implemented"
        details="Script path: $script_path"
    else
        # Run diagnostic script
        if bash "$script_path" > "$output_file" 2>&1; then
            log_success "Diagnostic area $area_num completed"
            details=$(tail -n 20 "$output_file" | head -n 10 | tr '\n' '; ')
        else
            local exit_code=$?
            log_error "Diagnostic area $area_num failed with exit code $exit_code"
            status="error"
            message="Diagnostic failed"
            details="Exit code: $exit_code. Check $output_file for details."
        fi
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    add_area_result "$area_num" "$status" "$message" "$details" "$duration"
    
    log_info "Duration: ${duration}s"
    echo ""
}

# Run system diagnostic
run_system_diagnostic() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Running System Health Diagnostic"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local start_time=$(date +%s)
    local output_file="$CURRENT_RESULTS_DIR/system.log"
    local status="success"
    local message="System diagnostic completed"
    
    if [ -f "$SCRIPT_DIR/comprehensive-diagnostic.sh" ]; then
        bash "$SCRIPT_DIR/comprehensive-diagnostic.sh" > "$output_file" 2>&1 || status="error"
    else
        log_warning "System diagnostic script not found"
        status="warning"
        message="System diagnostic script not found"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    add_area_result "system" "$status" "$message" "See $output_file" "$duration"
    echo ""
}

# Run frontend diagnostics
run_frontend_diagnostic() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Running Frontend Diagnostics (Playwright E2E)"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local start_time=$(date +%s)
    local output_file="$CURRENT_RESULTS_DIR/frontend.log"
    local status="success"
    local message="Frontend diagnostics completed"
    
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        cd frontend
        if npm run test:e2e > "../$output_file" 2>&1; then
            log_success "Frontend E2E tests passed"
        else
            status="warning"
            message="Some frontend tests may have failed"
        fi
        cd ..
    else
        log_warning "Frontend directory not found"
        status="warning"
        message="Frontend directory not found"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    add_area_result "frontend" "$status" "$message" "See $output_file" "$duration"
    echo ""
}

# Run OAuth diagnostic
run_oauth_diagnostic() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Running Google OAuth Diagnostic"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local start_time=$(date +%s)
    local output_file="$CURRENT_RESULTS_DIR/oauth.log"
    local status="success"
    local message="OAuth diagnostic completed"
    
    if [ -f "./diagnose-google-oauth.sh" ]; then
        bash ./diagnose-google-oauth.sh > "$output_file" 2>&1 || status="warning"
    else
        log_warning "OAuth diagnostic script not found"
        status="warning"
        message="OAuth diagnostic script not found"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    add_area_result "oauth" "$status" "$message" "See $output_file" "$duration"
    echo ""
}

# Generate summary report
generate_summary() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "DIAGNOSTIC SUMMARY"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local total=$(jq '.areas | length' "$RESULTS_JSON")
    local success=$(jq '[.areas[] | select(.status == "success")] | length' "$RESULTS_JSON")
    local warnings=$(jq '[.areas[] | select(.status == "warning")] | length' "$RESULTS_JSON")
    local errors=$(jq '[.areas[] | select(.status == "error")] | length' "$RESULTS_JSON")
    local total_duration=$(jq '[.areas[].duration_seconds] | add' "$RESULTS_JSON")
    
    echo ""
    log_info "Total Areas Tested: $total"
    log_success "✅ Success: $success"
    log_warning "⚠️  Warnings: $warnings"
    log_error "❌ Errors: $errors"
    log_info "Total Duration: ${total_duration}s"
    echo ""
    log_info "Results saved to: $CURRENT_RESULTS_DIR"
    log_info "JSON Report: $RESULTS_JSON"
    echo ""
    
    # Create summary markdown
    local summary_file="$CURRENT_RESULTS_DIR/SUMMARY.md"
    cat > "$summary_file" <<EOF
# Diagnostic Summary Report

**Timestamp**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Total Areas**: $total
**Success**: $success
**Warnings**: $warnings
**Errors**: $errors
**Total Duration**: ${total_duration}s

## Results

$(jq -r '.areas[] | "- **\(.area)**: \(.status) - \(.message)"' "$RESULTS_JSON")

## Detailed Reports

- Full JSON Report: \`diagnostic-results.json\`
- Individual Logs: \`area-*.log\`

## Next Steps

1. Review individual diagnostic logs for details
2. Address errors and warnings
3. Re-run specific diagnostics as needed
EOF
    
    log_success "Summary report generated: $summary_file"
}

# Show usage
usage() {
    echo "Usage: $0 [area] [options]"
    echo ""
    echo "Areas:"
    for key in "${!DIAGNOSTIC_AREAS[@]}"; do
        echo "  $key - ${DIAGNOSTIC_AREAS[$key]}"
    done
    echo ""
    echo "Options:"
    echo "  --output-dir DIR    Set output directory (default: ./diagnostic-results)"
    echo "  --quick             Run quick diagnostics only"
    echo "  --verbose           Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 all              # Run all diagnostics"
    echo "  $0 1                # Run dependency analysis only"
    echo "  $0 system           # Run system health check"
    echo "  $0 frontend         # Run frontend E2E tests"
}

# Main execution
main() {
    local area="${1:-all}"
    local quick_mode=false
    local verbose=false
    
    # Parse options
    shift || true
    while [[ $# -gt 0 ]]; do
        case $1 in
            --output-dir)
                RESULTS_DIR="$2"
                shift 2
                ;;
            --quick)
                quick_mode=true
                shift
                ;;
            --verbose)
                verbose=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Initialize
    init_results
    
    log_info "============================================================================"
    log_info "MASTER DIAGNOSTIC RUNNER"
    log_info "============================================================================"
    log_info "Results Directory: $CURRENT_RESULTS_DIR"
    log_info "Area: $area"
    echo ""
    
    # Run diagnostics based on area
    case "$area" in
        all)
            # Run all 15 diagnostic areas
            for i in {1..15}; do
                run_diagnostic "$i"
            done
            run_system_diagnostic
            run_frontend_diagnostic
            run_oauth_diagnostic
            ;;
        system)
            run_system_diagnostic
            ;;
        frontend)
            run_frontend_diagnostic
            ;;
        oauth)
            run_oauth_diagnostic
            ;;
        [1-9]|1[0-5])
            run_diagnostic "$area"
            ;;
        *)
            log_error "Unknown diagnostic area: $area"
            usage
            exit 1
            ;;
    esac
    
    # Generate summary
    generate_summary
}

# Run main
main "$@"

