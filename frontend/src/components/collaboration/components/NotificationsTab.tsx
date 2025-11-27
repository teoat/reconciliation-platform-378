// ============================================================================
// NOTIFICATIONS TAB COMPONENT
// ============================================================================

import React from 'react';
import { UserPlus, MessageSquare, User, CheckCircle, Bell } from 'lucide-react';
import type { Notification } from '../types';
import { formatTimeAgo } from '../../../utils/common/dateFormatting';

interface NotificationsTabProps {
  notifications: Notification[];
  onMarkRead: (notificationId: string) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications, onMarkRead }) => {
  return (
    <div className="p-6">
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              notification.read
                ? 'border-secondary-200 bg-white'
                : 'border-primary-200 bg-primary-50'
            }`}
            onClick={() => onMarkRead(notification.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMarkRead(notification.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Mark notification ${notification.id} as read`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'assignment'
                  ? 'bg-blue-100'
                  : notification.type === 'comment'
                    ? 'bg-green-100'
                    : notification.type === 'mention'
                      ? 'bg-yellow-100'
                      : notification.type === 'approval'
                        ? 'bg-purple-100'
                        : 'bg-gray-100'
              }`}
            >
              {notification.type === 'assignment' ? (
                <UserPlus className="w-4 h-4 text-blue-600" />
              ) : notification.type === 'comment' ? (
                <MessageSquare className="w-4 h-4 text-green-600" />
              ) : notification.type === 'mention' ? (
                <User className="w-4 h-4 text-yellow-600" />
              ) : notification.type === 'approval' ? (
                <CheckCircle className="w-4 h-4 text-purple-600" />
              ) : (
                <Bell className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-secondary-900">{notification.title}</h4>
                <span className="text-sm text-secondary-500">{formatTimeAgo(notification.timestamp)}</span>
              </div>
              <p className="text-sm text-secondary-600">{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

