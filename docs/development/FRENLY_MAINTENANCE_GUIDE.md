# Frenly AI Maintenance System Guide

**Last Updated**: 2025-01-27  
**Status**: Active  
**Purpose**: Guide for Frenly AI to use the maintenance and file locking system

---

## Overview

The Frenly AI Maintenance System automates documentation and file management to prevent duplicates, archive old files, and maintain a single source of truth (SSOT).

**Key Features:**
- ✅ Automatic duplicate detection
- ✅ Archive old reports (30+ days)
- ✅ Archive old diagnostics (90+ days)
- ✅ File locking system to prevent duplicates
- ✅ Master document verification
- ✅ Broken reference detection

---

## Quick Start

### Run Maintenance

```bash
# Run all maintenance tasks
./scripts/frenly-maintenance.sh

# Run specific task (see script for available functions)
```

### File Lock System

```bash
# Initialize lock file (first time only)
./scripts/file-lock-system.sh init

# Validate file before creating
./scripts/file-lock-system.sh validate docs/new-file.md

# Lock a file (prevent modification)
./scripts/file-lock-system.sh lock docs/file.md "Reason for locking"

# Unlock a file
./scripts/file-lock-system.sh unlock docs/file.md

# Check if file is locked
./scripts/file-lock-system.sh check docs/file.md
```

---

## Maintenance Tasks

### 1. Check for Duplicates

**Frequency**: Daily  
**Purpose**: Detect files matching restricted patterns

**What it does:**
- Scans `docs/` directory for files matching restricted patterns
- Checks against master documents list
- Reports potential duplicates

**Restricted Patterns:**
- `*COMPLETE*.md`
- `*SUMMARY*.md`
- `*REPORT*.md`
- `*STATUS*.md`
- `*PLAN*.md`
- `*DIAGNOSTIC*.md`

### 2. Archive Old Reports

**Frequency**: Monthly  
**Purpose**: Archive completion reports older than 30 days

**What it does:**
- Finds `*COMPLETE*.md` files older than 30 days
- Moves them to `archive/docs/completion-reports/YYYY-MM/`
- Skips master documents

### 3. Archive Old Diagnostics

**Frequency**: Monthly  
**Purpose**: Archive diagnostic reports older than 90 days

**What it does:**
- Finds `*DIAGNOSTIC*.md` files older than 90 days
- Moves them to `archive/docs/diagnostics/YYYY-MM/`
- Skips master documents

### 4. Check Root Scripts

**Frequency**: Daily  
**Purpose**: Detect duplicate root-level scripts

**What it does:**
- Checks for `.sh` files in root directory
- Compares with `scripts/` directory
- Reports potential duplicates

### 5. Verify Master Documents

**Frequency**: Weekly  
**Purpose**: Ensure master documents exist and are maintained

**What it does:**
- Verifies all master documents exist
- Checks modification dates (warns if >90 days old)
- Reports missing or outdated documents

**Master Documents:**
- `docs/project-management/PROJECT_STATUS.md`
- `docs/project-management/MASTER_TODOS.md`
- `docs/project-management/COMPREHENSIVE_DIAGNOSTIC_REPORT.md`
- `docs/deployment/DEPLOYMENT_GUIDE.md`
- `docs/getting-started/QUICK_START.md`
- `docs/development/MCP_SETUP_GUIDE.md`
- `docs/project-management/CONSOLIDATION_SUMMARY.md`

### 6. Check Broken References

**Frequency**: Weekly  
**Purpose**: Find references to archived files

**What it does:**
- Searches for references to archived file patterns
- Reports potential broken links
- Helps identify files that need updating

---

## File Lock System

### Purpose

Prevents creation of duplicate files by:
- Checking against master documents
- Validating restricted patterns
- Detecting similar existing files
- Locking important files

### Usage

#### Before Creating a File

```bash
# Always validate before creating restricted files
./scripts/file-lock-system.sh validate docs/new-status-report.md

# If validation fails, use master document instead
# Example: Use PROJECT_STATUS.md instead of creating new status file
```

#### Lock Important Files

```bash
# Lock master documents (prevents accidental modification)
./scripts/file-lock-system.sh lock docs/project-management/PROJECT_STATUS.md "Master status document"

# Lock files during refactoring
./scripts/file-lock-system.sh lock docs/deployment/DEPLOYMENT_GUIDE.md "Under refactoring"
```

#### Check File Status

```bash
# Check if file is locked before modifying
./scripts/file-lock-system.sh check docs/project-management/PROJECT_STATUS.md
```

### Restricted Patterns

Files matching these patterns are restricted:
- `*COMPLETE*.md` → Use master documents or archive
- `*SUMMARY*.md` → Use master documents or archive
- `*REPORT*.md` → Use master documents or archive
- `*STATUS*.md` → Use `PROJECT_STATUS.md` or feature-specific status
- `*PLAN*.md` → Use master planning documents
- `*DIAGNOSTIC*.md` → Use `COMPREHENSIVE_DIAGNOSTIC_REPORT.md`

### Allowed Exceptions

These files are allowed even if they match patterns:
- Master documents (listed above)
- Feature-specific status files in appropriate directories
- Active planning documents in `docs/project-management/`

---

## Integration with Frenly AI

### Automatic Maintenance

Frenly AI should run maintenance:

1. **Before creating new files**: Validate using file lock system
2. **Daily**: Run duplicate check and root script check
3. **Weekly**: Verify master documents and check broken references
4. **Monthly**: Archive old reports and diagnostics
5. **Quarterly**: Review archive directories

### Workflow

```bash
# 1. Before creating a file
./scripts/file-lock-system.sh validate <new_file_path>

# 2. If validation fails:
#    - Use master document instead
#    - Or archive the file immediately
#    - Or get approval for exception

# 3. After creating file:
#    - Update master document if needed
#    - Lock file if it's important

# 4. Regular maintenance:
./scripts/frenly-maintenance.sh
```

### Best Practices

1. **Always validate** before creating files matching restricted patterns
2. **Use master documents** instead of creating duplicates
3. **Archive immediately** if creating temporary reports
4. **Lock master documents** to prevent accidental modification
5. **Run maintenance regularly** (daily/weekly/monthly)
6. **Update master documents** when creating related content

---

## Configuration

Configuration file: `.frenly-maintenance-config.json`

**Key Settings:**
- `maintenance.enabled`: Enable/disable maintenance
- `maintenance.tasks.*.enabled`: Enable/disable specific tasks
- `maintenance.tasks.*.frequency`: Task frequency (daily/weekly/monthly)
- `file_locking.enabled`: Enable/disable file locking
- `file_locking.strict_mode`: Strict validation mode
- `file_locking.prevent_duplicates`: Prevent duplicate files

---

## Troubleshooting

### File Lock System Not Working

```bash
# Reinitialize lock file
./scripts/file-lock-system.sh init

# Check lock file exists
ls -la .frenly-file-locks.json
```

### Maintenance Script Errors

```bash
# Check dependencies (jq required)
which jq

# Check log file
cat frenly-maintenance.log
```

### False Positives

If a file is incorrectly flagged:
1. Add to `allowed_exceptions` in lock file
2. Or move to appropriate subdirectory
3. Or rename to avoid restricted pattern

---

## Related Documentation

- [Consolidation Summary](../project-management/CONSOLIDATION_SUMMARY.md) - Consolidation reference
- [Aggressive Consolidation Complete](../../AGGRESSIVE_CONSOLIDATION_COMPLETE.md) - Consolidation results
- [Documentation Standards](../DOCUMENTATION_STANDARDS.md) - Documentation guidelines
- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md) - Single source of truth principles

---

**Last Updated**: 2025-01-27  
**Maintained By**: Frenly AI  
**Status**: ✅ Active

