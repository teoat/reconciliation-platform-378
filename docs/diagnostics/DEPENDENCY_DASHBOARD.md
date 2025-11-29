# Dependency Health Dashboard

**Last Updated**: 2025-01-15  
**Status**: Active  
**Purpose**: Central dashboard for dependency health metrics

---

## Quick Status

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Circular Dependencies | 0 | 0 | ✅ Healthy |
| Max Dependency Depth | < 5 | < 5 | ✅ Healthy |
| Module Boundary Violations | 0 | 0 | ✅ Healthy |
| High-Coupling Modules | TBD | < 5 | 🔄 Monitoring |

---

## Recent Reports

- [Latest Dependency Health Report](./dependency-reports/dependency-health-$(date +%Y-%m-%d).md)
- [Latest Coupling Analysis](./dependency-reports/coupling-analysis-$(date +%Y-%m-%d).md)
- [Dependency Graph](./dependency-graphs/dependency-graph.svg)

---

## Commands

```bash
# Generate latest report
npm run deps:report

# Monitor for alerts
npm run deps:monitor

# Analyze coupling
npm run deps:coupling

# Check circular dependencies
npm run deps:circular
```

---

## Automated Monitoring

- **Weekly Reports**: Generated every Monday via GitHub Actions
- **Pre-Commit Checks**: Validates dependencies before each commit
- **CI/CD Integration**: Runs on every PR
- **Alerts**: Triggered on violations

---

## Related Documentation

- [Dependency Architecture](../architecture/DEPENDENCY_ARCHITECTURE.md)
- [Dependency Management Guide](../development/DEPENDENCY_MANAGEMENT.md)
- [Circular Dependencies Report](./CIRCULAR_DEPENDENCIES_REPORT.md)

---

**Last Updated**: 2025-01-15

