# Agent C Prompt: UX & Documentation Lead

## Your Role
You are **Agent C - UX & Documentation Lead** for the 378 Reconciliation Platform Tier 4 Analysis.

## Current Status
You need to complete **Cycle 1** by auditing:
- **Pillar 6**: User Experience & API Design
- **Documentation Debt**: Analyze and consolidate 298 documentation files

## Deliverables Required

### 1. CYCLE1_PILLARxd_AUDIT.md
Audit user experience and API design:

**Key Areas:**
- [ ] API response consistency across endpoints
- [ ] RESTful practices compliance
- [ ] Error message standardization (check `services/error_translation.rs`)
- [ ] Frontend optimization effectiveness
- [ ] Perceived performance metrics
- [ ] Bundle optimization results (verify `frontend/vite.config.ts` settings)

**Specific Findings to Investigate:**
1. **API Response Format:**
   - Check if `ApiResponse<T>` struct in `handlers.rs` is consistently used
   - Verify error handling patterns across all handlers
   - Review error translation service implementation

2. **Frontend Optimization:**
   - `frontend/vite.config.ts` has code splitting configured
   - Manual chunks: react-vendor, lotus-vendor, forms-vendor, icons-vendor
   - Verify bundle sizes and loading performance

3. **Error Handling:**
   - `backend/src/services/error_translation.rs` provides user-friendly errors
   - Check if frontend properly consumes these translations
   - Verify error boundaries in React components

4. **Service Discovery:**
   - Recently added services: `critical_alerts`, `error_translation`, `offline_persistence`, `optimistic_ui`
   - Verify they're properly integrated and documented

### 2. DOCUMENTATION_CONSOLIDATION_PLAN.md
Analyze and plan documentation consolidation:

**Key Areas:**
- [ ] Catalog all 298 documentation files
- [ ] Identify duplicates and redundancy
- [ ] Create consolidation plan (298 → 30 files)
- [ ] Map feature documentation to actual implementation
- [ ] Identify critical missing documentation

**Categories to Organize:**
1. **Status/Progress Reports** (~65 files)
   - ALL_TODOS_COMPLETE*.md variations
   - FINAL_*.md variations
   - AGENT_*.md reports
   - COMPREHENSIVE_*.md analyses

2. **Deployment Documentation** (~25 files)
   - Multiple deployment guides with overlapping content
   - Consolidate to 3 files: `START_HERE.md`, `DEPLOYMENT_GUIDE.md`, `QUICK_REFERENCE.md`

3. **TODO/Implementation Lists** (~15 files)
   - MASTER_TODO.md
   - MASTER_TODO_LIST.md
   - IMPLEMENTATION_TODO_LIST Article
   - Multiple conflicting TODO lists

4. **Analysis Reports** (~30 files)
   - Various analysis reports
   - Consolidate findings

**Consolidation Strategy:**
- Keep essential documentation in root
- Archive historical reports to `archive/documentation/`
- Create single source of truth for each category
- Ensure documentation matches actual implementation

**Essential Files to Keep:**
1. README.md - Main project overview
2. PROJECT_STATUS_CONSOLIDATED.md - Current status
3. MASTER_TODO.md - SINGLE source of truth for todos
4. CONTRIBUTING.md - Contribution guidelines
5. DEPLOYMENT_INSTRUCTIONS.md - Deployment guide
6. QUICK_REFERENCE.md - Quick command reference
7. START_HERE.md - Quick start guide
8. ARCHITECTURE_DIAGRAM.md
9. LICENSE
10. Plus ~20 in docs/ directory

## Instructions

1. Use file listing tools to catalog all markdown files
2. Read key documentation files to understand content overlap
3. Create `CYCLE1_PILLAR6_AUDIT.md` with UX findings
4. Create `DOCUMENTATION_CONSOLIDATION_PLAN.md` with detailed consolidation strategy
5. Include specific file lists for deletion/archiving
6. Upload deliverables to workspace root when complete

## Success Criteria
- [ ] Both deliverables created
- [ ] Complete file catalog with categorization
- [ ] Clear archiving/deletion plan
- [ ] Essential documentation identified
- [ ] Implementation gap analysis completed

---

**Focus on creating a maintainable documentation structure that reduces confusion and matches reality.**

