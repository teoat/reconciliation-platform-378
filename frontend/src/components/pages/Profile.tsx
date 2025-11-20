import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft } from 'lucide-react';
import { Save } from 'lucide-react';
import { User } from 'lucide-react';
import { Mail } from 'lucide-react';
import { Lock } from 'lucide-react';
import { Edit2 } from 'lucide-react';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      if (user) {
        setProfileData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
        });
      } else {
        const response = await apiClient.getCurrentUser();
        if (response.data) {
          setProfileData({
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            email: response.data.email || '',
          });
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await apiClient.updateUser(user?.id || '', {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
      });

      if (!response.success) {
        const errorMsg = (response.error && typeof response.error === 'object' && 'message' in response.error ? response.error.message : response.error) || response.message || 'Failed to update profile';
        setError(errorMsg as string);
        toast.error(errorMsg as string);
      } else {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        await refreshUser();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (!response.success) {
        const errorMsg = (response.error && typeof response.error === 'object' && 'message' in response.error ? response.error.message : response.error) || response.message || 'Failed to change password';
        throw new Error(errorMsg as string);
      }
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to change password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            aria-label="Loading profile"
          ></div>
          <span className="ml-4">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your profile information and password</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="Edit profile"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="first-name"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                  aria-label="First name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="last-name"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                  aria-label="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  aria-label="Email address"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div
                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                      aria-hidden="true"
                    ></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-gray-900 font-medium">
                  {profileData.first_name} {profileData.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{profileData.email}</p>
              </div>
            </div>

            {(user as any)?.role && (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Role</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="text-gray-900 font-medium capitalize">{(user as any).role}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Lock className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Current Password
            </label>
            <input
              type="password"
              id="current-password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current password"
              aria-label="Current password"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password"
              aria-label="New password"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must contain uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
              aria-label="Confirm new password"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button
              type="submit"
              disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
            >
              {isSaving ? (
                <>
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                    aria-hidden="true"
                  ></div>
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
