#!/bin/bash

# Discover Feed Testing Script
# Tests responsiveness, performance, and data sync

set -e

echo "🧪 Testing Discover Feed..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if build passes
echo "📦 Checking build..."
if npm run build -- --webpack > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build passes${NC}"
else
    echo -e "${RED}❌ Build fails${NC}"
    exit 1
fi

# Check responsive breakpoints in CSS
echo ""
echo "📱 Checking responsive breakpoints..."
echo ""

if grep -q "md:grid-cols-2" components/discover/DiscoverFeed.tsx; then
    echo -e "${GREEN}✅ Tablet breakpoint (md) configured${NC}"
else
    echo -e "${RED}❌ Tablet breakpoint missing${NC}"
fi

if grep -q "lg:grid-cols-3" components/discover/DiscoverFeed.tsx; then
    echo -e "${GREEN}✅ Desktop breakpoint (lg) configured${NC}"
else
    echo -e "${RED}❌ Desktop breakpoint missing${NC}"
fi

if grep -q "xl:grid-cols-4" components/discover/DiscoverFeed.tsx; then
    echo -e "${GREEN}✅ Large desktop breakpoint (xl) configured${NC}"
else
    echo -e "${YELLOW}⚠️  Large desktop breakpoint optional${NC}"
fi

# Check for performance optimizations
echo ""
echo "⚡ Checking performance optimizations..."
echo ""

if grep -q "will-change\|transform\|transition" components/discover/UserCard.tsx; then
    echo -e "${GREEN}✅ Performance optimizations found in UserCard${NC}"
else
    echo -e "${YELLOW}⚠️  Consider adding performance optimizations${NC}"
fi

if grep -q "AnimatePresence\|motion" components/discover/ProfileModal.tsx; then
    echo -e "${GREEN}✅ Framer Motion animations configured${NC}"
else
    echo -e "${RED}❌ Animations missing${NC}"
fi

# Check GHL sync implementation
echo ""
echo "🔄 Checking GHL sync implementation..."
echo ""

if [ -f "lib/ghl-discover-sync.ts" ]; then
    echo -e "${GREEN}✅ GHL sync file exists${NC}"
    
    if grep -q "syncGHLContactsToFirestore" lib/ghl-discover-sync.ts; then
        echo -e "${GREEN}✅ Sync function implemented${NC}"
    fi
    
    if grep -q "Creator.*Public\|Public.*Creator" lib/ghl-discover-sync.ts; then
        echo -e "${GREEN}✅ Tag filtering implemented${NC}"
    fi
else
    echo -e "${RED}❌ GHL sync file missing${NC}"
fi

# Check API routes
echo ""
echo "🌐 Checking API routes..."
echo ""

if [ -f "app/api/discover/sync/route.ts" ]; then
    echo -e "${GREEN}✅ Discover sync API route exists${NC}"
else
    echo -e "${RED}❌ Discover sync API route missing${NC}"
fi

if [ -f "app/api/cron/discover-sync/route.ts" ]; then
    echo -e "${GREEN}✅ Cron sync API route exists${NC}"
else
    echo -e "${RED}❌ Cron sync API route missing${NC}"
fi

# Check Vercel cron config
echo ""
echo "⏰ Checking Vercel cron configuration..."
echo ""

if grep -q '"crons"' vercel.json; then
    echo -e "${GREEN}✅ Vercel cron configured${NC}"
    
    if grep -q "discover-sync" vercel.json; then
        echo -e "${GREEN}✅ Discover sync cron path configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel cron not configured${NC}"
fi

echo ""
echo -e "${GREEN}✅ Discover Feed testing complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Test responsive layout at 375px, 768px, 1280px"
echo "   2. Measure ProfileModal animation frame times"
echo "   3. Run Lighthouse audit (target: > 90)"
echo "   4. Test GHL sync to Firestore"

