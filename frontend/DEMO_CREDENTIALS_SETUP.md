# Demo Credentials & Google OAuth Configuration Guide

## Overview

This guide explains how to configure and use demo credentials and Google OAuth authentication in the Reconciliation Platform.

## Google OAuth Configuration

### Current Status

✅ **Google OAuth is already configured!**

The Google OAuth Client ID is set in your `.env` file:
```
VITE_GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
```

### How It Works

1. **Frontend Configuration**: The `VITE_GOOGLE_CLIENT_ID` environment variable enables the Google Sign-In button on the login page
2. **Backend Configuration**: The backend validates Google ID tokens using the `GOOGLE_CLIENT_ID` environment variable
3. **Automatic Detection**: If `VITE_GOOGLE_CLIENT_ID` is not set, the Google Sign-In button will be hidden with a helpful message

### Enabling/Disabling Google OAuth

**To Enable:**
```bash
# In frontend/.env or frontend/.env.local
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**To Disable:**
```bash
# Remove or comment out the line
# VITE_GOOGLE_CLIENT_ID=
```

**Note**: After changing the `.env` file, restart the frontend development server:
```bash
cd frontend
npm run dev
```

## Demo Credentials Configuration

### What Are Demo Credentials?

Demo credentials are pre-configured test accounts that allow quick access to the platform for testing and development purposes. They are displayed on the login page when demo mode is enabled.

### Available Demo Accounts

The following demo accounts are configured:

1. **Admin Account**
   - Email: `admin@example.com`
   - Password: `AdminPassword123!`
   - Role: Administrator (full access)

2. **Manager Account**
   - Email: `manager@example.com`
   - Password: `ManagerPassword123!`
   - Role: Manager (project management access)

3. **User Account**
   - Email: `user@example.com`
   - Password: `UserPassword123!`
   - Role: Standard User

### Enabling/Disabling Demo Mode

**To Enable Demo Mode:**
```bash
# In frontend/.env or frontend/.env.local
VITE_DEMO_MODE=true
```

**To Disable Demo Mode:**
```bash
# In frontend/.env or frontend/.env.local
VITE_DEMO_MODE=false
```

**Default Behavior:**
- **Development**: Demo mode is enabled by default
- **Production**: Demo mode should be disabled

### Using Demo Credentials

#### Option 1: Quick Fill Button

1. Navigate to the login page (`/login`)
2. You'll see a "Demo Credentials" section (if demo mode is enabled)
3. Click "Use" next to any demo account to auto-fill the credentials
4. Click "Sign In" to log in

#### Option 2: Quick Login Button

1. Navigate to the login page
2. Click the "Quick Login with Demo Account" button
3. This will auto-fill the admin credentials and you can immediately click "Sign In"

#### Option 3: Manual Entry

1. Type the demo credentials manually:
   - Email: `admin@example.com`
   - Password: `AdminPassword123!`
2. Click "Sign In"

### Demo Credentials Configuration File

Demo credentials are defined in `frontend/src/config/demoCredentials.ts`. You can modify this file to:

- Change demo account credentials
- Add new demo accounts
- Modify role descriptions

**Example:**
```typescript
export const DEMO_CREDENTIALS: DemoCredentials[] = [
  {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin',
    description: 'Administrator account with full access',
  },
  // Add more accounts...
]
```

## Database Setup

⚠️ **Important**: Demo credentials will only work if the corresponding users exist in the database.

### Creating Demo Users

You need to ensure demo users are created in your database. This can be done through:

1. **Automated Seeding Script** (Recommended): Use the provided script to create all demo users at once
   ```bash
   cd frontend
   npm run seed-demo-users
   ```
   This script will:
   - Check if the backend is running
   - Create all demo users via the registration API
   - Handle existing users gracefully (won't fail if users already exist)
   - Show a summary of results

2. **Manual Registration**: Register the demo accounts through the registration form on the login page

3. **Backend API**: Use the registration endpoint directly to create demo users programmatically

### Password Requirements

Demo passwords must meet the platform's password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

All configured demo passwords meet these requirements.

## Environment Variables Summary

### Frontend (.env)

```bash
# Google OAuth (required to enable Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Demo Mode (optional, defaults to enabled in development)
VITE_DEMO_MODE=true
```

### Backend (.env)

```bash
# Google OAuth (for token validation)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Troubleshooting

### Google Sign-In Button Not Showing

1. **Check Environment Variable**:
   ```bash
   cd frontend
   cat .env | grep VITE_GOOGLE_CLIENT_ID
   ```

2. **Verify Format**: The Client ID should end with `.apps.googleusercontent.com`

3. **Restart Frontend**: After changing `.env`, restart the dev server:
   ```bash
   npm run dev
   ```

4. **Check Browser Console**: Look for errors related to Google Identity Services

### Demo Credentials Not Working

1. **Check Demo Mode**:
   ```bash
   cd frontend
   cat .env | grep VITE_DEMO_MODE
   ```

2. **Verify User Exists**: Ensure the demo user exists in the database

3. **Check Password**: Verify the password matches exactly (case-sensitive)

4. **Database Connection**: Ensure the backend can connect to the database

### Demo Credentials Section Not Showing

1. **Check Demo Mode**: Ensure `VITE_DEMO_MODE=true` in `.env`
2. **Check Environment**: Demo mode is enabled by default in development
3. **Restart Frontend**: Restart the dev server after changing `.env`

## Security Considerations

⚠️ **Important Security Notes**:

1. **Production**: Always disable demo mode in production:
   ```bash
   VITE_DEMO_MODE=false
   ```

2. **Demo Credentials**: Never use demo credentials in production databases

3. **Google OAuth**: Keep your Google OAuth Client Secret secure and never commit it to version control

4. **Environment Variables**: Never commit `.env` files with real credentials to version control

## Related Files

- **Demo Credentials Config**: `frontend/src/config/demoCredentials.ts`
- **Auth Page**: `frontend/src/pages/AuthPage.tsx`
- **Environment Config**: `frontend/.env` and `frontend/.env.local`
- **Google OAuth Setup**: `frontend/GOOGLE_OAUTH_SETUP.md`

## Quick Reference

### Enable Google OAuth
```bash
# Add to frontend/.env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Enable Demo Credentials
```bash
# Add to frontend/.env
VITE_DEMO_MODE=true
```

### Restart After Changes
```bash
cd frontend
npm run dev
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Ensure the backend is running and accessible
4. Check database connectivity and user existence

