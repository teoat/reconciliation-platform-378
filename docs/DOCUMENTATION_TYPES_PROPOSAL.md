# Documentation Types Simplification Proposal

**Date**: January 2025  
**Purpose**: Simplify agent-generated documentation types and formats

---

## Current Problem

Agents create many overlapping document types:
- **PLANS** (11 files): Implementation plans, execution plans, integration plans
- **SUMMARIES** (15 files): Completion summaries, analysis summaries, fix summaries
- **COMPLETE/COMPLETED** (18 files): Implementation complete, setup complete, fixes complete
- **STATUS** (6 files): Implementation status, completion status, final status
- **REPORTS** (22 files): Diagnostic reports, audit reports, investigation reports
- **PROPOSALS** (6 files): Next steps proposals, organization proposals

**Issues:**
- Unclear distinction between types
- Redundant information across types
- Hard to find current state
- Too many temporary files

---

## Proposed Solution: Three-Type System ⭐

**Simplified to only 3 document types:**

### 1. PLAN - Future Work
- **Format**: `[FEATURE]_PLAN.md`
- **Purpose**: Document work to be done
- **Status**: `Draft | Approved | In Progress | Cancelled`
- **Location**: Root or `docs/plans/` (active), `docs/archive/plans/` (archived)
- **Lifecycle**: Created when planning → Updated during planning → Becomes STATUS when work starts

### 2. STATUS - Current Work
- **Format**: `[FEATURE]_STATUS.md` or use `docs/project-management/PROJECT_STATUS.md`
- **Purpose**: Document current state of active work
- **Status**: `Active | Blocked | Completed | Deprecated`
- **Location**: `docs/project-management/PROJECT_STATUS.md` (overall) or `docs/features/[feature]/STATUS.md` (feature-specific)
- **Lifecycle**: Created when work starts → Updated regularly → Archived when complete

### 3. ARCHIVE - Historical Work
- **Format**: Original name or `[FEATURE]_[DATE].md`
- **Purpose**: Store completed/historical documentation
- **Status**: `Archived`
- **Location**: `docs/archive/[category]/[date]/`
- **Lifecycle**: Created when work completes → Organized by category/date → Retained for reference

### 4. GUIDE - Permanent Reference
- **Format**: `[TOPIC]_GUIDE.md` or `[topic]-guide.md`
- **Purpose**: Permanent reference documentation
- **Status**: `Active | Deprecated`
- **Location**: Appropriate category directory (`docs/api/`, `docs/deployment/`, etc.)
- **Lifecycle**: Created once → Updated in place → Never archived (only deprecated)

---

## Document Type Templates

### PLAN Template
```markdown
# [Feature Name] Plan

**Status**: Draft | Approved | In Progress | Cancelled
**Created**: [Date]
**Target Completion**: [Date]
**Owner**: [Person/Team]

## Overview
Brief description of what will be done

## Goals
- Primary goal 1
- Primary goal 2

## Tasks
- [ ] Task 1
- [ ] Task 2

## Timeline
- Week 1: Task 1
- Week 2: Task 2

## Dependencies
- Dependency 1

## Success Criteria
- Criterion 1
```

### STATUS Template
```markdown
# [Feature Name] Status

**Status**: Active | Blocked | Completed | Deprecated
**Last Updated**: [Date]
**Owner**: [Person/Team]

## Current State
Brief description of where things stand

## Progress
- ✅ Completed: [items]
- 🔄 In Progress: [items]
- ⏸️ Blocked: [items]
- 📋 Pending: [items]

## Blockers
- [Blocker description]

## Next Steps
- [Next action item]
```

---

## Migration Rules

### Consolidation Rules

1. **PLAN + STATUS + COMPLETE** → Single STATUS file
   - Merge all into one STATUS file
   - Archive old files

2. **SUMMARY + COMPLETE** → ARCHIVE
   - Move to `docs/archive/completion-reports/`
   - Keep only most recent summary

3. **REPORT** → ARCHIVE
   - Move to `docs/archive/reports/` or `docs/archive/diagnostics/`
   - Keep comprehensive audits, archive routine reports

4. **PROPOSAL** → PLAN or ARCHIVE
   - If approved → becomes PLAN
   - If rejected → ARCHIVE

### Naming Examples

**Before:**
- `PASSWORD_MANAGER_IMPLEMENTATION_PLAN.md`
- `PASSWORD_MANAGER_IMPLEMENTATION_STATUS.md`
- `PASSWORD_MANAGER_IMPLEMENTATION_COMPLETE.md`
- `PASSWORD_MANAGER_IMPLEMENTATION_SUMMARY.md`

**After:**
- `PASSWORD_MANAGER_PLAN.md` (if planning)
- `PASSWORD_MANAGER_STATUS.md` (if active)
- `docs/archive/features/password-manager/2025-01-complete.md` (if done)

---

## Benefits

1. **Clarity**: Clear distinction between planning, active, and completed work
2. **Simplicity**: Only 3-4 types to remember
3. **Consistency**: Standardized formats and locations
4. **Maintainability**: Easier to find current state
5. **Reduced Clutter**: Fewer temporary files

---

## Implementation

See [Documentation Rules](.cursor/rules/documentation.mdc) for agent instructions.

**Key Rules:**
- ✅ Use PLAN for future work
- ✅ Use STATUS for active work (prefer single PROJECT_STATUS.md)
- ✅ Use ARCHIVE for completed work
- ✅ Use GUIDE for permanent reference docs
- ❌ Don't create COMPLETE, SUMMARY, REPORT, PROPOSAL files
- ❌ Don't create multiple status files for same feature
