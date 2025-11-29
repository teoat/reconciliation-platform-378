import { useEffect, useState } from 'react';
import type { FrenlyMaintenanceOverallStatus } from './useFrenlyMaintenanceStatus';

export interface MaintenanceRun {
  timestamp: string;
  mode: string;
  overallStatus: FrenlyMaintenanceOverallStatus;
  hardFailures: number;
  softFailures: number;
  durationSeconds: number;
}

interface UseFrenlyMaintenanceHistoryResult {
  runs: MaintenanceRun[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Parse CSV content into maintenance runs.
 * Expected format: timestamp,mode,overallStatus,hardFailures,softFailures,durationSeconds
 */
function parseCSV(csv: string): MaintenanceRun[] {
  const lines = csv.trim().split('\n');
  
  // Skip header
  if (lines.length < 2) {
    return [];
  }
  
  const dataLines = lines.slice(1);
  
  return dataLines
    .map((line) => {
      const parts = line.split(',');
      if (parts.length < 6) return null;
      
      const [timestamp, mode, overallStatus, hardFailures, softFailures, durationSeconds] = parts;
      
      return {
        timestamp,
        mode,
        overallStatus: overallStatus as FrenlyMaintenanceOverallStatus,
        hardFailures: parseInt(hardFailures, 10) || 0,
        softFailures: parseInt(softFailures, 10) || 0,
        durationSeconds: parseInt(durationSeconds, 10) || 0,
      };
    })
    .filter((run): run is MaintenanceRun => run !== null)
    .reverse(); // Most recent first
}

/**
 * Hook to load Frenly maintenance history from CSV.
 *
 * Fetches `docs/diagnostics/frenly-meta-maintenance-log.csv` and parses it.
 * Returns the last N runs (default: 10) sorted by most recent first.
 */
export const useFrenlyMaintenanceHistory = (
  limit = 10
): UseFrenlyMaintenanceHistoryResult => {
  const [runs, setRuns] = useState<MaintenanceRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/docs/diagnostics/frenly-meta-maintenance-log.csv', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`History request failed with ${response.status}`);
        }

        const csv = await response.text();
        const allRuns = parseCSV(csv);

        if (!cancelled) {
          setRuns(allRuns.slice(0, limit));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error loading history';
          setError(message);
          setRuns([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [refreshToken, limit]);

  const refresh = () => {
    setRefreshToken((prev) => prev + 1);
  };

  return { runs, loading, error, refresh };
};

/**
 * Get trend direction based on recent runs.
 * Returns 'improving', 'declining', or 'stable'.
 */
export function getHealthTrend(
  runs: MaintenanceRun[]
): 'improving' | 'declining' | 'stable' {
  if (runs.length < 2) {
    return 'stable';
  }

  const statusScore = (status: FrenlyMaintenanceOverallStatus): number => {
    switch (status) {
      case 'healthy':
        return 2;
      case 'degraded':
        return 1;
      case 'failed':
        return 0;
    }
  };

  // Compare recent runs (last 3) vs older runs (previous 3)
  const recentRuns = runs.slice(0, 3);
  const olderRuns = runs.slice(3, 6);

  if (olderRuns.length === 0) {
    return 'stable';
  }

  const recentAvg = recentRuns.reduce((sum, r) => sum + statusScore(r.overallStatus), 0) / recentRuns.length;
  const olderAvg = olderRuns.reduce((sum, r) => sum + statusScore(r.overallStatus), 0) / olderRuns.length;

  if (recentAvg > olderAvg + 0.3) {
    return 'improving';
  } else if (recentAvg < olderAvg - 0.3) {
    return 'declining';
  }
  
  return 'stable';
}

