# 378 Data and Evidence Reconciliation Platform

## Overview
Enterprise-grade data reconciliation platform built with Rust backend and React frontend.

## Features
- **Data Ingestion**: Multi-format file processing (CSV, Excel, JSON, XML, PDF)
- **Reconciliation Engine**: Advanced matching algorithms with AI-powered fuzzy matching
- **Real-time Collaboration**: Live editing and presence indicators
- **Analytics Dashboard**: Comprehensive reporting and metrics
- **Security**: Role-based access control and audit logging

## Quick Start
1. **Backend**: `cd reconciliation-rust && cargo run`
2. **Frontend**: `cd frontend-simple && npm run dev`
3. **Integration Test**: `./test-integration.sh`

## Architecture
- **Backend**: Rust + Actix-Web + PostgreSQL + Redis
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Infrastructure**: Docker + Docker Compose + Monitoring

## Development
See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development setup.

## Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

## API Documentation
See [API.md](API.md) for complete API reference.
