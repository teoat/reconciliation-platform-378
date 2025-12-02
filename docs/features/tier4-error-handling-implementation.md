# Tier 4 Error Handling Implementation Plan

## Current State
The `Tier4ErrorHandler` class and helper utilities (`withTier4ErrorHandling`) are implemented in `frontend/src/services/tier4ErrorHandler.ts` and `frontend/src/utils/tier4Helpers.tsx`. However, they are effectively dormant because the primary vector for errors—the `apiClient`—is missing.

## Implementation Strategy

### 1. Restore `apiClient` with Tier 4 Integration
The new `apiClient.ts` must be built to wrap all requests with `withTier4ErrorHandling`.

```typescript
// Proposed structure for frontend/src/services/apiClient.ts
import axios from 'axios';
import { withTier4ErrorHandling } from '@/utils/tier4Helpers';
import { APP_CONFIG } from '@/config/AppConfig';

const axiosInstance = axios.create({ baseURL: APP_CONFIG.API_URL });

// Wrap core methods
const get = withTier4ErrorHandling(
  async (url, config) => axiosInstance.get(url, config),
  { componentName: 'ApiClient_GET' }
);

const post = withTier4ErrorHandling(
  async (url, data, config) => axiosInstance.post(url, data, config),
  { componentName: 'ApiClient_POST' }
);

export const apiClient = { get, post, ... };
```

### 2. Page-Level Error Boundaries
Each page in `App.tsx` should be wrapped with a Tier 4 capable Error Boundary.
*   **Action:** Create `Tier4ErrorBoundary.tsx` that uses `tier4ErrorHandler` to log React lifecycle errors.
*   **Action:** Wrap all `Route` elements in `App.tsx`.

### 3. Backend Synchronization Handling
The `WebSocketService` already exists. It should be enhanced to use `Tier4ErrorHandler` for connection failures.
*   **Action:** Modify `WebSocketService.ts` to report connection drops to `tier4ErrorHandler`.

### 4. Meta AI Layer Protection
When "Frenly" components are restored, they must be wrapped with `withTier4Tracking` to monitor AI interaction failures (e.g., context window limits, timeout errors).

## Verification Plan
1.  **Unit Test:** Mock `axios` and verify `apiClient.get` retries 3 times (default Tier 4 policy) on 500 errors.
2.  **Integration Test:** Trigger a 401 error and verify it flows to `tier4ErrorHandler` and triggers the "Authentication" category logic.
