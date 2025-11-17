# Cursor Rules Index

**Last Updated**: January 2025  
**Purpose**: Quick reference guide to all coding rules and patterns

## Overview

This index provides a quick reference to all rule files in `.cursor/rules/`. Each rule file contains specific patterns and best practices for different aspects of the codebase.

## Rule Files

### Core Rules

#### [cursor_rules.mdc](mdc:.cursor/rules/cursor_rules.mdc)
- **Purpose**: General rule formatting and structure guidelines
- **Applies To**: All rule files
- **Key Topics**: Rule structure, file references, code examples, maintenance

#### [self_improve.mdc](mdc:.cursor/rules/self_improve.mdc)
- **Purpose**: Rule improvement and evolution guidelines
- **Applies To**: Rule maintenance process
- **Key Topics**: Pattern recognition, rule updates, quality checks

### Language-Specific Rules

#### [rust_patterns.mdc](mdc:.cursor/rules/rust_patterns.mdc)
- **Purpose**: Rust-specific coding patterns for backend
- **Applies To**: `backend/**/*.rs`
- **Key Topics**: 
  - Error handling (AppResult, AppError)
  - Database operations (Diesel, transactions)
  - Async patterns
  - Logging (references [security.mdc](mdc:.cursor/rules/security.mdc))
  - Middleware patterns
- **Security**: References [security.mdc](mdc:.cursor/rules/security.mdc) for security patterns

#### [typescript_patterns.mdc](mdc:.cursor/rules/typescript_patterns.mdc)
- **Purpose**: TypeScript and React patterns for frontend
- **Applies To**: `frontend/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `pages/**/*.{ts,tsx}`
- **Key Topics**:
  - Type safety (strict mode, interfaces)
  - State management (Redux Toolkit, hooks)
  - API service patterns
  - Component structure
  - Styling (Tailwind CSS)
  - Error handling (references [security.mdc](mdc:.cursor/rules/security.mdc))
- **Security**: References [security.mdc](mdc:.cursor/rules/security.mdc) for security patterns

### Security Rules

#### [security.mdc](mdc:.cursor/rules/security.mdc)
- **Purpose**: Security best practices and patterns
- **Applies To**: `**/*.{rs,ts,tsx,js}`
- **Key Topics**:
  - Input validation
  - Authentication and authorization
  - XSS prevention
  - SQL injection prevention
  - CSRF protection
  - Secrets management
  - Error handling security
  - Logging security (masking PII)
  - HTTPS and security headers
- **Referenced By**: rust_patterns.mdc, typescript_patterns.mdc

### Workflow Rules

#### [git_workflow.mdc](mdc:.cursor/rules/git_workflow.mdc)
- **Purpose**: Git workflow and branching conventions
- **Applies To**: All git operations
- **Key Topics**:
  - Branch naming conventions
  - Commit message format
  - Merge vs rebase
  - PR workflow
  - Tagging releases

#### [api_design.mdc](mdc:.cursor/rules/api_design.mdc)
- **Purpose**: RESTful API design patterns
- **Applies To**: API endpoints
- **Key Topics**:
  - RESTful conventions
  - Endpoint naming
  - Request/response patterns
  - Error response format
  - API versioning

#### [code_review.mdc](mdc:.cursor/rules/code_review.mdc)
- **Purpose**: Code review guidelines and checklist
- **Applies To**: All code reviews
- **Key Topics**:
  - Review checklist
  - What to look for
  - Approval criteria
  - Review process

### Organization Rules

#### [code_organization.mdc](mdc:.cursor/rules/code_organization.mdc)
- **Purpose**: Code organization and structure
- **Applies To**: All code
- **Key Topics**:
  - Directory structure
  - File naming
  - Module boundaries
  - SSOT principles

#### [consolidation.mdc](mdc:.cursor/rules/consolidation.mdc)
- **Purpose**: Preventing duplication and consolidation
- **Applies To**: Scripts, documentation, functions
- **Key Topics**:
  - Shared function library
  - Documentation consolidation
  - Archive organization
  - Maintenance process

#### [documentation.mdc](mdc:.cursor/rules/documentation.mdc)
- **Purpose**: Documentation structure and organization
- **Applies To**: All documentation
- **Key Topics**:
  - Document types (PLAN, STATUS, GUIDE, ARCHIVE)
  - File naming conventions
  - Content guidelines
  - Consolidation rules

### Quality Rules

#### [testing.mdc](mdc:.cursor/rules/testing.mdc)
- **Purpose**: Testing patterns and best practices
- **Applies To**: All test files
- **Key Topics**:
  - Test organization
  - Rust testing patterns
  - TypeScript/React testing
  - Test data management
  - Mocking and stubs
  - E2E testing
  - Test coverage

#### [performance.mdc](mdc:.cursor/rules/performance.mdc)
- **Purpose**: Performance optimization patterns
- **Applies To**: All code
- **Key Topics**:
  - Database query optimization
  - Backend performance
  - Frontend performance
  - Caching strategies
  - API response optimization
  - Monitoring and profiling

## Quick Reference

### When to Use Which Rule

| Task | Rule File |
|------|-----------|
| Writing Rust code | [rust_patterns.mdc](mdc:.cursor/rules/rust_patterns.mdc) |
| Writing TypeScript/React | [typescript_patterns.mdc](mdc:.cursor/rules/typescript_patterns.mdc) |
| Security concerns | [security.mdc](mdc:.cursor/rules/security.mdc) |
| Creating API endpoints | [api_design.mdc](mdc:.cursor/rules/api_design.mdc) |
| Git operations | [git_workflow.mdc](mdc:.cursor/rules/git_workflow.mdc) |
| Code review | [code_review.mdc](mdc:.cursor/rules/code_review.mdc) |
| Organizing code | [code_organization.mdc](mdc:.cursor/rules/code_organization.mdc) |
| Writing tests | [testing.mdc](mdc:.cursor/rules/testing.mdc) |
| Performance optimization | [performance.mdc](mdc:.cursor/rules/performance.mdc) |
| Writing documentation | [documentation.mdc](mdc:.cursor/rules/documentation.mdc) |

### Cross-References

**Security Patterns**:
- Referenced in: rust_patterns.mdc, typescript_patterns.mdc
- Use for: Input validation, authentication, secrets, logging security

**Error Handling**:
- Rust: rust_patterns.mdc (AppResult pattern)
- TypeScript: typescript_patterns.mdc (try-catch patterns)
- Security: security.mdc (error handling security)

**Testing**:
- Patterns: testing.mdc
- Security testing: security.mdc
- Performance testing: performance.mdc

## Rule Maintenance

- **When to Update**: When new patterns emerge (3+ occurrences)
- **How to Update**: See [self_improve.mdc](mdc:.cursor/rules/self_improve.mdc)
- **Format**: Follow [cursor_rules.mdc](mdc:.cursor/rules/cursor_rules.mdc)

## Rule Maintenance Process

### Quarterly Review
- **Process**: See [QUARTERLY_REVIEW.md](mdc:.cursor/rules/QUARTERLY_REVIEW.md)
- **Schedule**: January, April, July, October
- **Last Review**: January 2025
- **Next Review**: April 2025

### Maintenance Guidelines
- **When to Update**: When new patterns emerge (3+ occurrences)
- **How to Update**: See [self_improve.mdc](mdc:.cursor/rules/self_improve.mdc)
- **Format**: Follow [cursor_rules.mdc](mdc:.cursor/rules/cursor_rules.mdc)

## Related Documentation

- [PENDING_IMPROVEMENTS.md](mdc:.cursor/PENDING_IMPROVEMENTS.md) - ✅ All items completed
- [RULES_EVALUATION_AND_IMPROVEMENTS.md](mdc:.cursor/RULES_EVALUATION_AND_IMPROVEMENTS.md) - Rule evaluation report
- [QUARTERLY_REVIEW.md](mdc:.cursor/rules/QUARTERLY_REVIEW.md) - Review and maintenance process
- [GitHub Rulesets](.github/rulesets/README.md) - Branch protection rules
- [SSOT Guidance](docs/architecture/SSOT_GUIDANCE.md) - Single source of truth principles

---

**Last Updated**: January 2025  
**Total Rule Files**: 13 (.mdc files) + 2 documentation files (RULES_INDEX.md, QUARTERLY_REVIEW.md)  
**Total Lines**: ~2,104 lines
