/**
 * Password Expiry Warning Listener
 * 
 * Listens for password-expiry-warning events and displays the modal
 */

import { useEffect, useState } from 'react';
import { PasswordExpiryWarning } from '@/components/auth/PasswordExpiryWarning';

export const PasswordExpiryListener = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const handlePasswordWarning = (event: CustomEvent) => {
      const { daysRemaining: days } = event.detail;
      setDaysRemaining(days);
      setShowWarning(true);
    };

    window.addEventListener('password-expiry-warning', handlePasswordWarning as EventListener);

    return () => {
      window.removeEventListener('password-expiry-warning', handlePasswordWarning as EventListener);
    };
  }, []);

  if (!showWarning) {
    return null;
  }

  return (
    <PasswordExpiryWarning
      daysRemaining={daysRemaining}
      onDismiss={() => {
        setShowWarning(false);
        // Show again in 24 hours
        setTimeout(() => {
          setShowWarning(true);
        }, 24 * 60 * 60 * 1000);
      }}
      onChangeNow={() => {
        setShowWarning(false);
        window.location.href = '/force-password-change';
      }}
    />
  );
};
