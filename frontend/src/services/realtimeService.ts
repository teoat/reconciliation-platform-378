// Real-time Frontend Service
// This service handles WebSocket connections and real-time updates

import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  data?: any;
  id?: string;
  timestamp?: string;
}

export interface UserPresence {
  user_id: string;
  username: string;
  page: string;
  last_seen: string;
  cursor_position?: {
    x: number;
    y: number;
    element?: string;
  };
}

export interface Comment {
  id: string;
  user_id: string;
  username: string;
  page: string;
  message: string;
  position?: {
    x: number;
    y: number;
    element?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface RealtimeUpdate {
  id: string;
  user_id: string;
  update_type: 'reconciliation_progress' | 'file_upload_progress' | 'system_alert' | 'user_activity' | 'data_change';
  data: any;
  timestamp: string;
}

export interface ReconciliationProgress {
  job_id: string;
  progress: number;
  status: string;
}

export interface FileUploadProgress {
  file_id: string;
  progress: number;
  status: string;
}

class RealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private userId: string | null = null;
  private username: string | null = null;
  private currentPage: string | null = null;

  constructor(url: string = 'ws://localhost:2000/ws') {
    super();
    this.url = url;
  }

  // Connection Management
  async connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = token ? `${this.url}?token=${token}` : this.url;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.isAuthenticated = false;
          this.stopHeartbeat();
          this.emit('disconnected');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Message Handling
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'auth_success':
        this.isAuthenticated = true;
        this.userId = message.data?.user_id;
        this.username = message.data?.username;
        this.emit('authenticated', message.data);
        break;

      case 'auth_error':
        this.isAuthenticated = false;
        this.emit('auth_error', message.data);
        break;

      case 'user_join':
        this.emit('user_join', message.data);
        break;

      case 'user_leave':
        this.emit('user_leave', message.data);
        break;

      case 'user_presence':
        this.emit('user_presence', message.data);
        break;

      case 'comment_add':
        this.emit('comment_add', message.data);
        break;

      case 'comment_update':
        this.emit('comment_update', message.data);
        break;

      case 'comment_delete':
        this.emit('comment_delete', message.data);
        break;

      case 'reconciliation_start':
        this.emit('reconciliation_start', message.data);
        break;

      case 'reconciliation_progress':
        this.emit('reconciliation_progress', message.data);
        break;

      case 'reconciliation_complete':
        this.emit('reconciliation_complete', message.data);
        break;

      case 'reconciliation_error':
        this.emit('reconciliation_error', message.data);
        break;

      case 'file_upload_start':
        this.emit('file_upload_start', message.data);
        break;

      case 'file_upload_progress':
        this.emit('file_upload_progress', message.data);
        break;

      case 'file_upload_complete':
        this.emit('file_upload_complete', message.data);
        break;

      case 'file_upload_error':
        this.emit('file_upload_error', message.data);
        break;

      case 'notification':
        this.emit('notification', message.data);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  // Authentication
  async authenticate(token: string): Promise<void> {
    this.send({
      type: 'auth',
      data: { token }
    });
  }

  // User Presence
  joinPage(page: string) {
    if (this.isAuthenticated && this.userId && this.username) {
      this.currentPage = page;
      this.send({
        type: 'user_join',
        data: {
          user_id: this.userId,
          username: this.username,
          page: page
        }
      });
    }
  }

  leavePage() {
    if (this.currentPage) {
      this.send({
        type: 'user_leave',
        data: {
          user_id: this.userId,
          page: this.currentPage
        }
      });
      this.currentPage = null;
    }
  }

  updateCursorPosition(x: number, y: number, element?: string) {
    if (this.isAuthenticated && this.currentPage) {
      this.send({
        type: 'cursor_update',
        data: {
          user_id: this.userId,
          page: this.currentPage,
          position: { x, y, element }
        }
      });
    }
  }

  // Comments
  addComment(message: string, position?: { x: number; y: number; element?: string }) {
    if (this.isAuthenticated && this.userId && this.username && this.currentPage) {
      this.send({
        type: 'comment_add',
        data: {
          user_id: this.userId,
          username: this.username,
          page: this.currentPage,
          message,
          position,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  updateComment(commentId: string, message: string) {
    this.send({
      type: 'comment_update',
      data: {
        id: commentId,
        message
      }
    });
  }

  deleteComment(commentId: string) {
    this.send({
      type: 'comment_delete',
      data: {
        id: commentId
      }
    });
  }

  // Reconciliation Updates
  startReconciliation(jobId: string, projectId: string) {
    this.send({
      type: 'reconciliation_start',
      data: {
        job_id: jobId,
        project_id: projectId
      }
    });
  }

  // File Upload Updates
  startFileUpload(fileId: string, filename: string) {
    this.send({
      type: 'file_upload_start',
      data: {
        file_id: fileId,
        filename: filename
      }
    });
  }

  // Utility Methods
  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
    this.isConnected = false;
    this.isAuthenticated = false;
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get authenticated(): boolean {
    return this.isAuthenticated;
  }

  get currentUserId(): string | null {
    return this.userId;
  }

  get currentUsername(): string | null {
    return this.username;
  }

  get currentPageName(): string | null {
    return this.currentPage;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
