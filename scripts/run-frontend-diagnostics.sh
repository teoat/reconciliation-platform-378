#!/bin/bash

# Frontend UI/UX Comprehensive Diagnostic Script
# Runs Playwright tests with Chrome DevTools for detailed analysis

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Starting Frontend UI/UX Comprehensive Diagnostic"

# Check if frontend is running
log_info "Checking if frontend is running..."
if ! curl -s http://localhost:1000 > /dev/null 2>&1; then
  log_warning "Frontend not running on http://localhost:1000"
  log_info "Please start the frontend server first:"
  log_info "  cd frontend && npm run dev"
  exit 1
fi

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
  log_error "npx not found. Please install Node.js and npm."
  exit 1
fi

# Run Playwright diagnostic tests
log_info "Running Playwright diagnostic tests..."
cd "$PROJECT_ROOT"

# Run the diagnostic test
npx playwright test e2e/frontend-ui-diagnostic.spec.ts --project=chromium

# Check if report was generated
REPORT_PATH="$PROJECT_ROOT/test-results/frontend-diagnostic-report.json"
if [ -f "$REPORT_PATH" ]; then
  log_success "Diagnostic report generated: $REPORT_PATH"
  
  # Generate markdown report
  log_info "Generating markdown report..."
  node -e "
    const fs = require('fs');
    const path = require('path');
    const report = JSON.parse(fs.readFileSync('$REPORT_PATH', 'utf8'));
    
    let markdown = '# Frontend UI/UX Diagnostic Report (Playwright)\n\n';
    markdown += \`**Generated:** \${new Date(report.timestamp).toLocaleString()}\n\`;
    markdown += \`**Total Routes Tested:** \${report.summary.totalRoutes}\n\`;
    markdown += \`**Successful:** \${report.summary.successful}\n\`;
    markdown += \`**Errors:** \${report.summary.errors}\n\`;
    markdown += \`**Warnings:** \${report.summary.warnings}\n\`;
    markdown += \`**Average Load Time:** \${Math.round(report.summary.averageLoadTime)}ms\n\n\`;
    
    markdown += '## Route Analysis\n\n';
    markdown += '| Route | Status | Load Time | Clickable Elements | Console Errors | Accessibility Issues |\n';
    markdown += '|-------|--------|-----------|-------------------|----------------|---------------------|\n';
    
    report.results.forEach(r => {
      const statusIcon = r.status === 'success' ? '✅' : r.status === 'error' ? '❌' : '⚠️';
      markdown += \`| \${r.route} | \${statusIcon} \${r.status} | \${r.loadTime}ms | \${r.clickableElements.functional}/\${r.clickableElements.total} | \${r.consoleErrors.length} | \${r.accessibilityIssues.length} |\n\`;
    });
    
    markdown += '\n## Detailed Results\n\n';
    
    report.results.forEach(r => {
      markdown += \`### \${r.route}\n\n\`;
      markdown += \`- **Status:** \${r.status}\n\`;
      markdown += \`- **Load Time:** \${r.loadTime}ms\n\`;
      markdown += \`- **Performance:**\n\`;
      markdown += \`  - DOM Content Loaded: \${r.performance.domContentLoaded.toFixed(2)}ms\n\`;
      markdown += \`  - Load Complete: \${r.performance.loadComplete.toFixed(2)}ms\n\`;
      markdown += \`  - First Contentful Paint: \${r.performance.firstContentfulPaint.toFixed(2)}ms\n\`;
      markdown += \`  - Largest Contentful Paint: \${r.performance.largestContentfulPaint.toFixed(2)}ms\n\`;
      markdown += \`  - Cumulative Layout Shift: \${r.performance.cumulativeLayoutShift.toFixed(4)}\n\`;
      markdown += \`- **Clickable Elements:** \${r.clickableElements.functional}/\${r.clickableElements.total} functional\n\`;
      
      if (r.errors.length > 0) {
        markdown += \`- **Errors:**\n\`;
        r.errors.forEach(e => markdown += \`  - \${e}\n\`);
      }
      
      if (r.consoleErrors.length > 0) {
        markdown += \`- **Console Errors:**\n\`;
        r.consoleErrors.slice(0, 5).forEach(e => markdown += \`  - \${e}\n\`);
      }
      
      if (r.accessibilityIssues.length > 0) {
        markdown += \`- **Accessibility Issues:**\n\`;
        r.accessibilityIssues.slice(0, 5).forEach(issue => {
          markdown += \`  - \${issue.id}: \${issue.description}\n\`;
        });
      }
      
      markdown += '\n';
    });
    
    fs.writeFileSync('$PROJECT_ROOT/docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md', markdown);
    console.log('Markdown report generated: docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md');
  "
  
  log_success "Markdown report generated: docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md"
else
  log_error "Diagnostic report not found. Tests may have failed."
  exit 1
fi

log_success "Frontend diagnostic complete!"

