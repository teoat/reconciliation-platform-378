#!/bin/bash
# Fix useToast references in useReconciliationStreak

cd frontend/src/hooks

# Remove the console.log fallback and use the real hook
sed -i '' '/const showToast = (obj: any)/d' useReconciliationStreak.ts
sed -i '' '/console\.log.*variant.*title/d' useReconciliationStreak.ts

echo "✅ Fixed useToast references"

