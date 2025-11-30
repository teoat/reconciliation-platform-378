#!/bin/bash

# This script removes unimported files based on the diagnostic report.

REPORT_FILE="diagnostic-results/comprehensive_diagnostic_report.md"
echo "Starting cleanup of unimported files..."

# Extract file paths from the report, excluding known false positives
# This uses grep to find the lines with absolute paths, then sed to clean up the line numbers and whitespace
grep '/Users/Arief/Documents/GitHub/reconciliation-platform-378/' "$REPORT_FILE" | \
  sed -E 's/^[ 0-9]+ │ //g' | \
  grep -v -E "(eslint|playwright|postcss|vitest|tailwind)\.config\.(js|ts)" | \
  while IFS= read -r file_path; do
    if [ -f "$file_path" ]; then
      echo "Deleting: $file_path"
      rm "$file_path"
    else
      echo "Skipping (not found): $file_path"
    fi
  done

echo "Cleanup of unimported files complete."