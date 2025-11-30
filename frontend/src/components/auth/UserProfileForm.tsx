import React, { useState, useEffect } from 'react';

interface UserProfileFormProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    is2faEnabled: boolean;
  };
  onUpdateProfile: (updates: { firstName?: string; lastName?: string; email?: string; role?: string }) => void;
  onToggle2FA: () => void;
  onManage2FA: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onUpdateProfile,
  onToggle2FA,
  onManage2FA,
}) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);

  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setRole(user.role);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ firstName, lastName, email, role });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={true} // Roles are typically managed by admins, not users
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-100"
        >
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Two-Factor Authentication:</span>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${user.is2faEnabled ? 'text-green-600' : 'text-red-600'}`}>
            {user.is2faEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            type="button"
            onClick={onToggle2FA}
            className={`inline-flex justify-center py-1 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white ${user.is2faEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {user.is2faEnabled ? 'Disable' : 'Enable'}
          </button>
          {user.is2faEnabled && (
            <button
              type="button"
              onClick={onManage2FA}
              className="inline-flex justify-center py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Manage 2FA
            </button>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Update Profile
        </button>
      </div>
    </form>
  );
};
