# Git Workflow Scripts

Quick reference for Git workflow automation scripts.

## Scripts

### `git-workflow.sh` - Main Helper

Quick shortcuts for common operations:

```bash
# Create branches
./scripts/git-workflow.sh feature new-feature
./scripts/git-workflow.sh fix bug-name
./scripts/git-workflow.sh hotfix critical-fix

# Merge branches
./scripts/git-workflow.sh merge-dev feature/new-feature "Summary"
./scripts/git-workflow.sh merge-staging "Summary"
./scripts/git-workflow.sh merge-main "Summary"

# Cleanup
./scripts/git-workflow.sh cleanup
./scripts/git-workflow.sh cleanup feature/old-feature
```

### `git-merge.sh` - Merge Handler

Handles merge between any two branches with validation:

```bash
./scripts/git-merge.sh <source> <target> [summary]
```

Examples:
```bash
./scripts/git-merge.sh develop staging "Monetization milestone"
./scripts/git-merge.sh staging main "Production release v1.0"
./scripts/git-merge.sh feature/new-feature develop "Add new feature"
```

Features:
- ✅ Validates merge flow rules
- ✅ Pulls latest changes
- ✅ Uses `--no-ff` for merge commits
- ✅ Formats commit messages
- ✅ Pushes to remote

### `git-cleanup.sh` - Branch Cleanup

Removes merged feature/fix/hotfix branches:

```bash
# Clean up specific branch
./scripts/git-cleanup.sh feature/old-feature

# Find and clean up all merged branches
./scripts/git-cleanup.sh
```

## Workflow

```
1. Create feature branch
   → ./scripts/git-workflow.sh feature monetization

2. Develop and commit
   → git add . && git commit -m "Implement wallet logic"

3. Merge to develop (after testing)
   → ./scripts/git-workflow.sh merge-dev feature/monetization "Wallet integration"

4. Merge to staging (after internal testing)
   → ./scripts/git-workflow.sh merge-staging "Monetization milestone"

5. Merge to main (after QA)
   → ./scripts/git-workflow.sh merge-main "Release v1.0"

6. Clean up merged branches
   → ./scripts/git-workflow.sh cleanup
```

## See Also

- Full documentation: [`docs/GIT_WORKFLOW.md`](../docs/GIT_WORKFLOW.md)
