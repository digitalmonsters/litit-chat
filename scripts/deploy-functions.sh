#!/bin/bash

# Deploy Cloud Functions Script
# Usage: ./scripts/deploy-functions.sh

set -e

echo "🚀 Deploying Cloud Functions..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Run: firebase login"
    exit 1
fi

# Build functions
echo "📦 Building functions..."
cd functions
npm install
npm run build
cd ..

# Deploy
echo ""
echo "🚀 Deploying to Firebase..."
firebase deploy --only functions

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test by creating a new user via Firebase Auth"
echo "   2. Check Firestore: users/{uid} and wallets/{uid} should be created"
echo "   3. View logs: firebase functions:log"

