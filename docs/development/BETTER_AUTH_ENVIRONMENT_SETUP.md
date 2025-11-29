# Better Auth Environment Configuration

This document describes the environment variables needed for Better Auth integration.

## Required Environment Variables

### Better Auth Configuration

```bash
# Better Auth server URL
AUTH_SERVER_URL=http://localhost:3001

# Better Auth JWT secret (should match auth-server JWT_SECRET)
BETTER_AUTH_JWT_SECRET=your-better-auth-jwt-secret-here

# Prefer Better Auth over legacy auth (default: true)
PREFER_BETTER_AUTH=true

# Enable dual authentication mode (supports both legacy and Better Auth)
ENABLE_DUAL_AUTH=true

# Enable Better Auth features
ENABLE_BETTER_AUTH=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_OAUTH=true
```

### Legacy Auth Configuration (Deprecated)

```bash
# Legacy JWT secret (will be phased out after migration)
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRATION=1800
```

### Database Configuration

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/reconciliation_db
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/reconciliation_test_db
```

### Redis Configuration

```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

### CORS Configuration

```bash
# Allowed origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001

# Allow localhost origins in development
ALLOW_LOCALHOST_ORIGINS=true
```

### OAuth Configuration (Google)

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback/google
```

### Security Configuration

```bash
# BCrypt cost factor (minimum 12 recommended)
BCRYPT_COST=12

# Session timeout in minutes
SESSION_TIMEOUT_MINUTES=30

# Rate limiting
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Token cache TTL in seconds
TOKEN_CACHE_TTL=300
```

### Email Configuration

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourapp.com
```

### Development Configuration

```bash
ENVIRONMENT=development
LOG_LEVEL=info
DEBUG=false

# DANGER: Only use in development/testing
DISABLE_AUTH=false
```

## Setup Instructions

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Better Auth Server

Ensure the auth-server has matching configuration:

```bash
# In auth-server/.env
JWT_SECRET=<same-as-BETTER_AUTH_JWT_SECRET>
DATABASE_URL=<same-as-backend-DATABASE_URL>
PORT=3001
```

### 3. Generate Secrets

Use secure random generation for secrets:

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using openssl
openssl rand -hex 32
```

### 4. Update CORS Origins

In production, update `CORS_ORIGINS` to include only your frontend and auth server URLs:

```bash
CORS_ORIGINS=https://app.yourdomain.com,https://auth.yourdomain.com
ALLOW_LOCALHOST_ORIGINS=false
```

### 5. Configure OAuth Providers

#### Google OAuth Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google` (development)
   - `https://auth.yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env`

## Migration Workflow

### Phase 1: Dual Mode (Recommended)

```bash
ENABLE_DUAL_AUTH=true
PREFER_BETTER_AUTH=true
ENABLE_BETTER_AUTH=true
```

This allows both legacy and Better Auth to work simultaneously.

### Phase 2: Better Auth Only

After all users are migrated:

```bash
ENABLE_DUAL_AUTH=false
PREFER_BETTER_AUTH=true
ENABLE_BETTER_AUTH=true
```

### Phase 3: Cleanup

Remove legacy auth environment variables and code.

## Validation

Run the environment validation script:

```bash
npm run validate:env
```

## Security Checklist

- [ ] All secrets are randomly generated (min 32 bytes)
- [ ] `BETTER_AUTH_JWT_SECRET` matches auth-server `JWT_SECRET`
- [ ] `BCRYPT_COST` is set to 12 or higher
- [ ] `CORS_ORIGINS` only includes trusted domains (production)
- [ ] `ALLOW_LOCALHOST_ORIGINS=false` in production
- [ ] `DISABLE_AUTH=false` in production (never enable)
- [ ] OAuth redirect URIs match configuration
- [ ] Email SMTP credentials are valid
- [ ] Database URLs are correct and secure

## Troubleshooting

### Token Validation Fails

- Verify `BETTER_AUTH_JWT_SECRET` matches auth-server configuration
- Check auth server is running on `AUTH_SERVER_URL`
- Verify CORS configuration allows auth server origin

### OAuth Not Working

- Check OAuth credentials in Google Cloud Console
- Verify redirect URI matches exactly (including protocol and port)
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Run migrations: `npm run migrate`

### Redis Connection Issues

- Verify `REDIS_URL` is correct
- Check Redis is running: `redis-cli ping`
- Check Redis password if configured

## Related Documentation

- [Better Auth Migration Guide](../architecture/BETTER_AUTH_MIGRATION_GUIDE.md)
- [Security Best Practices](../security/SECURITY_BEST_PRACTICES.md)
- [OAuth Setup Guide](../authentication/OAUTH_SETUP_GUIDE.md)

