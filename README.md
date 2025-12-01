# 378 Reconciliation Platform

A comprehensive data reconciliation platform built with a Rust backend, React-based frontend, extensive CI/CD pipelines, and robust monitoring capabilities.

## 🚀 Overview

The 378 Reconciliation Platform is an enterprise-grade solution for data reconciliation and evidence management. It provides a scalable architecture combining the performance of Rust with the flexibility of a modern React frontend.

### Key Features

- **High-Performance Backend** - Built with Rust using Actix-web for blazing fast API responses
- **Modern React Frontend** - Built with React 18, TypeScript, Redux Toolkit, and TailwindCSS
- **Comprehensive CI/CD** - Automated testing, security scanning, and deployment pipelines
- **Application Monitoring** - Prometheus, Grafana, and Sentry integration for observability
- **Security-First Design** - OAuth2/OIDC authentication, 2FA support, and security scanning
- **Container-Ready** - Docker and Kubernetes deployment support with Terraform infrastructure

## 📁 Repository Structure

```
├── backend/              # Rust backend service (Actix-web, Diesel ORM)
├── frontend/             # React frontend (Vite, TypeScript, TailwindCSS)
├── auth-server/          # Authentication server
├── reconciliation-rust/  # Core Rust reconciliation library
├── monitoring/           # Prometheus, Grafana configs, alerting rules
├── k8s/                  # Kubernetes manifests
├── terraform/            # Infrastructure as Code
├── docker/               # Docker configuration files
├── .deployment/          # Deployment optimization scripts and docs
├── .github/              # GitHub Actions workflows and rulesets
└── docs/                 # Project documentation
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | Rust 2021, Actix-web 4.x, Diesel ORM, PostgreSQL, Redis |
| **Frontend** | React 18, TypeScript, Vite, Redux Toolkit, TailwindCSS |
| **Authentication** | JWT, OAuth2 (Google, GitHub), TOTP/2FA, Argon2 |
| **Testing** | Vitest, Playwright, Jest, cargo test |
| **CI/CD** | GitHub Actions, Docker, Trivy security scanning |
| **Monitoring** | Prometheus, Grafana, Sentry, Elastic APM |
| **Infrastructure** | Docker, Kubernetes, Terraform, Nginx |

## 📋 Prerequisites

- **Rust** 1.70+ (with cargo)
- **Node.js** 18+
- **Docker** and Docker Compose
- **PostgreSQL** 13+
- **Redis** 6+

## 🏃 Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/teoat/reconciliation-platform-378.git
   cd reconciliation-platform-378
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm ci
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   cargo build
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:8080

### Using Quick Deploy (Recommended for Development)

```bash
# One command to deploy everything safely
./.deployment/quick-deploy.sh
```

## 🔧 Development

### Running the Frontend

```bash
cd frontend
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run type-check # Run TypeScript checks
npm run test      # Run tests
```

### Running the Backend

```bash
cd backend
cargo run           # Run in development mode
cargo build --release  # Build for production
cargo test          # Run tests
cargo clippy        # Run linter
```

### Running Tests

```bash
# Root level tests
npm run test              # Run all tests
npm run test:coverage     # Run with coverage

# Frontend tests
cd frontend
npm run test:unit         # Unit tests
npm run test:e2e          # E2E tests with Playwright
npm run test:security     # Security tests
npm run test:accessibility # Accessibility tests

# Backend tests
cd backend
cargo test                # Run all tests
cargo tarpaulin           # Run with coverage
```

## 🚀 Deployment

For detailed deployment instructions, see the [Deployment Guide](.deployment/README.md).

### Quick Commands

**Development:**
```bash
docker-compose up -d --build
```

**Production:**
```bash
docker-compose up -d --build

# Check health endpoints
curl http://localhost:8080/health  # Backend
curl http://localhost:80/health    # Frontend
```

### Performance Optimizations

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Code rebuild | 4-5 min | 30-60 sec | **87% faster** |
| Backend image | 500 MB | 150 MB | **70% smaller** |
| Frontend image | 200 MB | 50 MB | **75% smaller** |
| Deployment time | 5-8 min | 2-3 min | **60% faster** |

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Or use overlays for environment-specific configs
kubectl apply -k k8s/overlays/production
```

### Infrastructure as Code

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 🔒 Security & Repository Rulesets

This repository implements comprehensive GitHub rulesets for branch and tag protection. See [.github/rulesets/README.md](.github/rulesets/README.md) for details.

### Branch Protection Summary

| Branch | Protection Level | Key Rules |
|--------|-----------------|-----------|
| `master`, `main` | **Strict** | Required reviews, signed commits, required status checks |
| `develop`, `staging` | **Balanced** | Required reviews, status checks |
| `feature/**`, `fix/**` | **Minimal** | Lint and build checks (non-blocking) |
| Release tags (`v*`) | **Immutable** | Prevent updates and deletion |

### Required Status Checks

- **Linting** - ESLint, Clippy
- **Type Checking** - TypeScript
- **Testing** - Backend and Frontend tests
- **Security Scanning** - Trivy, cargo audit

### Security Features

- OAuth2/OIDC authentication (Google, GitHub)
- Two-factor authentication (TOTP)
- JWT token-based sessions
- Password hashing with Argon2/bcrypt
- Security headers and CSP
- Regular dependency auditing

## 🧪 CI/CD Pipeline

The repository includes comprehensive GitHub Actions workflows:

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Lint, type-check, and test on push/PR |
| `ci-cd.yml` | Full pipeline including deployment |
| `security-scan.yml` | Security vulnerability scanning |
| `performance.yml` | Performance testing and monitoring |
| `dependency-updates.yml` | Automated dependency updates |

## 📊 Monitoring

The platform includes built-in monitoring and alerting:

- **Prometheus** - Metrics collection (port 9090)
- **Grafana** - Visualization dashboards (port 3001)
- **Sentry** - Error tracking and performance monitoring
- **Elastic APM** - Application performance monitoring

### Key Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 8080 | REST API endpoints |
| Frontend | 80 | Web UI |
| Auth Server | 4000 | Authentication server |
| PostgreSQL | 5432 | Database (dev only) |
| Redis | 6379 | Cache (dev only) |
| Prometheus | 9090 | Metrics |
| Grafana | 3001 | Dashboards |

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create your feature branch from `develop`
2. **Write tests** for any new functionality
3. **Ensure all tests pass** before submitting a PR
4. **Follow code style** guidelines (run linters before committing)
5. **Write clear commit messages** following conventional commits
6. **Create a Pull Request** with a clear description

### Pull Request Requirements

- All status checks must pass
- At least one approving review required
- All conversations must be resolved
- Code owner review required for production branches

### Code Style

- **Rust**: Follow Rust 2021 idioms, use Clippy warnings
- **TypeScript/React**: Follow ESLint rules, use Prettier formatting
- **Commits**: Use conventional commits format

## 📚 Documentation

- [Documentation Hub](docs/DOCUMENTATION_HUB.md) - Central documentation index
- [Quick Start Guide](docs/QUICK_START.md) - Get started quickly
- [API Documentation](backend/openapi.yaml) - OpenAPI specification
- [Deployment Guide](.deployment/README.md) - Deployment instructions
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 378 Reconciliation Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so.
```

## 📞 Support

- Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- Review [Docker logs](docker-compose logs -f)
- Verify health endpoints: `curl http://localhost:8080/health`
- Contact repository administrators for additional support

---

**Ready to deploy?** Run: `./.deployment/quick-deploy.sh` 🚀
