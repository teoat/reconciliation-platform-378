# Repository Optimization Proposal

## 1. Directory Structure Consolidation
**Problem:** Redundant source directories and scattered configuration files.
*   **Redundancy:** `backend/` vs `reconciliation-rust/`. The latter appears to be a duplicate or legacy root. `backend/` contains the active `src` and `Cargo.toml`.
*   **Recommendation:** Archive or delete `reconciliation-rust/`. Move any unique logic (if any) to `backend/`.
*   **Cleanup:** `backend/src/handlers/handlers_modules_backup/` should be deleted. Version control (Git) is for history; the codebase should reflect the current state.
*   **Validation:** `backend/src/services/validation_old.rs` implies a refactor was started but not finished. Audit and remove if unused.

## 2. Configuration Simplification
**Problem:** Multiple overlapping configuration files creating ambiguity.
*   **Docker:** `docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.simple.yml`, `docker-compose.frontend.vite.yml`.
*   **Recommendation:** Consolidate into `docker-compose.yml` (dev) and `docker-compose.prod.yml` (prod). Use `overrides` if necessary, but reduce the root-level file count.
*   **Scripts:** Root directory is littered with `.sh`, `.ps1`, and `.bat` scripts (`deploy.sh`, `start-app.ps1`, `fix-frontend-imports.sh`).
*   **Recommendation:** Move all operational scripts to a `scripts/` directory. Create a unified `Makefile` or `Justfile` as the entry point for common tasks (e.g., `make deploy`, `make fix-imports`).

## 3. Dead Code Removal
**Problem:** The repository contains numerous "audit reports", "completion status" files, and "plans" from previous AI interactions.
*   **Files:** `AGENT_1_COMPLETE.md`, `AGENT_5_...md`, `ALL_ERRORS_FIXED.md`, `backend/handlers_modules_backup`.
*   **Recommendation:**
    1.  **Documentation:** Move relevant architectural docs (`FRENLY_AI_ARCHITECTURE_DIAGRAM.md`, `DEPLOYMENT_GUIDE.md`) to `docs/`.
    2.  **Status Files:** Delete all `*_COMPLETE.md`, `*_STATUS.md`, and temporary AI artifacts. They add noise and confusion for human developers.
    3.  **Legacy Code:** Remove `frontend/src/services/apiClient.ts` (deprecated legacy client) after confirming `apiClient/index.ts` is the sole SSOT.

## 4. Dependency & Build Optimization
**Problem:** Root `package.json` vs `frontend/package.json`.
*   **Conflict:** Root `package.json` suggests a Next.js app, while `frontend/package.json` is a Vite app. This split brain configuration confuses build tools and developers.
*   **Recommendation:** If the root Next.js app is dead, delete `package.json`, `next.config.js`, and related files from the root. Make `frontend/` the true frontend root.

## 5. Best Practices Enforcement
**Problem:** Inconsistent linting and formatting.
*   **Tooling:** Ensure `husky` (pre-commit hooks) enforces `cargo fmt`, `cargo clippy`, and `eslint` before commits.
*   **CI/CD:** Define a clear Github Actions workflow (currently implied but not audited) to run these checks automatically.

---
**Action Plan:**
1.  **Immediate:** Delete `reconciliation-rust/` and `backend/handlers_modules_backup/`.
2.  **Short-term:** Move scripts to `scripts/` and docs to `docs/`.
3.  **Strategic:** Decide on Frontend framework (Vite vs Next) and delete the unused configuration.
