# Backend Panic Diagnostic Report

**Date:** 2025-11-25  
**Status:** 🔴 **ROOT CAUSE IDENTIFIED**

---

## Executive Summary

The backend is crashing with a `spawn_local` panic immediately after initializing default passwords and before starting the WebSocket server. The root cause is **Actix Actor's `.start()` method being called outside of an Actix runtime context**.

---

## Panic Details

### Error Message
```
PANIC: `spawn_local` called from outside of a `task::LocalSet` or `runtime::LocalRuntime`
Location: /usr/local/cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tokio-1.48.0/src/task/local.rs:431
```

### Timing
- ✅ Default passwords initialized successfully
- ❌ **PANIC occurs here** → WebSocket server initialization
- ❌ Server never starts

### Code Location
```rust
// backend/src/main.rs:324
let ws_server = WsServer::new(Arc::new(database.clone())).start();
```

---

## Root Cause Analysis

### Problem

1. **Actix Actor Runtime Requirement**
   - Actix Actor's `.start()` method internally uses `spawn_local`
   - `spawn_local` requires a `LocalSet` or `LocalRuntime` context
   - We're calling `.start()` in `async_main()` which runs on a standard Tokio runtime

2. **Runtime Context Mismatch**
   - Main function creates: `tokio::runtime::Runtime::new()` (standard runtime)
   - Actix Actor needs: Actix runtime with LocalSet
   - HttpServer creates its own Actix runtime, but we're starting the actor before HttpServer runs

3. **Execution Flow**
   ```
   main() 
   → tokio::runtime::Runtime::new() [Standard Tokio Runtime]
   → rt.block_on(async_main())
   → ... initialization ...
   → ws_server.start() [❌ PANIC - needs Actix LocalSet]
   → HttpServer::new() [Has Actix runtime, but too late]
   ```

---

## Investigation Findings

### 1. Disabled Scheduler (Not the Issue)
- ✅ Secret manager rotation scheduler is disabled
- ❌ Panic still occurs
- **Conclusion:** Scheduler was not the cause

### 2. WebSocket Actor Start (Root Cause)
- ❌ `WsServer::new(...).start()` called at line 324
- ❌ Called before HttpServer creates Actix runtime
- **Conclusion:** This is the root cause

### 3. Actix Actor System
- Actix actors require a `LocalSet` context
- `LocalSet` is created by Actix runtime
- HttpServer creates Actix runtime, but actor is started before HttpServer runs

### 4. Other Potential Issues
- ✅ Database connections use `spawn_blocking` (correct)
- ✅ Other `tokio::spawn` calls are fine (they use standard spawn)
- ❌ Only Actor `.start()` uses `spawn_local`

---

## Proposed Fixes

### Fix Option 1: Start Actor After HttpServer (Recommended)

**Approach:** Move actor start to HttpServer closure or after server starts

**Implementation:**
```rust
// Remove from async_main():
// let ws_server = WsServer::new(Arc::new(database.clone())).start();

// Add to HttpServer::new() closure:
let server = HttpServer::new(move || {
    // Start actor here (within Actix runtime context)
    let ws_server = WsServer::new(Arc::new(database.clone())).start();
    
    App::new()
        .app_data(web::Data::new(ws_server))
        // ... rest of configuration
})
```

**Pros:**
- ✅ Actor starts in correct runtime context
- ✅ Minimal code changes
- ✅ Follows Actix best practices

**Cons:**
- ⚠️ Actor started per worker (if multiple workers)
- ⚠️ Need to ensure actor is shared correctly

---

### Fix Option 2: Use Actix Arbiter

**Approach:** Start actor using Actix's Arbiter system

**Implementation:**
```rust
use actix::Arbiter;

// In async_main(), before HttpServer:
let arbiter = Arbiter::new();
let ws_server = arbiter.spawn(async {
    WsServer::new(Arc::new(database.clone())).start()
}).await?;
```

**Pros:**
- ✅ Proper Actix runtime context
- ✅ Actor runs in dedicated arbiter

**Cons:**
- ⚠️ More complex
- ⚠️ Need to manage arbiter lifecycle

---

### Fix Option 3: Lazy Actor Initialization

**Approach:** Start actor only when first WebSocket connection is made

**Implementation:**
```rust
// Store actor address as Option<Addr<WsServer>>
// Initialize on first WebSocket connection
```

**Pros:**
- ✅ No startup panic
- ✅ Actor only created when needed

**Cons:**
- ⚠️ More complex state management
- ⚠️ Need synchronization for first connection

---

### Fix Option 4: Disable WebSocket Temporarily

**Approach:** Comment out WebSocket server initialization

**Implementation:**
```rust
// Temporarily disable WebSocket
// let ws_server = WsServer::new(Arc::new(database.clone())).start();
let ws_server = None; // Placeholder
```

**Pros:**
- ✅ Immediate fix
- ✅ Backend can start

**Cons:**
- ❌ WebSocket functionality disabled
- ❌ Not a permanent solution

---

## Recommended Fix: Option 1 (Start in HttpServer Closure)

### Implementation Steps

1. **Remove actor start from async_main()**
   ```rust
   // Remove this line:
   // let ws_server = WsServer::new(Arc::new(database.clone())).start();
   ```

2. **Add actor start in HttpServer closure**
   ```rust
   let server = HttpServer::new(move || {
       // Start actor within Actix runtime context
       let ws_server = WsServer::new(Arc::new(database.clone())).start();
       
       App::new()
           .app_data(web::Data::new(ws_server.clone()))
           // ... rest of app configuration
   })
   ```

3. **Handle worker count**
   - If using multiple workers, each worker will have its own actor
   - Consider using a shared actor via external service or singleton pattern

---

## Testing Plan

1. **Apply Fix**
   - Implement Option 1
   - Rebuild backend
   - Restart Docker container

2. **Verify Startup**
   - ✅ No panic on startup
   - ✅ Backend logs show "WebSocket server initialized"
   - ✅ Health endpoint responds

3. **Test WebSocket**
   - ✅ WebSocket connections work
   - ✅ Messages broadcast correctly
   - ✅ Multiple connections handled

4. **Load Testing**
   - ✅ Multiple concurrent connections
   - ✅ Actor handles load correctly

---

## Additional Observations

### Database Connection Issue
After panic, there's also:
```
ERROR r2d2] connection to server at "postgres" (172.18.0.3), port 5432 failed: 
could not calculate client proof: OpenSSL failure
```

This is likely a secondary issue (connection attempt during panic cleanup) and should resolve once panic is fixed.

### Migration Warning
```
Migration error: relation "reconciliation_records" does not exist
```

This is expected and non-fatal - migrations continue successfully.

---

## Summary

**Root Cause:** Actix Actor `.start()` called outside Actix runtime context

**Fix:** Move actor initialization to HttpServer closure (within Actix runtime)

**Priority:** 🔴 **CRITICAL** - Blocks all backend functionality

**Estimated Fix Time:** 15-30 minutes

---

**Last Updated:** 2025-11-25  
**Status:** Ready for Implementation


