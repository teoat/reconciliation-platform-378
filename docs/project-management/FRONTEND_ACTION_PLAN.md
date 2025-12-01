# Frontend Action Plan

## Phase 1: Stabilization (Week 1)
- [ ] **Task 1.1:** Create `frontend/src/config/AppConfig.ts`.
- [ ] **Task 1.2:** Create `frontend/src/services/apiClient.ts` (Basic Axios wrapper).
- [ ] **Task 1.3:** Fix `backend/src/services/mod.rs` by adding missing file stubs.
- [ ] **Task 1.4:** Remove broken imports in `frontend/src/utils/bundleOptimization.ts`.
- [ ] **Task 1.5:** Verify build passes (`npm run build`, `cargo check`).

## Phase 2: Tier 4 Integration (Week 1-2)
- [ ] **Task 2.1:** Enhance `apiClient.ts` to use `withTier4ErrorHandling`.
- [ ] **Task 2.2:** Create `Tier4ErrorBoundary` component.
- [ ] **Task 2.3:** Wrap `App.tsx` routes with Error Boundary.
- [ ] **Task 2.4:** Verify error reporting in `tier4ErrorHandler`.

## Phase 3: Feature Connection (Week 2)
- [ ] **Task 3.1:** Add routes for `IngestionPage`, `AdjudicationPage`, etc. in `App.tsx`.
- [ ] **Task 3.2:** Update `IngestionPage.tsx` to use real `apiClient` instead of mock timeout.
- [ ] **Task 3.3:** Implement Navigation UI to access these pages.

## Phase 4: AI & Advanced Features (Week 3+)
- [ ] **Task 4.1:** Investigate "Frenly" code loss and restore/rewrite.
- [ ] **Task 4.2:** Connect `mcp-server` to Frontend for Agent Coordination.
- [ ] **Task 4.3:** Implement detailed performance monitoring using Tier 4 analytics.
