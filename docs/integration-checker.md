# Integration and Synchronization Checker

## Overview

The Integration and Synchronization Checker is a comprehensive validation tool that ensures all links and modules in the reconciliation platform are properly integrated and synchronized.

## Purpose

This tool validates:
- ✅ Page component exports and imports
- ✅ Navigation links map to actual pages
- ✅ Service exports are consistent
- ✅ Component exports are available
- ✅ Integration services are properly connected
- ✅ Route splitting is configured correctly
- ✅ Module consistency across the application

## Usage

### Running the Checker

You can run the integration checker in multiple ways:

#### Via NPM Script (Recommended)
```bash
npm run check:integration
```

#### Direct Execution
```bash
node scripts/check-integration-sync.js
```

#### As Part of Tests
The integration checks are also available as Jest tests:
```bash
npm test -- __tests__/integration/link-module-sync.test.ts
```

## What It Checks

### 1. Page Exports
- Verifies `app/pages/index.ts` exists
- Confirms all expected page components are exported:
  - AuthPage
  - ReconciliationPage
  - ProjectSelectionPage
  - IngestionPage
  - AdjudicationPage
  - VisualizationPage
  - PresummaryPage
  - CashflowEvaluationPage
  - SummaryExportPage

### 2. Navigation Links
- Validates Navigation component exists
- Checks navigation items are properly defined
- Verifies key paths:
  - `/` (home)
  - `/projects`
  - `/reconciliation`
  - `/analytics`
  - `/users`
  - `/settings`

### 3. Main Page Routing
- Confirms `app/page.tsx` exists
- Verifies page components are imported
- Validates routing logic with switch statement
- Ensures route cases match navigation paths

### 4. Service Exports
- Checks `frontend/src/services/index.ts` exists
- Validates core services are exported:
  - apiClient
  - BaseService
  - ErrorService
  - DataService

### 5. Component Exports
- Verifies `frontend/src/components/index.tsx` exists
- Confirms core UI components are exported:
  - Button
  - Input
  - Card
  - Navigation

### 6. Integration Services
- Validates `frontend/src/services/integration.ts` exists
- Checks integration service classes:
  - IntegrationService
  - ProjectExportService
  - APIService
- Verifies synchronization methods:
  - syncWithCalendar
  - sendSlackNotification
  - sendEmailNotification

### 7. App Exports
- Confirms `app/index.ts` exists
- Validates core app components:
  - Navigation
  - DataProvider
  - FrenlyProvider
  - FrenlyAI

### 8. Route Splitting
- Verifies `frontend/src/utils/routeSplitting.tsx` exists
- Checks lazy loading configuration
- Validates preload functions:
  - preloadCoreRoutes
  - preloadReconciliationRoutes
  - preloadIngestionRoutes
  - preloadAnalyticsRoutes
  - preloadSettingsRoutes
  - preloadAdminRoutes

## Output

The checker provides detailed output with three status levels:

- ✓ **PASS**: Check completed successfully
- ✗ **FAIL**: Critical issue that needs immediate attention
- ⚠ **WARN**: Non-critical issue that should be reviewed

### Example Output

```
Integration and Synchronization Checker
================================================================================
Project Root: /path/to/project

=== Checking Page Exports ===
✓ Page Exports: All expected pages exported - All 9 pages are exported

=== Checking Navigation Links ===
✓ Navigation: Navigation items found - Found 6 navigation items
  → Path: /
  → Path: /projects
  → Path: /reconciliation
  ...

================================================================================
=== INTEGRATION & SYNCHRONIZATION CHECK SUMMARY ===
================================================================================

Total Checks: 11
✓ Passed: 11
✗ Failed: 0
⚠ Warnings: 0

✅ ALL INTEGRATION CHECKS PASSED
```

## Integration with CI/CD

Add this check to your continuous integration pipeline:

```yaml
# .github/workflows/integration-check.yml
name: Integration Check

on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run check:integration
```

## Troubleshooting

### Common Issues

#### Missing Page Exports
**Error**: "2 pages not exported"
**Solution**: Ensure all page components are properly exported in `app/pages/index.ts`

#### Navigation Links Not Found
**Error**: "Could not find navigationItems array"
**Solution**: Verify `frontend/src/components/layout/Navigation.tsx` has the `navigationItems` array defined

#### Service Exports Missing
**Error**: "Core services not exported"
**Solution**: Check `frontend/src/services/index.ts` exports all required services

#### Circular Dependencies
**Error**: Tests failing due to circular dependencies
**Solution**: Review module imports and use dependency injection where needed

## Best Practices

1. **Run Before Committing**: Always run the integration checker before committing changes
2. **Fix Warnings**: Don't ignore warnings - they can indicate design issues
3. **Update Tests**: When adding new pages or modules, update the checker expectations
4. **Document Changes**: If you add new integration points, document them in this file

## Extending the Checker

To add new checks:

1. Add a new function in `scripts/check-integration-sync.js`:
```javascript
function checkNewFeature() {
  console.log('\n=== Checking New Feature ===')
  // Your validation logic
  addResult({
    category: 'New Feature',
    check: 'Feature validation',
    status: 'PASS',
    message: 'Feature is properly configured'
  })
}
```

2. Call it in the `main()` function
3. Update this documentation
4. Add corresponding Jest tests in `__tests__/integration/link-module-sync.test.ts`

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Testing Strategy](./testing.md)

## Support

For issues or questions about the integration checker:
1. Check this documentation first
2. Review the source code in `scripts/check-integration-sync.js`
3. Create an issue in the repository
4. Contact the development team

## Changelog

### v1.0.0 (2025-11-06)
- Initial release
- Comprehensive integration checking for pages, navigation, services, and components
- Support for export pattern detection including `export { default as X }`
- Detailed reporting with pass/fail/warn status
- Integration with npm scripts and Jest tests
