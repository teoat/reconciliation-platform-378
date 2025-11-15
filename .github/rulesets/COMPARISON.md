# Rulesets vs Branch Protection Rules

## Overview

This document explains the differences between GitHub's traditional **Branch Protection Rules** and the newer **Repository Rulesets** feature, and why we're recommending rulesets for the Reconciliation Platform.

## 📊 Feature Comparison

| Feature | Branch Protection Rules | Repository Rulesets |
|---------|------------------------|---------------------|
| **Release Date** | 2016 | 2023 |
| **Scope** | Branches only | Branches + Tags |
| **Pattern Matching** | Limited (single patterns) | Advanced (multiple patterns, wildcards) |
| **Configuration** | Per-branch UI settings | JSON-based, version-controlled |
| **Enforcement Modes** | On/Off only | Active, Evaluate, Disabled |
| **Status Checks** | Basic list | Advanced with integration IDs |
| **Bypass Controls** | Admin override only | Granular (roles, teams, apps) |
| **API Support** | Limited | Full REST API |
| **Import/Export** | Manual only | JSON import/export |
| **Audit Trail** | Basic | Enhanced |
| **Tag Protection** | Separate feature | Integrated |
| **Multi-repo** | Manual replication | Easier templating |

## ✅ Advantages of Rulesets

### 1. **Version Control and Infrastructure as Code**
```json
// Rulesets can be stored in version control
{
  "name": "Protected Branches",
  "enforcement": "active",
  "rules": [...]
}
```
- Store in Git alongside your code
- Review changes via pull requests
- Apply consistently across repos
- Rollback if needed

### 2. **Advanced Pattern Matching**
```json
// Match multiple branch patterns in one ruleset
"conditions": {
  "ref_name": {
    "include": [
      "refs/heads/feature/**",
      "refs/heads/fix/**",
      "refs/heads/hotfix/**"
    ]
  }
}
```
vs. Branch Protection:
- Create separate rules for each pattern
- Manual management of each rule
- No wildcard support in older versions

### 3. **Flexible Enforcement Levels**
```json
// Test rules before enforcing them
{
  "enforcement": "evaluate"  // Shows warnings only
}

// Then activate when ready
{
  "enforcement": "active"  // Strictly enforced
}
```
Branch Protection: All-or-nothing enforcement

### 4. **Granular Bypass Controls**
```json
// Specify who can bypass which rules
"bypass_actors": [
  {
    "actor_id": 1,
    "actor_type": "RepositoryRole",
    "bypass_mode": "always"
  },
  {
    "actor_id": 123,
    "actor_type": "Team",
    "bypass_mode": "pull_request"
  }
]
```
Branch Protection: Only admins can bypass, less control

### 5. **Unified Branch and Tag Protection**
```json
// Protect tags with the same system
{
  "target": "tag",
  "conditions": {
    "ref_name": {
      "include": ["refs/tags/v*"]
    }
  }
}
```
Branch Protection: Requires separate tag protection feature

### 6. **Better API and Automation**
```bash
# Easy to automate with API
gh api /repos/OWNER/REPO/rulesets \
  --input ruleset.json

# Export existing rulesets
gh api /repos/OWNER/REPO/rulesets > rulesets.json
```
Branch Protection: Limited API support, harder to automate

## 🔄 Migration Path

### Current Branch Protection (Example)

**Branch**: `master`
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks: `test`, `lint`
- ✅ Require branches to be up to date
- ✅ Require signed commits
- ✅ Include administrators

### Equivalent Ruleset

```json
{
  "name": "Protected Branches - Production",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/master"]
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {"context": "test"},
          {"context": "lint"}
        ]
      }
    },
    {
      "type": "required_signatures"
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 1,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ]
}
```

## 🎯 When to Use Each

### Use Branch Protection Rules If:
- ❌ You have legacy workflows dependent on it
- ❌ Your organization hasn't enabled rulesets
- ❌ You need simple protection for a few branches
- ❌ You prefer UI-only management

### Use Repository Rulesets If:
- ✅ You want version-controlled configuration
- ✅ You need complex branch patterns
- ✅ You want to protect tags
- ✅ You need flexible enforcement modes
- ✅ You manage multiple repositories
- ✅ You want better API automation
- ✅ **You're starting fresh (RECOMMENDED)**

## 📈 Migration Strategy

### Phase 1: Preparation (Week 1)
1. ✅ Document current branch protection rules
2. ✅ Create equivalent rulesets in JSON
3. ✅ Review with team
4. ✅ Test in a fork or test repository

### Phase 2: Testing (Week 2)
1. ✅ Apply rulesets in "evaluate" mode
2. ✅ Monitor for issues
3. ✅ Gather team feedback
4. ✅ Adjust configurations

### Phase 3: Activation (Week 3)
1. ✅ Switch to "active" enforcement
2. ✅ Monitor closely for 2-3 days
3. ✅ Remove old branch protection rules
4. ✅ Update team documentation

### Phase 4: Optimization (Ongoing)
1. ✅ Review ruleset effectiveness monthly
2. ✅ Adjust based on team feedback
3. ✅ Keep rulesets in sync with workflows

## 🔍 Side-by-Side Example

### Creating Protection for `develop` Branch

#### Branch Protection (UI)
1. Go to Settings → Branches
2. Click "Add rule"
3. Enter pattern: `develop`
4. ☑️ Require pull request reviews
5. Set reviewers: 1
6. ☑️ Require status checks
7. Select checks: `lint`, `test`
8. Click "Create"

**Time**: ~3-5 minutes per branch

#### Repository Rulesets (JSON)
```json
{
  "name": "Development Branches",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": [
        "refs/heads/develop",
        "refs/heads/dev",
        "refs/heads/staging"
      ]
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [
          {"context": "lint"},
          {"context": "test"}
        ]
      }
    }
  ]
}
```

**Time**: ~1 minute to apply via API
**Bonus**: Protects 3 branches at once, version-controlled

## 📊 Real-World Impact

### Before (Branch Protection)
- 5 separate branch protection rules
- Manual configuration for each
- No version control
- Difficult to audit changes
- Hard to replicate across repos

### After (Rulesets)
- 4 rulesets covering all scenarios
- JSON files in version control
- Easy to review in PRs
- Clear audit trail
- Simple to template to other repos

## 🚀 Recommendation

**For the Reconciliation Platform, we recommend using Repository Rulesets because:**

1. ✅ **Better Maintainability**: Configuration in version control
2. ✅ **More Flexible**: Pattern matching for feature branches
3. ✅ **Future-Proof**: GitHub's direction moving forward
4. ✅ **Enhanced Security**: Granular bypass controls
5. ✅ **Better DX**: Evaluate mode for testing
6. ✅ **Scalability**: Easy to apply to multiple branches/repos

## 📚 Resources

### GitHub Documentation
- [About Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Managing Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [Rulesets API](https://docs.github.com/en/rest/repos/rules)

### Internal Documentation
- [Ruleset Configurations](./)
- [Implementation Guide](./IMPLEMENTATION.md)
- [Quick Reference](./QUICK_REFERENCE.md)

---

**Decision**: We recommend implementing Repository Rulesets for this project. The files are ready in `.github/rulesets/` and can be applied immediately.

**Last Updated**: 2025-11-15
