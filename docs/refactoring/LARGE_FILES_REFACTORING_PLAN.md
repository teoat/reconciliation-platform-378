# Large Files Refactoring Plan

**Created**: 2025-01-27  
**Status**: In Progress

## Overview

This document tracks the refactoring of files with more than 500 lines to improve maintainability, readability, and code organization.

## Files Identified (>500 lines)

### MCP Server Files
1. **mcp-server/src/index.ts** (1854 lines) - Main MCP server
   - **Plan**: Split into modules:
     - `lib/config.ts` - Configuration constants
     - `lib/docker.ts` - Docker operations
     - `lib/redis.ts` - Redis operations
     - `lib/health.ts` - Health checks
     - `lib/git.ts` - Git operations
     - `lib/diagnostics.ts` - Diagnostic tools
     - `lib/tools.ts` - Tool definitions and handlers
     - `lib/metrics.ts` - Metrics tracking
     - `lib/utils.ts` - Utility functions
     - `lib/server.ts` - Main server setup

2. **mcp-server/src/agent-coordination.ts** (1544 lines) - Agent coordination server
   - **Plan**: Split into modules:
     - `lib/redis.ts` - Redis connection
     - `lib/tasks.ts` - Task management
     - `lib/locks.ts` - File locking
     - `lib/agents.ts` - Agent status
     - `lib/conflicts.ts` - Conflict detection
     - `lib/tools.ts` - Tool definitions
     - `lib/server.ts` - Main server setup

### Backend Files
3. **backend/src/middleware/zero_trust.rs** (1524 lines) - Zero-trust middleware
   - **Plan**: Split into modules:
     - `config.rs` - Configuration
     - `identity.rs` - Identity verification
     - `mtls.rs` - mTLS verification
     - `privilege.rs` - Least privilege enforcement
     - `network.rs` - Network segmentation
     - `mod.rs` - Main middleware

4. **backend/src/handlers/auth.rs** (1015 lines) - Auth handlers
   - **Plan**: Split by functionality:
     - `login.rs` - Login handler
     - `register.rs` - Registration handler
     - `password.rs` - Password operations
     - `oauth.rs` - OAuth handlers
     - `mod.rs` - Route configuration

5. **backend/src/services/backup_recovery.rs** (896 lines)
6. **backend/src/services/user/mod.rs** (876 lines)
7. **backend/src/services/reconciliation/service.rs** (804 lines)
8. **backend/src/services/auth/mod.rs** (798 lines)
9. **backend/src/cqrs/handlers.rs** (763 lines)
10. **backend/src/middleware/logging.rs** (747 lines)
11. **backend/src/services/internationalization.rs** (729 lines)
12. **backend/src/middleware/auth.rs** (682 lines)

### Frontend Files
13. **frontend/src/pages/AdjudicationPage.tsx** (785 lines)
14. **frontend/src/components/EnhancedIngestionPage.tsx** (770 lines)
15. **frontend/src/components/frenly/FrenlyProvider.tsx** (759 lines)
16. **frontend/src/pages/ReconciliationPage.tsx** (754 lines)
17. **frontend/src/components/AdvancedVisualization.tsx** (751 lines)
18. **frontend/src/services/microInteractionService.ts** (751 lines)
19. **frontend/src/components/files/FileUploadInterface.tsx** (747 lines)
20. **frontend/src/pages/SecurityPage.tsx** (727 lines)
21. **frontend/src/components/onboarding/EnhancedFrenlyOnboarding.tsx** (723 lines)
22. **frontend/src/components/SkeletonComponents.tsx** (716 lines)
23. **frontend/src/components/monitoring/MonitoringDashboard.tsx** (713 lines)
24. **frontend/src/components/TypographyScale.tsx** (701 lines)
25. **frontend/src/services/i18nService.tsx** (682 lines)
26. **frontend/src/components/pages/Settings.tsx** (680 lines)
27. **frontend/src/components/AIDiscrepancyDetection.tsx** (679 lines)
28. **frontend/src/services/monitoringService.ts** (670 lines)
29. **frontend/src/hooks/useWebSocketIntegration.ts** (656 lines)

### Test Files
30. **backend/tests/e2e_tests.rs** (1401 lines)
31. **backend/tests/api_endpoint_tests.rs** (1237 lines)
32. **backend/tests/auth_handler_tests.rs** (1126 lines)
33. **backend/tests/reconciliation_api_tests.rs** (1115 lines)
34. **backend/tests/project_service_tests.rs** (1036 lines)
35. **backend/tests/reconciliation_integration_tests.rs** (1019 lines)
36. **backend/tests/user_service_tests.rs** (991 lines)
37. **backend/tests/service_tests.rs** (873 lines)
38. **backend/tests/security_tests.rs** (722 lines)

## Refactoring Strategy

### Phase 1: MCP Server Files (Priority: High)
- [ ] Refactor `mcp-server/src/index.ts`
- [ ] Refactor `mcp-server/src/agent-coordination.ts`

### Phase 2: Backend Core Files (Priority: High)
- [ ] Refactor `backend/src/middleware/zero_trust.rs`
- [ ] Refactor `backend/src/handlers/auth.rs`
- [ ] Refactor `backend/src/services/backup_recovery.rs`
- [ ] Refactor `backend/src/services/user/mod.rs`
- [ ] Refactor `backend/src/services/reconciliation/service.rs`
- [ ] Refactor `backend/src/services/auth/mod.rs`
- [ ] Refactor `backend/src/cqrs/handlers.rs`
- [ ] Refactor `backend/src/middleware/logging.rs`
- [ ] Refactor `backend/src/services/internationalization.rs`
- [ ] Refactor `backend/src/middleware/auth.rs`

### Phase 3: Frontend Components (Priority: Medium)
- [ ] Refactor large page components
- [ ] Refactor large service files
- [ ] Extract reusable hooks and utilities

### Phase 4: Test Files (Priority: Low)
- [ ] Split large test files into focused test modules
- [ ] Extract common test utilities

## Refactoring Principles

1. **Single Responsibility**: Each module should have one clear purpose
2. **Separation of Concerns**: Separate business logic from infrastructure
3. **DRY**: Eliminate code duplication
4. **Testability**: Make code easier to test
5. **Maintainability**: Improve code organization and readability

## Progress Tracking

- [x] Identify all files >500 lines
- [ ] Refactor MCP server files
- [ ] Refactor backend core files
- [ ] Refactor frontend components
- [ ] Refactor test files
- [ ] Verify all refactored code compiles
- [ ] Run test suite to ensure no regressions
