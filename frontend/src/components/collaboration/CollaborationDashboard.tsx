// ============================================================================
// REAL-TIME COLLABORATION DASHBOARD - PHASE 3 EXPANSION FEATURE
// ============================================================================
// Based on refactored codebase analysis, this is the next logical feature
// Leverages existing WebSocket infrastructure and collaboration components

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useWebSocketIntegration } from '../../hooks/useWebSocketIntegration';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { DataTable, Column } from '../ui/DataTable';
import { logger } from '../../services/logger';
import {
  Users,
  MessageSquare,
  Activity,
  Eye,
  Clock,
  UserPlus,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  currentPage?: string;
  lastActivity: Date;
}

export interface CollaborationActivity {
  id: string;
  userId: string;
  userName: string;
  action: 'viewed' | 'edited' | 'commented' | 'shared' | 'joined' | 'left';
  target: string;
  targetType: 'project' | 'file' | 'reconciliation' | 'comment';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CollaborationComment {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  content: string;
  targetId: string;
  targetType: 'project' | 'file' | 'reconciliation';
  timestamp: Date;
  resolved?: boolean;
}

export interface CollaborationSession {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  participants: CollaborationUser[];
  activities: CollaborationActivity[];
  comments: CollaborationComment[];
  createdAt: Date;
  updatedAt: Date;
}

interface CollaborationDashboardProps {
  projectId?: string;
  className?: string;
}

// ============================================================================
// COLLABORATION DASHBOARD COMPONENT
// ============================================================================

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = memo(
  ({ projectId, className = '' }) => {
    const { user } = useAuth();
    const { isConnected, subscribe, unsubscribe } = useWebSocketIntegration();

    const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
    const [activities, setActivities] = useState<CollaborationActivity[]>([]);
    const [comments, setComments] = useState<CollaborationComment[]>([]);
    const [sessions, setSessions] = useState<CollaborationSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<CollaborationSession | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionSubscriptionId, setSessionSubscriptionId] = useState<string | null>(null);
    const [usersSubscriptionId, setUsersSubscriptionId] = useState<string | null>(null);
    const [activitiesSubscriptionId, setActivitiesSubscriptionId] = useState<string | null>(null);

    // Memoized handlers
    const handleJoinSession = useCallback(
      (sessionId: string) => {
        logger.logUserAction('join_collaboration_session', 'CollaborationDashboard', { sessionId });

        // Subscribe to session updates
        const subId = subscribe(
          `collaboration:session:${sessionId}`,
          (data: {
            type:
              | 'user_joined'
              | 'user_left'
              | 'activity'
              | 'comment'
              | 'cursor_move'
              | 'selection_change';
            user?: { id: string; name: string; email: string };
            userId?: string;
            activity?: { id: string; userId: string; action: string; timestamp: string };
            comment?: { id: string; userId: string; message: string; timestamp: string };
          }) => {
            if (data.type === 'user_joined') {
              setActiveUsers((prev) => [
                ...prev,
                {
                  ...data.user,
                  status: 'online' as const,
                  lastActivity: new Date(),
                },
              ]);
            } else if (data.type === 'user_left') {
              setActiveUsers((prev) => prev.filter((u) => u.id !== data.userId));
            } else if (data.type === 'activity') {
              if (data.activity) {
                const activityData = data.activity as Record<string, unknown>;
                const activity: CollaborationActivity = {
                  id: String(activityData.id || ''),
                  userId: String(activityData.userId || ''),
                  userName: String(activityData.userName || 'Unknown'),
                  action: (['viewed', 'edited', 'commented', 'shared', 'joined', 'left'].includes(
                    String(activityData.action)
                  )
                    ? String(activityData.action)
                    : 'viewed') as CollaborationActivity['action'],
                  target: String(activityData.target || ''),
                  targetType: (['project', 'file', 'reconciliation', 'comment'].includes(
                    String(activityData.targetType)
                  )
                    ? String(activityData.targetType)
                    : 'project') as CollaborationActivity['targetType'],
                  timestamp: new Date(String(activityData.timestamp || Date.now())),
                  metadata: activityData.details as Record<string, unknown> | undefined,
                };
                setActivities((prev) => [activity, ...prev].slice(0, 100));
              }
            } else if (data.type === 'comment') {
              if (data.comment) {
                const commentData = data.comment as Record<string, unknown>;
                const comment: CollaborationComment = {
                  id: String(commentData.id || ''),
                  userId: String(commentData.userId || ''),
                  userName: String(commentData.userName || 'Unknown'),
                  content: String(commentData.message || ''),
                  targetId: String(commentData.targetId || ''),
                  targetType: (['project', 'file', 'reconciliation'].includes(
                    String(commentData.targetType)
                  )
                    ? String(commentData.targetType)
                    : 'project') as CollaborationComment['targetType'],
                  timestamp: new Date(String(commentData.timestamp || Date.now())),
                  resolved: commentData.resolved as boolean | undefined,
                };
                setComments((prev) => [comment, ...prev]);
              }
            }
          }
        );
        setSessionSubscriptionId(subId);

        logger.info('Joined collaboration session', { sessionId });
      },
      [subscribe]
    );

    const handleLeaveSession = useCallback(
      (sessionId: string) => {
        logger.logUserAction('leave_collaboration_session', 'CollaborationDashboard', {
          sessionId,
        });
        if (sessionSubscriptionId) {
          unsubscribe(`collaboration:session:${sessionId}`, sessionSubscriptionId);
          setSessionSubscriptionId(null);
        }
        setSelectedSession(null);
        logger.info('Left collaboration session', { sessionId });
      },
      [unsubscribe, sessionSubscriptionId]
    );

    const handleSendComment = useCallback(() => {
      if (!newComment.trim() || !selectedSession) return;

      const comment: CollaborationComment = {
        id: `comment_${Date.now()}`,
        userId: user?.id || '',
        userName: user ? `${user.first_name} ${user.last_name}` : 'Anonymous',
        avatar: undefined,
        content: newComment.trim(),
        targetId: selectedSession.projectId || '',
        targetType: 'project',
        timestamp: new Date(),
        resolved: false,
      };

      setComments((prev) => [comment, ...prev]);
      setNewComment('');

      logger.logUserAction('send_collaboration_comment', 'CollaborationDashboard', {
        sessionId: selectedSession.id,
        commentId: comment.id,
      });
    }, [newComment, selectedSession, user]);

    const handleResolveComment = useCallback((commentId: string) => {
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)));

      logger.logUserAction('resolve_collaboration_comment', 'CollaborationDashboard', {
        commentId,
      });
    }, []);

    // Memoized computed values
    const onlineUsers = useMemo(
      () => activeUsers.filter((u) => u.status === 'online'),
      [activeUsers]
    );

    const recentActivities = useMemo(() => activities.slice(0, 10), [activities]);

    const unresolvedComments = useMemo(() => comments.filter((c) => !c.resolved), [comments]);

    // Memoized activity table columns
    const activityColumns = useMemo(
      () => [
        {
          key: 'userName' as const,
          header: 'User',
          render: (value: string, row: CollaborationActivity) => (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <span>{value}</span>
            </div>
          ),
        },
        {
          key: 'action' as const,
          header: 'Action',
          render: (value: string) => (
            <StatusBadge status={value === 'edited' ? 'warning' : 'info'}>{value}</StatusBadge>
          ),
        },
        {
          key: 'target' as const,
          label: 'Target',
          render: (value: string, row: CollaborationActivity) => (
            <div className="flex items-center space-x-2">
              <span className="text-sm">{row.targetType}</span>
              <span className="text-xs text-gray-500">{value}</span>
            </div>
          ),
        },
        {
          key: 'timestamp' as const,
          label: 'Time',
          render: (value: Date) => (
            <span className="text-sm text-gray-600">{new Date(value).toLocaleTimeString()}</span>
          ),
        },
      ],
      []
    );

    // Load collaboration data on mount
    useEffect(() => {
      if (!isConnected) return;

      setIsLoading(true);

      // Subscribe to collaboration updates
      const usersSubId = subscribe(
        'collaboration:users',
        (data: {
          type: 'users_update';
          users: Array<{ id: string; name: string; email: string; lastSeen: string }>;
        }) => {
          if (data.type === 'users_update') {
            setActiveUsers(
              data.users.map((user) => ({
                ...user,
                status: 'online' as const,
                lastActivity: new Date(user.lastSeen),
              }))
            );
          }
        }
      );
      setUsersSubscriptionId(usersSubId);

      const activitiesSubId = subscribe(
        'collaboration:activities',
        (data: {
          type: 'activity';
          activity: {
            id: string;
            userId: string;
            action: string;
            timestamp: string;
            details?: Record<string, unknown>;
          };
        }) => {
          if (data.type === 'activity') {
            const activityData = data.activity as Record<string, unknown>;
            const activity: CollaborationActivity = {
              id: String(activityData.id || ''),
              userId: String(activityData.userId || ''),
              userName: String(activityData.userName || 'Unknown'),
              action: (['viewed', 'edited', 'commented', 'shared', 'joined', 'left'].includes(
                String(activityData.action)
              )
                ? String(activityData.action)
                : 'viewed') as CollaborationActivity['action'],
              target: String(activityData.target || ''),
              targetType: (['project', 'file', 'reconciliation', 'comment'].includes(
                String(activityData.targetType)
              )
                ? String(activityData.targetType)
                : 'project') as CollaborationActivity['targetType'],
              timestamp: new Date(String(activityData.timestamp || Date.now())),
              metadata: activityData.details as Record<string, unknown> | undefined,
            };
            setActivities((prev) => [activity, ...prev].slice(0, 100));
          }
        }
      );
      setActivitiesSubscriptionId(activitiesSubId);

      logger.info('Collaboration dashboard initialized', { projectId });

      return () => {
        if (usersSubscriptionId) {
          unsubscribe('collaboration:users', usersSubscriptionId);
        }
        if (activitiesSubscriptionId) {
          unsubscribe('collaboration:activities', activitiesSubscriptionId);
        }
      };
    }, [isConnected, subscribe, unsubscribe, projectId]);

    if (!isConnected) {
      return (
        <Card className={className}>
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">WebSocket Disconnected</h3>
            <p className="text-gray-600">
              Real-time collaboration requires an active WebSocket connection.
            </p>
          </div>
        </Card>
      );
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Skip Link */}
        <a
          href="#collaboration-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
        >
          Skip to collaboration content
        </a>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Collaboration Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time collaboration and team activity</p>
          </div>
          <StatusBadge status={isConnected ? 'success' : 'error'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </StatusBadge>
        </div>

        <div id="collaboration-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Users */}
          <Card title="Active Users" className="lg:col-span-1">
            <div className="space-y-3">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((activeUser) => (
                  <div
                    key={activeUser.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {activeUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                          aria-label="Online"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{activeUser.name}</div>
                        {activeUser.currentPage && (
                          <div className="text-sm text-gray-500">
                            <Eye className="w-3 h-3 inline mr-1" aria-hidden="true" />
                            {activeUser.currentPage}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" aria-hidden="true" />
                      {new Date(activeUser.lastActivity).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
                  <p>No active users</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activities */}
          <Card title="Recent Activities" className="lg:col-span-2">
            {recentActivities.length > 0 ? (
              <DataTable
                data={recentActivities as unknown as Record<string, unknown>[]}
                columns={activityColumns as Column<Record<string, unknown>>[]}
                searchable={false}
                pagination={false}
                emptyMessage="No recent activities"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
                <p>No recent activities</p>
              </div>
            )}
          </Card>

          {/* Comments */}
          <Card title="Comments" className="lg:col-span-3">
            <div className="space-y-4">
              {/* Comment Input */}
              {selectedSession && (
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Comment input"
                  />
                  <Button
                    onClick={handleSendComment}
                    disabled={!newComment.trim()}
                    aria-label="Send comment"
                  >
                    <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                    Send
                  </Button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 border rounded-lg ${
                        comment.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {comment.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{comment.userName}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {!comment.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id)}
                            aria-label={`Resolve comment by ${comment.userName}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                            Resolve
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      aria-hidden="true"
                    />
                    <p>No comments yet</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <Card title="Statistics" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" aria-hidden="true" />
                <div className="text-2xl font-bold text-gray-900">{onlineUsers.length}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" aria-hidden="true" />
                <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <MessageSquare
                  className="w-8 h-8 text-yellow-600 mx-auto mb-2"
                  aria-hidden="true"
                />
                <div className="text-2xl font-bold text-gray-900">{comments.length}</div>
                <div className="text-sm text-gray-600">Comments</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" aria-hidden="true" />
                <div className="text-2xl font-bold text-gray-900">{unresolvedComments.length}</div>
                <div className="text-sm text-gray-600">Unresolved</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }
);

CollaborationDashboard.displayName = 'CollaborationDashboard';

export default CollaborationDashboard;
