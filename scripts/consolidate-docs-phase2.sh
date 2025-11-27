#!/bin/bash
# Documentation Consolidation Phase 2
# Archives additional outdated/duplicate files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs/project-management"
ARCHIVE_DIR="$PROJECT_ROOT/docs/archive/project-management"

# Create archive directories
mkdir -p "$ARCHIVE_DIR/agent"
mkdir -p "$ARCHIVE_DIR/plans"
mkdir -p "$ARCHIVE_DIR/proposals"
mkdir -p "$ARCHIVE_DIR/reports"

# Essential files to keep
KEEP_FILES=(
  "PROJECT_STATUS.md"
  "FIVE_AGENTS_CONSOLIDATED_SUMMARY.md"
  "ALL_TODOS_COMPLETE.md"
  "PHASE_5_REFACTORING_PROGRESS.md"
  "REMAINING_WORK_IMPLEMENTATION_GUIDE.md"
  "PHASE_7_PRODUCTION_TESTING_GUIDE.md"
  "PHASE_7_PRODUCTION_TESTING_CHECKLIST.md"
  "PHASE_7_FRONTEND_COMPLETE.md"
  "MASTER_TODOS.md"
  "README.md"
  "CONSOLIDATION_PLAN.md"
  "PHASE_5_IMPLEMENTATION_CHECKLIST.md"
  "PHASE_6_IMPLEMENTATION_CHECKLIST.md"
  "PHASE_7_IMPLEMENTATION_CHECKLIST.md"
  "PRIORITY_RECOMMENDATIONS.md"
  "TODO_DIAGNOSIS_COMPREHENSIVE.md"
)

cd "$DOCS_DIR"

should_keep() {
  local file="$1"
  for keep in "${KEEP_FILES[@]}"; do
    if [[ "$file" == "$keep" ]]; then
      return 0
    fi
  done
  return 1
}

# Archive agent-specific plans, proposals, reports
echo "Archiving agent-specific files..."
for pattern in AGENT*_PLAN.md AGENT*_PROPOSAL.md AGENT*_START.md AGENT*_NEXT*.md AGENT*_REPORT.md AGENT*_GUIDE.md AGENT*_CHECKLIST.md AGENT*_ANALYSIS.md AGENT*_REVIEW.md AGENT*_TEMPLATE.md AGENT*_ACTIVE*.md AGENT*_READY.md AGENT*_SUPPORT*.md AGENT*_MONITORING*.md AGENT*_WEEKLY*.md AGENT*_OPTIMIZATION*.md AGENT*_COMPLETION*.md AGENT*_VALIDATION.md; do
  for file in $pattern; do
    if [[ -f "$file" ]] && ! should_keep "$file"; then
      mv "$file" "$ARCHIVE_DIR/agent/" 2>/dev/null && echo "  Archived: $file" || true
    fi
  done
done

# Archive coordination/orchestration plans
echo "Archiving coordination plans..."
for file in *COORDINATION*.md *ORCHESTRATION*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    mv "$file" "$ARCHIVE_DIR/plans/" 2>/dev/null && echo "  Archived: $file" || true
  fi
done

# Archive diagnostic reports
echo "Archiving diagnostic reports..."
for file in *DIAGNOSTIC*.md *AUDIT*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    mv "$file" "$ARCHIVE_DIR/reports/" 2>/dev/null && echo "  Archived: $file" || true
  fi
done

# Archive completion reports (duplicates)
echo "Archiving duplicate completion reports..."
for file in *COMPLETION*.md *FINAL*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    mv "$file" "$ARCHIVE_DIR/reports/" 2>/dev/null && echo "  Archived: $file" || true
  fi
done

# Archive roadmap/plan files
echo "Archiving roadmap/plan files..."
for file in *ROADMAP*.md *BUILD*.md *DEPLOYMENT*.md *LAUNCH*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    mv "$file" "$ARCHIVE_DIR/plans/" 2>/dev/null && echo "  Archived: $file" || true
  fi
done

echo ""
echo "Phase 2 consolidation complete!"
echo "Remaining files in: $DOCS_DIR"
ls -1 *.md 2>/dev/null | wc -l | xargs echo "Total files remaining:"

