#!/bin/bash
# Check for overlapping exports in frontend codebase

set -e

FRONTEND_DIR="frontend"
cd "$FRONTEND_DIR" || exit 1

echo "🔍 Checking for overlapping exports..."

# Find all export statements
echo "📝 Scanning export statements..."
EXPORT_MAP=$(mktemp)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -H "^export \(const\|function\|interface\|type\|class\|enum\)" {} \; | \
  sed 's/.*:export \(const\|function\|interface\|type\|class\|enum\) \([a-zA-Z0-9_]*\).*/\2:\1/' | \
  sort > "$EXPORT_MAP"

# Find duplicates
echo "🔎 Finding duplicate exports..."
DUPLICATES=$(mktemp)
cut -d: -f1 "$EXPORT_MAP" | sort | uniq -d > "$DUPLICATES"

if [ -s "$DUPLICATES" ]; then
  echo "⚠️  Found duplicate exports:"
  while read -r name; do
    echo ""
    echo "  $name:"
    grep "^$name:" "$EXPORT_MAP" | while IFS=: read -r export_name export_type; do
      file=$(grep -l "export $export_type $name" src -r | head -1)
      echo "    - $export_type in $file"
    done
  done < "$DUPLICATES"
  echo ""
  echo "❌ Overlapping exports found!"
  rm -f "$EXPORT_MAP" "$DUPLICATES"
  exit 1
else
  echo "✅ No duplicate exports found"
  rm -f "$EXPORT_MAP" "$DUPLICATES"
  exit 0
fi

