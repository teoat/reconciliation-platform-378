#!/bin/bash
# Documentation Consolidation Script
# Moves duplicate/outdated documentation to archive

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs/project-management"
ARCHIVE_DIR="$PROJECT_ROOT/docs/archive/project-management"

# Create archive directories
mkdir -p "$ARCHIVE_DIR/complete"
mkdir -p "$ARCHIVE_DIR/summary"
mkdir -p "$ARCHIVE_DIR/status"
mkdir -p "$ARCHIVE_DIR/progress"
mkdir -p "$ARCHIVE_DIR/agent"

# Files to keep (essential active documents)
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
)

cd "$DOCS_DIR"

# Function to check if file should be kept
should_keep() {
  local file="$1"
  for keep in "${KEEP_FILES[@]}"; do
    if [[ "$file" == "$keep" ]]; then
      return 0
    fi
  done
  return 1
}

# Move COMPLETE files
echo "Archiving COMPLETE files..."
for file in *COMPLETE*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    if [[ "$file" == *"AGENT"* ]]; then
      mv "$file" "$ARCHIVE_DIR/agent/" 2>/dev/null || true
    else
      mv "$file" "$ARCHIVE_DIR/complete/" 2>/dev/null || true
    fi
    echo "  Archived: $file"
  fi
done

# Move SUMMARY files
echo "Archiving SUMMARY files..."
for file in *SUMMARY*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    if [[ "$file" == *"AGENT"* ]]; then
      mv "$file" "$ARCHIVE_DIR/agent/" 2>/dev/null || true
    else
      mv "$file" "$ARCHIVE_DIR/summary/" 2>/dev/null || true
    fi
    echo "  Archived: $file"
  fi
done

# Move STATUS files
echo "Archiving STATUS files..."
for file in *STATUS*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    if [[ "$file" == *"AGENT"* ]]; then
      mv "$file" "$ARCHIVE_DIR/agent/" 2>/dev/null || true
    else
      mv "$file" "$ARCHIVE_DIR/status/" 2>/dev/null || true
    fi
    echo "  Archived: $file"
  fi
done

# Move PROGRESS files
echo "Archiving PROGRESS files..."
for file in *PROGRESS*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    if [[ "$file" == *"AGENT"* ]]; then
      mv "$file" "$ARCHIVE_DIR/agent/" 2>/dev/null || true
    else
      mv "$file" "$ARCHIVE_DIR/progress/" 2>/dev/null || true
    fi
    echo "  Archived: $file"
  fi
done

# Move other agent-specific files
echo "Archiving agent-specific files..."
for file in AGENT*.md; do
  if [[ -f "$file" ]] && ! should_keep "$file"; then
    mv "$file" "$ARCHIVE_DIR/agent/" 2>/dev/null || true
    echo "  Archived: $file"
  fi
done

echo ""
echo "Consolidation complete!"
echo "Active documents remain in: $DOCS_DIR"
echo "Archived documents moved to: $ARCHIVE_DIR"

