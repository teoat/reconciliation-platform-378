import { useEffect, useState } from 'react';

export type FrenlyMaintenanceOverallStatus = 'healthy' | 'degraded' | 'failed';

export interface FrenlyCheckDetail {
  name: string;
  status: 'passed' | 'failed';
  severity: 'hard' | 'soft';
  durationSeconds: number;
}

export interface FrenlyMaintenanceStatus {
  lastRun: string;
  mode: string;
  overallStatus: FrenlyMaintenanceOverallStatus;
  hardFailures: number;
  softFailures: number;
  durationSeconds: number;
  reportPath: string;
  failedChecks: string[];
  checkDetails?: FrenlyCheckDetail[];
}

interface UseFrenlyMaintenanceStatusResult {
  status: FrenlyMaintenanceStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to load Frenly meta-maintenance status produced by the backend script.
 *
 * Tries to fetch `docs/diagnostics/frenly-meta-status.json` from the app.
 * Fails gracefully and never throws in components.
 */
export const useFrenlyMaintenanceStatus = (): UseFrenlyMaintenanceStatusResult => {
  const [status, setStatus] = useState<FrenlyMaintenanceStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/docs/diagnostics/frenly-meta-status.json', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Status request failed with ${response.status}`);
        }

        const data = (await response.json()) as FrenlyMaintenanceStatus;

        if (!cancelled) {
          setStatus(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error loading status';
          setError(message);
          setStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const refresh = () => {
    setRefreshToken((prev) => prev + 1);
  };

  return { status, loading, error, refresh };
};
