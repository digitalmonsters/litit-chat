# Stripe Payments Integration - Upgrade System

**Status:** ✅ Complete  
**Date:** November 5, 2025  
**Branch:** `feature/payments-upgrade`

## Overview

This implementation integrates **Stripe Checkout** and **GoHighLevel (GHL)** webhooks for subscription-based upgrades to **PRO** and **VIP** tiers. The system automatically updates user tiers in Firestore after successful payments.

---

## Features

### 1. Subscription Tiers

- **Free**: Basic features, no payment required
- **PRO**: $19.99/month - Unlocks premium features
- **VIP**: $49.99/month - All features + exclusive VIP content

### 2. Stripe Checkout Integration

- Secure payment processing via Stripe Checkout
- Subscription-based billing (monthly recurring)
- Automatic customer creation in Stripe
- Session metadata for tier tracking

### 3. Webhook Handlers

- **Stripe Webhooks**: `/api/stripe/webhook`
  - `checkout.session.completed` - Activates subscription
  - `customer.subscription.updated` - Updates subscription status
  - `customer.subscription.deleted` - Downgrades to free tier
  - `invoice.payment_succeeded` - Logs successful payments
  - `invoice.payment_failed` - Handles failed payments

- **GHL Webhooks**: `/api/ghl/webhook` (extended)
  - `SubscriptionCreate` - Handles GHL subscription creation
  - `SubscriptionUpdate` - Updates subscription status
  - `SubscriptionDelete` - Downgrades user to free tier

### 4. Firestore Updates

After successful payment, the following fields are updated in the `users` collection:

```typescript
{
  tier: 'PRO' | 'VIP',
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  subscriptionStatus: 'active',
  updatedAt: Timestamp
}
```

---

## File Structure

```
litit-chat/
├── lib/
│   └── stripe.ts                          # Stripe API wrapper
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   └── upgrade/
│   │   │       └── route.ts               # Stripe Checkout API
│   │   ├── stripe/
│   │   │   └── webhook/
│   │   │       └── route.ts               # Stripe webhook handler
│   │   └── ghl/
│   │       └── webhook/
│   │           └── route.ts               # GHL webhook handler (extended)
│   └── subscription/
│       ├── success/
│       │   └── page.tsx                   # Success page
│       └── cancel/
│           └── page.tsx                   # Cancel page
└── components/
    └── monetization/
        └── UpgradeModal.tsx               # Upgrade modal UI
```

---

## API Routes

### `POST /api/payments/upgrade`

Creates a Stripe Checkout Session for subscription upgrade.

**Request:**
```json
{
  "tier": "PRO" | "VIP",
  "successUrl": "https://app.com/subscription/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://app.com/subscription/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "tier": "PRO",
  "price": 1999
}
```

**Headers:**
- `Authorization: Bearer <Firebase_Auth_Token>`

---

### `GET /api/payments/upgrade`

Fetches available subscription tiers and current user tier.

**Response:**
```json
{
  "currentTier": "free",
  "tiers": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "priceFormatted": "$0.00",
      "features": ["..."],
      "isCurrent": true
    },
    {
      "id": "PRO",
      "name": "PRO",
      "price": 1999,
      "priceFormatted": "$19.99",
      "features": ["..."],
      "isCurrent": false
    }
  ]
}
```

---

### `POST /api/stripe/webhook`

Handles Stripe webhook events.

**Supported Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Headers:**
- `stripe-signature`: HMAC signature for verification

---

### `POST /api/ghl/webhook`

Extended to handle GHL subscription events.

**New Events:**
- `SubscriptionCreate`
- `SubscriptionUpdate`
- `SubscriptionDelete`

---

## Components

### `UpgradeModal`

A modal component that displays subscription tiers with features and upgrade buttons.

**Usage:**
```tsx
import { UpgradeModal } from '@/components';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Upgrade</button>
      <UpgradeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

**Features:**
- Displays Free, PRO, and VIP tiers
- Shows current plan badge
- Animated UI with Framer Motion
- Redirects to Stripe Checkout on upgrade

---

## Environment Variables

Add the following variables to `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_VIP_PRICE_ID=price_...

# GHL Configuration (existing)
GHL_API_KEY=...
GHL_LOCATION_ID=...
GHL_WEBHOOK_SECRET=...
```

---

## Stripe Setup

### 1. Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create two products:
   - **PRO** - $19.99/month
   - **VIP** - $49.99/month
3. Copy the Price IDs and add them to `.env.local`

### 2. Configure Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-app.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret and add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

---

## Testing

### Local Testing with Stripe CLI

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Test checkout:
```bash
curl -X POST http://localhost:3000/api/payments/upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"tier": "PRO"}'
```

5. Use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

---

## User Flow

1. **User clicks "Upgrade" button**
   - `UpgradeModal` opens with tier selection

2. **User selects PRO or VIP tier**
   - Frontend calls `POST /api/payments/upgrade`
   - Backend creates Stripe Checkout Session
   - User is redirected to Stripe Checkout

3. **User completes payment**
   - Stripe processes payment
   - Stripe sends `checkout.session.completed` webhook
   - Backend updates user tier in Firestore
   - User is redirected to `/subscription/success`

4. **User's tier is updated**
   - `firestoreUser.tier` is set to `PRO` or `VIP`
   - `subscriptionStatus` is set to `active`
   - `stripeCustomerId` and `stripeSubscriptionId` are saved

---

## Security

### Webhook Signature Verification

All webhooks verify signatures using:
- **Stripe**: HMAC-SHA256 with `STRIPE_WEBHOOK_SECRET`
- **GHL**: Custom verification with `GHL_WEBHOOK_SECRET`

### Authentication

All API routes require Firebase Auth token in `Authorization` header.

---

## Error Handling

### Payment Failures

- Failed payments trigger `invoice.payment_failed` webhook
- User's `subscriptionStatus` is updated to `past_due`
- Retry logic handled by Stripe

### Subscription Cancellation

- User cancels subscription in Stripe Dashboard
- `customer.subscription.deleted` webhook is triggered
- User is downgraded to `free` tier
- `subscriptionStatus` set to `canceled`

---

## Future Enhancements

- [ ] Add yearly billing option with discount
- [ ] Implement proration for mid-cycle upgrades/downgrades
- [ ] Add subscription management page
- [ ] Implement trial periods (7-day free trial)
- [ ] Add usage-based billing for VIP features
- [ ] Integrate Stripe Customer Portal for self-service

---

## Support

For issues or questions:
- Check Stripe Dashboard logs
- Review webhook event logs in `/api/stripe/webhook`
- Test webhooks with Stripe CLI
- Verify environment variables are set correctly

---

## Changelog

### v1.0.0 (2025-11-05)
- ✅ Stripe Checkout integration
- ✅ Webhook handlers (Stripe + GHL)
- ✅ UpgradeModal component
- ✅ Success/Cancel pages
- ✅ Firestore tier updates
- ✅ Documentation

---

**Implementation Complete** ✅
