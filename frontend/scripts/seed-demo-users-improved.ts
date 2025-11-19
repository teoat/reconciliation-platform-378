#!/usr/bin/env node
/**
 * Improved Seed Demo Users Script
 * 
 * This version provides better error handling and diagnostics
 */

import { DEMO_CREDENTIALS } from '../src/config/demoCredentials'

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:2000/api'
const REGISTER_ENDPOINT = `${API_BASE_URL}/auth/register`
const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`

interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: string
}

async function checkUserExists(email: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(5000),
    })
    
    return response.ok
  } catch {
    return false
  }
}

async function createDemoUser(credentials: typeof DEMO_CREDENTIALS[0]): Promise<{ success: boolean; message: string }> {
  // First check if user already exists
  const exists = await checkUserExists(credentials.email, credentials.password)
  if (exists) {
    return {
      success: true,
      message: `ℹ️  User already exists and password works: ${credentials.email}`,
    }
  }

  // Extract first and last name from email or use role-based defaults
  const roleNames: Record<string, { first: string; last: string }> = {
    admin: { first: 'Admin', last: 'User' },
    manager: { first: 'Manager', last: 'User' },
    user: { first: 'Demo', last: 'User' },
  }
  
  const defaultNames = roleNames[credentials.role] || { first: 'Demo', last: 'User' }
  
  const requestBody: RegisterRequest = {
    email: credentials.email,
    password: credentials.password,
    first_name: defaultNames.first,
    last_name: defaultNames.last,
    role: credentials.role,
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(REGISTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    let data: unknown
    let responseText = ''
    try {
      responseText = await response.text()
      data = responseText ? JSON.parse(responseText) : {}
    } catch (parseError) {
      data = { 
        error: 'Failed to parse response', 
        raw: response.statusText,
        responseText: responseText.substring(0, 200) // First 200 chars
      }
    }

    const isErrorResponse = (obj: unknown): obj is { error?: string; message?: string } => {
      return typeof obj === 'object' && obj !== null
    }

    if (response.ok) {
      return {
        success: true,
        message: `✅ Created ${credentials.role} user: ${credentials.email}`,
      }
    } else {
      const errorData = isErrorResponse(data) ? data : {}
      
      // Check if user already exists
      if (response.status === 409 || 
          errorData.error?.toLowerCase().includes('already exists') || 
          errorData.message?.toLowerCase().includes('already exists') ||
          responseText.toLowerCase().includes('already exists')) {
        return {
          success: true,
          message: `ℹ️  User already exists: ${credentials.email} (skipped)`,
        }
      }
      
      return {
        success: false,
        message: `❌ Failed to create ${credentials.role} user (HTTP ${response.status}): ${errorData.error || errorData.message || response.statusText || 'Unknown error'}`,
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: `❌ Timeout creating ${credentials.role} user: ${credentials.email} (backend may be slow or unresponsive)`,
        }
      }
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        return {
          success: false,
          message: `❌ Connection failed for ${credentials.role} user: ${credentials.email} (backend may have crashed - check backend logs)`,
        }
      }
      return {
        success: false,
        message: `❌ Error creating ${credentials.role} user: ${error.message}`,
      }
    }
    return {
      success: false,
      message: `❌ Unknown error creating ${credentials.role} user: ${String(error)}`,
    }
  }
}

async function checkBackendHealth(): Promise<boolean> {
  try {
    const healthUrl = API_BASE_URL.replace('/api', '/health')
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  console.log('🌱 Seeding Demo Users (Improved Version)...\n')
  console.log(`API URL: ${API_BASE_URL}\n`)

  // Check if backend is running
  console.log('Checking backend health...')
  const isHealthy = await checkBackendHealth()
  if (!isHealthy) {
    console.error('❌ Backend is not running or not accessible!')
    console.error(`   Please ensure the backend is running at ${API_BASE_URL.replace('/api', '')}`)
    console.error('   Start the backend with: cd backend && cargo run')
    process.exit(1)
  }
  console.log('✅ Backend is running\n')

  // Create all demo users
  console.log('Creating demo users...\n')
  const results = await Promise.all(
    DEMO_CREDENTIALS.map((credentials) => createDemoUser(credentials))
  )

  // Print results
  console.log('Results:')
  console.log('─'.repeat(60))
  results.forEach((result) => {
    console.log(result.message)
  })
  console.log('─'.repeat(60))

  // Summary
  const successCount = results.filter((r) => r.success).length
  const totalCount = results.length

  console.log(`\n📊 Summary: ${successCount}/${totalCount} users ready`)
  
  if (successCount === totalCount) {
    console.log('\n✨ Demo users are ready to use!')
    console.log('\nYou can now:')
    console.log('  1. Go to http://localhost:1000/login')
    console.log('  2. Use the demo credentials section to auto-fill and login')
    console.log('  3. Or use the "Quick Login with Demo Account" button\n')
  } else {
    console.log('\n⚠️  Some users failed to create.')
    console.log('\nTroubleshooting:')
    console.log('  1. Check backend logs for errors')
    console.log('  2. Verify database is running and accessible')
    console.log('  3. Check if users already exist with different passwords')
    console.log('  4. Try restarting the backend: cd backend && cargo run\n')
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

