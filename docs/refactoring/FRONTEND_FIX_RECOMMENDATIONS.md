# Frontend Fix Recommendations

## 1. Immediate Fixes (Critical Path)
**Goal:** Make the build pass (`npm run build`, `cargo check`).

### Frontend
1.  **Create `frontend/src/config/AppConfig.ts`**
    *   Content should match the interface expected by `WebSocketService`.
    *   Export `APP_CONFIG` object with `WS_URL`, `API_URL`, etc.
2.  **Create `frontend/src/services/apiClient.ts`**
    *   Implement a standard Axios wrapper.
    *   Ensure it exports `apiClient` object with `get`, `post`, `put`, `delete`.
    *   *Constraint:* Must align with `backend-aligned.ts` types if applicable.
3.  **Fix `bundleOptimization.ts`**
    *   Comment out or remove `'components/FrenlyAI'` and `'components/frenly/*'` until files are restored.

### Backend
1.  **Stub Missing Modules**
    *   Create `backend/src/services/backup_recovery.rs` (empty module).
    *   Create `backend/src/services/cache/warming.rs` (empty module).
    *   *Reason:* `cargo check` fails without these.

## 2. Short-Term Refactoring
**Goal:** Enable disconnected features.

1.  **App.tsx Routing**
    *   Import `IngestionPage`, `AdjudicationPage`, `ReconciliationPage`.
    *   Add `Route` definitions for them.
    *   Add a Navigation component (Sidebar/Header) to access these routes.
2.  **Auth Consolidation**
    *   Review `authService.ts` vs `apiClient.ts`. Consolidate logic. `authService` should probably *use* `apiClient` to ensure Tier 4 handling applies to auth calls too.

## 3. Medium-Term Improvements
**Goal:** Feature completion.

1.  **Frenly AI Restoration**
    *   Locate the missing code (check git history or backups).
    *   Re-implement if lost, using `mcp-server` as the backend agent coordinator.
2.  **Backend Sync Implementation**
    *   Implement "Offline Mode" using `Redux Persist` (already in `package.json`) + `Workbox` (PWA).
    *   Queue requests when offline (Tier 4 feature).
