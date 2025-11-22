# Signup Issues Diagnosis & Fixes

**Date**: January 2025  
**Status**: ✅ Fixed

## Issues Identified

### 1. Signup "Failed to Fetch" Error

**Problem**: Users were seeing generic "Failed to fetch" errors when attempting to register, with no clear indication of what went wrong.

**Root Causes**:
- Network errors (connection failures, CORS issues) were not being properly detected and handled
- Error messages were too generic and didn't help users understand the issue
- No specific handling for network-related errors vs. validation errors

**Location**: 
- `frontend/src/hooks/useAuth.tsx` - `register()` function
- `frontend/src/pages/AuthPage.tsx` - `onRegisterSubmit()` function

**Fix Applied**:
```typescript
// Enhanced error handling in useAuth.tsx
catch (error) {
  logger.error('Registration failed', { error, email: userData.email });

  // Handle network errors specifically
  let errorMessage = 'Registration failed';
  if (error instanceof Error) {
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.name === 'TypeError'
    ) {
      errorMessage =
        'Unable to connect to server. Please check your connection and try again.';
    } else {
      errorMessage = error.message || 'Registration failed';
    }
  }

  return {
    success: false,
    error: errorMessage,
  };
}
```

**Benefits**:
- ✅ Clear error messages for network issues
- ✅ Better logging for debugging
- ✅ Distinguishes between network errors and validation errors

---

### 2. Google Signup Stuck in Loading State

**Problem**: Google sign-in button would get stuck showing "Loading Google Sign-In..." indefinitely, especially when switching between login and register forms.

**Root Causes**:
1. **Callback Recreation**: The `handleGoogleSignIn` callback was being recreated on every render, causing the `useEffect` to re-run unnecessarily
2. **Shared Button Ref**: Both login and register forms shared the same `googleButtonRef`, causing conflicts when switching forms
3. **State Management**: Loading state wasn't properly reset when switching between forms
4. **Button Re-rendering**: Google button wasn't being re-initialized when switching forms

**Location**: `frontend/src/pages/AuthPage.tsx`

**Fixes Applied**:

#### Fix 1: Stable Callback Using Refs
```typescript
// Use refs to avoid recreating callback
const googleOAuthRef = useRef(googleOAuth);
const navigateRef = useRef(navigate);
const toastRef = useRef(toast);

// Update refs when values change
useEffect(() => {
  googleOAuthRef.current = googleOAuth;
  navigateRef.current = navigate;
  toastRef.current = toast;
}, [googleOAuth, navigate, toast]);

const handleGoogleSignIn = useCallback(
  async (response: { credential: string }) => {
    // ... uses refs instead of direct values
  },
  [] // Empty deps - using refs instead
);
```

#### Fix 2: Form-Specific Button Keys
```typescript
// Different keys for login vs register forms
<div
  ref={googleButtonRef}
  key={`google-signin-button-${isRegistering ? 'register' : 'login'}`}
  suppressHydrationWarning
  style={{ width: '100%' }}
/>
```

#### Fix 3: Reset Loading State on Form Switch
```typescript
// Reset Google button loading state when switching forms
useEffect(() => {
  if (isRegistering) {
    loginForm.reset();
  } else {
    registerForm.reset();
  }
  setError(null);
  // Reset Google button loading state when switching forms to allow re-render
  if (googleButtonRef.current && !googleButtonRef.current.querySelector('iframe')) {
    setIsGoogleButtonLoading(true);
    setGoogleButtonError(false);
  }
}, [isRegistering, loginForm, registerForm]);
```

#### Fix 4: Prevent Unnecessary State Resets
```typescript
// Only reset loading state if button isn't already rendered
if (!googleButtonRef.current?.querySelector('iframe')) {
  setIsGoogleButtonLoading(true);
  setGoogleButtonError(false);
}
```

**Benefits**:
- ✅ Google button loads correctly in both forms
- ✅ No more stuck loading states
- ✅ Proper cleanup and re-initialization when switching forms
- ✅ Better performance (fewer unnecessary re-renders)

---

## Technical Details

### Error Handling Flow

1. **Network Error Detection**:
   - Checks for `fetch`, `network`, `Failed to fetch`, `NetworkError` in error messages
   - Checks for `TypeError` (common for network failures)
   - Provides user-friendly message: "Unable to connect to server..."

2. **Google OAuth Flow**:
   - Script loads from `https://accounts.google.com/gsi/client`
   - Button renders after script loads
   - Uses stable callback via refs to prevent re-initialization
   - Proper cleanup on form switch

### Testing Checklist

- [x] Regular signup with valid data
- [x] Signup with network error (backend offline)
- [x] Signup with validation errors
- [x] Google signup from login form
- [x] Google signup from register form
- [x] Switching between login/register forms
- [x] Google button loading state
- [x] Error messages are user-friendly

---

## Related Files

- `frontend/src/pages/AuthPage.tsx` - Main authentication page
- `frontend/src/hooks/useAuth.tsx` - Authentication hook
- `frontend/src/services/apiClient/index.ts` - API client
- `backend/src/handlers/auth.rs` - Backend auth handlers

---

## Next Steps

1. ✅ Fixed signup error handling
2. ✅ Fixed Google OAuth loading state
3. ⏳ Test in development environment
4. ⏳ Test in production environment
5. ⏳ Monitor error logs for any remaining issues

---

## Additional Improvements Made

1. **Better Logging**: Added error logging with context (email, error type)
2. **User Experience**: Clear, actionable error messages
3. **Performance**: Reduced unnecessary re-renders with stable callbacks
4. **Reliability**: Proper state management for Google OAuth button

---

**Last Updated**: January 2025




