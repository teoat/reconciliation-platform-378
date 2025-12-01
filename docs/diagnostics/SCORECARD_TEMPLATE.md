# Comprehensive System Scorecard Template

## Scoring Methodology
Scores are assigned on a 0-100 scale based on the following criteria:
- **90-100 (Excellent):** Production-ready, fully automated, self-healing.
- **70-89 (Good):** Functional, minor debt, requires manual intervention occasionally.
- **50-69 (Fair):** Functional but fragile, significant debt, gaps in coverage.
- **30-49 (Poor):** Frequent failures, major architectural flaws, "happy path" only.
- **0-29 (Critical):** Broken build, missing core components, insecure.

## 1. Frontend Pillar
**Score: [SCORE]/100**
*   **Build Stability:** Does `npm run build` pass?
*   **Code Quality:** Linting errors, type safety (TypeScript strictness).
*   **Test Coverage:** Unit test pass rate and coverage.
*   **Architecture:** Component modularity, SSOT usage.

## 2. Backend Pillar
**Score: [SCORE]/100**
*   **Build Stability:** Does `cargo check` pass?
*   **Architecture:** Module separation, dependency graph.
*   **Database:** Schema integrity, migration status.
*   **Performance:** Potential bottlenecks (async usage, N+1 queries).

## 3. Infrastructure Pillar
**Score: [SCORE]/100**
*   **Containerization:** Dockerfile validity, optimization.
*   **Orchestration:** K8s/Docker Compose consistency.
*   **IaC:** Terraform/Config management.

## 4. Security Pillar
**Score: [SCORE]/100**
*   **Authentication:** Robustness of auth flow (Split Brain penalty).
*   **Secrets:** Management of env vars, hardcoded secrets.
*   **Dependencies:** Vulnerability exposure.

## 5. Documentation Pillar
**Score: [SCORE]/100**
*   **Accuracy:** Does code match docs? (Hallucination penalty).
*   **Completeness:** Are key flows documented?
*   **Organization:** Is information findable?

---
**OVERALL SYSTEM HEALTH SCORE: [AVG]/100**
