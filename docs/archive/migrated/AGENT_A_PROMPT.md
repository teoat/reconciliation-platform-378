# Agent A Prompt: Code & Security Lead

## Your Role
You are **Agent A - Code & Security Lead** for the 378 Reconciliation Platform Tier 4 Analysis.

## Current Status
You need to complete **Cycle 1** by auditing:
- **Pillar 1**: Code & Architectural Integrity  
- **Pillar 3**: Security & Compliance (DevSecOps)
- **Pillar 4**: Testing & Validation

## Deliverables Required

### 1. CYCLE1_PILLAR1_AUDIT.md
Audit code quality in `backend/src/handlers.rs` and related services:

**Key Areas:**
- [ ] SOLID/DRY/KISS compliance
- [ ] Duplicate function: `levenshtein_distance` exists in both `reconciliation.rs` (line 176) and `reconciliation_engine.rs` (line 95)
- [ ] Authorization checks: Verify all handlers using `extract_user_id()` also call authorization functions
- [ ] Code smells and technical debt
- [ ] Module coupling and dependencies

**Specific Findings to Investigate:**
1. In `handlers.rs` line 791-823: `create_reconciliation_job` extracts user_id but **MISSING authorization check** before creating job
2. Confirm whether `check_project_permission()` is called before resource access
3. Review all 17 uses of `extract_user_id()` for missing authorization

### 2. CYCLE1_PILLAR3_AUDIT.md
Audit security implementation:

**Key Areas:**
- [ ] OWASP Top 10 vulnerabilities
- [ ] Secrets management: AWS Secrets Manager vs fallbacks
- [ ] Hardcoded secrets: `DefaultSecretsManager::get_jwt_secret()` has fallback "change-this-secret-key-in-production"
- [ ] Authentication/authorization thoroughness
- [ ] Rate limiting effectiveness
- [ ] Security headers
- [ ] PII/GDPR compliance

**Specific Findings to Investigate:**
1. `backend/src/services/secrets.rs` line 100-102: Hardcoded JWT secret fallback
2. `backend/src/config/billing_config.rs` lines 15-29: Stripe secrets with empty fallbacks
3. Check if AWS Secrets Manager is actually used in production code paths
4. Verify rate limiting middleware is applied to all sensitive endpoints

### 3. CYCLE1_PILLAR4_AUDIT.md
Audit testing implementation:

**Key Areas:**
- [ ] Test coverage discrepancy (claims 80% vs 100%)
- [ ] Execute test suite and report actual results
- [ ] Verify test infrastructure exists and works
- [ ] Error handling in tests
- [ ] Logging quality

**Specific Findings to Investigate:**
1. Test files exist: `integration_tests.rs` (976 lines), `unit_tests.rs`, `e2e_tests.rs`
2. Documentation claims 100% coverage but need verification
3. Run actual tests and report pass/fail rates

## Instructions

1. Read all relevant source files
2. Create each deliverable markdown file
3. Format: Markdown with clear sections for each finding
4. Include specific line references and code snippets
5. Categorize findings by severity (Critical, High, Medium, Low)
6. Upload deliverables to workspace root when complete

## Success Criteria
- [ ] All 3 audit documents created
- [ ] Each finding includes file path, line number, severity
- [ ] Specific code references provided
- [ ] Actionable recommendations included

---

**Start with reading the key files and creating CYCLE1_PILLAR1_AUDIT.md first.**

