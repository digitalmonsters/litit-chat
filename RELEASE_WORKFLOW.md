# Release Workflow - Quick Reference

## Automated Release Process

### When PR Merges to Staging

1. **GitHub Actions** automatically runs QA suite
2. **All checks verified** (Auth, Firestore, Push, Payments, Camera, Calls)
3. **Staging → Main merge** happens automatically
4. **Release tag created** (v{version})
5. **Release summary generated**
6. **Team notified** of production deployment

### Manual Release (If Needed)

```bash
# 1. Ensure you're on staging branch
git checkout staging
git pull origin staging

# 2. Run QA verification
npm run qa:verify

# 3. If all checks pass, merge to main
./scripts/merge-staging-to-main.sh

# Or manually:
git checkout main
git merge staging --no-ff -m "Release: $(node -p "require('./package.json').version")"
git tag -a "v$(node -p "require('./package.json').version")" -m "Production release"
git push origin main --tags
```

## QA Verification Checklist

✅ **Authentication** - Firebase Auth endpoints  
✅ **Firestore** - Database connection  
✅ **Push Notifications** - FCM implementation  
✅ **Payments** - GHL integration  
✅ **Camera** - Video recording components  
✅ **Calls** - Call screen components  
✅ **Build** - TypeScript compilation  
✅ **Linting** - Code quality  

## Release Artifacts

- **QA Report:** `qa-report-{timestamp}.md`
- **Release Summary:** `release-summary-{version}.md`
- **Git Tag:** `v{version}`
- **GitHub Release:** Auto-created with summary

## Version Management

Version is read from `package.json`:
```json
{
  "version": "0.1.0"
}
```

To bump version:
```bash
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

## Environment URLs

- **Staging:** https://staging-lit.dm2pay.netlify.app
- **Production:** https://lit.dm2pay.com

## Troubleshooting

### QA Checks Fail
- Review `qa-report-*.md`
- Fix issues in staging
- Create new PR

### Merge Fails
- Check GitHub Actions logs
- Verify branch permissions
- Resolve conflicts manually

### Tag Already Exists
- Bump version in package.json
- Retry release

## Quick Commands

```bash
# Run QA verification
npm run qa:verify

# Generate release summary
npm run release:summary

# Manual merge (if automated fails)
./scripts/merge-staging-to-main.sh
```

