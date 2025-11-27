// ============================================================================
// COLLABORATIVE FEATURES HELPER FUNCTIONS
// ============================================================================

import { Search, MessageSquare, Bell, Activity, Upload, CheckCircle, XCircle } from 'lucide-react';
import type { TeamMember } from '../types';

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'online':
      return 'bg-green-100 text-green-800';
    case 'away':
      return 'bg-yellow-100 text-yellow-800';
    case 'busy':
      return 'bg-red-100 text-red-800';
    case 'offline':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'analyst':
      return 'bg-green-100 text-green-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getActivityIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'comment':
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    case 'assignment':
      return <Bell className="w-4 h-4 text-purple-600" />;
    case 'status_change':
      return <Activity className="w-4 h-4 text-green-600" />;
    case 'file_upload':
      return <Upload className="w-4 h-4 text-orange-600" />;
    case 'approval':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'rejection':
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
};

export const filterMembers = (
  members: TeamMember[],
  searchTerm: string,
  filterRole: string,
  filterStatus: string
): TeamMember[] => {
  return members.filter((member) => {
    const matchesSearch =
      searchTerm === '' ||
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });
};

