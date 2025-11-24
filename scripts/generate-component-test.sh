#!/bin/bash
# Component Test Generator
# Generates test files for React components based on templates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

COMPONENT_NAME="${1:-}"
COMPONENT_PATH="${2:-}"

if [ -z "$COMPONENT_NAME" ]; then
    echo "Usage: $0 <ComponentName> [component/path]"
    echo "Example: $0 UserProfile components/user"
    exit 1
fi

FRONTEND_DIR="frontend"
TEMPLATE_FILE="$FRONTEND_DIR/src/__tests__/example-component.test.tsx"
TEST_DIR="$FRONTEND_DIR/src/__tests__"

if [ -n "$COMPONENT_PATH" ]; then
    TEST_DIR="$FRONTEND_DIR/src/$COMPONENT_PATH/__tests__"
fi

# Create test directory if it doesn't exist
mkdir -p "$TEST_DIR"

TEST_FILE="$TEST_DIR/${COMPONENT_NAME}.test.tsx"

if [ -f "$TEST_FILE" ]; then
    log_warning "Test file already exists: $TEST_FILE"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Determine import path
if [ -n "$COMPONENT_PATH" ]; then
    IMPORT_PATH="@/$COMPONENT_PATH/$COMPONENT_NAME"
else
    IMPORT_PATH="@/components/$COMPONENT_NAME"
fi

# Generate test file from template
cat > "$TEST_FILE" << EOF
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { $COMPONENT_NAME } from '$IMPORT_PATH';
import { createTestStore } from '@/utils/testUtils';

describe('$COMPONENT_NAME', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  it('should render correctly', () => {
    renderWithProviders(<$COMPONENT_NAME />);
    // Add assertions based on component structure
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    renderWithProviders(<$COMPONENT_NAME />);
    // Add interaction tests
  });

  it('should handle errors gracefully', () => {
    renderWithProviders(<$COMPONENT_NAME />);
    // Add error handling tests
  });

  it('should be accessible', () => {
    renderWithProviders(<$COMPONENT_NAME />);
    // Add accessibility tests
  });
});
EOF

log_success "Test file created: $TEST_FILE"
echo ""
echo "Next steps:"
echo "1. Update imports and component props"
echo "2. Add specific test cases for your component"
echo "3. Run: npm run test $TEST_FILE"

