# Reconciliation Platform - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Application Deployment](#application-deployment)
4. [Monitoring Setup](#monitoring-setup)
5. [Security Configuration](#security-configuration)
6. [Backup and Recovery](#backup-and-recovery)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or CentOS 8+
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended for production)
- **Storage**: 100GB+ SSD
- **Network**: 1Gbps connection

### Software Requirements
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (for frontend builds)
- **Rust**: 1.75+ (for backend builds)
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Nginx**: 1.20+

### Security Requirements
- **SSL Certificates**: Valid SSL certificates
- **Firewall**: Configured firewall rules
- **VPN Access**: Secure access to production environment
- **Backup Storage**: Secure backup storage location

## Infrastructure Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git vim htop tree

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Network Configuration

```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (internal)
sudo ufw allow 6379/tcp  # Redis (internal)
sudo ufw allow 2000/tcp  # Backend (internal)
sudo ufw allow 9090/tcp  # Prometheus (internal)
sudo ufw allow 3000/tcp  # Grafana (internal)
```

### 3. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d reconciliation-platform.com -d www.reconciliation-platform.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Application Deployment

### 1. Environment Configuration

```bash
# Create environment file
cat > .env << EOF
# Database
POSTGRES_PASSWORD=your-secure-postgres-password
DATABASE_URL=postgresql://reconciliation_user:your-secure-postgres-password@postgres:5432/reconciliation_app

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Application
CORS_ORIGIN=https://reconciliation-platform.com
NODE_ENV=production

# Monitoring
GRAFANA_PASSWORD=your-secure-grafana-password
GRAFANA_SECRET_KEY=your-secure-grafana-secret-key

# Backup
REMOTE_BACKUP_HOST=your-backup-server.com
REMOTE_BACKUP_USER=backup-user
REMOTE_BACKUP_DIR=/backup/reconciliation-platform
EOF
```

### 2. Docker Deployment

```bash
# Clone repository
git clone https://github.com/your-org/reconciliation-platform.git
cd reconciliation-platform

# Build and start services
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Verify deployment
docker-compose ps
docker-compose logs -f
```

### 3. Database Migration

```bash
# Run database migrations
docker-compose exec backend cargo run --bin migrate

# Verify database
docker-compose exec postgres psql -U reconciliation_user -d reconciliation_app -c "\dt"
```

## Monitoring Setup

### 1. Prometheus Configuration

```bash
# Verify Prometheus is running
curl http://localhost:9090/targets

# Check metrics
curl http://localhost:9090/api/v1/query?query=up
```

### 2. Grafana Setup

```bash
# Access Grafana
open http://localhost:3000

# Login with admin credentials
# Username: admin
# Password: (from GRAFANA_PASSWORD)

# Import dashboards
# 1. Go to Dashboards > Import
# 2. Upload dashboard JSON files from infrastructure/monitoring/grafana/
```

### 3. Alert Configuration

```bash
# Verify alert rules
docker-compose exec prometheus promtool check rules infrastructure/monitoring/alert_rules.yml

# Test alerts
docker-compose exec prometheus promtool test rules infrastructure/monitoring/alert_rules.yml
```

## Security Configuration

### 1. Nginx Security

```bash
# Apply security configuration
sudo cp infrastructure/security/nginx-security.conf /etc/nginx/sites-available/reconciliation-platform
sudo ln -s /etc/nginx/sites-available/reconciliation-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Security Scanning

```bash
# Run security scan
chmod +x infrastructure/security/security-scan.sh
./infrastructure/security/security-scan.sh scan

# Review security report
cat /reports/security/security-report-*.md
```

### 3. SSL/TLS Configuration

```bash
# Test SSL configuration
openssl s_client -connect reconciliation-platform.com:443 -servername reconciliation-platform.com

# Check SSL rating
curl -s "https://api.ssllabs.com/api/v3/analyze?host=reconciliation-platform.com"
```

## Backup and Recovery

### 1. Backup Setup

```bash
# Configure backup
chmod +x infrastructure/backup/backup-recovery.sh

# Set environment variables
export REMOTE_BACKUP_HOST="your-backup-server.com"
export REMOTE_BACKUP_USER="backup-user"
export REMOTE_BACKUP_DIR="/backup/reconciliation-platform"
export REMOTE_BACKUP_KEY="/path/to/ssh/key"

# Run initial backup
./infrastructure/backup/backup-recovery.sh backup
```

### 2. Automated Backups

```bash
# Setup cron job for daily backups
sudo crontab -e
# Add: 0 2 * * * /app/infrastructure/backup/backup-recovery.sh backup

# Setup weekly cleanup
# Add: 0 3 * * 0 /app/infrastructure/backup/backup-recovery.sh cleanup
```

### 3. Disaster Recovery Testing

```bash
# Test database recovery
./infrastructure/backup/backup-recovery.sh restore /backup/database/reconciliation_db_YYYYMMDD_HHMMSS.sql.gz

# Test full system recovery
./infrastructure/backup/backup-recovery.sh restore /backup/files/application_files_YYYYMMDD_HHMMSS.tar.gz
```

## Performance Optimization

### 1. Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run performance tests
chmod +x infrastructure/performance/performance-test.sh
./infrastructure/performance/performance-test.sh test

# Review performance report
cat /reports/performance/performance-report-*.md
```

### 2. Database Optimization

```bash
# Analyze database performance
docker-compose exec postgres psql -U reconciliation_user -d reconciliation_app -c "
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC;
"

# Check slow queries
docker-compose exec postgres psql -U reconciliation_user -d reconciliation_app -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

### 3. Caching Optimization

```bash
# Check Redis performance
docker-compose exec redis redis-cli info stats

# Monitor cache hit ratio
docker-compose exec redis redis-cli info stats | grep keyspace
```

## Troubleshooting

### 1. Common Issues

#### Application Not Starting
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check resource usage
docker stats

# Restart services
docker-compose restart backend frontend
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U reconciliation_user

# Check connection pool
docker-compose exec backend cargo run --bin health-check

# Restart database
docker-compose restart postgres
```

#### High Memory Usage
```bash
# Check memory usage
free -h
docker stats

# Restart services
docker-compose restart

# Check for memory leaks
docker-compose exec backend cargo run --bin memory-check
```

### 2. Log Analysis

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View system logs
sudo journalctl -u docker
sudo journalctl -u nginx

# Analyze error logs
grep -i error /var/log/nginx/error.log
```

### 3. Performance Issues

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:1000/health"

# Monitor system resources
htop
iostat -x 1

# Check network connectivity
netstat -tulpn
ss -tulpn
```

## Maintenance

### 1. Regular Maintenance Tasks

#### Daily
- Monitor system health
- Check backup status
- Review error logs
- Verify SSL certificates

#### Weekly
- Update system packages
- Clean up old logs
- Review performance metrics
- Test backup restoration

#### Monthly
- Security updates
- Performance optimization
- Capacity planning
- Disaster recovery testing

### 2. Update Procedures

```bash
# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 3. Monitoring and Alerting

```bash
# Check monitoring status
curl http://localhost:9090/api/v1/targets
curl http://localhost:3000/api/health

# Test alerts
docker-compose exec prometheus promtool test rules infrastructure/monitoring/alert_rules.yml

# Review metrics
curl http://localhost:9090/api/v1/query?query=up
```

## Support and Documentation

### 1. Documentation
- **API Documentation**: `/docs/api/`
- **User Guide**: `/docs/user-guide/`
- **Admin Guide**: `/docs/admin-guide/`
- **Troubleshooting**: `/docs/troubleshooting/`

### 2. Support Contacts
- **Technical Support**: support@reconciliation-platform.com
- **Emergency Contact**: +1-555-0123
- **Documentation**: docs@reconciliation-platform.com

### 3. Useful Commands

```bash
# Quick health check
curl -f http://localhost:1000/health || echo "Health check failed"

# View all services
docker-compose ps

# Restart all services
docker-compose restart

# View resource usage
docker stats

# Backup database
./infrastructure/backup/backup-recovery.sh database

# Run security scan
./infrastructure/security/security-scan.sh scan

# Performance test
./infrastructure/performance/performance-test.sh test
```

---

**Last Updated**: $(date)
**Version**: 1.0
**Status**: Production Ready
