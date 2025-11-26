// Reconciliation Streak Badge Component
// Visual representation of user's reconciliation streak

import React from 'react';
import { Flame } from 'lucide-react';
import { Shield } from 'lucide-react';
import Card from '../ui/Card';
import { useReconciliationStreak } from '../../hooks/useReconciliationStreak';

interface ReconciliationStreakBadgeProps {
  userId: string;
  onProtect?: () => void;
}

export const ReconciliationStreakBadge: React.FC<ReconciliationStreakBadgeProps> = ({
  userId,
  onProtect,
}) => {
  const { streak, getStreakStatus, protectStreak } = useReconciliationStreak(userId);
  const status = getStreakStatus();

  if (streak.currentStreak === 0) {
    return null; // Don't show if no streak
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-full ${
              status.variant === 'success' ? 'bg-orange-100' : 'bg-yellow-100'
            }`}
          >
            {status.variant === 'success' ? (
              <Flame className="h-6 w-6 text-orange-600" />
            ) : (
              <Shield className="h-6 w-6 text-yellow-600" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                {streak.currentStreak} Day Streak
              </span>
              {streak.streakProtected && (
                <span title="Streak Protected">
                  <Shield className="h-4 w-4 text-blue-500" />
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">Best: {streak.longestStreak} days</div>
          </div>
        </div>

        {status.showWarning && streak.protectedStreaks < 2 && (
          <button
            onClick={() => {
              protectStreak();
              onProtect?.();
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            Protect Streak
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mt-3 pt-3 border-t border-orange-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Next milestone: {getNextMilestone(streak.currentStreak)} days</span>
          {streak.streakProtected && (
            <span className="text-blue-600 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Protected
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

function getNextMilestone(current: number): number {
  const milestones = [7, 14, 30, 60, 100];
  return milestones.find((m) => m > current) || milestones[milestones.length - 1];
}
