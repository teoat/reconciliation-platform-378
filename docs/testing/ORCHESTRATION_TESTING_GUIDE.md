# Frenly AI Orchestration Testing Guide

**Date:** January 2025  
**Status:** Active  
**Purpose:** Comprehensive testing guide for Frenly AI orchestration integration

---

## Overview

This guide provides step-by-step instructions for testing the Frenly AI orchestration system across all integrated pages.

---

## Pre-Testing Checklist

### Environment Setup

- [ ] Application is running in development mode
- [ ] Browser console is open (F12)
- [ ] Network tab is open for monitoring API calls
- [ ] Local storage is cleared (optional, for fresh testing)
- [ ] Frenly AI component is visible in the UI

### Prerequisites

- [ ] User is authenticated
- [ ] At least one project exists (for project-specific pages)
- [ ] Test data is available (for ingestion, reconciliation, adjudication)

---

## Page-by-Page Testing

### 1. Dashboard Page Testing

#### Test Case 1.1: Page Load and Initialization
**Steps:**
1. Navigate to `/dashboard`
2. Wait for page to load completely

**Expected Results:**
- [ ] Page loads without errors
- [ ] Frenly AI message appears (welcome or contextual tip)
- [ ] No console errors related to orchestration
- [ ] Context is initialized correctly

**Verification:**
```javascript
// In browser console:
localStorage.getItem('frenly:state:dashboard')
```

#### Test Case 1.2: Data Loading Tracking
**Steps:**
1. Navigate to dashboard
2. Monitor network tab for API calls
3. Check console for tracking events

**Expected Results:**
- [ ] `trackFeatureUsage('dashboard', 'data-load-started')` is called
- [ ] `trackFeatureUsage('dashboard', 'data-load-success')` is called on success
- [ ] Context updates when data loads
- [ ] Frenly AI message updates based on data

**Verification:**
- Check browser console for tracking logs
- Verify context updates in React DevTools

#### Test Case 1.3: Error Handling
**Steps:**
1. Simulate API failure (disable network or modify API endpoint)
2. Navigate to dashboard
3. Observe error handling

**Expected Results:**
- [ ] `trackFeatureError('dashboard', error)` is called
- [ ] Error message is displayed to user
- [ ] Frenly AI provides helpful error guidance
- [ ] Page doesn't crash

---

### 2. Ingestion Page Testing

#### Test Case 2.1: File Upload Tracking
**Steps:**
1. Navigate to `/ingestion`
2. Upload a test file
3. Monitor tracking events

**Expected Results:**
- [ ] `trackFeatureUsage('file-upload', 'upload-started')` is called
- [ ] `trackUserAction('file-upload', 'upload-button')` is called
- [ ] Context updates with file count
- [ ] Workflow state updates (upload → validate → process)
- [ ] Frenly AI provides upload guidance

**Verification:**
```javascript
// Check workflow state
localStorage.getItem('workflow:ingestion-workflow')
```

#### Test Case 2.2: Processing Status Updates
**Steps:**
1. Upload a file
2. Wait for processing to start
3. Monitor status changes

**Expected Results:**
- [ ] Processing status updates in context
- [ ] Frenly AI provides processing status message
- [ ] Workflow state reflects current step

#### Test Case 2.3: File Deletion Tracking
**Steps:**
1. Upload a file
2. Delete the file
3. Monitor tracking

**Expected Results:**
- [ ] `trackFeatureUsage('file-delete', 'delete-started')` is called
- [ ] `trackFeatureUsage('file-delete', 'delete-success')` is called
- [ ] Context updates after deletion
- [ ] File count decreases

---

### 3. Adjudication Page Testing

#### Test Case 3.1: Match Review Tracking
**Steps:**
1. Navigate to `/adjudication`
2. Review matches
3. Monitor tracking events

**Expected Results:**
- [ ] `trackFeatureUsage('match-review', 'refresh-started')` is called
- [ ] Context updates with match counts
- [ ] Workflow state reflects review progress
- [ ] Frenly AI provides review guidance

#### Test Case 3.2: Approval/Rejection Tracking
**Steps:**
1. Select a match
2. Approve the match
3. Select another match
4. Reject the match

**Expected Results:**
- [ ] `trackFeatureUsage('approval', 'approve-started')` is called
- [ ] `trackFeatureUsage('approval', 'approve-success')` is called
- [ ] `trackFeatureUsage('discrepancy-resolution', 'reject-started')` is called
- [ ] `trackFeatureUsage('discrepancy-resolution', 'reject-success')` is called
- [ ] Context updates with resolved/pending counts
- [ ] Workflow state updates

#### Test Case 3.3: Context Updates
**Steps:**
1. Navigate to adjudication page
2. Approve several matches
3. Monitor context changes

**Expected Results:**
- [ ] Context updates automatically when records change
- [ ] Resolved count increases
- [ ] Pending count decreases
- [ ] Frenly AI provides progress updates

---

### 4. Reconciliation Page Testing

#### Test Case 4.1: Tab Navigation Tracking
**Steps:**
1. Navigate to `/reconciliation`
2. Switch between tabs (upload, configure, run, results)
3. Monitor tracking

**Expected Results:**
- [ ] Context updates when tab changes
- [ ] Workflow state reflects current tab
- [ ] Frenly AI provides tab-specific guidance
- [ ] Onboarding steps update based on tab

#### Test Case 4.2: Job Execution Tracking
**Steps:**
1. Upload data sources
2. Configure settings
3. Run a reconciliation job
4. Monitor tracking

**Expected Results:**
- [ ] Feature usage tracked for each step
- [ ] Workflow state progresses through steps
- [ ] Frenly AI provides step-by-step guidance
- [ ] Progress is synchronized

---

## Cross-Page Testing

### Test Case 5.1: State Synchronization
**Steps:**
1. Navigate to ingestion page
2. Upload files
3. Navigate to reconciliation page
4. Check if workflow state is preserved

**Expected Results:**
- [ ] Workflow state persists across pages
- [ ] Onboarding progress is synchronized
- [ ] Context is maintained

### Test Case 5.2: Onboarding Continuity
**Steps:**
1. Start onboarding on dashboard
2. Complete a step
3. Navigate to another page
4. Check onboarding progress

**Expected Results:**
- [ ] Onboarding progress is maintained
- [ ] Steps completed on one page are reflected on others
- [ ] Frenly AI provides consistent onboarding guidance

---

## Performance Testing

### Test Case 6.1: Message Generation Performance
**Steps:**
1. Navigate to each page
2. Monitor message generation time
3. Check for performance issues

**Expected Results:**
- [ ] Messages generate within 500ms
- [ ] No UI blocking during generation
- [ ] Debouncing works correctly

**Verification:**
```javascript
// Use performance monitor
import { getPerformanceMonitor } from '@/orchestration/utils/monitoring';
const monitor = getPerformanceMonitor();
console.log(monitor.getMetrics());
```

### Test Case 6.2: Context Update Performance
**Steps:**
1. Perform multiple actions rapidly
2. Monitor context update frequency
3. Check for excessive updates

**Expected Results:**
- [ ] Context updates are debounced
- [ ] No excessive re-renders
- [ ] Performance remains smooth

---

## Error Scenario Testing

### Test Case 7.1: Network Failures
**Steps:**
1. Disable network
2. Navigate to pages
3. Perform actions
4. Re-enable network

**Expected Results:**
- [ ] Errors are tracked
- [ ] Fallback messages are shown
- [ ] System recovers gracefully
- [ ] No crashes occur

### Test Case 7.2: Invalid Data
**Steps:**
1. Upload invalid files
2. Submit invalid forms
3. Monitor error handling

**Expected Results:**
- [ ] Errors are caught and tracked
- [ ] Frenly AI provides helpful error messages
- [ ] User can recover from errors

---

## Analytics Testing

### Test Case 8.1: Analytics Collection
**Steps:**
1. Use various features across pages
2. Check analytics data

**Expected Results:**
- [ ] Feature usage is tracked
- [ ] Page visits are tracked
- [ ] Analytics data is accurate

**Verification:**
```javascript
// Check analytics
import { getAnalyticsCollector } from '@/orchestration/utils/analytics';
const collector = getAnalyticsCollector();
console.log(collector.exportAnalytics());
```

### Test Case 8.2: Analytics Reporting
**Steps:**
1. Generate analytics report
2. Verify report accuracy

**Expected Results:**
- [ ] Report includes all features
- [ ] Statistics are correct
- [ ] Top features/pages are identified

**Verification:**
```javascript
import { generateAnalyticsReport } from '@/orchestration/utils/analytics';
const report = generateAnalyticsReport();
console.log(report);
```

---

## Health Monitoring Testing

### Test Case 9.1: Health Check
**Steps:**
1. Check orchestration health
2. Verify all components are healthy

**Expected Results:**
- [ ] All components are initialized
- [ ] Health status is 'healthy'
- [ ] No errors in health check

**Verification:**
```javascript
import { checkOrchestrationHealth } from '@/orchestration/utils/monitoring';
const health = checkOrchestrationHealth();
console.log(health);
```

---

## Test Results Template

### Test Execution Log

**Date:** _______________  
**Tester:** _______________  
**Environment:** _______________

| Test Case | Status | Notes | Issues |
|-----------|--------|-------|--------|
| 1.1 Dashboard Load | ⬜ Pass / ⬜ Fail | | |
| 1.2 Data Loading | ⬜ Pass / ⬜ Fail | | |
| 1.3 Error Handling | ⬜ Pass / ⬜ Fail | | |
| 2.1 File Upload | ⬜ Pass / ⬜ Fail | | |
| 2.2 Processing Status | ⬜ Pass / ⬜ Fail | | |
| 2.3 File Deletion | ⬜ Pass / ⬜ Fail | | |
| 3.1 Match Review | ⬜ Pass / ⬜ Fail | | |
| 3.2 Approval/Rejection | ⬜ Pass / ⬜ Fail | | |
| 3.3 Context Updates | ⬜ Pass / ⬜ Fail | | |
| 4.1 Tab Navigation | ⬜ Pass / ⬜ Fail | | |
| 4.2 Job Execution | ⬜ Pass / ⬜ Fail | | |
| 5.1 State Sync | ⬜ Pass / ⬜ Fail | | |
| 5.2 Onboarding Continuity | ⬜ Pass / ⬜ Fail | | |
| 6.1 Performance | ⬜ Pass / ⬜ Fail | | |
| 6.2 Context Updates | ⬜ Pass / ⬜ Fail | | |
| 7.1 Network Failures | ⬜ Pass / ⬜ Fail | | |
| 7.2 Invalid Data | ⬜ Pass / ⬜ Fail | | |
| 8.1 Analytics Collection | ⬜ Pass / ⬜ Fail | | |
| 8.2 Analytics Reporting | ⬜ Pass / ⬜ Fail | | |
| 9.1 Health Check | ⬜ Pass / ⬜ Fail | | |

---

## Common Issues and Solutions

### Issue: Frenly AI messages not appearing
**Solution:**
- Check if FrenlyProvider is mounted
- Verify page metadata is correct
- Check browser console for errors
- Verify Frenly AI service is initialized

### Issue: Context not updating
**Solution:**
- Check if `updatePageContext` is called
- Verify context function returns valid data
- Check for errors in context calculation
- Verify page is properly mounted

### Issue: Tracking not working
**Solution:**
- Check if tracking functions are called
- Verify event listeners are set up
- Check for errors in tracking code
- Verify analytics collector is initialized

### Issue: Performance issues
**Solution:**
- Check message generation time
- Verify debouncing is working
- Check for excessive context updates
- Monitor re-render frequency

---

## Next Steps After Testing

1. **Document Issues**: Record all issues found during testing
2. **Prioritize Fixes**: Categorize issues by severity
3. **Create Tickets**: Create tickets for each issue
4. **Update Documentation**: Update docs based on findings
5. **Iterate**: Re-test after fixes are applied

---

## Related Documentation

- [Orchestration Integration Complete](../architecture/ORCHESTRATION_INTEGRATION_COMPLETE.md)
- [Integration Guide](../../frontend/src/orchestration/INTEGRATION_GUIDE.md)
- [Frenly AI Orchestration Proposal](../architecture/FRENLY_AI_ORCHESTRATION_PROPOSAL.md)

