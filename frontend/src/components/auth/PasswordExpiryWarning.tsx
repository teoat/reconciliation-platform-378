/**
 * Password Expiry Warning Modal
 * 
 * Displays when user's password is expiring soon (within 7 days)
 */

import React from 'react';
import { logger } from '@/services/logger';

interface PasswordExpiryWarningProps {
  daysRemaining: number;
  onDismiss: () => void;
  onChangeNow: () => void;
}

export const PasswordExpiryWarning: React.FC<PasswordExpiryWarningProps> = ({
  daysRemaining,
  onDismiss,
  onChangeNow,
}) => {
  const severityColor = daysRemaining <= 3 ? 'red' : daysRemaining <= 7 ? 'orange' : 'yellow';
  const severityBg = daysRemaining <= 3 ? 'bg-red-50' : daysRemaining <= 7 ? 'bg-orange-50' : 'bg-yellow-50';
  const severityText = daysRemaining <= 3 ? 'text-red-900' : daysRemaining <= 7 ? 'text-orange-900' : 'text-yellow-900';
  const severityBorder = daysRemaining <= 3 ? 'border-red-200' : daysRemaining <= 7 ? 'border-orange-200' : 'border-yellow-200';

  React.useEffect(() => {
    logger.logSecurity('Password expiry warning shown', { daysRemaining });
  }, [daysRemaining]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`max-w-md w-full mx-4 ${severityBg} border-2 ${severityBorder} rounded-lg shadow-xl p-6`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`h-6 w-6 text-${severityColor}-400`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-lg font-medium ${severityText}`}>
              Password Expiring Soon
            </h3>
            <div className={`mt-2 text-sm ${severityText}`}>
              <p>
                Your password will expire in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>.
                {daysRemaining <= 3 && ' This is your final warning!'}
              </p>
              <p className="mt-2">
                For security reasons, please change your password before it expires.
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={onChangeNow}
                className={`px-4 py-2 text-sm font-medium text-white bg-${severityColor}-600 hover:bg-${severityColor}-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${severityColor}-500`}
              >
                Change Password Now
              </button>
              <button
                onClick={onDismiss}
                className={`px-4 py-2 text-sm font-medium ${severityText} bg-white border border-${severityColor}-300 hover:bg-${severityColor}-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${severityColor}-500`}
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
