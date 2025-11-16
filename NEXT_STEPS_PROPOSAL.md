# Next Steps Proposal

**Date**: November 16, 2025  
**Current Status**: Password Manager & Google OAuth Integration Complete  
**System Health**: Backend ✅ | Frontend ⚠️ (unhealthy)

---

## 🎯 Immediate Priority (Next Session)

### 1. Fix Password Manager Storage Permission Issue ⚠️ **CRITICAL**
**Status**: Blocking password manager initialization  
**Impact**: High - Prevents password manager from working properly

**Issue**: 
```
Failed to initialize default passwords: InternalServerError("Failed to create storage dir: Permission denied (os error 13)")
```

**Solution**:
- Check password manager storage directory permissions in Docker container
- Ensure `/app/storage` or similar directory exists and is writable
- Update Dockerfile to create directory with proper permissions
- Or migrate to database-backed storage (already has `password_manager_db.rs`)

**Estimated Time**: 30-60 minutes  
**Files to Modify**:
- `infrastructure/docker/Dockerfile.backend` - Add storage directory creation
- `backend/src/services/password_manager.rs` - Fix storage path or use DB

---

### 2. Fix Frontend Health Check ⚠️ **HIGH**
**Status**: Frontend container showing as unhealthy  
**Impact**: Medium - May affect production readiness

**Investigation Needed**:
- Check frontend health check endpoint
- Verify Nginx configuration
- Check for startup errors in frontend logs

**Estimated Time**: 30-45 minutes  
**Files to Check**:
- `docker-compose.yml` - Frontend health check configuration
- `infrastructure/docker/Dockerfile.frontend` - Health check setup
- Frontend container logs

---

### 3. Implement Master Key Cleanup on Logout 🔒 **HIGH**
**Status**: Security improvement needed  
**Impact**: High - Security best practice

**Current Issue**: User's master key (login password) remains in memory after logout

**Solution**:
- Add logout handler that clears user's master key from password manager
- Implement session timeout to auto-clear keys
- Add middleware to clear keys on token expiration

**Estimated Time**: 1-2 hours  
**Files to Modify**:
- `backend/src/handlers/auth.rs` - Add logout handler
- `backend/src/services/password_manager.rs` - Add `clear_user_master_key()` method
- `backend/src/middleware/auth.rs` - Add session cleanup

---

## 📋 High Priority (This Week)

### 4. Fix Remaining Console Statements 🧹 **MEDIUM**
**Status**: 17 remaining (down from 97)  
**Impact**: Medium - Code quality improvement

**Remaining Locations**:
- Utility files (mostly acceptable)
- Service worker (may need for debugging)
- Error handlers (may need for production debugging)

**Decision Needed**: 
- Are these console statements intentional for debugging?
- Should they be replaced with structured logging?
- Or kept for production error tracking?

**Estimated Time**: 1-2 hours  
**Files**: See `AUDIT_TASKS_COMPLETION_SUMMARY.md` for list

---

### 5. Fix Undefined/Null Display Issues 🐛 **MEDIUM**
**Status**: 20 frontend files identified  
**Impact**: Medium - User experience improvement

**Issue**: Frontend may display "undefined" or "null" to users

**Solution**:
- Add null checks in identified files
- Use optional chaining (`?.`)
- Add default values for display
- Implement proper error boundaries

**Estimated Time**: 2-3 hours  
**Files**: See audit summary for list

---

### 6. OAuth User Password Manager Support 🔐 **MEDIUM**
**Status**: Feature gap identified  
**Impact**: Medium - Feature completeness

**Current Issue**: OAuth users can't use password manager (no password to use as master key)

**Solution Options**:
1. **Derived Key Approach**: Use `hash(email + server_secret)` as master key
2. **Skip for OAuth**: OAuth users don't need password manager
3. **Separate OAuth Flow**: Use OAuth token as master key (less secure)

**Recommended**: Option 1 (Derived Key) - Most secure and user-friendly

**Estimated Time**: 2-3 hours  
**Files to Modify**:
- `backend/src/handlers/auth.rs` - Google OAuth handler
- `backend/src/services/password_manager.rs` - Add OAuth master key derivation

---

## 🔧 Medium Priority (Next 2 Weeks)

### 7. Replace Unsafe Error Handling 🛡️ **MEDIUM**
**Status**: ~75 instances in production code  
**Impact**: Medium - Code reliability

**Focus Areas**:
- Initialization code (can use `unwrap_or_default()`)
- Default implementations (can use `unwrap_or()`)
- Critical paths (must use proper error handling)

**Strategy**: 
- Prioritize critical paths first
- Use `unwrap_or_default()` for initialization
- Keep `unwrap` in test code (acceptable)

**Estimated Time**: 4-6 hours  
**Files**: See audit summary

---

### 8. Add Test Coverage 📊 **LOW-MEDIUM**
**Status**: ~10-15% overall coverage  
**Impact**: Medium - Code quality and reliability

**Priority Tests**:
1. Password manager encryption/decryption
2. Google OAuth token validation
3. Login flow with master key setting
4. Password manager API endpoints

**Estimated Time**: 6-8 hours  
**Files**: Create new test files

---

### 9. Fix Function Delimiter Issues 🔧 **LOW**
**Status**: Need to search for mismatched delimiters  
**Impact**: Low - Compilation issues

**Known Pattern**: Function signatures ending with `})` instead of `)`

**Estimated Time**: 1-2 hours  
**Files**: Search backend/src for pattern

---

## 🎨 Nice-to-Have (Future)

### 10. Component Refactoring 📦
- Split large component files (IngestionPage, ReconciliationPage)
- Improve maintainability
- **Note**: Not blocking production

### 11. Accessibility Verification ♿
- Manual testing needed
- ARIA attributes verification
- Keyboard navigation testing

### 12. Performance Monitoring 📈
- Set up Prometheus metrics
- Add performance dashboards
- Monitor password manager operations

---

## 🚀 Recommended Execution Order

### **This Session** (2-3 hours):
1. ✅ Fix password manager storage permission (30-60 min)
2. ✅ Fix frontend health check (30-45 min)
3. ✅ Implement master key cleanup on logout (1-2 hours)

### **This Week** (6-8 hours):
4. Fix remaining console statements (1-2 hours)
5. Fix undefined/null display issues (2-3 hours)
6. OAuth user password manager support (2-3 hours)

### **Next 2 Weeks** (10-14 hours):
7. Replace unsafe error handling (4-6 hours)
8. Add test coverage (6-8 hours)

---

## 📊 Impact Assessment

| Task | Priority | Impact | Effort | ROI |
|------|----------|--------|--------|-----|
| Fix Storage Permission | 🔴 Critical | High | Low | ⭐⭐⭐⭐⭐ |
| Fix Frontend Health | 🟠 High | Medium | Low | ⭐⭐⭐⭐ |
| Master Key Cleanup | 🟠 High | High | Medium | ⭐⭐⭐⭐⭐ |
| Console Statements | 🟡 Medium | Low | Low | ⭐⭐ |
| Null/Undefined Fixes | 🟡 Medium | Medium | Medium | ⭐⭐⭐ |
| OAuth Password Manager | 🟡 Medium | Medium | Medium | ⭐⭐⭐ |
| Error Handling | 🟡 Medium | Medium | High | ⭐⭐⭐ |
| Test Coverage | 🟡 Medium | High | High | ⭐⭐⭐⭐ |

---

## 💡 Quick Wins (Do First)

1. **Fix Storage Permission** - 30 min, unblocks password manager
2. **Fix Frontend Health** - 30 min, improves system health
3. **Master Key Cleanup** - 1-2 hours, security improvement

**Total Quick Wins**: 2-3 hours, high impact

---

## 🎯 Success Criteria

- ✅ Password manager fully functional (no permission errors)
- ✅ All services healthy (frontend + backend)
- ✅ Master keys cleared on logout
- ✅ OAuth users can use password manager
- ✅ No undefined/null displayed to users
- ✅ Test coverage >20% for critical paths

---

**Next Action**: Start with fixing password manager storage permission issue

