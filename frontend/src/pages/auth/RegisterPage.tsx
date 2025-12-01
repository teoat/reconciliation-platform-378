import React, { useState } from 'react';
import { RegistrationForm } from '@/components/auth/RegistrationForm';

export const RegisterPage: React.FC = () => {
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  const handleRegister = async (
    email: string,
    _password: string,
    firstName: string,
    lastName: string,
    role?: string,
  ) => {
    setRegistrationError(null);
    setRegistrationSuccess(null);

    try {
      // Here you would typically make an API call to your backend /api/v2/auth/register
      // console.log('Attempting registration with:', { email, password, firstName, lastName, role });

      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (email === 'existing@example.com') {
            reject({ message: 'User with this email already exists' });
          } else {
            resolve({
              id: 'new-user-id',
              email,
              firstName,
              lastName,
              role: role || 'user',
            });
          }
        }, 1000);
      });

      // console.log('Registration successful', response);
      setRegistrationSuccess('Registration successful! Please log in.');
      // Optionally redirect to login page
    } catch (error: any) {
      console.error('Registration error', error);
      setRegistrationError(error.message || 'An unexpected error occurred during registration.');
    }
  };

  const handleLoginClick = () => {
    // console.log('Login clicked');
    // Implement navigation to login page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
        </div>
        {registrationError && <p className="text-red-500 text-center text-sm">{registrationError}</p>}
        {registrationSuccess && <p className="text-green-500 text-center text-sm">{registrationSuccess}</p>}
        <RegistrationForm onSubmit={handleRegister} onLoginClick={handleLoginClick} />
      </div>
    </div>
  );
};
