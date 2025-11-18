// ============================================================================
// DEMO CREDENTIALS CONFIGURATION
// ============================================================================

/**
 * Demo credentials for testing and development
 * These credentials should match users seeded in the database
 * 
 * IMPORTANT: These are for development/demo purposes only.
 * In production, these should be disabled or removed.
 */

export interface DemoCredentials {
  email: string
  password: string
  role: 'admin' | 'manager' | 'user'
  description: string
}

export const DEMO_CREDENTIALS: DemoCredentials[] = [
  {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin',
    description: 'Administrator account with full access',
  },
  {
    email: 'manager@example.com',
    password: 'ManagerPassword123!',
    role: 'manager',
    description: 'Manager account with project management access',
  },
  {
    email: 'user@example.com',
    password: 'UserPassword123!',
    role: 'user',
    description: 'Standard user account',
  },
]

/**
 * Get demo credentials by role
 */
export const getDemoCredentials = (role: 'admin' | 'manager' | 'user' = 'admin'): DemoCredentials => {
  const credentials = DEMO_CREDENTIALS.find((c) => c.role === role)
  return credentials || DEMO_CREDENTIALS[0] // Default to admin
}

/**
 * Check if demo mode is enabled
 * Can be controlled via environment variable
 */
export const isDemoModeEnabled = (): boolean => {
  const demoMode = import.meta.env.VITE_DEMO_MODE
  // Default to true in development, false in production
  return demoMode === 'true' || (import.meta.env.DEV && demoMode !== 'false')
}

/**
 * Get primary demo credentials (admin by default)
 */
export const getPrimaryDemoCredentials = (): DemoCredentials => {
  return getDemoCredentials('admin')
}

