# Start Here - 378 Reconciliation Platform

**Last Updated**: January 2025  
**Platform**: Enterprise Reconciliation System  
**Status**: Production Ready ✅

---

## Quick Navigation

- [Quick Start](#quick-start) - Get running in 5 minutes
- [Development Setup](#development-setup) - Local development
- [Deployment](#deployment) - Production deployment
- [Documentation](#documentation) - Complete guides
- [Troubleshooting](#troubleshooting) - Common issues

---

## Quick Start

### Run with Docker (Recommended)

```bash
# Clone the repository (if not already cloned)
git clone <repository-url>
cd 378

# Copy environment file
cp env.example .env

# Start all services
docker-compose up --build

# Access the application:
# Frontend: http://localhost:1000
# Backend: http://localhost:2000
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

**Default Credentials** (development only):
- Database: `postgres` / `postgres_pass`
- Redis: No password required
- Grafana: `admin` / `admin`

---

## Development Setup

### Prerequisites

- **Backend**: Rust 1.90+, PostgreSQL 15+
- **Frontend**: Node.js 18+, npm or yarn
- **Docker**: Docker & Docker Compose (optional but recommended)

### Backend Setup

```bash
cd backend

# Install Rust dependencies
cargo build

# Set up environment
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
export JWT_SECRET="your-secret-key-change-in-production"
export REDIS_URL="redis://localhost:6379"

# Run database migrations
diesel migration run

# Start the backend server
cargo run
```

Backend runs on `http://localhost:2000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:1000`

---

## Deployment

### Production Deployment

See [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) for detailed production deployment guide.

**Quick Production Deploy**:
```bash
# Build and deploy with Docker
docker-compose -f docker-compose.prod.yml up -d

# Or use deployment script
./deploy-production.sh
```

### Environment Configuration

Required environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Security
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRATION=86400

# Redis
REDIS_URL=redis://host:6379

# Application
HOST=0.0.0.0
PORT=2000
CORS_ORIGINS=https://your-frontend-domain.com
```

---

## Documentation

### Essential Documents

- **[README.md](./README.md)** - Project overview and status
- **[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)** - Production deployment guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command and API reference
- **[MASTER_TODO_CONSOLIDATED.md](./MASTER_TODO_CONSOLIDATED.md)** - Current TODO list
- **[PROJECT_STATUS_CONSOLIDATED.md](./docs/archive/PROJECT_STATUS_CONSOLIDATED.md)** - Detailed status

### Technical Documentation

- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture
- **[docs/API_REFERENCE.md](./docs/API_REFERENCE.md)** - API documentation
- **[docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)** - Infrastructure details
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Operational Documentation

- **[docs/GO_LIVE_CHECKLIST.md](./docs/GO_LIVE_CHECKLIST.md)** - Pre-launch checklist
- **[docs/INCIDENT_RESPONSE_RUNBOOKS.md](./docs/INCIDENT_RESPONSE_RUNBOOKS.md)** - Incident response
- **[docs/SUPPORT_MAINTENANCE_GUIDE.md](./docs/SUPPORT_MAINTENANCE_GUIDE.md)** - Support guide

---

## Key Features

### Security
- ✅ JWT authentication with environment-based secrets
- ✅ Password hashing with bcrypt
- ✅ Rate limiting (1000 req/hour)
- ✅ CSRF protection
- ✅ Input sanitization and validation
- ✅ SQL injection prevention (Diesel ORM)

### Performance
- ✅ Multi-level caching (Redis + in-memory)
- ✅ Connection pooling (PostgreSQL)
- ✅ Database indexes for optimization
- ✅ Code splitting and bundle optimization

### Monitoring
- ✅ Prometheus metrics
- ✅ Grafana dashboards
- ✅ Health check endpoints
- ✅ Structured logging

---

## Architecture

### Tech Stack

**Backend**:
- Rust (Actix-Web 4.4)
- Diesel ORM 2.0
- PostgreSQL 15
- Redis 7

**Frontend**:
- React 18
- TypeScript 5
- Vite 5
- TailwindCSS 3

**Infrastructure**:
- Docker & Docker Compose
- Kubernetes ready
- Nginx reverse proxy

### Key Metrics

- **Response Time**: < 200ms (p95)
- **Test Coverage**: ~80% (handlers)
- **Build Time**: 5m (release)
- **Compilation**: 0 errors

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string
echo $DATABASE_URL
```

#### Backend Won't Start
```bash
# Verify environment variables
printenv | grep -E "DATABASE_URL|JWT_SECRET|REDIS_URL"

# Check for port conflicts
lsof -i :2000
```

#### Frontend Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues
```bash
# Clean and rebuild
docker-compose down -v
docker-compose up --build
```

---

## Getting Help

- **Issues**: Check [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **API Questions**: See [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- **Deployment**: See [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)
- **Support**: See [docs/SUPPORT_MAINTENANCE_GUIDE.md](./docs/SUPPORT_MAINTENANCE_GUIDE.md)

---

## Next Steps

1. **Setup**: Follow [Quick Start](#quick-start) to get running
2. **Explore**: Review [API documentation](./docs/API_REFERENCE.md)
3. **Develop**: Read [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)
4. **Deploy**: Follow [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 2025
