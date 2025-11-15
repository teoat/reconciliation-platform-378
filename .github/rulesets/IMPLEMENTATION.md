# GitHub Rulesets Implementation Guide

This guide walks you through implementing the optimized GitHub rulesets for the Reconciliation Platform repository.

## 📋 Prerequisites

Before implementing rulesets, ensure you have:

- [ ] Repository **admin** access
- [ ] Familiarity with your current branch protection rules (if any)
- [ ] Understanding of your team's workflow
- [ ] GitHub CLI installed (optional, for API method)

## 🎯 Implementation Steps

### Step 1: Review Current Branch Protection

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Document any existing branch protection rules
4. Note which branches are currently protected
5. Save screenshots or export configurations

### Step 2: Understand the Rulesets

Review each ruleset file in `.github/rulesets/`:

- **protected-branches.json**: For `master`/`main` (strict)
- **development-branches.json**: For `develop`/`dev`/`staging` (moderate)
- **feature-branches.json**: For feature branches (permissive)
- **release-tags.json**: For release tags (immutable)

### Step 3: Choose Implementation Method

We provide three methods. Choose the one that fits your workflow:

#### Method A: GitHub Web UI (Recommended for Most Users)
✅ Best for: Visual preference, first-time setup, small teams
✅ Pros: Easy to use, visual feedback, no CLI needed
❌ Cons: Manual process, one-at-a-time

#### Method B: GitHub API/CLI (Recommended for Automation)
✅ Best for: CI/CD integration, large teams, IaC approach
✅ Pros: Scriptable, repeatable, version-controlled
❌ Cons: Requires technical knowledge, needs authentication

#### Method C: Terraform (Recommended for Enterprise)
✅ Best for: Multi-repo deployments, compliance requirements
✅ Pros: Full IaC, audit trail, state management
❌ Cons: Requires Terraform knowledge, additional setup

---

## 📝 Method A: GitHub Web UI

### Step-by-Step Instructions

#### 1. Navigate to Rulesets

1. Open your repository: `https://github.com/teoat/reconciliation-platform-378`
2. Click **Settings** (top menu)
3. In the left sidebar, under "Code and automation", click **Rules**
4. Click **Rulesets**

#### 2. Import Protected Branches Ruleset

1. Click **New ruleset** → **New branch ruleset**
2. Click **Import a ruleset** (if available) OR manually configure:
   - **Ruleset Name**: `Protected Branches - Production`
   - **Enforcement status**: Active
   - **Target branches**: Add patterns
     - Click **Add target** → **Include by pattern**
     - Add: `master`
     - Add: `main`
   
3. Configure Branch Protection Rules:
   - ✅ **Restrict deletions**
   - ✅ **Restrict force pushes**
   - ✅ **Require linear history**
   - ✅ **Require signed commits**

4. Configure Pull Request Rules:
   - ✅ **Require a pull request before merging**
   - Set **Required approvals**: `1`
   - ✅ **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ **Require review from Code Owners**
   - ✅ **Require conversation resolution before merging**

5. Configure Status Checks:
   - ✅ **Require status checks to pass**
   - ✅ **Require branches to be up to date before merging**
   - Add required status checks:
     - Type: `Backend Tests`
     - Type: `Frontend Tests`
     - Type: `Security Scan`
     - Type: `lint`
     - Type: `type-check`

6. Configure Bypass:
   - Under **Bypass list**, add:
     - **Repository role**: Administrator
     - **Bypass mode**: Always allow

7. Click **Create** to save

#### 3. Import Development Branches Ruleset

Repeat the process with these settings:
- **Name**: `Development Branches`
- **Branches**: `develop`, `dev`, `staging`
- **Enforcement**: Active
- **Rules**: Similar to above but:
  - Required approvals: `1`
  - Don't require code owner review
  - Don't dismiss stale reviews
  - Status checks: `lint`, `type-check`, `test-frontend`, `test-backend`

#### 4. Import Feature Branches Ruleset

- **Name**: `Feature Branches`
- **Branches**: `feature/**`, `feat/**`, `copilot/**`, `fix/**`, `hotfix/**`
- **Enforcement**: Evaluate (non-blocking warnings)
- **Rules**: Minimal - just `lint` and `build` status checks

#### 5. Import Release Tags Ruleset

1. Click **New ruleset** → **New tag ruleset**
2. Configure:
   - **Name**: `Release Tags Protection`
   - **Tags**: `v*`, `release-*`
   - **Enforcement**: Active
   - ✅ **Restrict deletions**
   - ✅ **Restrict updates**

---

## 🔧 Method B: GitHub API/CLI

### Prerequisites

```bash
# Install GitHub CLI
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

### Apply Rulesets

We've provided a helper script. Run it from the repository root:

```bash
# Make the script executable
chmod +x .github/rulesets/apply-rulesets.sh

# Run the script
./.github/rulesets/apply-rulesets.sh
```

Or manually apply each ruleset:

```bash
# Navigate to the rulesets directory
cd .github/rulesets

# Apply protected branches ruleset
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/teoat/reconciliation-platform-378/rulesets \
  --input protected-branches.json

# Apply development branches ruleset
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/teoat/reconciliation-platform-378/rulesets \
  --input development-branches.json

# Apply feature branches ruleset
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/teoat/reconciliation-platform-378/rulesets \
  --input feature-branches.json

# Apply release tags ruleset
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/teoat/reconciliation-platform-378/rulesets \
  --input release-tags.json
```

### Verify Applied Rulesets

```bash
# List all rulesets
gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/teoat/reconciliation-platform-378/rulesets \
  | jq '.[] | {id, name, enforcement}'
```

---

## 🏗️ Method C: Terraform

### Prerequisites

```bash
# Install Terraform
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Terraform Configuration

Create a file `rulesets.tf`:

```hcl
terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

provider "github" {
  token = var.github_token
  owner = "teoat"
}

variable "github_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

# Protected Branches Ruleset
resource "github_repository_ruleset" "protected_branches" {
  repository  = "reconciliation-platform-378"
  name        = "Protected Branches - Production"
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["refs/heads/master", "refs/heads/main"]
      exclude = []
    }
  }

  rules {
    deletion                = true
    non_fast_forward        = true
    required_linear_history = true
    required_signatures     = true

    pull_request {
      required_approving_review_count = 1
      dismiss_stale_reviews_on_push   = true
      require_code_owner_review       = true
      require_last_push_approval      = false
      required_review_thread_resolution = true
    }

    required_status_checks {
      strict_required_status_checks_policy = true
      
      required_check {
        context = "Backend Tests"
      }
      required_check {
        context = "Frontend Tests"
      }
      required_check {
        context = "Security Scan"
      }
      required_check {
        context = "lint"
      }
      required_check {
        context = "type-check"
      }
    }
  }

  bypass_actors {
    actor_id    = 1
    actor_type  = "RepositoryRole"
    bypass_mode = "always"
  }
}

# Add similar blocks for other rulesets...
```

Apply the configuration:

```bash
export TF_VAR_github_token="YOUR_GITHUB_PAT"
terraform init
terraform plan
terraform apply
```

---

## ✅ Post-Implementation Verification

### 1. Test Branch Protection

Create a test branch and PR:

```bash
# Create a test branch
git checkout -b test/ruleset-verification
echo "test" > test.txt
git add test.txt
git commit -m "Test: Verify rulesets"
git push origin test/ruleset-verification

# Create a PR to master
# GitHub UI: Create pull request to master
# Verify that required status checks are displayed
# Verify that approval is required
```

### 2. Verify Each Ruleset

- [ ] **Protected Branches**: Try force-push to master (should fail)
- [ ] **Development Branches**: Create PR to develop (should require checks)
- [ ] **Feature Branches**: Push to feature branch (should show warnings only)
- [ ] **Release Tags**: Try to create tag `v1.0.0` (should succeed)
- [ ] **Release Tags**: Try to delete tag `v1.0.0` (should fail)

### 3. Check Status Checks Integration

Run your CI/CD workflows and verify:

- [ ] Status checks appear on PRs
- [ ] Required checks block merge until passing
- [ ] Optional checks show but don't block

### 4. Test Bypass Access

As an administrator:

- [ ] Verify you can bypass rules when needed
- [ ] Document bypass usage in PR description

---

## 🔄 Migration from Old Branch Protection

If you have existing branch protection rules:

### Before Migration
1. **Document**: Export existing branch protection settings
2. **Backup**: Take screenshots of current configurations
3. **Notify**: Inform team members of upcoming changes

### During Migration
1. **Enable Evaluate Mode**: Set rulesets to `"evaluate"` first
2. **Monitor**: Watch for issues over 1-2 weeks
3. **Adjust**: Fine-tune ruleset configurations
4. **Activate**: Switch to `"active"` enforcement

### After Migration
1. **Remove Old Rules**: Delete branch protection rules
2. **Update Docs**: Update team documentation
3. **Train Team**: Conduct a brief training session

---

## 🆘 Troubleshooting

### Issue: Status Check Not Showing

**Symptom**: Required status check doesn't appear on PR

**Solutions**:
1. Verify workflow job name matches exactly (case-sensitive)
2. Check workflow triggers include the target branch
3. Run the workflow manually to ensure it completes
4. Wait 5-10 minutes for GitHub to refresh

**Example**:
```yaml
# In workflow file, ensure job name matches ruleset
jobs:
  lint:  # This name must match "lint" in ruleset
    name: Lint Code
```

### Issue: Can't Push to Protected Branch

**Symptom**: Push rejected even with admin rights

**Solutions**:
1. Check if you're in the bypass actors list
2. Verify bypass mode is set to "always"
3. Ensure you're using the correct authentication method
4. Check if ruleset is in "active" vs "evaluate" mode

### Issue: Too Many Required Checks

**Symptom**: Merge blocked waiting for checks that don't run

**Solutions**:
1. Review required_status_checks list
2. Remove checks for workflows that don't run on target branch
3. Make certain checks optional by removing from ruleset
4. Use separate rulesets for different branch patterns

---

## 📊 Monitoring and Maintenance

### Regular Reviews

Schedule quarterly reviews:

- [ ] Review bypass usage logs
- [ ] Analyze blocked PRs
- [ ] Survey team for friction points
- [ ] Update status check requirements
- [ ] Adjust enforcement levels

### Metrics to Track

1. **PR Merge Time**: Before and after rulesets
2. **Bypass Frequency**: How often rules are bypassed
3. **Failed Checks**: Which checks fail most often
4. **Team Satisfaction**: Developer feedback

### Updating Rulesets

When you need to modify a ruleset:

1. **Get Current Ruleset**:
   ```bash
   gh api /repos/teoat/reconciliation-platform-378/rulesets/{ruleset_id}
   ```

2. **Edit JSON**: Make changes to local file

3. **Update via API**:
   ```bash
   gh api \
     --method PUT \
     -H "Accept: application/vnd.github+json" \
     /repos/teoat/reconciliation-platform-378/rulesets/{ruleset_id} \
     --input updated-ruleset.json
   ```

---

## 🎓 Training Your Team

### Onboarding Checklist

Share this with new team members:

- [ ] Read `.github/rulesets/README.md`
- [ ] Understand which branches have which protections
- [ ] Learn how to request review
- [ ] Know when/how to request bypass
- [ ] Practice creating compliant PRs

### Common Scenarios

**Scenario 1: Hotfix to Production**
```bash
# Create hotfix branch from master
git checkout master
git pull
git checkout -b hotfix/critical-bug

# Make fix and commit
git add .
git commit -s -m "fix: Critical security issue"

# Push and create PR
git push origin hotfix/critical-bug
# Create PR to master via GitHub UI
# Request expedited review
# Wait for required status checks
# Merge when approved
```

**Scenario 2: Feature Development**
```bash
# Create feature branch from develop
git checkout develop
git pull
git checkout -b feature/new-feature

# Develop and push
# Status checks will warn but not block
git push origin feature/new-feature

# When ready, create PR to develop
# Requires approval and passing checks
```

---

## 📚 Additional Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets)
- [GitHub API - Rulesets](https://docs.github.com/en/rest/repos/rules)
- [Best Practices for Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## ✨ Next Steps

After implementing rulesets:

1. **Monitor**: Watch the first few PRs closely
2. **Gather Feedback**: Ask team for input
3. **Iterate**: Adjust configurations as needed
4. **Document**: Keep this guide updated
5. **Celebrate**: Enjoy better code quality and security! 🎉

---

**Questions or Issues?**
Open an issue or contact the repository administrators.

**Last Updated**: 2025-11-15
