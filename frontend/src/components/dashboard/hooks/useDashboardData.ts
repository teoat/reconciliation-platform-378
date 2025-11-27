// Dashboard Data Hook
// Extracted from AnalyticsDashboard.tsx

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';
import type {
  DashboardMetrics,
  ReconciliationStats,
  ProjectStats,
  TrendData,
} from '../types';

interface UseDashboardDataOptions {
  projectId?: string;
  refreshInterval?: number;
  selectedTimeRange?: '7d' | '30d' | '90d' | '1y';
}

export function useDashboardData({
  projectId,
  refreshInterval = 30000,
  selectedTimeRange = '30d',
}: UseDashboardDataOptions) {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [reconciliationStats, setReconciliationStats] = useState<ReconciliationStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard metrics
      interface DashboardApiResponse {
        total_projects?: number;
        total_users?: number;
        total_reconciliation_jobs?: number;
        active_jobs?: number;
        completed_jobs?: number;
        failed_jobs?: number;
        total_matches?: number;
      }
      const dashboardResponse = await apiClient.get<DashboardApiResponse>('/analytics/dashboard');
      if (dashboardResponse.error) {
        throw new Error(String(dashboardResponse.error));
      }
      if (dashboardResponse.data) {
        const data = dashboardResponse.data;
        const adaptedData: DashboardMetrics = {
          total_projects: data.total_projects ?? 0,
          total_users: data.total_users ?? 0,
          total_files: 0,
          total_reconciliation_jobs: data.total_reconciliation_jobs ?? 0,
          active_jobs: data.active_jobs ?? 0,
          completed_jobs: data.completed_jobs ?? 0,
          failed_jobs: dashboardResponse.data.failed_jobs ?? 0,
          total_records_processed: 0,
          total_matches_found: dashboardResponse.data.total_matches ?? 0,
          average_confidence_score: 0,
          average_processing_time: 0,
          system_uptime: 99.9,
          last_updated: new Date().toISOString(),
        };
        setDashboardMetrics(adaptedData);
      }

      // Load reconciliation stats
      interface ReconciliationStatsApiResponse {
        total_jobs?: number;
        active_jobs?: number;
        completed_jobs?: number;
        failed_jobs?: number;
        total_records?: number;
        matched_records?: number;
        unmatched_records?: number;
        average_confidence?: number;
        average_processing_time?: number;
      }
      const reconciliationResponse = await apiClient.get<ReconciliationStatsApiResponse>(
        '/analytics/reconciliation-stats'
      );
      if (reconciliationResponse.error) {
        throw new Error(String(reconciliationResponse.error));
      }
      if (reconciliationResponse.data) {
        const data = reconciliationResponse.data;
        const adaptedStats: ReconciliationStats = {
          total_jobs: data.total_jobs ?? 0,
          active_jobs: 0,
          completed_jobs: data.completed_jobs ?? 0,
          failed_jobs: data.failed_jobs ?? 0,
          queued_jobs: 0,
          total_records_processed: 0,
          total_matches_found: reconciliationResponse.data.matched_records ?? 0,
          total_unmatched_records: reconciliationResponse.data.unmatched_records ?? 0,
          average_confidence_score: reconciliationResponse.data.average_confidence ?? 0,
          average_processing_time: reconciliationResponse.data.average_processing_time ?? 0,
          success_rate: 0,
          throughput_per_hour: 0,
        };
        setReconciliationStats(adaptedStats);
      }

      // Load project stats if projectId is provided
      if (projectId) {
        interface ProjectStatsApiResponse {
          project_id?: string;
          project_name?: string;
          total_files?: number;
          total_jobs?: number;
          completed_jobs?: number;
          failed_jobs?: number;
          total_records?: number;
          matched_records?: number;
          unmatched_records?: number;
          average_confidence?: number;
          last_activity?: string;
          created_at?: string;
        }
        const projectResponse = await apiClient.get<ProjectStatsApiResponse>(
          `/projects/${projectId}/stats`
        );
        if (projectResponse.error) {
          throw new Error(String(projectResponse.error));
        }
        if (projectResponse.data) {
          setProjectStats([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadTrendData = useCallback(async () => {
    try {
      // Mock data for now
      const mockTrendData: TrendData[] = [
        {
          date: '2024-01-01',
          total_jobs: 10,
          completed_jobs: 8,
          failed_jobs: 2,
          records_processed: 1000,
          matches_found: 800,
          average_confidence: 85,
        },
        {
          date: '2024-01-02',
          total_jobs: 15,
          completed_jobs: 12,
          failed_jobs: 3,
          records_processed: 1500,
          matches_found: 1200,
          average_confidence: 87,
        },
        {
          date: '2024-01-03',
          total_jobs: 12,
          completed_jobs: 10,
          failed_jobs: 2,
          records_processed: 1200,
          matches_found: 1000,
          average_confidence: 86,
        },
        {
          date: '2024-01-04',
          total_jobs: 18,
          completed_jobs: 15,
          failed_jobs: 3,
          records_processed: 1800,
          matches_found: 1500,
          average_confidence: 88,
        },
        {
          date: '2024-01-05',
          total_jobs: 20,
          completed_jobs: 18,
          failed_jobs: 2,
          records_processed: 2000,
          matches_found: 1800,
          average_confidence: 89,
        },
      ];
      setTrendData(mockTrendData);
    } catch (err) {
      // Handle error silently for now
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [loadDashboardData, refreshInterval]);

  return {
    dashboardMetrics,
    projectStats,
    reconciliationStats,
    trendData,
    loading,
    error,
    loadDashboardData,
    loadTrendData,
  };
}

