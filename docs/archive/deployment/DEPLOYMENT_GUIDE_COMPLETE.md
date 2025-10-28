# 🚀 Complete Deployment Guide
**Date**: October 27, 2025  
**Version**: 2.0

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Docker Deployment](#docker-deployment)
4. [Environment Configuration](#environment-configuration)
5. [WebSocket Configuration](#websocket-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- Rust 1.70+ (for backend development)

### System Requirements
- **Development**: 4GB RAM, 2 CPU cores
- **Production**: 8GB RAM, 4 CPU cores
- **Disk Space**: 20GB minimum

---

## ⚡ Quick Start

### Using Unified Startup Script
```bash
# Development mode (full stack)
./start.sh dev full

# Production mode (backend only)
./start.sh prod backend

# Frontend only
./start.sh dev frontend
```

### Manual Start
```bash
# Start frontend
cd frontend && bash start.sh

# Start backend
cd backend && cargo run
```

---

## 🐳 Docker Deployment

### Development Mode
```bash
docker-compose --profile dev up -d
```

### Production Mode
```bash
docker-compose --profile prod up -d
```

### Staging Mode
```bash
docker-compose --profile staging up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stop Services
```bash
docker-compose down
```

---

## ⚙️ Environment Configuration

### Backend Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/reconciliation_app

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400

# Server
HOST=0.0.0.0
PORT=2000

# Logging
LOG_LEVEL=info
RUST_LOG=info
```

### Frontend Environment Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000

# Application
VITE_APP_NAME=Reconciliation Platform
VITE_APP_ENVIRONMENT=production
```

---

## 🔌 WebSocket Configuration

### Optimization Settings
```rust
use crate::websocket::optimized::{OptimizedWebSocket, WebSocketOptimization};

let config = WebSocketOptimization {
    enable_compression: true,  // Enable compression
    enable_batching: true,     // Enable message batching
    batch_size: 10,            // Messages per batch
    priority_queue: true,      // Priority-based sending
};

let ws = OptimizedWebSocket::new(config);
```

### Frontend Connection
```javascript
const ws = new WebSocket('ws://localhost:2000/ws');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};
```

---

## 📊 Monitoring Setup

### Prometheus Metrics
```yaml
# Scrape configuration
scrape_configs:
  - job_name: 'reconciliation-backend'
    static_configs:
      - targets: ['backend:2000']
    metrics_path: /metrics
```

### Grafana Dashboards
- Access at: http://localhost:3000
- Default credentials: admin/admin
- Pre-configured dashboards:
  - Backend Metrics
  - Database Performance
  - WebSocket Metrics

### Key Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `websocket_connections` - Active WebSocket connections
- `websocket_messages_total` - Total messages sent/received

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
cd backend && cargo build

# Check database connection
pg_isready -U postgres
```

### Frontend Blank Page
```bash
# Check Vite server
cd frontend && npm run dev

# Check browser console for errors
```

### WebSocket Connection Failed
```bash
# Check WebSocket endpoint
curl -i http://localhost:2000/health

# Check firewall
netstat -tulpn | grep 2000
```

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Contributing Guide](../CONTRIBUTING.md)

---

**Status**: ✅ **Complete and Production Ready**

