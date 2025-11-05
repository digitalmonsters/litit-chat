# Subscription and Wallet Payment Backend Implementation

## Overview
This document describes the backend implementation for subscription management and wallet top-up functionality in Firechat.

## Implementation Summary

### 1. Subscription Endpoint (`/api/payments/subscribe`)

**Location**: `app/api/payments/subscribe/route.ts`

**Functionality**:
- Creates GHL subscriptions for chosen subscription plans
- Updates user tier in Firestore
- Stores subscription information in payment records

**Request Body**:
```json
{
  "plan": "basic" | "premium" | "enterprise"
}
```

**Headers**:
```
Authorization: Bearer <Firebase Auth Token>
```

**Subscription Plans**:
- `basic`: $20.00/month → tier: 'basic'
- `premium`: $50.00/month → tier: 'premium'
- `enterprise`: $100.00/month → tier: 'enterprise'

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "paymentId",
    "ghlSubscriptionId": "ghlSubscriptionId",
    "plan": "basic",
    "tier": "basic",
    "status": "active",
    "amount": 2000,
    "currency": "USD"
  }
}
```

**Logs**: `✅ User {uid} subscribed to {plan} plan (subscription: {ghlSubscriptionId})`

### 2. Wallet Top-up Endpoint (`/api/payments/topup`)

**Location**: `app/api/payments/topup/route.ts`

**Functionality**:
- Generates GHL invoices for star purchases
- Calculates stars based on payment amount (1 cent = 1 star)
- Creates payment records with metadata

**Request Body**:
```json
{
  "amount": 1000  // Amount in cents (e.g., 1000 = $10.00)
}
```

**Headers**:
```
Authorization: Bearer <Firebase Auth Token>
```

**Minimum**: $5.00 (500 cents)

**Response**:
```json
{
  "success": true,
  "invoice": {
    "id": "paymentId",
    "ghlInvoiceId": "ghlInvoiceId",
    "status": "pending",
    "amount": 10.00,
    "currency": "USD",
    "stars": 1000
  }
}
```

**Logs**: `✅ Top-up {stars} stars (${amount}) for user {uid}`

### 3. Payment Webhook (`/api/payments/webhook`)

**Location**: `app/api/payments/webhook/route.ts`

**Extended Functionality**:
- Handles `InvoicePaid` events (locked messages, wallet topups, subscriptions)
- Handles `InvoiceFailed` events
- Handles `SubscriptionCancelled` events
- Updates Firestore `users.tier` for subscriptions
- Updates Firestore `wallets.stars` for topups

#### InvoicePaid Handler

**For Wallet Topups**:
- Finds payment record by invoice ID
- Adds stars to user's wallet using `addStars()`
- Updates payment status to `completed`
- Logs: `✅ Top-up {stars} stars added to wallet for user {uid}`

**For Subscriptions**:
- Finds payment record by invoice ID
- Updates user tier based on subscription plan
- Updates user metadata with subscription info
- Logs: `✅ User {uid} subscribed to {plan} (tier: {tier})`

**For Locked Messages**:
- Updates message `unlockedBy` field
- Logs: `✅ Payment received – unlocked message {id} for user {uid}.`

#### InvoiceFailed Handler

**Functionality**:
- Updates payment status to `failed`
- Sets `failedAt` timestamp
- Logs failure reason

**Logs**: `❌ Payment failed for invoice: {invoiceId}`

#### SubscriptionCancelled Handler

**Functionality**:
- Finds payment record or user by subscription ID
- Updates payment status to `cancelled`
- Sets user tier to `free`
- Updates user metadata with cancellation info

**Logs**: `✅ User {uid} subscription cancelled, tier set to free`

### 4. Authentication

**Location**: `lib/auth-server.ts`

**Functionality**:
- Verifies Firebase Auth tokens in API routes
- Extracts user ID from tokens
- Provides middleware functions for authentication

**Functions**:
- `getAuthToken(request)`: Extracts token from Authorization header
- `verifyAuthToken(token)`: Verifies and decodes JWT token
- `getAuthenticatedUserId(request)`: Gets authenticated user ID from request

**Note**: For production, install `firebase-admin` and use `admin.auth().verifyIdToken()` for proper token verification. The current implementation uses basic JWT parsing for development.

### 5. GHL Payments Extensions

**Location**: `lib/ghlPayments.ts`

**New Functions**:
- `createSubscription()`: Creates GHL subscriptions
- `cancelSubscription()`: Cancels GHL subscriptions

**New Interfaces**:
- `GHLSubscriptionRequest`: Subscription creation request
- `GHLSubscriptionResponse`: Subscription creation response

## Flow Diagrams

### Subscription Flow

```
1. User selects subscription plan
   ↓
2. Frontend calls POST /api/payments/subscribe
   {
     plan: "basic"
   }
   Headers: Authorization: Bearer <token>
   ↓
3. Backend:
   - Verifies Firebase Auth token
   - Validates plan
   - Gets user's GHL contact ID
   - Creates GHL subscription
   - Creates payment record
   - Updates user tier
   - Logs: "User {uid} subscribed to {plan}"
   ↓
4. GHL processes subscription payment
   ↓
5. GHL sends InvoicePaid webhook
   ↓
6. Backend updates user tier and subscription status
```

### Wallet Top-up Flow

```
1. User selects top-up amount
   ↓
2. Frontend calls POST /api/payments/topup
   {
     amount: 1000  // $10.00 in cents
   }
   Headers: Authorization: Bearer <token>
   ↓
3. Backend:
   - Verifies Firebase Auth token
   - Validates amount (min $5.00)
   - Calculates stars (1 cent = 1 star)
   - Gets user's GHL contact ID
   - Creates GHL invoice
   - Creates payment record with stars metadata
   - Logs: "Top-up {stars} stars (${amount}) for user {uid}"
   ↓
4. User pays invoice in GHL
   ↓
5. GHL sends InvoicePaid webhook
   ↓
6. Backend:
   - Finds payment by invoice ID
   - Adds stars to user's wallet
   - Updates payment status
   - Logs: "Top-up {stars} stars added to wallet for user {uid}"
```

### Subscription Cancellation Flow

```
1. User cancels subscription in GHL
   ↓
2. GHL sends SubscriptionCancelled webhook
   ↓
3. Backend:
   - Finds payment/user by subscription ID
   - Updates payment status to cancelled
   - Sets user tier to 'free'
   - Updates user metadata
   - Logs: "User {uid} subscription cancelled, tier set to free"
```

## Firestore Updates

### Users Collection
- `tier`: Updated to subscription tier on payment
- `metadata.subscriptionId`: GHL subscription ID
- `metadata.subscriptionPlan`: Plan name (basic/premium/enterprise)
- `metadata.subscriptionStatus`: 'active' | 'cancelled'
- `metadata.subscriptionCancelledAt`: Timestamp when cancelled

### Wallets Collection
- `stars`: Increased by top-up amount when invoice paid
- `totalEarned`: Updated with stars earned
- `totalUsdSpent`: Updated with USD spent

### Payments Collection
- `metadata.type`: 'subscription' | 'wallet_topup' | 'message_unlock'
- `metadata.plan`: Subscription plan (for subscriptions)
- `metadata.tier`: User tier (for subscriptions)
- `metadata.stars`: Stars purchased (for topups)
- `status`: 'pending' | 'completed' | 'failed' | 'cancelled'

## Security

1. **Authentication**: All endpoints require Firebase Auth token
2. **Token Verification**: Basic JWT parsing (production should use Firebase Admin SDK)
3. **Input Validation**: Plan and amount validation
4. **Minimum Amount**: $5.00 minimum for topups
5. **User Validation**: Verifies user exists and has GHL contact ID

## Environment Variables

Required (already configured):
- `GHL_API_KEY`: GoHighLevel API key
- `GHL_LOCATION_ID`: Default location ID
- `GHL_WEBHOOK_SECRET`: Webhook secret (optional)

## Testing

### Test Subscription
```bash
curl -X POST http://localhost:3000/api/payments/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "plan": "basic"
  }'
```

### Test Top-up
```bash
curl -X POST http://localhost:3000/api/payments/topup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "amount": 1000
  }'
```

### Test Webhook (InvoicePaid for Top-up)
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "InvoicePaid",
    "invoice": {
      "id": "invoice123",
      "contactId": "ghlContact456",
      "amount": 10.00,
      "currency": "USD",
      "status": "paid"
    }
  }'
```

### Test Webhook (SubscriptionCancelled)
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "SubscriptionCancelled",
    "subscription": {
      "id": "sub123",
      "contactId": "ghlContact456",
      "planName": "Basic Plan",
      "amount": 20.00,
      "currency": "USD",
      "status": "cancelled"
    }
  }'
```

## Files Created/Modified

1. `app/api/payments/subscribe/route.ts` - Subscription creation endpoint (NEW)
2. `app/api/payments/topup/route.ts` - Wallet top-up endpoint (NEW)
3. `app/api/payments/webhook/route.ts` - Extended webhook handlers (MODIFIED)
4. `lib/auth-server.ts` - Server-side authentication utilities (NEW)
5. `lib/ghlPayments.ts` - Added subscription functions (MODIFIED)
6. `SUBSCRIPTION_WALLET_IMPLEMENTATION.md` - This documentation (NEW)

## Future Enhancements

1. Install Firebase Admin SDK for proper token verification
2. Add subscription renewal webhook handling
3. Add subscription upgrade/downgrade logic
4. Add refund handling for failed subscriptions
5. Add webhook signature verification
6. Add rate limiting for payment endpoints
7. Add subscription cancellation endpoint
8. Add wallet balance check before spending

