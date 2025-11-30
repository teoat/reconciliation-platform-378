import React from 'react';

interface OAuthButtonsProps {
  onGoogleLogin: () => void;
  onGitHubLogin: () => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onGoogleLogin,
  onGitHubLogin,
}) => {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onGoogleLogin}
        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <img src="/images/google-logo.svg" alt="Google" className="h-5 w-5 mr-2" />
        Sign in with Google
      </button>
      <button
        type="button"
        onClick={onGitHubLogin}
        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <img src="/images/github-logo.svg" alt="GitHub" className="h-5 w-5 mr-2" />
        Sign in with GitHub
      </button>
    </div>
  );
};
