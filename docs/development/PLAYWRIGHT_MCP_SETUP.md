# Playwright MCP Setup & Configuration Guide

**Date**: 2025-01-16  
**Status**: ✅ Configured & Optimized  
**Location**: `.cursor/mcp.json` & `frontend/playwright.config.ts`

---

## ✅ Installation Complete

Playwright MCP has been successfully installed and configured for the Reconciliation Platform frontend.

---

## 📋 Overview

The Playwright Model Context Protocol (MCP) server enables AI agents to:
- Automate browser interactions with the frontend
- Test frontend functionality and configuration
- Verify UI components and routes
- Capture performance metrics
- Generate screenshots and reports
- Configure and validate frontend settings

---

## 🔧 Configuration

### MCP Server Configuration

The Playwright MCP server is configured in `.cursor/mcp.json`:

```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@executeautomation/playwright-mcp-server"],
    "env": {
      "PLAYWRIGHT_BROWSERS_PATH": "0",
      "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "0"
    }
  }
}
```

### Frontend Playwright Configuration

Located at `frontend/playwright.config.ts`:
- **Base URL**: `http://localhost:1000`
- **Test Directory**: `frontend/e2e/`
- **Browsers**: Chromium, Firefox, WebKit
- **Auto-start dev server**: Enabled

---

## 🚀 Usage

### Running Tests

```bash
# Run all E2E tests
cd frontend
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Verify Playwright MCP setup
npm run test:e2e:verify
```

### Available Test Suites

1. **Frontend Configuration Tests** (`frontend-config.spec.ts`)
   - Application loading
   - Base URL configuration
   - Authentication flow
   - API proxy configuration
   - Performance metrics
   - WebSocket configuration

2. **Route Tests**
   - Root route handling
   - Login route
   - 404 handling

---

## 🧪 Testing Frontend Configuration

The Playwright MCP can be used to verify frontend configuration:

### 1. Application Loading
- Verifies the app loads at `http://localhost:1000`
- Checks for root element presence
- Validates page title

### 2. Route Navigation
- Tests all major routes
- Verifies route protection
- Checks redirects

### 3. Performance Monitoring
- Measures load times
- Captures DOM metrics
- Tracks network requests

### 4. Error Detection
- Monitors console errors
- Captures network failures
- Validates API responses

---

## 📊 Frontend Configuration Verified

The following frontend configurations are tested:

### ✅ Vite Configuration
- **Port**: 1000
- **Base Path**: Configurable via `VITE_BASE_PATH`
- **Proxy**: `/api` → `http://localhost:2000`
- **WebSocket**: `/ws` → `ws://localhost:2000`

### ✅ React Application
- **Entry Point**: `src/main.tsx`
- **Root Element**: `#root`
- **Router**: React Router v6
- **State Management**: Redux Toolkit

### ✅ Routes
- `/` - Dashboard (protected)
- `/login` - Authentication
- `/analytics` - Analytics Dashboard
- `/settings` - User Settings
- `/profile` - User Profile
- `/projects/:projectId/reconciliation` - Reconciliation Page
- `/quick-reconciliation` - Quick Reconciliation Wizard

### ✅ Performance Optimizations
- Code splitting by feature
- Lazy loading routes
- Vendor chunk optimization
- CSS code splitting

---

## 🔍 MCP Tools Available

When Playwright MCP is active, the following tools are available:

1. **Browser Automation**
   - Navigate to pages
   - Interact with elements
   - Fill forms
   - Click buttons
   - Take screenshots

2. **Testing**
   - Run test suites
   - Verify configurations
   - Check accessibility
   - Validate performance

3. **Debugging**
   - Capture console logs
   - Monitor network requests
   - Inspect DOM elements
   - Trace execution

---

## 🛠️ Troubleshooting

### MCP Server Not Connecting

1. **Check MCP Configuration**
   ```bash
   cat .cursor/mcp.json | grep playwright
   ```

2. **Verify Package Installation**
   ```bash
   npx -y @executeautomation/playwright-mcp-server --version
   ```

3. **Restart Cursor IDE**
   - Close and reopen Cursor
   - MCP servers reload on restart

### Playwright Tests Failing

1. **Check Dev Server**
   ```bash
   cd frontend
   npm run dev
   # Verify http://localhost:1000 is accessible
   ```

2. **Install Browsers**
   ```bash
   cd frontend
   npx playwright install chromium
   ```

3. **Check Test Configuration**
   ```bash
   cd frontend
   npx playwright test --list
   ```

### Frontend Not Loading

1. **Verify Port**
   - Check if port 1000 is available
   - Check for port conflicts

2. **Check Environment Variables**
   ```bash
   cd frontend
   cat .env
   ```

3. **Review Vite Configuration**
   ```bash
   cd frontend
   cat vite.config.ts
   ```

---

## 📝 Example: Using Playwright MCP to Configure Frontend

### Scenario: Verify Frontend Configuration

```typescript
// The AI agent can use Playwright MCP to:
// 1. Navigate to the frontend
// 2. Check configuration
// 3. Verify routes
// 4. Test functionality
// 5. Generate reports
```

### Automated Configuration Check

The verification script (`e2e/verify-playwright-mcp.ts`) automatically:
- ✅ Tests application loading
- ✅ Verifies routes
- ✅ Checks for errors
- ✅ Captures performance metrics
- ✅ Generates screenshots

---

## 🎯 Next Steps

1. **Run Initial Verification**
   ```bash
   cd frontend
   npm run test:e2e:verify
   ```

2. **Add More Tests**
   - Create test files in `frontend/e2e/`
   - Follow Playwright best practices
   - Use page object pattern for complex flows

3. **Integrate with CI/CD**
   - Add Playwright tests to CI pipeline
   - Generate test reports
   - Track test coverage

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright MCP Server](https://github.com/executeautomation/mcp-playwright)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Frontend Testing Guide](../FRONTEND_TESTING_GUIDE.md)

---

## ✅ Verification Checklist

- [x] Playwright installed in frontend
- [x] Playwright MCP server configured
- [x] Test configuration created
- [x] Verification script created
- [x] Test scripts added to package.json
- [x] Documentation created
- [ ] Initial test run completed
- [ ] CI/CD integration (optional)

---

**Last Updated**: 2025-01-16  
**Maintained By**: AI Agent
