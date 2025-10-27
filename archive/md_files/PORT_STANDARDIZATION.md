# 378 Reconciliation Platform - Port Standardization

## Overview
This document defines the standardized port assignments for the 378 Reconciliation Platform across all environments.

## Port Assignments

### Core Application Services
- **Frontend (Next.js)**: `1000`
- **Backend API (Rust/Actix-web)**: `2000`
- **WebSocket Server**: `2001`

### Database Services
- **PostgreSQL**: `5432` (standard)
- **Redis**: `6379` (standard)

### Monitoring & Analytics
- **Prometheus**: `9090` (standard)
- **Grafana**: `3000` (standard)
- **Elasticsearch**: `9200` (standard)
- **Kibana**: `5601` (standard)
- **Logstash**: `5044` (standard)

### Load Balancer & Proxy
- **Nginx HTTP**: `2000` (maps to backend)
- **Nginx HTTPS**: `2043` (maps to backend)

## Development URLs

### Local Development
- Frontend: `http://localhost:1000`
- Backend API: `http://localhost:2000`
- WebSocket: `ws://localhost:2001`
- Health Check: `http://localhost:2000/api/health`

### Docker Development
- Frontend: `http://localhost:1000`
- Backend API: `http://localhost:2000`
- Database: `localhost:5432`
- Redis: `localhost:6379`

## Configuration Files Updated

### Backend Configuration
- `backend_simple/src/main.rs` - Updated to use port 2000
- `backend_simple/ports.config` - Port configuration file

### Frontend Configuration
- `package.json` - Already configured for port 1000
- `next.config.js` - No port changes needed

### Docker Configuration
- `docker-compose.yml` - Updated all port mappings
- Backend service: `2000:2000`
- Frontend service: `1000:80`
- Nginx load balancer: `2000:80`

### Environment Variables
- `VITE_API_URL`: `http://backend:2000/api`
- `VITE_WS_URL`: `ws://backend:2000`

## Port Conflict Resolution

### Avoided Conflicts
- Port 1000: Frontend (was 3000)
- Port 2000: Backend (was 8080)
- Port 2001: WebSocket (was 3002)
- Port 3000: Grafana (unchanged)

### Reserved Ports
- 1000-1999: Frontend services
- 2000-2999: Backend services
- 3000-3999: Monitoring services
- 5000-5999: Database services
- 9000-9999: Analytics services

## Testing Commands

### Backend Health Check
```bash
curl http://localhost:2000/api/health
```

### Frontend Access
```bash
curl http://localhost:1000
```

### All Services Check
```bash
# Backend
curl http://localhost:2000/api/health

# Frontend
curl http://localhost:1000

# Database
psql -h localhost -p 5432 -U reconciliation_user -d reconciliation_app

# Redis
redis-cli -h localhost -p 6379 ping
```

## Production Considerations

### Load Balancer Configuration
- External port 2000 maps to backend service
- External port 1000 maps to frontend service
- SSL termination on ports 1043 and 2043

### Security
- All services behind reverse proxy
- Database ports not exposed externally
- Monitoring ports restricted to admin access

## Migration Notes

### From Previous Configuration
- Frontend: 3000 → 1000
- Backend: 8080 → 2000
- WebSocket: 3002 → 2001
- Nginx: 8080 → 2000

### Breaking Changes
- Update all API calls to use port 2000
- Update all frontend URLs to use port 1000
- Update Docker Compose port mappings
- Update environment variables

## Validation Checklist

- [ ] Backend starts on port 2000
- [ ] Frontend starts on port 1000
- [ ] Health check responds on port 2000
- [ ] Frontend loads on port 1000
- [ ] API calls work from frontend to backend
- [ ] Docker Compose services start correctly
- [ ] No port conflicts detected
- [ ] All environment variables updated
- [ ] Documentation updated
