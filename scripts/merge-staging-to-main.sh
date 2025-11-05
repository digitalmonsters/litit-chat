#!/bin/bash

# Manual Merge Script: Staging → Main
# Use this if automated merge fails or for manual releases

set -e

echo "🚀 Merging staging → main for production release"
echo "================================================="

# Get version
VERSION=$(node -p "require('../package.json').version")
echo "Version: $VERSION"

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "staging" ]; then
  echo "⚠️  Warning: Not on staging branch (current: $CURRENT_BRANCH)"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Fetch latest
echo "📥 Fetching latest changes..."
git fetch origin

# Checkout main
echo "🔀 Switching to main branch..."
git checkout main
git pull origin main

# Merge staging
echo "🔀 Merging staging into main..."
git merge origin/staging --no-ff -m "Release: $VERSION"

# Create tag
echo "🏷️  Creating release tag..."
git tag -a "v${VERSION}" -m "Production release ${VERSION}"

# Push main
echo "📤 Pushing main branch..."
git push origin main

# Push tag
echo "📤 Pushing tag..."
git push origin "v${VERSION}"

# Generate release summary
echo "📝 Generating release summary..."
npm run release:summary

echo ""
echo "✅ Release complete!"
echo "Version: $VERSION"
echo "Tag: v${VERSION}"
echo ""
echo "Next steps:"
echo "1. Verify production deployment on Netlify"
echo "2. Check GitHub release was created"
echo "3. Notify team of release"

