#!/usr/bin/env node
/**
 * Seed Demo Users Script
 * 
 * This script creates demo users in the database using the registration API.
 * It handles cases where users already exist gracefully.
 * 
 * Usage:
 *   npm run seed-demo-users
 *   or
 *   tsx scripts/seed-demo-users.ts
 */

import { DEMO_CREDENTIALS } from '../src/config/demoCredentials'

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:2000/api'
const REGISTER_ENDPOINT = `${API_BASE_URL}/auth/register`

interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: string
}

async function createDemoUser(credentials: typeof DEMO_CREDENTIALS[0]): Promise<{ success: boolean; message: string }> {
  // Extract first and last name from email or use role-based defaults
  const emailPrefix = credentials.email.split('@')[0]
  const nameParts = emailPrefix.split('.')
  
  // Use role-based names for better UX
  const roleNames: Record<string, { first: string; last: string }> = {
    admin: { first: 'Admin', last: 'User' },
    manager: { first: 'Manager', last: 'User' },
    user: { first: 'Demo', last: 'User' },
  }
  
  const defaultNames = roleNames[credentials.role] || { first: 'Demo', last: 'User' }
  const first_name = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : defaultNames.first
  const last_name = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : defaultNames.last
  
  const requestBody: RegisterRequest = {
    email: credentials.email,
    password: credentials.password,
    first_name: first_name,
    last_name: last_name,
    role: credentials.role,
  }

  try {
    // Use AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
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
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : {}
    } catch (parseError) {
      data = { error: 'Failed to parse response', raw: response.statusText }
    }

    // Type guard for error response
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
      if (response.status === 409 || errorData.error?.includes('already exists') || errorData.message?.includes('already exists')) {
        return {
          success: true,
          message: `ℹ️  User already exists: ${credentials.email} (skipped)`,
        }
      }
      
      return {
        success: false,
        message: `❌ Failed to create ${credentials.role} user: ${errorData.error || errorData.message || response.statusText}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Error creating ${credentials.role} user: ${error instanceof Error ? error.message : String(error)}`,
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
    })
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  console.log('🌱 Seeding Demo Users...\n')
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
  console.log('\n✨ Demo users are ready to use!')
  console.log('\nYou can now:')
  console.log('  1. Go to http://localhost:1000/login')
  console.log('  2. Use the demo credentials section to auto-fill and login')
  console.log('  3. Or use the "Quick Login with Demo Account" button\n')
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

