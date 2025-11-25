# 🚀 Build Orchestration Quick Reference

**Purpose**: Quick checklist for executing the ultimate build orchestration

**Full Prompt**: See [ULTIMATE_BUILD_ORCHESTRATION_PROMPT.md](./ULTIMATE_BUILD_ORCHESTRATION_PROMPT.md)

---

## ⚡ Quick Execution Checklist

### Phase 1: Diagnostic (Run All)
```bash
# 1. Structure Analysis
find . -type f \( -name "*.rs" -o -name "*.ts" -o -name "*.tsx" \) | wc -l
find . -name "Cargo.toml" -o -name "package.json" | head -20

# 2. Compilation Errors
cd backend && cargo check --all-targets > ../diagnostic-results/rust-errors.log 2>&1
cd frontend && npm run build > ../diagnostic-results/frontend-errors.log 2>&1

# 3. Import/Export Issues
npx madge --circular frontend/src 2>&1 | tee diagnostic-results/circular-deps.log

# 4. Database
cd backend && sqlx migrate info 2>&1 | tee ../diagnostic-results/migrations.log

# 5. Environment
find . -name ".env*" | grep -v node_modules

# 6. Documentation
find docs -name "*.md" -exec basename {} \; | sort | uniq -d
```

### Phase 2: Critical Fixes (Priority Order)

#### 2.1 Rust Compilation Errors
- [ ] Fix function signature mismatches
- [ ] Fix `})` → `)` in parameter lists
- [ ] Fix import errors
- [ ] Update test signatures

#### 2.2 TypeScript Errors
- [ ] Fix ARIA attributes: `"{value}"` → `{value}`
- [ ] Add `aria-label` to icon buttons
- [ ] Fix circular dependencies
- [ ] Fix type errors

#### 2.3 Import/Export
- [ ] Resolve duplicate exports
- [ ] Break circular dependencies
- [ ] Remove unused imports

#### 2.4 Database
- [ ] Create missing migrations
- [ ] Fix migration conflicts
- [ ] Add missing indexes

#### 2.5 Environment
- [ ] Update .env.example
- [ ] Remove hardcoded secrets
- [ ] Document required variables

#### 2.6 Documentation
- [ ] Merge duplicates
- [ ] Archive old reports
- [ ] Update cross-references

### Phase 3: Verification
```bash
# Backend
cd backend && cargo build && cargo test

# Frontend
cd frontend && npm run build && npm test
```

---

## 🔍 Common Issues & Quick Fixes

### Rust: Function Signature Error
```rust
// ❌ Wrong
pub fn example(param: String}) -> AppResult<()> {

// ✅ Correct
pub fn example(param: String) -> AppResult<()> {
```

### TypeScript: ARIA Attribute Error
```typescript
// ❌ Wrong
<div aria-label="{value}">

// ✅ Correct
<div aria-label={value}>
```

### TypeScript: Missing Button Label
```typescript
// ❌ Wrong
<button><Icon /></button>

// ✅ Correct
<button aria-label="Action" title="Action"><Icon /></button>
```

### Import: Duplicate Export
```typescript
// ❌ Wrong: Multiple exports
// file1.ts
export const Service = { ... }
// file2.ts
export const Service = { ... }

// ✅ Correct: Single export
// services/service.ts (SSOT)
export const Service = { ... }
```

---

## 📊 Success Criteria

- ✅ `cargo build` succeeds
- ✅ `npm run build` succeeds
- ✅ All tests pass
- ✅ No critical security issues
- ✅ Migrations run successfully
- ✅ Documentation consolidated

---

**See full prompt for detailed instructions**: [ULTIMATE_BUILD_ORCHESTRATION_PROMPT.md](./ULTIMATE_BUILD_ORCHESTRATION_PROMPT.md)

