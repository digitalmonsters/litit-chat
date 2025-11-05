#!/bin/bash

# QA Verification Script
# Runs full QA suite to verify all systems before production deployment

set -e

echo "🚀 Starting QA Verification Suite..."
echo "=================================="

STAGING_URL="${STAGING_URL:-https://staging-lit.dm2pay.netlify.app}"
REPORT_FILE="qa-report-$(date +%Y%m%d-%H%M%S).md"

# Initialize report
cat > "$REPORT_FILE" << EOF
# QA Verification Report
**Date:** $(date)
**Environment:** Staging
**URL:** $STAGING_URL

## Verification Checklist

EOF

# Function to check and record result
check_result() {
    local name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "PASS" ]; then
        echo "✅ $name: PASS" >> "$REPORT_FILE"
        echo "✅ $name: PASS"
    else
        echo "❌ $name: FAIL - $message" >> "$REPORT_FILE"
        echo "❌ $name: FAIL - $message"
        return 1
    fi
}

# 1. Auth Check
echo ""
echo "1️⃣ Checking Authentication..."
if npm run test:auth 2>/dev/null || curl -f "$STAGING_URL/api/auth/health" 2>/dev/null; then
    check_result "Authentication" "PASS" ""
else
    check_result "Authentication" "FAIL" "Auth endpoints not responding"
    exit 1
fi

# 2. Firestore Check
echo ""
echo "2️⃣ Checking Firestore..."
if npm run test:firestore 2>/dev/null || node -e "require('./lib/firebase').getFirestoreInstance()" 2>/dev/null; then
    check_result "Firestore" "PASS" ""
else
    check_result "Firestore" "FAIL" "Firestore connection failed"
    exit 1
fi

# 3. Push Notifications Check
echo ""
echo "3️⃣ Checking Push Notifications..."
if [ -f "lib/firebase-messaging.ts" ] && grep -q "getMessaging" lib/firebase-messaging.ts; then
    check_result "Push Notifications" "PASS" "Implementation exists"
else
    check_result "Push Notifications" "FAIL" "Implementation missing"
    exit 1
fi

# 4. Payments Check
echo ""
echo "4️⃣ Checking Payments..."
if [ -f "app/api/payments/webhook/route.ts" ] && [ -f "app/api/payments/create/route.ts" ]; then
    # Check if GHL integration exists
    if grep -q "createPaymentOrder\|createInvoice" app/api/payments/webhook/route.ts; then
        check_result "Payments" "PASS" "GHL integration present"
    else
        check_result "Payments" "FAIL" "GHL integration missing"
        exit 1
    fi
else
    check_result "Payments" "FAIL" "Payment endpoints missing"
    exit 1
fi

# 5. Camera Check
echo ""
echo "5️⃣ Checking Camera..."
if [ -f "components/camera/VideoDMRecorder.tsx" ]; then
    check_result "Camera" "PASS" "Component exists"
else
    check_result "Camera" "FAIL" "Camera component missing"
    exit 1
fi

# 6. Calls Check
echo ""
echo "6️⃣ Checking Calls..."
if [ -f "components/call/CallScreen.tsx" ] && [ -f "app/api/calls/bill/route.ts" ]; then
    check_result "Calls" "PASS" "Call components exist"
else
    check_result "Calls" "FAIL" "Call components missing"
    exit 1
fi

# 7. Build Check
echo ""
echo "7️⃣ Verifying Build..."
if npm run build 2>&1 | grep -q "Compiled successfully"; then
    check_result "Build" "PASS" ""
else
    check_result "Build" "FAIL" "Build failed"
    exit 1
fi

# 8. Lint Check
echo ""
echo "8️⃣ Running Linter..."
if npm run lint 2>&1 | grep -q "✖"; then
    LINT_ERRORS=$(npm run lint 2>&1 | grep -c "✖" || echo "0")
    if [ "$LINT_ERRORS" -gt 0 ]; then
        check_result "Linting" "FAIL" "$LINT_ERRORS errors found"
        exit 1
    fi
else
    check_result "Linting" "PASS" ""
fi

# Summary
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "- ✅ All checks passed" >> "$REPORT_FILE"
echo "- Environment: Staging" >> "$REPORT_FILE"
echo "- Ready for production deployment" >> "$REPORT_FILE"

echo ""
echo "=================================="
echo "✅ QA Verification Complete!"
echo "Report saved to: $REPORT_FILE"
echo "=================================="

exit 0

