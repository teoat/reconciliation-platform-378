/**
 * Integration and Module Synchronization Tests
 * 
 * These tests validate that all links and modules are properly integrated
 * and synchronized across the application.
 */

import * as fs from 'fs'
import * as path from 'path'

const projectRoot = path.resolve(__dirname, '../..')

// Helper function to check if file exists
function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, filePath))
}

// Helper function to read file content
function readFile(filePath: string): string {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf-8')
  } catch (error) {
    return ''
  }
}

// Helper function to extract exports
function extractExports(content: string): string[] {
  const exports: string[] = []
  
  // Match named exports with "default as Name" pattern
  const namedExportRegex = /export\s+\{\s*([^}]+)\s*\}/g
  let match
  while ((match = namedExportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => {
      const trimmed = n.trim()
      const asMatch = trimmed.match(/default\s+as\s+(\w+)/)
      if (asMatch) {
        return asMatch[1]
      }
      const aliasMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/)
      if (aliasMatch) {
        return aliasMatch[2]
      }
      return trimmed
    })
    exports.push(...names)
  }
  
  // Match export const/function/class
  const directExportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g
  while ((match = directExportRegex.exec(content)) !== null) {
    exports.push(match[1])
  }
  
  return exports
}

describe('Integration and Module Synchronization', () => {
  describe('Page Exports', () => {
    it('should have app/pages/index.ts file', () => {
      expect(fileExists('app/pages/index.ts')).toBe(true)
    })

    it('should export all required page components', () => {
      const content = readFile('app/pages/index.ts')
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
      
      expectedPages.forEach(page => {
        expect(exports).toContain(page)
      })
    })
  })

  describe('Navigation Links', () => {
    it('should have Navigation component', () => {
      expect(fileExists('frontend/src/components/layout/Navigation.tsx')).toBe(true)
    })

    it('should define navigation items with paths', () => {
      const content = readFile('frontend/src/components/layout/Navigation.tsx')
      
      expect(content).toContain('navigationItems')
      expect(content).toContain('path:')
      
      // Verify key navigation paths exist
      expect(content).toContain("path: '/'")
      expect(content).toContain("path: '/projects'")
      expect(content).toContain("path: '/reconciliation'")
    })
  })

  describe('Main Page Routing', () => {
    it('should have app/page.tsx file', () => {
      expect(fileExists('app/page.tsx')).toBe(true)
    })

    it('should import page components', () => {
      const content = readFile('app/page.tsx')
      
      expect(content).toContain("from './pages'")
      
      // Verify key page imports
      expect(content).toContain('AuthPage')
      expect(content).toContain('ProjectSelectionPage')
      expect(content).toContain('ReconciliationPage')
    })

    it('should have routing logic for pages', () => {
      const content = readFile('app/page.tsx')
      
      expect(content).toContain('switch')
      expect(content).toContain('currentPage')
      
      // Verify key routing cases
      expect(content).toMatch(/case\s+['"]projects['"]:/)
      expect(content).toMatch(/case\s+['"]reconciliation['"]:/)
    })
  })

  describe('Service Exports', () => {
    it('should have services/index.ts file', () => {
      expect(fileExists('frontend/src/services/index.ts')).toBe(true)
    })

    it('should export core services', () => {
      const content = readFile('frontend/src/services/index.ts')
      const exports = extractExports(content)
      
      const expectedServices = [
        'apiClient',
        'BaseService',
        'ErrorService',
        'DataService'
      ]
      
      expectedServices.forEach(service => {
        expect(exports.some(exp => exp.includes(service))).toBe(true)
      })
    })
  })

  describe('Component Exports', () => {
    it('should have components/index.tsx file', () => {
      expect(fileExists('frontend/src/components/index.tsx')).toBe(true)
    })

    it('should export core UI components', () => {
      const content = readFile('frontend/src/components/index.tsx')
      const exports = extractExports(content)
      
      const expectedComponents = ['Button', 'Input', 'Card', 'Navigation']
      
      expectedComponents.forEach(component => {
        expect(exports).toContain(component)
      })
    })
  })

  describe('Integration Services', () => {
    it('should have integration.ts file', () => {
      expect(fileExists('frontend/src/services/integration.ts')).toBe(true)
    })

    it('should export integration service classes', () => {
      const content = readFile('frontend/src/services/integration.ts')
      const exports = extractExports(content)
      
      const expectedClasses = ['IntegrationService', 'ProjectExportService', 'APIService']
      
      expectedClasses.forEach(cls => {
        expect(exports).toContain(cls)
      })
    })

    it('should implement synchronization methods', () => {
      const content = readFile('frontend/src/services/integration.ts')
      
      // Check for key sync methods
      expect(content).toContain('syncWithCalendar')
      expect(content).toContain('sendSlackNotification')
      expect(content).toContain('sendEmailNotification')
    })

    it('should define integration interfaces', () => {
      const content = readFile('frontend/src/services/integration.ts')
      
      expect(content).toContain('interface ExportOptions')
      expect(content).toContain('interface IntegrationConfig')
      expect(content).toContain('interface SyncResult')
    })
  })

  describe('App Exports', () => {
    it('should have app/index.ts file', () => {
      expect(fileExists('app/index.ts')).toBe(true)
    })

    it('should export core app components', () => {
      const content = readFile('app/index.ts')
      const exports = extractExports(content)
      
      const expectedExports = ['Navigation', 'DataProvider', 'FrenlyProvider', 'FrenlyAI']
      
      expectedExports.forEach(exp => {
        expect(exports).toContain(exp)
      })
    })

    it('should re-export pages', () => {
      const content = readFile('app/index.ts')
      
      expect(content).toContain("export * from './pages'")
    })
  })

  describe('Route Splitting', () => {
    it('should have routeSplitting.tsx file', () => {
      expect(fileExists('frontend/src/utils/routeSplitting.tsx')).toBe(true)
    })

    it('should implement lazy loading', () => {
      const content = readFile('frontend/src/utils/routeSplitting.tsx')
      
      expect(content.includes('createLazyRoute') || content.includes('lazy(')).toBe(true)
    })

    it('should provide preload functions', () => {
      const content = readFile('frontend/src/utils/routeSplitting.tsx')
      
      expect(content).toContain('preloadCoreRoutes')
      expect(content).toContain('preloadReconciliationRoutes')
    })
  })

  describe('Module Consistency', () => {
    it('should have consistent index files for all major modules', () => {
      const indexFiles = [
        'app/index.ts',
        'app/pages/index.ts',
        'frontend/src/components/index.tsx',
        'frontend/src/services/index.ts',
        'frontend/src/hooks/index.ts',
        'frontend/src/utils/index.ts'
      ]
      
      indexFiles.forEach(file => {
        expect(fileExists(file)).toBe(true)
      })
    })

    it('should not have circular dependencies in core modules', () => {
      // This is a basic check - in a real scenario, you'd use a tool like madge
      const servicesContent = readFile('frontend/src/services/index.ts')
      const componentsContent = readFile('frontend/src/components/index.tsx')
      
      // Services should not import from components
      expect(servicesContent.includes("from '../components")).toBe(false)
      
      // This test passes if no circular dependency is detected
      expect(true).toBe(true)
    })
  })

  describe('Link Validation', () => {
    it('should have navigation links that correspond to actual routes', () => {
      const navContent = readFile('frontend/src/components/layout/Navigation.tsx')
      const pageContent = readFile('app/page.tsx')
      
      // Extract navigation paths
      const navItemsMatch = navContent.match(/navigationItems\s*=\s*\[([\s\S]*?)\]/m)
      expect(navItemsMatch).not.toBeNull()
      
      if (navItemsMatch) {
        const paths = Array.from(navItemsMatch[1].matchAll(/path:\s*['"]([^'"]+)['"]/g)).map(m => m[1])
        
        // Verify main routes exist in page.tsx
        const mainRoutes = paths.filter(p => p !== '/')
        mainRoutes.forEach(route => {
          const routeName = route.replace('/', '')
          // Check if route is mentioned in the routing logic
          const hasRoute = pageContent.includes(`'${routeName}'`) || pageContent.includes(`"${routeName}"`)
          expect(hasRoute).toBe(true)
        })
      }
    })
  })
})
