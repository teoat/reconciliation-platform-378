# Infrastructure Setup Guide
# Complete guide for setting up the Reconciliation Application infrastructure

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Rust 1.75+
- PostgreSQL 15+
- Redis 7+

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/reconciliation-app.git
cd reconciliation-app

# Copy environment configuration
cp config/development.env .env

# Install dependencies
npm install
cd reconciliation-rust && cargo build && cd ..
```

### 2. Start Development Environment

```bash
# Start all services
docker-compose up -d

# Run database migrations
./scripts/database.sh init

# Verify deployment
curl http://localhost/health
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **Monitoring**: http://localhost:9090 (Prometheus)
- **Dashboards**: http://localhost:3001 (Grafana)

## 📋 Infrastructure Components

### Core Services

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| Frontend | Next.js | 3000 | Web application |
| Backend | Rust/Actix | 8080 | API server |
| Database | PostgreSQL | 5432 | Data storage |
| Cache | Redis | 6379 | Session/cache |
| Proxy | Nginx | 80/443 | Load balancer |

### Monitoring Stack

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| Prometheus | Prometheus | 9090 | Metrics collection |
| Grafana | Grafana | 3001 | Visualization |
| Jaeger | Jaeger | 16686 | Distributed tracing |

### Development Tools

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| Swagger UI | OpenAPI | 8080/docs | API documentation |
| pgAdmin | PostgreSQL Admin | 5050 | Database management |
| Redis Commander | Redis Admin | 8081 | Cache management |

## 🛠️ Scripts and Automation

### Database Management

```bash
# Initialize database
./scripts/database.sh init

# Run migrations
./scripts/database.sh migrate

# Create new migration
./scripts/database.sh create add_user_table

# Check database health
./scripts/database.sh health

# Backup database
./scripts/database.sh backup

# Restore database
./scripts/database.sh restore backup_file.sql
```

### Deployment Management

```bash
# Deploy to staging
./scripts/deploy.sh deploy --environment staging

# Deploy to production
./scripts/deploy.sh deploy --environment production

# Check deployment status
./scripts/deploy.sh status --environment production

# Scale services
./scripts/deploy.sh scale --environment production --replicas 5

# Rollback deployment
./scripts/deploy.sh rollback --environment production
```

### Backup and Recovery

```bash
# Create comprehensive backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backup_20231201_120000

# List available backups
./scripts/restore.sh --list

# Verify backup integrity
./scripts/restore.sh --verify backup_20231201_120000
```

## 🔧 Configuration

### Environment Variables

#### Development Environment
```bash
# Copy development configuration
cp config/development.env .env
```

#### Production Environment
```bash
# Copy production configuration
cp config/production.env .env

# Set production secrets
export DB_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret"
export REDIS_PASSWORD="your-redis-password"
```

### Docker Configuration

#### Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale frontend=2
```

## 📊 Monitoring and Observability

### Prometheus Metrics

The application exposes metrics at `/metrics` endpoint:

- **HTTP Metrics**: Request rate, response time, error rate
- **Database Metrics**: Connection pool, query performance
- **Redis Metrics**: Cache hit rate, memory usage
- **System Metrics**: CPU, memory, disk usage

### Grafana Dashboards

Pre-configured dashboards include:

- **Application Overview**: Key performance indicators
- **Infrastructure**: System resource usage
- **Database Performance**: Query performance and connections
- **API Performance**: Request metrics and error rates

### Alerting Rules

Configured alerts for:

- High error rate (>5%)
- High response time (>2s)
- Database connection issues
- Memory/CPU usage thresholds
- Disk space warnings

## 🔒 Security

### Container Security

- Non-root user execution
- Read-only filesystems
- Resource limits
- Security scanning in CI/CD

### Network Security

- Internal network isolation
- SSL/TLS termination
- Rate limiting
- CORS configuration

### Application Security

- JWT authentication
- Password hashing (bcrypt)
- Input validation
- SQL injection prevention

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Code Quality Checks**
   - Rust formatting and clippy
   - TypeScript type checking
   - ESLint and Prettier

2. **Security Scanning**
   - Trivy vulnerability scanner
   - CodeQL analysis
   - Snyk security scan

3. **Testing**
   - Unit tests
   - Integration tests
   - End-to-end tests

4. **Build and Deploy**
   - Docker image building
   - Multi-platform builds
   - Environment-specific deployments

### Deployment Environments

#### Development
- Triggered on feature branch pushes
- Automated testing and validation
- Development database seeding

#### Staging
- Triggered on `develop` branch pushes
- Production-like environment
- Smoke tests and validation

#### Production
- Triggered on `main` branch pushes
- Manual approval required
- Comprehensive health checks
- Rollback capabilities

## 📈 Performance Testing

### Load Testing with Artillery

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run tests/load/load-test.yml

# Run with custom configuration
artillery run tests/load/load-test.yml --config tests/load/production.yml
```

### Performance Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Response Time (p95) | < 2s | < 5s |
| Response Time (p99) | < 5s | < 10s |
| Error Rate | < 1% | < 5% |
| Throughput | > 100 req/s | > 50 req/s |
| Availability | > 99.9% | > 99% |

## 🔄 Backup and Disaster Recovery

### Backup Strategy

- **Daily Backups**: Automated database and file backups
- **Weekly Archives**: Long-term storage of critical data
- **Point-in-Time Recovery**: PostgreSQL WAL archiving
- **Cross-Region Replication**: Disaster recovery sites

### Recovery Procedures

1. **Assessment**: Identify scope and impact
2. **Recovery**: Restore from most recent backup
3. **Validation**: Verify data integrity and functionality
4. **Monitoring**: Ensure system stability

### Recovery Time Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Database | 15 minutes | 5 minutes |
| Application | 10 minutes | 1 minute |
| Full System | 30 minutes | 5 minutes |

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Check connection logs
docker-compose logs postgres

# Reset database connection
docker-compose restart postgres
```

#### Redis Connection Issues
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Reset Redis connection
docker-compose restart redis
```

#### Application Issues
```bash
# Check application logs
docker-compose logs backend
docker-compose logs frontend

# Check application health
curl http://localhost:8080/health
curl http://localhost:3000/api/health

# Restart application
docker-compose restart backend frontend
```

### Performance Issues

```bash
# Check database performance
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker-compose exec redis redis-cli info stats

# Check application metrics
curl http://localhost:8080/metrics

# Check system resources
docker-compose exec backend top
docker-compose exec backend free -h
```

### Log Analysis

```bash
# Search for errors
docker-compose logs | grep -i error

# Search for specific patterns
docker-compose logs | grep -i "database"

# Follow logs in real-time
docker-compose logs -f backend

# Export logs
docker-compose logs > logs/$(date +%Y%m%d_%H%M%S).log
```

## 📚 Documentation

### Additional Resources

- [Infrastructure Documentation](docs/INFRASTRUCTURE.md)
- [API Documentation](docs/API.md)
- [User Guides](docs/USER_GUIDES.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

### Support

- **Infrastructure Team**: infrastructure@company.com
- **Development Team**: dev@company.com
- **Security Team**: security@company.com
- **On-Call**: +1-555-0123

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review security alerts
   - Update dependencies
   - Check backup integrity

2. **Monthly**
   - Performance optimization
   - Security patches
   - Documentation updates

3. **Quarterly**
   - Disaster recovery testing
   - Capacity planning
   - Security audit

### Version Management

- **Semantic Versioning**: Major.Minor.Patch
- **Release Notes**: Detailed change documentation
- **Rollback Procedures**: Quick recovery options
- **Feature Flags**: Gradual feature rollouts

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintained by**: Infrastructure Team
