import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { apiClient } from '../services/apiClient'
import { UserResponse, LoginRequest, RegisterRequest } from '../types/backend-aligned'

interface AuthContextType {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    role?: string
  }) => Promise<{ success: boolean; error?: string }>
  googleOAuth: (idToken: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const response = await apiClient.getCurrentUser()
          if (response.data) {
            setUser(response.data)
          } else {
            // Token is invalid, clear it
            apiClient.clearAuthToken()
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        apiClient.clearAuthToken()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.login({ email, password })
      
      if (response.error) {
        return { success: false, error: response.error.message }
      }
      
      if (response.data) {
        setUser(response.data.user)
        return { success: true }
      }
      
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    role?: string
  }) => {
    try {
      setIsLoading(true)
      const response = await apiClient.register(userData)
      
      if (response.error) {
        return { success: false, error: response.error.message }
      }
      
      if (response.data) {
        setUser(response.data.user)
        return { success: true }
      }
      
      return { success: false, error: 'Registration failed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const googleOAuth = async (idToken: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.googleOAuth(idToken)
      
      if (response.error) {
        return { success: false, error: response.error.message }
      }
      
      if (response.data) {
        setUser(response.data.user)
        return { success: true }
      }
      
      return { success: false, error: 'Google authentication failed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Google authentication failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      apiClient.clearAuthToken()
    }
  }

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser()
      if (response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Refresh user failed:', error)
      // If refresh fails, logout user
      await logout()
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    googleOAuth,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
