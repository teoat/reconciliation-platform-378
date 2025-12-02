import React, { useState, useEffect } from 'react';
import { UserProfileForm } from '@/components/auth/UserProfileForm';
import { TwoFactorAuthPage } from './TwoFactorAuthPage';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  is2faEnabled: boolean;
}

export const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManaging2FA, setIsManaging2FA] = useState(false);

  // Simulate fetching user data
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // In a real app, this would be an API call to get the current user's profile
        const fetchedUser: UserProfile = {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
          is2faEnabled: false, // Assume 2FA is disabled initially
        };
        setUser(fetchedUser);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (updates: { firstName?: string; lastName?: string; email?: string; role?: string }) => {
    setError(null);
    try {
      // Simulate API call to update profile
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          ...updates,
        };
      });
      alert('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  const handleToggle2FA = async () => {
    if (!user) return;
    setError(null);
    try {
      if (user.is2faEnabled) {
        // Simulate API call to disable 2FA
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser(prevUser => prevUser ? { ...prevUser, is2faEnabled: false } : null);
        alert('2FA disabled.');
      } else {
        // If disabling, go directly. If enabling, go to setup page.
        setIsManaging2FA(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle 2FA.');
    }
  };

  const handleManage2FA = () => {
    setIsManaging2FA(true);
  };

  const handleBackToProfile = () => {
    setIsManaging2FA(false);
    // Re-fetch user data to update 2FA status after management
    // (in a real app, you'd trigger a state refresh or re-fetch)
    if (user) {
      setUser(prevUser => prevUser ? { ...prevUser, is2faEnabled: !prevUser.is2faEnabled } : null);
    } else {
      // Handle case where user is null (shouldn't happen if properly authenticated)
      console.error("User not found when attempting to re-enable 2FA after management.");
      setError("User data missing for 2FA management.");
    }

  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading user profile...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-screen">Error: {error}</div>;
  }

  if (!user) {
    return <div className="text-gray-500 text-center min-h-screen">No user data found.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        {!isManaging2FA ? (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                User Profile
              </h2>
            </div>
            <UserProfileForm
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onToggle2FA={handleToggle2FA}
              onManage2FA={handleManage2FA}
            />
          </>
        ) : (
          <TwoFactorAuthPage userId={user.id} userEmail={user.email} onBack={handleBackToProfile} />
        )}
      </div>
    </div>
  );
};
