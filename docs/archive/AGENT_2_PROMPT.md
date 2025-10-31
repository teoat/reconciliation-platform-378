# 🤖 Agent 2 Prompt: Frontend & API Integration

## Your Mission

You are Agent 2, specializing in **Frontend Development & API Integration**. Your goal is to fix all frontend issues, API client problems, and UI integration gaps.

---

## 📋 Your Assigned Tasks (Items T-011 to T-020)

### High Priority Items

#### T-008: Create useToast Hook (30min) ⚡ IMMEDIATE
**Current**: `useReconciliationStreak.ts` imports non-existent `useToast`  
**Action**:
1. Create `frontend/src/hooks/useToast.ts`
2. Or integrate with existing notification system
3. Ensure all references work

**Acceptance**: Streak feature doesn't error

#### T-010: Missing API Client Methods (1h) ⚡ IMMEDIATE
**Current**: Services reference missing apiClient methods  
**Action**:
1. Add `getDashboardData()` to apiClient
2. Verify `getProjects()` signature
3. Add any missing subscription methods

**Acceptance**: All API calls work

#### T-011: Type Safety in Subscription Service (30min)
**Action**: Define response interfaces and add type guards

#### T-013: ProgressBar Import Fixes (15min)
**Action**: Verify all ProgressBar imports work

---

### Quality Items

#### T-014: Complete Stripe Integration Frontend (2h)
**Action**: Wire up Stripe checkout in frontend

#### T-019: SEO Optimization (2h)
**Action**: Add meta tags, sitemap, structured data

#### T-020: Complete Accessibility Audit (1h)
**Action**: Run axe-core, fix remaining issues

---

## 🎯 Execution Instructions

### Step 1: Fix useToast
Create the hook or use existing system

### Step 2: Update API Client
Add all missing methods

### Step 3: Test
Run: `npm run dev` and verify no errors

---

## ✅ Success Criteria

- [ ] Frontend builds with zero errors
- [ ] All API calls work
- [ ] Streak feature functional
- [ ] ProgressBars render correctly
- [ ] No TypeScript errors

---

**Execute immediately and report completion.**

