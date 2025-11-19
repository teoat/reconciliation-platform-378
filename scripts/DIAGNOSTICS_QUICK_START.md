# Diagnostics Quick Start Guide

## 🚀 Quick Commands

### Run All Diagnostics
```bash
./scripts/run-all-diagnostics.sh all
```

### Run Specific Area
```bash
# Area 1: Dependencies
./scripts/run-all-diagnostics.sh 1

# Area 3: Security
./scripts/run-all-diagnostics.sh 3

# Area 4: Performance
./scripts/run-all-diagnostics.sh 4
```

### Run Special Diagnostics
```bash
# System health
./scripts/run-all-diagnostics.sh system

# Frontend E2E
./scripts/run-all-diagnostics.sh frontend

# OAuth
./scripts/run-all-diagnostics.sh oauth
```

## 📊 View Results

Results are saved to: `./diagnostic-results/[timestamp]/`

```bash
# View summary
cat diagnostic-results/*/SUMMARY.md

# View JSON report
cat diagnostic-results/*/diagnostic-results.json | jq '.'

# View specific diagnostic log
cat diagnostic-results/*/area-1.log
```

## 🎯 Diagnostic Areas

| # | Area | Script |
|---|------|--------|
| 1 | Dependency & Package Analysis | `diagnostic-1.sh` |
| 2 | Code Quality & Complexity | `diagnostic-2.sh` |
| 3 | Security Vulnerabilities | `diagnostic-3.sh` |
| 4 | Performance & Optimization | `diagnostic-4.sh` |
| 5 | Testing Coverage & Quality | `diagnostic-5.sh` |
| 6 | Dead Code Detection | `diagnostic-6.sh` |
| 7 | Import/Export Analysis | `diagnostic-7.sh` |
| 8 | Database & Schema Analysis | `diagnostic-8.sh` |
| 9 | API Consistency & Documentation | `diagnostic-9.sh` |
| 10 | Build & Bundle Analysis | `diagnostic-10.sh` |
| 11 | Git History & Code Churn | `diagnostic-11.sh` |
| 12 | Environment & Configuration | `diagnostic-12.sh` |
| 13 | Docker & Container Analysis | `diagnostic-13.sh` |
| 14 | License Compliance | `diagnostic-14.sh` |
| 15 | Accessibility Compliance | `diagnostic-15.sh` |

## ⚡ Quick Checks

```bash
# Security only
./scripts/run-all-diagnostics.sh 3

# Performance only
./scripts/run-all-diagnostics.sh 4

# Code quality only
./scripts/run-all-diagnostics.sh 2
```

## 📝 See Also

- [Diagnostic Implementation Complete](./DIAGNOSTIC_IMPLEMENTATION_COMPLETE.md)
- [Diagnostics README](./diagnostics/README.md)
- [Diagnostic Framework V1](../DIAGNOSTIC_FRAMEWORK_V1_COMPREHENSIVE.md)

