#!/bin/bash

# Script to remove or replace console.log statements in production code
# Usage: ./scripts/remove-console-logs.sh [--dry-run] [--replace-with-logger]

set -e

DRY_RUN=false
REPLACE_WITH_LOGGER=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --replace-with-logger)
      REPLACE_WITH_LOGGER=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run] [--replace-with-logger]"
      exit 1
      ;;
  esac
done

FRONTEND_DIR="frontend/src"
LOG_COUNT=$(grep -r "console\." "$FRONTEND_DIR" --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')

echo "🔍 Found $LOG_COUNT console statements in $FRONTEND_DIR"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "📋 DRY RUN MODE - No changes will be made"
  echo ""
  echo "Console statements found:"
  grep -rn "console\." "$FRONTEND_DIR" --include="*.ts" --include="*.tsx" | head -20
  if [ "$LOG_COUNT" -gt 20 ]; then
    echo "... and $((LOG_COUNT - 20)) more"
  fi
  exit 0
fi

# Create logger service if it doesn't exist
if [ "$REPLACE_WITH_LOGGER" = true ]; then
  LOGGER_FILE="$FRONTEND_DIR/services/logger.ts"
  
  if [ ! -f "$LOGGER_FILE" ]; then
    echo "📝 Creating logger service..."
    cat > "$LOGGER_FILE" << 'EOF'
// Production-safe logger service with Sentry integration
import { reportMessage, addBreadcrumb, reportError } from '@/sentry.client.config'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    } else {
      // In production, send to error tracking service
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
      reportMessage(message, 'warning')
      addBreadcrumb(message, 'warning', 'warning')
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but format for production
    if (isDevelopment) {
      console.error(...args)
    } else {
      // In production, send to error tracking service
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
      
      // Create Error object if first arg is not already an Error
      const error = args[0] instanceof Error 
        ? args[0] 
        : new Error(message)
      
      reportError(error, {
        additionalArgs: args.slice(1),
        source: 'logger',
      })
      addBreadcrumb(message, 'error', 'error')
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    } else {
      // In production, add as breadcrumb for context
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
      addBreadcrumb(message, 'info', 'info')
    }
  }
}

export default logger
EOF
  fi

  echo "🔄 Replacing console statements with logger service..."
  
  # Find all TypeScript/TSX files
  find "$FRONTEND_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
    # Skip logger.ts itself
    if [[ "$file" == *"logger.ts" ]]; then
      continue
    fi
    
    # Replace console.log with logger.log
    if grep -q "console\." "$file"; then
      # Add logger import if not present
      if ! grep -q "import.*logger" "$file"; then
        # Add import at the top after other imports
        sed -i '' "1a\\
import { logger } from '../services/logger'\\
" "$file"
      fi
      
      # Replace console methods
      sed -i '' "s/console\.log/logger.log/g" "$file"
      sed -i '' "s/console\.warn/logger.warn/g" "$file"
      sed -i '' "s/console\.error/logger.error/g" "$file"
      sed -i '' "s/console\.debug/logger.debug/g" "$file"
      sed -i '' "s/console\.info/logger.info/g" "$file"
      
      echo "✅ Updated: $file"
    fi
  done
else
  echo "🗑️  Removing console statements..."
  
  # Find all TypeScript/TSX files
  find "$FRONTEND_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
    # Remove lines containing only console statements
    if grep -q "console\." "$file"; then
      # Remove console.log, console.debug, console.info lines
      sed -i '' '/^\s*console\.\(log\|debug\|info\)(/d' "$file"
      # Keep console.error and console.warn but comment them
      sed -i '' 's/^\s*console\.\(error\|warn\)/\/\/ console.\1/g' "$file"
      
      echo "✅ Cleaned: $file"
    fi
  done
fi

NEW_COUNT=$(grep -r "console\." "$FRONTEND_DIR" --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')

if [ "$REPLACE_WITH_LOGGER" = true ]; then
  echo ""
  echo "✅ Replacement complete!"
  echo "📊 Remaining console statements: $NEW_COUNT"
  echo "   (These should be logger.* calls now)"
else
  echo ""
  echo "✅ Cleanup complete!"
  echo "📊 Remaining console statements: $NEW_COUNT"
  echo "   (Only console.error/warn should remain, and they're commented)"
fi

