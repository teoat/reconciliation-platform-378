/**
 * Demo Credentials Component
 * 
 * Demo mode credential selector
 */

import React from 'react';
import type { DemoRole } from '../types';
import { getPrimaryDemoCredentials, DEMO_CREDENTIALS } from '@/config/demoCredentials';

interface DemoCredentialsProps {
  selectedRole: DemoRole;
  onRoleChange: (role: DemoRole) => void;
  onUseCredentials: (email: string, password: string) => void;
}

export const DemoCredentials: React.FC<DemoCredentialsProps> = ({
  selectedRole,
  onRoleChange,
  onUseCredentials,
}) => {
  const credentials = getPrimaryDemoCredentials(selectedRole);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
      <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Mode</h3>
      <p className="text-xs text-blue-700 mb-3">
        Use demo credentials to quickly test the application
      </p>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-blue-900 mb-1">Select Role</label>
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value as DemoRole)}
            className="w-full text-sm border border-blue-300 rounded-md px-2 py-1 bg-white text-blue-900"
          >
            {Object.keys(DEMO_CREDENTIALS).map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-blue-700 space-y-1">
          <p>
            <span className="font-medium">Email:</span> {credentials.email}
          </p>
          <p>
            <span className="font-medium">Password:</span> {credentials.password}
          </p>
        </div>

        <button
          onClick={() => onUseCredentials(credentials.email, credentials.password)}
          className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Use Demo Credentials
        </button>
      </div>
    </div>
  );
};

