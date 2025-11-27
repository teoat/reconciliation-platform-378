// ============================================================================
// COLLABORATIVE FEATURES TYPES
// ============================================================================

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  currentActivity?: string;
  permissions: string[];
  joinedAt: string;
  skills: string[];
  workload: number;
  performance: {
    tasksCompleted: number;
    accuracy: number;
    efficiency: number;
    collaboration: number;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'project' | 'department' | 'team' | 'task';
  members: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    visibility: 'public' | 'private' | 'restricted';
    notifications: boolean;
    autoAssign: boolean;
    approvalRequired: boolean;
  };
  statistics: {
    totalMembers: number;
    activeMembers: number;
    tasksCompleted: number;
    averageEfficiency: number;
  };
}

export interface Comment {
  id: string;
  recordId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
  attachments?: string[];
  mentions?: string[];
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  edited?: boolean;
  editedAt?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'comment' | 'assignment' | 'status_change' | 'file_upload' | 'approval' | 'rejection';
  description: string;
  timestamp: string;
  recordId?: string;
  metadata?: Record<string, unknown>;
  readBy: string[];
}

export interface Assignment {
  id: string;
  recordId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  description: string;
  comments: Comment[];
  attachments: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'assignment' | 'comment' | 'mention' | 'approval' | 'deadline' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

