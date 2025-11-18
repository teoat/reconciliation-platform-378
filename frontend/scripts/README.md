# Frontend Scripts

This directory contains utility scripts for the frontend application.

## Available Scripts

### `seed-demo-users.ts`

Creates demo users in the database using the registration API.

**Usage:**
```bash
npm run seed-demo-users
```

**What it does:**
- Checks if the backend is running and accessible
- Creates all demo users defined in `src/config/demoCredentials.ts`:
  - Admin: `admin@example.com / AdminPassword123!`
  - Manager: `manager@example.com / ManagerPassword123!`
  - User: `user@example.com / UserPassword123!`
- Handles existing users gracefully (won't fail if users already exist)
- Shows a summary of results

**Requirements:**
- Backend must be running at `http://localhost:2000`
- Backend must have the registration endpoint available at `/api/auth/register`

**Environment Variables:**
- `VITE_API_URL`: API base URL (defaults to `http://localhost:2000/api`)

**Example Output:**
```
🌱 Seeding Demo Users...

API URL: http://localhost:2000/api

Checking backend health...
✅ Backend is running

Results:
────────────────────────────────────────────────────────────
✅ Created admin user: admin@example.com
✅ Created manager user: manager@example.com
✅ Created user user: user@example.com
────────────────────────────────────────────────────────────

📊 Summary: 3/3 users ready

✨ Demo users are ready to use!

You can now:
  1. Go to http://localhost:1000/login
  2. Use the demo credentials section to auto-fill and login
  3. Or use the "Quick Login with Demo Account" button
```

