# Frenly AI Orchestration Monitoring Guide

**Date:** January 2025  
**Status:** Active  
**Purpose:** Guide for monitoring and maintaining the Frenly AI orchestration system

---

## Overview

This guide provides instructions for monitoring the health, performance, and usage of the Frenly AI orchestration system in production.

---

## Health Monitoring

### Automated Health Checks

The orchestration system includes automated health monitoring:

```typescript
import { checkOrchestrationHealth, startHealthMonitoring } from '@/orchestration/utils/monitoring';

// Check health once
const health = checkOrchestrationHealth();
console.log(health);

// Start periodic health monitoring (every 60 seconds)
const stopMonitoring = startHealthMonitoring(60000);

// Stop monitoring when needed
stopMonitoring();
```

### Health Status Levels

- **healthy**: All components operational
- **degraded**: Some components unavailable but system functional
- **unhealthy**: Critical components unavailable

### Monitoring Components

1. **Lifecycle Manager**: Manages page lifecycle events
2. **Sync Manager**: Handles state synchronization
3. **Event Manager**: Processes real-time events
4. **Behavior Tracker**: Tracks user behavior

---

## Performance Monitoring

### Message Generation Performance

Monitor message generation times:

```typescript
import { getPerformanceMonitor } from '@/orchestration/utils/monitoring';

const monitor = getPerformanceMonitor();
const metrics = monitor.getMetrics();

console.log('Average message generation time:', metrics.messageGenerationTime, 'ms');
```

### Performance Thresholds

- **Message Generation**: < 500ms (good), 500-1000ms (acceptable), > 1000ms (needs attention)
- **Context Updates**: < 100ms (good), 100-300ms (acceptable), > 300ms (needs attention)
- **Sync Operations**: < 200ms (good), 200-500ms (acceptable), > 500ms (needs attention)

---

## Error Monitoring

### Error Tracking

Track and monitor errors:

```typescript
import { getErrorTracker } from '@/orchestration/utils/monitoring';

const tracker = getErrorTracker();

// Get recent errors
const recentErrors = tracker.getRecentErrors(10);
console.log('Recent errors:', recentErrors);

// Get error count
const errorCount = tracker.getErrorCount();
console.log('Total errors:', errorCount);
```

### Error Categories

1. **Initialization Errors**: System startup failures
2. **Sync Errors**: State synchronization failures
3. **Message Generation Errors**: Frenly AI message failures
4. **Context Errors**: Context calculation failures

---

## Analytics Monitoring

### Feature Usage Analytics

Monitor feature usage:

```typescript
import { getAnalyticsCollector, generateAnalyticsReport } from '@/orchestration/utils/analytics';

const collector = getAnalyticsCollector();

// Get feature stats
const stats = collector.getFeatureStats('file-upload');
console.log('File upload stats:', stats);

// Generate full report
const report = generateAnalyticsReport();
console.log('Analytics report:', report);
```

### Key Metrics to Monitor

1. **Feature Usage Count**: How often features are used
2. **Success Rate**: Percentage of successful operations
3. **Error Rate**: Percentage of failed operations
4. **Average Response Time**: Average time for operations
5. **Page Visit Count**: How often pages are visited

---

## Logging

### Log Levels

The orchestration system uses structured logging:

- **info**: Normal operations and status updates
- **debug**: Detailed debugging information
- **warn**: Warning conditions
- **error**: Error conditions

### Log Examples

```typescript
// Info logs
logger.info('Page mounted', { pageId: 'dashboard' });
logger.info('Context updated', { changes: { projectsCount: 5 } });

// Debug logs
logger.debug('Message generated', { messageId: 'msg-123', type: 'tip' });
logger.debug('Feature tracked', { featureId: 'file-upload', action: 'upload-started' });

// Warning logs
logger.warn('Sync queue full', { queueSize: 100 });
logger.warn('Slow message generation', { timeMs: 1500 });

// Error logs
logger.error('Failed to sync state', { error, pageId: 'dashboard' });
logger.error('Message generation failed', { error, context });
```

---

## Monitoring Dashboard

### Recommended Metrics to Display

1. **System Health**
   - Overall health status
   - Component status
   - Error count

2. **Performance Metrics**
   - Average message generation time
   - Average context update time
   - Average sync time

3. **Usage Statistics**
   - Total feature usage
   - Top features
   - Top pages
   - Error rate

4. **Recent Activity**
   - Recent errors
   - Recent feature usage
   - Recent page visits

---

## Alerting

### Alert Conditions

Set up alerts for:

1. **Health Degradation**: System health changes to 'degraded' or 'unhealthy'
2. **High Error Rate**: Error rate exceeds threshold (> 5%)
3. **Performance Issues**: Response times exceed thresholds
4. **Component Failures**: Individual components fail

### Alert Examples

```typescript
// Check health and alert if degraded
const health = checkOrchestrationHealth();
if (health.status !== 'healthy') {
  // Send alert
  console.error('Orchestration health degraded:', health);
}

// Check error rate
const report = generateAnalyticsReport();
if (report.summary.errorRate > 0.05) {
  // Send alert
  console.error('High error rate detected:', report.summary.errorRate);
}
```

---

## Maintenance Tasks

### Daily Tasks

- [ ] Review error logs
- [ ] Check health status
- [ ] Monitor performance metrics
- [ ] Review analytics summary

### Weekly Tasks

- [ ] Generate analytics report
- [ ] Review top features and pages
- [ ] Analyze error patterns
- [ ] Review performance trends

### Monthly Tasks

- [ ] Full system health audit
- [ ] Performance optimization review
- [ ] Analytics data cleanup
- [ ] Documentation updates

---

## Troubleshooting

### Common Issues

#### Issue: High Error Rate
**Investigation:**
1. Check error tracker for recent errors
2. Review error patterns
3. Check component health
4. Review logs for details

**Resolution:**
- Fix underlying issues
- Improve error handling
- Add retry logic
- Update error messages

#### Issue: Performance Degradation
**Investigation:**
1. Check performance metrics
2. Review message generation times
3. Check context update frequency
4. Monitor sync operations

**Resolution:**
- Optimize message generation
- Reduce context update frequency
- Improve debouncing
- Cache frequently accessed data

#### Issue: Component Failures
**Investigation:**
1. Check component health
2. Review initialization logs
3. Check dependencies
4. Verify configuration

**Resolution:**
- Restart failed components
- Fix initialization issues
- Update dependencies
- Correct configuration

---

## Best Practices

1. **Regular Monitoring**: Check health and metrics regularly
2. **Proactive Alerts**: Set up alerts before issues become critical
3. **Log Analysis**: Regularly review logs for patterns
4. **Performance Optimization**: Continuously optimize based on metrics
5. **Documentation**: Keep monitoring documentation up to date

---

## Related Documentation

- [Orchestration Integration Complete](../architecture/ORCHESTRATION_INTEGRATION_COMPLETE.md)
- [Testing Guide](../testing/ORCHESTRATION_TESTING_GUIDE.md)
- [Integration Guide](../../frontend/src/orchestration/INTEGRATION_GUIDE.md)

