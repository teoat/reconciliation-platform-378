# Authentication Issues - Diagnosis and Fixes

## Issues Found

### 1. Missing `googleOAuth` Method in API Client ✅ FIXED
**Problem**: The `useAuth` hook was calling `apiClient.googleOAuth()` but this method didn't exist in the `ApiClient` class.

**Fix**: Added the `googleOAuth` method to `frontend/src/services/apiClient/index.ts`:
```typescript
async googleOAuth(idToken: string): Promise<ApiResponse<LoginResponse>> {
  const config = this.requestBuilder.method('POST').body({ id_token: idToken }).skipAuth().build();
  return this.makeRequest<LoginResponse>('/auth/google', config);
}
```

### 2. Double API Path Issue ✅ FIXED
**Problem**: The API client was constructing URLs with double `/api/v1` path:
- Base URL: `http://localhost:2000/api/v1`
- Endpoint: `/auth/login`
- Result: `http://localhost:2000/api/v1/api/v1/auth/login` ❌

**Root Cause**: 
- Backend routes are configured as `/api/auth/login` (no `/v1`)
- Frontend was using `http://localhost:2000/api/v1` as base URL

**Fix**: Updated base URL configuration:
- `frontend/src/services/apiClient/utils.ts`: Changed default from `http://localhost:2000/api/v1` to `http://localhost:2000/api`
- `frontend/src/config/AppConfig.ts`: Updated `API_BASE_URL` to match

### 3. Backend Not Running / 404 Errors ⚠️ NEEDS VERIFICATION
**Problem**: All API endpoints return 404, suggesting:
- Backend server may not be running
- Backend may be running on different port
- Routes may not be properly configured

**Action Required**: 
1. Verify backend is running: `cd backend && cargo run`
2. Check backend is listening on port 2000
3. Test health endpoint: `curl http://localhost:2000/api/health`

### 4. CORS Errors ⚠️ NEEDS VERIFICATION
**Problem**: CORS preflight requests are failing with 404, which suggests:
- Backend CORS middleware may not be configured
- Backend may not be handling OPTIONS requests
- CORS headers may not be set correctly

**Action Required**:
1. Check backend CORS configuration in `backend/src/main.rs`
2. Ensure CORS middleware allows `http://localhost:1000` origin
3. Verify OPTIONS requests are handled

### 5. Google OAuth Not Configured ⚠️ NEEDS CONFIGURATION
**Problem**: 
- `VITE_GOOGLE_CLIENT_ID` environment variable is not set
- Google Identity Services script is not loading
- Google button is not visible

**Action Required**:
1. Set `VITE_GOOGLE_CLIENT_ID` in `.env` file or environment
2. Configure Google OAuth in Google Cloud Console
3. Add authorized redirect URIs

## Playwright Test Results

Created comprehensive diagnostic test: `frontend/e2e/auth-diagnostic.spec.ts`

Key findings:
- ✅ Authentication page loads correctly
- ❌ API endpoints return 404 (backend may not be running)
- ❌ Double API path issue (FIXED)
- ❌ CORS errors preventing requests
- ❌ Google OAuth not configured

## Next Steps

1. **Start Backend Server**:
   ```bash
   cd backend
   cargo run
   ```

2. **Verify Backend Health**:
   ```bash
   curl http://localhost:2000/api/health
   ```

3. **Check CORS Configuration**:
   - Review `backend/src/main.rs` for CORS middleware
   - Ensure `http://localhost:1000` is in allowed origins

4. **Configure Google OAuth**:
   - Create `.env` file in `frontend/` directory
   - Add: `VITE_GOOGLE_CLIENT_ID=your-google-client-id`
   - Configure Google Cloud Console

5. **Re-run Playwright Tests**:
   ```bash
   cd frontend
   npx playwright test e2e/auth-diagnostic.spec.ts
   ```

## Files Modified

1. `frontend/src/services/apiClient/index.ts` - Added `googleOAuth` method
2. `frontend/src/services/apiClient/utils.ts` - Fixed baseURL (removed `/v1`)
3. `frontend/src/config/AppConfig.ts` - Fixed API_BASE_URL
4. `frontend/e2e/auth-diagnostic.spec.ts` - Created diagnostic test

## Testing

To test the fixes:

1. Start frontend: `cd frontend && npm run dev`
2. Start backend: `cd backend && cargo run`
3. Navigate to `http://localhost:1000/login`
4. Try demo login: `admin@example.com` / `password123`
5. Check browser console for errors
6. Run Playwright tests: `npx playwright test e2e/auth-diagnostic.spec.ts`

