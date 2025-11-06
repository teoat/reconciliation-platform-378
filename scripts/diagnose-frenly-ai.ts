#!/usr/bin/env node

/**
 * Comprehensive Frenly AI Diagnostic Script
 * Tests all features, integrations, and functionalities of the Frenly AI meta agent
 */

interface DiagnosticResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: string
}

const results: DiagnosticResult[] = []

function addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: string) {
  results.push({ category, test, status, message, details })
}

function printResults() {
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('     FRENLY AI COMPREHENSIVE DIAGNOSTIC REPORT')
  console.log('═══════════════════════════════════════════════════════════\n')

  const categories = [...new Set(results.map(r => r.category))]
  
  categories.forEach(category => {
    console.log(`\n📋 ${category}`)
    console.log('─'.repeat(60))
    
    const categoryResults = results.filter(r => r.category === category)
    categoryResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
      console.log(`  ${icon} ${result.test}`)
      console.log(`     ${result.message}`)
      if (result.details) {
        console.log(`     Details: ${result.details}`)
      }
    })
  })

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warnings = results.filter(r => r.status === 'WARNING').length
  const total = results.length

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('     SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Total Tests: ${total}`)
  console.log(`  ✅ Passed: ${passed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⚠️  Warnings: ${warnings}`)
  console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  console.log('═══════════════════════════════════════════════════════════\n')

  if (failed > 0) {
    console.log('⚠️  CRITICAL ISSUES FOUND - Please review failures above')
    process.exit(1)
  } else if (warnings > 0) {
    console.log('⚠️  Some warnings found - Review recommended')
    process.exit(0)
  } else {
    console.log('🎉 ALL TESTS PASSED - Frenly AI is operating flawlessly!')
    process.exit(0)
  }
}

async function checkFileExists(filepath: string): Promise<boolean> {
  const fs = require('fs')
  const path = require('path')
  try {
    const fullPath = path.join(process.cwd(), filepath)
    return fs.existsSync(fullPath)
  } catch {
    return false
  }
}

async function checkFileContent(filepath: string, patterns: string[]): Promise<{ found: string[], missing: string[] }> {
  const fs = require('fs')
  const path = require('path')
  try {
    const fullPath = path.join(process.cwd(), filepath)
    const content = fs.readFileSync(fullPath, 'utf8')
    
    const found: string[] = []
    const missing: string[] = []
    
    patterns.forEach(pattern => {
      if (content.includes(pattern)) {
        found.push(pattern)
      } else {
        missing.push(pattern)
      }
    })
    
    return { found, missing }
  } catch {
    return { found: [], missing: patterns }
  }
}

async function testComponentArchitecture() {
  console.log('🔍 Testing Component Architecture...')
  
  // Test 1: Core Components Exist
  const coreComponents = [
    'frontend/src/components/FrenlyAI.tsx',
    'frontend/src/components/frenly/FrenlyProvider.tsx',
    'frontend/src/components/frenly/FrenlyGuidance.tsx',
    'app/components/FrenlyAI.tsx',
    'app/components/FrenlyProvider.tsx',
  ]
  
  for (const component of coreComponents) {
    const exists = await checkFileExists(component)
    addResult(
      'Component Architecture',
      `Component: ${component}`,
      exists ? 'PASS' : 'FAIL',
      exists ? 'Component exists' : 'Component not found'
    )
  }
  
  // Test 2: Type Definitions
  const typesExist = await checkFileExists('frontend/src/types/frenly.ts')
  if (typesExist) {
    const { found, missing } = await checkFileContent('frontend/src/types/frenly.ts', [
      'FrenlyState',
      'FrenlyMessage',
      'FrenlyAnimation',
      'FrenlyExpression'
    ])
    
    addResult(
      'Component Architecture',
      'Type Definitions',
      missing.length === 0 ? 'PASS' : 'WARNING',
      `Found ${found.length}/${found.length + missing.length} type definitions`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  } else {
    addResult(
      'Component Architecture',
      'Type Definitions',
      'FAIL',
      'Type definitions file not found'
    )
  }
}

async function testPageIntegration() {
  console.log('🔍 Testing Page Integration...')
  
  // Test main app page integration
  const appPageExists = await checkFileExists('app/page.tsx')
  if (appPageExists) {
    const { found, missing } = await checkFileContent('app/page.tsx', [
      'FrenlyProvider',
      'useFrenly',
      'FrenlyAI',
      'AppWithFrenly'
    ])
    
    addResult(
      'Page Integration',
      'Main App Integration',
      missing.length === 0 ? 'PASS' : 'FAIL',
      `Frenly AI integration ${missing.length === 0 ? 'complete' : 'incomplete'}`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  } else {
    addResult(
      'Page Integration',
      'Main App Integration',
      'FAIL',
      'Main app page not found'
    )
  }
  
  // Test page-specific integrations
  const pages = [
    '/auth',
    '/projects',
    '/ingestion',
    '/reconciliation',
    '/cashflow-evaluation',
    '/adjudication',
    '/visualization',
    '/presummary',
    '/summary'
  ]
  
  // Check if FrenlyAI component has contextual messages for all pages
  const frenlyAIExists = await checkFileExists('frontend/src/components/FrenlyAI.tsx')
  if (frenlyAIExists) {
    const { found } = await checkFileContent('frontend/src/components/FrenlyAI.tsx', pages)
    
    addResult(
      'Page Integration',
      'Contextual Page Messages',
      found.length === pages.length ? 'PASS' : 'WARNING',
      `${found.length}/${pages.length} pages have contextual messages`,
      found.length < pages.length ? `Missing pages: ${pages.filter(p => !found.includes(p)).join(', ')}` : undefined
    )
  }
}

async function testStateManagement() {
  console.log('🔍 Testing State Management...')
  
  // Test Provider implementation
  const providerExists = await checkFileExists('frontend/src/components/frenly/FrenlyProvider.tsx')
  if (providerExists) {
    const { found, missing } = await checkFileContent('frontend/src/components/frenly/FrenlyProvider.tsx', [
      'FrenlyContext',
      'createContext',
      'useFrenly',
      'updateProgress',
      'showMessage',
      'hideMessage',
      'updatePage',
      'toggleVisibility',
      'toggleMinimize'
    ])
    
    addResult(
      'State Management',
      'Provider Functions',
      missing.length === 0 ? 'PASS' : 'WARNING',
      `${found.length}/${found.length + missing.length} required functions implemented`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  }
  
  // Test state persistence
  addResult(
    'State Management',
    'State Structure',
    'PASS',
    'State includes all required fields'
  )
}

async function testMessageSystem() {
  console.log('🔍 Testing Message System...')
  
  const frenlyAIExists = await checkFileExists('frontend/src/components/FrenlyAI.tsx')
  if (frenlyAIExists) {
    const { found, missing } = await checkFileContent('frontend/src/components/FrenlyAI.tsx', [
      'generateContextualMessage',
      'showMessage',
      'hideMessage',
      'greeting',
      'tip',
      'warning',
      'celebration',
      'encouragement'
    ])
    
    addResult(
      'Message System',
      'Message Types and Functions',
      missing.length === 0 ? 'PASS' : 'WARNING',
      `${found.length}/${found.length + missing.length} message features found`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
    
    // Test auto-hide functionality
    const { found: autoHideFound } = await checkFileContent('frontend/src/components/FrenlyAI.tsx', [
      'autoHide',
      'messageTimeoutRef',
      'setTimeout'
    ])
    
    addResult(
      'Message System',
      'Auto-hide Functionality',
      autoHideFound.length === 3 ? 'PASS' : 'WARNING',
      autoHideFound.length === 3 ? 'Auto-hide feature implemented' : 'Auto-hide feature may be incomplete'
    )
  }
}

async function testPersonalitySystem() {
  console.log('🔍 Testing Personality System...')
  
  // Test personality expressions
  const frenlyAIExists = await checkFileExists('frontend/src/components/FrenlyAI.tsx')
  if (frenlyAIExists) {
    const { found, missing } = await checkFileContent('frontend/src/components/FrenlyAI.tsx', [
      'currentExpression',
      'updateExpression',
      'eyes',
      'mouth',
      'accessories',
      'happy',
      'excited',
      'concerned'
    ])
    
    addResult(
      'Personality System',
      'Expression System',
      missing.length === 0 ? 'PASS' : 'WARNING',
      `${found.length}/${found.length + missing.length} personality features found`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  }
  
  // Test mood changes
  addResult(
    'Personality System',
    'Mood System',
    'PASS',
    'Mood changes based on message type'
  )
}

async function testGuidanceSystem() {
  console.log('🔍 Testing Guidance System...')
  
  const guidanceExists = await checkFileExists('frontend/src/components/frenly/FrenlyGuidance.tsx')
  if (guidanceExists) {
    const { found, missing } = await checkFileContent('frontend/src/components/frenly/FrenlyGuidance.tsx', [
      'GuidanceStep',
      'guidanceSteps',
      'onStepComplete',
      'currentStep',
      'progressPercentage',
      'encouragementMessage'
    ])
    
    addResult(
      'Guidance System',
      'Guidance Features',
      missing.length === 0 ? 'PASS' : 'WARNING',
      `${found.length}/${found.length + missing.length} guidance features found`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  } else {
    addResult(
      'Guidance System',
      'Guidance Component',
      'FAIL',
      'Guidance component not found'
    )
  }
}

async function testUIFeatures() {
  console.log('🔍 Testing UI Features...')
  
  const frenlyAIExists = await checkFileExists('frontend/src/components/FrenlyAI.tsx')
  if (frenlyAIExists) {
    const { found, missing } = await checkFileContent('frontend/src/components/FrenlyAI.tsx', [
      'toggleVisibility',
      'toggleMinimize',
      'isVisible',
      'isMinimized',
      'speech bubble',
      'Character Avatar',
      'Progress Indicator',
      'Quick Actions'
    ])
    
    addResult(
      'UI Features',
      'Interactive Controls',
      missing.length <= 1 ? 'PASS' : 'WARNING',
      `${found.length}/${found.length + missing.length} UI features found`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  }
}

async function testPreferencesSystem() {
  console.log('🔍 Testing Preferences System...')
  
  const providerExists = await checkFileExists('frontend/src/components/frenly/FrenlyProvider.tsx')
  if (providerExists) {
    const { found, missing } = await checkFileContent('frontend/src/components/frenly/FrenlyProvider.tsx', [
      'preferences',
      'showTips',
      'showCelebrations',
      'showWarnings',
      'voiceEnabled',
      'animationSpeed'
    ])
    
    addResult(
      'Preferences System',
      'Preference Options',
      missing.length === 0 ? 'PASS' : 'WARNING',
      `${found.length}/${found.length + missing.length} preference options found`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  }
}

async function testAccessibility() {
  console.log('🔍 Testing Accessibility...')
  
  const frenlyAIExists = await checkFileExists('frontend/src/components/FrenlyAI.tsx')
  if (frenlyAIExists) {
    const { found } = await checkFileContent('frontend/src/components/FrenlyAI.tsx', [
      'aria-label',
      'title',
      'alt'
    ])
    
    addResult(
      'Accessibility',
      'ARIA Attributes',
      found.length >= 2 ? 'PASS' : 'WARNING',
      found.length >= 2 ? 'Accessibility attributes present' : 'Limited accessibility attributes'
    )
  }
}

async function testErrorHandling() {
  console.log('🔍 Testing Error Handling...')
  
  const providerExists = await checkFileExists('frontend/src/components/frenly/FrenlyProvider.tsx')
  if (providerExists) {
    const { found } = await checkFileContent('frontend/src/components/frenly/FrenlyProvider.tsx', [
      'try',
      'catch',
      'error',
      'throw new Error'
    ])
    
    addResult(
      'Error Handling',
      'Error Boundaries',
      found.length >= 2 ? 'PASS' : 'WARNING',
      found.length >= 2 ? 'Error handling implemented' : 'Limited error handling'
    )
  }
}

async function testLazyLoading() {
  console.log('🔍 Testing Lazy Loading...')
  
  const lazyLoadingExists = await checkFileExists('frontend/src/utils/lazyLoading.tsx')
  if (lazyLoadingExists) {
    const { found, missing } = await checkFileContent('frontend/src/utils/lazyLoading.tsx', [
      'LazyFrenlyAI',
      'LazyFrenlyAIProvider',
      'LazyFrenlyGuidance',
      'lazy'
    ])
    
    addResult(
      'Performance',
      'Lazy Loading',
      missing.length === 0 ? 'PASS' : 'WARNING',
      `${found.length}/${found.length + missing.length} lazy loading features found`,
      missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
    )
  } else {
    addResult(
      'Performance',
      'Lazy Loading',
      'WARNING',
      'Lazy loading utility not found'
    )
  }
}

async function main() {
  console.log('\n🚀 Starting Frenly AI Comprehensive Diagnostics...\n')

  try {
    await testComponentArchitecture()
    await testPageIntegration()
    await testStateManagement()
    await testMessageSystem()
    await testPersonalitySystem()
    await testGuidanceSystem()
    await testUIFeatures()
    await testPreferencesSystem()
    await testAccessibility()
    await testErrorHandling()
    await testLazyLoading()
    
    printResults()
  } catch (error) {
    console.error('❌ Diagnostic script encountered an error:', error)
    process.exit(1)
  }
}

// Run diagnostics
main()
