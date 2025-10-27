# Environment Setup - Production Ready Configuration

**Date**: January 2025  
**Purpose**: Secure production configuration guide

---

## Required Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Critical Security Variables

```bash
# JWT Secret (CRITICAL - Generate a strong random secret)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRATION=86400  # 24 hours
```

**Generate Secure JWT Secret**:
```bash
openssl rand -base64 32
```

### Database Configuration

```bash
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
```

### Server Configuration

```bash
HOST=0.0.0.0
PORT=8080
```

### Security Configuration

```bash
# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:1000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_TIMEOUT=60
```

### File Upload Configuration

```bash
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads
```

### Logging Configuration

```bash
LOG_LEVEL=info  # Options: debug, info, warn, error
```

---

## Production Checklist

### Security
- [ ] Strong JWT secret generated
- [ ] Secure database credentials
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers enabled
- [ ] HTTPS enabled (in production)

### Performance
- [ ] Database connection pooling configured
- [ ] Redis caching enabled
- [ ] Circuit breaker configured
- [ ] Monitoring enabled

### Monitoring
- [ ] Prometheus metrics exported
- [ ] Logging configured
- [ ] Error tracking set up

---

## Quick Start

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your values

3. Generate JWT secret:
```bash
openssl rand -base64 32
```

4. Update `JWT_SECRET` in `.env`

5. Start the server:
```bash
cargo run
```

---

**Important**: Never commit `.env` file to version control!

