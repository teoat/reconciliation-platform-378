#!/bin/bash

# Complete Frontend Start and Diagnostic Script
# Starts frontend server and runs comprehensive diagnostics

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🚀 Frontend Diagnostic Implementation"
log_info "======================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
  log_error "Node.js not found. Please install Node.js first."
  exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
  log_error "npm not found. Please install npm first."
  exit 1
fi

log_info "📦 Node.js version: $(node --version)"
log_info "📦 npm version: $(npm --version)"
echo ""

# Check if frontend dependencies are installed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  log_warning "Frontend dependencies not installed. Installing..."
  cd "$FRONTEND_DIR"
  npm install
  cd "$PROJECT_ROOT"
fi

# Check if Playwright is installed
if [ ! -d "$PROJECT_ROOT/node_modules/@playwright" ]; then
  log_warning "Playwright not installed. Installing..."
  cd "$PROJECT_ROOT"
  npm install --save-dev @playwright/test
  npx playwright install chromium
fi

# Function to check if port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    return 0  # Port is in use
  else
    return 1  # Port is free
  fi
}

# Check if frontend is already running
FRONTEND_PORT=1000
if check_port $FRONTEND_PORT; then
  log_success "Frontend appears to be running on port $FRONTEND_PORT"
  FRONTEND_RUNNING=true
else
  log_info "Starting frontend server on port $FRONTEND_PORT..."
  FRONTEND_RUNNING=false
  
  # Start frontend in background
  cd "$FRONTEND_DIR"
  
  # Use start.sh if it exists, otherwise use npm run dev with port override
  if [ -f "$FRONTEND_DIR/start.sh" ]; then
    log_info "Using start.sh script..."
    bash "$FRONTEND_DIR/start.sh" > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
  else
    log_info "Starting Vite dev server..."
    VITE_PORT=$FRONTEND_PORT npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
  fi
  
  log_info "Frontend starting (PID: $FRONTEND_PID)..."
  log_info "Logs: tail -f $PROJECT_ROOT/frontend.log"
  
  # Wait for frontend to be ready
  log_info "Waiting for frontend to be ready..."
  for i in {1..30}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
      log_success "Frontend is ready!"
      FRONTEND_RUNNING=true
      break
    fi
    sleep 1
    echo -n "."
  done
  echo ""
  
  if [ "$FRONTEND_RUNNING" = false ]; then
    log_error "Frontend failed to start"
    log_info "Check logs: tail -f $PROJECT_ROOT/frontend.log"
    exit 1
  fi
  
  cd "$PROJECT_ROOT"
fi

echo ""
log_info "✅ Frontend is running on http://localhost:$FRONTEND_PORT"
echo ""

# Wait a bit for frontend to fully initialize
log_info "Waiting for frontend to fully initialize..."
sleep 3

# Run diagnostics
log_info "🧪 Running Playwright diagnostics..."
echo ""

cd "$PROJECT_ROOT"

# Run the diagnostic test
if npx playwright test e2e/frontend-ui-diagnostic.spec.ts --project=chromium 2>&1 | tee "$PROJECT_ROOT/test-results/diagnostic-output.log"; then
  log_success "Diagnostics completed successfully!"
else
  log_warning "Some diagnostic tests may have failed. Check the report for details."
fi

echo ""

# Check if report was generated
REPORT_PATH="$PROJECT_ROOT/test-results/frontend-diagnostic-report.json"
if [ -f "$REPORT_PATH" ]; then
  log_success "📊 Diagnostic report generated: $REPORT_PATH"
  
  # Generate markdown report
  log_info "Generating markdown report..."
  
  node -e "
    const fs = require('fs');
    const path = require('path');
    
    try {
      const report = JSON.parse(fs.readFileSync('$REPORT_PATH', 'utf8'));
      
      let markdown = '# Frontend UI/UX Diagnostic Report (Playwright)\n\n';
      markdown += \`**Generated:** \${new Date(report.timestamp).toLocaleString()}\n\`;
      markdown += \`**Total Routes Tested:** \${report.summary.totalRoutes}\n\`;
      markdown += \`**Successful:** \${report.summary.successful}\n\`;
      markdown += \`**Errors:** \${report.summary.errors}\n\`;
      markdown += \`**Warnings:** \${report.summary.warnings}\n\`;
      markdown += \`**Average Load Time:** \${Math.round(report.summary.averageLoadTime)}ms\n\n\`;
      
      markdown += '## Summary\n\n';
      markdown += \`- ✅ Successful Routes: \${report.summary.successful}\n\`;
      markdown += \`- ❌ Routes with Errors: \${report.summary.errors}\n\`;
      markdown += \`- ⚠️  Routes with Warnings: \${report.summary.warnings}\n\`;
      markdown += \`- ⏱️  Average Load Time: \${Math.round(report.summary.averageLoadTime)}ms\n\n\`;
      
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
      
      const reportDir = path.dirname('$PROJECT_ROOT/docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      fs.writeFileSync('$PROJECT_ROOT/docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md', markdown);
      console.log('✅ Markdown report generated: docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md');
    } catch (error) {
      console.error('Error generating markdown report:', error.message);
      process.exit(1);
    }
  "
  
  if [ -f "$PROJECT_ROOT/docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md" ]; then
    log_success "📄 Markdown report generated: docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md"
  fi
else
  log_warning "Diagnostic report not found. Tests may have failed."
  log_info "Check test output: $PROJECT_ROOT/test-results/diagnostic-output.log"
fi

echo ""
log_success "🎉 Frontend diagnostic implementation complete!"
echo ""
log_info "📋 Next Steps:"
log_info "1. Review the diagnostic report: docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md"
log_info "2. Check JSON report: test-results/frontend-diagnostic-report.json"
log_info "3. View test results: test-results/html-report/index.html"
echo ""

# Cleanup: Don't kill frontend if it was already running
if [ "$FRONTEND_RUNNING" = false ] && [ ! -z "$FRONTEND_PID" ]; then
  log_info "Frontend is running in background (PID: $FRONTEND_PID)"
  log_info "To stop it: kill $FRONTEND_PID"
  log_info "Or view logs: tail -f $PROJECT_ROOT/frontend.log"
fi

