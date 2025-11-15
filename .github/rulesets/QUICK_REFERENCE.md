# GitHub Rulesets Quick Reference

## 🎯 What Are Rulesets?

GitHub Rulesets are the modern replacement for branch protection rules, offering:
- More flexibility with pattern matching
- Better visibility and management
- Support for both branches and tags
- Configurable enforcement levels
- Multiple bypass options

## 📊 Rulesets in This Repository

| Ruleset | Applies To | Enforcement | Key Rules |
|---------|-----------|-------------|-----------|
| **Protected Branches** | `master`, `main` | Active | • Required PR with 1 approval<br>• Code owner review required<br>• All checks must pass<br>• Signed commits required<br>• No force push |
| **Development Branches** | `develop`, `dev`, `staging` | Active | • Required PR with 1 approval<br>• Status checks must pass<br>• No force push |
| **Feature Branches** | `feature/**`, `fix/**`, `copilot/**` | Evaluate | • Basic lint and build checks<br>• Warnings only (non-blocking) |
| **Release Tags** | `v*`, `release-*` | Active | • Immutable once created<br>• Cannot be deleted<br>• Cannot be updated |

## 🚀 Quick Start

### Apply Rulesets via GitHub UI
1. Go to: `Settings` → `Rules` → `Rulesets`
2. Click `New ruleset` → `Import a ruleset`
3. Upload files from `.github/rulesets/`

### Apply Rulesets via CLI
```bash
# From repository root
./.github/rulesets/apply-rulesets.sh
```

## ✅ Required Status Checks

### Master/Main Branch
- ✅ Backend Tests
- ✅ Frontend Tests
- ✅ Security Scan
- ✅ lint
- ✅ type-check

### Develop Branch
- ✅ lint
- ✅ type-check
- ✅ test-frontend
- ✅ test-backend

### Feature Branches
- ⚠️ lint (warning only)
- ⚠️ build (warning only)

## 🔐 Who Can Bypass?

| Branch Type | Bypass Allowed |
|-------------|----------------|
| Protected (master/main) | Administrators only |
| Development | Administrators only |
| Feature | Administrators + Maintainers |
| Release Tags | Administrators only |

## 📝 Common Workflows

### Creating a Feature
```bash
git checkout develop
git checkout -b feature/my-feature
# ... make changes ...
git commit -s -m "feat: Add new feature"
git push origin feature/my-feature
# Create PR to develop
```

### Hotfix to Production
```bash
git checkout master
git checkout -b hotfix/critical-fix
# ... make fix ...
git commit -s -m "fix: Critical bug"
git push origin hotfix/critical-fix
# Create PR to master (requires approval + checks)
```

### Creating a Release
```bash
git checkout master
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# Tag is now immutable
```

## 🛠️ Troubleshooting

### Status Check Not Found
**Fix**: Ensure workflow job name matches the required check name exactly

### Can't Merge PR
**Fix**: Check that all required status checks have passed and you have approval

### Force Push Rejected
**Fix**: This is expected on protected branches. Use a new PR instead

### Need to Bypass Rules
**Fix**: You must be an administrator. Document the reason in your PR.

## 📚 Documentation

- Full Guide: `.github/rulesets/README.md`
- Implementation: `.github/rulesets/IMPLEMENTATION.md`
- Config Files: `.github/rulesets/*.json`

## 🔗 Useful Links

- [GitHub Docs: Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets)
- [View Rulesets](https://github.com/teoat/reconciliation-platform-378/settings/rules)
- [Repository Settings](https://github.com/teoat/reconciliation-platform-378/settings)

## 💡 Pro Tips

1. **Use Signed Commits**: `git commit -s` to sign commits
2. **Keep Branch Updated**: Rebase or merge develop regularly
3. **Review Before Push**: Run `npm run lint` and `npm test` locally
4. **Request Reviews Early**: Don't wait until PR is perfect
5. **Resolve Conversations**: Required before merge on protected branches

## 🎯 Best Practices

- ✅ Always create PRs for protected branches
- ✅ Keep PRs small and focused
- ✅ Write descriptive commit messages
- ✅ Respond to review comments promptly
- ✅ Ensure CI passes before requesting review
- ❌ Don't force push to protected branches
- ❌ Don't bypass rules without documentation
- ❌ Don't merge with failing checks

---

**Need Help?** Check the full documentation in `.github/rulesets/README.md` or contact repository administrators.
