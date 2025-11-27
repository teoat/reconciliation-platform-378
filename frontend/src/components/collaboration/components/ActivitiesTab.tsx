// ============================================================================
// ACTIVITIES TAB COMPONENT
// ============================================================================

import React from 'react';
import type { ActivityItem } from '../types';
import { getActivityIcon } from '../utils/helpers';
import { formatTimeAgo } from '../../../utils/common/dateFormatting';

interface ActivitiesTabProps {
  activities: ActivityItem[];
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ activities }) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-4 border border-secondary-200 rounded-lg"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-secondary-900">{activity.userName}</span>
                <span className="text-sm text-secondary-600">{activity.description}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-secondary-500">
                <span>{formatTimeAgo(activity.timestamp)}</span>
                {activity.recordId && <span>Record: {activity.recordId}</span>}
                <span>{activity.readBy.length} read</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

