# Google OAuth - Next Steps Guide

## ✅ Configuration Complete

Your Google OAuth credentials have been configured:
- ✅ Frontend: `frontend/.env.local` 
- ✅ Backend: `backend/.env.local`

## 🚀 Restart Servers

To load the new environment variables, you need to restart both servers.

### Option 1: Use the Restart Script (Recommended)

```bash
./restart-servers.sh
```

This script will:
1. Stop existing frontend and backend processes
2. Start them again with new environment variables
3. Show you the process IDs and log locations

### Option 2: Manual Restart

#### Step 1: Stop Current Servers

**Stop Frontend:**
- Find the terminal where frontend is running
- Press `Ctrl+C` to stop it
- Or find and kill the process:
  ```bash
  lsof -ti:1000 | xargs kill
  ```

**Stop Backend:**
- Find the terminal where backend is running  
- Press `Ctrl+C` to stop it
- Or find and kill the process:
  ```bash
  lsof -ti:2000 | xargs kill
  ```

#### Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:1000`

#### Step 3: Start Backend

Open a **new terminal** and run:

```bash
cd backend
cargo run
```

The backend will start on `http://localhost:2000`

## ✅ Verify Setup

### Option 1: Automated Verification (Recommended)

Run the verification script to check all setup items:

```bash
./verify-google-oauth.sh
```

This script automatically verifies:
- Configuration files exist and are properly set
- Environment variables are configured
- Servers are running
- Servers are accessible

### Option 2: Manual Verification

#### 1. Check Servers Are Running

```bash
# Check frontend
lsof -ti:1000 && echo "✅ Frontend running" || echo "❌ Frontend not running"

# Check backend
lsof -ti:2000 && echo "✅ Backend running" || echo "❌ Backend not running"
```

Or use the verification script:
```bash
./verify-google-oauth.sh
```

#### 2. Test Google OAuth Button

1. **Open browser**: `http://localhost:1000/login`
2. **Look for**: Google Sign-In button below "Or continue with"
3. **Check browser console** (F12):
   - Should see: "Google Identity Services script loaded"
   - Should see: "Google Sign-In button rendered successfully"
   - No errors related to `VITE_GOOGLE_CLIENT_ID`

#### 3. Test Authentication

1. Click the **Google Sign-In** button
2. Should open Google sign-in popup
3. Sign in with your Google account
4. Should redirect back and authenticate successfully

## 🐛 Troubleshooting

### Button Not Showing

1. **Check environment variable is loaded:**
   ```bash
   # In frontend directory
   cat .env.local
   # Should show: VITE_GOOGLE_CLIENT_ID=600300535059-...
   ```

2. **Restart frontend** - Environment variables are only loaded on startup

3. **Check browser console** for errors:
   - Open DevTools (F12)
   - Look for errors about `VITE_GOOGLE_CLIENT_ID`
   - Check if `window.google` exists

4. **Clear browser cache** and hard refresh (Cmd+Shift+R)

### Authentication Fails

1. **Check backend logs:**
   ```bash
   tail -f backend.log
   # Or if running in terminal, check the output
   ```

2. **Verify backend environment variable:**
   ```bash
   # In backend directory
   cat .env.local | grep GOOGLE_CLIENT_ID
   ```

3. **Check Google Cloud Console:**
   - Authorized JavaScript origins: `http://localhost:1000`
   - Authorized redirect URIs: `http://localhost:1000`
   - OAuth consent screen configured

### Server Won't Start

1. **Check if ports are in use:**
   ```bash
   lsof -ti:1000  # Frontend port
   lsof -ti:2000  # Backend port
   ```

2. **Kill processes if needed:**
   ```bash
   lsof -ti:1000 | xargs kill -9
   lsof -ti:2000 | xargs kill -9
   ```

3. **Check for errors:**
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && cargo run`

## 📋 Quick Checklist

### Automated Verification

Run the verification script to check all automated items:

```bash
./verify-google-oauth.sh
```

This script will check:
- ✅ Configuration files created (`.env.local` in frontend and backend)
- ✅ Environment variables are set correctly
- ✅ Frontend server is running (port 1000)
- ✅ Backend server is running (port 2000)
- ✅ Frontend accessible at `http://localhost:1000`
- ✅ Backend accessible at `http://localhost:2000`

### Manual Verification (Requires Browser)

After automated checks pass, verify in browser:

- [ ] Google Sign-In button visible on login page
  - Visit: `http://localhost:1000/login`
  - Look for button below "Or continue with"
  
- [ ] Browser console shows no errors
  - Open DevTools (F12)
  - Check Console tab
  - Should see: "Google Identity Services script loaded"
  - Should see: "Google Sign-In button rendered successfully"
  
- [ ] Google OAuth authentication works
  - Click Google Sign-In button
  - Complete Google sign-in flow
  - Should redirect to dashboard after authentication

## 🛠️ Helper Scripts

### Verification Script

Automatically verify your Google OAuth setup:

```bash
./verify-google-oauth.sh
```

This script checks:
- Configuration files exist
- Environment variables are set
- Servers are running
- Servers are accessible

### Environment Variable Check

Validate environment variable format:

```bash
./check-env-vars.sh
```

This script validates:
- Frontend `VITE_GOOGLE_CLIENT_ID` format
- Backend `GOOGLE_CLIENT_ID` format (optional)
- Backend `GOOGLE_CLIENT_SECRET` format (optional)

## 📝 Implementation Status

### ✅ Completed

- ✅ Restart script (`restart-servers.sh`) - Automates server restart
- ✅ Verification script (`verify-google-oauth.sh`) - Automated checklist verification
- ✅ Environment variable checker (`check-env-vars.sh`) - Validates env var format
- ✅ Documentation - Complete setup and troubleshooting guides

### 🔄 In Progress

- 🔄 Integration with CI/CD - Add automated checks to build pipeline
- 🔄 Health check endpoints - Backend health endpoint for verification

### ⏳ Future Enhancements

- ⏳ Automated browser testing - Selenium/Playwright tests for OAuth flow
- ⏳ Configuration wizard - Interactive setup script
- ⏳ Monitoring dashboard - Real-time OAuth status monitoring

## 🎉 Success!

Once you see the Google Sign-In button and can authenticate, you're all set!

The Google OAuth integration is now fully configured and working.

### Quick Verification

Run this one-liner to verify everything:

```bash
./verify-google-oauth.sh && echo "✅ Setup complete!" || echo "❌ Please fix issues above"
```
