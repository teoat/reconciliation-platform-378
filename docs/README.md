# 📚 Reconciliation Platform - Documentation

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Organized & Consolidated

---

## 🎯 Master Documents (Start Here)

- **[Master Status and Checklist](./project-management/MASTER_STATUS_AND_CHECKLIST.md)** - ⭐ **Single source of truth** for project status and implementation checklists
- **[Implementation Status Summary](./project-management/IMPLEMENTATION_STATUS_SUMMARY.md)** - Quick reference for implementation status
- **[Project Status](./project-management/PROJECT_STATUS.md)** - Overall project health and metrics

---

## 🚀 Quick Start

- **[Quick Start Guide](./getting-started/QUICK_START.md)** - Get up and running quickly
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
- **[Go-Live Checklist](./deployment/GO_LIVE_CHECKLIST.md)** - Production go-live checklist
- **[Deployment Scripts](./deployment/scripts/README.md)** - Deployment automation

### 🎯 Features
- **[Password Manager](./features/password-manager/)** - Password manager documentation
- **[Onboarding](./features/onboarding/)** - Onboarding feature docs
- **[Meta-Agent](./features/meta-agent/)** - Meta-agent orchestration

### 🛠️ Development Tools
- **[MCP Setup Guide](./development/MCP_SETUP_GUIDE.md)** - Complete MCP server setup (includes Playwright)
- **[Cursor Optimization Guide](./development/CURSOR_OPTIMIZATION_GUIDE.md)** - Cursor IDE optimization
- **[Error Handling Guide](./architecture/backend/ERROR_HANDLING_GUIDE.md)** - Backend error handling patterns

### 🔧 Operations
- **[Troubleshooting](./operations/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Incident Response](./operations/INCIDENT_RESPONSE_RUNBOOKS.md)** - Incident handling procedures
- **[Support & Maintenance](./operations/SUPPORT_MAINTENANCE_GUIDE.md)** - Support guide
- **[User Training](./operations/USER_TRAINING_GUIDE.md)** - User training materials
- **[Monitoring](./operations/monitoring/)** - Monitoring setup guides
- **[Secrets Management](./operations/secrets/)** - Secrets management

### 🔒 Security
- **[Security Audit Report](./security/SECURITY_AUDIT_REPORT.md)** - Security analysis

### 🧪 Testing
- **[UAT Plan](./testing/UAT_PLAN.md)** - User Acceptance Testing plan
- **[UAT Summary](./testing/UAT_SUMMARY.md)** - UAT results
- **[Test Cases](./testing/test-cases/)** - Test case documentation

### 💻 Development
- **[MCP Setup Guide](./development/MCP_SETUP_GUIDE.md)** - Complete MCP server setup (includes Playwright)
- **[Cursor Optimization Guide](./development/CURSOR_OPTIMIZATION_GUIDE.md)** - Cursor IDE optimization
- **[Quick Reference Commands](./development/QUICK-REFERENCE-COMMANDS.md)** - Common commands

### 📊 Project Management
- **[Master Status and Checklist](./project-management/MASTER_STATUS_AND_CHECKLIST.md)** - ⭐ **Master document** - Single source of truth
- **[Implementation Status Summary](./project-management/IMPLEMENTATION_STATUS_SUMMARY.md)** - Quick implementation reference
- **[Project Status](./project-management/PROJECT_STATUS.md)** - Overall project health and metrics
- **[Roadmap V5](./project-management/ROADMAP_V5.md)** - Feature roadmap
- **[Unimplemented TODOs](./UNIMPLEMENTED_TODOS_AND_RECOMMENDATIONS.md)** - Future work items

### 📝 Prompts
- **[Meta-Agent Diagnostic Prompt](./prompts/meta-agent-diagnostic-prompt.md)** - Diagnostic prompt
- **[Comprehensive Audit Prompt](./prompts/ultimate-comprehensive-audit-prompt-v3.md)** - Audit prompt

---

## 📂 Archive

Historical documentation organized by date and category:
- **[Completion Reports](./archive/completion-reports/)** - Archived completion summaries (organized by date)
- **[Diagnostic Reports](./archive/diagnostics/)** - Archived diagnostic reports (organized by date)
- **[Status Reports](./archive/status-reports/)** - Archived status reports (organized by date)
- **[Legacy Archives](./archive/)** - Other historical documentation

**Note**: All completion, status, and diagnostic reports older than 30 days are archived. See [Documentation Consolidation](./DOCUMENTATION_CONSOLIDATION_COMPLETE.md) for details.

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

- **Total Active Docs**: ~35-40 essential files
- **Archived Docs**: ~160+ files (organized by date/category)
- **Categories**: 10 main categories
- **Last Consolidation**: January 2025 (Aggressive)
- **Consolidation Status**: ✅ Complete - See [Aggressive Consolidation](./AGGRESSIVE_CONSOLIDATION_COMPLETE.md)
- **Master Documents**: 3 consolidated status documents
- **Reduction**: ~75% reduction in active documentation

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
