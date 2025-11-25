# GitHub-Local Sync - Quick Reference

**Last Updated:** 2025-01-25  
**Full Proposal:** [GITHUB_LOCAL_SYNC_PROPOSAL.md](./GITHUB_LOCAL_SYNC_PROPOSAL.md)

---

## Current Status

✅ **Safe to Push** - Local is 5 commits ahead, no divergence  
⚠️ **1 Untracked File** - `FrenlyProvider.consolidated.tsx` needs decision  
⚠️ **32 Remote Branches** - Many obsolete, can be cleaned up

---

## Quick Sync Commands

### Option 1: Automated Script (Recommended)
```bash
./scripts/sync-github-local.sh
```

### Option 2: Manual Sync
```bash
# 1. Handle untracked file (choose one)
git add frontend/src/components/frenly/FrenlyProvider.consolidated.tsx
git commit -s -m "feat(frenly): Add consolidated FrenlyProvider"

# OR remove if temporary
rm frontend/src/components/frenly/FrenlyProvider.consolidated.tsx

# 2. Push to remote
git push origin master

# 3. Verify
git fetch origin && git status
```

---

## Untracked File Decision

**File:** `frontend/src/components/frenly/FrenlyProvider.consolidated.tsx`

**Context:**
- Appears to be a consolidated/improved version
- Existing files: `FrenlyProvider.tsx` (2 locations)
- Size: ~730 lines (consolidated version)

**Options:**
1. **Add** - If it's the improved/working version
2. **Remove** - If it's temporary/backup
3. **Review & Merge** - Compare with existing, merge improvements, then remove

**Recommendation:** Review and compare with existing files before deciding.

---

## Branch Cleanup

**Obsolete Branches:** ~30 branches (copilot/cursor branches)

**Cleanup Script:**
```bash
./scripts/delete-obsolete-branches.sh
```

**Manual Check:**
```bash
# List remote branches
git branch -r

# Check for unique commits
git log --oneline master..origin/copilot/consolidate-all-branches
```

---

## Verification Checklist

After sync:
- [ ] `git status` shows clean working directory
- [ ] `git log --oneline -5` shows pushed commits
- [ ] `git fetch origin && git status` shows "up to date"
- [ ] All verification scripts pass

---

## Troubleshooting

**Push Rejected?**
```bash
git fetch origin
git rebase origin/master  # or merge
git push origin master
```

**Branches Diverged?**
```bash
# Review divergence
git log --oneline --graph --decorate -10 HEAD origin/master

# Rebase (preferred)
git rebase origin/master

# Or merge
git merge origin/master
```

---

## Related Files

- **Full Proposal:** `docs/operations/GITHUB_LOCAL_SYNC_PROPOSAL.md`
- **Sync Script:** `scripts/sync-github-local.sh`
- **Branch Cleanup:** `scripts/delete-obsolete-branches.sh`

