# Five-Agent Coordination Plan

**Date**: 2025-01-28  
**Status**: 🔄 Active Coordination  
**Purpose**: Combined SSOT consolidation, phased implementation, and todos with 5-agent orchestration

---

## Executive Summary

This document combines:
- **SSOT Diagnostic Report** - Comprehensive file analysis and consolidation needs
- **Phased Implementation Plan** - Feature development and improvements
- **Master TODOs** - All pending tasks and technical debt

**Work Distribution:**
- **Agent 1**: SSOT Critical Violations (Root-level directories, deprecated files)
- **Agent 2**: Backend Consolidation (Password system, unused code, scripts)
- **Agent 3**: Frontend Migration & Organization (Deprecated imports, component organization)
- **Agent 4**: Testing & Quality (Test coverage, E2E tests, quality improvements)
- **Agent 5**: Documentation & Cleanup (Archive files, move docs, cleanup artifacts)

**Total Estimated Effort**: ~860+ hours  
**Duration**: 12+ weeks (parallel execution with coordination)  
**Coordination Method**: Agent Coordination MCP Server

---

## Agent Registration & Setup

### Prerequisites
1. Ensure Redis is running for agent coordination MCP
2. Register all 5 agents with unique IDs
3. Set up file locking system
4. Configure conflict detection

### Agent Registration Commands

```typescript
// Agent 1: SSOT Specialist
await agent_register({
  agentId: "ssot-specialist-001",
  capabilities: ["typescript", "rust", "refactoring", "ssot"],
  currentTask: "root-level-directory-consolidation"
});

// Agent 2: Backend Consolidator
await agent_register({
  agentId: "backend-consolidator-002",
  capabilities: ["rust", "backend", "refactoring", "security"],
  currentTask: "password-system-consolidation"
});

// Agent 3: Frontend Organizer
await agent_register({
  agentId: "frontend-organizer-003",
  capabilities: ["typescript", "react", "frontend", "migration"],
  currentTask: "deprecated-import-migration"
});

// Agent 4: Quality Assurance
await agent_register({
  agentId: "qa-specialist-004",
  capabilities: ["testing", "playwright", "jest", "vitest"],
  currentTask: "test-coverage-expansion"
});

// Agent 5: Documentation Manager
await agent_register({
  agentId: "docs-manager-005",
  capabilities: ["documentation", "organization", "cleanup"],
  currentTask: "documentation-archival"
});
```

---

## Phase 1: Critical SSOT Violations (Weeks 1-2)

### Agent 1: SSOT Specialist
**Focus**: Root-level directory violations and deprecated file migration

#### Task 1.1: Move Root-Level Directories (HIGH PRIORITY)
**Duration**: 3-4 days  
**Files to Move**:
- `utils/` → `frontend/src/utils/`
- `hooks/` → `frontend/src/hooks/`
- `pages/` → `frontend/src/pages/`
- `types/` → `frontend/src/types/`
- `store/` → `frontend/src/store/`
- `contexts/` → `frontend/src/contexts/`
- `constants/` → `frontend/src/constants/`

**Steps**:
1. Lock all root-level directories
2. Check for conflicts with Agent 3
3. Move files to `frontend/src/`
4. Update all imports across codebase
5. Update `tsconfig.json` paths
6. Run tests to verify
7. Unlock directories

**Coordination**:
- Check with Agent 3 before moving (may have overlapping work)
- Lock files before editing
- Update progress regularly

#### Task 1.2: Migrate Deprecated Utility Imports (HIGH PRIORITY)
**Duration**: 2-3 days  
**Files to Update** (9 files importing `errorExtraction.ts`):
1. `frontend/src/components/SmartDashboard.tsx`
2. `frontend/src/components/FileUploadInterface.tsx`
3. `frontend/src/services/errorHandling.ts`
4. `frontend/src/pages/DashboardPage.tsx`
5. `frontend/src/hooks/useFileReconciliation.ts`
6. `frontend/src/hooks/useAuth.tsx`
7. `frontend/src/hooks/useApi.ts`
8. `frontend/src/store/index.ts`
9. `frontend/src/hooks/useApiErrorHandler.ts`

**Migration Path**:
- `errorExtraction.ts` → `@/utils/common/errorHandling`
- `passwordValidation.ts` → `@/utils/common/validation`
- `sanitize.ts` → `@/utils/common/sanitization`

**Steps**:
1. Lock all files to be updated
2. Update imports one file at a time
3. Test after each file
4. Remove deprecated files after all migrations
5. Update SSOT_LOCK.yml

**Deliverables**:
- ✅ All root-level directories moved
- ✅ All deprecated imports migrated
- ✅ Deprecated files removed
- ✅ All tests passing

---

### Agent 2: Backend Consolidator
**Focus**: Backend password system consolidation and unused code removal

#### Task 2.1: Remove Backend Password Duplicates (HIGH PRIORITY)
**Duration**: 2-3 days

**Files to Modify**:
1. `backend/src/utils/crypto.rs` - Remove password functions (keep other utilities)
2. `backend/src/services/security.rs` - Remove or archive password methods
3. `backend/src/services/password_manager_db.rs` - **REMOVE** (unused, placeholder)
4. `backend/src/services/validation/password.rs` - Verify and remove if unused

**SSOT Location**: `backend/src/services/auth/password.rs` (KEEP)

**Steps**:
1. Lock all password-related files
2. Verify usage of each duplicate implementation
3. Remove password functions from `utils/crypto.rs`
4. Remove or archive `services/security.rs` password methods
5. Remove `password_manager_db.rs`
6. Verify `services/validation/password.rs` usage, remove if unused
7. Update all imports/references
8. Run backend tests
9. Unlock files

**Coordination**:
- Check with Agent 4 for test updates needed
- Coordinate with Agent 1 if any frontend dependencies

**Deliverables**:
- ✅ Only one password implementation (SSOT)
- ✅ All unused password code removed
- ✅ All backend tests passing

#### Task 2.2: Move Backend Scripts (MEDIUM PRIORITY)
**Duration**: 1 day

**Scripts to Move**:
- `backend/start_backend.sh` → `scripts/backend/`
- `backend/CLEAR_CARGO_LOCK.sh` → `scripts/backend/`
- `backend/coverage.sh` → `scripts/backend/`
- `backend/run_coverage.sh` → `scripts/backend/`
- `backend/run_simple.sh` → `scripts/backend/`
- `backend/run_tests.sh` → `scripts/backend/`
- `backend/apply_performance_indexes.sh` → `scripts/backend/`
- `backend/apply-indexes.sh` → `scripts/backend/`

**Steps**:
1. Create `scripts/backend/` directory
2. Move all scripts
3. Update any references to scripts
4. Test script execution
5. Update documentation

**Deliverables**:
- ✅ All backend scripts in `scripts/backend/`
- ✅ All scripts working correctly

---

### Agent 3: Frontend Organizer
**Focus**: Frontend deprecated imports, component organization, large file refactoring

#### Task 3.1: Complete Deprecated Import Migration (HIGH PRIORITY)
**Duration**: 2-3 days

**Coordination with Agent 1**:
- Agent 1 handles `errorExtraction.ts` migration
- Agent 3 handles remaining deprecated imports:
  - `passwordValidation.ts` imports
  - `sanitize.ts` imports
  - `smartFilterService.ts` imports

**Steps**:
1. Find all imports of deprecated files
2. Lock files to be updated
3. Update imports to SSOT locations
4. Test after each migration
5. Remove deprecated files after all migrations

**Deliverables**:
- ✅ All deprecated imports migrated
- ✅ All deprecated files removed

#### Task 3.2: Component Organization (P1 - High Priority)
**Duration**: 1 week

**Components to Organize**:
- Authentication components → `components/auth/`
- Dashboard components → `components/dashboard/`
- File management → `components/files/`
- Workflow components → `components/workflow/`
- Collaboration → `components/collaboration/`
- Reporting → `components/reports/`
- Security → `components/security/`
- API development → `components/api/`

**Steps**:
1. Lock component files
2. Create organized directory structure
3. Move components to appropriate directories
4. Update all imports
5. Verify functionality
6. Update documentation

**Coordination**:
- Check with Agent 4 for test updates
- Coordinate with Agent 1 for import path changes

**Deliverables**:
- ✅ All components organized
- ✅ All imports updated
- ✅ All functionality verified

#### Task 3.3: Large Files Refactoring (P1 - High Priority)
**Duration**: 2 weeks

**Files to Refactor**:
1. `workflowSyncTester.ts` (1,307 lines)
2. `CollaborativeFeatures.tsx` (1,188 lines)
3. `store/index.ts` (1,080 lines)
4. `store/unifiedStore.ts` (1,039 lines)
5. `testDefinitions.ts` (967 lines)
6. `components/index.tsx` (940 lines)
7. `useApi.ts` (939 lines)

**Steps**:
1. Lock each file before refactoring
2. Analyze file structure
3. Extract hooks, utilities, and sub-components
4. Create new organized structure
5. Update imports
6. Test thoroughly
7. Unlock file

**Coordination**:
- Check with Agent 4 for test updates
- Coordinate with Agent 1 for import changes

**Deliverables**:
- ✅ All large files refactored (<500 lines)
- ✅ Code organization improved
- ✅ All tests passing

---

### Agent 4: Quality Assurance
**Focus**: Test coverage expansion, E2E tests, quality improvements

#### Task 4.1: Test Coverage Expansion (P0 - Critical)
**Duration**: 2 weeks

**Target**: 80% coverage

**Tasks**:
- Expand unit test coverage
- Add API integration tests
- Add component unit tests
- Add service unit tests
- Add hook unit tests

**Steps**:
1. Analyze current coverage
2. Identify gaps
3. Create test utilities
4. Write tests incrementally
5. Verify coverage targets
6. Update test infrastructure

**Coordination**:
- Coordinate with Agent 3 for component tests
- Coordinate with Agent 2 for backend tests
- Update tests as other agents refactor code

**Deliverables**:
- ✅ 80% test coverage achieved
- ✅ Test infrastructure complete
- ✅ All tests passing

#### Task 4.2: E2E Testing with Playwright (P1 - High Priority)
**Duration**: 1 week

**Test Scenarios**:
- Authentication flows (signup, login, OAuth)
- Protected routes
- Feature workflows
- File upload/reconciliation
- Dashboard interactions

**Steps**:
1. Set up Playwright test infrastructure
2. Create page object models
3. Write E2E tests for critical flows
4. Run E2E test suite
5. Integrate with CI/CD

**Coordination**:
- Coordinate with Agent 3 for component changes
- Update tests as features change

**Deliverables**:
- ✅ Playwright E2E tests complete
- ✅ All critical flows tested
- ✅ E2E tests in CI/CD

#### Task 4.3: Quality Improvements (P2 - Medium Priority)
**Duration**: 1 week

**Tasks**:
- Fix remaining `any` types (~590 remaining)
- Address linting warnings
- Improve code organization score
- Add missing JSDoc documentation

**Steps**:
1. Identify quality issues
2. Fix incrementally
3. Verify improvements
4. Update documentation

**Deliverables**:
- ✅ Code quality improved
- ✅ Type safety enhanced
- ✅ Documentation complete

---

### Agent 5: Documentation Manager
**Focus**: Archive files, move documentation, cleanup artifacts

#### Task 5.1: Archive Root-Level Completion Reports (MEDIUM PRIORITY)
**Duration**: 1 day

**Files to Archive**:
- `AGGRESSIVE_CONSOLIDATION_COMPLETE.md` → `docs/archive/consolidation-2025-01/`
- `AGGRESSIVE_CONSOLIDATION_REPORT.md` → `docs/archive/consolidation-2025-01/`
- `ALL_TODOS_COMPLETION_REPORT.md` → `docs/archive/completion-reports/`
- `UNUSED_VARIABLES_COMPLETION_SUMMARY.md` → `docs/archive/completion-reports/`
- `UNUSED_VARIABLES_FIX_PROGRESS.md` → `docs/archive/completion-reports/`
- `UNUSED_VARIABLES_INVESTIGATION.md` → `docs/archive/completion-reports/`
- `MAINTENANCE_SYSTEM_COMPLETE.md` → `docs/archive/completion-reports/`
- `FINAL_SUMMARY.txt` → `docs/archive/completion-reports/`

**Steps**:
1. Verify archive directories exist
2. Move files to archive
3. Update any references
4. Document archival

**Deliverables**:
- ✅ All completion reports archived
- ✅ Root directory cleaned

#### Task 5.2: Move Backend Documentation (MEDIUM PRIORITY)
**Duration**: 1 day

**Files to Move**:
- `backend/PASSWORD_CODE_DUPLICATION_ANALYSIS.md` → `docs/analysis/`
- `backend/BACKEND_REGISTER_FIX.md` → `docs/operations/`
- `backend/TEST_ERROR_FIX_GUIDE.md` → `docs/development/`
- `backend/TEST_EXAMPLES.md` → `docs/development/`
- `backend/TEST_INFRASTRUCTURE_SETUP.md` → `docs/development/`

**Steps**:
1. Lock documentation files
2. Move to appropriate `docs/` subdirectories
3. Update references
4. Unlock files

**Deliverables**:
- ✅ All backend docs in `docs/`
- ✅ Documentation organized

#### Task 5.3: Cleanup Build Artifacts (LOW PRIORITY)
**Duration**: 1 day

**Files to Remove**:
- `backend.log` → Remove (should be in logs/)
- `frontend.log` → Remove (should be in logs/)
- `frontend.pid` → Remove (temporary)
- `test-results.log` → Remove (should be in logs/)
- `diagnostic-run.log` → Remove (should be in logs/)
- `tsconfig.tsbuildinfo` → Verify in .gitignore

**Steps**:
1. Verify files are not needed
2. Remove log files
3. Verify .gitignore includes build artifacts
4. Clean up root directory

**Deliverables**:
- ✅ Root directory cleaned
- ✅ Build artifacts properly ignored

#### Task 5.4: Environment File Cleanup (MEDIUM PRIORITY)
**Duration**: 1 day

**Files to Remove**:
- `env.consolidated` (deprecated, SSOT is `.env`)
- `env.frontend` (verify and remove if unused)

**Steps**:
1. Verify files are not referenced
2. Check for any imports/usage
3. Remove if safe
4. Update SSOT_LOCK.yml

**Deliverables**:
- ✅ Environment files cleaned
- ✅ Only `.env` and `.env.example` remain

---

## Phase 2: High Priority Features (Weeks 3-6)

### Agent 1: SSOT Specialist
**Focus**: Continue SSOT consolidation, verify all migrations

#### Task 2.1: Verify SSOT Compliance
- Verify all SSOT violations resolved
- Update SSOT_LOCK.yml
- Create SSOT validation script
- Run validation across codebase

### Agent 2: Backend Consolidator
**Focus**: API improvements, backend enhancements

#### Task 2.1: API Improvements (P1)
- Add utoipa annotations to all handlers
- Complete OpenAPI schema generation
- Fix `/api/logs` endpoint
- Implement WebSocket endpoint
- Add API versioning strategy

### Agent 3: Frontend Organizer
**Focus**: Continue component organization, performance optimization

#### Task 3.1: Performance Optimization (P2)
- Integrate compression middleware
- Optimize bundle splitting
- Review chunk strategy
- Optimize vendor bundles
- Review large components for splitting

### Agent 4: Quality Assurance
**Focus**: Continue test expansion, integration testing

#### Task 4.1: Integration Testing
- Add API integration tests
- Add Redux integration tests
- Add service integration tests
- Verify all tests pass

### Agent 5: Documentation Manager
**Focus**: Documentation updates, help content

#### Task 5.1: Documentation Updates
- Update all documentation references
- Create migration guides
- Update architecture docs
- Complete help content

---

## Phase 3: Medium Priority Enhancements (Weeks 7-12)

### All Agents: Collaborative Work

**Focus Areas**:
- Performance optimization (Agent 3 lead)
- Onboarding enhancements (Agent 3 lead)
- Contextual help expansion (Agent 5 lead)
- Progressive feature disclosure (Agent 3 lead)
- Smart tip system (Agent 3 lead)

**Coordination**: All agents work collaboratively with regular sync points

---

## Coordination Workflow

### Daily Standup (Virtual)
1. Each agent reports:
   - Completed tasks
   - Current task progress
   - Blockers
   - Files locked
   - Conflicts detected

### Conflict Resolution
1. **Before Starting Work**:
   - Check for conflicts using `agent_detect_conflicts`
   - Lock files using `agent_lock_file`
   - Claim tasks using `agent_claim_task`

2. **During Work**:
   - Update progress regularly
   - Release locks when done
   - Update task status

3. **If Conflicts Detected**:
   - Communicate with other agents
   - Resolve conflicts collaboratively
   - Use file locking to prevent conflicts

### Task Management
- Each agent claims tasks before starting
- Update task progress regularly
- Mark tasks complete when done
- Release tasks if switching work

### File Locking Protocol
1. **Before Editing**:
   ```typescript
   // Check for locks
   const lockCheck = await agent_check_file_lock({ file: "path/to/file" });
   
   // Lock file
   await agent_lock_file({
     file: "path/to/file",
     agentId: "agent-id",
     reason: "Refactoring component"
   });
   ```

2. **After Editing**:
   ```typescript
   // Unlock file
   await agent_unlock_file({
     file: "path/to/file",
     agentId: "agent-id"
   });
   ```

---

## Success Metrics

### Phase 1 (Weeks 1-2)
- ✅ 0 root-level directory violations
- ✅ 0 deprecated files in use
- ✅ 1 password implementation (SSOT)
- ✅ All critical SSOT violations resolved

### Phase 2 (Weeks 3-6)
- ✅ 80% test coverage
- ✅ Component organization complete
- ✅ Large files refactored
- ✅ API improvements complete

### Phase 3 (Weeks 7-12)
- ✅ Performance optimizations complete
- ✅ All medium priority items complete
- ✅ Documentation updated
- ✅ Code quality improved

---

## Risk Mitigation

### Technical Risks
- **Import conflicts**: Use file locking and conflict detection
- **Test failures**: Coordinate with Agent 4 for test updates
- **Breaking changes**: Incremental changes with testing

### Coordination Risks
- **File conflicts**: Use agent coordination MCP
- **Duplicate work**: Regular standups and task claiming
- **Communication gaps**: Daily sync points

---

## Related Documentation

- [SSOT Diagnostic Report](../analysis/COMPREHENSIVE_SSOT_DIAGNOSTIC_REPORT.md) - Complete file analysis
- [Phased Implementation Plan](./PHASED_IMPLEMENTATION_PLAN.md) - Feature development plan
- [Master TODOs](./MASTER_TODOS.md) - Complete task list
- [SSOT_LOCK.yml](../../SSOT_LOCK.yml) - SSOT definitions
- [Agent Coordination MCP](../../mcp-server/AGENT_COORDINATION_README.md) - Coordination system

---

**Plan Created**: 2025-01-28  
**Status**: Ready for Execution  
**Next Steps**: Register agents and begin Phase 1

