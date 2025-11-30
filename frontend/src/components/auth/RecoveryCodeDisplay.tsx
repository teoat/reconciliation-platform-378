import React from 'react';

interface RecoveryCodeDisplayProps {
  recoveryCodes: string[];
  onGenerateNewCodes: () => void;
}

export const RecoveryCodeDisplay: React.FC<RecoveryCodeDisplayProps> = ({
  recoveryCodes,
  onGenerateNewCodes,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Your Recovery Codes</h3>
      <p className="text-sm text-gray-600">
        Store these codes in a safe place. Each code can be used once to log in if you lose access to your authenticator app.
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-800">
        {recoveryCodes.length > 0 ? (
          recoveryCodes.map((code, index) => <li key={index}>{code}</li>)
        ) : (
          <li>No recovery codes found. Generate new ones.</li>
        )}
      </ul>
      <div className="flex justify-end">
        <button
          onClick={onGenerateNewCodes}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Generate New Recovery Codes
        </button>
      </div>
    </div>
  );
};
