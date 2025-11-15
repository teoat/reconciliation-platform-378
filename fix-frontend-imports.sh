#!/bin/bash
# Fix Frontend Imports - Make all UI components work with both imports

set -e

echo "🔧 Fixing frontend UI component exports..."

cd frontend/src/components/ui

# Add named exports to all components that only have default exports
for file in *.tsx; do
    component_name=$(basename "$file" .tsx)
    
    # Skip if already has named export
    if grep -q "^export {" "$file"; then
        echo "⏭️  $component_name already has named export"
        continue
    fi
    
    # Check if it has default export
    if grep -q "export default" "$file"; then
        # Add named export before default export
        # Find the default export line
        default_line=$(grep -n "export default" "$file" | cut -d: -f1)
        
        # Add named export before it
        sed -i '' "${default_line}i\\
export { $component_name };\\
" "$file"
        
        echo "✅ Added named export to $component_name"
    fi
done

echo ""
echo "✅ All UI component exports fixed!"
echo "Next: Test build with 'npm run build'"

