# Synchronization Report & Conflict Analysis
**Date:** 2025-05-23
**Status:** ⚠️ SIGNIFICANT DIVERGENCE

## Executive Summary
There is a critical divergence between the documentation (which describes a complete, integrated system) and the codebase (which contains isolated, partly broken components). The most significant conflict is the "Dual Auth" architecture: a Node.js `auth-server` vs. a Rust-based `AuthService`.

## 1. Documentation vs. Reality Gap Analysis

| Feature Area | Documentation Claims | Codebase Reality | Status |
| :--- | :--- | :--- | :--- |
| **Authentication** | Claims "Better Auth" (Node.js) is the SSOT for auth, but also references Rust backend auth handlers. | Both exist. `auth-server` (Hono/BetterAuth) is a standalone app. `backend` (Rust) has a full `AuthService` with JWT/Password logic. | 🔴 **CONFLICT** |
| **Frenly AI** | Describes a "Meta Agent" ecosystem, `FrenlyProvider`, and `FrenlyGuidanceAgent`. | Components are missing from `frontend/src`. Code was likely deleted or never merged, despite extensive docs. | 🔴 **MISSING** |
| **Tier 4 Error Handling** | Describes advanced error recovery, patterns, and tracking. | **Fixed (Recent):** I implemented the orchestration, but original docs were aspirational. Now code matches (or exceeds) docs. | ✅ **SYNCED** |
| **Frontend Architecture** | Claims Next.js (root) and Vite (frontend/). | Root `package.json` suggests Next.js, but `frontend/` is clearly a Vite app. Root is legacy/dead code. | ⚠️ **CONFUSING** |
| **Backend Modules** | Describes `backup_recovery`, `cache_warming`. | These were missing until I stubbed them to fix the build. They contain no logic. | ⚠️ **STUBBED** |

## 2. The Auth Conflict: Node.js vs. Rust
**The Problem:**
The project suffers from "Split Brain" authentication.
1.  `auth-server/`: A modern Hono + Better Auth implementation. It seems to be the *intended* future state (docs call it SSOT).
2.  `backend/src/services/auth/`: A robust Rust implementation (Argon2, JWT, Permissions). This is likely the *legacy* or *original* state that was never fully deprecated.

**Risk:**
Running both creates confusion for:
-   **Database:** Do they share the `users` table? (Likely yes, via Postgres).
-   **Tokens:** Can the Rust backend validate tokens issued by the Node auth server? (Requires shared JWT secret).
-   **Frontend:** Which endpoint does `apiClient` talk to? (Currently defaults to `api/v1` which usually points to the Rust backend).

## 3. The Frenly AI Gap
**The Problem:**
Documentation is extremely detailed (architecture diagrams, file paths), but the files simply do not exist in the repo.
*   *Theory:* This feature was developed in a separate branch or repo and the documentation was merged without the code.

## 4. Optimization & Better Implementation Proposal

### A. Authentication Consolidation (The "Better Implementation")
**Recommendation:** **Adopt the Rust Backend as the SSOT for Authentication.**
*   *Why?* The main application logic is in Rust (`reconciliation-backend`). Keeping auth in the same process reduces latency, complexity (no sidecar Node app needed), and deployment overhead.
*   *Action:*
    1.  Deprecate/Archive `auth-server`.
    2.  Ensure Rust `AuthService` matches the "Better Auth" feature set (if needed).
    3.  Update docs to remove "Better Auth Node Server" references.

### B. Frenly AI Restoration (The "Optimization")
**Recommendation:** **Re-scaffold from Specs.**
*   Since code is lost but specs are detailed, we can re-implement the "Interface" first (Provider, Components) to stop build errors, then implement the "Brain" (Agents) later.

### C. Documentation Cleanup
**Recommendation:** **Prune Legacy Docs.**
*   Delete root-level Next.js files.
*   Mark `auth-server` docs as [DEPRECATED].
*   Update `SSOT_LOCK.yml` to explicitly ban `auth-server` usage in favor of `backend/src/services/auth`.

## 5. Next Steps
1.  **Refactor:** Explicitly point `frontend/src/config/AppConfig.ts` to the Rust backend for auth.
2.  **Docs:** Update `SSOT_LOCK.yml` to resolve the Auth conflict.
3.  **Cleanup:** Remove the `auth-server` from the "active" mental model of the developer.
