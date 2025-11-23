# Google OAuth Setup Guide

## Why Google OAuth Button Isn't Showing

The Google OAuth button doesn't show because `VITE_GOOGLE_CLIENT_ID` is not configured in the `.env` file.

## Quick Fix

### Option 1: Enable Google OAuth (Recommended for Production)

1. **Get Google OAuth Client ID**:
   - Go to: <https://console.cloud.google.com/apis/credentials>
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Reconciliation Platform"
   - Authorized JavaScript origins: `http://localhost:1000`
   - Authorized redirect URIs: `http://localhost:1000/login`
   - Click "Create"
   - Copy the **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)

2. **Add to .env file**:
   ```bash
   cd frontend
   # Edit .env file
   # Change this line:
   VITE_GOOGLE_CLIENT_ID=
   # To:
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   ```

3. **Restart Frontend**:
   ```bash
   # Stop frontend (Ctrl+C)
   npm run dev
   ```

4. **Verify**: Google Sign-In button should now appear on the login page

### Option 2: Keep Google OAuth Disabled (For Development)

If you don't need Google OAuth right now:
- The login page will show a helpful message: "Google Sign-In is not configured..."
- Regular email/password login will still work
- You can add Google OAuth later when needed

## Current Status

- ✅ **Code is ready** - Google OAuth implementation is complete
- ✅ **Configuration file created** - `.env` file exists with template
- ⚠️ **Client ID not set** - Need to add `VITE_GOOGLE_CLIENT_ID` to enable

## Testing

After adding the Client ID and restarting frontend:

1. Open: `http://localhost:1000/login`
2. You should see:
   - ✅ Google Sign-In button (if Client ID is set)
   - ✅ Or helpful message (if Client ID is not set)
3. Click Google button → Should open Google sign-in popup
4. After signing in → Should redirect back and authenticate

## Troubleshooting

### Button still not showing after adding Client ID
- Make sure you restarted the frontend dev server
- Check browser console for errors
- Verify `.env` file is in `frontend/` directory
- Check that `VITE_GOOGLE_CLIENT_ID` has no quotes or spaces

### Google Sign-In popup doesn't open
- Check browser console for errors
- Verify authorized JavaScript origins include `http://localhost:1000`
- Make sure popup blocker is not blocking it

### "Token audience mismatch" error
- Verify `GOOGLE_CLIENT_ID` in backend `.env` matches frontend `VITE_GOOGLE_CLIENT_ID`
- Or leave backend `GOOGLE_CLIENT_ID` empty (validation will be skipped)

## Backend Configuration (Optional)

The backend can also validate the Google token audience. Add to `backend/.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
```

This is optional - if not set, the backend will accept any valid Google token.

## Authentication Requirements

### Username/Email Requirements

**Email Format:**
- Must be a valid email address format
- Pattern: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- Maximum length: 254 characters
- Required for both login and registration
- Email is used as the username (no separate username field)

**Examples:**
- ✅ Valid: `user@example.com`, `john.doe@company.co.uk`
- ❌ Invalid: `invalid-email`, `@example.com`, `user@`

**For Google OAuth:**
- Email is automatically extracted from Google account
- Email must be verified by Google
- If email is not verified, authentication will fail

### Password Requirements

**Password Rules:**
- **Minimum length**: 8 characters
- **Maximum length**: 128 characters
- **Required character types**:
  - At least one **uppercase letter** (A-Z)
  - At least one **lowercase letter** (a-z)
  - At least one **digit** (0-9)
  - At least one **special character** from: `@$!%*?&`

**Allowed Characters:**
- Letters: A-Z, a-z
- Digits: 0-9
- Special characters: `@$!%*?&` only
- Other special characters are **not allowed**

**Password Examples:**
- ✅ Valid: `MyP@ssw0rd`, `Secure123!`, `Test@2024`
- ❌ Invalid:
  - `password` (no uppercase, no digit, no special char)
  - `PASSWORD123` (no lowercase, no special char)
  - `Pass123` (too short, no special char)
  - `MyPass#123` (contains `#` which is not allowed)

**Password Strength:**
- **Weak**: Meets minimum requirements only
- **Medium**: 12+ characters with good character variety
- **Strong**: 12+ characters with all character types and good complexity

**Banned Passwords:**
The following common passwords are rejected:
- `password`, `12345678`, `password123`
- `admin123`, `qwerty123`, `welcome123`
- `letmein`, `monkey`, `dragon`, `master`

**Password Security:**
- Passwords are hashed using bcrypt (cost factor 12+)
- Passwords are never stored in plain text
- Passwords are never logged or exposed in error messages
- Password validation happens on both frontend and backend

### Registration Requirements

**Required Fields:**
1. **Email** - Valid email address (see Email Requirements above)
2. **Password** - Must meet all password requirements
3. **Confirm Password** - Must match the password exactly
4. **First Name** - 1-100 characters, required
5. **Last Name** - 1-100 characters, required

**Optional Fields:**
- **Role** - User role (defaults to "user" if not provided)

**Registration Flow:**
1. User fills out registration form
2. Frontend validates all fields
3. Backend validates and creates user account
4. Password is hashed and stored securely
5. User account is created with "active" status
6. User can immediately log in

### Login Requirements

**Required Fields:**
1. **Email** - Must match a registered user's email
2. **Password** - Must match the user's password

**Login Flow:**
1. User enters email and password
2. Backend verifies email exists
3. Backend verifies password hash matches
4. Backend checks if account is active
5. JWT token is generated and returned
6. User is authenticated and redirected to dashboard

**Account Status:**
- Only accounts with status "active" can log in
- Deactivated accounts will receive: "Account is deactivated"
- Invalid credentials will receive: "Invalid credentials" (for security, doesn't specify if email or password is wrong)

### Google OAuth vs Email/Password

**Email/Password Authentication:**
- User creates account with email and password
- Password is hashed and stored in database
- User logs in with email and password
- Password manager master key = user's login password (stored in memory during session)

**Google OAuth Authentication:**
- User authenticates with Google account
- No password stored in our database
- Email and profile info extracted from Google token
- Password manager master key = SHA-256(email + JWT_SECRET) (derived, not stored)
- User account is created automatically on first Google sign-in

**Key Differences:**
- OAuth users don't have a password to change
- OAuth users can use password manager (master key is derived)
- OAuth users can't reset password (no password exists)
- Both authentication methods support password manager features

## Recommendations

### Security Best Practices

#### 1. Password Management

**For Users:**
- Use a password manager to generate strong, unique passwords
- Never reuse passwords across different services
- Change passwords periodically (recommended: every 90 days)
- Enable two-factor authentication when available
- Use Google OAuth when possible to reduce password exposure

**For Administrators:**
- Enforce password complexity requirements (already implemented)
- Monitor for password breaches using Have I Been Pwned API
- Implement password history to prevent reuse
- Set password expiration policies for sensitive accounts
- Consider implementing password strength meters in UI

#### 2. Account Security

**User Account Protection:**
- Use a unique, strong password for your account
- Don't share your account credentials with anyone
- Log out when using shared or public devices
- Monitor your account for suspicious activity
- Review active sessions regularly
- Enable email notifications for login attempts

**Administrative Security:**
- Implement account lockout after failed login attempts (recommended: 5 attempts, 15-minute lockout)
- Monitor authentication events for anomalies
- Set up alerts for multiple failed login attempts
- Review and deactivate inactive accounts regularly
- Implement IP-based access controls for sensitive operations

#### 3. Google OAuth Security

**Best Practices:**
- Use Google OAuth for easier authentication (no password to remember)
- Ensure your Google account has strong security (2FA enabled)
- Review Google account permissions regularly
- Use separate Google accounts for development and production
- Monitor OAuth token usage and expiration
- Implement token refresh mechanisms
- Validate token audience in production (set `GOOGLE_CLIENT_ID` in backend)

**Configuration:**
- Use different OAuth client IDs for development and production
- Restrict authorized JavaScript origins to specific domains
- Limit authorized redirect URIs to necessary endpoints only
- Regularly rotate OAuth client secrets
- Monitor OAuth consent screen for changes

#### 4. JWT Token Security

**Token Management:**
- Use short token expiration times (recommended: 15-30 minutes)
- Implement token refresh mechanism for long-lived sessions
- Store tokens securely (httpOnly cookies preferred over localStorage)
- Validate token signature on every request
- Implement token revocation for logout
- Monitor token usage patterns for anomalies

**Production Considerations:**
- Use strong JWT secret (minimum 256 bits, randomly generated)
- Rotate JWT secrets periodically (recommended: every 90 days)
- Implement token blacklisting for revoked tokens
- Set appropriate CORS policies
- Use HTTPS only in production (required for secure token transmission)

#### 5. Input Validation and Sanitization

**Validation Requirements:**
- Validate all user inputs on both frontend and backend
- Sanitize email addresses before storage
- Validate password strength before hashing
- Reject suspicious patterns (SQL injection, XSS attempts)
- Implement rate limiting on authentication endpoints
- Log validation failures for security monitoring

**Implementation:**
- Use type-safe validation (Zod for frontend, serde for backend)
- Implement input length limits
- Escape special characters in user-generated content
- Validate file uploads (type, size, content)
- Use parameterized queries for database operations

### Development Recommendations

#### 1. Environment Variables

**Security:**
- Never commit `.env` files to version control
- Use `.env.example` as a template with placeholder values
- Keep production credentials secure (use secret management services)
- Rotate credentials periodically (recommended: every 90 days)
- Use different credentials for development, staging, and production
- Implement credential rotation procedures

**Organization:**
- Document all required environment variables
- Group related variables together
- Use descriptive variable names
- Set default values where appropriate
- Validate required variables on application startup

**Example `.env.example` structure:**
```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRATION=3600

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

#### 2. Testing

**Authentication Flow Testing:**
- Test both email/password and Google OAuth flows
- Test password validation with various inputs (valid, invalid, edge cases)
- Test account deactivation scenarios
- Test error handling and user feedback
- Test token expiration and refresh
- Test concurrent login attempts
- Test account lockout mechanisms

**Security Testing:**
- Test SQL injection prevention
- Test XSS prevention
- Test CSRF protection
- Test rate limiting
- Test input validation boundaries
- Test password strength requirements
- Test token validation and expiration

**Integration Testing:**
- Test OAuth callback handling
- Test token verification with Google's API
- Test user creation/retrieval flows
- Test password hashing and verification
- Test JWT token generation and validation
- Test session management

**Test Coverage Goals:**
- Aim for >80% code coverage on authentication handlers
- Test all error paths
- Test all validation rules
- Test security edge cases
- Use automated testing in CI/CD pipeline

#### 3. Code Quality

**Best Practices:**
- Follow SSOT (Single Source of Truth) principles
- Keep authentication logic centralized
- Use consistent error handling patterns
- Implement proper logging (mask PII in logs)
- Document authentication flows
- Use type-safe validation throughout
- Implement proper error messages (don't leak information)

**Code Organization:**
- Separate authentication logic from business logic
- Use service layers for authentication operations
- Implement middleware for cross-cutting concerns
- Keep validation rules in dedicated modules
- Use dependency injection for testability

#### 4. Error Handling

**User-Facing Errors:**
- Provide clear, actionable error messages
- Don't expose internal system details
- Use consistent error formats
- Mask sensitive information (emails, tokens)
- Provide helpful guidance for common errors

**Security Considerations:**
- Don't reveal if email exists in system
- Use generic error messages for authentication failures
- Log detailed errors server-side only
- Implement error rate limiting
- Monitor error patterns for attacks

**Error Response Format:**
```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid credentials",
    "details": {}
  }
}
```

### Production Deployment Recommendations

#### 1. Google OAuth Configuration

**Required Steps:**
- Update Google OAuth redirect URIs for production domain
- Add production domain to authorized JavaScript origins
- Configure OAuth consent screen for production
- Set up OAuth scopes appropriately (email, profile, openid)
- Test OAuth flow in production environment
- Monitor OAuth token validation errors

**Production URLs:**
- Authorized JavaScript origins: `https://yourdomain.com`
- Authorized redirect URIs: `https://yourdomain.com/login`
- Update both frontend and backend environment variables

#### 2. HTTPS and Security Headers

**HTTPS Requirements:**
- Use HTTPS in production (required for OAuth)
- Obtain valid SSL/TLS certificates
- Configure certificate auto-renewal
- Use HSTS (HTTP Strict Transport Security)
- Redirect HTTP to HTTPS

**Security Headers:**
- Implement Content Security Policy (CSP)
- Set X-Frame-Options to prevent clickjacking
- Set X-Content-Type-Options: nosniff
- Set Referrer-Policy appropriately
- Configure CORS properly for production domains

#### 3. Monitoring and Logging

**Authentication Monitoring:**
- Log all authentication attempts (success and failure)
- Monitor failed login rates
- Track OAuth token validation errors
- Monitor token expiration patterns
- Set up alerts for suspicious activity

**Metrics to Track:**
- Authentication success/failure rates
- Average authentication time
- Token generation/validation performance
- OAuth callback success rates
- Account lockout events
- Password reset requests

**Logging Best Practices:**
- Mask PII in logs (emails, tokens, passwords)
- Use structured logging (JSON format)
- Include correlation IDs for request tracking
- Log security events separately
- Implement log rotation and retention policies

#### 4. Performance Optimization

**Authentication Performance:**
- Use connection pooling for database queries
- Cache user lookups where appropriate
- Optimize password hashing (use appropriate bcrypt cost)
- Implement token caching for validation
- Use async operations for I/O-bound tasks

**OAuth Optimization:**
- Cache Google token validation results (with appropriate TTL)
- Implement request timeouts for external API calls
- Use connection pooling for HTTP clients
- Monitor external API response times

#### 5. Scalability Considerations

**Horizontal Scaling:**
- Use stateless authentication (JWT tokens)
- Implement shared session storage if needed
- Use distributed caching for token blacklists
- Consider using Redis for session management
- Implement load balancing for authentication endpoints

**Database Optimization:**
- Index email columns for fast lookups
- Use read replicas for user queries
- Implement connection pooling
- Monitor database query performance
- Consider caching frequently accessed user data

#### 6. Backup and Recovery

**Data Protection:**
- Regular database backups (recommended: daily)
- Backup user authentication data
- Test backup restoration procedures
- Implement disaster recovery plans
- Document recovery procedures

**Credential Management:**
- Backup environment variable configurations securely
- Store credentials in secure vaults
- Document credential rotation procedures
- Implement credential recovery processes

### Maintenance Recommendations

#### 1. Regular Updates

**Dependencies:**
- Keep authentication libraries updated
- Monitor security advisories for dependencies
- Update bcrypt, JWT, and OAuth libraries regularly
- Test updates in staging before production
- Maintain changelog of security updates

**Google OAuth:**
- Monitor Google OAuth API changes
- Update OAuth implementation as needed
- Review Google Cloud Console settings regularly
- Update OAuth scopes if requirements change

#### 2. Security Audits

**Regular Audits:**
- Conduct security audits quarterly
- Review authentication logs for anomalies
- Test authentication flows for vulnerabilities
- Review and update security policies
- Perform penetration testing annually

**Compliance:**
- Review compliance requirements (GDPR, SOC 2, etc.)
- Implement necessary security controls
- Document security procedures
- Maintain audit trails
- Review access controls regularly

#### 3. Documentation

**Keep Updated:**
- Document authentication flows
- Update setup guides when configuration changes
- Maintain API documentation
- Document troubleshooting procedures
- Keep security policies current

**Knowledge Sharing:**
- Document common issues and solutions
- Share security best practices with team
- Conduct security training sessions
- Maintain runbooks for common tasks

### Implementation Status

**Completed Features:**
- ✅ Email/password registration and login
- ✅ Google OAuth integration
- ✅ Password strength validation (frontend and backend)
- ✅ Password hashing with bcrypt
- ✅ JWT token generation and validation
- ✅ Account status checking
- ✅ Password manager integration
- ✅ Security event logging
- ✅ Input validation and sanitization

**Future Enhancements:**

**Partially Implemented:**
- 🔄 **Password reset functionality** - Backend implemented, needs frontend UI integration
  - ✅ Backend: Token generation, validation, password update
  - ✅ Backend: Email service integration
  - ⏳ Frontend: Password reset request form
  - ⏳ Frontend: Password reset confirmation form
  - ⏳ Frontend: Email integration for sending reset links

- 🔄 **Account lockout after failed attempts** - Backend logic exists, needs integration
  - ✅ Backend: Login attempt tracking in SecurityService
  - ✅ Backend: Lockout detection logic (`is_account_locked`)
  - ✅ Backend: Security event logging
  - ⏳ Integration: Add lockout check to login handler
  - ⏳ Frontend: Show lockout message to users
  - ⏳ Frontend: Display remaining attempts

- 🔄 **Session management and device tracking** - Backend implemented, needs frontend
  - ✅ Backend: Session creation, validation, invalidation
  - ✅ Backend: Session activity tracking
  - ✅ Backend: Device/user agent tracking
  - ⏳ Frontend: Active sessions list
  - ⏳ Frontend: Session management UI
  - ⏳ Frontend: Device management

- 🔄 **Password expiration policies** - Partially implemented
  - ✅ Backend: Password expiration date storage
  - ✅ Backend: Password expiration on reset (90 days)
  - ⏳ Backend: Check expiration on login
  - ⏳ Frontend: Warn users before expiration
  - ⏳ Frontend: Force password change when expired

**Not Implemented:**
- ⏳ **Two-factor authentication (2FA)** - Not started
  - Need: TOTP implementation
  - Need: QR code generation
  - Need: Backup codes
  - Need: Frontend 2FA setup UI
  - Need: Frontend 2FA verification UI

- ⏳ **OAuth account linking** - Not started
  - Need: Link Google account to existing email/password account
  - Need: Unlink OAuth accounts
  - Need: Frontend account linking UI
  - Need: Backend account merge logic

## Additional Resources

- **Backend Authentication**: `backend/src/handlers/auth.rs`
- **Password Validation**: `backend/src/services/validation/password.rs`
- **Frontend Auth Page**: `frontend/src/pages/AuthPage.tsx`
- **Password Validation Utils**: `frontend/src/utils/passwordValidation.ts`
- **Password System Architecture**: `docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md`

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review browser console for errors
3. Check backend logs for authentication errors
4. Verify environment variables are set correctly
5. Ensure Google Cloud Console is configured properly
