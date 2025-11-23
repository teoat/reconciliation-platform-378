# How to Delete Branches - Step by Step Guide

This guide provides multiple methods to delete the 22 obsolete branches identified in the consolidation plan.

## Prerequisites

- Repository admin access to `teoat/reconciliation-platform-378`
- One of the following:
  - GitHub CLI (`gh`) installed and authenticated
  - Git with push permissions
  - Access to GitHub web interface

## Method 1: Using the Provided Script (Recommended)

### Step 1: Review the Script
```bash
cat scripts/delete-obsolete-branches.sh
```

### Step 2: Run the Script
```bash
cd /path/to/reconciliation-platform-378
./scripts/delete-obsolete-branches.sh
```

### Step 3: Confirm Deletion
When prompted, type `DELETE` to confirm.

### Step 4: Review Results
The script will display a summary of deleted and failed branches.

## Method 2: Using GitHub CLI

The GitHub CLI (`gh`) provides a clean way to delete branches.

### Install GitHub CLI
```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install --id GitHub.cli
```

### Authenticate
```bash
gh auth login
```

### Delete All Branches (One Command)
```bash
# Delete all copilot branches
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/check-integration-sync-links-modules
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/consolidate-all-branches
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/consolidate-branches-into-master
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/consolidate-codebase-to-master
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/consolidate-documentation-repository
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/consolidate-documentation-updates
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/consolidate-project-documentation
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/deploy-all-services-successfully
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/diagnose-failed-checks
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/fix-errors-and-code-issues
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/fix-typescript-errors-and-tests
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/resolve-typescript-errors
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/standardize-default-branch-to-master
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/sub-pr-5
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/sub-pr-5-again
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/sub-pr-5-another-one
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/sub-pr-5-yet-again
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/copilot/update-quality-gates-workflow

# Delete cursor branches
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/cursor/analyze-and-diagnose-repository-40e5
gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/cursor/app-quality-assurance-and-error-resolution-0bd1

# Optional: Delete dependabot branches
# gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/dependabot/npm_and_yarn/development-dependencies-3e6f6454af
# gh api -X DELETE repos/teoat/reconciliation-platform-378/git/refs/heads/dependabot/npm_and_yarn/production-dependencies-850c8e665e
```

### Or Use a Loop (Easier)
Create a file `branches-to-delete.txt`:
```
copilot/check-integration-sync-links-modules
copilot/consolidate-all-branches
copilot/consolidate-branches-into-master
copilot/consolidate-codebase-to-master
copilot/consolidate-documentation-repository
copilot/consolidate-documentation-updates
copilot/consolidate-project-documentation
copilot/deploy-all-services-successfully
copilot/diagnose-failed-checks
copilot/fix-errors-and-code-issues
copilot/fix-typescript-errors-and-tests
copilot/resolve-typescript-errors
copilot/standardize-default-branch-to-master
copilot/sub-pr-5
copilot/sub-pr-5-again
copilot/sub-pr-5-another-one
copilot/sub-pr-5-yet-again
copilot/update-quality-gates-workflow
cursor/analyze-and-diagnose-repository-40e5
cursor/app-quality-assurance-and-error-resolution-0bd1
```

Then run:
```bash
while read branch; do
  echo "Deleting: $branch"
  gh api -X DELETE "repos/teoat/reconciliation-platform-378/git/refs/heads/$branch" && echo "✅ Deleted" || echo "❌ Failed"
done < branches-to-delete.txt
```

## Method 3: Using Git Command Line

```bash
# Delete branches one by one
git push origin --delete copilot/check-integration-sync-links-modules
git push origin --delete copilot/consolidate-all-branches
git push origin --delete copilot/consolidate-branches-into-master
# ... (repeat for all branches)

# Or use a loop
for branch in \
  "copilot/check-integration-sync-links-modules" \
  "copilot/consolidate-all-branches" \
  "copilot/consolidate-branches-into-master" \
  "copilot/consolidate-codebase-to-master" \
  "copilot/consolidate-documentation-repository" \
  "copilot/consolidate-documentation-updates" \
  "copilot/consolidate-project-documentation" \
  "copilot/deploy-all-services-successfully" \
  "copilot/diagnose-failed-checks" \
  "copilot/fix-errors-and-code-issues" \
  "copilot/fix-typescript-errors-and-tests" \
  "copilot/resolve-typescript-errors" \
  "copilot/standardize-default-branch-to-master" \
  "copilot/sub-pr-5" \
  "copilot/sub-pr-5-again" \
  "copilot/sub-pr-5-another-one" \
  "copilot/sub-pr-5-yet-again" \
  "copilot/update-quality-gates-workflow" \
  "cursor/analyze-and-diagnose-repository-40e5" \
  "cursor/app-quality-assurance-and-error-resolution-0bd1"; do
  echo "Deleting: $branch"
  git push origin --delete "$branch" && echo "✅ Success" || echo "❌ Failed"
done
```

## Method 4: Using GitHub Web Interface

For each branch:

1. Go to https://github.com/teoat/reconciliation-platform-378/branches
2. Find the branch in the list
3. Click the trash icon (🗑️) next to the branch name
4. Confirm deletion

**Note**: This method is tedious for 22 branches. Use scripts for efficiency.

## Post-Deletion Steps

After deleting all branches:

### 1. Verify Branches Were Deleted
```bash
# Using Git
git ls-remote --heads origin

# Using GitHub CLI
gh api repos/teoat/reconciliation-platform-378/branches --jq '.[].name'

# Should only show: master
```

### 2. Update Default Branch (if needed)
```bash
# Using GitHub CLI
gh api -X PATCH repos/teoat/reconciliation-platform-378 \
  -f default_branch=master
```

Or via GitHub UI:
1. Go to Settings → General
2. Under "Default branch", ensure `master` is selected
3. Click "Update" if changed

### 3. Update Branch Protection Rules
```bash
# Via GitHub UI:
# 1. Go to Settings → Branches
# 2. Edit branch protection rule for 'master'
# 3. Enable desired protections:
#    - Require pull request reviews
#    - Require status checks to pass
#    - Require conversation resolution
```

### 4. Close Related PRs
Close these PRs as they relate to consolidation work:
- #46, #50, #51, #52, #53, #54, #55 (consolidation/fixes)
- The consolidation PR (will be auto-closed on its branch deletion)

Keep/review:
- #58, #59 (Dependabot updates)

### 5. Update CI/CD Workflows
Check `.github/workflows/*.yml` files and ensure they reference `master` branch.

### 6. Clean Local Repository
```bash
# Fetch and prune deleted branches
git fetch --all --prune

# Delete local tracking branches
git branch -d copilot/consolidate-all-branches
# ... etc for any local branches

# Or delete all local branches except master
git branch | grep -v "master" | xargs git branch -D
```

### 7. Update Documentation
Update references in:
- README.md
- CONTRIBUTING.md
- Any development workflow docs

## Verification Checklist

After completing the deletion:

- [ ] Only `master` branch exists remotely
- [ ] `master` is set as default branch
- [ ] Branch protection rules configured on `master`
- [ ] Related PRs closed
- [ ] CI/CD workflows updated
- [ ] Local repository cleaned
- [ ] Team notified of changes
- [ ] Documentation updated

## Troubleshooting

### Branch Won't Delete - Protected
```bash
# Check protection status
gh api repos/teoat/reconciliation-platform-378/branches/BRANCH_NAME/protection

# Temporarily remove protection, delete, and restore
# (Do this via GitHub UI → Settings → Branches)
```

### Permission Denied
Ensure you have:
- Repository admin access
- Correct authentication (for `gh` or `git`)

### Branch Already Deleted
If a branch is already deleted, the command will fail gracefully. This is expected and OK.

## Summary

After completing these steps, your repository will have:
- ✅ Single branch: `master`
- ✅ Simplified workflow
- ✅ No obsolete branches
- ✅ Clear development path

**Consolidation Complete!** 🎉
