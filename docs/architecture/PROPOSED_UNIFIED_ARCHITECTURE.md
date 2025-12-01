# Proposed Unified Architecture: Rust-First

## Overview
This architecture resolves the "Split Brain" conflict by designating the Rust `reconciliation-backend` as the **Single Source of Truth** for authentication and business logic. The Node.js `auth-server` is deprecated.

## 1. Authentication Flow
*   **Client:** `frontend` (React/Vite)
*   **Protocol:** JWT (Bearer Token)
*   **Provider:** `backend` (Rust)
*   **Endpoints:**
    *   `POST /api/v1/auth/login`
    *   `POST /api/v1/auth/register`
*   **Database:** PostgreSQL (`users` table)

## 2. Infrastructure
*   **Docker:**
    *   `frontend`: Nginx serving static assets.
    *   `backend`: Rust binary (`reconciliation-backend`).
    *   `db`: PostgreSQL.
    *   `redis`: Cache.
    *   *Removed:* `auth-server` container.

## 3. Integration Strategy
1.  **Frontend Config:** `AppConfig.ts` points `API_URL` to the Rust backend.
2.  **API Client:** `apiClient.ts` handles 401 retries via Tier 4 logic.
3.  **Database:** The `better_auth_*` tables in Postgres can remain as legacy artifacts or be used if we ever switch back, but the Rust backend will ignore them in favor of its native `users` logic.

## 4. Frenly AI Integration
*   **Architecture:** Client-Server.
*   **Client:** `FrenlyAIProvider` (Frontend) sends prompts to Backend.
*   **Server:** Rust Backend proxies requests to LLM or `mcp-server`.
*   **Status:** Stubs implemented. Implementation pending backend build fix.

## 5. Benefits
*   **Single Binary:** Easier deployment.
*   **Type Safety:** Rust ensures robust auth logic.
*   **Performance:** No internal network latency between Auth and Data layers.
