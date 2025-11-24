# Testing Documentation

**Last Updated**: January 2025

## Quick Start

**New to testing?** Start here: [RUN_TESTS_GUIDE.md](./RUN_TESTS_GUIDE.md)

**Quick command:**
```bash
./scripts/run-tests-quick.sh all
```

## Documentation Index

### Getting Started
- **[RUN_TESTS_GUIDE.md](./RUN_TESTS_GUIDE.md)** ⭐ **START HERE** - Complete guide for running all types of tests
- **[TEST_UTILITIES_GUIDE.md](./TEST_UTILITIES_GUIDE.md)** - Test helper functions and utilities
- **[TEST_TEMPLATES_GUIDE.md](./TEST_TEMPLATES_GUIDE.md)** - Templates for writing tests

### Test Status & Planning
- **[TESTING_STATUS.md](./TESTING_STATUS.md)** - Current testing infrastructure status
- **[TEST_COVERAGE_PLAN.md](./TEST_COVERAGE_PLAN.md)** - Test coverage implementation plan
- **[COVERAGE_INTEGRATION.md](./COVERAGE_INTEGRATION.md)** - Coverage tool integration

### Advanced Testing
- **[ORCHESTRATION_TESTING_GUIDE.md](./ORCHESTRATION_TESTING_GUIDE.md)** - Complex test orchestration
- **[UAT_PLAN.md](./UAT_PLAN.md)** - User Acceptance Testing plan
- **[UAT_SUMMARY.md](./UAT_SUMMARY.md)** - UAT summary and framework

## Quick Commands

### Backend Tests
```bash
cd backend
cargo test                    # All tests
cargo test --lib              # Unit tests
./run_tests.sh                # Comprehensive script
```

### Frontend Tests
```bash
cd frontend
npm test                      # Run tests
npm run test:ui               # Interactive UI
npm run test:coverage        # With coverage
```

### E2E Tests
```bash
npm run test:e2e             # All E2E tests
npm run test:e2e:ui          # Playwright UI
npm run test:e2e:headed      # See browser
```

### All Tests
```bash
./scripts/test.sh            # Comprehensive
./scripts/run-tests-quick.sh  # Quick runner
```

## Test Structure

### Backend
- **Unit tests**: Co-located with source (`#[cfg(test)] mod tests`)
- **Integration tests**: `backend/tests/`
- **Test utilities**: `backend/src/test_utils.rs`

### Frontend
- **Unit/Component tests**: `frontend/src/__tests__/`
- **E2E tests**: `frontend/e2e/`
- **Test utilities**: `frontend/src/utils/testUtils.tsx`

## Test Coverage Targets

- **Backend**: 70% minimum (enforced in CI)
- **Frontend**: 60-80% for critical paths
- **Critical paths**: 100% (auth, data integrity)

## Related Documentation

- [E2E Testing Setup](../../frontend/e2e/README.md) - E2E test details
- [Testing Rules](../../.cursor/rules/testing.mdc) - Testing patterns and conventions

## Need Help?

1. Check [RUN_TESTS_GUIDE.md](./RUN_TESTS_GUIDE.md) for detailed instructions
2. Review [TESTING_STATUS.md](./TESTING_STATUS.md) for current status
3. See [TEST_UTILITIES_GUIDE.md](./TEST_UTILITIES_GUIDE.md) for helper functions





