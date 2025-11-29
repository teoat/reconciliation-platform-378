#!/bin/bash
# Frenly Meta Maintenance Orchestrator
# Runs a full system maintenance suite and writes a summary report.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
REPORT_DIR="$REPO_ROOT/docs/diagnostics"
REPORT_FILE="$REPORT_DIR/FRENLY_META_MAINTENANCE_REPORT.md"
STATUS_JSON="$REPORT_DIR/frenly-meta-status.json"
METRICS_CSV="$REPORT_DIR/frenly-meta-maintenance-log.csv"

source "$SCRIPT_DIR/lib/common-functions.sh"

mkdir -p "$REPORT_DIR"

MODE="${FRENLY_MODE:-full}"

# Hard checks: failures here mark overall as failed and exit non-zero
hard_checks=(
  "Lint: npm run lint"
  "Type Check: npm run type-check"
  "Tests (CI): npm run test:ci"
  "Build & Bundle Verify: npm run build:verify"
  "Dependency Validate: npm run deps:validate"
)

# Soft checks: failures here degrade health but don't break hard status
soft_checks=(
  "Coverage Check: npm run coverage:check"
  "Performance Verify: npm run performance:verify"
  "Quality Check: npm run quality:check"
  "SSOT Validate: bash scripts/validate-ssot.sh"
  "Import Validate: bash scripts/validate-imports.sh"
  "Dependency Graph: npm run deps:graph"
  "Dependency Health Report: npm run deps:report"
  "Dependency Monitor: npm run deps:monitor"
  "Security Audit: npm audit --audit-level=moderate"
)

# Fast mode: trim soft checks to essentials
if [ "$MODE" = "fast" ]; then
  soft_checks=(
    "Coverage Check: npm run coverage:check"
    "Dependency Health Report: npm run deps:report"
  )
fi

results=()
failed_checks=()
check_details=()
hard_failures=0
soft_failures=0

run_check() {
  local name="$1"
  local cmd="$2"
  local severity="$3" # hard | soft

  log_info "[Frenly Meta] Running: $name ($severity)"
  
  local check_start=$(date +%s)
  local status="passed"
  
  if bash -lc "$cmd"; then
    log_success "[Frenly Meta] $name ✅"
    local check_end=$(date +%s)
    local check_duration=$((check_end - check_start))
    results+=("| $name | ✅ | ${check_duration}s |")
    check_details+=("{\"name\":\"$name\",\"status\":\"passed\",\"severity\":\"$severity\",\"durationSeconds\":$check_duration}")
  else
    log_error "[Frenly Meta] $name ❌"
    local check_end=$(date +%s)
    local check_duration=$((check_end - check_start))
    results+=("| $name | ❌ | ${check_duration}s - See logs |")
    failed_checks+=("$name")
    check_details+=("{\"name\":\"$name\",\"status\":\"failed\",\"severity\":\"$severity\",\"durationSeconds\":$check_duration}")
    if [ "$severity" = "hard" ]; then
      hard_failures=$((hard_failures + 1))
    else
      soft_failures=$((soft_failures + 1))
    fi
  fi
}

cd "$REPO_ROOT"

START_TS=$(date +%s)

# Header
cat > "$REPORT_FILE" << EOF
# Frenly Meta Maintenance Report

**Date**: $(date '+%Y-%m-%d')  
**Generated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Mode**: ${MODE}
**Status**: RUNNING

---

## Checks

| Check | Status | Duration |
|-------|--------|----------|
EOF

# Run hard checks
for entry in "${hard_checks[@]}"; do
  name="${entry%%:*}"
  cmd="${entry#*: }"
  run_check "$name" "$cmd" "hard"
done

# Run soft checks
for entry in "${soft_checks[@]}"; do
  name="${entry%%:*}"
  cmd="${entry#*: }"
  run_check "$name" "$cmd" "soft"
done

# Append results
for line in "${results[@]}"; do
  echo "$line" >> "$REPORT_FILE"
done

END_TS=$(date +%s)
DURATION=$((END_TS - START_TS))

# Final status
if [ "$hard_failures" -eq 0 ] && [ "$soft_failures" -eq 0 ]; then
  overall="healthy"
elif [ "$hard_failures" -eq 0 ]; then
  overall="degraded"
else
  overall="failed"
fi

cat >> "$REPORT_FILE" << EOF

---

## Summary

- **Mode**: ${MODE}  
- **Total Checks**: $(( ${#hard_checks[@]} + ${#soft_checks[@]} ))  
- **Hard Failures**: ${hard_failures}  
- **Soft Failures**: ${soft_failures}  
- **Duration**: ${DURATION}s  
- **Overall Status**: ${overall}

---

## How Frenly Uses This

- The Frenly meta agent can read this report and summarize system health.
- Use this file as the single source of truth for the latest maintenance run.

EOF

# Write JSON status for Frenly and other agents
FAILED_JSON="[]"
if [ ${#failed_checks[@]} -gt 0 ]; then
  FAILED_JSON="[\"$(printf '%s\",\"' "${failed_checks[@]}" | sed 's/\\"$//')\"]"
fi

# Build check details JSON array
CHECK_DETAILS_JSON="["
for i in "${!check_details[@]}"; do
  if [ $i -gt 0 ]; then
    CHECK_DETAILS_JSON+=","
  fi
  CHECK_DETAILS_JSON+="${check_details[$i]}"
done
CHECK_DETAILS_JSON+="]"

cat > "$STATUS_JSON" << JSON
{
  "lastRun": "$(date '+%Y-%m-%dT%H:%M:%S%z')",
  "mode": "${MODE}",
  "overallStatus": "${overall}",
  "hardFailures": ${hard_failures},
  "softFailures": ${soft_failures},
  "durationSeconds": ${DURATION},
  "reportPath": "docs/diagnostics/FRENLY_META_MAINTENANCE_REPORT.md",
  "failedChecks": ${FAILED_JSON},
  "checkDetails": ${CHECK_DETAILS_JSON}
}
JSON

# Append metrics CSV (header if file is new)
if [ ! -f "$METRICS_CSV" ]; then
  echo "timestamp,mode,overallStatus,hardFailures,softFailures,durationSeconds" > "$METRICS_CSV"
fi

echo "$(date '+%Y-%m-%dT%H:%M:%S%z'),${MODE},${overall},${hard_failures},${soft_failures},${DURATION}" >> "$METRICS_CSV"

log_info "[Frenly Meta] Maintenance complete. Report written to: $REPORT_FILE"

if [ "$hard_failures" -gt 0 ]; then
  exit 1
fi
