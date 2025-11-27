# Refactoring Remaining TODOs - Diagnostic Report

**Generated**: 2025-01-15  
**Status**: Comprehensive diagnostic of unimplemented functionality

## Summary

After refactoring `CustomReports.tsx` (845 → 140 lines) and `EnterpriseSecurity.tsx` (835 → 120 lines), several features remain as placeholders or incomplete implementations. This document catalogs all remaining TODOs.

---

## CustomReports Component

### 🔴 High Priority - Core Functionality

#### 1. **Report Creation Interface** (`CreateReportModal.tsx`)
- **Location**: `frontend/src/components/reports/components/CreateReportModal.tsx:31`
- **Status**: Placeholder only
- **Issue**: Complete UI for creating custom reports is missing
- **Required**:
  - Form fields for report name, description, data source selection
  - Filter builder UI (add/remove/edit filters)
  - Metric configuration UI
  - Visualization type selector
  - Schedule configuration (frequency, recipients)
  - Tag management
  - Validation and error handling
  - Save functionality (API integration)

#### 2. **API Integration for Reports**
- **Location**: `frontend/src/components/reports/hooks/useCustomReports.ts:32-33`
- **Status**: Using sample data
- **Issue**: Reports are hardcoded, not fetched from API
- **Required**:
  - API endpoint for fetching reports: `GET /api/reports`
  - API endpoint for creating reports: `POST /api/reports`
  - API endpoint for updating reports: `PUT /api/reports/:id`
  - API endpoint for deleting reports: `DELETE /api/reports/:id`
  - Error handling and loading states

#### 3. **Report Export Functionality**
- **Location**: `frontend/src/components/reports/hooks/useCustomReports.ts:237-240`
- **Status**: Simulated download (JSON only)
- **Issue**: Only generates JSON, not actual PDF/CSV/XLSX
- **Required**:
  - PDF generation (using library like `jsPDF` or `pdfkit`)
  - CSV generation (proper formatting)
  - XLSX generation (using library like `xlsx`)
  - Proper file naming and metadata
  - Progress indicators for large exports

#### 4. **Chart Visualization Rendering**
- **Location**: `frontend/src/components/reports/components/ReportDetailModal.tsx:62-65`
- **Status**: Placeholder text only
- **Issue**: Charts are not rendered
- **Required**:
  - Integration with charting library (e.g., `recharts`, `chart.js`, `d3`)
  - Bar chart implementation
  - Line chart implementation
  - Pie chart implementation
  - Area chart implementation
  - Scatter plot implementation
  - Table visualization
  - Dynamic data binding from report metrics

#### 5. **Share Report Functionality**
- **Location**: `frontend/src/components/reports/components/ReportDetailModal.tsx:105-108`
- **Status**: Button exists but no handler
- **Issue**: Share button has no onClick handler
- **Required**:
  - Share modal/dialog
  - User/email selection
  - Permission settings (view/edit)
  - Share link generation
  - API endpoint: `POST /api/reports/:id/share`

### 🟡 Medium Priority - Data Integration

#### 6. **Project Data Source**
- **Location**: `frontend/src/components/reports/utils/reportData.ts:136`
- **Status**: Empty array placeholder
- **Issue**: Projects data source not implemented
- **Required**:
  - Fetch project data from API
  - Map project fields to report format
  - Filter support for project fields

#### 7. **User Data Source**
- **Location**: `frontend/src/components/reports/utils/reportData.ts:140`
- **Status**: Empty array placeholder
- **Issue**: Users data source not implemented
- **Required**:
  - Fetch user data from API
  - Map user fields to report format
  - Filter support for user fields

#### 8. **Discrepancies Mapping**
- **Location**: `frontend/src/components/reports/adapters.ts:58`
- **Status**: Empty array
- **Issue**: Discrepancies not mapped from source data
- **Required**:
  - Extract discrepancies from `record.resolution` or other fields
  - Map to ReconciliationRecord discrepancies format
  - Preserve discrepancy details and metadata

### 🟢 Low Priority - Enhancements

#### 9. **Percentage Calculation Parser**
- **Location**: `frontend/src/components/reports/utils/reportData.ts:100`
- **Status**: Simple string split implementation
- **Issue**: Only handles division, not complex expressions
- **Required**:
  - Robust expression parser (e.g., `mathjs` or custom parser)
  - Support for: `+`, `-`, `*`, `/`, parentheses
  - Variable substitution from metrics
  - Error handling for invalid expressions

#### 10. **Real Metric Values in Report Detail**
- **Location**: `frontend/src/components/reports/components/ReportDetailModal.tsx:43`
- **Status**: Using `Math.random()` for display
- **Issue**: Not showing actual calculated metrics
- **Required**:
  - Pass actual report data to modal
  - Display real calculated metrics
  - Update when report data changes

---

## EnterpriseSecurity Component

### 🔴 High Priority - Core Functionality

#### 11. **Security Scan Functionality**
- **Location**: `frontend/src/components/security/EnterpriseSecurity.tsx:57-60`
- **Status**: Button exists but no handler
- **Issue**: "Security Scan" button has no onClick handler
- **Required**:
  - Security scan modal/dialog
  - Scan configuration options
  - Progress indicator
  - Results display
  - API endpoint: `POST /api/security/scan`
  - Export scan results

#### 12. **Policy Detail View/Edit**
- **Location**: `frontend/src/components/security/components/PoliciesTab.tsx`
- **Status**: Missing detail modal
- **Issue**: "View Details" and "Edit Policy" buttons not implemented
- **Required**:
  - Policy detail modal
  - Policy edit form
  - Rule management UI
  - Compliance checkbox management
  - API endpoints: `GET /api/security/policies/:id`, `PUT /api/security/policies/:id`

#### 13. **Access Control Management**
- **Location**: `frontend/src/components/security/components/AccessTab.tsx`
- **Status**: Missing management UI
- **Issue**: "View Details" and "Manage Access" buttons not implemented
- **Required**:
  - Access detail modal
  - Permission editor
  - Resource assignment UI
  - Expiration date management
  - Revoke access functionality
  - API endpoints: `PUT /api/security/access/:id`, `DELETE /api/security/access/:id`

#### 14. **Compliance Report View**
- **Location**: `frontend/src/components/security/components/ComplianceTab.tsx:75`
- **Status**: Handler exists but modal missing
- **Issue**: `onViewReport` handler but no modal component
- **Required**:
  - Compliance report detail modal
  - Findings display and management
  - Recommendations tracking
  - Evidence file viewer
  - API endpoint: `GET /api/security/compliance/:id`

### 🟡 Medium Priority - Data Integration

#### 15. **API Integration for Security Data**
- **Location**: `frontend/src/components/security/hooks/useEnterpriseSecurity.ts:33-37`
- **Status**: Using sample data
- **Issue**: All security data is hardcoded
- **Required**:
  - API endpoints for policies: `GET /api/security/policies`
  - API endpoints for access controls: `GET /api/security/access`
  - API endpoints for audit logs: `GET /api/security/audit`
  - API endpoints for compliance: `GET /api/security/compliance`
  - Real-time updates (WebSocket or polling)
  - Error handling and retry logic

#### 16. **Audit Log Details**
- **Location**: `frontend/src/components/security/components/AuditTab.tsx`
- **Status**: Basic list view only
- **Issue**: No detail view for audit log entries
- **Required**:
  - Audit log detail modal
  - Expandable details section
  - Risk level explanation
  - Related events linking
  - Export functionality

### 🟢 Low Priority - Enhancements

#### 17. **Policy Creation Form**
- **Location**: `frontend/src/components/security/hooks/useEnterpriseSecurity.ts:40-64`
- **Status**: Creates minimal policy
- **Issue**: No UI for creating policies with full configuration
- **Required**:
  - Policy creation modal/form
  - Rule builder UI
  - Category selection
  - Priority assignment
  - Compliance framework selection

---

## Cross-Component Issues

### 18. **Error Handling**
- **Status**: Minimal error handling
- **Required**:
  - Comprehensive error boundaries
  - User-friendly error messages
  - Retry mechanisms
  - Error logging and reporting

### 19. **Loading States**
- **Status**: Basic loading indicators
- **Required**:
  - Skeleton loaders for better UX
  - Progress indicators for long operations
  - Optimistic updates where appropriate

### 20. **Validation**
- **Status**: Limited validation
- **Required**:
  - Form validation for all inputs
  - Data validation before API calls
  - Client-side validation rules
  - Server-side validation error handling

---

## Implementation Priority

### Phase 1 (Critical - Blocking Core Features)
1. Report Creation Interface (#1)
2. API Integration for Reports (#2)
3. Chart Visualization Rendering (#4)
4. Security Scan Functionality (#11)
5. Policy Detail View/Edit (#12)

### Phase 2 (Important - Core User Flows)
6. Report Export Functionality (#3)
7. Share Report Functionality (#5)
8. Access Control Management (#13)
9. Compliance Report View (#14)
10. API Integration for Security Data (#15)

### Phase 3 (Enhancements - Better UX)
11. Project Data Source (#6)
12. User Data Source (#7)
13. Discrepancies Mapping (#8)
14. Percentage Calculation Parser (#9)
15. Real Metric Values (#10)
16. Audit Log Details (#16)
17. Policy Creation Form (#17)

### Phase 4 (Polish - Quality Improvements)
18. Error Handling (#18)
19. Loading States (#19)
20. Validation (#20)

---

## Notes

- All placeholder text should be replaced with actual implementations
- All "would be implemented" comments should be addressed
- All sample/mock data should be replaced with API calls
- All button handlers should be implemented or removed
- All modal components should be fully functional

---

## Related Files

- `frontend/src/components/reports/` - All report-related components
- `frontend/src/components/security/` - All security-related components
- API endpoints need to be defined in backend
- Type definitions are complete and can be used as reference

