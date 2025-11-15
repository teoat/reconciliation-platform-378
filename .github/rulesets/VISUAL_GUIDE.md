# GitHub Rulesets - Visual Overview

## 🌳 Branch Protection Hierarchy

```
Repository: reconciliation-platform-378
│
├── Protected Branches (STRICT) 🔒
│   ├── master
│   └── main
│   
│   Rules:
│   ✅ Required PR (1+ approval)
│   ✅ Code owner review
│   ✅ All status checks must pass
│   ✅ Signed commits
│   ✅ Linear history
│   ❌ No force push
│   ❌ No deletion
│
├── Development Branches (MODERATE) 🛡️
│   ├── develop
│   ├── dev
│   └── staging
│   
│   Rules:
│   ✅ Required PR (1+ approval)
│   ✅ Status checks must pass
│   ❌ No force push
│   ❌ No deletion
│
├── Feature Branches (PERMISSIVE) 🚧
│   ├── feature/**
│   ├── feat/**
│   ├── copilot/**
│   ├── fix/**
│   └── hotfix/**
│   
│   Rules:
│   ⚠️  Lint check (warning)
│   ⚠️  Build check (warning)
│
└── Release Tags (IMMUTABLE) 🏷️
    ├── v*
    └── release-*
    
    Rules:
    ✅ Protected on creation
    ❌ Cannot be updated
    ❌ Cannot be deleted
```

## 🔄 Workflow Flow

```
Feature Development → Pull Request → Review & Checks → Merge
```

### Detailed Flow

```
┌─────────────────┐
│ Developer       │
│ Creates Branch  │
└────────┬────────┘
         │
         ├─ feature/* ──→ Warnings only
         ├─ fix/*     ──→ Warnings only  
         └─ hotfix/*  ──→ Warnings only
         │
         ▼
┌─────────────────┐
│ Make Changes    │
│ Commit Code     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Push to GitHub  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create PR to    │
│ develop/master  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Automatic Checks Run                │
│                                     │
│ ✓ lint (ESLint)                    │
│ ✓ type-check (TypeScript)          │
│ ✓ test-frontend (Jest/React)       │
│ ✓ test-backend (Cargo test)        │
│ ✓ Security Scan (if master/main)   │
└─────────┬───────────────────────────┘
          │
          ├─ All Pass ──→ Continue
          └─ Any Fail ──→ Fix & Push Again
          │
          ▼
┌─────────────────┐
│ Request Review  │
│ from Code Owner │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Reviewer        │
│ Approves PR     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Resolve All     │
│ Conversations   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ✅ MERGE        │
│ ALLOWED         │
└─────────────────┘
```

## 📊 Status Check Matrix

| Branch Type | lint | type-check | test-frontend | test-backend | Security Scan | Build |
|-------------|------|------------|---------------|--------------|---------------|-------|
| **master/main** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | - |
| **develop** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | - | - |
| **feature/** | ⚠️ Warning | - | - | - | - | ⚠️ Warning |

Legend:
- ✅ Required = Blocks merge if failing
- ⚠️ Warning = Shows status but doesn't block
- `-` = Not checked

## 👥 Access Control Matrix

| Action | Protected<br>(master/main) | Development<br>(develop/dev) | Feature<br>(feature/*) | Tags<br>(v*) |
|--------|---------------------------|------------------------------|----------------------|--------------|
| **Direct Push** | ❌ Blocked | ❌ Blocked | ✅ Allowed | ❌ Blocked |
| **Force Push** | ❌ Blocked | ❌ Blocked | ✅ Allowed | ❌ Blocked |
| **Delete Branch** | ❌ Blocked | ❌ Blocked | ✅ Allowed | ❌ Blocked |
| **Create PR** | ✅ Allowed | ✅ Allowed | ✅ Allowed | N/A |
| **Merge without Review** | ❌ Blocked | ❌ Blocked | ✅ Allowed | N/A |
| **Merge with Failing Checks** | ❌ Blocked | ❌ Blocked | ⚠️ Warning | N/A |
| **Admin Bypass** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

## 🎯 Decision Tree: Which Branch Should I Use?

```
Start: I need to make a change
│
├─ Is it a bug fix for production?
│  └─ YES → Create hotfix/* branch from master
│     └─ Merge to master via PR (strict checks)
│
├─ Is it a new feature?
│  └─ YES → Create feature/* branch from develop
│     └─ Merge to develop via PR (moderate checks)
│
├─ Is it a fix for existing feature?
│  └─ YES → Create fix/* branch from develop
│     └─ Merge to develop via PR (moderate checks)
│
├─ Is it an AI/Copilot experiment?
│  └─ YES → Create copilot/* branch from develop
│     └─ Merge to develop via PR (moderate checks)
│
└─ Is it a release?
   └─ YES → Tag from master with v* or release-*
      └─ Tag is immutable once created
```

## 🔐 Security Levels

```
┌─────────────────────────────────────────────────┐
│ LEVEL 1: MAXIMUM SECURITY (master/main)        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ • Signed commits required                       │
│ • Linear history enforced                       │
│ • Code owner approval mandatory                 │
│ • All security scans must pass                  │
│ • 100% test coverage target                     │
│ • No direct commits                             │
│ • No force push ever                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ LEVEL 2: BALANCED (develop/dev/staging)        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ • PR review required                            │
│ • Core tests must pass                          │
│ • Type safety enforced                          │
│ • No force push                                 │
│ • Allows rapid iteration                        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ LEVEL 3: PERMISSIVE (feature/fix/copilot)     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ • Basic lint warnings                           │
│ • Build warnings                                │
│ • Encourages experimentation                    │
│ • Easy collaboration                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ LEVEL 4: IMMUTABLE (release tags)              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ • Cannot be modified                            │
│ • Cannot be deleted                             │
│ • Permanent record                              │
│ • Audit trail preserved                         │
└─────────────────────────────────────────────────┘
```

## 📈 Enforcement Timeline

```
Day 1-7: EVALUATE MODE
├─ Rulesets show warnings
├─ No blocking enforcement
├─ Team gets familiar
└─ Collect feedback

Day 8-14: SOFT ENFORCEMENT
├─ Switch to active mode
├─ Monitor for issues
├─ Quick adjustments
└─ Address edge cases

Day 15+: FULL ENFORCEMENT
├─ All rulesets active
├─ Team adapted
├─ Regular reviews
└─ Continuous improvement
```

## 🎨 Color-Coded Branch Strategy

```
Production:    🔴 master/main     (RED - Danger zone, strict)
Development:   🟡 develop/dev     (YELLOW - Caution, moderate)
Features:      🟢 feature/*       (GREEN - Safe, permissive)
Fixes:         🔵 fix/*           (BLUE - Targeted changes)
Hotfixes:      🟠 hotfix/*        (ORANGE - Urgent, careful)
Experiments:   🟣 copilot/*       (PURPLE - AI-assisted)
```

## 📋 Quick Command Reference

```bash
# Start new feature
git checkout develop
git pull
git checkout -b feature/my-feature

# Commit with signature
git commit -s -m "feat: Add new feature"

# Push and create PR
git push origin feature/my-feature
gh pr create --base develop --title "Add new feature"

# Hotfix to production
git checkout master
git pull
git checkout -b hotfix/critical-fix
git commit -s -m "fix: Critical bug"
git push origin hotfix/critical-fix
gh pr create --base master --title "Critical fix"

# Create release tag
git checkout master
git pull
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 🔍 Troubleshooting Quick Guide

```
Problem: PR blocked ❌
│
├─ Failing checks?
│  └─ Run locally: npm run lint && npm test
│
├─ Missing approval?
│  └─ Request review from code owner
│
├─ Conversations open?
│  └─ Resolve all comment threads
│
└─ Branch out of date?
   └─ git merge develop or rebase
```

---

**Legend**
- ✅ = Allowed/Required
- ❌ = Blocked/Forbidden
- ⚠️ = Warning (doesn't block)
- 🔒 = Strictly protected
- 🛡️ = Moderately protected
- 🚧 = Work in progress
- 🏷️ = Tagged/Released

For detailed documentation, see:
- Full guide: `.github/rulesets/README.md`
- Implementation: `.github/rulesets/IMPLEMENTATION.md`
- Quick reference: `.github/rulesets/QUICK_REFERENCE.md`
