# Payment and Unlock Logic Implementation

## Overview
This document describes the backend implementation for payment and unlock logic for locked messages in Firechat.

## Implementation Summary

### 1. Payment Creation Endpoint (`/api/payments/create`)

**Location**: `app/api/payments/create/route.ts`

**Functionality**:
- Handles locked message payment requests
- Creates GHL invoices for message unlock payments
- Stores `ghlInvoiceId` in Firestore message document
- Creates payment records in Firestore

**Request Body for Locked Messages**:
```json
{
  "userId": "string",
  "messageId": "string",
  "chatId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "invoice": {
    "id": "paymentId",
    "ghlInvoiceId": "ghlInvoiceId",
    "status": "pending",
    "amount": 10.00,
    "currency": "USD"
  },
  "messageId": "messageId"
}
```

**Features**:
- Validates message exists and is locked
- Checks if user has already unlocked the message
- Converts unlock price from cents to dollars
- Creates GHL invoice with metadata linking to message
- Updates message document with `ghlInvoiceId`

### 2. Payment Webhook Endpoint (`/api/payments/webhook`)

**Location**: `app/api/payments/webhook/route.ts`

**Functionality**:
- Listens for `InvoicePaid` events from GoHighLevel
- Updates message `unlockedBy` field when payment is received
- Logs payment received events
- Updates payment status in Firestore

**Supported Events**:
- `InvoicePaid` - Invoice payment completed
- `invoice.paid` - Alternative event format
- `Invoice.paid` - Alternative event format

**Webhook Payload**:
```json
{
  "event": "InvoicePaid",
  "invoice": {
    "id": "invoiceId",
    "contactId": "ghlContactId",
    "amount": 10.00,
    "currency": "USD",
    "status": "paid"
  }
}
```

**Features**:
- Finds payment record by `ghlTransactionId` (invoice ID)
- Updates message `unlockedBy` field with buyer's user ID
- Supports both array and map structures for `unlockedBy`
- Converts array structure to map for better Firestore security rules support
- Logs: `✅ Payment received – unlocked message {id} for user {uid}.`
- Updates payment status to `completed`

### 3. Firestore Data Structure

**Message Document Updates**:
- `ghlInvoiceId`: string - GHL invoice ID for payment
- `unlockedBy`: Record<string, Timestamp> | string[] - Map of user IDs who have unlocked (preferred: map structure)

**Payment Document**:
- `messageId`: string - Reference to unlocked message
- `chatId`: string - Reference to chat containing message
- `ghlTransactionId`: string - GHL invoice ID
- `metadata.type`: "message_unlock" - Identifies message unlock payments

### 4. Firestore Security Rules

**Location**: `firestore.rules`

**Rules for Locked Messages**:
- Users can read messages if:
  1. They are participants in the chat
  2. Message is not locked OR
  3. They are the sender OR
  4. Their user ID exists in `unlockedBy` map (for map structure)

**Key Functions**:
- `isAuthenticated()` - Checks if user is authenticated
- `currentUserId()` - Gets current user ID
- `isMessageUnlocked(messageData)` - Checks if message is unlocked for current user

**Note**: For array-based `unlockedBy`, security rules cannot directly check membership. The application layer must enforce this check. Map structure (`Record<string, Timestamp>`) is recommended for better security rules support.

### 5. Type Definitions

**Updated Types** (`lib/firestore-collections.ts`):
```typescript
export interface FirestoreMessage {
  // ... other fields
  isLocked?: boolean;
  unlockPrice?: number; // Price in cents
  unlockCurrency?: string; // Default: 'USD'
  ghlInvoiceId?: string; // GHL invoice ID for payment
  unlockedBy?: string[] | Record<string, Timestamp>; // Array or map of user IDs
}
```

## Flow Diagram

```
1. User clicks "Unlock Message"
   ↓
2. Frontend calls POST /api/payments/create
   {
     userId, messageId, chatId
   }
   ↓
3. Backend:
   - Validates message is locked
   - Checks user hasn't already unlocked
   - Gets user's GHL contact ID
   - Creates GHL invoice
   - Stores ghlInvoiceId in message
   - Creates payment record
   ↓
4. Frontend receives invoice details
   ↓
5. User pays invoice in GHL
   ↓
6. GHL sends InvoicePaid webhook to /api/payments/webhook
   ↓
7. Backend:
   - Finds payment record by invoice ID
   - Updates message.unlockedBy with buyer's user ID
   - Updates payment status to completed
   - Logs: "Payment received – unlocked message {id} for user {uid}."
   ↓
8. Frontend polls/refreshes to detect unlock
   ↓
9. Unblur animation triggers
```

## Environment Variables

Required environment variables (already configured):
- `GHL_API_KEY` - GoHighLevel API key
- `GHL_WEBHOOK_SECRET` - Webhook secret for verification (optional)

## Testing

### Test Payment Creation
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "messageId": "msg456",
    "chatId": "chat789"
  }'
```

### Test Webhook (InvoicePaid)
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

## Security Considerations

1. **Firestore Security Rules**: Enforce access to unlocked media only
2. **Webhook Verification**: Implement HMAC signature verification (placeholder in code)
3. **Duplicate Prevention**: Check if message already unlocked before processing
4. **User Validation**: Verify user exists and has GHL contact ID before creating invoice
5. **Message Validation**: Ensure message exists and is locked before processing

## Future Enhancements

1. Implement HMAC signature verification for webhooks
2. Add retry logic for failed webhook processing
3. Add webhook event logging for audit trail
4. Consider using Cloud Functions for webhook processing for better scalability
5. Add rate limiting for payment creation endpoints

## Files Modified

1. `app/api/payments/create/route.ts` - Added locked message invoice creation
2. `app/api/payments/webhook/route.ts` - Added InvoicePaid event handling
3. `lib/firestore-collections.ts` - Added `ghlInvoiceId` and `unlockedBy` fields
4. `firestore.rules` - Added security rules for locked messages

