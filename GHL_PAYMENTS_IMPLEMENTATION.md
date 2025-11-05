# GoHighLevel Payments Implementation

## ✅ Implementation Summary

GHL payments integration with Firestore sync, user tier updates, and contact ID synchronization.

## 📁 Files Created

### 1. `/lib/ghlPayments.ts` - GHL Payments API Wrapper

**Functions**:
- `createPaymentOrder()` - POST /payments/orders
- `createInvoice()` - POST /invoices
- `getPayment()` - GET /payments/{id}

### 2. `/app/api/payments/create/route.ts` - Create Payment API

**Route**: `POST /api/payments/create`

**Request Body**:
```json
{
  "userId": "firebase-user-id",
  "contactId": "ghl-contact-id",  // Optional, uses user.ghlId if not provided
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment description",
  "paymentMethod": "stripe",
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "price": 100.00,
      "description": "Item description"
    }
  ],
  "locationId": "ghl-location-id"  // Optional, uses user.ghlLocationId
}
```

**Response**:
```json
{
  "success": true,
  "payment": {
    "id": "firestore-payment-id",
    "ghlPaymentId": "ghl-payment-id",
    "status": "pending",
    "amount": 100.00,
    "currency": "USD"
  }
}
```

### 3. `/app/api/payments/webhook/route.ts` - Payment Webhook Handler

**Route**: `POST /api/payments/webhook`

**Features**:
- Receives payment webhooks from GHL
- Updates Firestore transactions
- Updates user tier on payment success
- Syncs Firebase user uid ↔ GHL contact.id via `ghlId` field

## 🔄 Payment Flow

### 1. Create Payment
```
Client → POST /api/payments/create
  ↓
Get user from Firestore
  ↓
Extract ghlId/ghlContactId
  ↓
Create payment order in GHL
  ↓
Save payment to Firestore
  ↓
Return payment details
```

### 2. Payment Webhook
```
GHL → POST /api/payments/webhook
  ↓
Parse webhook payload
  ↓
Find payment in Firestore by ghlTransactionId
  ↓
Update payment status
  ↓
If payment completed:
  - Find user by ghlId or ghlContactId
  - Update user tier based on amount
  - Sync ghlId if not already set
  ↓
Return 200 OK
```

## 🎯 User Tier System

### Tier Levels
- **free**: Default tier (amount < $20)
- **basic**: $20 - $49.99
- **premium**: $50 - $99.99
- **enterprise**: $100+

### Tier Update Logic
- Only upgrades tier (never downgrades)
- Based on payment amount
- Updated on successful payment completion

## 🔗 User ↔ GHL Contact Sync

### Sync Fields
- `users/{uid}.ghlId` - Primary sync field (GHL contact.id)
- `users/{uid}.ghlContactId` - Backward compatibility (synced with ghlId)

### Sync Behavior
1. **On Payment Success**:
   - Finds user by `ghlId` or `ghlContactId`
   - Updates both fields if missing
   - Ensures bidirectional sync

2. **Manual Sync**:
   - Set `ghlId` when linking GHL contact
   - `ghlContactId` automatically synced

## 📊 Firestore Updates

### Updated Interface: `FirestoreUser`

```typescript
export interface FirestoreUser {
  // ... existing fields ...
  
  // GHL Integration
  ghlContactId?: string;  // GHL contact ID (synced with ghlId)
  ghlId?: string;        // GHL contact ID (primary sync field)
  ghlLocationId?: string;
  
  // Subscription/Tier
  tier?: 'free' | 'basic' | 'premium' | 'enterprise';
}
```

### Payment Collection: `payments`

**Document Structure**:
```typescript
{
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'ghl' | 'stripe' | 'other';
  ghlTransactionId: string;
  ghlContactId: string;
  ghlLocationId?: string;
  description?: string;
  metadata: {
    ghlPaymentData: object;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  failedAt?: Timestamp;
}
```

## 🧪 Testing

### Test Payment Creation

```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uid-123",
    "amount": 100.00,
    "currency": "USD",
    "description": "Test payment"
  }'
```

### Test Payment Webhook

```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PaymentCompleted",
    "payment": {
      "id": "ghl-payment-id",
      "contactId": "ghl-contact-id",
      "amount": 100.00,
      "currency": "USD",
      "status": "completed"
    }
  }'
```

### Expected Behavior

1. **Payment Created**:
   - Payment order created in GHL
   - Payment record created in Firestore
   - Console: `✅ Created payment order: {ghlPaymentId} for user: {userId}`

2. **Payment Completed**:
   - Payment status updated to `completed`
   - User tier updated (if amount qualifies)
   - `ghlId` synced if missing
   - Console: `✅ Updated payment: {paymentId}`
   - Console: `✅ Updated user tier: {userId} → {tier}`

## 🔐 Environment Variables

No additional environment variables required. Uses existing:
- `GHL_LOCATION_ID` (optional, can be passed per request)
- OAuth tokens (from `ghl_tokens` collection)

## ✅ Verification Checklist

- [x] GHL payments wrapper created (`/lib/ghlPayments.ts`)
- [x] Payment creation API (`/app/api/payments/create`)
- [x] Payment webhook handler (`/app/api/payments/webhook`)
- [x] Firestore transactions updated on payment success
- [x] User tier updated based on payment amount
- [x] Firebase user uid ↔ GHL contact.id sync via `ghlId`
- [x] Build passes successfully
- [x] Linting passes

## 📝 Route Summary

**Payment Routes**:
- `POST /api/payments/create` - Create payment order
- `POST /api/payments/webhook` - Handle payment webhooks

**Other Routes**:
- `GET /api/ghl/test` - Test OAuth token
- `POST /api/ghl/webhook` - GHL webhooks
- `GET /api/oauth/auth` - OAuth initiation
- `GET /api/oauth/callback` - OAuth callback

## 🎯 Next Steps

1. **Test Payment Creation**:
   - Create a payment via `/api/payments/create`
   - Verify payment appears in GHL
   - Verify payment record in Firestore

2. **Test Payment Webhook**:
   - Send payment webhook from GHL
   - Verify payment status updated
   - Verify user tier updated (if applicable)
   - Verify `ghlId` synced

3. **Configure GHL Webhook**:
   - Set webhook URL in GHL: `https://your-domain.com/api/payments/webhook`
   - Configure payment events: `PaymentCompleted`, `PaymentFailed`, etc.

4. **Monitor Logs**:
   - Check console for payment events
   - Verify tier updates
   - Monitor Firestore updates

---

**Status**: ✅ Implementation complete and ready for testing

