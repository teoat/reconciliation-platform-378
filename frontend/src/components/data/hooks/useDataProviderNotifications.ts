// Data Provider Notifications Hook
import { useNotifications, useAlerts } from './notifications';

export const useDataProviderNotifications = () => {
  const { notifications, addNotification } = useNotifications();
  const { alerts, addAlert, dismissAlert } = useAlerts();

  return {
    notifications,
    alerts,
    addNotification,
    addAlert,
    dismissAlert,
  };
};
