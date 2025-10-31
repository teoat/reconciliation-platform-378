# 🚀 DEPLOYMENT QUICK FIX

## Issue: Docker Credential Helper Error

**Error**: `exec: "docker-credential-desktop": executable file not found in $PATH`

---

## ✅ SOLUTION 1: Simple Start (No Build)

The Docker images are already built. Just start services:

```bash
cd /Users/Arief/Desktop/378
docker compose up -d
```

---

## ✅ SOLUTION 2: Fix Credential Helper

### Option A: Disable Credential Helper
```bash
# Edit Docker config
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "auths": {},
  "HttpHeaders": {
    "User-Agent": "Docker-Client"
  }
}
EOF
```

### Option B: Remove Credential Entry
```bash
# Remove credential helper from config
sed -i.bak 's/"credsStore".*$//g' ~/.docker/config.json
```

### Option C: Install Credential Helper
```bash
# macOS - download credential helper
curl -L https://github.com/docker/docker-credential-helper/releases/download/v0.8.0/docker-credential-desktop-0.8.0-amd64 -o /usr/local/bin/docker-credential-desktop
chmod +x /usr/local/bin/docker-credential-desktop
```

---

## ✅ SOLUTION 3: Manual Build

Build without Docker Compose:

```bash
# Build backend
cd backend
docker build -f ../infrastructure/docker/Dockerfile.backend -t reconciliation-backend .

# Build frontend
cd ../frontend
docker build -f ../infrastructure/docker/Dockerfile.frontend -t reconciliation-frontend .

# Start services
cd ..
docker compose up -d
```

---

## ✅ SOLUTION 4: Use Local Images

If images already exist:

```bash
# Check existing images
docker images | grep reconciliation

# Start using existing images
docker compose up -d --no-build
```

---

## ✅ SOLUTION 5: Start Without Docker (Development)

For quick testing without Docker:

```bash
# Terminal 1: Start PostgreSQL
docker run -d --name temp-postgres -e POSTGRES_PASSWORD=postgres_pass -p 5432:5432 postgres:15-alpine

# Terminal 2: Start Redis
docker run -d --name temp-redis -p 6379:6379 redis:7-alpine

# Terminal 3: Start Backend
cd backend
cargo run --release

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

---

## 🎯 RECOMMENDED: Try Solution 1 First

```bash
cd /Users/Arief/Desktop/378
docker compose up -d
```

This should work if images are already built!

---

## 📊 VERIFY DEPLOYMENT

After starting:

```bash
# Check services
docker compose ps

# Check logs
docker compose logs backend

# Test API
curl http://localhost:2000/health
```

---

**Choose the solution that works for you!**

