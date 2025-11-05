/**
 * Stripe Server-Side API Wrapper
 * 
 * Provides functions for Stripe payment operations:
 * - Create checkout sessions
 * - Manage customers
 * - Handle subscriptions
 */

import Stripe from 'stripe';

// Lazy initialize Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not set in environment variables');
    }
    
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }
  
  return stripeInstance;
}

// Legacy export for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripeInstance() as any)[prop];
  },
});

/**
 * Subscription Tier Configuration
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    tier: 'free' as const,
    price: 0,
    priceId: null,
    features: [
      'Basic messaging',
      'Up to 10 chats',
      'Standard support',
      'Limited storage',
    ],
  },
  PRO: {
    name: 'PRO',
    tier: 'PRO' as const,
    price: 1999, // $19.99/month in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'Unlimited messaging',
      'Unlimited chats',
      'Priority support',
      '100GB storage',
      'Unlock paid content',
      'Early access features',
    ],
  },
  VIP: {
    name: 'VIP',
    tier: 'VIP' as const,
    price: 4999, // $49.99/month in cents
    priceId: process.env.STRIPE_VIP_PRICE_ID || '',
    features: [
      'Everything in PRO',
      'Unlimited storage',
      'VIP support 24/7',
      'Exclusive VIP content',
      'Custom themes',
      'Advanced analytics',
      'API access',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Create a Stripe Checkout Session for subscription upgrade
 */
export async function createCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string,
  stripeCustomerId?: string
): Promise<Stripe.Checkout.Session> {
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  if (!tierConfig.priceId) {
    throw new Error(`Price ID not configured for tier: ${tier}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: tierConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
      type: 'subscription_upgrade',
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
      },
    },
  };

  // Add customer information
  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId;
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Get or create a Stripe customer
 */
export async function getOrCreateCustomer(
  userId: string,
  email?: string,
  name?: string,
  stripeCustomerId?: string
): Promise<Stripe.Customer> {
  // If customer ID exists, retrieve it
  if (stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, updates);
  return subscription;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
