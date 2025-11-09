import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, _password: string): Promise<void> => {
    setIsLoading(true)
    try {
      // This would normally make an API call
      // For now, simulate a login
      const nameParts = email.split('@')[0].split('.')
      const mockUser: User = {
        id: '1',
        email,
        first_name: nameParts[0] || 'John',
        last_name: nameParts[1] || 'Doe',
        role: 'admin'
      }

      localStorage.setItem('user', JSON.stringify(mockUser))
      localStorage.setItem('token', 'mock-token')
      setUser(mockUser)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // This would normally make an API call
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }
}