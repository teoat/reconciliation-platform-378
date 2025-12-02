# Phased Optimization Orchestration Plan

## Overview
This plan orchestrates a comprehensive clean-up, optimization, and standardization of the 378 Reconciliation Platform. It addresses compilation errors, dead code, "overengineering" (duplication/complexity), and synchronization gaps.

---

## Phase 1: Backend Resurrection (The "Green Build" Mandate)
**Objective:** Restore backend compilation and runtime stability.
**Status:** 🔴 Broken (120+ Compilation Errors)

1.  **Diesel Type Alignment:**
    *   Fix `diesel::Expression` trait errors for `String` fields in models (likely missing `#[diesel(check_for_backend(diesel::pg::Pg))]` or similar).
    *   Align `src/models/*.rs` structs with `src/schema.rs` types.
    *   Fix `Result<Self, String>` vs `Self` mismatches in middleware constructors.
2.  **Missing Field Injection:**
    *   Add missing fields (e.g., `provider_id` in `NewUser`) to structs where compilation fails.
3.  **Stub Refinement:**
    *   Ensure all stubs (`QueryTuningService`, `BackupService`) match the expected interface of the rest of the app.

## Phase 2: Frontend Hygiene & Standardization
**Objective:** Clean up the frontend codebase, remove bloat, and standardize styles.
**Status:** 🟡 Building, but unoptimized.

1.  **Dead Code Removal:**
    *   Identify and remove unused files in `frontend/src/utils/` (legacy params, etc.).
    *   Remove commented-out `console.log` statements.
2.  **Tree Shaking & Lazy Loading:**
    *   Implement `React.lazy()` for all top-level routes in `App.tsx` to enable code splitting.
    *   Verify `vite.config.ts` manual chunks are effective.
3.  **Component Standardization:**
    *   Review `frontend/src/components/ui` (currently empty?) vs usage of `lucide-react` icons directly.
    *   Standardize on a single error handling pattern (Tier 4 is present, verify widespread usage).

## Phase 3: Integration & Synchronization
**Objective:** Ensure the Frontend and Backend can actually talk.
**Status:** ❓ Unknown (blocked by backend build).

1.  **Link Interaction Verification:**
    *   Verify `apiClient` endpoints match `backend/src/api` routes.
    *   Check for broken links or 404s in the frontend routing.
2.  **Environment Sync:**
    *   Ensure `VITE_API_URL` in frontend matches backend listen address.

## Phase 4: Documentation Alignment
**Objective:** Make the documentation a true reflection of the code.
**Status:** ❌ Drifting (`REACT_PERFORMANCE_GUIDE.md` is hallucinating).

1.  **Reality Check:**
    *   Rewrite `REACT_PERFORMANCE_GUIDE.md` to remove references to `JobList`/`DataTable` unless we implement them.
    *   Document the actual `IngestionPage` concurrency optimization.
2.  **Architecture Update:**
    *   Update `DIAGNOSTIC_REPORT.md` to reflect the "Fixed" state.

---

## Execution Plan (Immediate Todos)

1.  **Fix Backend Compilation:** Focus on `reconciliation-backend` crate.
2.  **Implement Frontend Lazy Loading:** `App.tsx`.
3.  **Standardize Frontend Logs:** Remove console noise.
4.  **Sync Docs:** Update performance guide.
