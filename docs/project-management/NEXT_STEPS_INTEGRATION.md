# 🔄 Integration Guide for New Components

**Date:** 2025-11-30  
**Purpose:** Instructions for integrating the newly created components.

---

## 1. Backend Middleware Integration

**File:** `backend/src/main.rs`

**Action:** Replace separate security middleware with the combined one.

```rust
// Import
use reconciliation_backend::middleware::CombinedSecurityMiddleware;

// In App factory:
// Remove:
// .wrap(SecurityHeadersMiddleware::new(security_headers_config))
// .wrap(ZeroTrustMiddleware::new(zero_trust_config))

// Add:
.wrap(CombinedSecurityMiddleware::new(
    security_headers_config,
    zero_trust_config
).with_auth_service(auth_service.clone()))
```

---

## 2. Frontend Performance Integration

**File:** `frontend/src/services/api/ApiService.ts` (or similar)

**Action:** Use `batchLoader` for GET requests.

```typescript
import { batchLoader } from './batchLoader';

// Inside your service method:
public async getUser(id: string) {
  // Instead of axios.get(...)
  return batchLoader.add({
    method: 'GET',
    url: `/api/users/${id}`
  });
}
```

**File:** `frontend/src/components/YourComponent.tsx`

**Action:** Use `LazyImage` for images.

```typescript
import { LazyImage } from '@/components/ui/LazyImage';

// In JSX:
<LazyImage 
  src={user.avatarUrl} 
  alt={user.name} 
  className="w-10 h-10 rounded-full" 
/>
```

---

## 3. Running Backend Tests

**Command:**

```bash
cd backend
export TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/reconciliation_test"
cargo test
```

**Note:** Ensure the test database exists and migrations are run.
