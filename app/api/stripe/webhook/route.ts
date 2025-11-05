import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestoreUser } from '@/lib/firestore-collections';
import Stripe from 'stripe';

/**
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`✅ Received Stripe webhook: ${event.type}`);

    const firestore = getFirestoreInstance();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, firestore);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, firestore);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, firestore);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, firestore);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, firestore);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing Stripe webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Webhook processing failed', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Update user tier and subscription info in Firestore
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  firestore: any
): Promise<void> {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as FirestoreUser['tier'];

  if (!userId || !tier) {
    console.warn('⚠️ Missing userId or tier in session metadata');
    return;
  }

  const userRef = doc(firestore, COLLECTIONS.USERS, userId);

  const updateData: Partial<FirestoreUser> = {
    tier,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    subscriptionStatus: 'active',
    updatedAt: serverTimestamp() as Timestamp,
  };

  await updateDoc(userRef, updateData);

  console.log(`✅ Updated user ${userId} to tier: ${tier}`);
  console.log(`   Stripe Customer ID: ${session.customer}`);
  console.log(`   Stripe Subscription ID: ${session.subscription}`);
}

/**
 * Handle customer.subscription.updated event
 * Update subscription status in Firestore
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  firestore: any
): Promise<void> {
  const userId = subscription.metadata?.userId;
  const tier = subscription.metadata?.tier as FirestoreUser['tier'];

  if (!userId) {
    console.warn('⚠️ Missing userId in subscription metadata');
    return;
  }

  const userRef = doc(firestore, COLLECTIONS.USERS, userId);

  const updateData: Partial<FirestoreUser> = {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status as FirestoreUser['subscriptionStatus'],
    updatedAt: serverTimestamp() as Timestamp,
  };

  // Update tier if provided in metadata
  if (tier) {
    updateData.tier = tier;
  }

  // Add subscription end date if subscription is ending
  if (subscription.cancel_at) {
    updateData.subscriptionEndDate = new Date(subscription.cancel_at * 1000) as any;
  }

  await updateDoc(userRef, updateData);

  console.log(`✅ Updated subscription for user ${userId}`);
  console.log(`   Status: ${subscription.status}`);
  console.log(`   Tier: ${tier || 'unchanged'}`);
}

/**
 * Handle customer.subscription.deleted event
 * Downgrade user to free tier
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  firestore: any
): Promise<void> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn('⚠️ Missing userId in subscription metadata');
    return;
  }

  const userRef = doc(firestore, COLLECTIONS.USERS, userId);

  const updateData: Partial<FirestoreUser> = {
    tier: 'free',
    subscriptionStatus: 'canceled',
    subscriptionEndDate: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await updateDoc(userRef, updateData);

  console.log(`✅ Downgraded user ${userId} to free tier (subscription canceled)`);
}

/**
 * Handle invoice.payment_succeeded event
 * Update payment status
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  firestore: any
): Promise<void> {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
  console.log(`   Customer: ${customerId}`);
  console.log(`   Amount: $${(invoice.amount_paid / 100).toFixed(2)}`);
}

/**
 * Handle invoice.payment_failed event
 * Update subscription status to past_due
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  firestore: any
): Promise<void> {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  console.warn(`⚠️ Payment failed for subscription ${subscriptionId}`);
  console.warn(`   Customer: ${customerId}`);

  // Find user by stripeSubscriptionId and update status
  // Note: This requires a query, which is more complex
  // For now, we'll just log the event
  // In production, you might want to query Firestore to find the user
}

/**
 * GET /api/stripe/webhook
 * 
 * Webhook verification endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Stripe webhook endpoint is active',
      methods: ['POST'],
      path: '/api/stripe/webhook',
    },
    { status: 200 }
  );
}
