#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 11: Git History & Code Churn
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-11-results.json}"

log_info "Starting Git History & Code Churn Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Git repository status
log_info "Checking git repository..."
if [ -d ".git" ] && command -v git &> /dev/null; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    CONTRIBUTORS=$(git log --format='%aN' 2>/dev/null | sort -u | wc -l | tr -d ' ')
    log_success "Git repo: $BRANCH branch, $COMMITS commits, $CONTRIBUTORS contributors"
    add_check "git_status" "success" "Branch: $BRANCH" "Commits: $COMMITS, Contributors: $CONTRIBUTORS"
else
    log_warning "Not a git repository"
    add_check "git_status" "warning" "Not a git repo" ""
fi

# 2. Recent activity
log_info "Checking recent activity..."
if [ -d ".git" ] && command -v git &> /dev/null; then
    RECENT_COMMITS=$(git log --since="7 days ago" --oneline 2>/dev/null | wc -l | tr -d ' ')
    log_info "Recent commits (7 days): $RECENT_COMMITS"
    add_check "recent_activity" "success" "$RECENT_COMMITS commits (7d)" ""
fi

# 3. Code churn (files changed frequently)
log_info "Analyzing code churn..."
if [ -d ".git" ] && command -v git &> /dev/null; then
    CHURN_FILES=$(git log --since="30 days ago" --name-only --pretty=format: 2>/dev/null | \
        sort | uniq -c | sort -rn | head -10 | wc -l | tr -d ' ')
    log_info "High churn files: $CHURN_FILES"
    add_check "code_churn" "success" "$CHURN_FILES high churn files" ""
fi

log_success "Git History & Code Churn Analysis complete"
cat "$RESULTS_FILE" | jq '.'

