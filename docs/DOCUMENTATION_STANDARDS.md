# Documentation Standards

**Last Updated**: January 2025  
**Status**: Active

---

## Quick Reference

This document provides simplified standards for creating and maintaining documentation. For detailed rules, see [Cursor Documentation Rules](.cursor/rules/documentation.mdc).

---

## Core Principles

1. **Single Source of Truth (SSOT)**: One document per topic
2. **Consolidation First**: Check for existing docs before creating new ones
3. **Clear Organization**: Use consistent structure and naming
4. **Regular Maintenance**: Archive outdated content, update references

---

## File Organization

### Directory Structure

```
docs/
├── api/              # API documentation
├── architecture/     # System architecture
├── deployment/       # Deployment guides
├── development/     # Development tools
├── features/         # Feature documentation
├── getting-started/  # Quick start guides
├── operations/       # Operations and troubleshooting
├── archive/         # Historical/outdated docs
└── README.md        # Main index
```

### File Naming

- **Guides**: `UPPER_SNAKE_CASE.md` (e.g., `DEPLOYMENT_GUIDE.md`)
- **Feature Docs**: `kebab-case.md` (e.g., `password-manager-guide.md`)
- **Descriptive**: Name should indicate content

---

## Document Structure

### Standard Template

```markdown
# Title

**Last Updated**: Month Year  
**Status**: [Active | Deprecated]

---

## Overview
Brief 1-2 sentence description

## Table of Contents
(Only if document has 4+ sections)

## Main Content
Clear sections with descriptive headers

## Related Documentation
- [Related Doc](./path/to/doc.md)

---

**See Also**: [Other Related Docs](./path/)
```

---

## Content Guidelines

### DO ✅
- Start with overview/quick start
- Include practical code examples
- Cross-reference related documentation
- Keep content concise and focused
- Update "Last Updated" when modifying

### DON'T ❌
- Create duplicate documentation
- Leave outdated information
- Use vague or unclear language
- Skip cross-references
- Forget to update the main README

---

## Consolidation Checklist

Before creating new documentation:

- [ ] Check if topic already exists
- [ ] Search for similar/related docs
- [ ] Consider if existing doc can be extended
- [ ] Verify correct category/location
- [ ] Update main README index

---

## Maintenance

### Quarterly Review
- Archive completion/status reports older than 30 days
- Update "Last Updated" dates
- Remove broken links
- Consolidate overlapping content

### When to Archive
- Status/completion reports after 30 days
- Superseded documentation
- Historical reference material
- Outdated guides (keep for reference)

---

## Quick Links

- [Main Documentation Index](./README.md)
- [SSOT Guidance](./architecture/SSOT_GUIDANCE.md)
- [Cursor Documentation Rules](../.cursor/rules/documentation.mdc)

---

**Remember**: One document per topic, clear structure, regular maintenance.

