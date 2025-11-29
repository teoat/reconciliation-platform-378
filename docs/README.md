# 📚 Reconciliation Platform - Documentation

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Organized & Consolidated

---

## 🎯 Master Documents (Start Here)

- **[📚 Documentation Hub](./DOCUMENTATION_HUB.md)** ⭐ **NEW** - Central documentation portal with role-based navigation
- **[Project Status](./project-management/PROJECT_STATUS.md)** - ⭐ **Single source of truth** - Overall project health and metrics

---

## 🚀 Quick Start

- **[Quick Start Guide](./getting-started/QUICK_START.md)** - Get up and running quickly
- **[User Quick Reference](./getting-started/USER_QUICK_REFERENCE.md)** - ⭐ **NEW** - Quick reference for common tasks
- **[Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Contributing Guide](./getting-started/CONTRIBUTING.md)** - How to contribute

---

## 📖 Documentation Structure

### 🏗️ Architecture
- **[Architecture Overview](./architecture/ARCHITECTURE.md)** - System architecture
- **[Infrastructure](./architecture/INFRASTRUCTURE.md)** - Infrastructure design
- **[SSOT Guidance](./architecture/SSOT_GUIDANCE.md)** - Single Source of Truth principles
- **[Architecture Decision Records (ADRs)](./architecture/adr/frontend/)** - Frontend ADRs
- **[Backend Architecture](./architecture/backend/)** - Backend architecture guides

### 🔌 API Documentation
- **[API Reference](./api/API_REFERENCE.md)** - Complete API reference and endpoints
- **[Correlation ID Guide](./api/CORRELATION_ID_GUIDE.md)** - Correlation ID integration guide

### 🚀 Deployment
- **[Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)** - Complete deployment guide (Docker, Kubernetes, optimization)
- **[Phase 4 Production Readiness Guide](./deployment/PHASE_4_PRODUCTION_READINESS_GUIDE.md)** - ⭐ **NEW** - Phase 4 production readiness
- **[Go-Live Checklist](./deployment/GO_LIVE_CHECKLIST.md)** - Production go-live checklist
- **[Deployment Scripts](./deployment/scripts/README.md)** - Deployment automation

### 🎯 Features
- **[Password Manager](./features/password-manager/)** - Password manager documentation
- **[Onboarding](./features/onboarding/)** - Onboarding feature docs
  - [Progressive Feature Disclosure Guide](./features/onboarding/PROGRESSIVE_FEATURE_DISCLOSURE_GUIDE.md) - Feature disclosure strategy
  - [Smart Tip System Guide](./features/onboarding/SMART_TIP_SYSTEM_GUIDE.md) - Smart tips implementation
- **[Meta-Agent](./features/meta-agent/)** - Meta-agent orchestration

### 🛠️ Development Tools
- **[MCP Setup Guide](./development/MCP_SETUP_GUIDE.md)** - Complete MCP server setup (includes Playwright)
- **[Cursor Optimization Guide](./development/CURSOR_OPTIMIZATION_GUIDE.md)** - Cursor IDE optimization
- **[SSOT Migration Guide](./development/SSOT_MIGRATION_GUIDE.md)** - Guide for migrating to SSOT locations
- **[Help Content Implementation Guide](./development/HELP_CONTENT_IMPLEMENTATION_GUIDE.md)** - Help system UI integration
- **[Feature Integration Guide](./development/FEATURE_INTEGRATION_GUIDE.md)** - Feature integration guide
- **[Error Handling Guide](./architecture/backend/ERROR_HANDLING_GUIDE.md)** - Backend error handling patterns

### 🔧 Operations
- **[Troubleshooting](./operations/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Incident Response](./operations/INCIDENT_RESPONSE_RUNBOOKS.md)** - Incident handling procedures
- **[Support & Maintenance](./operations/SUPPORT_MAINTENANCE_GUIDE.md)** - Support guide
- **[User Training](./operations/USER_TRAINING_GUIDE.md)** - User training materials
- **[Contextual Help Content](./getting-started/CONTEXTUAL_HELP_CONTENT.md)** - ⭐ **NEW** - UI help text and tooltips
- **[Monitoring](./operations/monitoring/)** - Monitoring setup guides
- **[Secrets Management](./operations/secrets/)** - Secrets management

### 🔒 Security
- **[Security Guides](./security/)** - Security documentation and guides

### 🧪 Testing
- **[Testing Guides](./testing/)** - Testing documentation and guides
- **[Test Cases](./testing/test-cases/)** - Test case documentation

### 💻 Development
- **[MCP Setup Guide](./development/MCP_SETUP_GUIDE.md)** - Complete MCP server setup (includes Playwright)
- **[Cursor Optimization Guide](./development/CURSOR_OPTIMIZATION_GUIDE.md)** - Cursor IDE optimization
- **[Quick Reference Commands](./development/QUICK-REFERENCE-COMMANDS.md)** - Common commands

### 🔧 Refactoring
- **[Refactoring Guides](./refactoring/)** - Refactoring documentation and guides

### 📊 Project Management
- **[Project Status](./project-management/PROJECT_STATUS.md)** - ⭐ **Single source of truth** - Overall project health and metrics
- **[Project Management Guides](./project-management/)** - Project management documentation

### 📝 Prompts
- **[Prompts](./prompts/)** - AI agent prompts and templates

---

## 📂 Archive

Historical documentation organized by date and category:
- **[Completion Reports](./archive/completion-reports/)** - Archived completion summaries (organized by date)
- **[Diagnostic Reports](./archive/diagnostics/)** - Archived diagnostic reports (organized by date)
- **[Status Reports](./archive/status-reports/)** - Archived status reports (organized by date)
- **[Legacy Archives](./archive/)** - Other historical documentation

**Note**: All completion, status, diagnostic, plan, proposal, todo, and checklist files have been archived to `docs/archive/[category]/2025-11/`. Only essential guides and `PROJECT_STATUS.md` remain active.

---

## 📋 Key Documents

### Essential Reading
1. **[Architecture](./architecture/ARCHITECTURE.md)** - Understand the system
2. **[API Reference](./api/API_REFERENCE.md)** - Complete API reference
3. **[Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)** - Deploy the system
4. **[Troubleshooting](./operations/TROUBLESHOOTING.md)** - Solve problems

### For Developers
- **[Contributing Guide](./getting-started/CONTRIBUTING.md)** - Contribution guidelines
- **[Development Guides](./development/)** - Development tools and guides
- **[Architecture Decision Records](./architecture/adr/frontend/)** - Design decisions

### For Operators
- **[Operations Guides](./operations/)** - Operations and troubleshooting
- **[Deployment Guides](./deployment/)** - Deployment procedures
- **[Monitoring](./operations/monitoring/)** - Monitoring setup

---

## 🔄 Documentation Maintenance

### Adding New Documentation

1. **Choose the Right Category**
   - Architecture docs → `architecture/`
   - API docs → `api/`
   - Feature docs → `features/[feature-name]/`
   - Operations docs → `operations/`

2. **Follow Naming Conventions**
   - Use UPPER_SNAKE_CASE for file names
   - Use descriptive names
   - Include version numbers if applicable

3. **Update This Index**
   - Add new documents to appropriate section
   - Update last modified date
   - Cross-reference related docs

### Documentation Standards

- **Format**: Markdown (`.md`)
- **Structure**: Clear headers, table of contents
- **Examples**: Include code examples where applicable
- **Links**: Cross-reference related documentation
- **Updates**: Review and update regularly

### Documentation Template

```markdown
# Title

**Version**: X.Y.Z  
**Last Updated**: Month Year  
**Status**: [Active | Deprecated | Archived]

---

## Overview
Brief description

## Contents
- Section 1
- Section 2

## Detailed Content
...

---

**See Also**:
- [Related Doc 1](./path/to/doc1.md)
- [Related Doc 2](./path/to/doc2.md)
```

---

## 📊 Documentation Statistics

- **Total Active Docs**: ~20-30 essential guides only
- **Archived Docs**: All STATUS/REPORT/COMPLETE/SUMMARY/DIAGNOSTIC/PLAN/PROPOSAL/TODO/CHECKLIST files (organized by date/category in `docs/archive/`)
- **Categories**: 10 main categories
- **Last Consolidation**: November 2025 (Aggressive)
- **Consolidation Status**: ✅ Complete
- **Master Documents**: PROJECT_STATUS.md (single source of truth)
- **Reduction**: ~85-90% reduction in active documentation
- **Policy**: Archive status/completion/summary/plan/proposal/todo/checklist files immediately, keep only essential guides

---

## 🔗 External Links

- **[Main README](../README.md)** - Project overview
- **[Technical Debt](../TECHNICAL_DEBT.md)** - Technical debt tracking
- **[Test Coverage](../TEST_COVERAGE.md)** - Testing documentation

---

## 🆘 Need Help?

- **Project Status**: See [Master Status and Checklist](./project-management/MASTER_STATUS_AND_CHECKLIST.md)
- **Troubleshooting**: See [Troubleshooting Guide](./operations/TROUBLESHOOTING.md)
- **API Questions**: See [API Reference](./api/API_REFERENCE.md)
- **Deployment Issues**: See [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)
- **Contributing**: See [Contributing Guide](./getting-started/CONTRIBUTING.md)

---

## 📝 Changelog

For documentation changes, see [CHANGELOG.md](./CHANGELOG.md).

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Documentation Version**: 2.0.0
