/**
 * OAuth Buttons Component
 * 
 * Google OAuth sign-in button
 */

import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface OAuthButtonsProps {
  googleButtonRef: React.RefObject<HTMLDivElement>;
  isGoogleButtonLoading: boolean;
  googleButtonError: boolean;
  onRetry: () => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  googleButtonRef,
  isGoogleButtonLoading,
  googleButtonError,
  onRetry,
}) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={googleButtonRef}
          className="flex items-center justify-center min-h-[42px]"
          aria-label="Google Sign-In"
        />
        {isGoogleButtonLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {googleButtonError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                Google Sign-In button failed to load. Please try again.
              </p>
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

