# Component Organization Plan

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document outlines the plan to organize frontend components by feature/domain for better maintainability and discoverability.

## Current Organization

Components are partially organized with some feature directories:
- `components/ingestion/` - Ingestion-related components
- `components/reconciliation/` - Reconciliation-related components
- `components/project/` - Project-related components
- `components/analytics/` - Analytics components
- `components/charts/` - Chart components
- `components/frenly/` - Frenly AI components
- `components/ui/` - Reusable UI components
- `components/layout/` - Layout components

## Components to Organize

### Feature-Based Organization

#### 1. Authentication Components
**Target Directory**: `components/auth/`
- `AuthPage.tsx` (currently in `pages/`)
- `ForgotPasswordPage.tsx` (currently in `pages/`)
- Move authentication-related components here

#### 2. Dashboard Components
**Target Directory**: `components/dashboard/`
- `Dashboard.tsx`
- `SmartDashboard.tsx`
- `AnalyticsDashboard.tsx`
- `MonitoringDashboard.tsx` (already in `monitoring/`)
- `PerformanceDashboard.tsx` (already in `monitoring/`)

#### 3. File Management Components
**Target Directory**: `components/files/`
- `FileUploadInterface.tsx`
- `EnhancedDropzone.tsx`
- `fileUpload/` directory (already exists)
- Consolidate file-related components

#### 4. Workflow Components
**Target Directory**: `components/workflow/`
- `WorkflowAutomation.tsx`
- `WorkflowOrchestrator.tsx`
- `workflow/` directory (already exists)
- Consolidate workflow components

#### 5. Collaboration Components
**Target Directory**: `components/collaboration/`
- `CollaborationPanel.tsx`
- `collaboration/` directory (already exists)
- Consolidate collaboration components

#### 6. Reporting Components
**Target Directory**: `components/reports/`
- `CustomReports.tsx`
- `ReconciliationAnalytics.tsx`
- Move reporting-related components here

#### 7. Security Components
**Target Directory**: `components/security/`
- `EnterpriseSecurity.tsx`
- `security/` directory (already exists)
- Consolidate security components

#### 8. API Development Components
**Target Directory**: `components/api/`
- `APIDevelopment.tsx`
- `ApiDocumentation.tsx`
- `ApiIntegrationStatus.tsx`
- `ApiTester.tsx`
- Consolidate API-related components

## Organization Structure

```
frontend/src/components/
├── auth/              # Authentication components
├── dashboard/         # Dashboard components
├── files/             # File management
├── workflow/          # Workflow automation
├── collaboration/     # Real-time collaboration
├── reports/           # Reporting and analytics
├── security/          # Security features
├── api/               # API development tools
├── ingestion/         # ✅ Already organized
├── reconciliation/    # ✅ Already organized
├── project/           # ✅ Already organized
├── analytics/         # ✅ Already organized
├── charts/            # ✅ Already organized
├── frenly/            # ✅ Already organized
├── ui/                # ✅ Reusable UI components
└── layout/            # ✅ Layout components
```

## Migration Steps

1. **Create Feature Directories** (if not exists)
2. **Move Components** to appropriate feature directories
3. **Update Imports** across the codebase
4. **Update Exports** in `components/index.tsx`
5. **Test** all imports work correctly
6. **Document** new organization structure

## Benefits

1. **Discoverability**: Easier to find components by feature
2. **Maintainability**: Related components grouped together
3. **Scalability**: Easy to add new features
4. **Team Collaboration**: Clear ownership boundaries
5. **Code Reuse**: Easier to identify reusable components

## Status

- ✅ Partially organized (ingestion, reconciliation, project, analytics, charts, frenly, ui, layout)
- 🟡 Needs organization (auth, dashboard, files, workflow, collaboration, reports, security, api)

---

**Next Steps**: Begin component migration for unorganized features

