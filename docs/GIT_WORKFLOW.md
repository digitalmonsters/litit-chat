# Git Branching & Merging Workflow

## Overview

Lit.it follows a structured Git workflow with three main branches and feature branch development.

## Branch Structure

### Main Branches

1. **`main`** - Production-ready code
   - Only merged from `staging` after QA approval
   - Always deployable
   - Protected branch (no direct commits)

2. **`staging`** - Pre-production testing
   - Merged from `develop` after internal testing
   - QA review and testing environment
   - Protected branch (no direct commits)

3. **`develop`** - Development branch
   - Primary development branch
   - Merged from `feature/*`, `fix/*` branches
   - Continuous integration and internal testing

### Feature Branches

- **`feature/{short-desc}`** - New features
- **`fix/{short-desc}`** - Bug fixes
- **`hotfix/{short-desc}`** - Critical production fixes (branched from `main`)

## Workflow Rules

### 1. Feature Development

Always develop new features on feature branches:

```bash
# Create feature branch from develop
./scripts/git-workflow.sh feature monetization-integration

# Or manually:
git checkout develop
git pull origin develop
git checkout -b feature/monetization-integration
```

### 2. Merging Feature → Develop

When feature is complete and tested:

```bash
# Using helper script
./scripts/git-workflow.sh merge-dev feature/monetization-integration "Monetization integration complete"

# Or manually:
./scripts/git-merge.sh feature/monetization-integration develop "Monetization integration complete"
```

### 3. Merging Develop → Staging

When milestone feature set passes internal testing:

```bash
# Using helper script
./scripts/git-workflow.sh merge-staging "Monetization milestone ready for QA"

# Or manually:
./scripts/git-merge.sh develop staging "Monetization milestone ready for QA"
```

### 4. Merging Staging → Main

When staging passes QA review:

```bash
# Using helper script
./scripts/git-workflow.sh merge-main "Production release v1.0"

# Or manually:
./scripts/git-merge.sh staging main "Production release v1.0"
```

## Merge Process

The merge script (`scripts/git-merge.sh`) automatically:

1. ✅ Validates branch names and merge flow rules
2. ✅ Checks for uncommitted changes
3. ✅ Switches to target branch
4. ✅ Pulls latest changes from remote
5. ✅ Updates source branch
6. ✅ Performs merge with `--no-ff` (preserves branch history)
7. ✅ Formats commit message: `"Merge branch '{source}' into {target} - {summary}"`
8. ✅ Pushes to remote

### Merge Commit Message Format

```
Merge branch '{source}' into {target} - {summary}
```

Examples:
- `Merge branch 'develop' into staging - Monetization integration complete`
- `Merge branch 'staging' into main - Production release v1.0`

## Branch Cleanup

### Automatic Cleanup

After merging feature branches into develop, clean them up:

```bash
# Clean up specific branch
./scripts/git-cleanup.sh feature/monetization-integration

# Or using helper
./scripts/git-workflow.sh cleanup feature/monetization-integration
```

### Bulk Cleanup

Find and clean up all merged feature/fix/hotfix branches:

```bash
./scripts/git-cleanup.sh
```

This will:
- List all merged feature/fix/hotfix branches
- Ask for confirmation
- Delete local and remote branches

## Quick Reference

### Creating Branches

```bash
# Feature branch
./scripts/git-workflow.sh feature new-feature

# Fix branch
./scripts/git-workflow.sh fix bug-fix

# Hotfix branch (from main)
./scripts/git-workflow.sh hotfix critical-fix
```

### Merging

```bash
# Feature → Develop
./scripts/git-workflow.sh merge-dev feature/new-feature "Feature summary"

# Develop → Staging
./scripts/git-workflow.sh merge-staging "Milestone summary"

# Staging → Main
./scripts/git-workflow.sh merge-main "Release summary"
```

### Cleanup

```bash
# Clean up specific branch
./scripts/git-workflow.sh cleanup feature/new-feature

# Clean up all merged branches
./scripts/git-workflow.sh cleanup
```

## Merge Flow Validation

The workflow enforces these rules:

- ✅ **Staging** can only be merged from `develop`
- ✅ **Main** can only be merged from `staging`
- ✅ **Develop** accepts feature/fix/hotfix branches
- ✅ Prevents invalid merge paths

## Branch Naming Convention

Follow these patterns:

- ✅ `feature/user-authentication`
- ✅ `fix/payment-webhook-error`
- ✅ `hotfix/security-patch`
- ❌ `new-feature` (missing prefix)
- ❌ `Feature/user-auth` (incorrect case)
- ❌ `feature/user authentication` (use hyphens, not spaces)

## Best Practices

### 1. Always Pull Before Merging

The merge script automatically pulls latest changes, but you should also:

```bash
git checkout develop
git pull origin develop
```

### 2. Keep Feature Branches Small

- One feature per branch
- Merge frequently to avoid conflicts
- Keep branches in sync with develop

### 3. Commit Messages

Use clear, descriptive commit messages:

```bash
git commit -m "Add wallet balance display in TipModal"
```

### 4. Test Before Merging

- Run tests locally
- Ensure feature works as expected
- Check for conflicts

### 5. Clean Up Regularly

- Delete merged branches promptly
- Keep repository clean
- Use `git-cleanup.sh` script

## Troubleshooting

### Merge Conflicts

If merge conflicts occur:

1. Resolve conflicts manually
2. Stage resolved files: `git add .`
3. Complete merge: `git commit`
4. Push: `git push origin <target-branch>`

### Undo Merge

If you need to undo a merge:

```bash
git reset --hard HEAD~1  # WARNING: Destructive
```

Or use merge revert:

```bash
git revert -m 1 <merge-commit-hash>
```

### Branch Not Found

If branch doesn't exist locally:

```bash
# Fetch all remote branches
git fetch origin

# Checkout remote branch
git checkout -b <branch-name> origin/<branch-name>
```

## Integration with CI/CD

- **Develop**: Triggers internal tests
- **Staging**: Triggers QA environment deployment
- **Main**: Triggers production deployment

## Summary

```
Feature Development Flow:
  feature/new-feature → develop → staging → main
  
Bug Fix Flow:
  fix/bug-name → develop → staging → main
  
Hotfix Flow:
  hotfix/critical → main (also merge back to develop/staging)
```

All merges use `--no-ff` to preserve branch history and include formatted commit messages.

