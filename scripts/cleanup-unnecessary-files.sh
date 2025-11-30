#!/bin/bash

# This script removes unnecessary files and directories based on the diagnostic report.

REPORT_FILE="diagnostic-results/unnecessary-files-report.txt"
echo "Starting cleanup of unnecessary files and directories..."

# Delete empty directories
echo "Deleting empty directories..."
grep -E '^\./' "$REPORT_FILE" | sed 's/### Empty Directories ###//' | sed 's/### Archived Files ###//' | sed 's/### Old Documentation (older than 365 days) ###//' | while IFS= read -r dir_path; do
  if [ -d "$dir_path" ] && [ -z "$(ls -A "$dir_path")" ]; then
    echo "Deleting empty directory: $dir_path"
    rmdir "$dir_path"
  fi
done

# Delete archived files
echo "Deleting archived files..."
grep -E '^\./' "$REPORT_FILE" | sed 's/### Empty Directories ###//' | sed 's/### Archived Files ###//' | sed 's/### Old Documentation (older than 365 days) ###//' | while IFS= read -r file_path; do
  if [[ "$file_path" == *"archive"* ]] && [ -f "$file_path" ]; then
    echo "Deleting archived file: $file_path"
    rm "$file_path"
  fi
done

echo "Cleanup of unnecessary files and directories complete."