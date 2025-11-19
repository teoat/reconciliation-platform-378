# Getting Started Guide

**Last Updated**: January 2025  
**Status**: Active

---

## Prerequisites

- Node.js 18+ and npm
- Rust 1.70+
- Docker and Docker Compose
- PostgreSQL 14+ (or use Docker)
- Git

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd reconciliation-platform-378
```

### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
cargo build
```

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database connection strings
- API keys
- Service URLs

### 4. Start Services with Docker

```bash
docker-compose up -d
```

This starts:
- Frontend (port 1000)
- Backend (port 2000)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Monitoring stack

### 5. Run Database Migrations

```bash
cd backend
diesel migration run
```

### 6. Start Development Servers

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
cargo run
```

---

## Project Structure

```
reconciliation-platform-378/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # Rust backend
│   ├── src/
│   │   ├── handlers/     # API handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── middleware/    # Middleware
│   └── Cargo.toml
├── docs/              # Documentation
└── docker-compose.yml # Docker configuration
```

---

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow coding standards (see `docs/developer/coding-standards.md`)
   - Write tests for new features
   - Update documentation

3. **Test your changes:**
   ```bash
   # Frontend
   cd frontend && npm test
   
   # Backend
   cd backend && cargo test
   ```

4. **Commit with conventional commits:**
   ```bash
   git commit -s -m "feat(scope): description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## Common Tasks

### Running Tests

**Frontend:**
```bash
cd frontend
npm test              # Run tests
npm run test:coverage # With coverage
```

**Backend:**
```bash
cd backend
cargo test            # Run tests
cargo tarpaulin       # With coverage
```

### Linting

**Frontend:**
```bash
cd frontend
npm run lint          # ESLint
npm run lint:fix      # Auto-fix
```

**Backend:**
```bash
cd backend
cargo clippy          # Linting
cargo fmt             # Formatting
```

### Database Operations

```bash
# Create migration
cd backend
diesel migration generate migration_name

# Run migrations
diesel migration run

# Revert migration
diesel migration revert
```

---

## Troubleshooting

### Port Already in Use

If ports are already in use:
```bash
# Find process using port
lsof -i :2000  # Backend
lsof -i :1000  # Frontend

# Kill process
kill -9 <PID>
```

### Database Connection Issues

Check Docker containers:
```bash
docker-compose ps
docker-compose logs postgres
```

### Build Errors

**Frontend:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Backend:**
```bash
cd backend
cargo clean
cargo build
```

---

## Next Steps

- Read [Coding Standards](./coding-standards.md)
- Review [Architecture Documentation](../architecture/)
- Check [API Documentation](../api/)
- See [Troubleshooting Guide](./troubleshooting.md)

---

**Questions?** Check the troubleshooting guide or open an issue.

