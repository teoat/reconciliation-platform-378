'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { User } from 'lucide-react'
import { UserCheck } from 'lucide-react'
import { UserPlus } from 'lucide-react'
import { MessageSquare } from 'lucide-react'
import { Bell } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Eye } from 'lucide-react'
import { Search } from 'lucide-react'
import { Building } from 'lucide-react'
import { Activity } from 'lucide-react'
import { Upload } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { XCircle } from 'lucide-react'
import { X } from 'lucide-react'
import { useData } from '../components/DataProvider'

// Collaborative Features Interfaces
interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'analyst' | 'viewer'
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: string
  currentActivity?: string
  permissions: string[]
  joinedAt: string
  skills: string[]
  workload: number
  performance: {
    tasksCompleted: number
    accuracy: number
    efficiency: number
    collaboration: number
  }
}

interface Workspace {
  id: string
  name: string
  description: string
  type: 'project' | 'department' | 'team' | 'task'
  members: string[]
  owner: string
  createdAt: string
  updatedAt: string
  settings: {
    visibility: 'public' | 'private' | 'restricted'
    notifications: boolean
    autoAssign: boolean
    approvalRequired: boolean
  }
  statistics: {
    totalMembers: number
    activeMembers: number
    tasksCompleted: number
    averageEfficiency: number
  }
}

interface Comment {
  id: string
  recordId: string
  userId: string
  userName: string
  content: string
  timestamp: string
  replies?: Comment[]
  attachments?: string[]
  mentions?: string[]
  reactions?: Array<{
    emoji: string
    users: string[]
  }>
  edited?: boolean
  editedAt?: string
}

interface Activity {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: 'comment' | 'assignment' | 'status_change' | 'file_upload' | 'approval' | 'rejection'
  description: string
  timestamp: string
  recordId?: string
  metadata?: Record<string, unknown>
  readBy: string[]
}

interface Assignment {
  id: string
  recordId: string
  assignedTo: string
  assignedBy: string
  assignedAt: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  description: string
  comments: Comment[]
  attachments: string[]
}

interface Notification {
  id: string
  userId: string
  type: 'assignment' | 'comment' | 'mention' | 'approval' | 'deadline' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  metadata?: Record<string, unknown>
}

interface CollaborativeFeaturesProps {
  project: any
  onProgressUpdate?: (step: string) => void
}

const CollaborativeFeatures = ({ project, onProgressUpdate }: CollaborativeFeaturesProps) => {
  const { currentProject, getReconciliationData } = useData()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'workspaces' | 'activities' | 'assignments' | 'notifications'>('members')
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Initialize collaborative features
  useEffect(() => {
    initializeCollaborativeFeatures()
    onProgressUpdate?.('collaborative_features_started')
   }, [currentProject, onProgressUpdate])

  const initializeCollaborativeFeatures = () => {
    // Initialize sample team members
    const sampleMembers: TeamMember[] = [
      {
        id: 'member-001',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        status: 'online',
        lastSeen: new Date().toISOString(),
        currentActivity: 'Reviewing reconciliation records',
        permissions: ['read', 'write', 'delete', 'admin'],
        joinedAt: '2024-01-01T00:00:00Z',
        skills: ['reconciliation', 'data-analysis', 'excel', 'sql'],
        workload: 75,
        performance: {
          tasksCompleted: 45,
          accuracy: 96.5,
          efficiency: 92.3,
          collaboration: 94.1
        }
      },
      {
        id: 'member-002',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: 'manager',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        status: 'away',
        lastSeen: new Date(Date.now() - 300000).toISOString(),
        currentActivity: 'Team meeting',
        permissions: ['read', 'write', 'approve'],
        joinedAt: '2024-01-05T00:00:00Z',
        skills: ['management', 'reconciliation', 'reporting', 'teamwork'],
        workload: 60,
        performance: {
          tasksCompleted: 32,
          accuracy: 98.2,
          efficiency: 89.7,
          collaboration: 96.8
        }
      },
      {
        id: 'member-003',
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        role: 'analyst',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        status: 'busy',
        lastSeen: new Date(Date.now() - 60000).toISOString(),
        currentActivity: 'Processing cashflow data',
        permissions: ['read', 'write'],
        joinedAt: '2024-01-10T00:00:00Z',
        skills: ['data-analysis', 'python', 'statistics', 'reconciliation'],
        workload: 90,
        performance: {
          tasksCompleted: 28,
          accuracy: 94.8,
          efficiency: 95.2,
          collaboration: 88.5
        }
      },
      {
        id: 'member-004',
        name: 'Emily Davis',
        email: 'emily.davis@company.com',
        role: 'viewer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        currentActivity: undefined,
        permissions: ['read'],
        joinedAt: '2024-01-15T00:00:00Z',
        skills: ['reporting', 'excel', 'presentation'],
        workload: 40,
        performance: {
          tasksCompleted: 15,
          accuracy: 97.1,
          efficiency: 87.3,
          collaboration: 91.2
        }
      }
    ]

    // Initialize sample workspaces
    const sampleWorkspaces: Workspace[] = [
      {
        id: 'workspace-001',
        name: 'Reconciliation Team',
        description: 'Main workspace for reconciliation activities',
        type: 'team',
        members: ['member-001', 'member-002', 'member-003'],
        owner: 'member-001',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        settings: {
          visibility: 'private',
          notifications: true,
          autoAssign: true,
          approvalRequired: false
        },
        statistics: {
          totalMembers: 3,
          activeMembers: 2,
          tasksCompleted: 125,
          averageEfficiency: 92.5
        }
      },
      {
        id: 'workspace-002',
        name: 'Finance Department',
        description: 'Department-wide workspace for finance activities',
        type: 'department',
        members: ['member-001', 'member-002', 'member-003', 'member-004'],
        owner: 'member-002',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        settings: {
          visibility: 'restricted',
          notifications: true,
          autoAssign: false,
          approvalRequired: true
        },
        statistics: {
          totalMembers: 4,
          activeMembers: 3,
          tasksCompleted: 89,
          averageEfficiency: 88.7
        }
      }
    ]

    // Initialize sample comments
    const sampleComments: Comment[] = [
      {
        id: 'comment-001',
        recordId: 'REC-2023-001',
        userId: 'member-002',
        userName: 'Sarah Johnson',
        content: 'This transaction looks correct, but I noticed a small discrepancy in the description field.',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        replies: [
          {
            id: 'reply-001',
            recordId: 'REC-2023-001',
            userId: 'member-001',
            userName: 'John Smith',
            content: 'Thanks for catching that! I\'ll update the description.',
            timestamp: new Date(Date.now() - 60000).toISOString()
          }
        ],
        reactions: [
          { emoji: '👍', users: ['member-001', 'member-003'] },
          { emoji: '👀', users: ['member-004'] }
        ]
      },
      {
        id: 'comment-002',
        recordId: 'REC-2023-002',
        userId: 'member-003',
        userName: 'Mike Wilson',
        content: 'The amount matches perfectly with the bank statement. Ready for approval.',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        reactions: [
          { emoji: '✅', users: ['member-001', 'member-002'] }
        ]
      }
    ]

    // Initialize sample activities
    const sampleActivities: Activity[] = [
      {
        id: 'activity-001',
        userId: 'member-001',
        userName: 'John Smith',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        type: 'assignment',
        description: 'assigned REC-2023-001 to Sarah Johnson',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        recordId: 'REC-2023-001',
        metadata: { assignee: 'Sarah Johnson', priority: 'high' },
        readBy: ['member-001', 'member-002']
      },
      {
        id: 'activity-002',
        userId: 'member-002',
        userName: 'Sarah Johnson',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        type: 'comment',
        description: 'commented on REC-2023-001',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        recordId: 'REC-2023-001',
        readBy: ['member-001', 'member-002', 'member-003']
      },
      {
        id: 'activity-003',
        userId: 'member-003',
        userName: 'Mike Wilson',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        type: 'status_change',
        description: 'changed status of REC-2023-002 to completed',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        recordId: 'REC-2023-002',
        metadata: { oldStatus: 'in_progress', newStatus: 'completed' },
        readBy: ['member-001', 'member-002', 'member-003']
      }
    ]

    // Initialize sample assignments
    const sampleAssignments: Assignment[] = [
      {
        id: 'assignment-001',
        recordId: 'REC-2023-001',
        assignedTo: 'member-002',
        assignedBy: 'member-001',
        assignedAt: new Date(Date.now() - 300000).toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: 'high',
        status: 'in_progress',
        description: 'Review and approve high-value transaction',
        comments: [],
        attachments: []
      },
      {
        id: 'assignment-002',
        recordId: 'REC-2023-003',
        assignedTo: 'member-003',
        assignedBy: 'member-002',
        assignedAt: new Date(Date.now() - 600000).toISOString(),
        dueDate: new Date(Date.now() + 172800000).toISOString(),
        priority: 'medium',
        status: 'pending',
        description: 'Investigate discrepancy in operational expenses',
        comments: [],
        attachments: []
      }
    ]

    // Initialize sample notifications
    const sampleNotifications: Notification[] = [
      {
        id: 'notification-001',
        userId: 'member-001',
        type: 'assignment',
        title: 'New Assignment',
        message: 'You have been assigned to review REC-2023-001',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        actionUrl: '/reconciliation/REC-2023-001'
      },
      {
        id: 'notification-002',
        userId: 'member-001',
        type: 'comment',
        title: 'New Comment',
        message: 'Sarah Johnson commented on REC-2023-001',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        read: true,
        actionUrl: '/reconciliation/REC-2023-001'
      },
      {
        id: 'notification-003',
        userId: 'member-001',
        type: 'mention',
        title: 'You were mentioned',
        message: 'Mike Wilson mentioned you in a comment',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        read: false,
        actionUrl: '/reconciliation/REC-2023-002'
      }
    ]

    setTeamMembers(sampleMembers)
    setWorkspaces(sampleWorkspaces)
    setComments(sampleComments)
    setActivities(sampleActivities)
    setAssignments(sampleAssignments)
    setNotifications(sampleNotifications)
  }

  // Filter team members based on search and filters
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = filterRole === 'all' || member.role === filterRole
      const matchesStatus = filterStatus === 'all' || member.status === filterStatus
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [teamMembers, searchTerm, filterRole, filterStatus])

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800'
      case 'away':
        return 'bg-yellow-100 text-yellow-800'
      case 'busy':
        return 'bg-red-100 text-red-800'
      case 'offline':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'analyst':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <UserPlus className="w-4 h-4" />
      case 'comment':
        return <MessageSquare className="w-4 h-4" />
      case 'status_change':
        return <Activity className="w-4 h-4" />
      case 'file_upload':
        return <Upload className="w-4 h-4" />
      case 'approval':
        return <CheckCircle className="w-4 h-4" />
      case 'rejection':
        return <XCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const handleAddMember = () => {
    setIsCreating(true)
    // Simulate adding member
    setTimeout(() => {
      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        name: 'New Member',
        email: 'new.member@company.com',
        role: 'analyst',
        status: 'offline',
        lastSeen: new Date().toISOString(),
        permissions: ['read', 'write'],
        joinedAt: new Date().toISOString(),
        skills: [],
        workload: 0,
        performance: {
          tasksCompleted: 0,
          accuracy: 0,
          efficiency: 0,
          collaboration: 0
        }
      }
      setTeamMembers(prev => [...prev, newMember])
      setIsCreating(false)
    }, 1000)
  }

  const handleCreateWorkspace = () => {
    setIsCreating(true)
    // Simulate creating workspace
    setTimeout(() => {
      const newWorkspace: Workspace = {
        id: `workspace-${Date.now()}`,
        name: 'New Workspace',
        description: 'New workspace description',
        type: 'team',
        members: [],
        owner: 'member-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          visibility: 'private',
          notifications: true,
          autoAssign: false,
          approvalRequired: false
        },
        statistics: {
          totalMembers: 0,
          activeMembers: 0,
          tasksCompleted: 0,
          averageEfficiency: 0
        }
      }
      setWorkspaces(prev => [...prev, newWorkspace])
      setIsCreating(false)
    }, 1000)
  }

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ))
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Collaborative Features
            </h1>
            <p className="text-secondary-600">
              Team workspaces, real-time collaboration, and communication tools
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddMember}
              disabled={isCreating}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
            <button
              onClick={handleCreateWorkspace}
              disabled={isCreating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>New Workspace</span>
            </button>
          </div>
        </div>
        
        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8">
            {[
              { id: 'members', label: 'Team Members', icon: Users },
              { id: 'workspaces', label: 'Workspaces', icon: Building },
              { id: 'activities', label: 'Activities', icon: Activity },
              { id: 'assignments', label: 'Assignments', icon: UserCheck },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Team Members Tab */}
        {activeTab === 'members' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input-field"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div key={member.id} className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      <Image
                        src={member.avatar || '/default-avatar.png'}
                        alt={member.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        member.status === 'online' ? 'bg-green-500' :
                        member.status === 'away' ? 'bg-yellow-500' :
                        member.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900">{member.name}</h3>
                      <p className="text-sm text-secondary-600">{member.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Workload:</span>
                      <span className="text-secondary-900">{member.workload}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Tasks Completed:</span>
                      <span className="text-secondary-900">{member.performance.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Accuracy:</span>
                      <span className="text-secondary-900">{member.performance.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>

                  {member.currentActivity && (
                    <div className="mt-3 p-2 bg-secondary-50 rounded text-sm">
                      <span className="text-secondary-600">Currently:</span>
                      <span className="ml-2 text-secondary-900">{member.currentActivity}</span>
                    </div>
                  )}

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMember(member)
                        setShowMemberModal(true)
                      }}
                      className="btn-secondary text-sm flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button className="btn-primary text-sm flex-1">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspaces Tab */}
        {activeTab === 'workspaces' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-secondary-900">{workspace.name}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      workspace.settings.visibility === 'public' ? 'bg-green-100 text-green-800' :
                      workspace.settings.visibility === 'private' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {workspace.settings.visibility}
                    </span>
                  </div>
                  
                  <p className="text-sm text-secondary-600 mb-3">{workspace.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-600">Members:</span>
                      <span className="ml-2 text-secondary-900">{workspace.statistics.totalMembers}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Active:</span>
                      <span className="ml-2 text-secondary-900">{workspace.statistics.activeMembers}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Tasks:</span>
                      <span className="ml-2 text-secondary-900">{workspace.statistics.tasksCompleted}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Efficiency:</span>
                      <span className="ml-2 text-secondary-900">{workspace.statistics.averageEfficiency.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedWorkspace(workspace)
                        setShowWorkspaceModal(true)
                      }}
                      className="btn-secondary text-sm flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button className="btn-primary text-sm flex-1">
                      <Users className="w-4 h-4 mr-1" />
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="p-6">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-4 border border-secondary-200 rounded-lg">
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
                      {activity.recordId && (
                        <span>Record: {activity.recordId}</span>
                      )}
                      <span>{activity.readBy.length} read</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="p-6">
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">
                          Assignment - {assignment.recordId}
                        </h3>
                        <p className="text-sm text-secondary-600">{assignment.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(assignment.priority)}`}>
                        {assignment.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        assignment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-600">Assigned to:</span>
                      <span className="ml-2 text-secondary-900">
                        {teamMembers.find(m => m.id === assignment.assignedTo)?.name || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Due Date:</span>
                      <span className="ml-2 text-secondary-900">
                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Assigned by:</span>
                      <span className="ml-2 text-secondary-900">
                        {teamMembers.find(m => m.id === assignment.assignedBy)?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="btn-primary text-sm flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View Record
                    </button>
                    <button className="btn-secondary text-sm flex-1">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Add Comment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
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
                  onClick={() => handleMarkNotificationRead(notification.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.type === 'assignment' ? 'bg-blue-100' :
                    notification.type === 'comment' ? 'bg-green-100' :
                    notification.type === 'mention' ? 'bg-yellow-100' :
                    notification.type === 'approval' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    {notification.type === 'assignment' ? <UserPlus className="w-4 h-4 text-blue-600" /> :
                     notification.type === 'comment' ? <MessageSquare className="w-4 h-4 text-green-600" /> :
                     notification.type === 'mention' ? <User className="w-4 h-4 text-yellow-600" /> :
                     notification.type === 'approval' ? <CheckCircle className="w-4 h-4 text-purple-600" /> :
                     <Bell className="w-4 h-4 text-gray-600" />}
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
        )}
      </div>

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                Member Details
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <Image
                    src={selectedMember.avatar || '/default-avatar.png'}
                    alt={selectedMember.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-secondary-900">{selectedMember.name}</h4>
                    <p className="text-secondary-600">{selectedMember.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedMember.role)}`}>
                        {selectedMember.role}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedMember.status)}`}>
                        {selectedMember.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-secondary-900 mb-2">Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-secondary-900 mb-2">Permissions</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.permissions.map((permission, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-secondary-900 mb-4">Performance Metrics</h5>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-secondary-600">Tasks Completed</span>
                      <span className="text-sm font-semibold text-secondary-900">
                        {selectedMember.performance.tasksCompleted}
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${Math.min((selectedMember.performance.tasksCompleted / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-secondary-600">Accuracy</span>
                      <span className="text-sm font-semibold text-secondary-900">
                        {selectedMember.performance.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${selectedMember.performance.accuracy}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-secondary-600">Efficiency</span>
                      <span className="text-sm font-semibold text-secondary-900">
                        {selectedMember.performance.efficiency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${selectedMember.performance.efficiency}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-secondary-600">Collaboration</span>
                      <span className="text-sm font-semibold text-secondary-900">
                        {selectedMember.performance.collaboration.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${selectedMember.performance.collaboration}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollaborativeFeatures



