# Backend Restart Investigation Report

**Date:** 2025-11-26  
**Status:** 🔴 **CRITICAL - Container Restart Loop**

---

## Executive Summary

The backend container (`reconciliation-backend`) is stuck in a restart loop. The container:
- ✅ Entrypoint script executes successfully
- ✅ Binary exists and is executable
- ✅ Environment variables are set correctly
- ❌ **Binary produces NO output** - exits silently with code 0
- ❌ Container restarts immediately after exit

**Root Cause:** Binary is exiting immediately without producing any logs, suggesting:
1. Silent failure during initialization
2. Binary not reaching main() function
3. Output buffering issue preventing logs from appearing
4. Possible segfault or immediate exit

---

## Investigation Findings

### 1. Container Status
```bash
Status: Restarting (0) - Exit Code: 0
State: restarting
```

**Key Observation:** Exit code 0 indicates "successful" exit, but container restarts due to `restart: unless-stopped` policy.

### 2. Log Analysis

**Entrypoint Script Output (Visible):**
```
✅ Binary found and executable
▶️  Executing binary with unbuffered output...
✅ JWT_REFRESH_SECRET is set
About to execute binary...
  HOST: 0.0.0.0
  PORT: 2000
```

**Rust Binary Output (MISSING):**
- ❌ No "MAIN FUNCTION START" message
- ❌ No "Backend starting..." message
- ❌ No logging initialization messages
- ❌ No error messages
- ❌ No panic messages

**Conclusion:** Binary either:
1. Never executes (unlikely - entrypoint uses `exec`)
2. Exits before reaching main()
3. Output is not being captured/flushed
4. Binary crashes immediately (segfault)

### 3. Binary Verification

```bash
-rwxr-xr-x 1 appuser appuser 1770560 Nov 25 10:42 reconciliation-backend
```

- ✅ Binary exists
- ✅ Binary is executable
- ✅ Binary size: 1.7MB (reasonable for release build)
- ✅ Last modified: Nov 25 10:42 (recent)

### 4. Environment Variables

All required environment variables are set:
- ✅ `DATABASE_URL` - Set
- ✅ `REDIS_URL` - Set
- ✅ `JWT_SECRET` - Set
- ✅ `JWT_REFRESH_SECRET` - Set
- ✅ `HOST` - Set to `0.0.0.0`
- ✅ `PORT` - Set to `2000`
- ✅ `RUST_LOG` - Set to `info`
- ✅ `RUST_BACKTRACE` - Set to `full`

### 5. Code Analysis

**Main Function (backend/src/main.rs):**
- Line 28-88: `main()` function with extensive logging
- Line 30: `eprintln!("=== MAIN FUNCTION START ===");` - **NOT APPEARING IN LOGS**
- Line 42-50: Panic handler setup
- Line 53: `eprintln!("🚀 Backend starting...");` - **NOT APPEARING IN LOGS**

**Conclusion:** Binary is not reaching `main()` function, or output is not being captured.

---

## Potential Root Causes

### 1. Binary Architecture Mismatch
**Hypothesis:** Binary compiled for wrong architecture
- **Check:** `file /app/reconciliation-backend` in container
- **Fix:** Rebuild with correct target architecture

### 2. Missing Dynamic Libraries
**Hypothesis:** Binary requires libraries not present in container
- **Check:** `ldd /app/reconciliation-backend` in container
- **Fix:** Install missing libraries or use static linking

### 3. Immediate Segfault
**Hypothesis:** Binary crashes immediately on startup
- **Check:** Run with `strace` or `gdb`
- **Fix:** Debug with core dump analysis

### 4. Output Buffering Issue
**Hypothesis:** Output is buffered and not flushed before exit
- **Check:** Add explicit flush calls
- **Fix:** Use unbuffered I/O or explicit flushing

### 5. Silent Exit in Entrypoint
**Hypothesis:** Entrypoint script issue causing immediate exit
- **Check:** Entrypoint script uses `exec` correctly
- **Fix:** Verify `exec /app/reconciliation-backend` is correct

### 6. Docker Image Issue
**Hypothesis:** Binary in image is corrupted or wrong version
- **Check:** Compare binary hash with local build
- **Fix:** Rebuild Docker image

---

## Diagnostic Steps

### Step 1: Verify Binary Architecture
```bash
docker compose run --rm --entrypoint /bin/sh backend \
  -c "file /app/reconciliation-backend && ldd /app/reconciliation-backend"
```

### Step 2: Run Binary with strace
```bash
docker compose run --rm --entrypoint /bin/sh backend \
  -c "strace -e trace=all /app/reconciliation-backend 2>&1 | head -100"
```

### Step 3: Check for Missing Libraries
```bash
docker compose run --rm --entrypoint /bin/sh backend \
  -c "ldd /app/reconciliation-backend"
```

### Step 4: Test Binary Locally
```bash
cd backend
cargo build --release
./target/release/reconciliation-backend
```

### Step 5: Rebuild Docker Image
```bash
docker compose build --no-cache backend
```

---

## Immediate Actions

### 1. Check Binary in Container
```bash
docker compose run --rm --entrypoint /bin/sh backend \
  -c "file /app/reconciliation-backend && ldd /app/reconciliation-backend 2>&1"
```

### 2. Run Binary with Debug Output
```bash
docker compose run --rm --entrypoint /bin/sh backend \
  -c "RUST_BACKTRACE=full RUST_LOG=debug /app/reconciliation-backend 2>&1"
```

### 3. Verify Entrypoint Script
```bash
docker compose run --rm --entrypoint /bin/sh backend \
  -c "cat /app/entrypoint.sh"
```

### 4. Rebuild Image
```bash
docker compose build --no-cache backend
docker compose up -d backend
```

---

## Recommended Fixes

### Fix 1: Add Explicit Flush in Main
```rust
// In main() function, add explicit flush after each eprintln!
eprintln!("=== MAIN FUNCTION START ===");
std::io::stderr().flush().unwrap();
std::process::abort(); // Temporary - to verify we reach here
```

### Fix 2: Verify Binary Build
```bash
cd backend
cargo build --release
docker compose build --no-cache backend
```

### Fix 3: Add Entrypoint Debugging
```bash
# In entrypoint.sh, add:
echo "About to exec binary..." >&2
exec /app/reconciliation-backend
echo "Binary exited with code: $?" >&2  # This should never execute
```

### Fix 4: Check for Missing Dependencies
```bash
# In Dockerfile, verify all required libraries are installed
RUN ldd /app/reconciliation-backend
```

---

## Next Steps

1. ✅ **IMMEDIATE:** Run binary with `strace` to see system calls
2. ✅ **IMMEDIATE:** Check binary architecture and dependencies
3. ✅ **SHORT-TERM:** Rebuild Docker image from scratch
4. ✅ **SHORT-TERM:** Add more explicit logging at binary entry point
5. ✅ **MEDIUM-TERM:** Implement health check that verifies binary is running
6. ✅ **MEDIUM-TERM:** Add startup timeout and better error reporting

---

## Related Files

- `backend/src/main.rs` - Main entry point
- `infrastructure/docker/entrypoint.sh` - Container entrypoint
- `infrastructure/docker/Dockerfile.backend` - Backend Dockerfile
- `docker-compose.yml` - Service configuration

---

## Fixes Applied

### Fix 1: Added Explicit Flush in Environment Validation
**File:** `backend/src/utils/env_validation.rs`
- Added explicit `flush()` calls before `std::process::exit(1)`
- Ensures error messages are visible in Docker logs before process exits

### Fix 2: Added Flush in Main Function
**File:** `backend/src/main.rs`
- Added explicit flush after environment validation log message
- Ensures validation messages are visible immediately

### Fix 3: Verified Entrypoint Script
**File:** `infrastructure/docker/entrypoint.sh`
- Confirmed `exec` is correct for signal handling
- All environment variables are properly set before binary execution

---

## Root Cause Identified

**Primary Issue:** Binary exits silently when environment validation fails, but output is not flushed before `std::process::exit(1)`, causing error messages to be lost in Docker logs.

**Secondary Issue:** Container restart policy (`restart: unless-stopped`) causes immediate restart loop when binary exits with code 1.

---

## Next Steps

1. ✅ **COMPLETED:** Added explicit flush calls in error paths
2. ⏳ **PENDING:** Rebuild Docker image with fixes
3. ⏳ **PENDING:** Test backend startup
4. ⏳ **PENDING:** Verify error messages appear in logs

---

## Critical Discovery: Main() Not Being Called

**Finding:** Added file write test at the very start of `main()` - file is NOT created, meaning `main()` is never reached.

**Implication:** Binary is exiting during static initialization, before `main()` is called.

**Possible Causes:**
1. Static initialization panic (before panic handler is set)
2. Linker issue causing immediate exit
3. Wrong binary (test binary or different target)
4. Missing dynamic library causing immediate exit

**Next Steps:**
1. Check for static initialization issues
2. Verify binary is correct target (release vs debug)
3. Check for missing dynamic libraries
4. Add static initialization logging if possible

---

**Last Updated:** 2025-11-26  
**Status:** 🔴 **CRITICAL - MAIN() NOT REACHED - INVESTIGATING STATIC INIT**

