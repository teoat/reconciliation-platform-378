# Deep Dive Proposals & Roadmap

Following the initial audit, the following areas have been identified as critical deep-dive targets to ensure the stability, security, and production-readiness of the Reconciliation Platform.

## 1. Immediate Remediation: Backend Compilation & Data Integrity
**Priority: BLOCKING**

The backend codebase currently fails to compile (`cargo check` detected 1154 errors). This suggests a massive drift between the Database Models (`backend/src/models`), Migrations, and the Business Logic (Handlers).

*   **Investigation Target:** `backend/src/models/mod.rs` vs `backend/src/handlers/*.rs`.
*   **Specific Actions:**
    1.  **Schema Audit:** Compare `diesel` (or `sqlx`) migrations with Rust structs. The errors indicate `Option<T>` mismatches (e.g., `updated_at` is nullable in struct but logic assumes `DateTime<Utc>`).
    2.  **Type Unification:** Refactor `User` and `Project` structs to exactly match the database schema.
    3.  **Trait Implementation:** Many errors relate to missing `Display` traits for error types. Implement `std::fmt::Display` for `DatabaseErrorKind` and `AppError`.
    4.  **Handler Repair:** Fix logic in `auth.rs` and `reconciliation/processing.rs` where `Option` unwrapping is missing or incorrect.

## 2. Stability & Resilience: Test Strategy
**Priority: HIGH**

The test suite exists (`backend/tests`) but may not be running against the current broken code.

*   **Investigation Target:** `backend/tests/auth_handler_tests.rs`.
*   **Specific Actions:**
    1.  **Fix Test Compilation:** The tests likely fail to compile for the same reasons as the main code. Fixes must extend to test helpers (`setup_test_database`).
    2.  **Integration Test coverage:** Ensure `reconciliation_integration_tests.rs` covers the critical path (File Upload -> Ingestion -> Matching).
    3.  **Frontend Testing:** `frontend/src/__tests__` (Vitest) should be audited to ensure it mocks the *new* API structure (`/api/v1`) and doesn't rely on deprecated client logic.

## 3. Security Hardening: Auth & Secrets
**Priority: HIGH**

While basic security exists (Rate Limiting, CSRF), the implementation has gaps.

*   **Investigation Target:** `frontend/src/services/authSecurity.ts`, `backend/src/services/security_monitor.rs`.
*   **Specific Actions:**
    1.  **CSRF Implementation:** The frontend `CSRFManager` fetches a token from `/api/csrf-token`. Verify if this endpoint exists and works in the backend (it was not visible in the `mod.rs` route list).
    2.  **Secret Rotation:** Replace hardcoded `JWT_SECRET` in `.env` and `k8s` manifests with a vault solution (e.g., HashiCorp Vault or AWS Secrets Manager sidecar).
    3.  **OAuth Hardening:** Review `google_oauth` handler in `auth.rs` to ensure proper validation of `aud` (Audience) claims to prevent token substitution attacks.

## 4. Performance Optimization: Bundle & Database
**Priority: MEDIUM**

*   **Investigation Target:** `frontend/vite.config.ts`, `backend/src/services/performance`.
*   **Specific Actions:**
    1.  **Frontend Bundle Splitting:** Validate that the manual chunks configuration in `vite.config.ts` actually reduces initial load time. Run `npm run build:analyze`.
    2.  **Query Optimization:** The `QueryOptimizer` in `main.rs` claims to "optimize queries" on startup. Verify this isn't just a placebo log. Check if it creates actual DB indexes (`CREATE INDEX IF NOT EXISTS`).

## 5. DevOps Pipeline: CI/CD & Monitoring
**Priority: MEDIUM**

*   **Investigation Target:** `.github/workflows` (if available), `infrastructure/docker`.
*   **Specific Actions:**
    1.  **Fix Base Images:** Switch `Dockerfile` from non-existent versions (`node:25`, `rust:1.91`) to LTS versions (`node:20`, `rust:1.75+`).
    2.  **Runtime Config:** Implement the recommended entrypoint script for Nginx to inject `VITE_API_URL` at runtime, making the Docker image truly "build once, deploy anywhere".

---
**Recommendation:** Start immediately with **Phase 1 (Backend Remediation)**. The platform cannot run until the Rust compiler is satisfied.
