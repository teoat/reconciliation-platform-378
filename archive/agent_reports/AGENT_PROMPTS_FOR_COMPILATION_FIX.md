# Agent Prompts for Compilation Error Fixing

---

## 🤖 AGENT A PROMPT

```
You are Agent A working on compilation error fixes.

YOUR MISSION: Fix 26 handler-related compilation errors

FILES TO FIX:
- backend/tests/api_endpoint_tests.rs
- backend/tests/e2e_tests.rs
- backend/tests/integration_tests.rs

ERRORS IN: src/handlers.rs (26 errors)

TASKS:
1. Run: cargo test --lib --no-run to see errors
2. Focus on handler test files
3. Fix API signature mismatches
4. Update test code to match handler APIs
5. Verify compilation

ESTIMATED TIME: 2 hours
BRANCH: agent-a/compile-fixes

Read: COMPILATION_ERROR_FIX_PLAN.md for full details
Start with: cargo test --lib --no-run 2>&1 | grep "handlers.rs"
```

---

## 🤖 AGENT B PROMPT

```
You are Agent B working on compilation error fixes.

YOUR MISSION: Fix 24 service-related compilation errors

FILES TO FIX:
- backend/tests/unit_tests.rs
- backend/tests/integration_tests.rs
- backend/tests/s_tier_tests.rs

ERRORS IN:
- src/services/reconciliation.rs (13 errors)
- src/services/auth.rs (9 errors)
- src/services/file.rs (3 errors)

TASKS:
1. Run: cargo test --lib --no-run to see errors
2. Focus on service test files
3. Fix method signature mismatches
4. Update async/await patterns
5. Verify compilation

ESTIMATED TIME: 2 hours
BRANCH: agent-b/compile-fixes

Read: COMPILATION_ERROR_FIX_PLAN.md for full details
Start with: cargo test --lib --no-run 2>&1 | grep "services/"
```

---

## 🤖 AGENT C PROMPT

```
You are Agent C working on compilation error fixes.

YOUR MISSION: Fix 4 user/project service compilation errors

FILES TO FIX:
- backend/tests/unit_tests.rs
- backend/tests/integration_tests.rs

ERRORS IN:
- src/services/user.rs (2 errors)
- src/services/project.rs (2 errors)

TASKS:
1. Run: cargo test --lib --no-run to see errors
2. Focus on user/project tests
3. Fix service calls
4. Verify compilation

ESTIMATED TIME: 1 hour
BRANCH: agent-c/compile-fixes

Read: COMPILATION_ERROR_FIX_PLAN.md for full details
Start with: cargo test --lib --no-run 2>&1 | grep -E "user|project"
```

---

## 🔄 COORDINATION

All agents should:
1. Work on separate branches
2. Push progress frequently
3. Update COMPILATION_ERROR_FIX_PLAN.md
4. Communicate blockers
5. Merge when complete

---

## 🎯 COMMON COMMANDS

```bash
# See your errors
cargo test --lib --no-run 2>&1 | grep "YOUR_FILES"

# Build specific tests
cargo test --lib --no-run --test YOUR_TEST

# Run your tests
cargo test YOUR_TEST_NAME

# Check compilation
cargo build --lib
```

---

**Total Errors**: 55  
**Division**: A=26, B=24, C=4  
**Target**: Fix all in 5 hours total

