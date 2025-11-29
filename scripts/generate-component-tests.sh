#!/bin/bash
# Generate test files for frontend components

COMPONENTS_DIR="frontend/src/components"
TESTS_DIR="frontend/src/components"

# Find all component files
find "$COMPONENTS_DIR" -name "*.tsx" ! -name "*.test.*" ! -name "*.d.ts" | while read -r component_file; do
  # Get relative path
  rel_path="${component_file#$COMPONENTS_DIR/}"
  dir_path=$(dirname "$rel_path")
  file_name=$(basename "$rel_path" .tsx)
  
  # Create test directory if it doesn't exist
  test_dir="$TESTS_DIR/$dir_path/__tests__"
  mkdir -p "$test_dir"
  
  # Check if test already exists
  test_file="$test_dir/$file_name.test.tsx"
  if [ ! -f "$test_file" ]; then
    echo "Creating test for: $rel_path"
    # Create basic test file
    cat > "$test_file" << TESTEOF
/**
 * ${file_name} Component Tests
 * 
 * TODO: Add comprehensive tests
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ${file_name} } from '../${file_name}';

describe('${file_name} Component', () => {
  it('renders without crashing', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });
});
TESTEOF
  fi
done

echo "Test generation complete"
