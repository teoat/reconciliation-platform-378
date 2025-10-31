# 🚀 QUICK DEPLOYMENT GUIDE
## Reconciliation Platform v1.0.0

**Status**: Ready to Deploy  
**Time Required**: ~5-10 minutes

---

## ⚡ **FASTEST WAY TO DEPLOY**

### Step 1: Copy Environment Template

```bash
# Copy the environment template
cp env.template .env

# Edit with your values (optional for basic deployment)
# nano .env
```

### Step 2: Deploy

```bash
# Run the deployment script
./scripts/deploy-staging.sh

# OR manually
docker-compose up -d --build
```

### Step 3: Verify

```bash
# Check if services are running
docker-compose ps

# Test backend
curl http://localhost:2000/health

# Test frontend
curl http://localhost:1000

# View logs
docker-compose logs -f
```

That's it! 🎉

---

## 📋 **WHAT'S INCLUDED**

The deployment script automatically:
- ✅ Creates `.env` file if missing (from template)
- ✅ Builds Docker images
- ✅ Starts all services (backend, frontend, database, cache, monitoring)
- ✅ Runs health checks
- ✅ Verifies all services are healthy

---

## 🌐 **ACCESS YOUR APPLICATION**

Once deployed:

- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000/api
- **Health Check**: http://localhost:2000/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

---

## ⚙️ **CUSTOMIZING CONFIGURATION**

Edit the `.env` file to customize:

### Minimal Configuration (Works Out of the Box)
```bash
POSTGRES_PASSWORD=postgres_pass
GRAFANA_PASSWORD=admin
```

### Full Configuration
See `env.template` for all available options including:
- Database credentials
- SMTP settings
- JWT secrets
- CORS origins
- Monitoring settings

---

## 🛠️ **TROUBLESHOOTING**

### Services Not Starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart a service
docker-compose restart backend
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :2000
lsof -i :1000

# Change ports in .env
BACKEND_PORT=2001
FRONTEND_PORT=1001
```

### Diabetes Image Issues

```bash
# Rebuild images
docker-compose build --no-cache

# Remove old containers
docker-compose down
docker-compose up -d --build
```

---

## 📚 **NEXT STEPS**

1. **Configure Email** (Optional): Update SMTP settings in `.env`
2. **Set JWT Secret**: Change `JWT_SECRET` to a strong random value
3. **Enable Monitoring**: Set up Grafana dashboards
4. **Production Deployment**: Follow `DEPLOYMENT_CHECKLIST.md`

---

## 🎯 **VERIFICATION**

Your deployment is successful when:

- ✅ All health checks pass
- ✅ Backend responds on port 2000
- ✅ Frontend accessible on port 1000
- ✅ No errors in logs
- ✅ Database connected
- ✅ Redis connected

---

## 📞 **NEED HELP?**

- **Detailed Guide**: `DEPLOYMENT_CHECKLIST.md`
- **Environment Setup**: `ENVIRONMENT_SETUP_GUIDE.md`
- **Troubleshooting**: See logs above

---

**Ready to deploy? Run**: `./scripts/deploy-staging.sh` 🚀

