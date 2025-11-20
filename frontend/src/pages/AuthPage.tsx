import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { EyeOff } from 'lucide-react'
import { Lock } from 'lucide-react'
import { User } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { passwordSchema, getPasswordFeedback } from '@/utils/common/validation'
import { logger } from '@/services/logger'
import { PageMeta } from '@/components/seo/PageMeta'
import { getPrimaryDemoCredentials, isDemoModeEnabled, DEMO_CREDENTIALS } from '@/config/demoCredentials'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  // For login, only validate that password is not empty - backend handles authentication
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
          id: {
            initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
            renderButton: (element: HTMLElement, config: { type?: string; theme?: string; size?: string; text?: string; width?: string }) => void
          }
      }
    }
  }
}

const AuthPage: React.FC = () => {
  const { login, register: registerUser, googleOAuth, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isGoogleButtonLoading, setIsGoogleButtonLoading] = useState(false)
  const [googleButtonError, setGoogleButtonError] = useState(false)
  const [selectedDemoRole, setSelectedDemoRole] = useState<'admin' | 'manager' | 'user'>('admin')
  const demoModeEnabled = isDemoModeEnabled()
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState<ReturnType<typeof getPasswordFeedback> | null>(null)
  
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
  })

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur', // Validate on blur for better UX
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Reset forms when switching between login/register
  useEffect(() => {
    if (isRegistering) {
      loginForm.reset()
    } else {
      registerForm.reset()
    }
    setError(null)
  }, [isRegistering, loginForm, registerForm])

  // Handle Google Sign-In
  const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
    try {
      setError(null)
      if (!response.credential) {
        const errorMsg = 'Google sign-in failed. Please try again.'
        setError(errorMsg)
        toast.error(errorMsg)
        return
      }

      const result = await googleOAuth(response.credential)
      if (result.success) {
        toast.success('Signed in with Google successfully!')
        navigate('/', { replace: true })
      } else {
        const errorMsg = result.error || 'Google sign-in failed. Please try again.'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }, [googleOAuth, navigate, toast])

  // Load Google Identity Services script
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    // Debug log to verify environment variable is loaded (only once per session)
    if (import.meta.env.DEV && !sessionStorage.getItem('googleClientIdLogged')) {
      console.log('[AuthPage] Google Client ID check:', {
        hasValue: !!googleClientId,
        valueLength: googleClientId.length,
        valuePreview: googleClientId ? `${googleClientId.substring(0, 20)}...` : 'empty'
      })
      sessionStorage.setItem('googleClientIdLogged', 'true')
    }
    if (!googleClientId) {
      // Log warning in production if Google OAuth is expected but not configured
      if (import.meta.env.PROD) {
        logger.warn('VITE_GOOGLE_CLIENT_ID is not set. Google OAuth will be disabled.', {
          component: 'AuthPage',
          category: 'oauth',
        })
      }
      setIsGoogleButtonLoading(false)
      setGoogleButtonError(false)
      return // Skip if no Google Client ID is configured
    }

    // Reset states when starting to load
    setIsGoogleButtonLoading(true)
    setGoogleButtonError(false)

    // Function to render Google button with retry logic
    const renderGoogleButton = (retries = 5, delay = 200) => {
      if (retries === 0) {
        logger.error('Failed to render Google Sign-In button after multiple attempts', {
          component: 'AuthPage',
          category: 'oauth',
        })
        setIsGoogleButtonLoading(false)
        setGoogleButtonError(true)
        return
      }

      if (!window.google) {
        // Script not loaded yet, retry
        setTimeout(() => renderGoogleButton(retries - 1, delay), delay)
        return
      }

      if (!googleButtonRef.current) {
        // Ref not ready yet, retry
        setTimeout(() => renderGoogleButton(retries - 1, delay), delay)
        return
      }

      try {
        // Check if button already rendered
        const existingButton = googleButtonRef.current.querySelector('iframe')
        if (existingButton && existingButton.parentNode === googleButtonRef.current) {
          setIsGoogleButtonLoading(false)
          setGoogleButtonError(false)
          return // Button already rendered
        }

        // Clear container before rendering to avoid conflicts
        // Use replaceChildren() for safer DOM manipulation when Google manages the DOM
        if (googleButtonRef.current) {
          // Check if there's an existing iframe from Google
          const existingIframe = googleButtonRef.current.querySelector('iframe')
          if (existingIframe) {
            // Google button already exists, don't re-render
            setIsGoogleButtonLoading(false)
            setGoogleButtonError(false)
            return
          }
          // Clear any other content safely using modern DOM API
          // Using replaceChildren() is safer than innerHTML for clearing
          const element = googleButtonRef.current as HTMLElement & { replaceChildren?: () => void };
          if (element.replaceChildren) {
            element.replaceChildren()
          } else {
            // Fallback for older browsers
            element.innerHTML = ''
          }
        }

        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn,
        })

        // Render button (Google doesn't accept percentage width, use pixel value or omit)
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          // width: '100%', // Google doesn't accept percentage, container div handles width
        })

        logger.info('Google Sign-In button rendered successfully', {
          component: 'AuthPage',
          category: 'oauth',
        })
        setIsGoogleButtonLoading(false)
        setGoogleButtonError(false)
      } catch (error) {
        logger.error('Error rendering Google Sign-In button', {
          component: 'AuthPage',
          category: 'oauth',
          error: error instanceof Error ? error.message : String(error),
        })
        // Retry on error
        setTimeout(() => renderGoogleButton(retries - 1, delay), delay)
      }
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      // Script already loaded, try to render button
      renderGoogleButton()
      return
    }

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      logger.info('Google Identity Services script loaded', {
        component: 'AuthPage',
        category: 'oauth',
      })
      // Try to render button after script loads
      renderGoogleButton()
    }
    script.onerror = () => {
      logger.error('Failed to load Google Identity Services script', {
        component: 'AuthPage',
        category: 'oauth',
      })
      setIsGoogleButtonLoading(false)
      setGoogleButtonError(true)
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup: Don't try to remove Google's DOM elements
      // Google manages its own DOM, and React trying to remove them causes conflicts
      // Just reset state, let Google handle its own cleanup
      setIsGoogleButtonLoading(false)
      setGoogleButtonError(false)
      // Note: We don't clear the container here because Google's script manages the DOM
      // and React trying to remove it causes "removeChild" errors
    }
  }, [handleGoogleSignIn])

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      const result = await login(data.email, data.password, data.rememberMe)
      if (result.success) {
        toast.success('Welcome back!')
        navigate('/', { replace: true })
      } else {
        const errorMsg = result.error || 'Login failed. Please try again.'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      // Handle network errors and other exceptions
      const errorMsg = err instanceof Error 
        ? (err.message || 'Login failed. Please try again.')
        : 'Login failed. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
      logger.error('Login error:', { error: err, email: data.email })
    }
  }

  // Handle demo credentials quick fill
  const handleUseDemoCredentials = (role: 'admin' | 'manager' | 'user' = selectedDemoRole) => {
    const demo = DEMO_CREDENTIALS.find((c) => c.role === role) || getPrimaryDemoCredentials()
    loginForm.setValue('email', demo.email)
    loginForm.setValue('password', demo.password)
    setSelectedDemoRole(role)
    toast.info(`Demo credentials filled: ${demo.role} account`)
  }

  const onRegisterSubmit = async (data: RegisterForm) => {
    try {
      setError(null)
      const result = await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      })
      if (result.success) {
        toast.success('Account created successfully! Welcome!')
        navigate('/', { replace: true })
      } else {
        const errorMsg = result.error || 'Registration failed. Please try again.'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  return (
    <>
      <PageMeta
        title="Login"
        description="Sign in to access the reconciliation platform and manage your projects."
        keywords="login, sign in, authentication, reconciliation platform"
      />
      <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isRegistering ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-gray-600">
              {isRegistering ? 'Sign up to access the Reconciliation Platform' : 'Sign in to access the Reconciliation Platform'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center" role="alert" data-testid="auth-error-message">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    id="login-email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...loginForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    id="login-password"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-label="Sign in"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div 
                className="w-full flex flex-col items-center justify-center min-h-[40px]"
                aria-label="Google Sign-In"
              >
                {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <p className="text-xs text-gray-400 text-center mt-2 px-4">
                    Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in .env to enable.
                  </p>
                ) : isGoogleButtonLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" aria-hidden="true"></div>
                    <span className="text-sm text-gray-600">Loading Google Sign-In...</span>
                  </div>
                ) : googleButtonError ? (
                  <div className="flex flex-col items-center justify-center py-2 px-4">
                    <p className="text-xs text-red-600 text-center mb-2">
                      Failed to load Google Sign-In button. Please refresh the page.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                      aria-label="Refresh page to retry Google Sign-In"
                    >
                      Refresh Page
                    </button>
                  </div>
                ) : (
                  <div 
                    ref={googleButtonRef} 
                    key="google-signin-button"
                    suppressHydrationWarning
                    style={{ width: '100%' }}
                  />
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    {...registerForm.register('first_name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                  {registerForm.formState.errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    {...registerForm.register('last_name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                  {registerForm.formState.errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm.register('password', {
                      onChange: (e) => {
                        const value = e.target.value
                        setPasswordValue(value)
                        // Always set feedback, even for empty password
                        setPasswordFeedback(value ? getPasswordFeedback(value) : null)
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    id="register-password"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                )}
                
                {/* Real-time password strength indicator */}
                {passwordValue && passwordFeedback && (
                  <div className="mt-2 space-y-2" data-testid="password-strength-indicator">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordFeedback.strength === 'strong' ? 'text-green-600' :
                        passwordFeedback.strength === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`} data-testid="password-strength-value">
                        {passwordFeedback.strength.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordFeedback.strength === 'strong' ? 'bg-green-600' :
                          passwordFeedback.strength === 'medium' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{
                          width: `${(passwordFeedback.checks.filter((c: { passed: boolean }) => c.passed).length / passwordFeedback.checks.length) * 100}%`
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      {passwordFeedback.checks.map((check: { label: string; passed: boolean }, index: number) => (
                        <div key={index} className="flex items-center text-xs">
                          <span className={`mr-2 ${check.passed ? 'text-green-600' : 'text-gray-400'}`}>
                            {check.passed ? '✓' : '○'}
                          </span>
                          <span className={check.passed ? 'text-gray-600' : 'text-gray-400'}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!passwordValue && (
                <p className="mt-1 text-xs text-gray-500">
                  Must contain uppercase, lowercase, number, and special character
                </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm.register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-label="Create account"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div 
                className="w-full flex flex-col items-center justify-center min-h-[40px]"
                aria-label="Google Sign-In"
              >
                {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <p className="text-xs text-gray-400 text-center mt-2 px-4">
                    Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in .env to enable.
                  </p>
                ) : isGoogleButtonLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" aria-hidden="true"></div>
                    <span className="text-sm text-gray-600">Loading Google Sign-In...</span>
                  </div>
                ) : googleButtonError ? (
                  <div className="flex flex-col items-center justify-center py-2 px-4">
                    <p className="text-xs text-red-600 text-center mb-2">
                      Failed to load Google Sign-In button. Please refresh the page.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                      aria-label="Refresh page to retry Google Sign-In"
                    >
                      Refresh Page
                    </button>
                  </div>
                ) : (
                  <div 
                    ref={googleButtonRef} 
                    key="google-signin-button"
                    suppressHydrationWarning
                    style={{ width: '100%' }}
                  />
                )}
              </div>
            </form>
          )}

          {/* Demo Credentials Section */}
          {demoModeEnabled && !isRegistering && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Demo Credentials
              </p>
              <div className="space-y-2 mb-3">
                {DEMO_CREDENTIALS.map((demo) => (
                  <div key={demo.role} className="flex items-center justify-between text-xs">
                    <div className="flex-1">
                      <span className="font-medium text-gray-700 capitalize">{demo.role}:</span>
                      <span className="text-gray-600 ml-2">{demo.email}</span>
                      <span className="text-gray-500 ml-2">/ {demo.password}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUseDemoCredentials(demo.role)}
                      className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      aria-label={`Use ${demo.role} demo credentials`}
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleUseDemoCredentials()}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Quick Login with Demo Account
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            {!isRegistering ? (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
    </>
  )
}

export default AuthPage
