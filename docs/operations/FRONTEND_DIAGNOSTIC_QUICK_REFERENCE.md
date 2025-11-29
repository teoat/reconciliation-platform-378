# Frontend Comprehensive Diagnostic - Quick Reference

**Last Updated**: 2025-01-16  
**Version**: V3  
**Purpose**: Quick reference for frontend diagnostic with Tier 4 error handling

---

## What is This?

A comprehensive diagnostic prompt that:
- Diagnoses the entire frontend (all pages, features, functions)
- Investigates ultimate fixes for all issues
- Implements **Tier 4 error handling** (enhanced beyond Tier 1-3)
- Validates backend synchronization
- Tests meta AI layer (Frenly AI, onboarding, maintenance)
- Uses **MCP servers** and **Chrome DevTools** for orchestration

---

## Tier 4 Error Handling

**Tier 4** extends beyond Tier 1-3 with:

1. **Proactive Error Prevention**
   - Input validation before API calls
   - Request deduplication
   - Optimistic UI updates with rollback
   - Circuit breaker patterns
   - Request queuing and throttling

2. **Advanced Recovery Mechanisms**
   - Automatic retry with exponential backoff
   - Fallback data sources
   - Partial data rendering
   - Graceful feature degradation
   - Offline mode with sync queue

3. **Predictive Error Detection**
   - Network quality monitoring
   - API response time tracking
   - Error pattern recognition
   - Proactive user warnings
   - Preemptive error prevention

4. **User Experience Optimization**
   - Contextual error messages
   - Actionable error recovery
   - Progress indication during recovery
   - Non-blocking error notifications
   - Seamless error recovery flows

5. **Complete Observability**
   - Error tracking with context
   - Performance metrics
   - User journey tracking
   - Error correlation IDs
   - Error analytics dashboard

---

## Pages to Diagnose

All pages in the application:
- Dashboard (`/`)
- Projects (`/projects`)
- Ingestion (`/ingestion`)
- Reconciliation (`/reconciliation`)
- Adjudication (`/adjudication`)
- Summary (`/summary`)
- Visualization (`/visualization`)
- Cashflow Evaluation (`/cashflow-evaluation`)
- Presummary (`/presummary`)
- Profile (`/profile`)
- Settings (`/settings`)
- Teams (`/teams`)
- Workflows (`/workflows`)
- Analytics (`/analytics`)
- Security (`/security`)
- Admin (`/admin`)
- Help (`/help`)
- Documentation (`/docs`)
- API Docs (`/api-docs`)
- Status (`/status`)
- Health (`/health`)
- Error Pages (404, 500)
- Maintenance (`/maintenance`)

---

## MCP Servers Used

### Reconciliation Platform MCP
- `frontend_build_status` - Check build status
- `check_types` - Type checking
- `run_linter` - Linting
- `run_frontend_tests` - Unit tests
- `run_e2e_tests` - E2E tests
- `run_security_audit` - Security audit
- `backend_health_check` - Backend health

### Chrome DevTools MCP (cursor-ide-browser)
- `browser_navigate` - Navigate to pages
- `browser_snapshot` - Capture page state
- `browser_click` - Test interactions
- `browser_console_messages` - Get console errors
- `browser_network_requests` - Monitor network
- `browser_take_screenshot` - Visual documentation

---

## Chrome DevTools Checks

For each page, check:

1. **Performance Tab**
   - FCP, LCP, TTI, TBT, CLS
   - JavaScript execution time
   - Render time

2. **Network Tab**
   - All API calls
   - Request/response times
   - Failed requests
   - Slow requests (>1s)

3. **Console Tab**
   - JavaScript errors
   - React errors
   - Unhandled promise rejections
   - Warnings

4. **Memory Tab**
   - Memory leaks
   - Large objects
   - Detached DOM nodes

5. **Application Tab**
   - LocalStorage usage
   - SessionStorage usage
   - IndexedDB usage
   - Service Workers

---

## Meta AI Layer

Components to test:
- **Frenly AI**: `frontend/src/components/FrenlyAI.tsx`
- **Frenly Agent**: `agents/guidance/FrenlyGuidanceAgent.ts`
- **Frenly Service**: `frontend/src/services/frenlyAgentService.ts`
- **Frenly Provider**: `frontend/src/components/frenly/FrenlyProvider.tsx`
- **Onboarding**: Check onboarding flows
- **Maintenance**: Check maintenance mode handling

---

## Quick Execution

### Using MCP Servers

```typescript
// 1. Frontend build status
mcp_reconciliation-platform_frontend_build_status({ checkSize: true })

// 2. Type checking
mcp_reconciliation-platform_check_types({ project: "frontend" })

// 3. Linter
mcp_reconciliation-platform_run_linter({ fix: false })

// 4. Tests
mcp_reconciliation-platform_run_frontend_tests({ coverage: true })
mcp_reconciliation-platform_run_e2e_tests({ spec: undefined })

// 5. Security
mcp_reconciliation-platform_run_security_audit({ scope: "frontend" })
```

### Using Chrome DevTools

1. Open application in Chrome
2. Open DevTools (F12)
3. Navigate to each page
4. Check Performance, Network, Console, Memory, Application tabs
5. Document all findings

---

## Output Files

1. **Diagnostic Report**: `docs/diagnostics/FRONTEND_DIAGNOSTIC_REPORT_[TIMESTAMP].md`
2. **JSON Summary**: `docs/diagnostics/FRONTEND_DIAGNOSTIC_[TIMESTAMP].json`
3. **Tier 4 Implementation**: `docs/features/tier4-error-handling-implementation.md`
4. **Fix Recommendations**: `docs/refactoring/FRONTEND_FIX_RECOMMENDATIONS.md`
5. **Action Plan**: `docs/project-management/FRONTEND_ACTION_PLAN.md`

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

## File Locations

- **Full Prompt (Markdown)**: `FRONTEND_COMPREHENSIVE_DIAGNOSTIC_PROMPT_V3.md`
- **Full Prompt (Text)**: `FRONTEND_COMPREHENSIVE_DIAGNOSTIC_PROMPT_V3.txt`
- **Quick Reference**: `docs/operations/FRONTEND_DIAGNOSTIC_QUICK_REFERENCE.md` (this file)

---

## Related Documentation

- [Comprehensive Diagnostic Prompt V2](../operations/COMPREHENSIVE_DIAGNOSTIC_PROMPT_V2.md) - General diagnostic
- [Error Handling Standard](../../docs/error-handling/ERROR_HANDLING_STANDARD.md) - Error handling patterns
- [Frenly AI Implementation](../../docs/features/frenly-ai/frenly-optimization-implementation.md) - Frenly AI docs

---

**Usage**: Use the full prompt (`FRONTEND_COMPREHENSIVE_DIAGNOSTIC_PROMPT_V3.txt` or `.md`) for complete diagnostic execution.

