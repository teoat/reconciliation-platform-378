# Project Roadmap: Path to a Complete Working App

This roadmap outlines the phases and specific tasks required to transform the current codebase into a fully functional, production-ready Reconciliation Platform.

## Phase 1: Foundation & Stabilization (The "Build" Phase)
**Objective:** Get the backend compiling, the database migrating, and the basic tests passing.

### 1.1 Backend Compilation & Type Safety
- [ ] **Fix Diesel Models:** Align `backend/src/models/*.rs` structs with the new `schema.rs` and `up.sql`. Ensure strict type correspondence (e.g., `Option<T>` vs `T`).
- [ ] **Resolve Trait Bounds:** Implement `std::fmt::Display` for all error types (`AppError`, `DatabaseErrorKind`) to satisfy Actix/Log requirements.
- [ ] **Fix Handler Signatures:** Update `auth.rs` and `reconciliation.rs` handlers to match the updated model types.
- [ ] **Verify Compilation:** Achieve `cargo check` with 0 errors.

### 1.2 Database Integrity
- [ ] **Migration Verification:** Run `diesel migration run` against a local Postgres instance to verify `up.sql` is valid.
- [ ] **Seeding:** Create a `seeds.sql` or Rust seeder to populate initial roles (`admin`, `user`) and a test admin account.

### 1.3 Testing Infrastructure
- [ ] **Fix Test Suite:** Refactor `backend/tests/auth_handler_tests.rs` to use the new `App` factory and database connection pool.
- [ ] **Unit Tests:** Write unit tests for `ExactMatchingAlgorithm` and `FuzzyMatchingAlgorithm` covering edge cases (empty strings, unicode).

## Phase 2: Core Functionality (The "Logic" Phase)
**Objective:** Implement the actual business logic for data ingestion and reconciliation.

### 2.1 Data Ingestion
- [ ] **File Parsing:** Implement `FileService` to parse uploaded CSV/Excel files.
    - [ ] Validation: Check headers match expected schema.
    - [ ] Streaming: Use streaming parsers (e.g., `csv` crate) to handle large files without OOM.
- [ ] **Data Normalization:** Convert various date formats and currency strings into standard types (`NaiveDate`, `Decimal`) during ingestion.

### 2.2 Reconciliation Engine
- [ ] **Advanced Matching:** Enhance `processing.rs` to support:
    - [ ] Blocking: Only compare records within a specific date range or same currency to reduce $O(N^2)$ complexity.
    - [ ] Weighted Scoring: Allow users to define weights for different fields (e.g., Amount: 50%, Date: 30%, Desc: 20%).
- [ ] **Job Management:** Implement `pause`, `resume`, and `cancel` for long-running reconciliation jobs.

### 2.3 Authentication & RBAC
- [ ] **Middleware:** Enforce `AuthMiddleware` on all `/api/v1/*` routes (except `/auth/*`).
- [ ] **Permission Check:** Implement `require_permission("project:write")` guards in handlers.

## Phase 3: Frontend Integration (The "User" Phase)
**Objective:** Connect the React frontend to the working backend and polish the UX.

### 3.1 API Client Integration
- [ ] **Endpoint Sync:** Update `frontend/src/services/apiClient` to match the finalized backend types (from Phase 1.1).
- [ ] **Error Handling:** Implement a global Error Boundary and Toast notification system for API failures (4xx/5xx).

### 3.2 Core Flows
- [ ] **Upload Flow:** Build a multi-step wizard for File Upload -> Column Mapping -> Validation Preview.
- [ ] **Reconciliation Dashboard:** Create a view to visualize Job Progress (ProgressBar) and Results (Data Grid with diff highlighting).
- [ ] **Manual Match:** Interface for users to manually link unmatched records or break incorrect auto-matches.

### 3.3 State Management
- [ ] **Redux Optimization:** Ensure `reconciliationRecords` slice handles pagination correctly to avoid bloating client memory.

## Phase 4: Production Readiness (The "Scale" Phase)
**Objective:** Prepare the application for deployment to Kubernetes.

### 4.1 Optimization
- [ ] **Docker Builds:** Implement multi-stage builds with `cargo-chef` for faster caching of Rust dependencies.
- [ ] **Frontend Bundle:** configure `vite` to split chunks effectively (vendor vs app code).

### 4.2 Observability
- [ ] **Logging:** Ensure all backend logs are structured (JSON) and include `trace_id`.
- [ ] **Metrics:** Dashboard for "Records Reconciled/Sec", "Error Rate", and "Latency".

### 4.3 CI/CD
- [ ] **Pipeline:** GitHub Actions workflow for:
    - [ ] Lint (fmt/clippy/eslint).
    - [ ] Test (cargo test / vitest).
    - [ ] Build & Push Docker Images.

---
**Immediate Next Step:** Begin Phase 1.1 (Fix Backend Compilation).
