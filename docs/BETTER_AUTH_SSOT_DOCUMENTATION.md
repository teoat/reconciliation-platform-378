# Better Auth Integration - SSOT Documentation

## Overview

Better Auth serves as the **Single Source of Truth (SSOT)** for authentication and password policy across the reconciliation platform. This document outlines the unified password policy, its implementation across systems, and the migration strategy.

---

## Unified Password Policy (SSOT)

All three systems (Backend Rust, Auth Server, Frontend) enforce the following unified policy:

| Policy                      | Value                | Enforced By              |
| --------------------------- | -------------------- | ------------------------ |
| **Minimum Length**          | 8 characters         | ✅ All Systems           |
| **Maximum Length**          | 128 characters       | ✅ All Systems           |
| **Uppercase Required**      | Yes (at least 1)     | ✅ All Systems           |
| **Lowercase Required**      | Yes (at least 1)     | ✅ All Systems           |
| **Number Required**         | Yes (at least 1)     | ✅ All Systems           |
| **Special Char Required**   | Yes (at least 1)     | ✅ All Systems           |
| **Max Sequential Chars**    | 3                    | ✅ All Systems           |
| **Banned Passwords**        | 13 common passwords  | ✅ All Systems           |
| **Bcrypt Cost**             | 12                   | ✅ All Systems           |
| **Password Expiration**     | 90 days              | ✅ Backend + Auth Server |
| **Initial Password Expiry** | 7 days               | ✅ Backend + Auth Server |
| **Password History**        | 5 previous passwords | ✅ Backend + Auth Server |
| **Warning Threshold**       | 7 days before expiry | ✅ Backend + Auth Server |

### Banned Password List

```
password, password123, 123456, 12345678, admin123, qwerty123,
welcome123, letmein, monkey, dragon, master, abc123, qwerty
```

---

## Configuration (Environment Variables)

### Auth Server (`auth-server/.env`)

```bash
# Password Policy (Better Auth SSOT)
BCRYPT_COST=12
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_EXPIRATION_DAYS=90
PASSWORD_INITIAL_EXPIRATION_DAYS=7
PASSWORD_HISTORY_LIMIT=5
PASSWORD_WARNING_DAYS=7

# JWT Configuration (must match backend)
JWT_SECRET=your-jwt-secret-key-here-must-match-backend
JWT_EXPIRATION_SECONDS=1800

# Session Configuration
SESSION_EXPIRY_SECONDS=1800
REFRESH_TOKEN_EXPIRY_SECONDS=604800

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=900000
```

### Frontend (`frontend/.env`)

```bash
# Better Auth Configuration
VITE_AUTH_SERVER_URL=http://localhost:4000

# Password Policy (Better Auth SSOT)
VITE_BCRYPT_COST=12
VITE_PASSWORD_MIN_LENGTH=8
VITE_PASSWORD_MAX_LENGTH=128
VITE_PASSWORD_EXPIRATION_DAYS=90
VITE_PASSWORD_INITIAL_EXPIRATION_DAYS=7
VITE_PASSWORD_HISTORY_LIMIT=5
VITE_PASSWORD_WARNING_DAYS=7

# Feature Flags
VITE_USE_BETTER_AUTH=true
```

### Backend (`backend/.env`)

```bash
# Password Configuration (aligned with Better Auth)
BCRYPT_COST=12
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_EXPIRATION_DAYS=90
PASSWORD_INITIAL_EXPIRATION_DAYS=7
PASSWORD_HISTORY_LIMIT=5
PASSWORD_WARNING_DAYS=7
```

---

## JWT Configuration

### Issuer & Audience

All systems now validate JWT tokens with:

- **Issuer**: `reconciliation-platform`
- **Audience**: `reconciliation-platform-users`

This prevents token replay attacks and ensures tokens are only valid for this platform.

### Token Expiry

- **Access Token**: 1800 seconds (30 minutes)
- **Session**: 1800 seconds (30 minutes)
- **Refresh Token**: 604800 seconds (7 days)

---

## Database Migrations

### Required Migrations

Run this migration to align Better Auth database with backend schema:

```sql
-- auth-server/src/migrations/001_add_password_tracking.sql

-- Add password tracking fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE;

-- Create password history table
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- Set defaults for existing users
UPDATE "user"
SET password_last_changed = created_at
WHERE password_last_changed IS NULL;

UPDATE "user"
SET password_expires_at = password_last_changed + INTERVAL '90 days'
WHERE password_expires_at IS NULL;
```

---

## Migration Strategy

1.  **Internal Testing (Current)**: Better Auth is available behind the `VITE_USE_BETTER_AUTH` feature flag. The `UnifiedAuthProvider` switches between legacy and Better Auth, allowing both systems to run in parallel for internal validation.
2.  **Phased Rollout**:
    - **Week 1-2**: Internal testing with Better Auth enabled.
    - **Week 3-4**: Phased rollout to 10% of users.
    - **Week 5-6**: Expand to 50% of users.
    - **Week 7-8**: Full migration to 100% of users.

### Phase 3: Legacy Cleanup

- Remove legacy auth code
- Remove feature flag
- Archive legacy auth documentation

---

## Technical Debt & Future Enhancements

1.  **Cross-System Integration Tests**: While tests are created, they need to be integrated into the CI/CD pipeline (GitHub Actions workflow).
2.  **Observability**: Basic logging is in place, but exporting metrics to Prometheus/Grafana for better monitoring is needed.
3.  **Session Storage Optimization**: Currently, both `localStorage` and cookies are used. This should be consolidated to `httpOnly` cookies for enhanced security.

---

---

## Troubleshooting

### Common Issues & Solutions

**Issue**: Password accepted in frontend but rejected by backend

- **Cause**: Frontend validation out of sync
- **Fix**: Ensure `validatePasswordStrength()` matches across systems

**Issue**: JWT token rejected with "invalid issuer"

- **Cause**: Backend not updated with iss/aud validation
- **Fix**: Verify backend JWT validation includes issuer/audience

**Issue**: Rate limiting inconsistent

- **Cause**: Migration not run
- **Fix**: Run `001_add_password_tracking.sql` migration

---

## Testing

### Manual Testing Checklist

- [ ] Register with weak password (should fail)
- [ ] Register with strong password (should succeed)
- [ ] Login with correct credentials
- [ ] Login with wrong password 6 times (should be rate limited)
- [ ] Check JWT token has iss/aud fields
- [ ] Verify `password_last_changed` and `password_expires_at` are set on registration
- [ ] Test password expiry warning (manually set expiry date)
- [ ] Test forced password change flow

### Automated Tests

Run integration tests:

```bash
npm run test:integration -- tests/integration/auth-cross-system.spec.ts
```

---

## Monitoring & Observability

### Key Metrics to Track

- `auth_password_policy_failures_total` - Password validation failures by reason
- `auth_login_attempts_total` - Login attempts (success/failure)
- `auth_account_lockouts_total` - Account lockouts by reason
- `auth_password_expiry_warnings_total` - Expiry warnings shown
- `auth_forced_password_changes_total` - Forced password changes
- `auth_token_validation_failures_total` - JWT validation failures

### Log Format

Structured JSON logs:

```json
{
  "timestamp": "2025-11-30T12:00:00Z",
  "event": "password_policy_failure",
  "reason": "validation_failed",
  "feedback": ["Password must contain at least one uppercase letter"],
  "email": "user@example.com"
}
```

---

## Security Best Practices

1. **JWT Secret Rotation**
   - Plan quarterly secret rotation
   - Use grace period for old tokens

2. **Password Hashing**
   - Bcrypt cost 12 is current standard
   - Monitor CPU usage, may need adjustment

3. **Rate Limiting**
   - Current: 5 attempts per 15 minutes
   - Tune based on attack patterns

4. **Session Security**
   - HttpOnly cookies prevent XSS
   - Secure flag required in production
   - SameSite=Strict prevents CSRF

---

## Support

- **Tech Lead**: [Your Name]
- **Documentation**: This file + inline code comments
- **Issues**: GitHub Issues with `auth` label
- **Security**: security@yourcompany.com (private disclosure)

---

## Changelog

### 2025-11-30 - Initial SSOT Release

- Unified password policy across all systems
- Added JWT issuer/audience validation
- Removed redundant token refresh
- Removed client-side rate limiting
- Added cross-system integration tests
- Synced environment variables
- Added observability logging

---

## References

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
