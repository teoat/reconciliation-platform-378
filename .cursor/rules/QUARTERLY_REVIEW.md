# Quarterly Rules Review Process

**Purpose**: Systematic review and maintenance of Cursor IDE rules  
**Frequency**: Quarterly (January, April, July, October)  
**Last Review**: January 2025  
**Next Review**: April 2025

---

## 📋 Review Checklist

### 1. Rule Usage Analysis
- [ ] Check which rules are most frequently referenced
- [ ] Identify rules that are never referenced
- [ ] Review rule file sizes and complexity
- [ ] Check for outdated patterns

### 2. Code Pattern Analysis
- [ ] Search codebase for new patterns (3+ occurrences)
- [ ] Identify common bugs that could be prevented
- [ ] Review code review comments for repeated feedback
- [ ] Check for security or performance patterns not covered

### 3. Rule File Review
- [ ] Review each rule file for accuracy
- [ ] Update examples to match current codebase
- [ ] Remove outdated patterns
- [ ] Add missing patterns
- [ ] Verify cross-references are valid

### 4. Redundancy Check
- [ ] Check for duplicate patterns across files
- [ ] Consolidate redundant rules
- [ ] Ensure single source of truth
- [ ] Verify language files reference general rules

### 5. Documentation Review
- [ ] Update RULES_INDEX.md if rules changed
- [ ] Verify all rule files are listed
- [ ] Check cross-reference links work
- [ ] Update rule statistics

---

## 🔍 Review Process

### Step 1: Automated Analysis
```bash
# Count rule references in codebase
grep -r "mdc:\.cursor/rules" --include="*.{rs,ts,tsx,md}" | wc -l

# Find new patterns (example: search for repeated code patterns)
# This should be done manually based on recent code changes

# Check rule file sizes
wc -l .cursor/rules/*.mdc
```

### Step 2: Pattern Detection
- Review last quarter's commits for new patterns
- Check PR reviews for repeated feedback
- Analyze common issues from bug reports
- Review security/performance improvements

### Step 3: Rule Updates
- Update existing rules with new patterns
- Create new rule files if needed (3+ occurrences)
- Remove or archive outdated rules
- Consolidate redundant rules

### Step 4: Validation
- Test rule references work correctly
- Verify examples match current codebase
- Check all cross-references are valid
- Update RULES_INDEX.md

### Step 5: Documentation
- Update review date in all rule files
- Document changes in review log
- Update PENDING_IMPROVEMENTS.md if needed
- Create summary of changes

---

## 📊 Review Metrics

### Before Review
- Total rule files: ___
- Total rule lines: ___
- Cross-references: ___
- Outdated patterns: ___

### After Review
- Total rule files: ___
- Total rule lines: ___
- Cross-references: ___
- New patterns added: ___
- Outdated patterns removed: ___

### Changes Summary
- Rules added: ___
- Rules updated: ___
- Rules removed: ___
- Patterns consolidated: ___

---

## 📝 Review Log

### January 2025 Review
**Reviewer**: System  
**Status**: ✅ Complete

**Changes Made**:
- ✅ Removed Taskmaster rules (982 lines)
- ✅ Created 4 new rule files (git_workflow, api_design, performance, code_review)
- ✅ Added security references to language files
- ✅ Created RULES_INDEX.md
- ✅ Consolidated testing rules
- ✅ Simplified worktree config (V7.0 → V5.0)

**Metrics**:
- Rules before: 8 files, ~1,952 lines
- Rules after: 13 files, ~1,500 lines
- Reduction: 23% (removed Taskmaster, added focused rules)

**Next Review**: April 2025

---

## 🎯 Review Goals

### Maintainability
- Keep rules focused and actionable
- Remove outdated patterns
- Update examples to match codebase
- Ensure cross-references are valid

### Completeness
- Cover all common patterns
- Include security and performance patterns
- Document workflow processes
- Provide quick references

### Efficiency
- Minimize redundancy
- Single source of truth
- Clear cross-references
- Easy to discover rules

---

## 🔄 Continuous Improvement

### Between Reviews
- Update rules when new patterns emerge (3+ occurrences)
- Fix broken cross-references immediately
- Add quick references when needed
- Document rule changes in commit messages

### Review Triggers
- New technology/pattern used in 3+ files
- Common bugs that could be prevented
- Code reviews repeatedly mention same feedback
- Security or performance patterns emerge

---

## 📚 Related Documentation

- [Rules Index](.cursor/rules/RULES_INDEX.md) - Overview of all rules
- [Rules Evaluation](.cursor/RULES_EVALUATION_AND_IMPROVEMENTS.md) - Analysis and improvements
- [Pending Improvements](.cursor/PENDING_IMPROVEMENTS.md) - Incomplete items
- [Self-Improve Rules](.cursor/rules/self_improve.mdc) - Rule improvement guidelines

---

**Last Review**: January 2025  
**Next Review**: April 2025  
**Review Frequency**: Quarterly

