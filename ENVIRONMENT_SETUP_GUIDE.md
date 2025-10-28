# 🔧 ENVIRONMENT SETUP GUIDE
## Reconciliation Platform v1.0.0

**Purpose**: Configure environment variables for production deployment  
**Last Updated**: January 2025

---

## 📋 **QUICK START**

### Backend Setup

1. **Create environment file**:
```bash
cd backend
cp .env.example .env
# OR create manually
touch .env
```

2. **Required Variables** (minimum for development):
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app

# Redis
REDIS_URL=redis://localhost:6379

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRATION=86400

# Server
HOST=0.0.0.0
PORT=2000

# CORS
CORS_ORIGINS=http://localhost:1000,http://localhost:3000
```

3. **Production-Specific Variables**:
```bash
# Enable SMTP
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Security
ENABLE_CSRF=true
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
```

### Frontend Setup

1. **Create environment file**:
```bash
cd frontend
cp .env.example .env
```

2. **Required Variables**:
```bash
# API endpoints
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000

# Production URLs
# VITE_API_URL=https://api.yourdomain.com/api
# VITE_WS_URL=wss://api.yourdomain.com
```

---

## 📧 **SMTP CONFIGURATION**

### Gmail Setup (Recommended for Testing)

1. **Enable 2-Factor Authentication**:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASSWORD`

3. **Configure**:
```bash
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App password
SMTP_FROM=noreply@yourcompany.com
```

### Production SMTP Providers

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASSWORD=your-aws-secret-key
```

#### Postmark
```bash
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=your-postmark-server-token
SMTP_PASSWORD=your-postmark-server-token
```

---

## 🔒 **SECURITY REQUIREMENTS**

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use strong passwords for database
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure CORS properly for your domain
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CSRF protection
- [ ] Set up monitoring and alerting
- [ ] Enable automated backups

### JWT Secret Generation

```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🐳 **DOCKER DEPLOYMENT**

### Using Docker Compose

1. **Set Environment Variables**:
```bash
# Option 1: Use .env file (recommended)
cp .env.example .env
# Edit .env with your values

# Option 2: Export variables
export DATABASE_URL=postgresql://...
export JWT_SECRET=...
```

2. **Deploy**:
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. **Verify**:
```bash
# Check services
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Health check
curl http://localhost:做工00/health
```

---

## ✅ **VERIFICATION STEPS**

1. **Backend Health**:
```bash
curl http://localhost:2000/health
# Should return: {"status":"ok"}
```

2. **Frontend**:
```bash
curl http://localhost:1000
# Should return HTML
```

3. **Database Connection**:
```bash
# Check backend logs
docker-compose logs backend | grep "database"
# Should see: "Database connection established"
```

4. **Redis Connection**:
```bash
# Check backend logs
docker-compose logs backend | grep "redis"
# Should see: "Redis connection established"
```

5. **Email Service** (if enabled):
```bash
# Trigger password reset or email verification
# Check logs for "Email sent successfully"
docker-compose logs backend | grep "Email"
```

---

## 🚨 **TROUBLESHOOTING**

### Database Connection Error

**Error**: `Connection refused` or `Connection timeout`

**Solutions**:
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` format
3. Verify firewall rules
4. Check database credentials

### Redis Connection Error

**Error**: `Connection refused` or `Connection timeout`

**Solutions**:
1. Verify Redis is running
2. Check `REDIS_URL` format
3. Verify firewall rules

### SMTP Email Not Sending

**Error**: `Failed to send email` or `SMTP error`

**Solutions**:
1. Verify `SMTP_ENABLED=true`
2. Check SMTP credentials
3. Verify firewall allows SMTP port
4. Check SMTP provider limits
5. Review backend logs for detailed error

### CORS Errors in Frontend

**Error**: `CORS policy blocked`

**Solutions**:
1. Add frontend URL to `CORS_ORIGINS`
2. Check backend is running
3. Verify API endpoint URL in frontend `.env`

---

## 📚 **ADDITIONAL RESOURCES**

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Configuration](https://www.postgresql.org/docs/)
- [Redis Configuration](https://redis.io/documentation)
- [Lettre Email Library](https://docs.rs/lettre/)

---

**For Support**: Contact the platform team or check `README.md`

