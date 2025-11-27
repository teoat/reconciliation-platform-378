// ============================================================================
// COLLABORATIVE FEATURES COMPONENT
// ============================================================================
// This component orchestrates collaborative features including team members,
// workspaces, activities, assignments, and notifications.
// All tab components are extracted to components/ directory
// All types are in types.ts
// All helper functions are in utils/helpers.ts

'use client';

import { useState, useEffect } from 'react';
import { Users, Building, Activity, UserCheck, Bell, Plus, UserPlus } from 'lucide-react';
import { useData } from '../DataProvider';
import type { BackendProject } from '../../services/apiClient/types';
import type {
  TeamMember,
  Workspace,
  Comment,
  ActivityItem,
  Assignment,
  Notification,
} from './types';
import {
  TeamMembersTab,
  WorkspacesTab,
  ActivitiesTab,
  AssignmentsTab,
  NotificationsTab,
  MemberDetailModal,
} from './components';
import { ProgressiveFeatureDisclosure } from '../ui/ProgressiveFeatureDisclosure';
import { onboardingService } from '../../services/onboardingService';

interface CollaborativeFeaturesProps {
  project: BackendProject;
  onProgressUpdate?: (step: string) => void;
}

const CollaborativeFeatures = ({ project, onProgressUpdate }: CollaborativeFeaturesProps) => {
  const { currentProject } = useData();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'members' | 'workspaces' | 'activities' | 'assignments' | 'notifications'
  >('members');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    initializeCollaborativeFeatures();
    onProgressUpdate?.('collaborative_features_started');
  }, [currentProject, onProgressUpdate]);

  const initializeCollaborativeFeatures = () => {
    // Initialize sample data (same as before)
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
          collaboration: 94.1,
        },
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
          collaboration: 96.5,
        },
      },
    ];

    const sampleWorkspaces: Workspace[] = [
      {
        id: 'workspace-001',
        name: 'Finance Team',
        description: 'Workspace for finance reconciliation tasks',
        type: 'department',
        members: ['member-001', 'member-002'],
        owner: 'member-001',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        settings: {
          visibility: 'private',
          notifications: true,
          autoAssign: false,
          approvalRequired: true,
        },
        statistics: {
          totalMembers: 2,
          activeMembers: 2,
          tasksCompleted: 120,
          averageEfficiency: 94.5,
        },
      },
    ];

    const sampleActivities: ActivityItem[] = [
      {
        id: 'activity-001',
        userId: 'member-001',
        userName: 'John Smith',
        type: 'comment',
        description: 'commented on record REC-001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        recordId: 'REC-001',
        readBy: ['member-001', 'member-002'],
      },
    ];

    const sampleAssignments: Assignment[] = [
      {
        id: 'assignment-001',
        recordId: 'REC-001',
        assignedTo: 'member-002',
        assignedBy: 'member-001',
        assignedAt: new Date(Date.now() - 7200000).toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: 'high',
        status: 'in_progress',
        description: 'Review and reconcile transaction discrepancies',
        comments: [],
        attachments: [],
      },
    ];

    const sampleNotifications: Notification[] = [
      {
        id: 'notification-001',
        userId: 'member-001',
        type: 'assignment',
        title: 'New Assignment',
        message: 'You have been assigned to review REC-001',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
      },
    ];

    setTeamMembers(sampleMembers);
    setWorkspaces(sampleWorkspaces);
    setActivities(sampleActivities);
    setAssignments(sampleAssignments);
    setNotifications(sampleNotifications);
  };

  const handleAddMember = () => {
    setIsCreating(true);
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
          collaboration: 0,
        },
      };
      setTeamMembers((prev) => [...prev, newMember]);
      setIsCreating(false);
    }, 1000);
  };

  const handleCreateWorkspace = () => {
    setIsCreating(true);
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
          approvalRequired: false,
        },
        statistics: {
          totalMembers: 0,
          activeMembers: 0,
          tasksCompleted: 0,
          averageEfficiency: 0,
        },
      };
      setWorkspaces((prev) => [...prev, newWorkspace]);
      setIsCreating(false);
    }, 1000);
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  const userProgress = onboardingService.getProgress('initial').completedSteps;

  return (
    <ProgressiveFeatureDisclosure
      feature={{
        id: 'collaboration-features',
        name: 'Collaboration Features',
        description: 'Team collaboration, workspaces, assignments, and real-time activities',
        unlockRequirements: {
          onboardingSteps: ['upload-files', 'configure-reconciliation'],
          minProgress: 30,
        },
        lockedMessage: 'Complete basic reconciliation setup to unlock collaboration features',
      }}
      userProgress={userProgress}
      showUnlockAnimation={true}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Collaborative Features</h1>
            <p className="text-secondary-600 mt-1">
              Manage team members, workspaces, activities, and assignments
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
            {([
              { id: 'members', label: 'Team Members', icon: Users },
              { id: 'workspaces', label: 'Workspaces', icon: Building },
              { id: 'activities', label: 'Activities', icon: Activity },
              { id: 'assignments', label: 'Assignments', icon: UserCheck },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <TeamMembersTab
            members={teamMembers}
            searchTerm={searchTerm}
            filterRole={filterRole}
            filterStatus={filterStatus}
            onSearchChange={setSearchTerm}
            onFilterRoleChange={setFilterRole}
            onFilterStatusChange={setFilterStatus}
            onViewMember={(member) => {
              setSelectedMember(member);
              setShowMemberModal(true);
            }}
          />
        )}

        {activeTab === 'workspaces' && (
          <WorkspacesTab
            workspaces={workspaces}
            onViewWorkspace={(workspace) => setSelectedWorkspace(workspace)}
          />
        )}

        {activeTab === 'activities' && <ActivitiesTab activities={activities} />}

        {activeTab === 'assignments' && (
          <AssignmentsTab assignments={assignments} teamMembers={teamMembers} />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab notifications={notifications} onMarkRead={handleMarkNotificationRead} />
        )}
      </div>

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
        />
      )}
      </div>
    </ProgressiveFeatureDisclosure>
  );
};

export default CollaborativeFeatures;
