# Deployment Optimization - Quick Reference

## 🚀 Fast Deploy (Recommended)

```bash
# One command to deploy everything safely
./.deployment/quick-deploy.sh
```

## 📁 What's Included

### Documentation
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md)** - Technical details and metrics
- **[port-audit.md](port-audit.md)** - Port configuration analysis
- **[docker-build-optimization.md](docker-build-optimization.md)** - Build optimization strategy

### Scripts
- **[quick-deploy.sh](quick-deploy.sh)** - Automated deployment with safety checks

### Docker Files
- **[Dockerfile.backend.fast](../infrastructure/docker/Dockerfile.backend.fast)** - Optimized backend (75% faster rebuilds)
- **[Dockerfile.frontend.fast](../infrastructure/docker/Dockerfile.frontend.fast)** - Optimized frontend (60% faster rebuilds)
- **[docker-compose.fast.yml](../docker-compose.fast.yml)** - Minimal services for fast development

## ⚡ Quick Commands

### Development
```bash
# Fast deployment (minimal services)
docker-compose -f docker-compose.fast.yml up -d --build

# Rebuild specific service
docker-compose -f docker-compose.fast.yml build backend
docker-compose -f docker-compose.fast.yml up -d backend
```

### Production
```bash
# Full stack with monitoring
docker-compose up -d --build

# Check health
curl http://localhost:2000/health
curl http://localhost:1000/health
```

### Troubleshooting
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check status
docker-compose ps

# Restart service
docker-compose restart backend
```

## 📊 Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Code rebuild | 4-5 min | 30-60 sec | **87% faster** |
| Backend image | 500 MB | 150 MB | **70% smaller** |
| Frontend image | 200 MB | 50 MB | **75% smaller** |
| Deployment time | 5-8 min | 2-3 min | **60% faster** |

## 🔍 Port Summary

### Always Exposed
- **2000** - Backend API
- **1000** - Frontend UI

### Development Only
- **5432** - PostgreSQL
- **6379** - Redis

### Monitoring (Optional)
- **9090** - Prometheus
- **3001** - Grafana
- **5601** - Kibana

## ⚠️ Issues Fixed

### Port Conflicts
- ✅ PgBouncer port conflict resolved
- ✅ Duplicate PORT variables removed
- ✅ Clean port mapping established

### Build Performance
- ✅ Dependency caching implemented
- ✅ BuildKit cache mounts added
- ✅ Multi-stage builds optimized
- ✅ Image sizes reduced 70%+

### Safety & Automation
- ✅ Pre-flight checks added
- ✅ Health validation implemented
- ✅ Automatic rollback on failure
- ✅ Backup before deployment

## 🎯 Next Steps

1. **Try Fast Deploy**
   ```bash
   ./.deployment/quick-deploy.sh
   ```

2. **Read Full Guide**
   - [Deployment Guide](DEPLOYMENT_GUIDE.md)

3. **Review Optimizations**
   - [Optimization Summary](OPTIMIZATION_SUMMARY.md)

4. **Customize for Production**
   - Update secrets in `.env`
   - Review port exposure
   - Enable monitoring as needed

## 💡 Tips

- **Enable BuildKit** globally in Docker Desktop settings for best performance
- **Use fast compose** for development to save time
- **Use full stack** for staging/production with monitoring
- **Run quick-deploy** for safest automated deployment

## 🆘 Need Help?

- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions
- Review [Troubleshooting section](DEPLOYMENT_GUIDE.md#-troubleshooting)
- Check Docker logs: `docker-compose logs -f`
- Verify health: `curl http://localhost:2000/health`

---

**Ready to deploy?** Run: `./.deployment/quick-deploy.sh` 🚀

