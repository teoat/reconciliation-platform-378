// Real-time UI Components
import React, { useState, useEffect } from 'react';
import {
  useRealtimeConnection,
  useUserPresence,
  useComments,
  useNotifications,
} from '../hooks/useRealtime';
import { Bell } from 'lucide-react';
import { Users } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Wifi } from 'lucide-react';
import { WifiOff } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

// Connection Status Indicator
export const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionStatus } = useRealtimeConnection();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
        return (
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'disconnected':
      case 'error':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium capitalize">{connectionStatus}</span>
    </div>
  );
};

// User Presence Indicator
export const UserPresenceIndicator: React.FC<{ page: string }> = ({ page }) => {
  const { activeUsers, startTracking, stopTracking } = useUserPresence(page);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  return (
    <div className="flex items-center space-x-2">
      <Users className="w-4 h-4 text-blue-500" />
      <span className="text-sm text-gray-600">
        {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} online
      </span>
      {activeUsers.length > 0 && (
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 3).map((user) => (
            <div
              key={user.user_id}
              className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
              title={user.username}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {activeUsers.length > 3 && (
            <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">
              +{activeUsers.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Notifications Panel
export const NotificationsPanel: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <AlertCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.level)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Live Comments Panel
export const LiveCommentsPanel: React.FC<{ page: string }> = ({ page }) => {
  const { comments, addComment } = useComments(page);
  const [newComment, setNewComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <MessageCircle className="w-5 h-5" />
        {comments.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {comments.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Live Comments</h3>
            <p className="text-sm text-gray-600">Page: {page}</p>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500">No comments yet</div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{comment.username}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Progress Indicator for Real-time Updates
export const ProgressIndicator: React.FC<{
  type: 'reconciliation' | 'upload';
  jobId: string;
  progress: number;
  status: string;
}> = ({ type, jobId, progress, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'processing':
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900">
          {type === 'reconciliation' ? 'Reconciliation' : 'File Upload'}
        </h4>
        <span className="text-sm text-gray-500">{Math.round(progress * 100)}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{getStatusText()}</span>
        <span className="text-xs text-gray-400">{jobId}</span>
      </div>
    </div>
  );
};

// Real-time Activity Feed
export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    // This would integrate with the real-time updates
    const handleActivity = (data: Record<string, unknown>) => {
      setActivities((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50 activities
    };

    // Add event listeners for various activities
    // realtimeService.on('user_join', handleActivity);
    // realtimeService.on('comment_add', handleActivity);
    // realtimeService.on('reconciliation_complete', handleActivity);

    return () => {
      // Clean up event listeners
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No recent activity</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {activity.user?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
