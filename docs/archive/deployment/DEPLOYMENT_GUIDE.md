# 378 Reconciliation Platform - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the 378 Reconciliation Platform in various environments, from development to production.

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows
- **Memory**: Minimum 4GB RAM (8GB+ recommended for production)
- **Storage**: Minimum 20GB free space (100GB+ recommended for production)
- **CPU**: 2+ cores (4+ cores recommended for production)

### Required Software

- **Rust**: 1.70+ (for backend)
- **Node.js**: 18+ (for frontend)
- **PostgreSQL**: 13+ (database)
- **Redis**: 6+ (caching and sessions)
- **Docker**: 20+ (optional, for containerized deployment)
- **Docker Compose**: 2+ (optional, for containerized deployment)

## Environment Setup

### Development Environment

1. **Clone the repository**
```bash
git clone https://github.com/your-org/378-reconciliation-platform.git
cd 378-reconciliation-platform
```

2. **Set up environment variables**
```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

3. **Configure database**
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE reconciliation_platform;
CREATE USER reconciliation_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE reconciliation_platform TO reconciliation_user;
\q
```

4. **Install Redis**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

5. **Set up backend**
```bash
cd backend
cargo build
cargo run
```

6. **Set up frontend**
```bash
cd frontend
npm install
npm run dev
```

### Production Environment

#### Option 1: Manual Deployment

1. **Prepare server**
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y curl build-essential pkg-config libssl-dev
```

2. **Install Rust**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup default stable
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install PostgreSQL**
```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

5. **Install Redis**
```bash
sudo apt-get install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

6. **Configure database**
```bash
sudo -u postgres psql
CREATE DATABASE reconciliation_platform;
CREATE USER reconciliation_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE reconciliation_platform TO reconciliation_user;
\q
```

7. **Deploy application**
```bash
# Clone repository
git clone https://github.com/your-org/378-reconciliation-platform.git
cd 378-reconciliation-platform

# Build backend
cd backend
cargo build --release

# Build frontend
cd ../frontend
npm install
npm run build
```

8. **Set up systemd service**
```bash
sudo nano /etc/systemd/system/reconciliation-platform.service
```

```ini
[Unit]
Description=378 Reconciliation Platform
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/378-reconciliation-platform/backend
ExecStart=/path/to/378-reconciliation-platform/backend/target/release/reconciliation-platform
Restart=always
RestartSec=5
Environment=RUST_LOG=info
Environment=DATABASE_URL=postgresql://reconciliation_user:secure_password@localhost/reconciliation_platform
Environment=REDIS_URL=redis://localhost:6379
Environment=JWT_SECRET=your_jwt_secret
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

9. **Start service**
```bash
sudo systemctl daemon-reload
sudo systemctl start reconciliation-platform
sudo systemctl enable reconciliation-platform
```

10. **Set up reverse proxy (Nginx)**
```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/reconciliation-platform
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/378-reconciliation-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/reconciliation-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Option 2: Docker Deployment

1. **Create Docker Compose file**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: reconciliation_platform
      POSTGRES_USER: reconciliation_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://reconciliation_user:secure_password@postgres:5432/reconciliation_platform
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret
      PORT: 8080
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

2. **Create Dockerfiles**

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM rust:1.70 as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/reconciliation-platform .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080
CMD ["./reconciliation-platform"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

3. **Deploy with Docker Compose**
```bash
docker-compose up -d
```

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://reconciliation_user:secure_password@localhost/reconciliation_platform

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# Server
PORT=8080
HOST=0.0.0.0
RUST_LOG=info

# File Upload
MAX_FILE_SIZE=100MB
UPLOAD_DIR=./uploads

# Security
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# WebSocket
WS_HEARTBEAT_INTERVAL=30
WS_MAX_CONNECTIONS=1000

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Frontend (.env)

```bash
# API
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# App
VITE_APP_NAME=378 Reconciliation Platform
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_FILE_UPLOAD=true
```

## Database Migrations

1. **Run migrations**
```bash
cd backend
diesel migration run
```

2. **Verify migrations**
```bash
diesel migration list
```

3. **Rollback if needed**
```bash
diesel migration redo
```

## SSL/TLS Configuration

### Let's Encrypt (Recommended)

1. **Install Certbot**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

2. **Obtain certificate**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **Auto-renewal**
```bash
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Self-Signed Certificate (Development)

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate
openssl req -new -x509 -key private.key -out certificate.crt -days 365

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/reconciliation-platform
```

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # ... rest of configuration
}
```

## Monitoring and Logging

### Application Logs

1. **Configure log rotation**
```bash
sudo nano /etc/logrotate.d/reconciliation-platform
```

```
/var/log/reconciliation-platform/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload reconciliation-platform
    endscript
}
```

2. **Set up log monitoring**
```bash
# Install log monitoring tools
sudo apt-get install -y logwatch

# Configure logwatch
sudo nano /etc/logwatch/conf/logwatch.conf
```

### System Monitoring

1. **Install monitoring tools**
```bash
sudo apt-get install -y htop iotop nethogs
```

2. **Set up Prometheus (optional)**
```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64

# Configure Prometheus
nano prometheus.yml
```

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'reconciliation-platform'
    static_configs:
      - targets: ['localhost:9090']
```

## Backup and Recovery

### Database Backup

1. **Create backup script**
```bash
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/reconciliation_platform_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U reconciliation_user -d reconciliation_platform > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

2. **Make executable and schedule**
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### File Backup

1. **Create file backup script**
```bash
sudo nano /usr/local/bin/backup-files.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/uploads_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_FILE /path/to/uploads

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "File backup completed: $BACKUP_FILE"
```

### Recovery Procedures

1. **Database recovery**
```bash
# Stop application
sudo systemctl stop reconciliation-platform

# Restore database
gunzip -c /backups/database/reconciliation_platform_20240101_020000.sql.gz | psql -h localhost -U reconciliation_user -d reconciliation_platform

# Start application
sudo systemctl start reconciliation-platform
```

2. **File recovery**
```bash
# Stop application
sudo systemctl stop reconciliation-platform

# Restore files
tar -xzf /backups/files/uploads_20240101_020000.tar.gz -C /

# Start application
sudo systemctl start reconciliation-platform
```

## Performance Optimization

### Database Optimization

1. **Configure PostgreSQL**
```bash
sudo nano /etc/postgresql/13/main/postgresql.conf
```

```conf
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100

# Logging
log_statement = 'mod'
log_min_duration_statement = 1000
```

2. **Restart PostgreSQL**
```bash
sudo systemctl restart postgresql
```

### Redis Optimization

1. **Configure Redis**
```bash
sudo nano /etc/redis/redis.conf
```

```conf
# Memory settings
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

2. **Restart Redis**
```bash
sudo systemctl restart redis-server
```

### Application Optimization

1. **Configure systemd limits**
```bash
sudo nano /etc/systemd/system/reconciliation-platform.service
```

```ini
[Unit]
Description=378 Reconciliation Platform
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/378-reconciliation-platform/backend
ExecStart=/path/to/378-reconciliation-platform/backend/target/release/reconciliation-platform
Restart=always
RestartSec=5
Environment=RUST_LOG=info
Environment=DATABASE_URL=postgresql://reconciliation_user:secure_password@localhost/reconciliation_platform
Environment=REDIS_URL=redis://localhost:6379
Environment=JWT_SECRET=your_jwt_secret
Environment=PORT=8080
LimitNOFILE=65536
LimitNPROC=32768

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U reconciliation_user -d reconciliation_platform

# Check logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

2. **Redis connection errors**
```bash
# Check Redis status
sudo systemctl status redis-server

# Check connection
redis-cli ping

# Check logs
sudo tail -f /var/log/redis/redis-server.log
```

3. **Application errors**
```bash
# Check application status
sudo systemctl status reconciliation-platform

# Check logs
sudo journalctl -u reconciliation-platform -f

# Check application logs
sudo tail -f /var/log/reconciliation-platform/app.log
```

4. **Nginx errors**
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Issues

1. **High memory usage**
```bash
# Check memory usage
free -h
htop

# Check application memory
sudo systemctl show reconciliation-platform --property=MemoryCurrent
```

2. **Slow database queries**
```bash
# Check slow queries
sudo tail -f /var/log/postgresql/postgresql-13-main.log | grep "slow query"

# Analyze database
psql -h localhost -U reconciliation_user -d reconciliation_platform -c "SELECT * FROM pg_stat_activity;"
```

3. **High CPU usage**
```bash
# Check CPU usage
top
htop

# Check application CPU
sudo systemctl show reconciliation-platform --property=CPUUsageNSec
```

## Security Considerations

### Firewall Configuration

```bash
# Install UFW
sudo apt-get install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Database Security

1. **Secure PostgreSQL**
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/13/main/postgresql.conf
```

```conf
# Security settings
ssl = on
password_encryption = scram-sha-256
```

2. **Edit pg_hba.conf**
```bash
sudo nano /etc/postgresql/13/main/pg_hba.conf
```

```conf
# Local connections
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

### Application Security

1. **Set secure file permissions**
```bash
sudo chown -R www-data:www-data /path/to/378-reconciliation-platform
sudo chmod -R 755 /path/to/378-reconciliation-platform
sudo chmod 600 /path/to/378-reconciliation-platform/.env
```

2. **Configure fail2ban**
```bash
sudo apt-get install -y fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

## Maintenance

### Regular Maintenance Tasks

1. **Update system packages**
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

2. **Update application**
```bash
cd /path/to/378-reconciliation-platform
git pull origin main
cd backend && cargo build --release
cd ../frontend && npm install && npm run build
sudo systemctl restart reconciliation-platform
```

3. **Clean up logs**
```bash
sudo logrotate -f /etc/logrotate.d/reconciliation-platform
```

4. **Monitor disk space**
```bash
df -h
du -sh /path/to/uploads
```

### Health Checks

1. **Create health check script**
```bash
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash

# Check database
if ! pg_isready -h localhost -U reconciliation_user -d reconciliation_platform; then
    echo "Database is not responding"
    exit 1
fi

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis is not responding"
    exit 1
fi

# Check application
if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "Application is not responding"
    exit 1
fi

echo "All services are healthy"
exit 0
```

2. **Schedule health checks**
```bash
sudo chmod +x /usr/local/bin/health-check.sh
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/health-check.sh
```

## Support and Resources

### Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [User Guide](./USER_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Community
- [GitHub Issues](https://github.com/your-org/378-reconciliation-platform/issues)
- [Discord Community](https://discord.gg/your-discord)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/378-reconciliation)

### Professional Support
- **Email**: support@378reconciliation.com
- **Phone**: +1-555-0123
- **Business Hours**: Monday-Friday, 9AM-5PM EST
