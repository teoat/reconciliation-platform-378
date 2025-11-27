# Quick Start Commands - Backend Verification

Copy and paste these commands in order:

## 1. Rebuild (if needed)
```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
docker-compose build --no-cache backend
```

## 2. Restart
```bash
docker-compose stop backend && docker-compose up -d backend
```

## 3. Watch Logs
```bash
docker-compose logs -f backend
```
(Press Ctrl+C to stop watching)

## 4. Check Status
```bash
docker ps | grep backend
```

## 5. Test Health
```bash
curl http://localhost:2000/api/health
```

## 6. Verify Binary Size
```bash
docker-compose run --rm --entrypoint /bin/sh backend -c "ls -lh /app/reconciliation-backend"
```

