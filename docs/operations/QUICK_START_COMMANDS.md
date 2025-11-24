# Quick Start Commands
**Date**: 2025-01-22  
**Status**: Ready to Use

## 🚀 Quick Start

### 1. Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

**Expected**: Server starts on `http://localhost:5173`

### 2. Open Browser

Navigate to: **http://localhost:5173**

### 3. Login

- **Email**: `admin@example.com`
- **Password**: `admin123`

### 4. Test Projects Page

Navigate to: **http://localhost:5173/projects**

## ✅ System Status Check

```bash
# Check backend
curl http://localhost:2000/health

# Check frontend
curl http://localhost:5173

# Check database
docker-compose exec postgres psql -U postgres -d reconciliation_app -c "SELECT COUNT(*) FROM projects;"
```

## 🧪 Running Tests

### Quick Test Commands
```bash
# Run all tests quickly
./scripts/run-tests-quick.sh all

# Run specific test types
./scripts/run-tests-quick.sh backend
./scripts/run-tests-quick.sh frontend
./scripts/run-tests-quick.sh e2e

# Comprehensive test suite
./scripts/test.sh
```

**📖 For detailed test instructions, see:** [RUN_TESTS_GUIDE.md](../testing/RUN_TESTS_GUIDE.md)

## 📋 Testing Checklist

### Projects Page
- [ ] Page loads at `/projects`
- [ ] Shows "Test Project" card
- [ ] "Create New Project" button works
- [ ] Clicking project navigates to details

### Navigation
- [ ] All menu items work
- [ ] Routes load correctly

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Backend Not Running
```bash
docker-compose up -d backend
```

### Check Logs
```bash
# Frontend logs (if running in terminal)
# Backend logs
docker-compose logs backend --tail=50
```

## 📝 Next Steps

1. ✅ Frontend dev server started
2. ⏳ Test Projects page
3. ⏳ Test project creation
4. ⏳ Test navigation
5. ⏳ Test error handling


