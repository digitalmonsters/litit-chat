# GoHighLevel API Integration Guide

## Overview

The GHL integration provides a comprehensive wrapper for interacting with GoHighLevel API, including contact management, transactions, messaging, and webhook handling.

## Files

### `/lib/ghl.ts`
GoHighLevel API wrapper with functions for:
- Contact management (CRUD operations)
- Transaction/payment handling
- Messaging (SMS, Email)
- Conversation history
- Tag management

### `/app/api/ghl/webhook/route.ts`
Webhook endpoint that receives events from GoHighLevel and syncs to Firestore.

### `/app/api/chat/route.ts`
Chat API endpoint for real-time messaging operations.

## Environment Variables

Required in `.env.local`:

```bash
# GoHighLevel API Configuration
GHL_API_KEY=your_ghl_api_key_here
GHL_LOCATION_ID=your_location_id_here  # Optional, can be passed per request

# Webhook Security
GHL_WEBHOOK_SECRET=your_webhook_secret_here
```

## Usage Examples

### Contact Management

```typescript
import { getContact, createContact, updateContact } from '@/lib/ghl';

// Get a contact
const contact = await getContact('contact-id', 'location-id');

// Create a new contact
const newContact = await createContact({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  locationId: 'location-id',
});

// Update a contact
const updated = await updateContact('contact-id', {
  email: 'newemail@example.com',
});
```

### Messaging

```typescript
import { sendMessage, getConversation } from '@/lib/ghl';

// Send SMS
await sendMessage('contact-id', 'Hello!', 'location-id', 'sms');

// Send Email
await sendMessage('contact-id', 'Hello!', 'location-id', 'email');

// Get conversation history
const conversation = await getConversation('contact-id', 'location-id');
```

### Transactions

```typescript
import { createTransaction, getContactTransactions } from '@/lib/ghl';

// Get transactions for a contact
const transactions = await getContactTransactions('contact-id', 'location-id');

// Create a transaction
const transaction = await createTransaction({
  contactId: 'contact-id',
  amount: 100.00,
  currency: 'USD',
  status: 'completed',
  description: 'Payment for service',
  locationId: 'location-id',
});
```

### Tag Management

```typescript
import { addContactTags, removeContactTags } from '@/lib/ghl';

// Add tags
await addContactTags('contact-id', ['vip', 'customer'], 'location-id');

// Remove tags
await removeContactTags('contact-id', ['old-tag'], 'location-id');
```

## Webhook Integration

The webhook endpoint at `/api/ghl/webhook` handles:

### Contact Events
- `contact.created` - Creates new user in Firestore
- `contact.updated` - Updates existing user in Firestore
- `contact.added` - Syncs contact to Firestore

### Payment/Transaction Events
- `transaction.created` - Creates payment record in Firestore
- `transaction.updated` - Updates payment record
- `payment.completed` - Marks payment as completed
- `payment.failed` - Marks payment as failed

### Webhook Setup

1. **In GoHighLevel Dashboard:**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/ghl/webhook`
   - Select events: Contact updates, Payment/Transaction updates
   - Set webhook secret

2. **In Vercel/Environment:**
   - Set `GHL_WEBHOOK_SECRET` environment variable
   - Ensure it matches the secret in GHL dashboard

3. **Test Webhook:**
   ```bash
   curl https://your-domain.com/api/ghl/webhook
   # Should return: {"message":"GHL Webhook endpoint is active"}
   ```

## Chat API Integration

The chat API at `/api/chat` provides:

### POST /api/chat - Send Message
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatId: 'chat-id',
    senderId: 'user-id',
    senderName: 'John Doe',
    content: 'Hello!',
    type: 'text',
  }),
});
```

### GET /api/chat - Get Messages
```typescript
const response = await fetch('/api/chat?chatId=chat-id&limit=50');
const { messages } = await response.json();
```

### PUT /api/chat - Update Message
```typescript
const response = await fetch('/api/chat', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messageId: 'message-id',
    updates: {
      status: 'read',
      readBy: { 'user-id': new Date() },
    },
  }),
});
```

## Error Handling

All GHL API functions throw errors that should be caught:

```typescript
import { getContact } from '@/lib/ghl';

try {
  const contact = await getContact('contact-id');
} catch (error) {
  if (error.message.includes('GHL API Error')) {
    // Handle API error
    console.error('GHL API Error:', error.message);
  } else if (error.message.includes('Location ID is required')) {
    // Handle configuration error
    console.error('Configuration error:', error.message);
  }
}
```

## Configuration Check

Before using GHL functions, check if configured:

```typescript
import { isGHLConfigured } from '@/lib/ghl';

if (!isGHLConfigured()) {
  console.warn('GHL API is not configured');
  // Handle gracefully
}
```

## Rate Limiting

GoHighLevel API has rate limits. The wrapper doesn't implement rate limiting, but you should:
- Implement request queuing for high-volume operations
- Cache responses when appropriate
- Handle 429 (Too Many Requests) errors

## Security Notes

1. **API Key**: Never expose `GHL_API_KEY` in client-side code
2. **Webhook Secret**: Always verify webhook signatures in production
3. **Location ID**: Can be set globally or per request
4. **Error Messages**: Don't expose sensitive information in error responses

## Integration with Firestore

The webhook automatically syncs:
- GHL Contacts → Firestore Users collection
- GHL Transactions → Firestore Payments collection
- GHL Contact updates → Firestore Chat metadata

This ensures data consistency between GHL and your Firestore database.

## Next Steps

1. **Set up environment variables** in `.env.local`
2. **Configure webhook** in GoHighLevel dashboard
3. **Test API functions** using the examples above
4. **Implement error handling** in your application
5. **Add rate limiting** if needed for high-volume usage

