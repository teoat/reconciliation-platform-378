# Optimization & Consolidation Plan

## 1. Authentication Consolidation (Winner: Rust Backend)
**Strategy:** Consolidate all authentication logic into the Rust `reconciliation-backend`.
**Rationale:** The core business logic resides in Rust. Running a separate Node.js `auth-server` introduces unnecessary operational complexity (sidecar pattern), network latency, and synchronization issues (shared JWT secrets).

**Implementation Steps:**
1.  **Update SSOT:** Modify `SSOT_LOCK.yml` to designate `backend/src/services/auth` as the *only* valid auth source.
2.  **Deprecate Node Server:** Mark `auth-server/` as deprecated in documentation.
3.  **Frontend Config:** Ensure `frontend/src/config/AppConfig.ts` points `API_ENDPOINTS.AUTH` to the Rust backend (`/api/v1/auth`).

## 2. Frontend "Dead Code" Cleanup
**Strategy:** Remove references to missing AI components to fix builds, then re-introduce them as features.
**Rationale:** The "Frenly" AI components are referenced in `bundleOptimization.ts` but do not exist, causing confusion and build warnings.

**Implementation Steps:**
1.  **Clean:** Remove `Frenly` references from `frontend/src/utils/bundleOptimization.ts`.
2.  **Stub:** Create placeholder components for `FrenlyAI` if UI requires them to prevent runtime crashes.

## 3. Tier 4 Error Handling (Official Adoption)
**Strategy:** formally adopt the orchestration I implemented as the standard.
**Rationale:** The documentation was aspirational. The code I wrote (`apiClient.ts` + `Tier4ErrorBoundary`) makes it real.

**Implementation Steps:**
1.  **Update Docs:** Update `docs/features/tier4-error-handling-implementation.md` to point to the new files (`services/requestManager.ts`, etc.) as the reference implementation.

## 4. Documentation Synchronization
**Strategy:** align `docs/` with the actual codebase state.
**Rationale:** Documentation that describes non-existent features (Frenly) or conflicting architectures (Dual Auth) harms developer velocity.

**Implementation Steps:**
1.  **Flag:** Add warning banners to `docs/features/frenly-ai/*.md` stating "Feature currently missing from codebase".
2.  **Flag:** Add warning to `docs/architecture/authentication/*.md` stating "Node.js Auth Server is deprecated".
