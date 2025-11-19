# Google OAuth "No Registered Origin" Error Fix

## Error Message
```
Access blocked: Authorization Error
no registered origin
Error 401: invalid_client
```

## What This Means

This error occurs when the URL/origin where your application is running is not registered in your Google Cloud Console OAuth client configuration. Google OAuth requires that you explicitly whitelist the origins (domains) where your app can use the OAuth client ID.

## Quick Fix Steps

### Step 1: Identify Your Current Origin

Check what URL you're accessing the app from:

1. **Look at your browser address bar** - Note the exact URL:
   - `http://localhost:1000` (most common)
   - `http://127.0.0.1:1000` (alternative localhost)
   - `https://yourdomain.com` (production)
   - `http://localhost:3000` (if using different port)

2. **Check your Vite dev server output** - It shows the exact URL:
   ```bash
   VITE v5.x.x  ready in 500 ms
   
   ➜  Local:   http://localhost:1000/
   ➜  Network: http://192.168.1.x:1000/
   ```

### Step 2: Add Origin to Google Cloud Console

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project (or create one if needed)

2. **Find Your OAuth Client**:
   - Look for OAuth 2.0 Client ID: `600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com`
   - Click the **pencil icon** (Edit) next to it

3. **Add Authorized JavaScript Origins**:
   - Scroll to **"Authorized JavaScript origins"**
   - Click **"+ ADD URI"**
   - Add your origin(s):
     ```
     http://localhost:1000
     http://127.0.0.1:1000
     ```
   - **Important**: 
     - Include protocol (`http://` or `https://`)
     - Include port number if not default (80/443)
     - No trailing slash
     - No path (just domain:port)

4. **Add Authorized Redirect URIs** (if needed):
   - Scroll to **"Authorized redirect URIs"**
   - Click **"+ ADD URI"**
   - Add:
     ```
     http://localhost:1000
     http://localhost:1000/login
     ```
   - For Google Identity Services (GSI), you typically need the base origin

5. **Save Changes**:
   - Click **"SAVE"** at the bottom
   - Wait 1-2 minutes for changes to propagate

### Step 3: Clear Browser Cache and Retry

1. **Hard refresh your browser**:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache: `Ctrl+Shift+Delete` → Clear cached images and files

2. **Try Google Sign-In again**:
   - Go to your login page
   - Click the Google Sign-In button
   - The error should be resolved

## Common Origin Variations

### Development (Local)
```
http://localhost:1000
http://127.0.0.1:1000
http://localhost:3000
http://localhost:5173  (Vite default)
```

### Production
```
https://yourdomain.com
https://www.yourdomain.com
https://app.yourdomain.com
```

### Network Access (if accessing from other devices)
```
http://192.168.1.100:1000  (your local IP)
```

**Note**: Add all variations you might use!

## Verification Checklist

After adding origins, verify:

- [ ] Origin added to "Authorized JavaScript origins"
- [ ] Redirect URI added (if using redirect flow)
- [ ] Changes saved in Google Cloud Console
- [ ] Waited 1-2 minutes for propagation
- [ ] Browser cache cleared
- [ ] Frontend dev server restarted (if needed)
- [ ] Tried Google Sign-In again

## Still Not Working?

### Check 1: Verify Client ID
```bash
# Check your frontend .env file
cd frontend
cat .env.local | grep VITE_GOOGLE_CLIENT_ID

# Should show:
# VITE_GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
```

### Check 2: Verify Current Origin
Open browser console (F12) and run:
```javascript
console.log('Current origin:', window.location.origin);
// Should match what you added to Google Cloud Console
```

### Check 3: Check Browser Console Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Look for OAuth-related errors
4. Check Network tab for failed requests to `accounts.google.com`

### Check 4: OAuth Consent Screen
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Ensure consent screen is configured
- If app is in "Testing" mode, add your email as a test user

## Production Deployment

When deploying to production:

1. **Add production origins**:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

2. **Update environment variables**:
   - Keep the same `VITE_GOOGLE_CLIENT_ID`
   - Or create a separate OAuth client for production

3. **Use HTTPS**:
   - Google OAuth requires HTTPS in production
   - HTTP only works for `localhost` and `127.0.0.1`

## Related Documentation

- [Google OAuth Setup Guide](../GOOGLE_OAUTH_SETUP.md)
- [Google OAuth Quick Start](../GOOGLE_OAUTH_QUICK_START.md)
- [Authentication Troubleshooting](../AUTHENTICATION_TROUBLESHOOTING.md)

## Quick Reference

**Google Cloud Console URLs:**
- Credentials: https://console.cloud.google.com/apis/credentials
- OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent

**Your OAuth Client ID:**
```
600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
```

**Common Origins to Add:**
```
http://localhost:1000
http://127.0.0.1:1000
https://yourdomain.com  (production)
```

