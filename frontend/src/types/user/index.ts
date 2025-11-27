// User and Authentication Types

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  avatar?: string;
  department?: string;
  manager?: string;
}

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type Permission = 'read' | 'write' | 'delete' | 'admin' | 'export' | 'import';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: boolean;
  emailNotifications: boolean;
  dashboardLayout: DashboardLayout;
  defaultProject?: string;
}

export type DashboardLayout = 'grid' | 'list' | 'compact';
