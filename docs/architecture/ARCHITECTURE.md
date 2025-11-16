# System Architecture

## Overview
The Reconciliation Platform follows a modern microservices architecture with clear separation of concerns.

## Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Rust)        │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Redis Cache   │    │   File Storage  │
│   Assets        │    │   Session       │    │   Uploads       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### Frontend (React + TypeScript)
- **Location**: `frontend-simple/`
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router

### Backend (Rust)
- **Location**: `reconciliation-rust/`
- **Framework**: Actix-Web
- **Database**: Diesel ORM + PostgreSQL
- **Authentication**: JWT tokens
- **Real-time**: WebSocket support

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions
- **Deployment**: Production-ready Docker setup

## Data Flow
1. **Upload**: Files uploaded via frontend
2. **Processing**: Backend processes and stores data
3. **Reconciliation**: AI-powered matching algorithms
4. **Collaboration**: Real-time updates via WebSocket
5. **Export**: Results exported in multiple formats
