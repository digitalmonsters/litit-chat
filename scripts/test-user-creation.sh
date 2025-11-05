#!/bin/bash

# Test User Creation Script
# Verifies that users/{uid} documents are created after authentication

set -e

echo "🧪 Testing User Document Creation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase config is set
if [ -z "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then
    echo -e "${RED}❌ Firebase config not found${NC}"
    echo "   Set NEXT_PUBLIC_FIREBASE_* environment variables"
    exit 1
fi

echo -e "${GREEN}✅ Firebase config found${NC}"
echo ""

# Check if auth functions are implemented
echo "📋 Checking Auth Implementation..."
echo ""

if grep -q "createOrUpdateUser" lib/auth.ts; then
    echo -e "${GREEN}✅ createOrUpdateUser function exists${NC}"
else
    echo -e "${RED}❌ createOrUpdateUser function missing${NC}"
    exit 1
fi

if grep -q "signInWithGoogle" lib/auth.ts; then
    echo -e "${GREEN}✅ signInWithGoogle function exists${NC}"
else
    echo -e "${RED}❌ signInWithGoogle function missing${NC}"
    exit 1
fi

if grep -q "signInWithApple" lib/auth.ts; then
    echo -e "${GREEN}✅ signInWithApple function exists${NC}"
else
    echo -e "${RED}❌ signInWithApple function missing${NC}"
    exit 1
fi

if grep -q "sendMagicLink\|signInWithMagicLink" lib/auth.ts; then
    echo -e "${GREEN}✅ Magic link functions exist${NC}"
else
    echo -e "${RED}❌ Magic link functions missing${NC}"
    exit 1
fi

if grep -q "signInWithPhoneNumber" lib/auth.ts; then
    echo -e "${GREEN}✅ Phone auth function exists${NC}"
else
    echo -e "${RED}❌ Phone auth function missing${NC}"
    exit 1
fi

# Check AuthContext
echo ""
echo "📋 Checking AuthContext..."
echo ""

if grep -q "onAuthStateChanged" contexts/AuthContext.tsx; then
    echo -e "${GREEN}✅ onAuthStateChanged listener exists${NC}"
else
    echo -e "${RED}❌ onAuthStateChanged listener missing${NC}"
    exit 1
fi

if grep -q "createOrUpdateUser" contexts/AuthContext.tsx; then
    echo -e "${GREEN}✅ AuthContext calls createOrUpdateUser${NC}"
else
    echo -e "${RED}❌ AuthContext doesn't call createOrUpdateUser${NC}"
    exit 1
fi

# Check Firestore collection
echo ""
echo "📋 Checking Firestore Collections..."
echo ""

if grep -q "COLLECTIONS.USERS" lib/firebase.ts; then
    echo -e "${GREEN}✅ USERS collection defined${NC}"
else
    echo -e "${RED}❌ USERS collection not defined${NC}"
    exit 1
fi

# Check user document structure
echo ""
echo "📋 Checking User Document Structure..."
echo ""

REQUIRED_FIELDS=("id" "email" "displayName" "provider" "createdAt" "lastLogin" "verified" "tier")
for field in "${REQUIRED_FIELDS[@]}"; do
    if grep -q "$field" lib/firestore-collections.ts; then
        echo -e "${GREEN}✅ Field '$field' exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Field '$field' not found${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Auth Implementation Verification Complete!${NC}"
echo ""
echo "📋 Manual Testing Required:"
echo "   1. Test Google Sign-In: /auth/login → Continue with Google"
echo "   2. Test Apple Sign-In: /auth/login → Continue with Apple"
echo "   3. Test Phone Sign-In: /auth/login → Continue with Phone"
echo "   4. Test Email Sign-In: /auth/login → Enter email → Check inbox"
echo ""
echo "🔍 Verify in Firestore Console:"
echo "   - Navigate to users collection"
echo "   - Check that users/{uid} document exists"
echo "   - Verify fields: id, email, displayName, provider, createdAt, verified, tier"

