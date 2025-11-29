# Documentation Quick Reference

**Last Updated**: January 2025  
**Status**: Active - SSOT  
**Version**: 2.0.0

This file provides quick navigation paths for common documentation needs and user tasks. This guide consolidates all quick reference documentation into a single source of truth.

## 🚀 I want to deploy the platform

**Path**: [README.md](../README.md) → [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)

The [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) contains comprehensive instructions for:
- Docker Compose deployment (recommended)
- Kubernetes deployment
- Terraform infrastructure
- Environment configuration
- Security hardening
- Troubleshooting

## 🔧 I'm having issues

**Path**: [README.md](../README.md) → [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)

The [TROUBLESHOOTING.md](TROUBLESHOOTING.md) covers:
- Common backend issues
- Frontend problems
- Database connection issues
- Docker-specific problems
- Performance issues

## 🧪 I want to run tests

**Path**: [README.md](../README.md) → [docs/UAT_PLAN.md](UAT_PLAN.md)

The [UAT_PLAN.md](UAT_PLAN.md) provides:
- User acceptance testing procedures
- Test cases and scenarios
- Testing checklist

For test results, see [UAT_SUMMARY.md](UAT_SUMMARY.md).

## 🏗️ I need architectural information

**Path**: [docs/README.md](README.md) → Architecture Section

Key documents:
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - Infrastructure topology
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

## 📚 I'm looking for a specific document

**Path**: [docs/README.md](README.md)

The [docs/README.md](README.md) provides a complete index organized by category:
- Getting Started
- Architecture & Engineering
- Operations & Maintenance
- Testing & Quality Assurance
- Security & Compliance
- Integration & Development

## 📦 I need historical documentation

**Path**: [docs/archive/](archive/)

The archive contains 91 historical files including:
- Agent completion reports
- Implementation logs
- Diagnostic reports
- Analysis documents

See [archive/README.md](archive/README.md) for more information.

## 🤝 I want to contribute

**Path**: [README.md](../README.md) → [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 👤 User Quick Reference

### Common Tasks

#### Authentication

| Task | Steps |
|------|-------|
| **Login** | 1. Navigate to platform URL<br>2. Enter email and password<br>3. Click "Login" |
| **Forgot Password** | 1. Click "Forgot Password"<br>2. Enter email<br>3. Check email for reset link<br>4. Follow instructions |
| **Change Password** | 1. Go to Settings → Profile<br>2. Click "Change Password"<br>3. Enter current and new password<br>4. Save |

#### Project Management

| Task | Steps |
|------|-------|
| **Create Project** | 1. Click "Projects" → "New Project"<br>2. Enter name and description<br>3. Set preferences<br>4. Save |
| **View Projects** | 1. Click "Projects" in navigation<br>2. Browse or search projects |
| **Delete Project** | 1. Open project<br>2. Click "Settings" → "Delete"<br>3. Confirm deletion |

#### File Upload

| Task | Steps |
|------|-------|
| **Upload File** | 1. Go to "Ingestion" or project<br>2. Click "Upload"<br>3. Select file(s)<br>4. Wait for processing |
| **Supported Formats** | CSV, JSON, Excel (.xlsx, .xls), Text |
| **File Size Limit** | Check your subscription plan |

#### Reconciliation

| Task | Steps |
|------|-------|
| **Start Reconciliation** | 1. Open project<br>2. Select files to reconcile<br>3. Configure matching rules<br>4. Click "Start Reconciliation" |
| **View Results** | 1. Go to project<br>2. Click "Results" tab<br>3. Review matches and discrepancies |
| **Export Results** | 1. Open results<br>2. Click "Export"<br>3. Choose format (CSV, Excel, PDF)<br>4. Download |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + /` | Toggle help overlay |
| `Ctrl/Cmd + N` | New project |
| `Ctrl/Cmd + U` | Upload file |
| `Ctrl/Cmd + S` | Save changes |
| `Esc` | Close dialog/modal |

### Navigation Quick Links

| Section | Purpose | Location |
|---------|---------|----------|
| **Dashboard** | Overview of activities | Home page after login |
| **Projects** | Manage reconciliation projects | Main navigation |
| **Ingestion** | Upload and process files | Main navigation |
| **Reconciliation** | Run matching jobs | Main navigation |
| **Analytics** | View reports and metrics | Main navigation |
| **Settings** | Configure preferences | User menu |

### Common Issues & Solutions

| Issue | Quick Fix |
|-------|-----------|
| **Can't login** | Check email/password, try "Forgot Password" |
| **File upload fails** | Check file format and size, ensure stable connection |
| **Reconciliation slow** | Large files take longer, check job status |
| **Results not showing** | Refresh page, check filters |
| **Export not working** | Try different format, check browser settings |

### Support Resources

| Resource | Description | Link |
|----------|-------------|------|
| **Help Center** | Searchable documentation | Help menu → Help Center |
| **Training Guide** | Comprehensive user guide | [User Training Guide](./operations/USER_TRAINING_GUIDE.md) |
| **Support Ticket** | Submit support request | Help menu → Support |
| **FAQ** | Frequently asked questions | Help menu → FAQ |

### Best Practices Quick Tips

#### Data Preparation
- ✅ Clean data before upload
- ✅ Use consistent formats
- ✅ Validate data quality
- ✅ Document data sources

#### Reconciliation
- ✅ Start with exact matches
- ✅ Use appropriate thresholds
- ✅ Review results carefully
- ✅ Document decisions

#### Collaboration
- ✅ Use comments and notes
- ✅ Share findings with team
- ✅ Keep team informed
- ✅ Document decisions

For detailed instructions, see the [User Training Guide](./operations/USER_TRAINING_GUIDE.md).

The [CONTRIBUTING.md](../CONTRIBUTING.md) covers:
- Development workflow
- Coding standards
- Pull request process
- Testing requirements

## 📖 Complete Documentation Map

```
/
├── README.md                    # Main entry point
├── DEPLOYMENT_GUIDE.md          # Deployment instructions
├── QUICK_START.md               # Quick setup guide
├── CONTRIBUTING.md              # Contribution guidelines
└── docs/
    ├── README.md                # Documentation index
    ├── UAT_PLAN.md             # Testing plan
    ├── UAT_SUMMARY.md          # Test results
    ├── ARCHITECTURE.md         # System architecture
    ├── TROUBLESHOOTING.md      # Problem solving
    └── archive/                # Historical documents
        └── README.md           # Archive index
```

---

**Need help?** Start at [README.md](../README.md) or [docs/README.md](README.md)
