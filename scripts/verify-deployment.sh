#!/bin/bash

# Deployment Verification Script
# This script verifies the project is ready for deployment

set -e

echo "🔍 Verifying deployment readiness..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this from the project root."
  exit 1
fi

# Run linting
echo "📝 Running linter..."
npm run lint

# Run build
echo "🏗️  Running build..."
npm run build

# Check for TypeScript errors
echo "🔷 Checking TypeScript..."
npx tsc --noEmit --skipLibCheck

# Verify environment variables documentation exists
if [ ! -f "DEPLOYMENT.md" ]; then
  echo "⚠️  Warning: DEPLOYMENT.md not found"
fi

# Check for required files
echo "📋 Checking required files..."
REQUIRED_FILES=(
  "next.config.ts"
  "package.json"
  "tsconfig.json"
  "vercel.json"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    exit 1
  fi
done

echo ""
echo "✅ All checks passed! Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Run: vercel --prod"
echo "3. Configure GoHighLevel webhook URL"
echo ""

