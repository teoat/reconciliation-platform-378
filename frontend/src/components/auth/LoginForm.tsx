import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onSubmit: (email: string, password: string, twoFactorCode?: string) => void;
  onForgotPassword?: () => void;
  showTwoFactorInput: boolean;
  onRegisterClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  showTwoFactorInput,
  onRegisterClick,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, showTwoFactorInput ? twoFactorCode : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {showTwoFactorInput && (
        <div>
          <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
            Two-Factor Code
          </label>
          <input
            type="text"
            id="twoFactorCode"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        {onForgotPassword && (
          <div className="text-sm">
            <button
              type="button"
              onClick={onForgotPassword}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </button>
          </div>
        )}
        <div className="text-sm">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Register
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign in
        </button>
      </div>
    </form>
  );
};
