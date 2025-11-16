# Consolidation Maintenance Process

**Last Updated**: January 2025  
**Status**: Active

---

## Overview

This document outlines the process for maintaining code and documentation consolidation, preventing duplication, and managing archived files.

---

## Regular Maintenance Tasks

### Monthly Tasks

1. **Archive Status/Completion Reports**
   - Review root directory for `*_COMPLETE.md`, `*_SUMMARY.md`, `*_STATUS.md` files
   - Move to `archive/docs/completion-reports/` if older than 30 days
   - Keep only if contains unique technical information

2. **Review Diagnostic Reports**
   - Archive diagnostic reports older than 90 days
   - Keep only comprehensive audit reports
   - Move to `archive/docs/diagnostics/`

3. **Check for Duplicate Scripts**
   - Review new shell scripts for duplicate functions
   - Ensure new scripts source `scripts/lib/common-functions.sh`
   - Archive unused scripts to `archive/scripts/unused/`

### Quarterly Tasks

1. **Review Archived Files**
   - Identify files that can be permanently deleted (older than 1 year)
   - Update archive organization if needed
   - Document any files moved back to active use

2. **Update Shared Function Library**
   - Review `scripts/lib/common-functions.sh` for improvements
   - Add new common functions if pattern emerges
   - Update documentation

3. **Documentation Audit**
   - Review `docs/` directory for duplicates
   - Consolidate similar documentation
   - Update cross-references

---

## Preventing Duplication

### For Shell Scripts

1. **Always Source Common Functions**
   ```bash
   # At the top of your script
   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   source "$SCRIPT_DIR/lib/common-functions.sh"
   ```

2. **Before Creating New Functions**
   - Check `scripts/lib/common-functions.sh` first
   - If function exists, use the shared version
   - If similar function exists, consider extending the shared version

3. **New Script Checklist**
   - [ ] Sources common-functions.sh
   - [ ] Uses shared logging functions
   - [ ] Uses shared validation functions
   - [ ] No duplicate function definitions

### For Documentation

1. **Before Creating New Documentation**
   - Check `docs/README.md` for existing documentation
   - Search for similar topics
   - If duplicate exists, update existing doc instead

2. **Status/Completion Reports**
   - Use `docs/project-management/PROJECT_STATUS.md` for current status
   - Don't create new status files in root
   - Archive old status reports monthly

3. **Feature Documentation**
   - Place in `docs/features/[feature-name]/`
   - One guide per feature
   - Update existing guide instead of creating new one

---

## Archive Organization

### Structure

```
archive/
├── docs/
│   ├── completion-reports/     # Status/completion reports
│   ├── deployment-status/      # Deployment status reports
│   ├── diagnostics/           # Diagnostic reports
│   ├── feature-status/        # Feature-specific status
│   └── cursor-docs/           # Cursor/.cursor documentation
└── scripts/
    ├── unused/                # Unused scripts
    └── duplicates/            # Duplicate scripts
```

### Archive Guidelines

1. **When to Archive**
   - Status/completion reports older than 30 days
   - Duplicate scripts that are no longer used
   - Diagnostic reports older than 90 days
   - Outdated documentation superseded by newer versions

2. **What to Keep Active**
   - Current project status
   - Active deployment guides
   - Comprehensive audit reports
   - Feature guides and troubleshooting runbooks

3. **Archive Naming**
   - Preserve original filename
   - Add to appropriate category directory
   - Don't modify archived files

---

## Automation

### Scripts Available

1. **`consolidate-documentation.sh`**
   - Archives duplicate documentation files
   - Run monthly or when duplicates are identified

2. **`consolidate-scripts.sh`**
   - Archives unused/duplicate scripts
   - Run when new duplicates are found

### Manual Process

For one-off consolidations:
1. Identify duplicate/unused files
2. Determine appropriate archive location
3. Move files to archive
4. Update this document if new patterns emerge

---

## Monitoring

### Metrics to Track

- Number of files in root directory (should decrease over time)
- Number of duplicate functions in scripts (should be zero)
- Number of archived files (should grow slowly)
- Time since last consolidation (should be < 30 days)

### Alerts

- If root directory has > 20 markdown files, review for archiving
- If new script doesn't source common-functions.sh, flag for review
- If duplicate function found, add to shared library

---

## Related Documentation

- [DUPLICATE_FUNCTIONS_DIAGNOSTIC.md](../../DUPLICATE_FUNCTIONS_DIAGNOSTIC.md) - Function duplication analysis
- [DOCUMENTATION_DUPLICATES_DIAGNOSTIC.md](../../DOCUMENTATION_DUPLICATES_DIAGNOSTIC.md) - Documentation analysis
- [CONSOLIDATION_SUMMARY.md](../../CONSOLIDATION_SUMMARY.md) - Overall consolidation summary
- [scripts/lib/common-functions.sh](../../scripts/lib/common-functions.sh) - Shared function library

---

## Questions or Issues

If you encounter:
- New duplication patterns
- Questions about what to archive
- Suggestions for improvement

Please update this document or create an issue for discussion.

