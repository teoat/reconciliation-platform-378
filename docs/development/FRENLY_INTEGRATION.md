# Frenly AI Integration Guide

**Last Updated**: 2025-01-27  
**Status**: Active  
**Purpose**: Integration guide for Frenly AI to use maintenance and file locking systems

---

## Quick Integration

### 1. Run Maintenance Before Creating Files

```bash
# Always run before creating new documentation
./scripts/frenly-maintenance.sh
```

### 2. Validate Files Before Creation

```bash
# Before creating any file matching restricted patterns
./scripts/file-lock-system.sh validate <file_path>
```

### 3. Use Master Documents

Instead of creating new files, update master documents:
- Status → `docs/project-management/PROJECT_STATUS.md`
- Diagnostics → `docs/project-management/COMPREHENSIVE_DIAGNOSTIC_REPORT.md`
- Deployment → `docs/deployment/DEPLOYMENT_GUIDE.md`
- Quick Start → `docs/getting-started/QUICK_START.md`

---

## Automated Workflow

Frenly AI should:

1. **Before file creation**: Validate using file lock system
2. **Daily**: Run maintenance (duplicate check, root scripts)
3. **Weekly**: Verify master documents, check broken references
4. **Monthly**: Archive old reports (30+ days) and diagnostics (90+ days)

---

## File Lock System Usage

### Prevent Duplicates

```bash
# Validate before creating
./scripts/file-lock-system.sh validate docs/new-status.md

# If validation fails, use master document instead
# Example: Update PROJECT_STATUS.md instead of creating new status file
```

### Lock Master Documents

```bash
# Lock important files to prevent accidental modification
./scripts/file-lock-system.sh lock docs/project-management/PROJECT_STATUS.md "Master status document"
```

---

## See Also

- [Frenly Maintenance Guide](./FRENLY_MAINTENANCE_GUIDE.md) - Complete maintenance guide
- [Consolidation Summary](../project-management/CONSOLIDATION_SUMMARY.md) - Consolidation reference

---

**Last Updated**: 2025-01-27  
**Status**: ✅ Active

