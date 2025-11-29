# 🐳 How to Start Docker and Deploy Services

## Quick Steps

### 1. Start Docker Desktop

**On macOS**:
- Open **Docker Desktop** from Applications
- Or run: `open -a Docker`
- Wait for Docker to fully start (whale icon in menu bar should be steady)

**On Windows**:
- Open **Docker Desktop** from Start Menu
- Wait for Docker to fully start

**On Linux**:
```bash
sudo systemctl start docker
```

### 2. Verify Docker is Running

```bash
docker info
```

You should see Docker system information. If you see an error, Docker is not ready yet.

### 3. Deploy Services

Once Docker is running, choose one of these options:

#### Option A: Automated Script (Easiest)
```bash
./scripts/deployment/quick-start-docker.sh
```

#### Option B: Manual Commands
```bash
# Create network
docker network create reconciliation-network

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### 4. Wait for Services

Services will take 3-5 minutes to start. Monitor with:
```bash
docker compose ps
```

### 5. Access Services

Once running, access at:
- **Frontend**: http://localhost:1000
- **Backend**: http://localhost:2000
- **Grafana**: http://localhost:3001

---

## Troubleshooting

### Docker Won't Start
1. Make sure Docker Desktop is installed
2. Check if another Docker instance is running
3. Restart your computer if needed

### Port Conflicts
If ports are already in use:
```bash
# Find what's using the port
lsof -i :2000  # macOS/Linux
netstat -ano | findstr :2000  # Windows

# Stop conflicting services or change ports in docker-compose.yml
```

### Services Keep Restarting
Check logs:
```bash
docker compose logs backend
docker compose logs frontend
```

---

## Quick Commands Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart a service
docker compose restart backend
```

---

**Need Help?** See `docs/diagnostics/DOCKER_QUICK_START_GUIDE.md` for detailed guide.

