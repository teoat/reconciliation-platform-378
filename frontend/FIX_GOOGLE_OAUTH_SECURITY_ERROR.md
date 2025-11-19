# Fix: Google OAuth "This browser or app may not be secure" Error

## 🔍 Problem

You're seeing this error when trying to sign in with Google:
```
Couldn't sign you in
This browser or app may not be secure.
Try using a different browser.
```

## ✅ Solution: Fix Google Cloud Console Configuration

This error happens because Google OAuth doesn't recognize your localhost origin as authorized. Here's how to fix it:

### Step 1: Check Your Current Origin

1. **Open your browser** at `http://localhost:1000/login`
2. **Press F12** → Console tab
3. **Run this command**:
   ```javascript
   console.log('Current origin:', window.location.origin);
   ```
4. **Note the exact origin** (should be `http://localhost:1000`)

### Step 2: Update Google Cloud Console

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/apis/credentials
   - Make sure you're in the correct project

2. **Find Your OAuth Client**:
   - Look for: `600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com`
   - Click the **pencil icon** (Edit) next to it

3. **Add Authorized JavaScript Origins**:
   - Scroll to **"Authorized JavaScript origins"**
   - Click **"+ ADD URI"**
   - Add these origins (one at a time):
     ```
     http://localhost:1000
     http://127.0.0.1:1000
     ```
   - **Important**:
     - ✅ Include `http://` (not `https://` for localhost)
     - ✅ Include port number `:1000`
     - ✅ No trailing slash
     - ✅ No path (just `http://localhost:1000`)

4. **Add Authorized Redirect URIs**:
   - Scroll to **"Authorized redirect URIs"**
   - Click **"+ ADD URI"**
   - Add:
     ```
     http://localhost:1000
     http://localhost:1000/login
     http://127.0.0.1:1000
     ```

5. **Save Changes**:
   - Click **"SAVE"** at the bottom
   - **Wait 1-2 minutes** for changes to propagate

### Step 3: Check OAuth Consent Screen

1. **Go to OAuth Consent Screen**:
   - Visit: https://console.cloud.google.com/apis/credentials/consent
   - Or: APIs & Services → OAuth consent screen

2. **If App is in Testing Mode**:
   - Scroll to **"Test users"**
   - Click **"+ ADD USERS"**
   - Add your Google account email address
   - Click **"ADD"**

3. **If App is in Production**:
   - Make sure consent screen is fully configured
   - Verify app name, support email, etc.

### Step 4: Clear Browser Cache and Retry

1. **Hard refresh your browser**:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache: `Ctrl+Shift+Delete` → Clear cached images and files

2. **Try Google Sign-In again**:
   - Go to `http://localhost:1000/login`
   - Click the Google Sign-In button
   - Should work now! ✅

## 📋 Complete Configuration Checklist

### Google Cloud Console - OAuth Client Settings

**Authorized JavaScript origins:**
- ✅ `http://localhost:1000`
- ✅ `http://127.0.0.1:1000` (alternative localhost)

**Authorized redirect URIs:**
- ✅ `http://localhost:1000`
- ✅ `http://localhost:1000/login`
- ✅ `http://127.0.0.1:1000`

**OAuth Consent Screen:**
- ✅ App is configured (name, email, etc.)
- ✅ If in testing mode: Your email is added as test user
- ✅ Scopes: `email`, `profile`, `openid`

## 🔍 Verification Steps

1. **Check Current Origin**:
   ```javascript
   // In browser console at http://localhost:1000/login
   console.log('Origin:', window.location.origin);
   // Should be: http://localhost:1000
   ```

2. **Check Client ID**:
   ```bash
   cd frontend
   cat .env.local | grep VITE_GOOGLE_CLIENT_ID
   # Should show: VITE_GOOGLE_CLIENT_ID=600300535059-...
   ```

3. **Check Google Cloud Console**:
   - Verify origins are added correctly
   - Verify redirect URIs are added
   - Verify test users (if in testing mode)

## 🐛 Still Not Working?

### Check 1: Verify Origin Match

The origin in your browser must **exactly match** what's in Google Cloud Console:
- ✅ `http://localhost:1000` matches `http://localhost:1000` ✓
- ❌ `http://localhost:1000` does NOT match `http://127.0.0.1:1000` ✗
- ❌ `http://localhost:1000` does NOT match `http://localhost:1000/` (trailing slash) ✗

### Check 2: Wait for Propagation

Google Cloud Console changes can take **1-5 minutes** to propagate. Wait a few minutes and try again.

### Check 3: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Check Network tab for failed requests

### Check 4: Test User Email

If your app is in **testing mode**, make sure:
- Your Google account email is added as a test user
- You're signing in with that exact email

### Check 5: Try Incognito/Private Mode

Sometimes browser extensions or cached data can interfere:
- Try in incognito/private mode
- Disable browser extensions temporarily
- Clear all cookies for `localhost`

## 🎯 Quick Fix Summary

1. ✅ Add `http://localhost:1000` to Authorized JavaScript origins
2. ✅ Add `http://localhost:1000` to Authorized redirect URIs
3. ✅ Add your email as test user (if in testing mode)
4. ✅ Save and wait 1-2 minutes
5. ✅ Clear browser cache
6. ✅ Try again

## 📝 Direct Links

- **Credentials**: https://console.cloud.google.com/apis/credentials
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent
- **Your Client ID**: `600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com`

## 💡 Alternative: Use Email/Password Login

If Google OAuth continues to have issues, you can:
1. Use the registration form to create accounts
2. Use email/password login
3. Fix Google OAuth configuration later

The demo credentials functionality works independently of Google OAuth!

