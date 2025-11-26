/*
 * Onboarding Analytics Dashboard
 * 
 * Provides comprehensive analytics visualization for onboarding:
 * - Step completion rates
 * - Drop-off analysis
 * - Time spent per step
 * - User engagement metrics
 * - Real-time analytics
 */

import React, { useState, useEffect } from 'react';
import { logger } from '@/services/logger';
import { TrendingUp, TrendingDown, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, LineChart } from '../charts/Charts';
import { onboardingService } from '../../services/onboardingService';
import { OnboardingAnalytics } from '../../services/onboardingService';

interface OnboardingAnalyticsDashboardProps {
  className?: string;
  showRealTime?: boolean;
}

interface AnalyticsData {
  stepCompletion: Array<{
    step: string;
    completed: number;
    started: number;
    dropOff: number;
    completionRate: number;
  }>;
  timeSpent: Array<{ step: string; averageTime: number; medianTime: number }>;
  completionRate: number;
  averageCompletionTime: number;
  totalUsers: number;
  trends: Array<{ date: string; completions: number; dropOffs: number }>;
}

export const OnboardingAnalyticsDashboard: React.FC<OnboardingAnalyticsDashboardProps> = ({
  className = '',
  showRealTime = true,
}) => {
  const [_analytics, setAnalytics] = useState<OnboardingAnalytics[]>([]);
  const [processedData, setProcessedData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
    if (showRealTime) {
      const interval = setInterval(loadAnalytics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [showRealTime, timeRange]);

  const loadAnalytics = () => {
    try {
      const allAnalytics = onboardingService.getAnalytics();
      setAnalytics(allAnalytics);
      processAnalyticsData(allAnalytics);
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load analytics:', { error: error instanceof Error ? error.message : String(error) });
      setIsLoading(false);
    }
  };

  const processAnalyticsData = (data: OnboardingAnalytics[]) => {
    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setTime(0);
    }
    const filteredData = data.filter((item) => new Date(item.timestamp) >= cutoffDate);

    // Group by step
    const stepMap = new Map<string, { completed: number; started: number; durations: number[] }>();
    filteredData.forEach((item) => {
      const step = item.stepId;
      if (!stepMap.has(step)) {
        stepMap.set(step, { completed: 0, started: 0, durations: [] });
      }
      const stepData = stepMap.get(step)!;
      stepData.started++;
      if (item.completed) {
        stepData.completed++;
        stepData.durations.push(item.duration);
      }
    });

    // Calculate step completion data
    const stepCompletion = Array.from(stepMap.entries()).map(([step, data]) => ({
      step,
      completed: data.completed,
      started: data.started,
      dropOff: data.started - data.completed,
      completionRate: data.started > 0 ? (data.completed / data.started) * 100 : 0,
    }));

    // Calculate time spent
    const timeSpent = Array.from(stepMap.entries()).map(([step, data]) => {
      const durations = data.durations.filter((d) => d > 0);
      return {
        step,
        averageTime:
          durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        medianTime:
          durations.length > 0 ? [...durations].sort()[Math.floor(durations.length / 2)] : 0,
      };
    });

    // Calculate overall metrics
    const completedItems = filteredData.filter((item) => item.completed);
    const completionRate =
      filteredData.length > 0 ? (completedItems.length / filteredData.length) * 100 : 0;
    const averageCompletionTime =
      completedItems.length > 0
        ? completedItems.reduce((sum, item) => sum + item.duration, 0) / completedItems.length
        : 0;

    // Calculate trends (group by date)
    const trendsMap = new Map<string, { completions: number; dropOffs: number }>();
    filteredData.forEach((item) => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { completions: 0, dropOffs: 0 });
      }
      const dateData = trendsMap.get(date)!;
      if (item.completed) {
        dateData.completions++;
      } else {
        dateData.dropOffs++;
      }
    });

    const trends = Array.from(trendsMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setProcessedData({
      stepCompletion,
      timeSpent,
      completionRate,
      averageCompletionTime,
      totalUsers: new Set(filteredData.map((item) => item.timestamp)).size,
      trends,
    });
  };

  const _COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        No analytics data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Onboarding Analytics</h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="timeRange" className="sr-only">
            Time Range
          </label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            aria-label="Select time range for analytics"
            title="Time Range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          {showRealTime && (
            <span className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
              Live
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {processedData.completionRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(processedData.averageCompletionTime / 1000)}s
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{processedData.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Steps Tracked</p>
              <p className="text-2xl font-bold text-gray-900">
                {processedData.stepCompletion.length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Step Completion Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Step Completion Rates</h3>
        <div className="space-y-4">
          {processedData.stepCompletion.map((step) => (
            <div key={step.step} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{step.step}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-green-600">Completed: {step.completed}</span>
                  <span className="text-sm text-red-600">Drop-off: {step.dropOff}</span>
                  <span className="text-sm text-gray-600">
                    Rate: {step.completionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${step.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Chart visualization */}
        <div className="mt-4">
          <BarChart
            data={processedData.stepCompletion.map((s) => ({
              label: s.step,
              value: s.completed,
              color: '#10b981',
            }))}
            width={800}
            height={300}
            title="Completed Steps"
          />
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Completion Trends</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <LineChart
            data={processedData.trends.map((t) => ({
              label: t.date,
              value: t.completions,
            }))}
            width={400}
            height={200}
            title="Completions Over Time"
          />
          <LineChart
            data={processedData.trends.map((t) => ({
              label: t.date,
              value: t.dropOffs,
            }))}
            width={400}
            height={200}
            title="Drop-offs Over Time"
          />
        </div>
      </div>

      {/* Time Spent Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Average Time Spent per Step</h3>
        <BarChart
          data={processedData.timeSpent.map((t) => ({
            label: t.step,
            value: Math.round(t.averageTime / 1000), // Convert to seconds
            color: '#3b82f6',
          }))}
          width={800}
          height={300}
          title="Average Time (seconds)"
        />
      </div>
    </div>
  );
};

export default OnboardingAnalyticsDashboard;
