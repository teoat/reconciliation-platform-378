// Real-time Collaboration Component
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Wifi,
  WifiOff,
  Clock,
  User,
  MoreHorizontal,
  Reply,
  Edit,
  Trash2
} from 'lucide-react';
import { useRealtimeCollaboration } from '../hooks/useApi';

interface LiveComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  page: string;
  replies?: LiveComment[];
}

interface ActiveUser {
  id: string;
  name: string;
  page: string;
  lastSeen: string;
}

interface CollaborationPanelProps {
  page: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  page,
  isOpen,
  onToggle,
  className = ''
}) => {
  const {
    isConnected,
    activeUsers,
    liveComments,
    sendComment,
    updatePresence
  } = useRealtimeCollaboration(page);

  const [newComment, setNewComment] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveComments]);

  // Update presence when component mounts
  useEffect(() => {
    if (isConnected) {
      updatePresence('current-user', 'Current User');
    }
  }, [isConnected, updatePresence]);

  const handleSendComment = () => {
    if (newComment.trim()) {
      sendComment('current-user', 'Current User', newComment.trim());
      setNewComment('');
    }
  };

  const handleSendReply = (commentId: string) => {
    if (replyText.trim()) {
      // In a real implementation, this would send a reply
      console.log('Sending reply to comment:', commentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 30000) return 'Online';
    if (diff < 300000) return 'Recently active';
    return `Last seen ${formatTimestamp(lastSeen)}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-4 top-20 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Live Collaboration
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-100 rounded"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Active Users */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Active Users</h3>
              <span className="text-xs text-gray-500">{activeUsers.length}</span>
            </div>
            <div className="space-y-2">
              {activeUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatLastSeen(user.lastSeen)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Comments */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Live Comments</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {liveComments.length === 0 ? (
                  <div className="text-center py-4">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No comments yet</p>
                    <p className="text-xs text-gray-400">Start the conversation!</p>
                  </div>
                ) : (
                  liveComments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {comment.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="ml-8 space-y-2">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSendReply(comment.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleSendReply(comment.id)}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                              className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendComment();
                    }
                  }}
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Floating Collaboration Button
export const CollaborationButton: React.FC<{
  page: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}> = ({ page, isOpen, onToggle, className = '' }) => {
  const { isConnected, activeUsers, liveComments } = useRealtimeCollaboration(page);

  return (
    <button
      onClick={onToggle}
      className={`fixed right-4 top-20 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 ${className}`}
      title="Live Collaboration"
    >
      <div className="relative">
        <MessageSquare className="w-6 h-6 mx-auto" />
        {activeUsers.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeUsers.length}
          </span>
        )}
        {liveComments.length > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {liveComments.length}
          </span>
        )}
        {!isConnected && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
        )}
      </div>
    </button>
  );
};

export default CollaborationPanel;
