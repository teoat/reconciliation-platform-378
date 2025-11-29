# Frontend Comprehensive Diagnostic & Tier 4 Error Handling Implementation Prompt (V3)

**Purpose**: Execute a complete frontend diagnostic, investigate ultimate fixes, and implement Tier 4 error handling across all pages, features, functions, backend synchronization, and meta AI layers (Frenly AI, onboarding, maintenance).

**Last Updated**: 2025-01-16  
**Status**: Active  
**Orchestration**: MCP Servers + Chrome DevTools

---

## Executive Overview

This prompt orchestrates a comprehensive frontend diagnostic using:
- **MCP Servers**: For automated testing, health checks, and orchestration
- **Chrome DevTools**: For runtime inspection, performance analysis, and feature validation
- **Tier 4 Error Handling**: Enhanced error handling beyond Tier 1-3 (Critical/Important/Standard) with:
  - Proactive error prevention
  - Advanced recovery mechanisms
  - Predictive error detection
  - User experience optimization
  - Complete observability

---

## Phase 1: Frontend Architecture Discovery

### 1.1 Page Inventory & Route Mapping
Using MCP servers and codebase analysis:

1. **Map All Pages**:
   ```bash
   # Use MCP to discover all routes
   - Dashboard (/)
   - Projects (/projects)
   - Ingestion (/ingestion)
   - Reconciliation (/reconciliation)
   - Adjudication (/adjudication)
   - Summary (/summary)
   - Visualization (/visualization)
   - Cashflow Evaluation (/cashflow-evaluation)
   - Presummary (/presummary)
   - Profile (/profile)
   - Settings (/settings)
   - Teams (/teams)
   - Workflows (/workflows)
   - Analytics (/analytics)
   - Security (/security)
   - Admin (/admin)
   - Help (/help)
   - Documentation (/docs)
   - API Docs (/api-docs)
   - Status (/status)
   - Health (/health)
   - Error Pages (404, 500)
   - Maintenance (/maintenance)
   ```

2. **Identify Page Components**:
   - For each page, list:
     - Main component file
     - Sub-components
     - Hooks used
     - Services integrated
     - API endpoints called
     - State management (Redux/local)
     - Error boundaries

3. **Map Feature Functions**:
   - Extract all functions per page:
     - Data fetching functions
     - Form submission handlers
     - User interaction handlers
     - Background sync functions
     - Real-time update handlers
     - File upload/download handlers

### 1.2 Backend Synchronization Mapping

1. **API Integration Points**:
   - List all API service calls per page
   - Map request/response flows
   - Identify WebSocket connections
   - Document polling intervals
   - Map error response handling

2. **Data Flow Analysis**:
   - Frontend → Backend request patterns
   - Backend → Frontend response handling
   - Real-time sync mechanisms
   - Offline/online state management
   - Cache invalidation strategies

### 1.3 Meta AI Layer Analysis

1. **Frenly AI Integration**:
   - Component: `frontend/src/components/FrenlyAI.tsx`
   - Agent: `agents/guidance/FrenlyGuidanceAgent.ts`
   - Service: `frontend/src/services/frenlyAgentService.ts`
   - Provider: `frontend/src/components/frenly/FrenlyProvider.tsx`

2. **Onboarding System**:
   - Identify onboarding flows
   - Map user progress tracking
   - Document step completion logic
   - Analyze onboarding error handling

3. **Maintenance Features**:
   - System maintenance modes
   - Update notifications
   - Feature flags
   - Graceful degradation

---

## Phase 2: Comprehensive Frontend Diagnostics

### 2.1 Automated Diagnostics via MCP Servers

Execute using MCP reconciliation-platform tools:

```typescript
// 1. Frontend Build Status
mcp_reconciliation-platform_frontend_build_status({
  checkSize: true
})

// 2. Type Checking
mcp_reconciliation-platform_check_types({
  project: "frontend",
  timeout: 60000
})

// 3. Linter Check
mcp_reconciliation-platform_run_linter({
  fix: false,
  timeout: 60000
})

// 4. Frontend Tests
mcp_reconciliation-platform_run_frontend_tests({
  coverage: true,
  timeout: 120000
})

// 5. E2E Tests (Playwright)
mcp_reconciliation-platform_run_e2e_tests({
  spec: undefined, // All specs
  headed: false,
  timeout: 600000
})

// 6. Security Audit
mcp_reconciliation-platform_run_security_audit({
  scope: "frontend",
  timeout: 300000
})

// 7. Backend Health (for sync validation)
mcp_reconciliation-platform_backend_health_check({
  endpoint: "http://localhost:2000/health",
  useCache: false
})
```

### 2.2 Chrome DevTools Runtime Analysis

For each page, use Chrome DevTools to:

1. **Performance Analysis**:
   - Open DevTools → Performance tab
   - Record page load and interactions
   - Analyze:
     - First Contentful Paint (FCP)
     - Largest Contentful Paint (LCP)
     - Time to Interactive (TTI)
     - Total Blocking Time (TBT)
     - Cumulative Layout Shift (CLS)

2. **Network Analysis**:
   - Open DevTools → Network tab
   - Navigate to each page
   - Document:
     - All API calls made
     - Request/response times
     - Failed requests
     - Slow requests (>1s)
     - Duplicate requests
     - Missing error handling

3. **Console Error Analysis**:
   - Open DevTools → Console tab
   - Navigate through all pages
   - Document:
     - JavaScript errors
     - React errors
     - Unhandled promise rejections
     - Warnings
     - Network errors

4. **Memory Analysis**:
   - Open DevTools → Memory tab
   - Take heap snapshots
   - Identify:
     - Memory leaks
     - Large objects
     - Detached DOM nodes
     - Event listener leaks

5. **Application State**:
   - Open DevTools → Application tab
   - Check:
     - LocalStorage usage
     - SessionStorage usage
     - IndexedDB usage
     - Service Workers
     - Cache storage

### 2.3 Feature Function Testing

For each page feature:

1. **Manual Testing Checklist**:
   - [ ] Page loads without errors
   - [ ] All interactive elements work
   - [ ] Forms submit correctly
   - [ ] Data displays correctly
   - [ ] Error states display properly
   - [ ] Loading states display properly
   - [ ] Navigation works
   - [ ] Backend sync works
   - [ ] Offline mode works (if applicable)
   - [ ] Real-time updates work (if applicable)

2. **Error Scenario Testing**:
   - [ ] Network failure handling
   - [ ] API error responses (400, 401, 403, 404, 422, 429, 500, 502, 503, 504)
   - [ ] Timeout handling
   - [ ] Invalid data handling
   - [ ] Concurrent request handling
   - [ ] Race condition handling

3. **Edge Case Testing**:
   - [ ] Empty state handling
   - [ ] Large dataset handling
   - [ ] Slow network simulation
   - [ ] Rapid user interactions
   - [ ] Browser back/forward navigation
   - [ ] Tab switching
   - [ ] Page refresh during operations

---

## Phase 3: Tier 4 Error Handling Implementation

### 3.1 Tier 4 Error Handling Definition

**Tier 4** extends beyond Tier 1-3 with:

1. **Proactive Error Prevention**:
   - Input validation before API calls
   - Request deduplication
   - Optimistic UI updates with rollback
   - Circuit breaker patterns
   - Request queuing and throttling

2. **Advanced Recovery Mechanisms**:
   - Automatic retry with exponential backoff
   - Fallback data sources
   - Partial data rendering
   - Graceful feature degradation
   - Offline mode with sync queue

3. **Predictive Error Detection**:
   - Network quality monitoring
   - API response time tracking
   - Error pattern recognition
   - Proactive user warnings
   - Preemptive error prevention

4. **User Experience Optimization**:
   - Contextual error messages
   - Actionable error recovery
   - Progress indication during recovery
   - Non-blocking error notifications
   - Seamless error recovery flows

5. **Complete Observability**:
   - Error tracking with context
   - Performance metrics
   - User journey tracking
   - Error correlation IDs
   - Error analytics dashboard

### 3.2 Implementation Strategy

#### Step 1: Create Tier 4 Error Handler

```typescript
// frontend/src/utils/tier4ErrorHandler.ts

export enum ErrorHandlingTier {
  CRITICAL = 1,    // Auth, payments, data integrity
  IMPORTANT = 2,   // File uploads, data processing
  STANDARD = 3,    // General API calls
  ENHANCED = 4,    // Proactive, predictive, optimized
}

export interface Tier4ErrorConfig {
  tier: ErrorHandlingTier;
  enableProactivePrevention: boolean;
  enablePredictiveDetection: boolean;
  enableAdvancedRecovery: boolean;
  enableUXOptimization: boolean;
  enableObservability: boolean;
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  circuitBreakerConfig?: {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenMaxCalls: number;
  };
  fallbackConfig?: {
    enableFallback: boolean;
    fallbackData?: unknown;
    fallbackComponent?: React.ComponentType;
  };
}

export class Tier4ErrorHandler {
  // Implementation with all Tier 4 features
}
```

#### Step 2: Page-Level Error Handling

For each page, implement:

1. **Error Boundary**:
   ```typescript
   // Wrap each page component
   <Tier4ErrorBoundary
     pageName="Dashboard"
     tier={ErrorHandlingTier.ENHANCED}
     fallback={<DashboardErrorFallback />}
   >
     <Dashboard />
   </Tier4ErrorBoundary>
   ```

2. **API Call Wrapping**:
   ```typescript
   // Wrap all API calls
   const result = await tier4Handler.executeWithTier4(
     () => apiService.getData(),
     {
       tier: ErrorHandlingTier.ENHANCED,
       enableProactivePrevention: true,
       enablePredictiveDetection: true,
       // ... other config
     }
   );
   ```

3. **Function-Level Error Handling**:
   ```typescript
   // Wrap critical functions
   const handleSubmit = tier4Handler.wrapFunction(
     async (formData) => {
       // Function logic
     },
     {
       tier: ErrorHandlingTier.ENHANCED,
       functionName: 'handleSubmit',
       pageName: 'Dashboard',
     }
   );
   ```

#### Step 3: Backend Synchronization Error Handling

1. **Request Interceptors**:
   - Add Tier 4 error handling to all API requests
   - Implement request deduplication
   - Add circuit breaker per endpoint
   - Track request patterns

2. **Response Interceptors**:
   - Standardize error responses
   - Add correlation IDs
   - Track error patterns
   - Implement automatic retry logic

3. **WebSocket Error Handling**:
   - Handle connection failures
   - Implement reconnection logic
   - Queue messages during disconnection
   - Sync on reconnection

4. **Offline/Online Sync**:
   - Queue operations during offline
   - Sync on reconnection
   - Handle conflicts
   - Show sync status

#### Step 4: Meta AI Layer Error Handling

1. **Frenly AI Error Handling**:
   ```typescript
   // Wrap Frenly AI operations
   const frenlyHandler = tier4Handler.createHandler({
     tier: ErrorHandlingTier.ENHANCED,
     component: 'FrenlyAI',
     enableProactivePrevention: true,
     fallbackConfig: {
       enableFallback: true,
       fallbackComponent: FrenlyAIFallback,
     },
   });
   ```

2. **Onboarding Error Handling**:
   - Handle onboarding step failures
   - Resume onboarding on error
   - Track onboarding progress
   - Handle onboarding state corruption

3. **Maintenance Mode Handling**:
   - Detect maintenance mode
   - Show maintenance UI
   - Queue user actions
   - Resume after maintenance

---

## Phase 4: Ultimate Fix Investigation

### 4.1 Root Cause Analysis

For each issue found:

1. **Trace to Source**:
   - Identify exact file and line
   - Trace through call stack
   - Identify contributing factors
   - Check related code

2. **Pattern Detection**:
   - Search for similar issues
   - Identify systemic problems
   - Check historical context
   - Document patterns

3. **Impact Assessment**:
   - User impact (Critical/High/Medium/Low)
   - Business impact
   - Technical impact
   - Fix complexity

4. **Dependency Analysis**:
   - Related issues
   - Blocking issues
   - Fix order
   - Risk assessment

### 4.2 Fix Recommendations

For each issue:

1. **Immediate Fixes**:
   - Quick wins (< 1 hour)
   - Critical bugs
   - Security issues

2. **Short-term Fixes**:
   - High priority (1-2 weeks)
   - User-facing issues
   - Performance issues

3. **Medium-term Fixes**:
   - Important improvements (1-3 months)
   - Architecture improvements
   - Code quality improvements

4. **Long-term Fixes**:
   - Strategic changes (3-6 months)
   - Major refactoring
   - New patterns adoption

### 4.3 Implementation Plan

Create prioritized task list:

1. **Critical Path**:
   - Issues blocking other work
   - Security vulnerabilities
   - Data loss risks

2. **User Impact**:
   - High user-facing issues
   - Performance degradation
   - Broken features

3. **Technical Debt**:
   - Code quality issues
   - Architecture improvements
   - Test coverage gaps

---

## Phase 5: Chrome DevTools Orchestration

### 5.1 Automated Testing with DevTools

Use Chrome DevTools Protocol (CDP) via MCP:

1. **Page Load Testing**:
   ```typescript
   // For each page
   await browser.navigate({ url: pageUrl });
   await browser.wait_for({ text: "Page loaded" });
   const snapshot = await browser.snapshot();
   // Analyze snapshot for errors
   ```

2. **Interaction Testing**:
   ```typescript
   // Test all interactive elements
   await browser.click({ element: "button", ref: "submit-btn" });
   await browser.wait_for({ time: 2 });
   const errors = await browser.console_messages();
   // Check for errors
   ```

3. **Network Monitoring**:
   ```typescript
   // Monitor all network requests
   const requests = await browser.network_requests();
   // Analyze for:
   // - Failed requests
   // - Slow requests
   // - Missing error handling
   ```

### 5.2 Performance Profiling

For each page:

1. **Lighthouse Audit**:
   - Performance score
   - Accessibility score
   - Best practices score
   - SEO score

2. **Performance Metrics**:
   - FCP, LCP, TTI, TBT, CLS
   - JavaScript execution time
   - Render time
   - Network time

3. **Bundle Analysis**:
   - Bundle size per page
   - Code splitting effectiveness
   - Unused code detection
   - Dependency optimization

### 5.3 Error Detection

1. **Console Error Monitoring**:
   - Capture all console errors
   - Categorize by type
   - Track frequency
   - Document context

2. **Network Error Monitoring**:
   - Failed API calls
   - Timeout errors
   - CORS errors
   - 4xx/5xx responses

3. **Runtime Error Monitoring**:
   - Unhandled exceptions
   - Promise rejections
   - React errors
   - Memory errors

---

## Phase 6: Comprehensive Reporting

### 6.1 Diagnostic Report Structure

```markdown
# Frontend Comprehensive Diagnostic Report

## Executive Summary
- Overall Health Score: X/100
- Critical Issues: X
- High Priority Issues: X
- Pages Analyzed: X
- Features Tested: X
- Tier 4 Implementation Status: X%

## Page-by-Page Analysis
### Dashboard
- Status: ✅/❌/⚠️
- Errors Found: X
- Performance Score: X/100
- Tier 4 Coverage: X%
- Issues:
  - [Issue 1]
  - [Issue 2]
- Recommendations:
  - [Recommendation 1]
  - [Recommendation 2]

### Projects
[... repeat for each page]

## Feature Analysis
### Data Fetching
- Status: ✅/❌/⚠️
- Error Handling: Tier X
- Issues: [...]
- Recommendations: [...]

### Form Submission
[... repeat for each feature]

## Backend Synchronization Analysis
### API Integration
- Endpoints Tested: X
- Errors Found: X
- Sync Issues: X
- Recommendations: [...]

### WebSocket Integration
- Connection Status: ✅/❌
- Reconnection Logic: ✅/❌
- Error Handling: Tier X
- Issues: [...]
- Recommendations: [...]

## Meta AI Layer Analysis
### Frenly AI
- Status: ✅/❌/⚠️
- Error Handling: Tier X
- Issues: [...]
- Recommendations: [...]

### Onboarding
- Status: ✅/❌/⚠️
- Error Handling: Tier X
- Issues: [...]
- Recommendations: [...]

### Maintenance
- Status: ✅/❌/⚠️
- Error Handling: Tier X
- Issues: [...]
- Recommendations: [...]

## Tier 4 Error Handling Implementation
### Current State
- Pages with Tier 4: X/Y
- Features with Tier 4: X/Y
- Coverage: X%

### Implementation Plan
- Phase 1: Critical Pages (Week 1-2)
- Phase 2: Important Pages (Week 3-4)
- Phase 3: Standard Pages (Week 5-6)
- Phase 4: Meta AI Layer (Week 7-8)

## Ultimate Fix Recommendations
### Immediate Actions
1. [Fix 1] - Priority: Critical
2. [Fix 2] - Priority: Critical

### Short-term Actions
1. [Fix 1] - Priority: High
2. [Fix 2] - Priority: High

### Medium-term Actions
1. [Fix 1] - Priority: Medium
2. [Fix 2] - Priority: Medium

### Long-term Actions
1. [Fix 1] - Priority: Low
2. [Fix 2] - Priority: Low

## Performance Analysis
### Page Load Times
- Dashboard: Xms
- Projects: Xms
- [... for each page]

### Bundle Sizes
- Dashboard: X KB
- Projects: X KB
- [... for each page]

### Optimization Opportunities
- [Opportunity 1]
- [Opportunity 2]

## Chrome DevTools Findings
### Console Errors
- Total Errors: X
- By Type: [...]
- By Page: [...]

### Network Issues
- Failed Requests: X
- Slow Requests: X
- Missing Error Handling: X

### Performance Issues
- Slow Pages: [...]
- Memory Leaks: [...]
- Render Blocking: [...]

## Action Plan
### Week 1-2: Critical Fixes
- [Task 1]
- [Task 2]

### Week 3-4: High Priority Fixes
- [Task 1]
- [Task 2]

### Week 5-8: Tier 4 Implementation
- [Task 1]
- [Task 2]

## Metrics & Tracking
### Before/After Comparison
- Error Rate: X% → Y%
- Performance Score: X → Y
- User Satisfaction: X → Y

### Success Criteria
- [ ] All critical issues fixed
- [ ] All pages have Tier 4 error handling
- [ ] Performance score > 90
- [ ] Error rate < 1%
- [ ] All features tested
```

### 6.2 JSON Summary

```json
{
  "timestamp": "2025-01-16T00:00:00Z",
  "overallHealthScore": 75,
  "pages": [
    {
      "name": "Dashboard",
      "status": "needs_attention",
      "errors": 5,
      "performanceScore": 80,
      "tier4Coverage": 60,
      "issues": [...],
      "recommendations": [...]
    }
  ],
  "features": [...],
  "backendSync": {...},
  "metaAI": {...},
  "tier4Implementation": {...},
  "fixes": [...],
  "performance": {...},
  "devtoolsFindings": {...}
}
```

---

## Phase 7: Validation & Verification

### 7.1 Fix Verification

1. **Automated Testing**:
   - Run all tests
   - Check test coverage
   - Verify no regressions

2. **Manual Testing**:
   - Test all fixed issues
   - Verify error handling
   - Check user experience

3. **Performance Validation**:
   - Compare before/after metrics
   - Verify improvements
   - Check for regressions

### 7.2 Tier 4 Implementation Verification

1. **Coverage Check**:
   - Verify all pages have Tier 4
   - Verify all features have Tier 4
   - Verify backend sync has Tier 4
   - Verify meta AI has Tier 4

2. **Functionality Check**:
   - Test error scenarios
   - Verify recovery mechanisms
   - Check user experience
   - Validate observability

---

## Execution Commands

### Using MCP Servers

```bash
# 1. Frontend diagnostics
# Use MCP reconciliation-platform tools

# 2. Chrome DevTools
# Use MCP cursor-ide-browser tools for automated testing

# 3. Backend health check
# Use MCP reconciliation-platform_backend_health_check
```

### Manual Chrome DevTools Steps

1. Open application in Chrome
2. Open DevTools (F12)
3. Navigate to each page
4. Record findings in report
5. Take screenshots of errors
6. Export performance profiles
7. Export network logs

---

## Success Criteria

✅ All pages diagnosed  
✅ All features tested  
✅ All errors documented  
✅ Tier 4 error handling implemented  
✅ Ultimate fixes identified  
✅ Backend sync validated  
✅ Meta AI layer validated  
✅ Performance optimized  
✅ Comprehensive report generated  
✅ Action plan created  

---

## Output Files

1. **Diagnostic Report**: `docs/diagnostics/FRONTEND_DIAGNOSTIC_REPORT_[TIMESTAMP].md`
2. **JSON Summary**: `docs/diagnostics/FRONTEND_DIAGNOSTIC_[TIMESTAMP].json`
3. **Tier 4 Implementation**: `docs/features/tier4-error-handling-implementation.md`
4. **Fix Recommendations**: `docs/refactoring/FRONTEND_FIX_RECOMMENDATIONS.md`
5. **Action Plan**: `docs/project-management/FRONTEND_ACTION_PLAN.md`

---

**Usage**: Copy this prompt and provide it to the AI agent to execute a comprehensive frontend diagnostic with Tier 4 error handling implementation.

