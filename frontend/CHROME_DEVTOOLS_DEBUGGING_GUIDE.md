# Chrome DevTools Frontend Debugging Guide

This guide will help you diagnose and fix a blank frontend page using Chrome DevTools.

## Quick Start Checklist

1. **Open Chrome DevTools** (F12 or Cmd+Option+I / Ctrl+Shift+I)
2. **Check Console Tab** for JavaScript errors (red text)
3. **Check Network Tab** for failed requests (red status codes)
4. **Check Elements Tab** to see if React rendered anything
5. **Check Sources Tab** to verify files are loading

---

## Step-by-Step Debugging Process

### Step 1: Open DevTools and Check Console

1. Open your frontend in Chrome (usually `http://localhost:1000`)
2. Press **F12** or **Cmd+Option+I** (Mac) / **Ctrl+Shift+I** (Windows/Linux)
3. Go to the **Console** tab
4. Look for **red error messages**

#### Common Console Errors:

**Error: "Failed to fetch" or "Network Error"**
- **Cause**: Backend API is not running or CORS issue
- **Fix**: 
  - Ensure backend is running on port 2000: `cd backend && cargo run`
  - Check CORS settings in backend
  - Verify API URL in `frontend/src/config/AppConfig.ts`

**Error: "Cannot read property 'X' of undefined"**
- **Cause**: Missing data or configuration
- **Fix**: Check if environment variables are set correctly

**Error: "Module not found" or "Cannot resolve module"**
- **Cause**: Missing dependencies or incorrect imports
- **Fix**: 
  ```bash
  cd frontend
  npm install
  ```

**Error: "Uncaught SyntaxError"**
- **Cause**: JavaScript syntax error in code
- **Fix**: Check the file mentioned in the error stack trace

**Error: "ReactDOM.createRoot is not a function"**
- **Cause**: React version mismatch
- **Fix**: 
  ```bash
  cd frontend
  npm install react@^18.0.0 react-dom@^18.0.0
  ```

### Step 2: Check Network Tab

1. Go to **Network** tab in DevTools
2. **Refresh the page** (Cmd+R / Ctrl+R)
3. Look for failed requests (red status codes like 404, 500, etc.)

#### What to Check:

**Failed to load `/src/main.tsx` (404)**
- **Cause**: Vite dev server not running or incorrect path
- **Fix**: 
  ```bash
  cd frontend
  npm run dev
  ```
- Verify the server is running on port 1000

**Failed API requests (401, 403, 500)**
- **Cause**: Backend authentication or server errors
- **Fix**: 
  - Check backend logs
  - Verify API endpoints in Network tab
  - Check if authentication token is valid

**CORS errors (blocked by CORS policy)**
- **Cause**: Backend not allowing frontend origin
- **Fix**: Check backend CORS configuration

**Slow requests (taking > 3 seconds)**
- **Cause**: Backend performance issues or network problems
- **Fix**: Check backend logs and database queries

### Step 3: Check Elements Tab

1. Go to **Elements** tab
2. Look for `<div id="root">` in the HTML
3. Check if React has rendered anything inside it

#### What to Look For:

**Empty `<div id="root"></div>`**
- **Cause**: React app failed to mount
- **Fix**: Check Console tab for errors (see Step 1)

**`<div id="root">` contains error messages**
- **Cause**: Error boundary caught an error
- **Fix**: Check the error message and fix the underlying issue

**`<div id="root">` contains loading spinner**
- **Cause**: App is loading but stuck
- **Fix**: Check Network tab for hanging requests

### Step 4: Check Sources Tab

1. Go to **Sources** tab
2. Look in the left sidebar for your files
3. Verify `src/main.tsx` and `src/App.tsx` are present

#### What to Check:

**Files are missing**
- **Cause**: Build/dev server issue
- **Fix**: Restart dev server:
  ```bash
  cd frontend
  npm run dev
  ```

**Files show "404" or are empty**
- **Cause**: Vite not serving files correctly
- **Fix**: 
  - Check `vite.config.ts` configuration
  - Verify file paths are correct
  - Clear cache and restart: `rm -rf node_modules/.vite && npm run dev`

### Step 5: Check Application Tab (Storage)

1. Go to **Application** tab
2. Check **Local Storage** and **Session Storage**
3. Look for authentication tokens or configuration

#### What to Check:

**Missing `auth_token` in Local Storage**
- **Cause**: User not logged in
- **Fix**: Navigate to `/login` page or check authentication flow

**Corrupted data in storage**
- **Cause**: Invalid JSON or corrupted data
- **Fix**: Clear storage:
  - Right-click on storage item → Clear
  - Or use: `localStorage.clear()` in Console

### Step 6: Use React DevTools (If Installed)

1. Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) extension
2. Open DevTools → **Components** tab
3. Check if React components are rendering

#### What to Check:

**No components shown**
- **Cause**: React app not mounting
- **Fix**: Check Console for errors

**Components show but with errors**
- **Cause**: Component-level errors
- **Fix**: Check the error message in the component tree

---

## Common Issues and Solutions

### Issue 1: Completely Blank Page (White Screen)

**Symptoms**: 
- Page loads but shows nothing
- Console shows no errors
- Network tab shows all requests succeeded

**Possible Causes & Fixes**:

1. **CSS Issue** - Styles not loading
   - Check Network tab for CSS files (404 errors)
   - Verify `index.css` is imported in `main.tsx`
   - Check if Tailwind CSS is configured correctly

2. **React Router Issue** - Route not matching
   - Check Console for routing errors
   - Verify `basename` in Router configuration
   - Check if default route is configured

3. **Authentication Redirect Loop**
   - Check Application tab → Local Storage
   - Look for redirect loops in Network tab
   - Verify `ProtectedRoute` component logic

**Quick Fix**:
```bash
# Clear all caches and restart
cd frontend
rm -rf node_modules/.vite dist .vite-cache
npm install
npm run dev
```

### Issue 2: JavaScript Errors in Console

**Error: "process is not defined"**
- **Cause**: Vite environment variable access issue
- **Fix**: Use `import.meta.env` instead of `process.env` in Vite:
  ```typescript
  // ❌ Wrong (Next.js style)
  const apiUrl = process.env.VITE_API_URL;
  
  // ✅ Correct (Vite style)
  const apiUrl = import.meta.env.VITE_API_URL;
  ```

**Error: "Cannot find module"**
- **Cause**: Missing dependency or incorrect import path
- **Fix**: 
  ```bash
  cd frontend
  npm install
  ```
  Check import paths in the file with error

**Error: "Uncaught TypeError: Cannot read property"**
- **Cause**: Null/undefined value being accessed
- **Fix**: Add null checks:
  ```typescript
  // ❌ Wrong
  const value = data.property.subproperty;
  
  // ✅ Correct
  const value = data?.property?.subproperty;
  ```

### Issue 3: Network Errors

**CORS Error: "Access to fetch blocked by CORS policy"**
- **Cause**: Backend not allowing frontend origin
- **Fix**: Check backend CORS configuration:
  ```rust
  // In backend, ensure CORS allows frontend origin
  .wrap(
      Cors::default()
          .allowed_origin("http://localhost:1000")
          .supports_credentials(true)
  )
  ```

**404 Error: API endpoint not found**
- **Cause**: Incorrect API URL or backend route
- **Fix**: 
  - Check `APP_CONFIG.API_URL` in `AppConfig.ts`
  - Verify backend routes match frontend API calls
  - Check Network tab to see actual request URL

**401/403 Error: Unauthorized**
- **Cause**: Missing or invalid authentication token
- **Fix**: 
  - Check if user is logged in
  - Verify token in Local Storage
  - Check token expiration

### Issue 4: Build/Dev Server Issues

**Vite dev server not starting**
- **Fix**: 
  ```bash
  cd frontend
  # Check for port conflicts
  lsof -ti:1000 | xargs kill -9  # Kill process on port 1000
  npm run dev
  ```

**Build fails with errors**
- **Fix**: 
  ```bash
  cd frontend
  rm -rf node_modules dist
  npm install
  npm run build
  ```

---

## Advanced Debugging Techniques

### 1. Add Debug Logging

Add console logs to track app initialization:

```typescript
// In main.tsx
console.log('🚀 App starting...');
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', import.meta.env.VITE_API_URL);

// In App.tsx
console.log('📱 App component rendering...');
```

### 2. Check Environment Variables

In Console tab, run:
```javascript
// Check Vite environment variables
console.log('Vite env:', import.meta.env);

// Check if root element exists
console.log('Root element:', document.getElementById('root'));

// Check if React is loaded
console.log('React:', window.React);
```

### 3. Monitor Network Requests

1. Open Network tab
2. Filter by "XHR" or "Fetch" to see API calls
3. Check request/response headers
4. Look for authentication tokens in headers

### 4. Use Breakpoints

1. Go to Sources tab
2. Find `src/main.tsx` or `src/App.tsx`
3. Click line number to set breakpoint
4. Refresh page - execution will pause
5. Step through code to see what's happening

### 5. Check React Component State

1. Install React DevTools extension
2. Open Components tab
3. Select a component
4. Check props and state in right panel
5. Look for null/undefined values

---

## Quick Diagnostic Commands

Run these in the Console tab:

```javascript
// 1. Check if React is loaded
console.log('React version:', React?.version);

// 2. Check if root element exists
const root = document.getElementById('root');
console.log('Root element:', root);
console.log('Root children:', root?.children);

// 3. Check environment variables
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('WS URL:', import.meta.env.VITE_WS_URL);

// 4. Check localStorage
console.log('Auth token:', localStorage.getItem('auth_token'));

// 5. Check if backend is reachable
fetch('http://localhost:2000/api/health')
  .then(r => r.json())
  .then(data => console.log('Backend health:', data))
  .catch(err => console.error('Backend unreachable:', err));

// 6. Force React to re-render (if app is mounted)
if (window.location.hash === '#debug') {
  window.location.reload();
}
```

---

## Environment Setup Verification

### Check if Dev Server is Running

```bash
# Terminal 1: Backend
cd backend
cargo run
# Should show: "Server running on http://localhost:2000"

# Terminal 2: Frontend
cd frontend
npm run dev
# Should show: "Local: http://localhost:1000"
```

### Verify Environment Variables

Create/check `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
VITE_APP_NAME=Reconciliation Platform
```

### Check Dependencies

```bash
cd frontend
npm list react react-dom react-router-dom
# Should show versions matching package.json
```

---

## Getting Help

If you're still stuck:

1. **Screenshot the Console tab** with all errors visible
2. **Screenshot the Network tab** showing failed requests
3. **Copy the full error message** from Console
4. **Check backend logs** for related errors
5. **Verify both frontend and backend are running**

Common fixes:
- Clear browser cache (Cmd+Shift+Delete / Ctrl+Shift+Delete)
- Restart both frontend and backend servers
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check firewall/antivirus blocking localhost connections

---

## Next Steps After Fixing

Once the blank page is resolved:

1. **Test all routes** - Navigate through the app
2. **Check authentication** - Login/logout flow
3. **Test API calls** - Verify data loading
4. **Check WebSocket** - Real-time features working
5. **Monitor Console** - No new errors appearing

---

## Additional Resources

- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [React DevTools](https://react.dev/learn/react-developer-tools)

