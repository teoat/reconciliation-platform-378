# 📚 Reconciliation Platform - Documentation

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Organized & Consolidated

---

## 🚀 Quick Start

- **[Quick Start Guide](./getting-started/QUICK_START.md)** - Get up and running quickly
- **[Deployment Guide](./getting-started/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
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
- **[API Documentation](./api/API_DOCUMENTATION.md)** - Complete API reference
- **[API Reference](./api/API_REFERENCE.md)** - API endpoints and usage
- **[Correlation ID Guide](./api/CORRELATION_ID_GUIDE.md)** - Correlation ID integration guide

### 🚀 Deployment
- **[Deployment Guide](./DEPLOYMENT.md)** - Consolidated deployment guide
- **[Docker Build Guide](./deployment/DOCKER_BUILD_GUIDE.md)** - Docker build instructions
- **[Docker Deployment](./deployment/DOCKER_DEPLOYMENT.md)** - Docker deployment guide
- **[Docker Optimization](./deployment/docker/OPTIMIZATION_GUIDE.md)** - Docker optimization
- **[Deployment Status](./deployment/DEPLOYMENT_STATUS.md)** - Current deployment status
- **[Go-Live Checklist](./deployment/GO_LIVE_CHECKLIST.md)** - Production go-live checklist
- **[Deployment Scripts](./deployment/scripts/README.md)** - Deployment automation

### 🎯 Features
- **[Password Manager](./features/password-manager/)** - Password manager documentation
- **[Onboarding](./features/onboarding/)** - Onboarding feature docs
- **[Meta-Agent](./features/meta-agent/)** - Meta-agent orchestration

### 🛠️ Development Tools
- **[MCP Setup Guide](./development/MCP_SETUP_GUIDE.md)** - Complete MCP server setup and configuration
- **[Playwright MCP Setup](./development/PLAYWRIGHT_MCP_SETUP.md)** - Browser automation with Playwright MCP
- **[Cursor Optimization Guide](./development/CURSOR_OPTIMIZATION_GUIDE.md)** - Cursor IDE optimization
- **[Frenly AI](./features/frenly-ai/)** - Frenly AI optimization
- **[Error Handling](./features/error-handling/)** - Error handling components

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
- **[MCP Setup Guide](./development/MCP_SETUP_GUIDE.md)** - Complete MCP server setup and configuration (✅ Consolidated)
- **[Playwright MCP Setup](./development/PLAYWRIGHT_MCP_SETUP.md)** - Browser automation with Playwright MCP
- **[Cursor Optimization Guide](./development/CURSOR_OPTIMIZATION_GUIDE.md)** - Cursor IDE optimization
- **[Quick Reference Commands](./development/QUICK-REFERENCE-COMMANDS.md)** - Common commands

### 📊 Project Management
- **[Project Status](./project-management/PROJECT_STATUS.md)** - Current project status
- **[Roadmap V5](./project-management/ROADMAP_V5.md)** - Feature roadmap
- **[Audit & Deployment Roadmap](./project-management/AUDIT_AND_DEPLOYMENT_ROADMAP.md)** - Audit roadmap
- **[Project History](./project-management/project-history.md)** - Project history
- **[Next Steps](./project-management/NEXT_STEPS_PROPOSAL.md)** - Proposed next steps
- **[Final Roadmap](./project-management/FINAL_ROADMAP_AND_MAINTENANCE.md)** - Final roadmap

### 📝 Prompts
- **[Meta-Agent Diagnostic Prompt](./prompts/meta-agent-diagnostic-prompt.md)** - Diagnostic prompt
- **[Comprehensive Audit Prompt](./prompts/ultimate-comprehensive-audit-prompt-v3.md)** - Audit prompt

---

## 📂 Archive

Historical documentation and completion summaries:
- **[Status Reports](./archive/status_reports/)** - Historical status reports
- **[Deployment Scripts](./archive/deployment/scripts/)** - Archived deployment docs
- **[Diagnostics](./archive/diagnostics/)** - Diagnostic reports
- **[Consolidated](./archive/consolidated/)** - Consolidated historical docs

---

## 📋 Key Documents

### Essential Reading
1. **[Architecture](./architecture/ARCHITECTURE.md)** - Understand the system
2. **[API Documentation](./api/API_DOCUMENTATION.md)** - API reference
3. **[Deployment Guide](./DEPLOYMENT.md)** - Deploy the system
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

- **Total Active Docs**: ~40 organized files
- **Archived Docs**: ~30+ historical files (includes Phase 1 consolidation)
- **Categories**: 10 main categories
- **Last Consolidation**: January 2025 (Phase 1 Complete)
- **Consolidation Status**: See [Documentation Cleanup Summary](./DOCUMENTATION_CLEANUP_COMPLETE.md)

---

## 🔗 External Links

- **[Main README](../README.md)** - Project overview
- **[Technical Debt](../TECHNICAL_DEBT.md)** - Technical debt tracking
- **[Test Coverage](../TEST_COVERAGE.md)** - Testing documentation

---

## 🆘 Need Help?

- **Troubleshooting**: See [Troubleshooting Guide](./operations/TROUBLESHOOTING.md)
- **API Questions**: See [API Documentation](./api/API_DOCUMENTATION.md)
- **Deployment Issues**: See [Deployment Guide](./DEPLOYMENT.md)
- **Contributing**: See [Contributing Guide](./getting-started/CONTRIBUTING.md)

---

## 📝 Changelog

For documentation changes, see [CHANGELOG.md](./CHANGELOG.md).

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Documentation Version**: 2.0.0
