import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const LoginPage: React.FC = () => {
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string, twoFactorCode?: string) => {
    setLoginError(null);
    setShowTwoFactorInput(false);

    try {
      // Here you would typically make an API call to your backend /api/v2/auth/login

      // Simulate API call
      const response = await new Promise<any>((resolve, reject) => {
        setTimeout(() => {
          if (email === 'test@example.com' && password === 'password') {
            if (email === '2fa@example.com' && !twoFactorCode) {
              reject({ message: '2FA required', status: '2fa_required' });
            } else if (email === '2fa@example.com' && twoFactorCode !== '123456') {
              reject({ message: 'Invalid 2FA code' });
            } else {
              resolve({ token: 'mock_jwt_token', user: { id: '1', email, role: 'user' } });
            }
          } else if (email === '2fa@example.com' && password === 'password123') {
            if (!twoFactorCode) {
              reject({ message: '2FA required', status: '2fa_required' });
            } else if (twoFactorCode === '123456') {
              resolve({ token: 'mock_jwt_token_2fa', user: { id: '2', email, role: 'user' } });
            } else {
              reject({ message: 'Invalid 2FA code' });
            }
          }
          else {
            reject({ message: 'Invalid credentials' });
          }
        }, 1000);
      });

      // Store token (e.g., in Redux, local storage, or context)
      // Redirect to dashboard
    } catch (error: any) {
      console.error('Login error', error);
      if (error.status === '2fa_required') {
        setShowTwoFactorInput(true);
        setLoginError('Two-factor authentication is required.');
      } else {
        setLoginError(error.message || 'An unexpected error occurred.');
      }
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend's Google OAuth endpoint
    window.location.href = 'http://localhost:8080/api/v2/auth/oauth/google';
  };

  const handleGitHubLogin = () => {
    // Redirect to backend's GitHub OAuth endpoint
    window.location.href = 'http://localhost:8080/api/v2/auth/oauth/github';
  };

  const handleForgotPassword = () => {
    // Implement navigation to forgot password page
  };

  const handleRegisterClick = () => {
    // Implement navigation to registration page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        {loginError && <p className="text-red-500 text-center text-sm">{loginError}</p>}
        <LoginForm
          onSubmit={handleLogin}
          onForgotPassword={handleForgotPassword}
          showTwoFactorInput={showTwoFactorInput}
          onRegisterClick={handleRegisterClick}
        />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <OAuthButtons onGoogleLogin={handleGoogleLogin} onGitHubLogin={handleGitHubLogin} />
      </div>
    </div>
  );
};
