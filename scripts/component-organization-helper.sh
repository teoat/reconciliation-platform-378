#!/bin/bash
# Component Organization Helper Script
# Helps organize components by analyzing current structure and suggesting moves

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

FRONTEND_DIR="frontend/src"
COMPONENTS_DIR="$FRONTEND_DIR/components"

echo "📁 Component Organization Helper"
echo ""

# Check if components directory exists
if [ ! -d "$COMPONENTS_DIR" ]; then
    log_error "Components directory not found: $COMPONENTS_DIR"
    exit 1
fi

log_info "Analyzing component structure..."

# Find components in root components directory
echo ""
echo "=== Components in Root Directory ==="
find "$COMPONENTS_DIR" -maxdepth 1 -name "*.tsx" -o -name "*.ts" | while read -r file; do
    if [ -f "$file" ]; then
        basename "$file"
    fi
done | sort

# Find components in feature directories
echo ""
echo "=== Components Already Organized ==="
find "$COMPONENTS_DIR" -mindepth 2 -type d | while read -r dir; do
    count=$(find "$dir" -maxdepth 1 -name "*.tsx" -o -name "*.ts" | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
        rel_path=${dir#$COMPONENTS_DIR/}
        echo "  $rel_path/ ($count files)"
    fi
done | sort

# Suggest organization
echo ""
echo "=== Organization Suggestions ==="
echo ""
echo "Based on component names, consider organizing:"
echo ""
echo "Auth Components → components/auth/"
echo "  - AuthPage.tsx (already in pages/)"
echo "  - ForgotPasswordPage.tsx (already in pages/)"
echo ""
echo "Dashboard Components → components/dashboard/"
echo "  - SmartDashboard.tsx"
echo "  - AnalyticsDashboard.tsx"
echo ""
echo "File Components → components/files/"
echo "  - FileUploadInterface.tsx"
echo ""
echo "Workflow Components → components/workflow/"
echo "  - WorkflowAutomation.tsx"
echo "  - WorkflowOrchestrator.tsx"
echo ""
echo "Reporting Components → components/reports/"
echo "  - CustomReports.tsx"
echo "  - ReconciliationAnalytics.tsx"
echo ""
echo "Security Components → components/security/"
echo "  - EnterpriseSecurity.tsx"
echo ""
echo "API Components → components/api/"
echo "  - APIDevelopment.tsx"
echo "  - ApiTester.tsx"
echo "  - ApiIntegrationStatus.tsx"
echo ""
log_info "Use this information to plan component organization"

