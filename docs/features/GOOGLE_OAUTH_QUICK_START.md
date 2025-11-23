# Google OAuth Quick Start Guide

## ✅ Credentials Configured

- **Client ID**: `600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com`
- **Client Secret**: `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`

## 🚀 Quick Setup

### Option 1: Use Setup Script (Recommended)

```bash
cd frontend
chmod +x setup-google-oauth.sh
./setup-google-oauth.sh
```

### Option 2: Manual Setup

**Frontend** (`frontend/.env.local`):
```bash
VITE_GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
```

**Backend** (`backend/.env.local`):
```bash
GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 📋 Next Steps

1. **Restart Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Restart Backend**:
   ```bash
   cd backend
   cargo run
   ```

3. **Test OAuth**:
   - Visit `http://localhost:1000/login`
   - Look for Google Sign-In button below "Or continue with"
   - Click button and test authentication

## 🔍 Verify Configuration

### Check Frontend
```bash
# In frontend directory
cat .env.local
# Should show: VITE_GOOGLE_CLIENT_ID=600300535059-...
```

### Check Backend
```bash
# In backend directory
cat .env.local
# Should show: GOOGLE_CLIENT_ID=600300535059-...
```

### Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Navigate to `/login`
4. Look for: "Google Identity Services script loaded"
5. Look for: "Google Sign-In button rendered successfully"

## ⚙️ Google Cloud Console Setup

Ensure these are configured in [Google Cloud Console](https://console.cloud.google.com/):

### Authorized JavaScript Origins
- `http://localhost:1000`
- `http://localhost:2000` (if applicable)
- Your production domain

### Authorized Redirect URIs
- `http://localhost:1000`
- Your production domain

### OAuth Consent Screen
- Configure consent screen
- Add test users (if in testing mode)
- Required scopes: `email`, `profile`, `openid`

## 🐛 Troubleshooting

### Button Not Showing
1. Check `.env.local` exists and has correct value
2. Restart dev server
3. Check browser console for errors
4. Verify `window.google` exists in console

### Authentication Fails
1. Check backend logs for errors
2. Verify `GOOGLE_CLIENT_ID` in backend `.env.local`
3. Check Google Cloud Console configuration
4. Verify redirect URIs match

## 📚 More Information

- See `frontend/GOOGLE_OAUTH_SETUP.md` for detailed guide
- See `frontend/GOOGLE_OAUTH_FIX.md` for technical details

