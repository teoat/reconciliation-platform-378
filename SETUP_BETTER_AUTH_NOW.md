# Setup Better Auth - Personalized Guide for Your System

## 🎯 Quick Setup (15 minutes)

I've detected your existing configuration. Here's exactly what you need to do:

---

## Step 1: Create Auth Server Environment

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/auth-server

# Create .env file
cat > .env << 'EOF'
# Database - Update with your actual PostgreSQL connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reconciliation

# JWT Secret - IMPORTANT: Must match your backend!
# TODO: Get this from your backend .env or config
JWT_SECRET=your-backend-jwt-secret-here-min-32-chars

# Google OAuth - Using your existing client ID
GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Google Redirect URI
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google

# Server Configuration (defaults are good)
PORT=4000
NODE_ENV=development
BCRYPT_COST=12
SESSION_EXPIRY_SECONDS=1800

# CORS (allow frontend and backend)
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:2000

# Logging
LOG_LEVEL=info
EOF

echo "✅ .env file created"
echo ""
echo "⚠️  ACTION REQUIRED:"
echo "1. Edit auth-server/.env and set DATABASE_URL (your PostgreSQL connection)"
echo "2. Edit auth-server/.env and set JWT_SECRET (must match backend!)"
echo "3. Edit auth-server/.env and set GOOGLE_CLIENT_SECRET"
```

---

## Step 2: Get Your Secrets

### Find JWT_SECRET

Option A: Check your backend config
```bash
cat backend/.env | grep JWT_SECRET
# OR
cat config/production.env | grep JWT_SECRET
```

Option B: Generate a new one (if you don't have one)
```bash
openssl rand -base64 32
```

**IMPORTANT**: If generating new, update BOTH auth-server/.env AND backend/.env with the same value!

### Find DATABASE_URL

Check your existing database connection:
```bash
# Check backend config
cat backend/.env | grep DATABASE_URL
# OR
cat config/production.env | grep DATABASE_URL

# Your database is likely:
# postgresql://user:password@localhost:5432/reconciliation_db
```

### Find GOOGLE_CLIENT_SECRET

Get from Google Cloud Console:
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client (ID ending in ...mg8n.apps.googleusercontent.com)
3. Click to view details
4. Copy the "Client Secret"

---

## Step 3: Install and Run

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/auth-server

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Start server
npm run dev
```

**Expected**: Server starts on http://localhost:4000

---

## Step 4: Update Frontend Environment

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend

# Add Better Auth URL to existing .env
echo "" >> .env
echo "# Better Auth Server" >> .env
echo "VITE_AUTH_SERVER_URL=http://localhost:4000" >> .env
```

**No need to run npm install** - better-auth is already in package.json!

---

## Step 5: Test Everything

### Start Frontend (if not already running)
```bash
cd frontend
npm run dev
```

### Run Automated Tests
```bash
# In a new terminal
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
bash scripts/test-better-auth.sh
```

### Manual Browser Test
1. Open http://localhost:3000/login
2. Click "Create new account"
3. Register a test user
4. Should redirect to dashboard ✅

---

## 🚀 You're Ready!

Once all tests pass, you have:
- ✅ Auth server running on port 4000
- ✅ Frontend using Better Auth
- ✅ All authentication flows working
- ✅ Ready for production deployment

---

## 🔧 Quick Commands Reference

### Start Auth Server
```bash
cd auth-server && npm run dev
```

### Start Frontend
```bash
cd frontend && npm run dev
```

### Run Tests
```bash
bash scripts/test-better-auth.sh
```

### Check Health
```bash
curl http://localhost:4000/health
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

---

## 🆘 If You Get Stuck

1. **Check auth-server terminal** for error messages
2. **Check frontend terminal** for errors
3. **Run health check**: `curl http://localhost:4000/health`
4. **Check database**: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"`
5. **Review logs**: Look at terminal output for clues

**Common Issues**:
- Database not running → Start PostgreSQL
- Port 4000 in use → Change PORT in .env or kill process
- JWT_SECRET mismatch → Must be same in auth-server and backend
- Missing env vars → Check .env file

---

## 📞 Need More Help?

See complete documentation:
- [BETTER_AUTH_INDEX.md](BETTER_AUTH_INDEX.md) - All docs
- [BETTER_AUTH_DEPLOYMENT_GUIDE.md](BETTER_AUTH_DEPLOYMENT_GUIDE.md) - Full deployment
- [BETTER_AUTH_INTEGRATION_TESTS.md](BETTER_AUTH_INTEGRATION_TESTS.md) - Testing guide

---

**Your personalized setup is ready to go!** 🚀

