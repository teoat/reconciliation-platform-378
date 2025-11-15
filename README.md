# 378 Reconciliation Platform

Modern tooling for high-performance data reconciliation workflows.

## Highlights
- **End-to-end platform**: Rust backend, React + TypeScript frontend, PostgreSQL, Redis.
- **Scalable by default**: Docker Compose for local work, production-ready configs, Kubernetes manifests.
- **Observability first**: Prometheus, Grafana, structured logging, and health checks.
- **Secure foundations**: JWT auth, RBAC, rate limiting, and hardened middleware.

## Project Layout

```
reconciliation-platform-378/
├── app/                    # Next.js marketing site
├── backend/                # Rust services
├── frontend/               # React front-end
├── docs/                   # Extended documentation
├── infrastructure/         # IaC, Helm, Kubernetes
├── monitoring/             # Observability stack
├── scripts/                # Utility and deployment scripts
└── docker-compose.yml      # Local orchestration
```

## Getting Started

### Prerequisites
- Docker Desktop (or Docker Engine) with Docker Compose v2
- Node.js 18+ and npm
- Rust 1.70+ with Cargo

### Quick Start (Docker Compose)
```bash
# 1. Start everything
docker compose up -d

# 2. Verify services
docker compose ps
curl http://localhost:8080/health

# 3. Explore
#   Frontend: http://localhost:3000
#   Backend:  http://localhost:8080
#   Metrics:  http://localhost:8080/metrics
```

### Manual Workflow
- **Backend**
  ```bash
  cd backend
  cargo run
  ```
- **Frontend**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Database & cache**: use the Compose services (`docker compose up postgres redis`) or configure local instances via `DATABASE_URL` and `REDIS_URL`.

### Configuration
- Backend `.env`
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/reconciliation
  REDIS_URL=redis://localhost:6379
  JWT_SECRET=change-me
  RUST_LOG=info
  ```
- Frontend `.env.local`
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8080
  NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
  ```

## Development Tasks
- **Run tests**
  ```bash
  # backend
  cd backend && cargo test

  # frontend
  cd frontend && npm test

  # e2e
  npx playwright test
  ```
- **Lint & format**
  - Backend: `cargo fmt && cargo clippy`
  - Frontend: `npm run lint`

## Deployment
- Full deployment instructions: see `DEPLOYMENT_GUIDE.md`
- Additional documentation: see `docs/` folder

## Observability & Operations
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Health endpoints: `/health`, `/health/live`, `/health/ready`

## Contributing
- Fork → branch → commit → PR. Review `CONTRIBUTING.md` for coding standards and workflow.

## License
- MIT License – see `LICENSE`.