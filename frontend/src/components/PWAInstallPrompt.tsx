import React, { useState, useEffect } from 'react';
import { pwaService } from '../services/pwaService';

const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after some time if installable
    const timer = setTimeout(() => {
      if (pwaService.canInstall()) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    const installed = await pwaService.install();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">Install App</h3>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Install our app for a better experience with offline access and faster loading.
      </p>
      <div className="flex space-x-2">
        <button
          onClick={handleInstall}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-300"
        >
          Not now
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
