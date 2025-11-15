# GitHub Repository Rulesets

This directory contains optimized GitHub repository rulesets for the Reconciliation Platform. Rulesets provide better control and flexibility compared to traditional branch protection rules.

## 📋 Overview

Repository rulesets allow you to:
- ✅ Control branch protection, tag protection, and other repository settings
- ✅ Apply rules to multiple branches/tags using patterns
- ✅ Configure different enforcement levels (active, evaluate, disabled)
- ✅ Define bypass actors (roles, teams, apps)
- ✅ Require status checks from CI/CD workflows

## 🗂️ Ruleset Files

### 1. `protected-branches.json`
**Purpose**: Strict protection for production branches (master/main)

**Applies to**: `master`, `main` branches

**Enforcement**: Active (strictly enforced)

**Rules**:
- ❌ Prevent branch deletion
- ❌ Prevent force pushes (non-fast-forward updates)
- ✅ Require linear history (no merge commits from PRs)
- ✅ Require commit signatures (GPG/SSH)
- ✅ Require pull request with:
  - 1 approving review minimum
  - Code owner review required
  - Stale reviews dismissed on new push
  - All conversations must be resolved
- ✅ Required status checks:
  - Backend Tests
  - Frontend Tests
  - Security Scan
  - lint
  - type-check

**Bypass**: Repository administrators only

---

### 2. `development-branches.json`
**Purpose**: Protection for development/staging branches

**Applies to**: `develop`, `dev`, `staging` branches

**Enforcement**: Active

**Rules**:
- ❌ Prevent branch deletion
- ❌ Prevent force pushes
- ✅ Require pull request with:
  - 1 approving review
  - No code owner review required
  - Stale reviews not dismissed
- ✅ Required status checks:
  - lint
  - type-check
  - test-frontend
  - test-backend

**Bypass**: Repository administrators only

---

### 3. `feature-branches.json`
**Purpose**: Basic checks for feature/fix branches

**Applies to**: `feature/**`, `feat/**`, `copilot/**`, `fix/**`, `hotfix/**`

**Enforcement**: Evaluate (shows warnings, doesn't block)

**Rules**:
- ✅ Allow branch creation and updates
- ✅ Required status checks (non-blocking):
  - lint
  - build

**Bypass**: Administrators and maintainers

---

### 4. `release-tags.json`
**Purpose**: Protect release tags from modification

**Applies to**: `v*`, `release-*` tags

**Enforcement**: Active

**Rules**:
- ✅ Protect tag creation
- ❌ Prevent tag updates
- ❌ Prevent tag deletion
- ✅ Require linear history

**Bypass**: Repository administrators only

---

## 🚀 Implementation

### Option 1: GitHub Web UI (Recommended)
1. Go to your repository Settings
2. Navigate to **Rules** → **Rulesets**
3. Click **New ruleset** → **Import a ruleset**
4. Upload each JSON file from this directory
5. Review and activate each ruleset

### Option 2: GitHub API
```bash
# Using GitHub CLI
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/rulesets \
  --input protected-branches.json

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/rulesets \
  --input development-branches.json

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/rulesets \
  --input feature-branches.json

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/rulesets \
  --input release-tags.json
```

### Option 3: Terraform
```hcl
resource "github_repository_ruleset" "protected_branches" {
  repository = "reconciliation-platform-378"
  name       = "Protected Branches - Production"
  target     = "branch"
  enforcement = "active"
  
  # ... (see terraform example in docs/)
}
```

---

## 🔧 Customization

### Adding New Status Checks
To add a new required status check, edit the relevant ruleset file:

```json
{
  "type": "required_status_checks",
  "parameters": {
    "required_status_checks": [
      {
        "context": "new-check-name",
        "integration_id": null
      }
    ]
  }
}
```

### Adjusting Review Requirements
Modify the `pull_request` rule parameters:

```json
{
  "type": "pull_request",
  "parameters": {
    "required_approving_review_count": 2,  // Change from 1 to 2
    "dismiss_stale_reviews_on_push": true,
    "require_code_owner_review": true
  }
}
```

### Changing Enforcement Level
- `"active"`: Rules are enforced (blocks non-compliant actions)
- `"evaluate"`: Rules are evaluated but only show warnings
- `"disabled"`: Rules are disabled

---

## 📊 Status Check Mapping

Based on current GitHub Actions workflows:

| Workflow | Job Name | Runs On | Required For |
|----------|----------|---------|--------------|
| `ci.yml` | lint | push, PR | All branches |
| `ci.yml` | type-check | push, PR | All branches |
| `ci.yml` | test-frontend | push, PR | dev, master |
| `ci.yml` | test-backend | push, PR | dev, master |
| `ci-cd.yml` | Backend Tests | push, PR | master |
| `ci-cd.yml` | Frontend Tests | push, PR | master |
| `ci-cd.yml` | Security Scan | push, PR | master |
| `security-scan.yml` | security-scan | schedule, push | master |

---

## 🔐 Bypass Actors

### Actor Types
- **RepositoryRole**: 
  - `1` = Repository administrators
  - `2` = Repository maintainers
  - `4` = Repository writers
  - `5` = Repository readers
- **Team**: Specific GitHub team ID
- **Integration**: GitHub App installation ID
- **OrganizationAdmin**: Organization administrators

### Current Configuration
- **Protected branches**: Administrators only
- **Development branches**: Administrators only
- **Feature branches**: Administrators + Maintainers
- **Release tags**: Administrators only

---

## ✅ Best Practices

1. **Start with Evaluate Mode**: Test rulesets in `"evaluate"` mode before setting to `"active"`
2. **Use Branch Patterns**: Leverage wildcards (`feature/**`) for flexible matching
3. **Document Bypass Reasons**: Use PRs with explanations when bypassing rules
4. **Regular Review**: Review and update rulesets quarterly
5. **Align with Workflows**: Ensure required status checks match actual workflow job names
6. **Code Owners**: Create a `.github/CODEOWNERS` file to define code ownership

---

## 🔄 Migration from Branch Protection Rules

If you have existing branch protection rules:

1. **Export Current Rules**: Document existing branch protection settings
2. **Create Equivalent Rulesets**: Use the JSON files in this directory
3. **Test in Evaluate Mode**: Enable rulesets in evaluate mode first
4. **Verify Behavior**: Ensure all protections work as expected
5. **Activate Rulesets**: Switch to active enforcement
6. **Remove Old Rules**: Delete branch protection rules to avoid conflicts

**Note**: Rulesets and branch protection rules can conflict. It's recommended to use one approach.

---

## 📚 Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Managing Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [Rulesets API Reference](https://docs.github.com/en/rest/repos/rules)

---

## 🆘 Troubleshooting

### Status Check Not Found
**Problem**: Required status check doesn't appear after workflow runs

**Solution**: 
- Ensure the workflow job name exactly matches the `context` in the ruleset
- Check that the workflow runs on the target branch
- Verify the workflow file is in `.github/workflows/`

### Bypass Not Working
**Problem**: User with bypass permissions still blocked

**Solution**:
- Verify the `actor_id` matches the role/team ID
- Check `bypass_mode` is set to `"always"` or appropriate value
- Ensure ruleset is active, not disabled

### Too Restrictive
**Problem**: Ruleset blocking legitimate workflows

**Solution**:
- Switch to `"evaluate"` mode temporarily
- Add appropriate bypass actors
- Adjust rule parameters
- Consider creating a more permissive ruleset for specific branches

---

## 📝 Maintenance

**Last Updated**: 2025-11-15

**Review Schedule**: Quarterly

**Contact**: Repository administrators

---

## 🎯 Summary

These rulesets provide a comprehensive security and quality framework for the Reconciliation Platform:

- ✅ **Production branches** are highly protected with required reviews and status checks
- ✅ **Development branches** have balanced protection allowing for iteration
- ✅ **Feature branches** have minimal checks to encourage experimentation
- ✅ **Release tags** are immutable once created

Adjust these configurations based on your team's workflow and security requirements.
