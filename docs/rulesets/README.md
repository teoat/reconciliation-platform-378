# Reconciliation Platform Rulesets

## Overview

This document defines the rulesets used for data reconciliation in the platform. Rulesets provide configurable matching and validation logic for comparing data from different sources.

## Ruleset Structure

```json
{
  "id": "uuid",
  "name": "Ruleset Name",
  "description": "Description of the ruleset",
  "version": "1.0.0",
  "enabled": true,
  "priority": 1,
  "conditions": [...],
  "actions": [...],
  "metadata": {...}
}
```

## Field Matching Rules

### Exact Match
Requires exact field value equality.

```json
{
  "type": "exact_match",
  "sourceField": "transaction_id",
  "targetField": "txn_id",
  "caseSensitive": false,
  "trimWhitespace": true
}
```

### Fuzzy Match
Allows approximate matching using similarity algorithms.

```json
{
  "type": "fuzzy_match",
  "sourceField": "customer_name",
  "targetField": "name",
  "algorithm": "levenshtein",
  "threshold": 0.85,
  "options": {
    "ignoreCase": true,
    "ignoreSpecialChars": true
  }
}
```

Supported algorithms:
- `levenshtein` - Edit distance
- `jaro_winkler` - String similarity
- `soundex` - Phonetic matching
- `metaphone` - Phonetic matching

### Numeric Tolerance
Allows numeric values to match within a tolerance.

```json
{
  "type": "numeric_tolerance",
  "sourceField": "amount",
  "targetField": "payment_amount",
  "tolerance": {
    "type": "absolute",
    "value": 0.01
  }
}
```

Tolerance types:
- `absolute` - Fixed tolerance (e.g., ±0.01)
- `percentage` - Percentage tolerance (e.g., ±1%)
- `relative` - Relative to value size

### Date Match
Handles date field comparisons with format conversion.

```json
{
  "type": "date_match",
  "sourceField": "transaction_date",
  "targetField": "txn_date",
  "sourceFormat": "YYYY-MM-DD",
  "targetFormat": "DD/MM/YYYY",
  "toleranceDays": 1,
  "timezone": "UTC"
}
```

### Composite Key
Matches based on multiple fields combined.

```json
{
  "type": "composite_key",
  "sourceFields": ["account_id", "transaction_date", "amount"],
  "targetFields": ["acct", "date", "amt"],
  "separator": "|",
  "matchRules": [
    { "type": "exact_match", "index": 0 },
    { "type": "date_match", "index": 1 },
    { "type": "numeric_tolerance", "index": 2, "tolerance": 0.01 }
  ]
}
```

### Custom Expression
Uses custom logic for complex matching.

```json
{
  "type": "custom_expression",
  "expression": "source.account_id == target.acct_id && abs(source.amount - target.amt) < 0.01",
  "variables": {
    "source": "sourceRecord",
    "target": "targetRecord"
  }
}
```

## Validation Rules

### Required Fields
Ensures fields are present and non-empty.

```json
{
  "type": "required",
  "fields": ["transaction_id", "amount", "date"],
  "allowNull": false,
  "allowEmpty": false
}
```

### Data Type Validation
Validates field data types.

```json
{
  "type": "data_type",
  "field": "amount",
  "expectedType": "decimal",
  "precision": 2,
  "allowNegative": true
}
```

### Range Validation
Validates values within acceptable ranges.

```json
{
  "type": "range",
  "field": "quantity",
  "min": 0,
  "max": 10000,
  "inclusive": true
}
```

### Pattern Validation
Validates against regex patterns.

```json
{
  "type": "pattern",
  "field": "account_number",
  "pattern": "^[A-Z]{2}[0-9]{10}$",
  "message": "Invalid account number format"
}
```

### Cross-Field Validation
Validates relationships between fields.

```json
{
  "type": "cross_field",
  "rule": "start_date <= end_date",
  "fields": ["start_date", "end_date"],
  "message": "Start date must be before end date"
}
```

## Reconciliation Actions

### Auto-Match
Automatically matches records meeting criteria.

```json
{
  "type": "auto_match",
  "conditions": ["exact_match:transaction_id"],
  "confidence": 1.0,
  "status": "matched"
}
```

### Flag for Review
Marks records for manual review.

```json
{
  "type": "flag_for_review",
  "conditions": ["fuzzy_match:customer_name"],
  "reason": "Partial match requires verification",
  "priority": "medium"
}
```

### Transform
Applies data transformations.

```json
{
  "type": "transform",
  "transformations": [
    {
      "field": "amount",
      "operation": "round",
      "precision": 2
    },
    {
      "field": "date",
      "operation": "format",
      "targetFormat": "ISO8601"
    }
  ]
}
```

### Aggregate
Combines multiple records.

```json
{
  "type": "aggregate",
  "groupBy": ["account_id", "date"],
  "aggregations": [
    { "field": "amount", "function": "sum" },
    { "field": "count", "function": "count" }
  ]
}
```

## Pre-built Rulesets

### Bank Reconciliation
```json
{
  "name": "Bank Reconciliation",
  "description": "Standard bank statement reconciliation",
  "rules": [
    {
      "type": "composite_key",
      "sourceFields": ["reference", "amount", "date"],
      "targetFields": ["bank_ref", "bank_amount", "value_date"],
      "matchRules": [
        { "type": "exact_match", "index": 0 },
        { "type": "numeric_tolerance", "index": 1, "tolerance": 0.01 },
        { "type": "date_match", "index": 2, "toleranceDays": 3 }
      ]
    }
  ]
}
```

### Invoice Matching
```json
{
  "name": "Invoice Matching",
  "description": "Three-way invoice matching (PO, Receipt, Invoice)",
  "rules": [
    {
      "type": "exact_match",
      "sourceField": "po_number",
      "targetField": "purchase_order"
    },
    {
      "type": "numeric_tolerance",
      "sourceField": "invoice_amount",
      "targetField": "order_total",
      "tolerance": { "type": "percentage", "value": 2 }
    }
  ]
}
```

### Intercompany Reconciliation
```json
{
  "name": "Intercompany Reconciliation",
  "description": "Matches transactions between related entities",
  "rules": [
    {
      "type": "exact_match",
      "sourceField": "interco_ref",
      "targetField": "ic_reference"
    },
    {
      "type": "custom_expression",
      "expression": "source.debit_amount == target.credit_amount"
    }
  ]
}
```

## Configuration Examples

### Complete Ruleset Configuration

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Financial Transaction Reconciliation",
  "version": "2.0.0",
  "enabled": true,
  "priority": 1,
  "sources": {
    "primary": "internal_transactions",
    "secondary": "bank_statements"
  },
  "matching": {
    "strategy": "best_match",
    "maxCandidates": 10,
    "minimumConfidence": 0.75
  },
  "rules": [
    {
      "id": "rule-1",
      "name": "Primary Key Match",
      "priority": 1,
      "conditions": [
        {
          "type": "exact_match",
          "sourceField": "transaction_ref",
          "targetField": "bank_reference"
        }
      ],
      "actions": [
        { "type": "auto_match", "confidence": 1.0 }
      ]
    },
    {
      "id": "rule-2",
      "name": "Amount and Date Match",
      "priority": 2,
      "conditions": [
        {
          "type": "numeric_tolerance",
          "sourceField": "amount",
          "targetField": "bank_amount",
          "tolerance": { "type": "absolute", "value": 0.01 }
        },
        {
          "type": "date_match",
          "sourceField": "date",
          "targetField": "value_date",
          "toleranceDays": 5
        }
      ],
      "actions": [
        { "type": "auto_match", "confidence": 0.9 }
      ]
    },
    {
      "id": "rule-3",
      "name": "Fuzzy Description Match",
      "priority": 3,
      "conditions": [
        {
          "type": "fuzzy_match",
          "sourceField": "description",
          "targetField": "narrative",
          "threshold": 0.8
        }
      ],
      "actions": [
        { "type": "flag_for_review", "reason": "Fuzzy match" }
      ]
    }
  ],
  "exceptions": {
    "unmatchedSource": { "action": "flag", "priority": "high" },
    "unmatchedTarget": { "action": "flag", "priority": "medium" }
  },
  "metadata": {
    "createdBy": "admin@example.com",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastModified": "2024-01-15T10:30:00Z"
  }
}
```

## API Reference

### Create Ruleset
```http
POST /api/v2/rulesets
Content-Type: application/json

{
  "name": "My Ruleset",
  "description": "Custom reconciliation ruleset",
  "rules": [...]
}
```

### Update Ruleset
```http
PUT /api/v2/rulesets/{id}
Content-Type: application/json

{
  "enabled": false
}
```

### Execute Ruleset
```http
POST /api/v2/reconciliations/execute
Content-Type: application/json

{
  "rulesetId": "uuid",
  "sourceData": "data-source-id",
  "targetData": "target-source-id",
  "options": {
    "dryRun": false,
    "batchSize": 1000
  }
}
```

## Best Practices

1. **Start Simple**: Begin with exact match rules before adding fuzzy matching
2. **Set Appropriate Tolerances**: Review data quality to set realistic tolerances
3. **Prioritize Rules**: Order rules from most specific to least specific
4. **Test Thoroughly**: Use sample data to validate rules before production
5. **Monitor Performance**: Track match rates and adjust rules as needed
6. **Version Control**: Maintain version history of ruleset changes
7. **Document Exceptions**: Clearly document why specific rules exist
