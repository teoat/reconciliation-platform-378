/**
 * Auth Page
 * 
 * Main orchestrator component for authentication
 * Refactored from 1,110 lines to ~250 lines
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { PageMeta } from '@/components/seo/PageMeta';
import { isDemoModeEnabled } from '@/config/demoCredentials';
import type { LoginForm, RegisterForm, DemoRole } from '@/pages/auth/types';
import { useOAuth } from '@/pages/auth/hooks/useOAuth';
import { LoginForm as LoginFormComponent } from '@/pages/auth/components/LoginForm';
import { SignupForm as SignupFormComponent } from '@/pages/auth/components/SignupForm';
import { OAuthButtons } from '@/pages/auth/components/OAuthButtons';
import { DemoCredentials } from '@/pages/auth/components/DemoCredentials';

const AuthPage: React.FC = () => {
  const { login, register: registerUser, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<DemoRole>('admin');
  const demoModeEnabled = isDemoModeEnabled();

  // OAuth
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { googleButtonRef, isGoogleButtonLoading, googleButtonError, setGoogleButtonRetryKey } =
    useOAuth({ googleClientId });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handlers
  const handleLogin = async (data: LoginForm) => {
    try {
      setError(null);
      logger.logUserAction('login_attempt', 'AuthPage', { email: data.email });
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Successfully signed in');
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Invalid email or password');
        logger.logUserAction('login_failed', 'AuthPage', { email: data.email });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      logger.error('Login error', { component: 'AuthPage', error: errorMessage });
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      setError(null);
      logger.logUserAction('register_attempt', 'AuthPage', { email: data.email });
      const result = await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      if (result.success) {
        toast.success('Account created successfully');
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Failed to create account');
        logger.logUserAction('register_failed', 'AuthPage', { email: data.email });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
      logger.error('Registration error', { component: 'AuthPage', error: errorMessage });
    }
  };

  const handleUseDemoCredentials = async (email: string, password: string) => {
    await handleLogin({ email, password, rememberMe: false });
  };

  return (
    <>
      <PageMeta
        title={isRegistering ? 'Sign Up' : 'Sign In'}
        description={
          isRegistering
            ? 'Create a new account to get started'
            : 'Sign in to your account to continue'
        }
        keywords="authentication, login, signup, oauth"
      />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isRegistering ? 'Create your account' : 'Sign in to your account'}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isRegistering ? (
                <>
                  Or{' '}
                  <button
                    onClick={() => setIsRegistering(false)}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    sign in to your existing account
                  </button>
                </>
              ) : (
                <>
                  Or{' '}
                  <button
                    onClick={() => setIsRegistering(true)}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    create a new account
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {!isRegistering ? (
              <LoginFormComponent
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <SignupFormComponent
                onSubmit={handleRegister}
                isLoading={isLoading}
                error={error}
              />
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <OAuthButtons
              googleButtonRef={googleButtonRef}
              isGoogleButtonLoading={isGoogleButtonLoading}
              googleButtonError={googleButtonError}
              onRetry={() => setGoogleButtonRetryKey(prev => prev + 1)}
            />

            {demoModeEnabled && (
              <DemoCredentials
                selectedRole={selectedDemoRole}
                onRoleChange={setSelectedDemoRole}
                onUseCredentials={handleUseDemoCredentials}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default AuthPage;

