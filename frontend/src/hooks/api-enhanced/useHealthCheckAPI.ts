// ============================================================================
// HEALTH CHECK API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import ApiService from '../../services/ApiService';

export const useHealthCheckAPI = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setIsChecking(true);
      setError(null);
      const result = await ApiService.healthCheck();
      const isValidHealthResult = (data: unknown): data is { status: string } => {
        return typeof data === 'object' && data !== null && 'status' in data;
      };
      
      setIsHealthy(isValidHealthResult(result) ? result.status === 'ok' : false);
      setLastChecked(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setIsHealthy(false);
      setError(errorMessage);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    isChecking,
    lastChecked,
    error,
    checkHealth,
  };
};

