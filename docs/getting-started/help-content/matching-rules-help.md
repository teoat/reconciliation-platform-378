# Matching Rules Help

## Overview

Matching rules define how records are matched during reconciliation. You can configure multiple rules with different criteria and tolerance levels.

## Getting Started

1. **Create Matching Rule**
   - Navigate to Reconciliation Settings
   - Click "Matching Rules" tab
   - Click "New Rule"
   - Define matching criteria

2. **Configure Criteria**
   - Select fields to match on
   - Set matching method (exact, fuzzy, range)
   - Configure tolerance levels
   - Set priority order

3. **Test Rules**
   - Use test mode to preview matches
   - Adjust rules based on results
   - Save when satisfied

## Common Tasks

- **Exact Matching**: Match records with identical values
- **Fuzzy Matching**: Match records with similar values (tolerance-based)
- **Range Matching**: Match records within specified ranges
- **Multi-Field Matching**: Combine multiple fields for matching
- **Rule Priority**: Set order of rule evaluation

## Troubleshooting

**Issue**: Too many false matches
- **Solution**: Tighten tolerance levels or add more specific criteria

**Issue**: Missing valid matches
- **Solution**: Increase tolerance or add alternative matching rules

**Issue**: Rules not applying
- **Solution**: Check rule priority and ensure rules are enabled

## Related Features

- [Field Mapping](./field-mapping-help.md)
- [Reconciliation Execution](./reconciliation-execution-help.md)
- [Match Review](./match-review-help.md)

