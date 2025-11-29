# Better Auth Integration Tests

## 🧪 Testing Guide for Better Auth Migration

This document provides comprehensive testing procedures for the Better Auth integration.

---

## Prerequisites

Before testing, ensure:
- ✅ Auth server is running on port 4000
- ✅ PostgreSQL database is running
- ✅ Database migrations have been executed
- ✅ Environment variables are configured

---

## Test Suite 1: Auth Server Tests

### Test 1.1: Health Check
```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-29T...",
  "service": "better-auth-server",
  "version": "1.0.0"
}
```

✅ **Pass Criteria**: Status code 200, status = "ok"

---

### Test 1.2: User Registration
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "first_name": "Test",
    "last_name": "User",
    "role": "user"
  },
  "expires_at": 1234567890
}
```

✅ **Pass Criteria**: Status code 200, returns token and user object

---

### Test 1.3: User Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "expires_at": 1234567890
}
```

✅ **Pass Criteria**: Status code 200, returns valid token

---

### Test 1.4: Invalid Credentials
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid credentials"
}
```

✅ **Pass Criteria**: Status code 401, returns error

---

### Test 1.5: Password Strength Validation
```bash
# Test weak password
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "password": "weak",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Expected Response:**
```json
{
  "error": "Password validation failed: ..."
}
```

✅ **Pass Criteria**: Status code 400, password validation error

---

### Test 1.6: Get Current User
```bash
TOKEN="<token-from-login>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/auth/me
```

**Expected Response:**
```json
{
  "id": "...",
  "email": "testuser@example.com",
  "first_name": "Test",
  "last_name": "User",
  "role": "user"
}
```

✅ **Pass Criteria**: Status code 200, returns user data

---

### Test 1.7: Token Refresh
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": 1234567890
}
```

✅ **Pass Criteria**: Status code 200, returns new token

---

### Test 1.8: Logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

✅ **Pass Criteria**: Status code 200, success message

---

### Test 1.9: Rate Limiting
```bash
# Run 6 failed login attempts rapidly
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done
```

**Expected**: After 5 attempts, should return rate limit error

✅ **Pass Criteria**: 6th attempt blocked with rate limit message

---

## Test Suite 2: Frontend Integration Tests

### Test 2.1: Auth Client Configuration
```bash
cd frontend
npm run type-check
```

✅ **Pass Criteria**: No TypeScript errors in auth-related files

---

### Test 2.2: Login Component
Open browser to `http://localhost:3000/login`

1. Enter email and password
2. Click "Sign In"
3. Should redirect to dashboard
4. Token should be stored in localStorage

✅ **Pass Criteria**: Successful login and redirect

---

### Test 2.3: Registration Component
Open browser to `http://localhost:3000/login`

1. Click "Create new account"
2. Fill in registration form
3. Click "Sign Up"
4. Should redirect to dashboard

✅ **Pass Criteria**: Successful registration and auto-login

---

### Test 2.4: Google OAuth
Open browser to `http://localhost:3000/login`

1. Click "Continue with Google"
2. Complete Google authentication
3. Should redirect to dashboard

✅ **Pass Criteria**: OAuth flow completes successfully

---

### Test 2.5: Session Timeout
1. Login to application
2. Wait 30 minutes (or reduce timeout for testing)
3. Should show session timeout warning at 25 minutes
4. Should logout at 30 minutes

✅ **Pass Criteria**: Timeout warning shows, then auto-logout

---

### Test 2.6: Token Refresh
1. Login to application
2. Wait 26 minutes
3. Token should refresh automatically
4. Should remain logged in

✅ **Pass Criteria**: Seamless token refresh without logout

---

## Test Suite 3: Backend Integration Tests

### Test 3.1: Dual Token Support - Better Auth Token
```bash
# Get Better Auth token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}' \
  | jq -r '.token')

# Test with backend
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/auth/me
```

✅ **Pass Criteria**: Backend accepts Better Auth token

---

### Test 3.2: Dual Token Support - Legacy JWT
```bash
# Get legacy JWT token (if old system still running)
LEGACY_TOKEN="<legacy-jwt-token>"

# Test with backend
curl -H "Authorization: Bearer $LEGACY_TOKEN" \
  http://localhost:2000/api/v1/auth/me
```

✅ **Pass Criteria**: Backend still accepts legacy tokens (dual mode)

---

### Test 3.3: Protected Endpoints
```bash
# Test without token
curl http://localhost:2000/api/v1/projects

# Expected: 401 Unauthorized

# Test with token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/projects
```

✅ **Pass Criteria**: Protected endpoints require valid token

---

### Test 3.4: WebSocket Authentication
```javascript
// Test WebSocket connection with token
const socket = io('http://localhost:2000', {
  auth: {
    token: 'Bearer ' + token
  }
});

socket.on('connect', () => {
  console.log('✅ WebSocket authenticated');
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket authentication failed:', error);
});
```

✅ **Pass Criteria**: WebSocket connects successfully

---

## Test Suite 4: End-to-End Flow Tests

### Test 4.1: Complete Registration and Login Flow

1. **Register new user** via frontend
2. **Verify** user created in database:
   ```sql
   SELECT * FROM users WHERE email = 'testuser@example.com';
   ```
3. **Login** with new credentials
4. **Access protected route**
5. **Logout** and verify redirect to login

✅ **Pass Criteria**: Complete flow works without errors

---

### Test 4.2: Google OAuth Complete Flow

1. **Click "Continue with Google"** on login page
2. **Authenticate** with Google
3. **Verify** OAuth account created:
   ```sql
   SELECT * FROM accounts WHERE provider = 'google';
   ```
4. **Access protected route**
5. **Logout**

✅ **Pass Criteria**: OAuth flow completes, account linked

---

### Test 4.3: Session Management Flow

1. **Login** to application
2. **Open multiple tabs** with same account
3. **Logout** from one tab
4. **Verify** other tabs also logout

✅ **Pass Criteria**: Session synchronized across tabs

---

### Test 4.4: Token Expiration Flow

1. **Login** and get token
2. **Wait 31 minutes** (or manually expire token)
3. **Make API request**
4. **Should** auto-refresh token
5. **If refresh fails**, should redirect to login

✅ **Pass Criteria**: Graceful handling of expired tokens

---

## Test Suite 5: Security Tests

### Test 5.1: SQL Injection Prevention
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com; DROP TABLE users; --",
    "password": "anything"
  }'
```

✅ **Pass Criteria**: Request fails safely, no SQL injection

---

### Test 5.2: XSS Prevention
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "xss@example.com",
    "password": "SecurePass123!",
    "first_name": "<script>alert(1)</script>",
    "last_name": "User"
  }'
```

✅ **Pass Criteria**: Script tags sanitized or rejected

---

### Test 5.3: CSRF Protection
```bash
# Test without CSRF token (if CSRF enabled)
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
  # Without X-CSRF-Token header
```

✅ **Pass Criteria**: Request succeeds (CSRF handled by Better Auth)

---

### Test 5.4: Rate Limiting
See Test 1.9 above

✅ **Pass Criteria**: Rate limiting enforced after max attempts

---

## Test Suite 6: Performance Tests

### Test 6.1: Auth Server Response Time
```bash
# Measure login response time
time curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

✅ **Pass Criteria**: Response time < 200ms

---

### Test 6.2: Token Validation Performance
```bash
# Measure backend token validation
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/auth/me
```

✅ **Pass Criteria**: Response time < 100ms

---

### Test 6.3: Token Cache Hit
```bash
# First request (cache miss)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/auth/me

# Second request (cache hit)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/auth/me
```

✅ **Pass Criteria**: Second request < 10ms (cache hit)

---

### Test 6.4: Database Connection Pooling
```bash
# Run 50 concurrent requests
seq 1 50 | xargs -P 50 -I {} curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

✅ **Pass Criteria**: All requests succeed, no connection errors

---

## Test Suite 7: Migration Tests

### Test 7.1: Existing User Login
```bash
# Login with existing user credentials (before migration)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing.user@example.com",
    "password": "their-existing-password"
  }'
```

✅ **Pass Criteria**: Existing users can login without password reset

---

### Test 7.2: Password Hash Compatibility
```sql
-- Verify password hashes are still bcrypt
SELECT 
  email,
  password_hash,
  password_hash LIKE '$2b$%' OR password_hash LIKE '$2a$%' AS is_bcrypt
FROM users
LIMIT 5;
```

✅ **Pass Criteria**: All hashes are bcrypt format

---

### Test 7.3: User Data Integrity
```sql
-- Check all users have required fields
SELECT 
  COUNT(*) as total,
  COUNT(email_verified) as has_email_verified,
  COUNT(*) FILTER (WHERE email_verified = true) as verified_count
FROM users;
```

✅ **Pass Criteria**: All users have email_verified = true

---

## Test Suite 8: Error Handling Tests

### Test 8.1: Network Errors
```bash
# Stop auth server
# Try to login from frontend
# Should show user-friendly error
```

✅ **Pass Criteria**: "Unable to connect to server" message

---

### Test 8.2: Database Connection Errors
```bash
# Stop PostgreSQL
# Try to make auth request
# Should return 500 with generic error
```

✅ **Pass Criteria**: Server error, doesn't expose internal details

---

### Test 8.3: Invalid Token Format
```bash
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:2000/api/v1/auth/me
```

✅ **Pass Criteria**: 401 Unauthorized

---

### Test 8.4: Expired Token
```bash
# Use token from >30 minutes ago
EXPIRED_TOKEN="<old-token>"
curl -H "Authorization: Bearer $EXPIRED_TOKEN" \
  http://localhost:2000/api/v1/auth/me
```

✅ **Pass Criteria**: 401 Unauthorized, "Token has expired"

---

## Automated Test Script

Create `scripts/test-better-auth.sh`:

```bash
#!/bin/bash

echo "🧪 Running Better Auth Integration Tests..."

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s http://localhost:4000/health | jq .status
if [ $? -eq 0 ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi

# Test 2: Registration
echo "Test 2: Registration"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test-$(date +%s)@example.com\",\"password\":\"SecurePass123!\",\"first_name\":\"Test\",\"last_name\":\"User\"}")

if echo "$REGISTER_RESPONSE" | jq -e '.token' > /dev/null; then
  echo "✅ PASS"
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
else
  echo "❌ FAIL"
fi

# Test 3: Login
echo "Test 3: Login"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"SecurePass123!\"}")

if echo "$LOGIN_RESPONSE" | jq -e '.token' > /dev/null; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi

# Test 4: Get Current User
echo "Test 4: Get Current User"
USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/auth/me)

if echo "$USER_RESPONSE" | jq -e '.email' > /dev/null; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi

# Test 5: Backend Token Validation
echo "Test 5: Backend Token Validation"
BACKEND_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/auth/me)

if echo "$BACKEND_RESPONSE" | jq -e '.email' > /dev/null; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi

echo "🎉 Tests complete!"
```

---

## Test Results Template

| Test Suite | Test | Status | Notes |
|------------|------|--------|-------|
| Auth Server | Health Check | ⏳ | |
| Auth Server | Registration | ⏳ | |
| Auth Server | Login | ⏳ | |
| Auth Server | Invalid Credentials | ⏳ | |
| Auth Server | Password Validation | ⏳ | |
| Auth Server | Get Current User | ⏳ | |
| Auth Server | Token Refresh | ⏳ | |
| Auth Server | Logout | ⏳ | |
| Auth Server | Rate Limiting | ⏳ | |
| Frontend | Auth Client | ⏳ | |
| Frontend | Login Form | ⏳ | |
| Frontend | Signup Form | ⏳ | |
| Frontend | Google OAuth | ⏳ | |
| Frontend | Session Timeout | ⏳ | |
| Frontend | Token Refresh | ⏳ | |
| Backend | Better Auth Token | ⏳ | |
| Backend | Legacy JWT Token | ⏳ | |
| Backend | Protected Endpoints | ⏳ | |
| Backend | WebSocket Auth | ⏳ | |
| Migration | Existing Users | ⏳ | |
| Migration | Password Hashes | ⏳ | |
| Migration | Data Integrity | ⏳ | |

---

## 🚀 Running All Tests

```bash
# 1. Start services
docker-compose -f docker-compose.better-auth.yml up -d

# 2. Wait for health checks
sleep 10

# 3. Run automated tests
bash scripts/test-better-auth.sh

# 4. Run manual browser tests
npm run dev
# Open http://localhost:3000/login

# 5. Check results
echo "Review test results above"
```

---

## 📊 Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: All user flows
- **Security Tests**: OWASP Top 10 covered
- **Performance Tests**: All endpoints benchmarked

---

*Last Updated: 2024-11-29*  
*Status: Test suite ready for execution*  
*Next: Run tests and verify all pass*

