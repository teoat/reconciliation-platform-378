# Frontend Start Guide
**Date**: 2025-01-22  
**Status**: Ready to Execute

## Quick Start

### Step 1: Check Prerequisites

```bash
# Navigate to project root
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378

# Check if backend is running
curl http://localhost:2000/health

# Check if frontend dependencies are installed
cd frontend && test -f node_modules/.bin/vite && echo "✅ Ready" || npm install
```

### Step 2: Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

**Expected Output**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Open Browser

1. Navigate to: `http://localhost:5173`
2. You should see the login page

### Step 4: Test Projects Page

1. **Login** (if not already logged in):
   - Email: `admin@example.com`
   - Password: `admin123`

2. **Navigate to Projects**:
   - Click "Projects" in navigation menu, OR
   - Go directly to: `http://localhost:5173/projects`

3. **Verify Projects Page**:
   - Should show "Test Project" card (if backend is connected)
   - Should show loading spinner initially
   - Should display project name, description, status

## Testing Checklist

### ✅ Projects Page
- [ ] Page loads without 404 error
- [ ] Shows loading spinner initially
- [ ] Displays projects in grid layout
- [ ] Shows "Test Project" card (if backend connected)
- [ ] Empty state shows if no projects
- [ ] "Create New Project" button works
- [ ] Clicking project card navigates to details

### ✅ Navigation
- [ ] All menu items work
- [ ] Navigation links are clickable
- [ ] Routes load correctly

### ✅ Error Handling
- [ ] Error message shows if backend is down
- [ ] Retry button works
- [ ] Loading states display correctly

## Troubleshooting

### Frontend Won't Start

**Problem**: Port 5173 already in use
```bash
# Find process using port
lsof -ti:5173

# Kill process (replace PID)
kill -9 <PID>

# Or use different port
npm run dev -- --port 5174
```

**Problem**: Dependencies not installed
```bash
cd frontend
npm install
```

**Problem**: Node version incompatible
```bash
# Check Node version
node --version

# Should be Node 18+ or 20+
```

### Backend Connection Issues

**Problem**: Frontend can't connect to backend
```bash
# Verify backend is running
curl http://localhost:2000/health

# Check backend logs
docker-compose logs backend | tail -20
```

**Problem**: CORS errors
- Backend should allow `http://localhost:5173`
- Check backend CORS configuration

### Projects Not Loading

**Problem**: Authentication required
- Make sure you're logged in
- Check browser console for auth errors
- Verify JWT token is stored

**Problem**: API returns 404
- Verify backend endpoint: `GET /api/v1/projects`
- Check backend routes configuration

## Environment Variables

Frontend uses environment variables from `.env` files:

```bash
# Check if .env file exists
cd frontend
ls -la .env*

# Common variables:
# VITE_API_BASE_URL=http://localhost:2000
# VITE_WS_URL=ws://localhost:2000
# VITE_GOOGLE_CLIENT_ID=...
```

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test
```

## Next Steps After Starting

1. ✅ Frontend dev server running
2. ⏳ Test Projects page (`/projects`)
3. ⏳ Test project creation (`/projects/new`)
4. ⏳ Test project details (`/projects/{id}`)
5. ⏳ Test navigation links
6. ⏳ Test error scenarios

## Related Documentation

- [Next Steps Completion Report](./NEXT_STEPS_COMPLETION_REPORT.md)
- [Projects Page Enhancement](./PROJECTS_PAGE_ENHANCEMENT.md)
- [TODO Status Update](./TODO_STATUS_UPDATE.md)


