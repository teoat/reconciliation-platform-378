// ============================================================================
// CENTRALIZED COMPONENTS - SINGLE SOURCE OF TRUTH
// ============================================================================
// This file re-exports components from organized directories
// Individual components should be imported directly from their source files

// ============================================================================
// UI COMPONENTS - Re-export from components/ui
// ============================================================================
export {
  Button,
  Input,
  Select,
  Modal,
  Alert,
  Checkbox,
  Card,
  Pagination,
  MetricCard,
  StatusBadge,
  DataTableToolbar,
  FormField,
  DataTable,
  VirtualizedTable,
  Grid,
  GridItem,
  Sidebar,
  SidebarTrigger,
  SkipLink,
  ARIALiveRegion,
  useARIALiveRegion,
  Tooltip,
  Menu,
  LoadingSpinner,
  LoadingPage,
  LoadingCard,
  LoadingButton,
  SkeletonTable,
  ErrorBoundary,
  useErrorHandler,
  ErrorType,
  createError,
  getErrorMessage,
  isRetryableError,
  UserFriendlyError,
  ErrorCodeDisplay,
  ErrorHistory,
  ErrorReportingForm,
  ServiceDegradedBanner,
  FallbackContent,
  CircuitBreakerStatus,
  FeatureGate,
  FeatureBadge,
  useFeatureGate,
  FeatureTour,
  EnhancedFeatureTour,
  EnhancedContextualHelp,
  OnboardingAnalyticsDashboard,
  EmptyStateGuidance,
  EnhancedFrenlyOnboarding,
  ProgressBar,
  SmartTip,
  useSmartTips,
  ProgressiveFeatureDisclosure,
  useProgressiveFeature,
} from './ui';

// Export types
export type {
  ButtonProps,
  InputProps,
  SelectProps,
  ModalProps,
  AlertProps,
  CheckboxProps,
  CardProps,
  PaginationProps,
  MetricCardProps,
  StatusBadgeProps,
  DataTableToolbarProps,
  FormFieldProps,
  DataTableProps,
  Column,
  VirtualizedTableProps,
  ColumnDef,
  GridProps,
  GridItemProps,
  SidebarProps,
  SidebarTriggerProps,
  ARIALiveRegionProps,
  TooltipProps,
  MenuProps,
  FeatureGateProps,
  FeatureBadgeProps,
  FeatureGateConfig,
  FeatureUserRole,
  FeaturePermission,
  FeatureTourProps,
  TourStep,
  EnhancedFeatureTourProps,
  EnhancedTourStep,
  EnhancedContextualHelpProps,
  EmptyStateType,
  ErrorReport,
  SmartTipProps,
  SmartTip as SmartTipType,
  UseSmartTipsOptions,
  ProgressiveFeatureDisclosureProps,
  ProgressiveFeature,
  FeatureUnlockLevel,
} from './ui';

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================
export { default as UnifiedNavigation } from './layout/UnifiedNavigation';
export { default as AppShell } from './layout/AppShell';
export { default as AppLayout } from './layout/AppLayout';
export { default as AuthLayout } from './layout/AuthLayout';
export { ResponsiveGrid } from './layout/ResponsiveGrid';

// ============================================================================
// FEATURE COMPONENTS
// ============================================================================
export { default as FrenlyAI } from './FrenlyAI';
export { DataProvider } from './DataProvider';
export { FrenlyProvider } from './frenly/FrenlyProvider';
export * from './ProjectComponents';
export { default as AdvancedFilters } from './AdvancedFilters';
export { default as ReconciliationAnalytics } from './reports/ReconciliationAnalytics';
export { default as DataAnalysis } from './DataAnalysis';
export { default as EnhancedIngestionPage } from './EnhancedIngestionPage';
export { default as IntegrationSettings } from './IntegrationSettings';

// ============================================================================
// DASHBOARD COMPONENTS
// ============================================================================
export { Dashboard, AnalyticsDashboard, SmartDashboard } from './Dashboard';

// ============================================================================
// RECONCILIATION COMPONENTS
// ============================================================================
export * from './reconciliation';

// ============================================================================
// FILE MANAGEMENT COMPONENTS
// ============================================================================
export { FileUploadInterface, EnhancedDropzone } from './files';

// ============================================================================
// WORKFLOW COMPONENTS
// ============================================================================
export { WorkflowOrchestrator, WorkflowAutomation } from './workflow';

// ============================================================================
// COLLABORATION COMPONENTS
// ============================================================================
export * from './collaboration';

// ============================================================================
// REPORTING COMPONENTS
// ============================================================================
export { CustomReports, ReconciliationAnalytics as ReconciliationAnalyticsReport } from './reports';

// ============================================================================
// SECURITY COMPONENTS
// ============================================================================
export * from './security';

// ============================================================================
// API DEVELOPMENT COMPONENTS
// ============================================================================
export { APIDevelopment, ApiDocumentation, ApiIntegrationStatus, ApiTester } from './api';

// ============================================================================
// NOTE: Legacy inline component definitions removed
// All UI components should be imported from '@/components/ui' or '@/components/ui/[ComponentName]'
// ============================================================================
