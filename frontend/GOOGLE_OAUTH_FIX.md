# Google OAuth Button Fix

## Issue
Google OAuth button was not showing on the login/register page.

## Root Causes Identified

1. **Timing Issue**: The Google Identity Services script might load before the button ref container is ready
2. **No Retry Logic**: If initialization failed, there was no retry mechanism
3. **Script Loading**: Script was appended to `body` instead of `head`
4. **Missing Error Handling**: No error handling for script load failures

## Fixes Applied

### 1. Added Retry Logic
- Implemented `renderGoogleButton()` function with retry mechanism (5 retries, 200ms delay)
- Checks for both `window.google` and `googleButtonRef.current` before rendering
- Prevents duplicate button rendering by checking for existing iframe

### 2. Improved Script Loading
- Changed script append from `document.body` to `document.head` (better practice)
- Added `onerror` handler for script load failures
- Added logging for debugging

### 3. Enhanced Button Container
- Added `min-h-[40px]` to ensure container has space for button
- Added `aria-label` for accessibility
- Container is always visible, even when button is loading

### 4. Better Error Handling
- Added try-catch around button rendering
- Logs errors for debugging
- Retries on errors

### 5. Fixed Dependencies
- Removed `googleButtonRef` from useEffect dependencies (refs don't need to be in deps)
- Only `handleGoogleSignIn` is in dependencies

## Code Changes

### Before
```tsx
useEffect(() => {
  // Simple script loading with setTimeout
  script.onload = () => {
    setTimeout(() => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.renderButton(...)
      }
    }, 100)
  }
  document.body.appendChild(script)
}, [handleGoogleSignIn])
```

### After
```tsx
useEffect(() => {
  const renderGoogleButton = (retries = 5, delay = 200) => {
    // Retry logic with proper checks
    if (!window.google || !googleButtonRef.current) {
      setTimeout(() => renderGoogleButton(retries - 1, delay), delay)
      return
    }
    // Initialize and render with error handling
    try {
      window.google.accounts.id.initialize({...})
      window.google.accounts.id.renderButton(...)
    } catch (error) {
      // Retry on error
      setTimeout(() => renderGoogleButton(retries - 1, delay), delay)
    }
  }
  
  script.onload = () => renderGoogleButton()
  script.onerror = () => logger.error('Failed to load script')
  document.head.appendChild(script)
}, [handleGoogleSignIn])
```

## Testing

To test Google OAuth:

1. **Set Environment Variable**:
   ```bash
   # In frontend/.env or frontend/.env.local
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

2. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

3. **Check Browser Console**:
   - Look for "Google Identity Services script loaded" message
   - Look for "Google Sign-In button rendered successfully" message
   - Check for any errors

4. **Verify Button Appears**:
   - Button should appear below "Or continue with" divider
   - Button should be visible and clickable
   - Button should have Google branding

## Troubleshooting

### Button Still Not Showing

1. **Check Environment Variable**:
   ```bash
   echo $VITE_GOOGLE_CLIENT_ID
   # Or check .env file
   ```

2. **Check Browser Console**:
   - Look for errors related to Google Identity Services
   - Check if script loaded: `window.google` should exist

3. **Check Network Tab**:
   - Verify `https://accounts.google.com/gsi/client` loads successfully
   - Check for CORS or CSP errors

4. **Check Google Client ID**:
   - Ensure client ID is correct format
   - Verify authorized JavaScript origins include your domain
   - Check authorized redirect URIs in Google Cloud Console

### Common Issues

1. **CSP (Content Security Policy) Errors**:
   - Add `https://accounts.google.com` to script-src
   - Add `https://*.googleapis.com` to script-src

2. **Invalid Client ID**:
   - Ensure client ID is from Google Cloud Console
   - Check that OAuth consent screen is configured

3. **Domain Not Authorized**:
   - Add your domain to authorized JavaScript origins
   - Include both `http://localhost:1000` (dev) and production domain

## Additional Improvements

1. **Added Accessibility**:
   - `aria-label` on button container
   - `aria-hidden="true"` on icon-only buttons

2. **Better Logging**:
   - Info logs for successful operations
   - Error logs for failures
   - Helps with debugging

3. **Cleanup**:
   - Clears button container on unmount
   - Doesn't remove script (might be used elsewhere)

## Next Steps ✅ COMPLETED

1. ✅ **Loading State Indicator**: Added loading spinner and message while Google button loads
2. ✅ **Fallback UI**: Added error state with refresh button if button fails to load after retries
3. ✅ **State Management**: Implemented `isGoogleButtonLoading` and `googleButtonError` states
4. ✅ **Both Forms Verified**: Button works in both login and register forms (shared ref and state)
5. ✅ **Enhanced UX**: Users now see clear feedback during loading and error states

## Additional Improvements ✅ COMPLETED

### 6. Loading State Indicator
- Added `isGoogleButtonLoading` state to track button loading status
- Shows spinner with "Loading Google Sign-In..." message while button initializes
- Provides visual feedback to users during the loading process
- Automatically hides when button successfully renders

### 7. Fallback UI for Errors
- Added `googleButtonError` state to track button load failures
- Shows error message with refresh button if button fails to load after all retries
- Provides clear user guidance on how to recover from errors
- Includes accessible refresh button to retry loading

### 8. Enhanced State Management
- State updates integrated into `renderGoogleButton()` function
- States reset properly on cleanup and when switching forms
- States update correctly on script load success/failure
- States update when button renders successfully or fails

### Implementation Details

**Loading State:**
```tsx
{isGoogleButtonLoading ? (
  <div className="flex items-center justify-center py-2">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" aria-hidden="true"></div>
    <span className="text-sm text-gray-600">Loading Google Sign-In...</span>
  </div>
) : ...}
```

**Error State:**
```tsx
{googleButtonError ? (
  <div className="flex flex-col items-center justify-center py-2 px-4">
    <p className="text-xs text-red-600 text-center mb-2">
      Failed to load Google Sign-In button. Please refresh the page.
    </p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="text-xs text-blue-600 hover:text-blue-700 underline"
      aria-label="Refresh page to retry Google Sign-In"
    >
      Refresh Page
    </button>
  </div>
) : ...}
```

**State Updates:**
- `setIsGoogleButtonLoading(true)` when starting to load
- `setIsGoogleButtonLoading(false)` when button renders successfully
- `setGoogleButtonError(true)` when all retries exhausted or script fails to load
- States reset on cleanup and when Client ID is not configured

