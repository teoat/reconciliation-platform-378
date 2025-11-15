/**
 * ToastContainer - Displays toast notifications
 * Must be included in App.tsx to show toasts
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Info } from 'lucide-react'
import { AlertTriangle } from 'lucide-react';
import { Toast, useToast } from '../../hooks/useToast';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { subscribe } = useToast();

  useEffect(() => {
    const unsubscribe = subscribe(setToasts);
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [subscribe]);

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" role="region" aria-label="Toast notifications" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-md ${getStyles(toast.type)}`}
          role="alert"
        >
          <div className="flex-shrink-0">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

