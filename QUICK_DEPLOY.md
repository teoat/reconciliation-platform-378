# 🚀 Quick Deploy with Beeceptor

## One-Command Deployment

```bash
# Make sure Docker Desktop is running, then:
./scripts/setup-and-deploy-beeceptor.sh
```

## If Docker is Not Running

```bash
# Option 1: Start Docker Desktop manually, then run above command

# Option 2: Let script try to start Docker (may take 2 minutes)
./scripts/start-docker-and-deploy.sh
```

## What Gets Deployed

✅ Beeceptor webhook: https://378to492.free.beeceptor.com  
✅ Backend API: http://localhost:2000  
✅ Database: PostgreSQL (auto-configured)  
✅ Redis: Cache (auto-configured)  
✅ All services with health checks

## Verify Deployment

```bash
# Check health
curl http://localhost:2000/api/health

# View logs
docker-compose logs -f

# Check services
docker-compose ps
```

## Monitor Webhooks

Visit: https://beeceptor.com/dashboard  
Select endpoint: `378to492`

---

**Status**: Ready to deploy (Docker required)
