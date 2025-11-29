# Frenly Meta Agent Orchestration Plan

**Last Updated**: 2025-01-15  
**Status**: Active  
**Owner**: AI Agent Team

---

## Overview

This document orchestrates the complete implementation of the Frenly AI meta-agent maintenance system. The system provides automated health monitoring, intelligent reporting, and proactive developer assistance.

---

## Phase Summary

| Phase | Name | Status | Priority | Dependencies |
|-------|------|--------|----------|--------------|
| 1 | Core Infrastructure | ✅ Complete | P0 | None |
| 2 | Frenly UI Integration | ✅ Complete | P0 | Phase 1 |
| 3 | CI/CD Automation | ✅ Complete | P1 | Phase 1 |
| 4 | Enhanced Reporting | 🔄 Partial (4.1 done) | P1 | Phase 1 |
| 5 | Frenly Intelligence | ✅ Complete | P2 | Phase 2, 4 |
| 6 | Admin Controls | ⏳ Pending | P2 | Phase 2, 3 |
| 7 | Historical Analytics | ⏳ Pending | P3 | Phase 2, 4 |
| 8 | Alerting & Notifications | ✅ Complete | P3 | Phase 1, 3 |

---

## Phase 1: Core Infrastructure ✅

**Status**: Complete  
**Files Created**:
- `scripts/frenly-meta-maintenance.sh` - Main orchestrator script
- `docs/diagnostics/frenly-meta-status.json` - Machine-readable status
- `docs/diagnostics/frenly-meta-maintenance-log.csv` - Historical metrics
- `docs/diagnostics/FRENLY_META_MAINTENANCE_REPORT.md` - Human-readable report

### 1.1 Shell Script Orchestrator ✅
```bash
# Usage
npm run maintenance:frenly       # Full mode (default)
npm run maintenance:frenly:fast  # Fast mode (essential checks only)
npm run maintenance:frenly:full  # Explicit full mode
```

### 1.2 Check Categories ✅

**Hard Checks** (failures = failed status):
| Check | Command | Purpose |
|-------|---------|---------|
| Lint | `npm run lint` | Code style enforcement |
| Type Check | `npm run type-check` | TypeScript compilation |
| Tests (CI) | `npm run test:ci` | Test suite |
| Build & Bundle | `npm run build:verify` | Production build |
| Dependency Validate | `npm run deps:validate` | Dependency health |

**Soft Checks** (failures = degraded status):
| Check | Command | Purpose |
|-------|---------|---------|
| Coverage | `npm run coverage:check` | Test coverage |
| Performance | `npm run performance:verify` | Performance budgets |
| Quality | `npm run quality:check` | Code quality metrics |
| SSOT Validate | `bash scripts/validate-ssot.sh` | SSOT compliance |
| Import Validate | `bash scripts/validate-imports.sh` | Import paths |
| Dependency Graph | `npm run deps:graph` | Dependency visualization |
| Dependency Report | `npm run deps:report` | Health report |
| Dependency Monitor | `npm run deps:monitor` | Outdated packages |
| Security Audit | `npm audit --audit-level=moderate` | Vulnerability scan |

### 1.3 Output Files ✅

**frenly-meta-status.json**:
```json
{
  "lastRun": "2025-01-15T10:30:00+0000",
  "mode": "full",
  "overallStatus": "healthy|degraded|failed",
  "hardFailures": 0,
  "softFailures": 0,
  "durationSeconds": 123,
  "reportPath": "docs/diagnostics/FRENLY_META_MAINTENANCE_REPORT.md",
  "failedChecks": []
}
```

**frenly-meta-maintenance-log.csv**:
```csv
timestamp,mode,overallStatus,hardFailures,softFailures,durationSeconds
2025-01-15T10:30:00+0000,full,healthy,0,0,123
```

---

## Phase 2: Frenly UI Integration 🔄

**Status**: In Progress  
**Dependencies**: Phase 1

### 2.1 Maintenance Status Hook ✅

**File**: `frontend/src/hooks/useFrenlyMaintenanceStatus.ts`

```typescript
interface FrenlyMaintenanceStatus {
  lastRun: string;
  mode: string;
  overallStatus: 'healthy' | 'degraded' | 'failed';
  hardFailures: number;
  softFailures: number;
  durationSeconds: number;
  reportPath: string;
  failedChecks: string[];
}

const { status, loading, error, refresh } = useFrenlyMaintenanceStatus();
```

### 2.2 System Health Badge ✅

**Location**: `FrenlyProvider.tsx` control panel

- Green pill: "Healthy" - all checks passed
- Yellow pill: "Degraded" - soft failures only
- Red pill: "Attention needed" - hard failures
- Gray pill: "No recent run" - no status available
- "View report" link to full markdown report

### 2.3 Detailed Tooltip with Failed Checks ⏳

**Todo**: Enhance the health badge to show failed checks on hover.

```typescript
// Implementation approach
<Tooltip
  content={
    <div>
      <p>Last run: {formatDate(status.lastRun)}</p>
      {status.failedChecks.length > 0 && (
        <ul>
          {status.failedChecks.map(check => <li key={check}>{check}</li>)}
        </ul>
      )}
    </div>
  }
>
  <HealthBadge status={status.overallStatus} />
</Tooltip>
```

### 2.4 Mini History Sparkline ⏳

**Todo**: Parse CSV and show last 7 runs as a sparkline chart.

```typescript
// New hook: useFrenlyMaintenanceHistory
// Fetches: docs/diagnostics/frenly-meta-maintenance-log.csv
// Returns: { runs: MaintenanceRun[], loading, error }

// Sparkline component shows:
// - Last 7 run statuses as colored dots
// - Trend arrow (improving/declining/stable)
```

---

## Phase 3: CI/CD Automation 🔄

**Status**: In Progress  
**Dependencies**: Phase 1

### 3.1 GitHub Actions Workflow ✅

**File**: `.github/workflows/frenly-meta-maintenance.yml`

- Runs weekly (Monday 03:00 UTC)
- Manual trigger via `workflow_dispatch`
- Uploads report as artifact

### 3.2 Fix GitHub Actions Versions ⏳

**Todo**: Update action versions from v3 to v4.

```yaml
# Current (deprecated)
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
- uses: actions/upload-artifact@v3

# Updated
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- uses: actions/upload-artifact@v4
```

### 3.3 Auto-Commit Status Back to Repo ⏳

**Todo**: After CI run, commit the updated `frenly-meta-status.json` back to the repo.

```yaml
# Add to workflow
- name: Commit maintenance status
  run: |
    git config --local user.email "github-actions[bot]@users.noreply.github.com"
    git config --local user.name "github-actions[bot]"
    git add docs/diagnostics/frenly-meta-status.json
    git add docs/diagnostics/frenly-meta-maintenance-log.csv
    git commit -m "chore: update frenly maintenance status" || true
    git push
```

---

## Phase 4: Enhanced Reporting ⏳

**Status**: Pending  
**Dependencies**: Phase 1

### 4.1 Per-Check Duration Timing ⏳

**Todo**: Track individual check durations for performance insights.

```bash
# Enhanced run_check function
run_check() {
  local check_start=$(date +%s)
  # ... run check ...
  local check_end=$(date +%s)
  local check_duration=$((check_end - check_start))
  results+=("| $name | ✅ | ${check_duration}s |")
}
```

**Enhanced JSON output**:
```json
{
  "checkDetails": [
    { "name": "Lint", "status": "passed", "durationSeconds": 15 },
    { "name": "Type Check", "status": "passed", "durationSeconds": 45 }
  ]
}
```

### 4.2 AI-Generated Recommendations ⏳

**Todo**: Add a recommendations section based on check results.

```markdown
## Recommendations

Based on the maintenance results, Frenly suggests:

1. **Fix Lint Errors**: 3 files have linting issues
   - `src/components/Button.tsx` - unused import
   - `src/utils/helpers.ts` - prefer-const violation
   
2. **Update Dependencies**: 5 packages are outdated
   - `react@18.2.0` → `react@18.3.1`
   - `typescript@5.3.0` → `typescript@5.4.0`
```

---

## Phase 5: Frenly Intelligence ⏳

**Status**: Pending  
**Dependencies**: Phase 2, Phase 4

### 5.1 Maintenance-Aware Messages ⏳

**Todo**: Frenly shows contextual messages based on system health.

```typescript
// In FrenlyProvider generateContextualMessage
if (maintenanceStatus?.overallStatus === 'degraded') {
  return {
    type: 'warning',
    content: `Hey! I noticed some maintenance checks are degraded. 
              ${maintenanceStatus.softFailures} soft issues found. 
              Want me to help you fix them?`,
    action: {
      text: 'Show Issues',
      onClick: () => navigate('/maintenance')
    }
  };
}
```

### 5.2 Stale Status Suggestions ⏳

**Todo**: Frenly suggests running maintenance when status is old.

```typescript
const isStale = (lastRun: string) => {
  const lastRunDate = new Date(lastRun);
  const now = new Date();
  const daysSinceRun = (now - lastRunDate) / (1000 * 60 * 60 * 24);
  return daysSinceRun > 7;
};

if (isStale(maintenanceStatus.lastRun)) {
  return {
    type: 'tip',
    content: `It's been ${days} days since the last maintenance run. 
              Would you like me to run a quick health check?`,
    action: {
      text: 'Run Fast Check',
      onClick: () => triggerMaintenance('fast')
    }
  };
}
```

---

## Phase 6: Admin Controls ⏳

**Status**: Pending  
**Dependencies**: Phase 2, Phase 3

### 6.1 Manual Trigger Button ⏳

**Todo**: Add "Run Maintenance Now" button for admins.

```typescript
// In FrenlyProvider control panel
{isAdmin && (
  <button
    onClick={() => triggerMaintenance('fast')}
    className="text-xs text-purple-600 hover:text-purple-700"
  >
    Run Maintenance
  </button>
)}

// triggerMaintenance calls backend endpoint or MCP tool
const triggerMaintenance = async (mode: 'fast' | 'full') => {
  await fetch('/api/maintenance/trigger', {
    method: 'POST',
    body: JSON.stringify({ mode })
  });
};
```

### 6.2 Maintenance Preferences Panel ⏳

**Todo**: Settings UI for maintenance configuration.

```typescript
interface MaintenancePreferences {
  autoRunEnabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly';
  preferredMode: 'fast' | 'full';
  notifyOnFailure: boolean;
  notifyOnDegraded: boolean;
}

// UI in FrenlyProvider settings
<MaintenanceSettings
  preferences={maintenancePreferences}
  onUpdate={updateMaintenancePreferences}
/>
```

---

## Phase 7: Historical Analytics ⏳

**Status**: Pending  
**Dependencies**: Phase 2, Phase 4

### 7.1 Maintenance Dashboard Component ⏳

**Todo**: Create a dedicated dashboard for maintenance trends.

```typescript
// frontend/src/components/maintenance/MaintenanceDashboard.tsx
const MaintenanceDashboard: React.FC = () => {
  const { runs, loading } = useFrenlyMaintenanceHistory();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <HealthTrendChart runs={runs} />
      <DurationTrendChart runs={runs} />
      <FailureBreakdownChart runs={runs} />
      <RecentRunsList runs={runs.slice(0, 10)} />
    </div>
  );
};
```

### 7.2 Run Comparison View ⏳

**Todo**: Compare current run with previous run.

```typescript
// Shows diff between two runs
<RunComparison
  current={runs[0]}
  previous={runs[1]}
/>

// Highlights:
// - New failures
// - Fixed issues
// - Duration change
// - Status change
```

---

## Phase 8: Alerting & Notifications ⏳

**Status**: Pending  
**Dependencies**: Phase 1, Phase 3

### 8.1 Slack Notification ⏳

**Todo**: Send Slack message on failed maintenance.

```yaml
# Add to GitHub Actions workflow
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: 'C0XXXXX'
    slack-message: |
      🚨 Frenly Maintenance Failed
      - Hard Failures: ${{ env.HARD_FAILURES }}
      - Soft Failures: ${{ env.SOFT_FAILURES }}
      - Report: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### 8.2 In-App Toast Notification ⏳

**Todo**: Show toast when maintenance status changes.

```typescript
// In FrenlyProvider
useEffect(() => {
  if (previousStatus?.overallStatus === 'healthy' && 
      maintenanceStatus?.overallStatus !== 'healthy') {
    toast.warning('System health has degraded. Check maintenance report.');
  }
}, [maintenanceStatus]);
```

---

## Implementation Order

### Sprint 1 (P0) ✅ COMPLETE
1. ✅ Phase 1: Core Infrastructure
2. ✅ Phase 2.1: Create useFrenlyMaintenanceStatus hook
3. ✅ Phase 2.2: Add system health badge to FrenlyProvider UI
4. ✅ Phase 3.1: GitHub Actions workflow

### Sprint 2 (P1) ✅ COMPLETE
5. ✅ Phase 2.3: Detailed tooltip with failed checks
6. ✅ Phase 3.2: Fix action versions (v3 → v4)
7. ✅ Phase 3.3: Auto-commit status JSON to repo
8. ✅ Phase 4.1: Per-check duration timing

### Sprint 3 (P2) ✅ COMPLETE
9. ✅ Phase 2.4: History sparkline with trend indicator
10. ✅ Phase 5.1: Maintenance-aware messages (degraded/failed)
11. ✅ Phase 5.2: Stale status suggestions

### Sprint 4 (P3) ✅ MOSTLY COMPLETE
12. ✅ Phase 8.1: Slack notification on failure
13. ✅ Phase 8.2: In-app toast notifications

### Sprint 5 (Remaining - P2-P3)
14. ⏳ Phase 4.2: AI-generated recommendations
15. ⏳ Phase 6.1: Manual trigger button
16. ⏳ Phase 6.2: Preferences panel
17. ⏳ Phase 7.1: Maintenance dashboard
18. ⏳ Phase 7.2: Run comparison

---

## File Structure

```
scripts/
├── frenly-meta-maintenance.sh      # Main orchestrator
├── lib/
│   └── common-functions.sh         # Shared utilities

frontend/src/
├── hooks/
│   ├── useFrenlyMaintenanceStatus.ts   # Status hook ✅
│   └── useFrenlyMaintenanceHistory.ts  # History hook (todo)
├── components/
│   ├── frenly/
│   │   ├── FrenlyProvider.tsx          # Main provider ✅
│   │   └── FrenlyMaintenanceBadge.tsx  # Health badge (todo)
│   └── maintenance/
│       ├── MaintenanceDashboard.tsx    # Dashboard (todo)
│       ├── HealthTrendChart.tsx        # Chart (todo)
│       └── RunComparison.tsx           # Comparison (todo)

docs/diagnostics/
├── frenly-meta-status.json             # Machine-readable status
├── frenly-meta-maintenance-log.csv     # Historical metrics
└── FRENLY_META_MAINTENANCE_REPORT.md   # Human-readable report

.github/workflows/
└── frenly-meta-maintenance.yml         # CI automation
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Automated runs per week | 1+ | 0 (not yet deployed) |
| Status visibility in UI | Yes | Yes ✅ |
| Average run duration | <5 min | TBD |
| Developer awareness | High | Medium |
| Issue detection time | <24h | TBD |

---

## Related Documentation

- [Master Todo List](../diagnostics/MASTER_TODO_LIST.md)
- [Circular Dependencies Report](../diagnostics/CIRCULAR_DEPENDENCIES_REPORT.md)
- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md)

---

**Progress**: 14/18 tasks complete (78%)  
**Next Action**: Implement Phase 6 (Admin Controls) and Phase 7 (Historical Analytics)

