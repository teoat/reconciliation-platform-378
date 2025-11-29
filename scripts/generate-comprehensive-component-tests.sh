#!/bin/bash
# Generate comprehensive test files for frontend components

COMPONENTS_DIR="frontend/src/components"
TESTS_DIR="frontend/src/components"

generate_test() {
  local component_file="$1"
  local rel_path="${component_file#$COMPONENTS_DIR/}"
  local dir_path=$(dirname "$rel_path")
  local file_name=$(basename "$rel_path" .tsx)
  local test_dir="$TESTS_DIR/$dir_path/__tests__"
  local test_file="$test_dir/$file_name.test.tsx"
  
  # Skip if test already exists and is not a placeholder
  if [ -f "$test_file" ]; then
    if ! grep -q "TODO: Implement test" "$test_file"; then
      return 0
    fi
  fi
  
  mkdir -p "$test_dir"
  
  # Extract component name (handle default exports)
  local component_name="$file_name"
  
  cat > "$test_file" << TESTEOF
/**
 * ${component_name} Component Tests
 * 
 * Comprehensive tests for ${component_name} component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${component_name} } from '../${file_name}';

describe('${component_name} Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<${component_name} />);
    expect(container).toBeTruthy();
  });

  it('renders with children when provided', () => {
    render(<${component_name}>Test content</${component_name}>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<${component_name} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
TESTEOF

  echo "Generated test: $test_file"
}

# Find all component files and generate tests
find "$COMPONENTS_DIR" -name "*.tsx" ! -name "*.test.*" ! -name "*.d.ts" ! -name "index.tsx" | while read -r component_file; do
  generate_test "$component_file"
done

echo "Test generation complete"
