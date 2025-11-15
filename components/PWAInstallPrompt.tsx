import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { pwaService } from '../services/pwaService';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const checkInstallStatus = () => {
      const status = pwaService.getStatus();
      setShowPrompt(status.canInstall && !status.isInstalled);
    };

    // Check immediately
    checkInstallStatus();

    // Listen for install prompt events
    pwaService.on('canInstall', checkInstallStatus);

    return () => {
      pwaService.off('canInstall', checkInstallStatus);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaService.install();
      if (success) {
        setShowPrompt(false);
        onClose?.();
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    onClose?.();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Install App</h3>
              <p className="text-sm text-gray-600">Get the full experience</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close install prompt"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p id="install-description" className="text-sm text-gray-700 mb-4">
          Install our app for a better experience with offline access, faster loading, and push
          notifications.
        </p>

        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            aria-describedby="install-description"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Installing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Install</span>
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
