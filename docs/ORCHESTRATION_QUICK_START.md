# Frenly AI Orchestration - Quick Start Guide

**Date:** January 2025  
**Status:** Active  
**Purpose:** Quick reference for using Frenly AI orchestration tools and guides

---

## 🚀 Quick Links

### For Developers

- **[Integration Guide](./frontend/src/orchestration/INTEGRATION_GUIDE.md)** - How to integrate orchestration into pages
- **[Customization Guide](./operations/ORCHESTRATION_CUSTOMIZATION_GUIDE.md)** - How to customize guidance and behavior
- **[Testing Guide](./testing/ORCHESTRATION_TESTING_GUIDE.md)** - Comprehensive testing procedures

### For Operations

- **[Monitoring Guide](./operations/ORCHESTRATION_MONITORING.md)** - How to monitor system health and performance
- **[Analytics Guide](./operations/ORCHESTRATION_MONITORING.md#analytics-monitoring)** - How to review analytics data

### For Product

- **[Testing Guide](./testing/ORCHESTRATION_TESTING_GUIDE.md)** - User testing procedures
- **[Customization Guide](./operations/ORCHESTRATION_CUSTOMIZATION_GUIDE.md)** - How to customize user experience

---

## 📊 Quick Commands

### Health Check

```typescript
import { checkOrchestrationHealth } from '@/orchestration/utils/monitoring';

const health = checkOrchestrationHealth();
console.log(health);
```

### Performance Monitoring

```typescript
import { getPerformanceMonitor } from '@/orchestration/utils/monitoring';

const monitor = getPerformanceMonitor();
const metrics = monitor.getMetrics();
console.log('Average message time:', metrics.messageGenerationTime, 'ms');
```

### Analytics Report

```typescript
import { generateAnalyticsReport } from '@/orchestration/utils/analytics';

const report = generateAnalyticsReport();
console.log(report);
```

### Error Tracking

```typescript
import { getErrorTracker } from '@/orchestration/utils/monitoring';

const tracker = getErrorTracker();
const errors = tracker.getRecentErrors(10);
console.log('Recent errors:', errors);
```

---

## 📝 Common Tasks

### Add Tracking to a Feature

```typescript
import { usePageOrchestration } from '@/hooks/usePageOrchestration';

const { trackFeatureUsage, trackFeatureError } = usePageOrchestration({...});

// Track feature start
trackFeatureUsage('feature-id', 'action-started', { data: 'value' });

// Track success
trackFeatureUsage('feature-id', 'action-success', { data: 'value' });

// Track error
trackFeatureError('feature-id', error);
```

### Customize Guidance Message

1. Open page orchestration file: `frontend/src/orchestration/pages/[Page]PageOrchestration.ts`
2. Modify `getGuidanceContent()` function
3. Add or update guidance items

### Add Onboarding Step

1. Open page orchestration file
2. Add step ID to `pageMetadata.onboardingSteps`
3. Add step definition to `getOnboardingSteps()` function

### Monitor System Health

```typescript
import { startHealthMonitoring } from '@/orchestration/utils/monitoring';

// Start monitoring (checks every 60 seconds)
const stopMonitoring = startHealthMonitoring(60000);

// Stop when needed
stopMonitoring();
```

---

## 🔍 Troubleshooting

### Messages Not Appearing
- Check FrenlyProvider is mounted
- Verify page metadata is correct
- Check browser console for errors

### Context Not Updating
- Verify `updatePageContext()` is called
- Check context function returns valid data
- Review console for errors

### Performance Issues
- Check message generation time
- Verify debouncing is working
- Monitor context update frequency

---

## 📚 Documentation Index

1. **[Orchestration Proposal](./architecture/FRENLY_AI_ORCHESTRATION_PROPOSAL.md)** - Original proposal
2. **[Implementation Complete](./architecture/ORCHESTRATION_IMPLEMENTATION_COMPLETE.md)** - Implementation summary
3. **[Integration Complete](./architecture/ORCHESTRATION_INTEGRATION_COMPLETE.md)** - Integration summary
4. **[Integration Guide](./frontend/src/orchestration/INTEGRATION_GUIDE.md)** - How to integrate
5. **[Testing Guide](./testing/ORCHESTRATION_TESTING_GUIDE.md)** - Testing procedures
6. **[Monitoring Guide](./operations/ORCHESTRATION_MONITORING.md)** - Operations monitoring
7. **[Customization Guide](./operations/ORCHESTRATION_CUSTOMIZATION_GUIDE.md)** - Customization guide

---

## ✅ Status Checklist

- [x] All phases implemented
- [x] All pages integrated
- [x] Monitoring tools created
- [x] Analytics tools created
- [x] Testing guide created
- [x] Monitoring guide created
- [x] Customization guide created
- [ ] User testing completed
- [ ] Analytics reviewed
- [ ] Guidance customized based on feedback

---

**Last Updated:** January 2025  
**Status:** ✅ **READY FOR USE**

