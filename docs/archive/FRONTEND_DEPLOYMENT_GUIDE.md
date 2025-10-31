# 🚀 Frontend Deployment Guide

**Date**: January 2025  
**Status**: Production Ready

---

## 📋 Quick Start

### Option 1: Deploy with Docker Compose (Recommended)

```bash
cd /Users/Arief/Desktop/378

# Build and start frontend
docker-compose up -d frontend

# Check status
docker-compose ps frontend

# View logs
docker-compose logs -f frontend
```

### Option 2: Build and Run Manually

```bash
cd /Users/Arief/Desktop/378

# Build the Docker image
docker build -t reconciliation-frontend \
  -f infrastructure/docker/Dockerfile.frontend \
  .

# Run the container
docker run -d \
  --name reconciliation-frontend \
  -p 1000:80 \
  reconciliation-frontend
```

---

## 🔧 Configuration

### Environment Variables

The frontend is configured via environment variables in `docker-compose.yml`:

```yaml
environment:
  - VITE_API_URL=http://backend:2000/api
  - VITE_WS_URL=ws://backend:2000
  - NODE_ENV=production
```

**Note**: These are build-time variables. To change them, rebuild the image.

### Ports

- **Container Port**: 80 (nginx)
- **Host Port**: 1000 (configurable via `FRONTEND_PORT`)

---

## 📁 Build Process

### Stage 1: Build (Node.js)
1. Uses Node.js 18 Alpine
2. Installs dependencies
3. Builds the React app with Vite
4. Optimizes with Terser

### Stage 2: Runtime (nginx)
1. Uses nginx Alpine
2. Serves static files
3. Includes health checks
4. Configurable via nginx configs

---

## 🏗️ Build the Frontend

### Using Docker Compose

```bash
# Build without cache (fresh build)
docker-compose build --no-cache frontend

# Build with cache (faster)
docker-compose build frontend
```

### Manual Build

```bash
cd /Users/Arief/Desktop/378/frontend

# Install dependencies
npm install

# Build for production
npm run build

# The built files will be in frontend/dist/
```

---

## 🌐 Access the Frontend

Once deployed:

- **URL**: http://localhost:1000
- **API**: http://localhost:2000
- **Health Check**: http://localhost:1000/health.html

---

## 🔍 Troubleshooting

### Frontend won't start

```bash
# Check logs
docker-compose logs frontend

# Restart
docker-compose restart frontend

# Rebuild
docker-compose build --no-cache frontend && docker-compose up -d frontend
```

### Build fails

```bash
# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

### Blank page or 404

```bash
# Check if files were built
docker exec reconciliation-frontend ls -la /usr/share/nginx/html

# Check nginx logs
docker exec reconciliation-frontend tail -f /var/log/nginx/error.log

# Rebuild
docker-compose build --no-cache frontend && docker-compose up -d frontend
```

### API connection issues

```bash
# Check backend is running
docker-compose ps backend

# Check network connectivity
docker exec reconciliation-frontend ping backend

# Update API URL (rebuild required)
# Edit docker-compose.yml, then rebuild
```

---

## 📊 Health Checks

The frontend includes health check support:

```bash
# Manual health check
curl http://localhost:1000/health.html

# Expected response: OK
```

---

## 🎯 Deployment Checklist

- [ ] Environment variables configured
- [ ] Backend service running
- [ ] Database migrations applied
- [ ] Frontend builds successfully
- [ ] Docker image built
- [ ] Container running
- [ ] Health check passing
- [ ] Accessible at http://localhost:1000

---

## 🚀 Production Deployment

For production deployment:

1. **Set environment variables**:
   ```bash
   export VITE_API_URL=https://api.yourdomain.com/api
   export VITE_WS_URL=wss://api.yourdomain.com
   export NODE_ENV=production
   ```

2. **Build with production settings**:
   ```bash
   docker-compose -f docker-compose.prod.yml build frontend
   ```

3. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d frontend
   ```

4. **Verify**:
   ```bash
   curl https://yourdomain.com
   ```

---

## 📝 Notes

- The frontend is served as static files by nginx
- All JavaScript is bundled and optimized for production
- API calls use the configured `VITE_API_URL`
- WebSocket connections use `VITE_WS_URL`
- Health checks run every 30 seconds

---

**Status**: Ready to Deploy ✅  
**Build Time**: ~5 minutes  
**Container Size**: ~50MB  
**URL**: http://localhost:1000

