# 🚀 START HERE - Deployment Guide

## Quick Deployment

### Option 1: Using Docker (Recommended)

#### Step 1: Start Docker Desktop
- Open Docker Desktop application
- Wait for it to fully start (whale icon in menu bar)

#### Step 2: Run Deployment
```bash
# For macOS/Linux
bash deploy.sh

# For Windows PowerShell
./deploy.ps1
```

The script will:
- ✅ Check Docker status
- ✅ Run database migrations
- ✅ Start all services
- ✅ Display service URLs

---

### Option 2: Manual Deployment

#### Start Services
```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

#### Run Migrations Manually
```bash
cd backend
export DATABASE_URL="postgresql://postgres:password@localhost:5432/reconciliation_app"
diesel setup
diesel migration run
cd ..
```

---

## Access the Application

After deployment:
- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **Database**: localhost:5432

---

## Troubleshooting

### Issue: "Docker daemon not running"
**Solution**: Start Docker Desktop and wait for it to be ready

### Issue: "Port already in use"
**Solution**: 
```bash
# Stop existing containers
docker-compose down

# Or change ports in docker-compose.yml
```

### Issue: "Migrations failed"
**Solution**:
```bash
# Wait for database to be ready (30 seconds)
sleep 30

# Run migrations again
cd backend
diesel migration run
cd ..
```

### Issue: "Cannot connect to database"
**Solution**:
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# If not, restart services
docker-compose restart
```

---

## What Gets Deployed

- ✅ PostgreSQL Database (with data persistence)
- ✅ Redis Cache
- ✅ Backend API (Rust/Actix)
- ✅ Frontend (Next.js)
- ✅ Nginx (Reverse proxy)
- ✅ All migrations applied

---

## Next Steps

1. **Access Frontend**: Open http://localhost:1000
2. **Create Account**: Sign up for an account
3. **Configure Stripe**: Add your Stripe keys for payments
4. **Test Features**: Try reconciliation workflows

---

## Need Help?

- Check logs: `docker-compose logs -f`
- View this guide: `START_HERE.md`
- Check deployment status: `DEPLOYMENT_FIXES_APPLIED.md`

**Ready to start? Run the deployment script now!** 🚀

