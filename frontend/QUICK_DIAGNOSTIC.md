# Quick Frontend Diagnostic Guide

## Immediate Steps to Diagnose Blank Page

### 1. Open Chrome DevTools
- Press **F12** or **Cmd+Option+I** (Mac) / **Ctrl+Shift+I** (Windows/Linux)

### 2. Check Console Tab First
Look for **RED error messages**. Common ones:

```
❌ Failed to fetch
❌ Cannot read property 'X' of undefined  
❌ Module not found
❌ Uncaught SyntaxError
❌ process is not defined
```

### 3. Run This Diagnostic Script

Copy and paste this into the **Console** tab:

```javascript
// ============================================
// FRONTEND DIAGNOSTIC SCRIPT
// ============================================
console.log('🔍 Starting Frontend Diagnostic...\n');

// 1. Check if root element exists
const root = document.getElementById('root');
console.log('1. Root Element:', root ? '✅ Found' : '❌ Missing');
if (root) {
  console.log('   - Has children:', root.children.length > 0);
  console.log('   - Inner HTML length:', root.innerHTML.length);
}

// 2. Check if React is loaded
console.log('\n2. React Status:');
console.log('   - React:', typeof React !== 'undefined' ? '✅ Loaded' : '❌ Not loaded');
console.log('   - ReactDOM:', typeof ReactDOM !== 'undefined' ? '✅ Loaded' : '❌ Not loaded');
if (typeof React !== 'undefined') {
  console.log('   - React version:', React.version);
}

// 3. Check environment variables
console.log('\n3. Environment Variables:');
try {
  const env = import.meta.env;
  console.log('   - API URL:', env.VITE_API_URL || '❌ Not set');
  console.log('   - WS URL:', env.VITE_WS_URL || '❌ Not set');
  console.log('   - Mode:', env.MODE || '❌ Not set');
} catch (e) {
  console.log('   - ❌ Cannot access import.meta.env:', e.message);
}

// 4. Check localStorage
console.log('\n4. Local Storage:');
const authToken = localStorage.getItem('auth_token');
console.log('   - Auth Token:', authToken ? '✅ Present' : '❌ Missing');
console.log('   - User Data:', localStorage.getItem('user_data') ? '✅ Present' : '❌ Missing');

// 5. Check if backend is reachable
console.log('\n5. Backend Connectivity:');
fetch('http://localhost:2000/api/health')
  .then(r => {
    if (r.ok) {
      console.log('   - ✅ Backend is reachable');
      return r.json();
    } else {
      console.log('   - ⚠️ Backend responded with status:', r.status);
    }
  })
  .then(data => {
    if (data) console.log('   - Response:', data);
  })
  .catch(err => {
    console.log('   - ❌ Backend unreachable:', err.message);
    console.log('   - 💡 Make sure backend is running on port 2000');
  });

// 6. Check for JavaScript errors
console.log('\n6. Error Check:');
const errors = window.onerror ? 'Handler exists' : 'No global handler';
console.log('   - Global error handler:', errors);

// 7. Check network requests
console.log('\n7. Network Status:');
console.log('   - 💡 Open Network tab to see failed requests');
console.log('   - Look for red status codes (404, 500, etc.)');

// 8. Check if Vite dev server is running
console.log('\n8. Dev Server Check:');
fetch('http://localhost:1000')
  .then(r => {
    if (r.ok) {
      console.log('   - ✅ Vite dev server is running');
    } else {
      console.log('   - ⚠️ Dev server responded with status:', r.status);
    }
  })
  .catch(err => {
    console.log('   - ❌ Dev server unreachable:', err.message);
    console.log('   - 💡 Run: cd frontend && npm run dev');
  });

// 9. Check for common issues
console.log('\n9. Common Issues Check:');
const issues = [];

if (!root) {
  issues.push('❌ Root element (#root) not found in HTML');
}
if (typeof React === 'undefined') {
  issues.push('❌ React is not loaded - check if npm install completed');
}
if (!localStorage.getItem('auth_token') && window.location.pathname !== '/login') {
  issues.push('⚠️ No auth token - might need to login');
}

if (issues.length === 0) {
  console.log('   - ✅ No obvious issues detected');
} else {
  console.log('   - Issues found:');
  issues.forEach(issue => console.log('     ' + issue));
}

console.log('\n✅ Diagnostic complete!');
console.log('📋 Next steps:');
console.log('   1. Check Console tab for errors (red text)');
console.log('   2. Check Network tab for failed requests');
console.log('   3. Check Elements tab - look for <div id="root">');
console.log('   4. See CHROME_DEVTOOLS_DEBUGGING_GUIDE.md for detailed help');
```

---

## Quick Fixes Based on Diagnostic Results

### If Root Element is Missing
```bash
# Check if index.html exists and has <div id="root">
cat frontend/index.html
```

### If React is Not Loaded
```bash
cd frontend
npm install
npm run dev
```

### If Backend is Unreachable
```bash
# Start backend in another terminal
cd backend
cargo run
```

### If Dev Server is Not Running
```bash
cd frontend
npm run dev
# Should see: "Local: http://localhost:1000"
```

### If Environment Variables are Missing
Create `frontend/.env` file:
```env
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
```

---

## Most Common Issues

### 1. **Completely Blank White Page**
- **Check**: Console for JavaScript errors
- **Fix**: Usually a syntax error or missing dependency

### 2. **Page Loads but Shows Nothing**
- **Check**: Elements tab - is `<div id="root">` empty?
- **Fix**: React app not mounting - check Console for errors

### 3. **Network Errors (CORS, 404, 500)**
- **Check**: Network tab for failed requests
- **Fix**: Backend not running or CORS misconfigured

### 4. **"process is not defined" Error**
- **Fix**: Use `import.meta.env` instead of `process.env` in Vite

### 5. **Module Not Found Errors**
- **Fix**: Run `npm install` in frontend directory

---

## Still Stuck?

1. **Screenshot the Console tab** (all errors visible)
2. **Screenshot the Network tab** (showing failed requests)
3. **Check if both servers are running**:
   ```bash
   # Terminal 1: Backend
   cd backend && cargo run
   
   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```
4. **Clear browser cache**: Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)
5. **Try incognito/private window** to rule out extensions

See `CHROME_DEVTOOLS_DEBUGGING_GUIDE.md` for comprehensive debugging steps.

