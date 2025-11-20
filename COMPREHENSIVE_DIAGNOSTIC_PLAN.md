# Comprehensive Diagnostic & Investigation Plan

## 1. Frontend Architecture & State Management
**Focus:** Scalability, Maintainability, and Data Flow.
*   **State Management:** Audit `frontend/src/store` (Redux) to ensure it's used for *global* state (User, Auth, Notifications) vs. local state (Form inputs). Check for unnecessary re-renders or prop drilling.
*   **Component Structure:** Review `frontend/src/components` for reusability. specific focus on the "Design System" folder to ensure consistency.
*   **Data Fetching:** Evaluate `frontend/src/services/apiClient` integration with React Query (if used) or Redux Thunks. Look for race conditions, caching strategies, and error boundary integration.

## 2. Backend Business Logic & Integrity
**Focus:** Correctness, Error Handling, and Data Consistency.
*   **Reconciliation Engine:** Deep dive into `backend/src/services/reconciliation/matching.rs` and `processing.rs`. Verify the matching algorithms (Exact vs. Fuzzy) and edge case handling (null values, currency mismatch).
*   **Error Handling:** Review `backend/ERROR_HANDLING_GUIDE.md` implementation. Ensure all routes return structured, machine-readable errors (Problem Details RFC 7807).
*   **Type Safety:** Address the `Option<T>` vs `T` mismatches identified in the initial audit. Ensure the logic layer robustly handles database nulls.

## 3. Database Schema & Performance
**Focus:** Efficiency, Integrity, and Scalability.
*   **Migrations:** Locate the missing `migrations` directory (referenced in `backend/diesel.toml` but not found in `backend/migrations`). This is a **CRITICAL** investigation point.
*   **Indexing:** Review `backend/src/models` and any SQL files for index definitions on high-cardinality columns (e.g., `external_id`, `email`, `transaction_date`).
*   **Connection Pooling:** Verify `deadpool` or `r2d2` configuration in `backend/src/database` to ensure it handles load spikes gracefully.

## 4. Security & Compliance
**Focus:** Data Protection, Access Control, and Auditability.
*   **PII Handling:** Verify `PiiMasker` implementation in `backend/src/monitoring/metrics.rs` is applied to *all* logs, especially in the reconciliation service which handles financial data.
*   **Access Control:** Audit `backend/src/services/auth` for Role-Based Access Control (RBAC) checks on sensitive routes (e.g., `admin` only for User Management).
*   **Audit Logging:** Ensure `audit_logs` table is populated for all state-changing operations (Create, Update, Delete).

## 5. Infrastructure & Observability
**Focus:** Reliability, Monitoring, and Deployment.
*   **Health Checks:** Verify `backend/src/handlers/health.rs` checks *dependencies* (DB, Redis) not just service uptime.
*   **Metrics:** Review Prometheus metric collection (`backend/src/monitoring/metrics.rs`) to ensure it covers business metrics (Reconciliation Success Rate, Job Duration) in addition to system metrics.
*   **CI/CD:** Propose a pipeline for automated testing (Unit, Integration, E2E) and artifact versioning.

## Execution Roadmap
1.  **Phase 1 (Discovery):** Locate migrations, map data flow, audit security.
2.  **Phase 2 (Analysis):** Run static analysis (clippy, eslint), review logic.
3.  **Phase 3 (Reporting):** Produce a detailed "State of the Union" report with remediation tasks.
