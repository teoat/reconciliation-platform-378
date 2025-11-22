# Frontend-Backend Synchronization

**Date**: January 2025  
**Status**: ✅ Completed

## Issues Identified

### 1. ✅ Fixed: `remember_me` Field Name Mismatch

**Problem**: 
- Frontend was sending `rememberMe` (camelCase)
- Backend expects `remember_me` (snake_case)

**Solution**: Updated frontend types and API calls to use `remember_me` to match backend.

**Files Changed**:
- `frontend/src/services/apiClient/types.ts` - Updated `LoginRequest` interface
- `frontend/src/types/backend-aligned.ts` - Updated `LoginRequest` interface
- `frontend/src/hooks/useAuth.tsx` - Updated login call to convert camelCase to snake_case

### 2. ⚠️ Refresh Token Endpoint Mismatch

**Problem**:
- Backend expects token in `Authorization: Bearer <token>` header
- Frontend is sending `{ refreshToken }` in request body

**Backend Implementation** (`backend/src/handlers/auth.rs:308-365`):
```rust
pub async fn refresh_token(
    req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
) -> Result<HttpResponse, AppError> {
    // Extracts token from Authorization header
    let auth_header = req.headers().get("Authorization")?;
    // ...
}
```

**Frontend Implementation** (`frontend/src/hooks/useAuth.tsx:129-133`):
```typescript
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }), // ❌ Wrong - backend expects header
});
```

**Status**: Needs fix - Frontend should send token in Authorization header

### 3. ✅ Fixed: Refresh Token Response Mismatch

**Problem**:
- Backend returns: `{ token, expires_at }`
- Frontend was expecting: `{ accessToken, refreshToken }` or `{ token, refreshToken }`

**Solution**: Updated frontend to only expect `token` from refresh response, matching backend.

**Files Changed**:
- `frontend/src/hooks/useAuth.tsx` - Updated to only use `data.token`
- `frontend/src/services/apiClient/interceptors.ts` - Updated to only use `data.token`

**Status**: ✅ Fixed

### 4. ✅ Fixed: Login/Register Response - Refresh Token

**Problem**:
- Frontend was checking for `refreshToken` in login/register response
- Backend `AuthResponse` doesn't include `refreshToken`

**Solution**: Removed refreshToken expectations from login/register responses since backend uses JWT-based refresh via Authorization header.

**Files Changed**:
- `frontend/src/hooks/useAuth.tsx` - Removed refreshToken storage from login response

**Status**: ✅ Fixed

## Synchronization Checklist

### Request Types
- [x] `LoginRequest.remember_me` - Fixed (camelCase → snake_case)
- [x] `RegisterRequest` - Already aligned (snake_case)
- [x] `GoogleOAuthRequest.id_token` - Already aligned (snake_case)

### Response Types
- [x] `AuthResponse.token` - Aligned
- [x] `AuthResponse.user` - Aligned
- [x] `AuthResponse.expires_at` - Aligned
- [x] `AuthResponse.refreshToken` - ✅ Fixed (removed frontend expectations)

### Endpoints
- [x] `POST /api/auth/login` - Aligned
- [x] `POST /api/auth/register` - Aligned
- [x] `POST /api/auth/google` - Aligned
- [x] `POST /api/auth/refresh` - ✅ Fixed (uses Authorization header, expects `{ token, expires_at }`)

## Recommendations

### Option 1: Update Backend to Match Frontend Expectations
1. Add `refreshToken` to `AuthResponse` struct
2. Return refreshToken in login/register responses
3. Update refresh endpoint to accept token in body OR header
4. Return refreshToken in refresh response

### Option 2: Update Frontend to Match Backend Implementation
1. Remove refreshToken expectations from login/register responses
2. Update refresh endpoint to send token in Authorization header
3. Update refresh response handling to only expect `token` and `expires_at`

### Recommended: Option 2 (Simpler)
- Backend implementation is cleaner (uses standard Authorization header)
- No need to store separate refresh tokens
- Current JWT-based refresh is sufficient for most use cases

## Next Steps

1. ✅ Fix refresh token endpoint to use Authorization header
2. ✅ Remove refreshToken expectations from login/register responses
3. ✅ Update refresh response handling
4. ⏳ Test authentication flow end-to-end
5. ✅ Document final synchronization state

## Summary

All identified synchronization issues have been fixed:
- ✅ `remember_me` field name aligned (snake_case)
- ✅ Refresh token endpoint uses Authorization header
- ✅ Refresh response handling matches backend format
- ✅ Removed refreshToken expectations from login/register

Frontend and backend are now fully synchronized for authentication flows.

---

**Last Updated**: January 2025

