# Google OAuth Setup Guide

## Why Google OAuth Button Isn't Showing

The Google OAuth button doesn't show because `VITE_GOOGLE_CLIENT_ID` is not configured in the `.env` file.

## Quick Fix

### Option 1: Enable Google OAuth (Recommended for Production)

1. **Get Google OAuth Client ID**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Reconciliation Platform"
   - Authorized JavaScript origins: `http://localhost:1000`
   - Authorized redirect URIs: `http://localhost:1000/login`
   - Click "Create"
   - Copy the **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)

2. **Add to .env file**:
   ```bash
   cd frontend
   # Edit .env file
   # Change this line:
   VITE_GOOGLE_CLIENT_ID=
   # To:
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   ```

3. **Restart Frontend**:
   ```bash
   # Stop frontend (Ctrl+C)
   npm run dev
   ```

4. **Verify**: Google Sign-In button should now appear on the login page

### Option 2: Keep Google OAuth Disabled (For Development)

If you don't need Google OAuth right now:
- The login page will show a helpful message: "Google Sign-In is not configured..."
- Regular email/password login will still work
- You can add Google OAuth later when needed

## Current Status

- ✅ **Code is ready** - Google OAuth implementation is complete
- ✅ **Configuration file created** - `.env` file exists with template
- ⚠️ **Client ID not set** - Need to add `VITE_GOOGLE_CLIENT_ID` to enable

## Testing

After adding the Client ID and restarting frontend:

1. Open: `http://localhost:1000/login`
2. You should see:
   - ✅ Google Sign-In button (if Client ID is set)
   - ✅ Or helpful message (if Client ID is not set)
3. Click Google button → Should open Google sign-in popup
4. After signing in → Should redirect back and authenticate

## Troubleshooting

### Button still not showing after adding Client ID
- Make sure you restarted the frontend dev server
- Check browser console for errors
- Verify `.env` file is in `frontend/` directory
- Check that `VITE_GOOGLE_CLIENT_ID` has no quotes or spaces

### Google Sign-In popup doesn't open
- Check browser console for errors
- Verify authorized JavaScript origins include `http://localhost:1000`
- Make sure popup blocker is not blocking it

### "Token audience mismatch" error
- Verify `GOOGLE_CLIENT_ID` in backend `.env` matches frontend `VITE_GOOGLE_CLIENT_ID`
- Or leave backend `GOOGLE_CLIENT_ID` empty (validation will be skipped)

## Backend Configuration (Optional)

The backend can also validate the Google token audience. Add to `backend/.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
```

This is optional - if not set, the backend will accept any valid Google token.

