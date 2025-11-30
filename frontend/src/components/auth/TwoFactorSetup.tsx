import React, { useState } from 'react';

interface TwoFactorSetupProps {
  secret: string;
  qrCodeImage: string; // Base64 encoded PNG
  onVerify: (code: string) => void;
  onEnable: () => void;
  onCancel: () => void;
  isVerified: boolean;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  secret,
  qrCodeImage,
  onVerify,
  onEnable,
  onCancel,
  isVerified,
}) => {
  const [code, setCode] = useState('');

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(code);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Set up Two-Factor Authentication</h3>
      <p className="text-sm text-gray-600">
        Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy).
        Alternatively, you can manually enter the secret key.
      </p>

      <div className="flex flex-col items-center space-y-4">
        <img src={`data:image/png;base64,${qrCodeImage}`} alt="QR Code" className="w-48 h-48 border border-gray-300 rounded-md" />
        <p className="font-mono text-sm text-gray-800 break-all">Secret Key: {secret}</p>
      </div>

      <form onSubmit={handleVerifySubmit} className="space-y-3">
        <div>
          <label htmlFor="2faCode" className="block text-sm font-medium text-gray-700">
            Verify Code
          </label>
          <input
            type="text"
            id="2faCode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isVerified}
          >
            Verify and Confirm
          </button>
        </div>
      </form>

      {isVerified && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={onEnable}
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Enable 2FA
          </button>
        </div>
      )}
    </div>
  );
};
