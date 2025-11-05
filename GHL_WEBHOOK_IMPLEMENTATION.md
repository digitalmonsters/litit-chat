# GoHighLevel Webhook Handler Implementation

## ✅ Implementation Summary

The GHL webhook handler has been updated to properly handle ContactCreate and ContactUpdate events, save contacts to Firestore, and always return HTTP 200 OK.

## 📁 File Location

**Route**: `/app/api/ghl/webhook/route.ts`

**Path**: `POST /api/ghl/webhook`

## 🔧 Features Implemented

### 1. JSON Payload Parsing
- ✅ Properly parses JSON from `request.text()`
- ✅ Handles parsing errors gracefully
- ✅ Always returns 200 OK even for invalid JSON

### 2. Event Handling (Switch/Case)
- ✅ **ContactCreate** - Creates new contact in Firestore
- ✅ **ContactUpdate** - Updates existing contact in Firestore
- ✅ Unknown events logged but still return 200 OK

### 3. Firestore Integration
- ✅ Saves to **`contacts`** collection
- ✅ Uses `contact.id` as document ID (primary)
- ✅ Falls back to `contact.email` if `contact.id` is missing
- ✅ Uses `setDoc` with `merge: true` to handle both create and update

### 4. Logging
- ✅ Clear console logging with emojis:
  - `✅ Received GHL webhook: ContactCreate`
  - `🔥 Saved contact: email@example.com (ID: contact-id)`
  - `✅ ContactCreate processed for: email@example.com`
  - `⚠️ Warning messages for missing data`
  - `❌ Error messages`

### 5. Response Handling
- ✅ **Always returns HTTP 200 OK** with `{ok: true}`
- ✅ Never returns 400 or 500 (prevents GHL retries)
- ✅ Even errors return 200 OK (as per requirements)

### 6. Signature Verification
- ✅ Supports `GHL_PUBLIC_KEY` (primary)
- ✅ Falls back to `GHL_WEBHOOK_SECRET` (backward compatible)
- ✅ Development mode allows webhooks without verification
- ✅ Production mode requires signature (placeholder for HMAC-SHA256)

## 📋 Environment Variables

Required in `.env.local`:

```bash
# GoHighLevel Webhook Signature Verification
GHL_PUBLIC_KEY=your_ghl_public_key_here        # Primary (recommended)
GHL_WEBHOOK_SECRET=your_webhook_secret_here   # Fallback
```

## 🔄 Event Flow

### ContactCreate Event
```
GHL Webhook → POST /api/ghl/webhook
  ↓
Parse JSON payload
  ↓
Event: ContactCreate
  ↓
Save to Firestore: contacts/{contact.id}
  ↓
Log: ✅ ContactCreate processed
  ↓
Return: {ok: true} (200 OK)
```

### ContactUpdate Event
```
GHL Webhook → POST /api/ghl/webhook
  ↓
Parse JSON payload
  ↓
Event: ContactUpdate
  ↓
Update in Firestore: contacts/{contact.id}
  ↓
Log: ✅ ContactUpdate processed
  ↓
Return: {ok: true} (200 OK)
```

## 📊 Firestore Structure

### Collection: `contacts`

**Document ID**: `contact.id` or `contact.email`

**Document Structure**:
```typescript
{
  id: string,                    // GHL contact ID
  email: string | null,
  name: string | null,
  firstName: string | null,
  lastName: string | null,
  phone: string | null,
  photo: string | null,
  timezone: string | null,
  locationId: string | null,
  tags: string[],
  source: string | null,
  address: {
    address1?: string,
    address2?: string,
    city?: string,
    state?: string,
    postalCode?: string,
    country?: string,
  } | null,
  customFields: Record<string, unknown>,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  ghlData: GHLContact,           // Full original GHL contact data
}
```

## 🧪 Testing

### Test Webhook Locally

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Send test webhook** (using curl):
   ```bash
   curl -X POST http://localhost:3000/api/ghl/webhook \
     -H "Content-Type: application/json" \
     -H "x-ghl-signature: test-signature" \
     -d '{
       "event": "ContactCreate",
       "contact": {
         "id": "contact-123",
         "email": "test@example.com",
         "firstName": "John",
         "lastName": "Doe",
         "phone": "+1234567890"
       }
     }'
   ```

3. **Expected console output**:
   ```
   ✅ Received GHL webhook: ContactCreate
   🔥 Saved contact: test@example.com (ID: contact-123)
   ✅ ContactCreate processed for: test@example.com
   ```

4. **Verify in Firestore**:
   - Check `contacts` collection
   - Document ID: `contact-123`
   - Email field: `test@example.com`

### Test from GHL Dashboard

1. **Configure webhook in GHL**:
   - URL: `https://your-domain.com/api/ghl/webhook`
   - Events: ContactCreate, ContactUpdate
   - Method: POST

2. **Send test webhook from GHL**:
   - GHL will send a test webhook
   - Check terminal for logs
   - Verify contact appears in Firestore

3. **Create/Update a contact in GHL**:
   - Create a new contact in GHL
   - Check terminal for ContactCreate log
   - Verify contact in Firestore
   - Update the contact in GHL
   - Check terminal for ContactUpdate log
   - Verify contact updated in Firestore

## 📝 Logging Examples

### Successful ContactCreate
```
✅ Received GHL webhook: ContactCreate
🔥 Saved contact: john.doe@example.com (ID: contact-abc123)
✅ ContactCreate processed for: john.doe@example.com
```

### Successful ContactUpdate
```
✅ Received GHL webhook: ContactUpdate
🔥 Saved contact: jane.smith@example.com (ID: contact-xyz789)
✅ ContactUpdate processed for: jane.smith@example.com
```

### Unknown Event
```
✅ Received GHL webhook: UnknownEvent
ℹ️ Unknown webhook event: UnknownEvent
```

### Missing Contact Data
```
✅ Received GHL webhook: ContactCreate
⚠️ ContactCreate event missing contact data
```

## 🔒 Security Notes

1. **Signature Verification**: 
   - Currently a placeholder in production
   - Should implement HMAC-SHA256 verification
   - Uses GHL_PUBLIC_KEY or GHL_WEBHOOK_SECRET

2. **Error Handling**:
   - All errors return 200 OK (prevents GHL retries)
   - Errors are logged to console for debugging
   - Never expose sensitive data in responses

3. **Rate Limiting**:
   - Consider adding rate limiting for production
   - GHL may send multiple webhooks rapidly

## 🚀 Deployment

### Environment Variables in Vercel

Set these in Vercel dashboard:
- `GHL_PUBLIC_KEY` - GoHighLevel webhook public key
- `GHL_WEBHOOK_SECRET` - Fallback webhook secret

### Webhook URL

Configure in GHL dashboard:
```
https://your-domain.vercel.app/api/ghl/webhook
```

## ✅ Verification Checklist

- [x] JSON payload parsing implemented
- [x] ContactCreate event handled
- [x] ContactUpdate event handled
- [x] Contacts saved to Firestore `contacts` collection
- [x] Document ID uses `contact.id` or `contact.email`
- [x] Clear logging with emojis
- [x] Always returns 200 OK with `{ok: true}`
- [x] Signature verification logic preserved
- [x] Unknown events handled gracefully
- [x] Error handling returns 200 OK
- [x] Build passes successfully
- [x] Linting passes

## 📚 Related Files

- `/app/api/ghl/webhook/route.ts` - Webhook handler
- `/lib/firebase.ts` - Firebase initialization
- `/lib/env.example.txt` - Environment variables template

## 🎯 Next Steps

1. **Test webhook** from GHL dashboard
2. **Verify contacts** appear in Firestore
3. **Implement HMAC-SHA256** signature verification for production
4. **Add rate limiting** if needed
5. **Monitor logs** for webhook activity

---

**Status**: ✅ Implementation complete and ready for testing

