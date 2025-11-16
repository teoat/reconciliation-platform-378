# Cursor Rules Index

**Last Updated**: January 2025  
**Purpose**: Quick reference guide to all Cursor IDE rules

---

## 📚 Rule Files Overview

### Core Rules

#### [cursor_rules.mdc](.cursor/rules/cursor_rules.mdc)
**Purpose**: Meta-rules for creating and maintaining Cursor rules  
**Applies to**: `.cursor/rules/*.mdc`  
**Key Topics**: Rule structure, file references, code examples, formatting guidelines

#### [self_improve.mdc](.cursor/rules/self_improve.mdc)
**Purpose**: Guidelines for continuously improving rules based on code patterns  
**Applies to**: All files  
**Key Topics**: Rule improvement triggers, pattern recognition, continuous improvement

---

### Language-Specific Rules

#### [rust_patterns.mdc](.cursor/rules/rust_patterns.mdc)
**Purpose**: Rust-specific coding patterns for backend  
**Applies to**: `backend/**/*.rs`  
**Key Topics**: Error handling, database operations, async patterns, logging, middleware, type safety, performance

#### [typescript_patterns.mdc](.cursor/rules/typescript_patterns.mdc)
**Purpose**: TypeScript and React patterns for frontend  
**Applies to**: `frontend/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `pages/**/*.{ts,tsx}`  
**Key Topics**: Type safety, state management, component structure, styling, error handling, performance, security

---

### Cross-Cutting Concerns

#### [security.mdc](.cursor/rules/security.mdc)
**Purpose**: Security best practices and patterns  
**Applies to**: `**/*.{rs,ts,tsx,js}`  
**Key Topics**: Input validation, authentication, authorization, XSS/SQL injection prevention, secrets management, error handling, logging security

#### [testing.mdc](.cursor/rules/testing.mdc)
**Purpose**: Testing patterns for Rust and TypeScript/React  
**Applies to**: `**/*test*.{rs,ts,tsx}`, `**/__tests__/**/*`, `**/*.spec.{ts,tsx}`  
**Key Topics**: Test organization, unit/integration/E2E tests, mocking, test data, coverage, performance testing, security testing

#### [performance.mdc](.cursor/rules/performance.mdc)
**Purpose**: Performance optimization patterns  
**Applies to**: `**/*.{rs,ts,tsx}`  
**Key Topics**: Database optimization, caching, frontend performance, API optimization, monitoring, profiling

---

### Workflow & Process Rules

#### [git_workflow.mdc](.cursor/rules/git_workflow.mdc)
**Purpose**: Git workflow, branching, and commit conventions  
**Applies to**: All files  
**Key Topics**: Branch naming, commit messages, merge strategies, PR guidelines, tagging releases

#### [code_review.mdc](.cursor/rules/code_review.mdc)
**Purpose**: Code review guidelines and best practices  
**Applies to**: All files  
**Key Topics**: Review checklist, approval criteria, review process, common issues, PR guidelines

#### [api_design.mdc](.cursor/rules/api_design.mdc)
**Purpose**: API design patterns and REST conventions  
**Applies to**: `backend/**/*.rs`, `frontend/**/*.{ts,tsx}`  
**Key Topics**: RESTful conventions, endpoint naming, HTTP status codes, error responses, authentication, versioning, rate limiting

---

### Organization Rules

#### [code_organization.mdc](.cursor/rules/code_organization.mdc)
**Purpose**: Code organization principles and SSOT patterns  
**Applies to**: All files  
**Key Topics**: SSOT principles, directory structure, file naming, module boundaries, code duplication prevention

#### [documentation.mdc](.cursor/rules/documentation.mdc)
**Purpose**: Documentation standards and guidelines  
**Applies to**: `docs/**/*.md`, `**/*.md`  
**Key Topics**: Documentation structure, file naming, content guidelines, consolidation rules, maintenance

#### [consolidation.mdc](.cursor/rules/consolidation.mdc)
**Purpose**: Script and documentation consolidation patterns  
**Applies to**: `scripts/**/*.sh`, `docs/**/*.md`  
**Key Topics**: Shared function library, script consolidation, documentation archiving, preventing duplication

---

## 🗺️ Quick Reference Map

### By Task

**Starting a new feature?**
→ [git_workflow.mdc](.cursor/rules/git_workflow.mdc) → [code_organization.mdc](.cursor/rules/code_organization.mdc) → [rust_patterns.mdc](.cursor/rules/rust_patterns.mdc) or [typescript_patterns.mdc](.cursor/rules/typescript_patterns.mdc)

**Writing API endpoints?**
→ [api_design.mdc](.cursor/rules/api_design.mdc) → [security.mdc](.cursor/rules/security.mdc) → [testing.mdc](.cursor/rules/testing.mdc)

**Optimizing performance?**
→ [performance.mdc](.cursor/rules/performance.mdc) → [testing.mdc](.cursor/rules/testing.mdc)

**Reviewing code?**
→ [code_review.mdc](.cursor/rules/code_review.mdc) → [security.mdc](.cursor/rules/security.mdc) → [testing.mdc](.cursor/rules/testing.mdc)

**Writing tests?**
→ [testing.mdc](.cursor/rules/testing.mdc) → [rust_patterns.mdc](.cursor/rules/rust_patterns.mdc) or [typescript_patterns.mdc](.cursor/rules/typescript_patterns.mdc)

**Security concerns?**
→ [security.mdc](.cursor/rules/security.mdc) → [api_design.mdc](.cursor/rules/api_design.mdc)

---

## 📊 Rule Statistics

- **Total Rule Files**: 13
- **Core Rules**: 2
- **Language-Specific**: 2
- **Cross-Cutting**: 3
- **Workflow/Process**: 3
- **Organization**: 3

---

## 🔗 Cross-References

### Security References
- Referenced in: `rust_patterns.mdc`, `typescript_patterns.mdc`, `api_design.mdc`, `code_review.mdc`

### Testing References
- Referenced in: `rust_patterns.mdc`, `typescript_patterns.mdc`, `performance.mdc`, `code_review.mdc`

### Code Organization References
- Referenced in: `typescript_patterns.mdc`, `documentation.mdc`, `consolidation.mdc`

### Git Workflow References
- Referenced in: `code_review.mdc`

---

## 📝 Rule Maintenance

### When to Update Rules
- New patterns emerge in codebase (3+ occurrences)
- Common bugs could be prevented
- Code reviews repeatedly mention same feedback
- New security or performance patterns emerge

### How to Update
1. Identify pattern or issue
2. Check existing rules for coverage
3. Update relevant rule file or create new one
4. Update this index if adding new rule
5. Cross-reference from related rules

### Rule Review Schedule
- **Quarterly**: Review all rules for relevance
- **After Major Refactors**: Update rules to match new patterns
- **When Issues Arise**: Update rules to prevent recurrence

---

## 🎯 Rule Priorities

### High Priority (Always Follow)
- `security.mdc` - Security vulnerabilities are critical
- `git_workflow.mdc` - Required for protected branches
- `code_organization.mdc` - Prevents duplication and confusion

### Medium Priority (Important for Quality)
- `testing.mdc` - Ensures code quality
- `api_design.mdc` - API consistency
- `code_review.mdc` - Review quality

### Low Priority (Best Practices)
- `performance.mdc` - Optimization guidelines
- `documentation.mdc` - Documentation standards
- `consolidation.mdc` - Maintenance patterns

---

## 📖 Related Documentation

- [Rules Evaluation](.cursor/RULES_EVALUATION_AND_IMPROVEMENTS.md) - Analysis and improvements
- [Pending Improvements](.cursor/PENDING_IMPROVEMENTS.md) - Incomplete items
- [GitHub Rulesets](.github/rulesets/README.md) - Branch protection rules
- [SSOT Guidance](docs/architecture/SSOT_GUIDANCE.md) - Single source of truth principles

---

**Last Review**: January 2025  
**Next Review**: April 2025

