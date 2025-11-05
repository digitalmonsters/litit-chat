# GHL Wallet Webhook Integration

## Overview
This document describes the integration between Firebase wallet logic and GoHighLevel (GHL) payment webhooks. The system handles three main webhook events: InvoicePaid, InvoiceFailed, and SubscriptionCancelled.

## Implementation

### 1. InvoicePaid Webhook Handler

**Location**: `app/api/payments/webhook/route.ts` - `handleInvoicePaid()`

#### Star Top-Up (Wallet Top-Up)
When an `InvoicePaid` webhook arrives with `metadata.type === 'wallet_topup'`:

1. **Detects wallet top-up**: Checks payment metadata for `type: 'wallet_topup'`
2. **Calculates stars**: 
   - Uses `metadata.stars` if provided
   - Otherwise calculates: `amount * STAR_CONVERSION_RATE` (1 USD = 100 stars)
3. **Increments wallet**: Calls `addStars()` to increment `wallets.stars`
4. **Logs transaction**: Records the top-up in wallet transaction history

**Example Payment Metadata**:
```json
{
  "type": "wallet_topup",
  "stars": 5000,  // Optional: if not provided, calculated from amount
  "description": "Wallet top-up"
}
```

#### Subscription Activation
When an `InvoicePaid` webhook arrives for a subscription:

1. **Detects subscription**: Checks for:
   - `metadata.type === 'subscription'`
   - Description contains "subscription" or "litplus"
   - Invoice has `planName` or `interval` field
2. **Updates user tier**: Sets `users.tier = 'litplus'`
3. **Records subscription metadata**:
   - `subscriptionId`: GHL transaction/invoice ID
   - `subscriptionPlan`: Plan name from metadata or invoice
   - `subscriptionStatus`: 'active'
   - `subscriptionStartedAt`: Timestamp

**Example Payment Metadata**:
```json
{
  "type": "subscription",
  "plan": "litplus",
  "tier": "litplus"
}
```

### 2. InvoiceFailed Webhook Handler

**Location**: `app/api/payments/webhook/route.ts` - `handleInvoiceFailed()`

When an `InvoiceFailed` webhook arrives:

1. **Finds user**: 
   - Looks up payment record by invoice ID
   - Falls back to finding user by GHL contact ID
2. **Sets tier to free**: Updates `users.tier = 'free'`
3. **Generates reactivation token**: Creates secure token and stores in user metadata
4. **Creates reactivation link**: `{APP_URL}/reactivate?token={token}`
5. **Sends reactivation link**:
   - Primary: Via GHL `sendMessage()` API (email channel)
   - Fallback: Logs email for manual sending (TODO: integrate email service)

**User Metadata Updates**:
```json
{
  "subscriptionStatus": "failed",
  "subscriptionFailedAt": "timestamp",
  "reactivationToken": "userId-timestamp-random",
  "reactivationLink": "https://lit.it/reactivate?token=..."
}
```

### 3. SubscriptionCancelled Handler

**Location**: `app/api/payments/webhook/route.ts` - `handleSubscriptionCancelled()`

When a subscription is cancelled:

1. **Finds payment/subscription record**
2. **Sets tier to free**: Updates `users.tier = 'free'`
3. **Marks subscription as cancelled**: Updates metadata with cancellation info

## Test Endpoint

**Location**: `app/api/payments/webhook/test/route.ts`

### GET `/api/payments/webhook/test`
Returns sample payloads for testing:
- `invoicePaid`: Regular invoice paid
- `invoicePaidWalletTopup`: Wallet top-up invoice
- `invoicePaidSubscription`: Subscription invoice
- `invoiceFailed`: Failed invoice
- `subscriptionCancelled`: Cancelled subscription

### POST `/api/payments/webhook/test`
Validates webhook payload structure without processing:
- Validates payload format
- Checks for required fields
- Provides recommendations for what will happen

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/payments/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "event": "InvoicePaid",
    "invoice": {
      "id": "inv_test_123",
      "contactId": "contact_123",
      "amount": 1000,
      "currency": "USD",
      "status": "paid"
    }
  }'
```

## Webhook Flow

### InvoicePaid Flow
```
GHL Webhook → InvoicePaid Event
    ↓
Find Payment Record
    ↓
Update Payment Status
    ↓
┌─────────────────┬──────────────────┐
│  Wallet Top-Up  │   Subscription   │
│  (type check)   │   (type check)   │
└─────────────────┴──────────────────┘
    ↓                      ↓
addStars()          Set tier='litplus'
    ↓                      ↓
Update wallets.stars    Update users.tier
```

### InvoiceFailed Flow
```
GHL Webhook → InvoiceFailed Event
    ↓
Find Payment Record & User
    ↓
Set users.tier = 'free'
    ↓
Generate Reactivation Token
    ↓
Send Reactivation Link (GHL/Email)
```

## Payment Metadata Structure

### Wallet Top-Up
```json
{
  "userId": "user_123",
  "messageId": null,
  "chatId": null,
  "amount": 500,  // $5.00 in cents
  "currency": "USD",
  "paymentMethod": "ghl",
  "ghlTransactionId": "inv_topup_123",
  "metadata": {
    "type": "wallet_topup",
    "stars": 5000  // Optional: calculated if not provided
  }
}
```

### Subscription
```json
{
  "userId": "user_123",
  "messageId": null,
  "chatId": null,
  "amount": 2999,  // $29.99 in cents
  "currency": "USD",
  "paymentMethod": "ghl",
  "ghlTransactionId": "inv_sub_123",
  "metadata": {
    "type": "subscription",
    "plan": "litplus",
    "tier": "litplus"
  }
}
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_APP_URL`: Base URL for reactivation links (default: 'https://lit.it')
- `GHL_LOCATION_ID`: GHL location ID for sending messages

## Testing

### Test with Sample Payloads

1. **Test wallet top-up**:
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "InvoicePaid",
    "invoice": {
      "id": "inv_topup_test",
      "contactId": "contact_test",
      "amount": 500,
      "currency": "USD",
      "status": "paid"
    }
  }'
```

2. **Test subscription activation**:
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "InvoicePaid",
    "invoice": {
      "id": "inv_sub_test",
      "contactId": "contact_test",
      "amount": 2999,
      "currency": "USD",
      "status": "paid",
      "planName": "litplus",
      "interval": "monthly"
    }
  }'
```

3. **Test invoice failed**:
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "InvoiceFailed",
    "invoice": {
      "id": "inv_failed_test",
      "contactId": "contact_test",
      "amount": 2999,
      "currency": "USD",
      "status": "failed"
    }
  }'
```

## Verification Checklist

- [x] InvoicePaid for wallet top-up increments `wallets.stars`
- [x] InvoicePaid for subscription sets `users.tier = 'litplus'`
- [x] InvoiceFailed sets `users.tier = 'free'`
- [x] InvoiceFailed generates and sends reactivation link
- [x] Test endpoint available for payload validation
- [x] Error handling and logging in place
- [x] GHL integration for sending reactivation emails

## Notes

- Wallet top-up stars are calculated at 1 USD = 100 stars (1 cent = 1 star)
- Subscription tier is hardcoded to 'litplus' for now
- Reactivation link uses token-based authentication
- Email sending is currently logged (TODO: integrate email service)
- All webhook handlers return 200 OK to prevent retries

