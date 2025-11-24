#!/bin/bash
# Playwright Test Generator
# Generates E2E test files for features

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

TEST_NAME="${1:-}"
TEST_TYPE="${2:-feature}"

if [ -z "$TEST_NAME" ]; then
    echo "Usage: $0 <TestName> [feature|auth|navigation]"
    echo "Example: $0 ProjectCreation feature"
    echo "Example: $0 LoginFlow auth"
    exit 1
fi

E2E_DIR="e2e/tests"
mkdir -p "$E2E_DIR"

TEST_FILE="$E2E_DIR/${TEST_NAME}.spec.ts"

if [ -f "$TEST_FILE" ]; then
    log_warning "Test file already exists: $TEST_FILE"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

case "$TEST_TYPE" in
    auth)
        generate_auth_test "$TEST_NAME" "$TEST_FILE"
        ;;
    navigation)
        generate_navigation_test "$TEST_NAME" "$TEST_FILE"
        ;;
    feature|*)
        generate_feature_test "$TEST_NAME" "$TEST_FILE"
        ;;
esac

log_success "Playwright test created: $TEST_FILE"
echo ""
echo "Next steps:"
echo "1. Update test scenarios for your feature"
echo "2. Run: npx playwright test $TEST_FILE"

generate_feature_test() {
    local name=$1
    local file=$2
    
    cat > "$file" << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('FEATURE_NAME', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to feature page
    await page.goto('/feature-path');
  });

  test('should display feature correctly', async ({ page }) => {
    // Verify feature is visible
    await expect(page.locator('[data-testid="feature"]')).toBeVisible();
  });

  test('should handle user interaction', async ({ page }) => {
    // Test user interaction
    await page.click('[data-testid="action-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling
    // Simulate error condition
    await expect(page.locator('[data-testid="error"]')).toBeVisible();
  });
});
EOF
    sed -i '' "s/FEATURE_NAME/$name/g" "$file"
}

generate_auth_test() {
    local name=$1
    local file=$2
    
    cat > "$file" << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('AUTH_TEST_NAME', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrong');
    await page.click('[type="submit"]');
    
    await expect(page.locator('[role="alert"]')).toContainText('Invalid');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    
    // Logout
    await page.click('[data-testid="logout"]');
    await expect(page).toHaveURL(/.*login/);
  });
});
EOF
    sed -i '' "s/AUTH_TEST_NAME/$name/g" "$file"
}

generate_navigation_test() {
    local name=$1
    local file=$2
    
    cat > "$file" << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('NAVIGATION_TEST_NAME', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
  });

  test('should navigate to all main pages', async ({ page }) => {
    const pages = [
      { name: 'Dashboard', path: '/' },
      { name: 'Projects', path: '/projects' },
      { name: 'Analytics', path: '/analytics' },
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page).toHaveURL(new RegExp(pageInfo.path));
    }
  });

  test('should have working breadcrumbs', async ({ page }) => {
    await page.goto('/projects/123');
    await page.click('[aria-label="Breadcrumb"]');
    await expect(page).toHaveURL(/.*projects/);
  });
});
EOF
    sed -i '' "s/NAVIGATION_TEST_NAME/$name/g" "$file"
}

