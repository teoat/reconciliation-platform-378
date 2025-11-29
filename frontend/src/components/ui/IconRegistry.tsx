// ============================================================================
import { logger } from '@/services/logger';
// ICON REGISTRY - Optimized Icon Management
// ============================================================================

/**
 * Centralized icon registry to prevent massive icon imports in components
 * Imports icons only when needed, improving tree-shaking and bundle size
 */

import { ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';

// Icon registry with lazy loading support
export interface IconConfig {
  name: string;
  component: ComponentType<React.SVGProps<SVGSVGElement>>;
  category: 'navigation' | 'action' | 'status' | 'file' | 'ui' | 'other';
}

// Lazy load only commonly used icons
export const IconRegistry: Record<string, IconConfig> = {
  // Navigation
  Home: { name: 'Home', component: LucideIcons.Home, category: 'navigation' },
  Menu: { name: 'Menu', component: LucideIcons.Menu, category: 'navigation' },
  X: { name: 'X', component: LucideIcons.X, category: 'navigation' },
  ChevronRight: {
    name: 'ChevronRight',
    component: LucideIcons.ChevronRight,
    category: 'navigation',
  },
  ChevronLeft: { name: 'ChevronLeft', component: LucideIcons.ChevronLeft, category: 'navigation' },
  ChevronUp: { name: 'ChevronUp', component: LucideIcons.ChevronUp, category: 'navigation' },
  ChevronDown: { name: 'ChevronDown', component: LucideIcons.ChevronDown, category: 'navigation' },

  // Action
  Search: { name: 'Search', component: LucideIcons.Search, category: 'action' },
  Filter: { name: 'Filter', component: LucideIcons.Filter, category: 'action' },
  Download: { name: 'Download', component: LucideIcons.Download, category: 'action' },
  Upload: { name: 'Upload', component: LucideIcons.Upload, category: 'action' },
  RefreshCw: { name: 'RefreshCw', component: LucideIcons.RefreshCw, category: 'action' },
  Edit: { name: 'Edit', component: LucideIcons.Edit, category: 'action' },
  Trash2: { name: 'Trash2', component: LucideIcons.Trash2, category: 'action' },
  Plus: { name: 'Plus', component: LucideIcons.Plus, category: 'action' },
  Minus: { name: 'Minus', component: LucideIcons.Minus, category: 'action' },

  // Status
  CheckCircle: { name: 'CheckCircle', component: LucideIcons.CheckCircle, category: 'status' },
  XCircle: { name: 'XCircle', component: LucideIcons.XCircle, category: 'status' },
  AlertTriangle: {
    name: 'AlertTriangle',
    component: LucideIcons.AlertTriangle,
    category: 'status',
  },
  AlertCircle: { name: 'AlertCircle', component: LucideIcons.AlertCircle, category: 'status' },
  Info: { name: 'Info', component: LucideIcons.Info, category: 'status' },

  // UI
  Bell: { name: 'Bell', component: LucideIcons.Bell, category: 'ui' },
  User: { name: 'User', component: LucideIcons.User, category: 'ui' },
  Settings: { name: 'Settings', component: LucideIcons.Settings, category: 'ui' },

  // File
  FileText: { name: 'FileText', component: LucideIcons.FileText, category: 'file' },
  FolderOpen: { name: 'FolderOpen', component: LucideIcons.FolderOpen, category: 'file' },

  // Other
  BarChart3: { name: 'BarChart3', component: LucideIcons.BarChart3, category: 'other' },
  Users: { name: 'Users', component: LucideIcons.Users, category: 'other' },

  // Reconciliation-specific icons (from ReconciliationInterface.tsx)
  GitCompare: { name: 'GitCompare', component: LucideIcons.GitCompare, category: 'action' },
  Eye: { name: 'Eye', component: LucideIcons.Eye, category: 'action' },
  ArrowUpDown: { name: 'ArrowUpDown', component: LucideIcons.ArrowUpDown, category: 'action' },
  MoreHorizontal: {
    name: 'MoreHorizontal',
    component: LucideIcons.MoreHorizontal,
    category: 'action',
  },
  Clock: { name: 'Clock', component: LucideIcons.Clock, category: 'status' },
  Target: { name: 'Target', component: LucideIcons.Target, category: 'status' },
  TrendingUp: { name: 'TrendingUp', component: LucideIcons.TrendingUp, category: 'other' },
  PieChart: { name: 'PieChart', component: LucideIcons.PieChart, category: 'other' },
  Activity: { name: 'Activity', component: LucideIcons.Activity, category: 'other' },
  Zap: { name: 'Zap', component: LucideIcons.Zap, category: 'other' },
  Shield: { name: 'Shield', component: LucideIcons.Shield, category: 'other' },
  CheckSquare: { name: 'CheckSquare', component: LucideIcons.CheckSquare, category: 'ui' },
  Square: { name: 'Square', component: LucideIcons.Square, category: 'ui' },
  Calendar: { name: 'Calendar', component: LucideIcons.Calendar, category: 'other' },
  DollarSign: { name: 'DollarSign', component: LucideIcons.DollarSign, category: 'other' },
  Hash: { name: 'Hash', component: LucideIcons.Hash, category: 'other' },
  Type: { name: 'Type', component: LucideIcons.Type, category: 'other' },
  MapPin: { name: 'MapPin', component: LucideIcons.MapPin, category: 'other' },
  Layers: { name: 'Layers', component: LucideIcons.Layers, category: 'other' },
  Workflow: { name: 'Workflow', component: LucideIcons.Workflow, category: 'other' },
  MessageSquare: { name: 'MessageSquare', component: LucideIcons.MessageSquare, category: 'ui' },
  Star: { name: 'Star', component: LucideIcons.Star, category: 'ui' },
  Bookmark: { name: 'Bookmark', component: LucideIcons.Bookmark, category: 'ui' },
  Share2: { name: 'Share2', component: LucideIcons.Share2, category: 'action' },
  Copy: { name: 'Copy', component: LucideIcons.Copy, category: 'action' },
  ExternalLink: { name: 'ExternalLink', component: LucideIcons.ExternalLink, category: 'action' },
  Database: { name: 'Database', component: LucideIcons.Database, category: 'other' },
  Cloud: { name: 'Cloud', component: LucideIcons.Cloud, category: 'other' },
  Server: { name: 'Server', component: LucideIcons.Server, category: 'other' },
  Wifi: { name: 'Wifi', component: LucideIcons.Wifi, category: 'other' },
  Lock: { name: 'Lock', component: LucideIcons.Lock, category: 'other' },
  Unlock: { name: 'Unlock', component: LucideIcons.Unlock, category: 'other' },
  Key: { name: 'Key', component: LucideIcons.Key, category: 'other' },
  Globe: { name: 'Globe', component: LucideIcons.Globe, category: 'other' },
  Mail: { name: 'Mail', component: LucideIcons.Mail, category: 'ui' },
  Phone: { name: 'Phone', component: LucideIcons.Phone, category: 'ui' },
  UserCheck: { name: 'UserCheck', component: LucideIcons.UserCheck, category: 'ui' },
  UserX: { name: 'UserX', component: LucideIcons.UserX, category: 'ui' },
  UserPlus: { name: 'UserPlus', component: LucideIcons.UserPlus, category: 'action' },
  UserMinus: { name: 'UserMinus', component: LucideIcons.UserMinus, category: 'action' },
  Crown: { name: 'Crown', component: LucideIcons.Crown, category: 'other' },
  Award: { name: 'Award', component: LucideIcons.Award, category: 'other' },
  Trophy: { name: 'Trophy', component: LucideIcons.Trophy, category: 'other' },
  Medal: { name: 'Medal', component: LucideIcons.Medal, category: 'other' },
  Flag: { name: 'Flag', component: LucideIcons.Flag, category: 'other' },
  Tag: { name: 'Tag', component: LucideIcons.Tag, category: 'other' },
  Folder: { name: 'Folder', component: LucideIcons.Folder, category: 'file' },
  File: { name: 'File', component: LucideIcons.File, category: 'file' },
  FileCheck: { name: 'FileCheck', component: LucideIcons.FileCheck, category: 'file' },
  FileX: { name: 'FileX', component: LucideIcons.FileX, category: 'file' },
  FilePlus: { name: 'FilePlus', component: LucideIcons.FilePlus, category: 'file' },
  FileMinus: { name: 'FileMinus', component: LucideIcons.FileMinus, category: 'file' },
  FileEdit: { name: 'FileEdit', component: LucideIcons.FileEdit, category: 'file' },
  FileSearch: { name: 'FileSearch', component: LucideIcons.FileSearch, category: 'file' },
  GitBranch: { name: 'GitBranch', component: LucideIcons.GitBranch, category: 'other' },
  GitCommit: { name: 'GitCommit', component: LucideIcons.GitCommit, category: 'other' },
  GitMerge: { name: 'GitMerge', component: LucideIcons.GitMerge, category: 'other' },
  GitPullRequest: {
    name: 'GitPullRequest',
    component: LucideIcons.GitPullRequest,
    category: 'other',
  },
  Network: { name: 'Network', component: LucideIcons.Network, category: 'other' },
  FileArchive: { name: 'FileArchive', component: LucideIcons.FileArchive, category: 'file' },
  FileImage: { name: 'FileImage', component: LucideIcons.FileImage, category: 'file' },
  FileVideo: { name: 'FileVideo', component: LucideIcons.FileVideo, category: 'file' },
  FileAudio: { name: 'FileAudio', component: LucideIcons.FileAudio, category: 'file' },
  FileSpreadsheet: {
    name: 'FileSpreadsheet',
    component: LucideIcons.FileSpreadsheet,
    category: 'file',
  },
  FileCode: { name: 'FileCode', component: LucideIcons.FileCode, category: 'file' },
  FileJson: { name: 'FileJson', component: LucideIcons.FileJson, category: 'file' },
  Play: { name: 'Play', component: LucideIcons.Play, category: 'action' },
  Pause: { name: 'Pause', component: LucideIcons.Pause, category: 'action' },
};

// Export Square as StopIcon from LucideIcons
export const StopIcon = LucideIcons.Square;

/**
 * Get icon component by name
 */
export const getIcon = (name: string): ComponentType<React.SVGProps<SVGSVGElement>> | undefined => {
  return IconRegistry[name]?.component;
};

/**
 * Render icon by name
 */
export interface IconProps {
  name: string;
  className?: string;
  size?: number | string;
  color?: string;
  [key: string]: unknown;
}

export const Icon: React.FC<IconProps> = ({
  name,
  className = '',
  size: _size = 20,
  color,
  ...props
}) => {
  const IconComponent = getIcon(name);

  if (!IconComponent) {
    logger.warn(`Icon "${name}" not found in registry`);
    return null;
  }

  return <IconComponent className={className} style={color ? { color } : undefined} {...props} />;
};

/**
 * Hook to use icons efficiently
 */
export const useIcon = (name: string) => {
  const IconComponent = getIcon(name);

  return IconComponent || (() => null);
};

export default Icon;
