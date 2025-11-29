# Backend Stack Overflow Diagnosis & Fix

**Issue:** The backend crashes with "thread 'actix-server worker 0' has overflowed its stack"

## Root Causes Identified

### 1. **Excessive Middleware Chain** (Primary Cause)

The application has **8 middleware layers**:

1. CorrelationIdMiddleware
2. ErrorHandlerMiddleware
3. CORS
4. Compress
5. SecurityHeadersMiddleware
6. AuthRateLimitMiddleware
7. PerEndpointRateLimitMiddleware
8. ZeroTrustMiddleware
9. ApiVersioningMiddleware

**Impact:** Each middleware adds stack frames during request processing, leading to stack overflow especially with recursive or nested calls.

### 2. **Single Worker Configuration**

```rust
.workers(1);  // Reduce workers to 1 to minimize stack usage
```

While this was intended to help, it actually makes the problem worse by putting all load on one thread.

### 3. **Default Stack Size**

Rust's default stack size is typically 2MB, which isn't sufficient for deep middleware chains.

## Solutions (In Order of Priority)

### Solution 1: Increase Stack Size (Quick Fix) ✅

Add this to `backend/.cargo/config.toml`:

```toml
[build]
rustflags = ["-C", "link-args=-Wl,-stack_size,8000000"]  # 8MB stack on macOS
```

Or set environment variable:

```bash
RUST_MIN_STACK=8388608 cargo run  # 8MB in bytes
```

### Solution 2: Optimize Middleware Chain (Recommended)

**Combine similar middleware:**

- Merge AuthRateLimitMiddleware and PerEndpointRateLimitMiddleware into one
- Combine SecurityHeadersMiddleware and ZeroTrustMiddleware

**Remove redundant middleware:**

- ApiVersioningMiddleware (can be handled in routes)
- ErrorHandlerMiddleware (Actix-web has built-in error handling)

**Target:** Reduce from 9 middleware to 4-5.

### Solution 3: Increase Workers (Performance)

Change from `.workers(1)` to `.workers(2)` or `.workers(num_cpus::get())`
This distributes load and reduces per-thread pressure.

### Solution 4: Async Optimization

Check for synchronous blocking calls in middleware that should be async.

## Implementation Plan

### Step 1: Immediate Fix (5 minutes)

```bash
# Run with increased stack size
cd backend
RUST_MIN_STACK=16777216 JWT_SECRET="dev-secret" JWT_REFRESH_SECRET="dev-refresh" DATABASE_URL="postgresql://postgres@localhost/reconciliation" cargo run
```

### Step 2: Medium-term Fix (30 minutes)

1. Create `.cargo/config.toml` with stack size configuration
2. Increase workers to 2
3. Profile middleware to find recursive calls

### Step 3: Long-term Fix (2-4 hours)

1. Refactor middleware chain - combine similar ones
2. Move some middleware to route-level guards
3. Implement middleware profiling to track stack usage

## Testing the Fix

After implementing, verify with:

```bash
# Start backend
cd backend && cargo run

# In another terminal, hit the API
curl http://localhost:2000/api/health

# Monitor for stack overflow
tail -f backend output
```

## Expected Results

| Metric | Before | After Fix 1 | After Fix 2 |
|--------|--------|-------------|-------------|
| Stack Size | 2MB | 16MB | 16MB |
| Middleware Count | 9 | 9 | 5 |
| Workers | 1 | 1 | 2 |
| Crash Rate | 100% | 0% | 0% |
| Performance | N/A | Good | Better |

## Additional Notes

- The stack overflow occurs immediately after the first request
- Zero Trust middleware likely has the deepest call stack
- Consider lazy-loading some middleware based on route patterns

## Quick Command Reference

```bash
# Check current stack limit (macOS)
ulimit -s

# Run with custom stack size
RUST_MIN_STACK=16777216 cargo run

# Profile stack usage (requires valgrind on Linux)
valgrind --tool=massif ./target/debug/reconciliation-backend

# Monitor memory usage
top -pid $(pgrep reconciliation)
```
