// Reconciliation Metrics Component
// Extracted from AnalyticsDashboard.tsx

import React, { lazy, Suspense } from 'react';
import { CheckCircle, Target, Shield, Zap } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { getMetricColor } from '../utils/metrics';
import { ProgressiveFeatureDisclosure } from '@/components/ui/ProgressiveFeatureDisclosure';
import { onboardingService } from '@/services/onboardingService';
import type { ReconciliationStats, DerivedMetrics } from '../types';

const LineChart = lazy(() =>
  import('../../charts').then((module) => ({ default: module.LineChart }))
);
const BarChart = lazy(() =>
  import('../../charts').then((module) => ({ default: module.BarChart }))
);
const PieChart = lazy(() =>
  import('../../charts').then((module) => ({ default: module.PieChart }))
);

interface ReconciliationMetricsProps {
  stats: ReconciliationStats;
  derivedMetrics: DerivedMetrics;
}

export const ReconciliationMetrics: React.FC<ReconciliationMetricsProps> = ({
  stats,
  derivedMetrics,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={CheckCircle}
          label="Success Rate"
          value={`${derivedMetrics.success_rate.toFixed(1)}%`}
          color={getMetricColor(derivedMetrics.success_rate, { good: 90, fair: 70 })}
        />
        <MetricCard
          icon={Target}
          label="Match Rate"
          value={`${derivedMetrics.match_rate.toFixed(1)}%`}
          color={getMetricColor(derivedMetrics.match_rate, { good: 80, fair: 60 })}
        />
        <MetricCard
          icon={Shield}
          label="Avg Confidence"
          value={`${stats.average_confidence_score.toFixed(1)}%`}
          color={getMetricColor(stats.average_confidence_score, { good: 85, fair: 70 })}
        />
        <MetricCard
          icon={Zap}
          label="Throughput/Hour"
          value={derivedMetrics.throughput_per_hour.toFixed(0)}
          color={getMetricColor(derivedMetrics.throughput_per_hour, { good: 100, fair: 50 })}
        />
      </div>

      <ProgressiveFeatureDisclosure
        feature={{
          id: 'advanced-analytics-charts',
          name: 'Advanced Analytics Charts',
          description: 'Interactive charts and trend analysis for deeper insights',
          unlockRequirements: {
            onboardingSteps: ['upload-files', 'configure-reconciliation', 'review-matches'],
            minProgress: 50,
          },
          lockedMessage: 'Complete reconciliation workflow to unlock advanced analytics',
        }}
        userProgress={onboardingService.getProgress('initial').completedSteps}
        showUnlockAnimation={true}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Job Status Distribution</h3>
            </div>
            <div className="p-6">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
              >
                <PieChart
                  data={[
                    { label: 'Active', value: stats.active_jobs, color: '#3B82F6' },
                    { label: 'Completed', value: stats.completed_jobs, color: '#10B981' },
                    { label: 'Failed', value: stats.failed_jobs, color: '#EF4444' },
                    { label: 'Queued', value: stats.queued_jobs, color: '#F59E0B' },
                  ]}
                  width={300}
                  height={200}
                  title="Job Status Distribution"
                />
              </Suspense>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
            </div>
            <div className="p-6">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
              >
                <LineChart
                  data={[
                    { label: 'Success Rate', value: derivedMetrics.success_rate },
                    { label: 'Match Rate', value: derivedMetrics.match_rate },
                    { label: 'Avg Confidence', value: stats.average_confidence_score },
                    { label: 'Throughput/hr', value: derivedMetrics.throughput_per_hour },
                  ]}
                  width={300}
                  height={200}
                  title="Key Performance Indicators"
                />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Data Processing Volume</h3>
          </div>
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <BarChart
                data={[
                  { label: 'Total Records', value: stats.total_records_processed },
                  { label: 'Matched Records', value: stats.total_matches_found },
                  { label: 'Unmatched Records', value: stats.total_unmatched_records },
                ]}
                width={600}
                height={250}
                title="Records Processed"
              />
            </Suspense>
          </div>
        </div>
      </ProgressiveFeatureDisclosure>
    </>
  );
};

