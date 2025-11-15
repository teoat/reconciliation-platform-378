# Audit Workflow Fallback Instructions

This document provides a recommended patch for the audit workflow (`.github/workflows/audit.yml`) to gracefully handle missing `package-lock.json` files.

## Recommended Snippet

Add the following steps at the beginning of your audit job (after checkout, before any npm-related steps):

```yaml
- name: Check for package-lock.json
  id: check-lock
  run: |
    if [ -f package-lock.json ]; then
      echo "exists=true" > $GITHUB_OUTPUT
    else
      echo "exists=false" > $GITHUB_OUTPUT
    fi

- name: Setup Node (with cache when lock exists)
  if: steps.check-lock.outputs.exists == 'true'
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: package-lock.json

- name: Setup Node (no cache when lock missing)
  if: steps.check-lock.outputs.exists == 'false'
  uses: actions/setup-node@v3
  with:
    node-version: '18'

- name: Ensure package-lock.json exists (CI-only)
  if: steps.check-lock.outputs.exists == 'false'
  run: npm install --package-lock-only
```

## Notes for maintainers

- The `ensure-package-lock.yml` workflow will commit the lockfile back to the PR branch, which triggers a new 'synchronize' event and will retry the Audit & Verify workflow.
- If you prefer, apply the audit.yml snippet to make the audit job tolerant of a missing lockfile and to take the cache only when the lockfile exists.
- This tiered fallback approach ensures CI doesn't fail when contributors forget to commit `package-lock.json`, while still benefiting from npm caching when the lockfile is present.
