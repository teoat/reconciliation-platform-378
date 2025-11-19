# Diagnostic Scripts

This directory contains individual diagnostic scripts for each of the 15 diagnostic areas defined in the Diagnostic Framework V1.

## Available Diagnostics

1. **diagnostic-1.sh** - Dependency & Package Analysis
2. **diagnostic-2.sh** - Code Quality & Complexity
3. **diagnostic-3.sh** - Security Vulnerabilities
4. **diagnostic-4.sh** - Performance & Optimization
5. **diagnostic-5.sh** - Testing Coverage & Quality
6. **diagnostic-6.sh** - Dead Code Detection
7. **diagnostic-7.sh** - Import/Export Analysis
8. **diagnostic-8.sh** - Database & Schema Analysis
9. **diagnostic-9.sh** - API Consistency & Documentation
10. **diagnostic-10.sh** - Build & Bundle Analysis
11. **diagnostic-11.sh** - Git History & Code Churn
12. **diagnostic-12.sh** - Environment & Configuration
13. **diagnostic-13.sh** - Docker & Container Analysis
14. **diagnostic-14.sh** - License Compliance
15. **diagnostic-15.sh** - Accessibility Compliance

## Usage

### Run Individual Diagnostic

```bash
# Run a specific diagnostic
./scripts/diagnostics/diagnostic-1.sh

# Or use the master runner
./scripts/run-all-diagnostics.sh 1
```

### Run All Diagnostics

```bash
# Run all 15 diagnostics
./scripts/run-all-diagnostics.sh all
```

### Run Specific Area

```bash
# Run system health check
./scripts/run-all-diagnostics.sh system

# Run frontend E2E tests
./scripts/run-all-diagnostics.sh frontend

# Run OAuth diagnostic
./scripts/run-all-diagnostics.sh oauth
```

## Output

Each diagnostic script:
- Outputs results to JSON format
- Logs progress and findings
- Returns appropriate exit codes
- Can be run independently or via master runner

## Integration

All diagnostics are integrated into the master diagnostic runner (`scripts/run-all-diagnostics.sh`) which:
- Orchestrates all diagnostic scripts
- Aggregates results into a single JSON report
- Generates summary reports
- Tracks execution time per diagnostic

