# Better Auth Server

Authentication server for the Reconciliation Platform using Better Auth.

## Features

- ✅ Email/password authentication with bcrypt (cost 12)
- ✅ Google OAuth integration
- ✅ JWT token generation and validation
- ✅ Session management (30-minute expiry)
- ✅ Token refresh mechanism
- ✅ Password strength validation
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Compatible with existing PostgreSQL schema

## Quick Start

### 1. Install Dependencies

```bash
cd auth-server
npm install
```

### 2. Configure Environment

Copy `env.example` to `.env` and update with your values:

```bash
cp env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Must match your backend JWT secret
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google OAuth

### 3. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:4000`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Compatibility Endpoints (Match Existing API)

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Better Auth Native Endpoints

- `POST /api/auth/sign-in/email` - Better Auth email sign-in
- `POST /api/auth/sign-up/email` - Better Auth email sign-up
- `GET /api/auth/session` - Get current session
- `POST /api/auth/sign-out` - Sign out
- All Better Auth endpoints available under `/api/auth/*`

### Health Check

- `GET /health` - Server health status

## Database Schema

Works with existing `users` table:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'user', -- Maps to role
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  password_last_changed TIMESTAMP,
  password_expires_at TIMESTAMP
);
```

## Configuration

### Password Policy

- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Checks against common passwords
- Configurable expiration (default: 90 days)

### Session Management

- Session expiry: 30 minutes (configurable)
- Token refresh interval: 25 minutes (frontend)
- Refresh token validity: 7 days (configurable)

### Rate Limiting

- Max 5 login attempts per 15 minutes
- Configurable per endpoint

## Docker

Build and run with Docker:

```bash
docker build -f ../docker/auth-server.dockerfile -t auth-server .
docker run -p 4000:4000 --env-file .env auth-server
```

## Development

### Watch Mode

```bash
npm run dev
```

### Type Checking

```bash
npx tsc --noEmit
```

### Testing

```bash
npm test
```

## Integration with Existing System

### Frontend Integration

Update `frontend/src/services/apiClient/index.ts`:

```typescript
const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:4000';

// Use AUTH_SERVER_URL for auth endpoints
async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const config = this.requestBuilder.method('POST').body(credentials).skipAuth().build();
  return this.makeRequest<LoginResponse>(`${AUTH_SERVER_URL}/api/auth/login`, config);
}
```

### Backend Integration

Update Rust middleware to validate Better Auth tokens:

```rust
// Introspect token with Better Auth server
let response = client
    .post("http://localhost:4000/api/auth/session")
    .header("Authorization", format!("Bearer {}", token))
    .send()
    .await?;
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network connectivity

### Google OAuth Issues

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI matches Google Console configuration
- Ensure frontend origin is in allowed origins

### Token Validation Issues

- Ensure `JWT_SECRET` matches between auth server and backend
- Check token expiration times
- Verify CORS configuration

## Migration from Legacy Auth

See [BETTER_AUTH_AGENT_TASKS.md](../BETTER_AUTH_AGENT_TASKS.md) for complete migration guide.

## License

Same as main project

