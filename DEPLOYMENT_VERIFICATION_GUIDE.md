# Deployment Verification & Release Management

## Overview

This document describes the automated deployment verification and release management workflow for Lit.it.

## Workflow

### 1️⃣ PR Merge to Staging

When a PR merges into the `staging` branch:

1. **GitHub Actions triggers** `.github/workflows/deployment-verification.yml`
2. **QA Suite runs** automatically on staging environment
3. **All checks verified:**
   - ✅ Authentication (Auth endpoints)
   - ✅ Firestore (Database connection)
   - ✅ Push Notifications (FCM implementation)
   - ✅ Payments (GHL integration)
   - ✅ Camera (Components exist)
   - ✅ Calls (Call components)
   - ✅ Build (TypeScript compilation)
   - ✅ Linting (Code quality)

### 2️⃣ Verification Checks

The QA verification script (`scripts/qa-verify.sh`) checks:

- **Auth:** Firebase Auth endpoints responding
- **Firestore:** Database connection working
- **Push:** FCM messaging implementation present
- **Payments:** GHL payment endpoints exist
- **Camera:** Video recording components present
- **Calls:** Call screen components present
- **Build:** TypeScript compiles without errors
- **Lint:** Code passes ESLint

### 3️⃣ Staging → Main Merge

Once all checks pass:

1. **Automated merge** from `staging` → `main`
2. **Commit message:** `Release: {version}` (from package.json)
3. **Netlify automatically deploys** to production

### 4️⃣ Production Deployment Notification

After successful merge:

1. **GitHub Release created** with tag
2. **Release summary generated** automatically
3. **Team notified** (Slack/Discord/Email - configure as needed)

### 5️⃣ Release Tagging

Automatically creates and pushes:

```bash
git tag -a v{version} -m "Production release {version}"
git push origin v{version}
```

### 6️⃣ Release Summary

Generates a markdown summary with:
- Release date
- Git SHA
- Recent commits
- QA status
- Deployment URLs

## Manual Workflow

If you need to run verification manually:

```bash
# Run QA verification
npm run qa:verify

# Generate release summary
npm run release:summary
```

## Configuration

### Environment Variables

Required GitHub Secrets:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `STAGING_URL` (optional, defaults to Netlify staging URL)
- `GITHUB_TOKEN` (auto-provided by GitHub Actions)

### Netlify Configuration

Netlify is configured in `netlify.toml`:
- **Staging:** `staging` branch → `staging-lit.dm2pay.netlify.app`
- **Production:** `main` branch → `lit.dm2pay.com`

## Troubleshooting

### QA Checks Fail

1. Check the QA report: `qa-report-*.md`
2. Review specific failing checks
3. Fix issues in staging branch
4. Create new PR to staging

### Merge Fails

1. Check GitHub Actions logs
2. Verify branch protection rules
3. Ensure GITHUB_TOKEN has merge permissions
4. Check for merge conflicts

### Release Tag Fails

1. Verify tag doesn't already exist
2. Check Git permissions
3. Manually create tag if needed:
   ```bash
   git tag -a v{version} -m "Production release {version}"
   git push origin v{version}
   ```

## Best Practices

1. **Always test on staging first** - Don't merge directly to main
2. **Review QA reports** - Check all systems before production
3. **Version bump** - Update package.json version before release
4. **Documentation** - Update CHANGELOG.md with release notes
5. **Monitor deployment** - Watch Netlify deployment logs

## Release Checklist

Before merging to staging:
- [ ] All features tested locally
- [ ] Linting passes
- [ ] Build succeeds
- [ ] TypeScript compiles
- [ ] Environment variables set

After staging deployment:
- [ ] QA verification passes
- [ ] Manual testing on staging URL
- [ ] All systems operational
- [ ] Ready for production

After production deployment:
- [ ] Verify production URL works
- [ ] Check monitoring/analytics
- [ ] Notify team of release
- [ ] Update project log

## Project Log

Release summaries are automatically generated and should be archived in:
- `releases/` directory (create if needed)
- GitHub Releases
- Project documentation

## Support

For issues with deployment verification:
1. Check GitHub Actions logs
2. Review QA reports
3. Contact DevOps team
4. Check Netlify deployment logs

