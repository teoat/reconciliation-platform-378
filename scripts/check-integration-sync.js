#!/usr/bin/env node
/**
 * Integration and Synchronization Checker
 * 
 * This script validates that all links and modules are properly integrated
 * and synchronized across the application.
 */

const fs = require('fs')
const path = require('path')

const results = []
const projectRoot = path.resolve(__dirname, '..')

function addResult(result) {
  results.push(result)
  const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠'
  console.log(`${icon} ${result.category}: ${result.check} - ${result.message}`)
  if (result.details && result.details.length > 0) {
    result.details.forEach(detail => console.log(`  → ${detail}`))
  }
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(projectRoot, filePath))
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf-8')
  } catch (error) {
    return ''
  }
}

// Extract exports from a TypeScript/JavaScript file
function extractExports(content) {
  const exports = []
  
  // Match named exports: export { X, Y } or export { default as X }
  const namedExportRegex = /export\s+\{\s*([^}]+)\s*\}/g
  let match
  while ((match = namedExportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => {
      const trimmed = n.trim()
      // Handle "default as Name" pattern
      const asMatch = trimmed.match(/default\s+as\s+(\w+)/)
      if (asMatch) {
        return asMatch[1]
      }
      // Handle "Name as Alias" pattern - use the alias
      const aliasMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/)
      if (aliasMatch) {
        return aliasMatch[2]
      }
      return trimmed
    })
    exports.push(...names)
  }
  
  // Match default exports: export default X
  const defaultExportRegex = /export\s+default\s+(\w+)/g
  while ((match = defaultExportRegex.exec(content)) !== null) {
    exports.push('default')
  }
  
  // Match export const/function/class
  const directExportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g
  while ((match = directExportRegex.exec(content)) !== null) {
    exports.push(match[1])
  }
  
  // Match re-exports: export * from './module'
  const reExportRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g
  while ((match = reExportRegex.exec(content)) !== null) {
    exports.push(`* from ${match[1]}`)
  }
  
  return exports
}

// Extract imports from a TypeScript/JavaScript file
function extractImports(content) {
  const imports = []
  
  // Match import statements
  const importRegex = /import\s+(?:\{([^}]+)\}|(\w+)|(\*\s+as\s+\w+))\s+from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    const items = match[1] ? match[1].split(',').map(i => i.trim()) : match[2] ? [match[2]] : [match[3] || '']
    const module = match[4]
    imports.push({ module, items })
  }
  
  return imports
}

// Check 1: Verify all page exports in app/pages/index.ts
function checkPageExports() {
  console.log('\n=== Checking Page Exports ===')
  
  const pagesIndexPath = 'app/pages/index.ts'
  if (!fileExists(pagesIndexPath)) {
    addResult({
      category: 'Page Exports',
      check: 'app/pages/index.ts exists',
      status: 'FAIL',
      message: 'File not found'
    })
    return
  }
  
  const content = readFile(pagesIndexPath)
  const exports = extractExports(content)
  
  const expectedPages = [
    'AuthPage',
    'ReconciliationPage',
    'ProjectSelectionPage',
    'IngestionPage',
    'AdjudicationPage',
    'VisualizationPage',
    'PresummaryPage',
    'CashflowEvaluationPage',
    'SummaryExportPage'
  ]
  
  const missingPages = expectedPages.filter(page => !exports.includes(page))
  
  if (missingPages.length === 0) {
    addResult({
      category: 'Page Exports',
      check: 'All expected pages exported',
      status: 'PASS',
      message: `All ${expectedPages.length} pages are exported`
    })
  } else {
    addResult({
      category: 'Page Exports',
      check: 'All expected pages exported',
      status: 'WARN',
      message: `${missingPages.length} pages not exported`,
      details: missingPages.map(p => `Missing: ${p}`)
    })
  }
}

// Check 2: Verify navigation links map to actual pages
function checkNavigationLinks() {
  console.log('\n=== Checking Navigation Links ===')
  
  const navigationPath = 'frontend/src/components/layout/Navigation.tsx'
  if (!fileExists(navigationPath)) {
    addResult({
      category: 'Navigation',
      check: 'Navigation component exists',
      status: 'FAIL',
      message: 'File not found'
    })
    return
  }
  
  const content = readFile(navigationPath)
  
  // Extract navigation items from the file
  const navItemsMatch = content.match(/navigationItems\s*=\s*\[([\s\S]*?)\]/m)
  if (!navItemsMatch) {
    addResult({
      category: 'Navigation',
      check: 'navigationItems array found',
      status: 'WARN',
      message: 'Could not find navigationItems array in Navigation.tsx'
    })
    return
  }
  
  // Extract paths from navigation items
  const pathMatches = navItemsMatch[1].matchAll(/path:\s*['"]([^'"]+)['"]/g)
  const paths = Array.from(pathMatches).map(m => m[1])
  
  addResult({
    category: 'Navigation',
    check: 'Navigation items found',
    status: 'PASS',
    message: `Found ${paths.length} navigation items`,
    details: paths.map(p => `Path: ${p}`)
  })
}

// Check 3: Verify page.tsx imports all required components
function checkMainPageImports() {
  console.log('\n=== Checking Main Page Imports ===')
  
  const pagePath = 'app/page.tsx'
  if (!fileExists(pagePath)) {
    addResult({
      category: 'Main Page',
      check: 'app/page.tsx exists',
      status: 'FAIL',
      message: 'File not found'
    })
    return
  }
  
  const content = readFile(pagePath)
  const imports = extractImports(content)
  
  const pageImports = imports.find(imp => imp.module === './pages')
  
  if (!pageImports) {
    addResult({
      category: 'Main Page',
      check: 'Pages imported',
      status: 'FAIL',
      message: 'No imports from ./pages found'
    })
    return
  }
  
  const expectedPages = [
    'AuthPage',
    'ProjectSelectionPage',
    'IngestionPage',
    'ReconciliationPage',
    'AdjudicationPage',
    'VisualizationPage',
    'PresummaryPage',
    'CashflowEvaluationPage',
    'SummaryExportPage'
  ]
  
  // Check if pages are used in the switch statement
  const switchMatch = content.match(/switch\s*\(currentPage\)\s*\{([\s\S]*?)\}/m)
  if (!switchMatch) {
    addResult({
      category: 'Main Page',
      check: 'Page routing logic',
      status: 'WARN',
      message: 'Could not find switch statement for page routing'
    })
    return
  }
  
  const switchContent = switchMatch[1]
  const usedPages = expectedPages.filter(page => switchContent.includes(page))
  
  addResult({
    category: 'Main Page',
    check: 'Page components used in routing',
    status: 'PASS',
    message: `${usedPages.length}/${expectedPages.length} pages used in routing`,
    details: usedPages.map(p => `Used: ${p}`)
  })
}

// Check 4: Verify service exports are consistent
function checkServiceExports() {
  console.log('\n=== Checking Service Exports ===')
  
  const servicesIndexPath = 'frontend/src/services/index.ts'
  if (!fileExists(servicesIndexPath)) {
    addResult({
      category: 'Services',
      check: 'services/index.ts exists',
      status: 'FAIL',
      message: 'File not found'
    })
    return
  }
  
  const content = readFile(servicesIndexPath)
  const exports = extractExports(content)
  
  const expectedServices = [
    'apiClient',
    'BaseService',
    'ErrorService',
    'DataService'
  ]
  
  const foundServices = expectedServices.filter(service => 
    exports.some(exp => exp.includes(service))
  )
  
  addResult({
    category: 'Services',
    check: 'Core services exported',
    status: foundServices.length === expectedServices.length ? 'PASS' : 'WARN',
    message: `${foundServices.length}/${expectedServices.length} core services exported`,
    details: foundServices.map(s => `Exported: ${s}`)
  })
}

// Check 5: Verify component exports
function checkComponentExports() {
  console.log('\n=== Checking Component Exports ===')
  
  const componentsIndexPath = 'frontend/src/components/index.tsx'
  if (!fileExists(componentsIndexPath)) {
    addResult({
      category: 'Components',
      check: 'components/index.tsx exists',
      status: 'FAIL',
      message: 'File not found'
    })
    return
  }
  
  const content = readFile(componentsIndexPath)
  const exports = extractExports(content)
  
  addResult({
    category: 'Components',
    check: 'Component exports found',
    status: 'PASS',
    message: `Found ${exports.length} component exports`
  })
  
  const expectedComponents = ['Button', 'Input', 'Card', 'Navigation']
  const foundComponents = expectedComponents.filter(comp => exports.includes(comp))
  
  addResult({
    category: 'Components',
    check: 'Core UI components exported',
    status: foundComponents.length === expectedComponents.length ? 'PASS' : 'WARN',
    message: `${foundComponents.length}/${expectedComponents.length} core UI components found`,
    details: foundComponents.map(c => `Found: ${c}`)
  })
}

// Check 6: Verify integration services
function checkIntegrationServices() {
  console.log('\n=== Checking Integration Services ===')
  
  const integrationPath = 'frontend/src/services/integration.ts'
  if (!fileExists(integrationPath)) {
    addResult({
      category: 'Integration',
      check: 'integration.ts exists',
      status: 'FAIL',
      message: 'File not found'
    })
    return
  }
  
  const content = readFile(integrationPath)
  const exports = extractExports(content)
  
  const expectedClasses = ['IntegrationService', 'ProjectExportService', 'APIService']
  const foundClasses = expectedClasses.filter(cls => exports.includes(cls))
  
  addResult({
    category: 'Integration',
    check: 'Integration services exported',
    status: foundClasses.length === expectedClasses.length ? 'PASS' : 'WARN',
    message: `${foundClasses.length}/${expectedClasses.length} integration services found`,
    details: foundClasses.map(c => `Found: ${c}`)
  })
  
  // Check for key methods
  const hasSyncMethods = content.includes('syncWithCalendar') && 
                        content.includes('sendSlackNotification') &&
                        content.includes('sendEmailNotification')
  
  addResult({
    category: 'Integration',
    check: 'Sync methods implemented',
    status: hasSyncMethods ? 'PASS' : 'FAIL',
    message: hasSyncMethods ? 'All sync methods found' : 'Some sync methods missing'
  })
}

// Check 7: Verify app/index.ts exports
function checkAppExports() {
  console.log('\n=== Checking App Exports ===')
  
  const appIndexPath = 'app/index.ts'
  if (!fileExists(appIndexPath)) {
    addResult({
      category: 'App',
      check: 'app/index.ts exists',
      status: 'FAIL',
      message: 'File not found'
    })
    return
  }
  
  const content = readFile(appIndexPath)
  const exports = extractExports(content)
  
  const expectedExports = ['Navigation', 'DataProvider', 'FrenlyProvider', 'FrenlyAI']
  const foundExports = expectedExports.filter(exp => exports.includes(exp))
  
  addResult({
    category: 'App',
    check: 'Core app exports',
    status: foundExports.length === expectedExports.length ? 'PASS' : 'WARN',
    message: `${foundExports.length}/${expectedExports.length} core exports found`,
    details: foundExports.map(e => `Found: ${e}`)
  })
}

// Check 8: Verify route splitting configuration
function checkRouteSplitting() {
  console.log('\n=== Checking Route Splitting ===')
  
  const routePath = 'frontend/src/utils/routeSplitting.tsx'
  if (!fileExists(routePath)) {
    addResult({
      category: 'Routing',
      check: 'routeSplitting.tsx exists',
      status: 'WARN',
      message: 'Route splitting configuration not found'
    })
    return
  }
  
  const content = readFile(routePath)
  
  // Check for lazy loading setup
  const hasLazyLoading = content.includes('createLazyRoute') || content.includes('lazy(')
  
  addResult({
    category: 'Routing',
    check: 'Lazy loading configured',
    status: hasLazyLoading ? 'PASS' : 'WARN',
    message: hasLazyLoading ? 'Lazy loading is configured' : 'Lazy loading not detected'
  })
  
  // Check for preload functions
  const hasPreloadFunctions = content.includes('preloadCoreRoutes') &&
                              content.includes('preloadReconciliationRoutes')
  
  addResult({
    category: 'Routing',
    check: 'Preload functions available',
    status: hasPreloadFunctions ? 'PASS' : 'WARN',
    message: hasPreloadFunctions ? 'Route preloading is available' : 'Preload functions not found'
  })
}

// Generate summary report
function generateSummary() {
  console.log('\n' + '='.repeat(80))
  console.log('=== INTEGRATION & SYNCHRONIZATION CHECK SUMMARY ===')
  console.log('='.repeat(80))
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warnings = results.filter(r => r.status === 'WARN').length
  
  console.log(`\nTotal Checks: ${results.length}`)
  console.log(`✓ Passed: ${passed}`)
  console.log(`✗ Failed: ${failed}`)
  console.log(`⚠ Warnings: ${warnings}`)
  
  if (failed > 0) {
    console.log('\n❌ INTEGRATION CHECK FAILED')
    console.log('\nFailed checks:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.category}: ${r.check} - ${r.message}`)
    })
  } else if (warnings > 0) {
    console.log('\n⚠️  INTEGRATION CHECK COMPLETED WITH WARNINGS')
    console.log('\nWarnings:')
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  - ${r.category}: ${r.check} - ${r.message}`)
    })
  } else {
    console.log('\n✅ ALL INTEGRATION CHECKS PASSED')
  }
  
  return failed === 0
}

// Main execution
function main() {
  console.log('Integration and Synchronization Checker')
  console.log('=' .repeat(80))
  console.log(`Project Root: ${projectRoot}`)
  
  // Run all checks
  checkPageExports()
  checkNavigationLinks()
  checkMainPageImports()
  checkServiceExports()
  checkComponentExports()
  checkIntegrationServices()
  checkAppExports()
  checkRouteSplitting()
  
  // Generate summary
  const success = generateSummary()
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1)
}

// Run the checker
main()
