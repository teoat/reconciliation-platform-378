import React, { useState, useEffect } from 'react';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { RecoveryCodeDisplay } from '@/components/auth/RecoveryCodeDisplay';

interface TwoFactorAuthPageProps {
  userId: string;
  userEmail: string;
  onBack: () => void;
}

export const TwoFactorAuthPage: React.FC<TwoFactorAuthPageProps> = ({
  userId,
  userEmail: _userEmail,
  onBack,
}) => {
  const [currentSecret, setCurrentSecret] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching initial 2FA status from backend
    const fetch2FAStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // In a real app, this would be an API call to get user's 2FA status and potentially secret/recovery codes
        // Example: const response = await api.get(`/api/v2/user/${userId}/2fa/status`);
        const response = await new Promise<{ isEnabled: boolean; secret?: string; qrCode?: string; recoveryCodes?: string[] }>((resolve) => {
          setTimeout(() => {
            // Mock data - adjust as needed for testing
            resolve({ isEnabled: false });
          }, 500);
        });
        setIs2faEnabled(response.isEnabled);
        setCurrentSecret(response.secret || null);
        setQrCodeImage(response.qrCode || null);
        setRecoveryCodes(response.recoveryCodes || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch 2FA status.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch2FAStatus();
  }, [userId]);

  const handleGenerateSecret = async () => {
    setError(null);
    try {
      // Simulate API call to backend to generate 2FA secret and QR code
      // console.log('Generating 2FA secret for user:', userId);
      const response = await new Promise<{ secret: string; qrCodeImage: string }>((resolve) => {
        setTimeout(() => {
          // Mock response
          resolve({
            secret: 'MOCKSECRETBASE32',
            qrCodeImage: 'mock_base64_qr_code_image',
          });
        }, 1000);
      });
      setCurrentSecret(response.secret);
      setQrCodeImage(response.qrCodeImage);
      setIsVerified(false); // Reset verification status
    } catch (err: any) {
      setError(err.message || 'Failed to generate 2FA secret.');
    }
  };

  const handleVerifyCode = async (code: string) => {
    setError(null);
    try {
      // Simulate API call to backend to verify 2FA code
      // console.log('Verifying 2FA code:', code);
      const response = await new Promise<{ isValid: boolean }>((resolve, reject) => {
        setTimeout(() => {
          if (code === '123456') { // Mock correct code
            resolve({ isValid: true });
          } else {
            reject({ message: 'Invalid 2FA code' });
          }
        }, 500);
      });
      if (response.isValid) {
        setIsVerified(true);
        alert('2FA code verified!');
      } else {
        setError('Invalid 2FA code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify 2FA code.');
    }
  };

  const handleEnable2FA = async () => {
    setError(null);
    try {
      // Simulate API call to backend to enable 2FA
      // console.log('Enabling 2FA for user:', userId);
      await new Promise(resolve => setTimeout(resolve, 500));
      setIs2faEnabled(true);
      alert('2FA enabled successfully!');
      // Generate initial recovery codes after enabling 2FA
      await handleGenerateRecoveryCodes();
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA.');
    }
  };

  const handleDisable2FA = async () => {
    setError(null);
    try {
      // Simulate API call to backend to disable 2FA
      // console.log('Disabling 2FA for user:', userId);
      await new Promise(resolve => setTimeout(resolve, 500));
      setIs2faEnabled(false);
      setCurrentSecret(null);
      setQrCodeImage(null);
      setRecoveryCodes([]);
      alert('2FA disabled successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA.');
    }
  };

  const handleGenerateRecoveryCodes = async () => {
    setError(null);
    try {
      // Simulate API call to backend to generate new recovery codes
      // console.log('Generating recovery codes for user:', userId);
      const response = await new Promise<{ recoveryCodes: string[] }>((resolve) => {
        setTimeout(() => {
          resolve({
            recoveryCodes: [
              'CODE-1',
              'CODE-2',
              'CODE-3',
              'CODE-4',
              'CODE-5',
              'CODE-6',
              'CODE-7',
              'CODE-8',
              'CODE-9',
              'CODE-10',
            ],
          });
        }, 1000);
      });
      setRecoveryCodes(response.recoveryCodes);
      alert('New recovery codes generated!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recovery codes.';
      setError(errorMessage);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading 2FA status...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-gray-900">Two-Factor Authentication</h2>
        <button
          onClick={onBack}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Profile
        </button>
      </div>

      {error && <p className="text-red-500 text-center text-sm">{error}</p>}

      {!is2faEnabled && !currentSecret && (
        <div className="text-center">
          <p className="text-gray-600">Two-Factor Authentication is currently disabled.</p>
          <button
            onClick={handleGenerateSecret}
            className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Enable 2FA
          </button>
        </div>
      )}

      {currentSecret && qrCodeImage && !is2faEnabled && (
        <TwoFactorSetup
          secret={currentSecret}
          qrCodeImage={qrCodeImage}
          onVerify={handleVerifyCode}
          onEnable={handleEnable2FA}
          onCancel={() => {setCurrentSecret(null); setQrCodeImage(null);}}
          isVerified={isVerified}
        />
      )}

      {is2faEnabled && (
        <div className="space-y-4">
          <p className="text-green-600 text-center font-medium">Two-Factor Authentication is ENABLED.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleDisable2FA}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Disable 2FA
            </button>
            <button
              onClick={handleGenerateRecoveryCodes}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate New Recovery Codes
            </button>
          </div>
          {recoveryCodes.length > 0 && (
            <RecoveryCodeDisplay recoveryCodes={recoveryCodes} onGenerateNewCodes={handleGenerateRecoveryCodes} />
          )}
        </div>
      )}
    </div>
  );
};
