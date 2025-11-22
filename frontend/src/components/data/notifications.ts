// Notifications & Alerts Module
import { useState, useCallback, useRef } from 'react';
import { CircularBuffer } from '../../utils/memoryOptimization';
import type { Notification, Alert } from './types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsBufferRef = useRef(new CircularBuffer<Notification>(50)); // Limit to last 50

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Use circular buffer to limit memory
    notificationsBufferRef.current.push(newNotification);
    const allNotifications = notificationsBufferRef.current.getAll();
    setNotifications(allNotifications);
  }, []);

  return {
    notifications,
    addNotification,
  };
};

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]); // Keep last 20
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, isDismissed: true } : alert))
    );
  }, []);

  return {
    alerts,
    addAlert,
    dismissAlert,
  };
};
