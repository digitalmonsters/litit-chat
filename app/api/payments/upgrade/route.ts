import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { createCheckoutSession, getOrCreateCustomer, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/stripe';

/**
 * POST /api/payments/upgrade
 * 
 * Create a Stripe Checkout Session for subscription upgrade
 * 
 * Body:
 * {
 *   tier: 'PRO' | 'VIP';
 *   successUrl?: string; // Optional: custom success URL
 *   cancelUrl?: string; // Optional: custom cancel URL
 * }
 * 
 * Returns:
 * {
 *   sessionId: string;
 *   url: string; // Stripe Checkout URL
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid Firebase Auth token.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, successUrl, cancelUrl } = body;

    // Validate tier
    if (!tier || (tier !== 'PRO' && tier !== 'VIP')) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "PRO" or "VIP".' },
        { status: 400 }
      );
    }

    // Check if tier exists in SUBSCRIPTION_TIERS
    if (!SUBSCRIPTION_TIERS[tier as SubscriptionTier]) {
      return NextResponse.json(
        { error: `Tier ${tier} not found in subscription configuration.` },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Get user from Firestore
    const userRef = doc(firestore, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnap.data() as FirestoreUser;

    // Check if user is already on this tier
    if (userData.tier === tier) {
      return NextResponse.json(
        { error: `You are already on the ${tier} plan.` },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      userId,
      userData.email,
      userData.displayName,
      userData.stripeCustomerId
    );

    // Prepare URLs
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const defaultSuccessUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${baseUrl}/subscription/cancel`;

    // Create Stripe Checkout Session
    const session = await createCheckoutSession(
      userId,
      tier as SubscriptionTier,
      successUrl || defaultSuccessUrl,
      cancelUrl || defaultCancelUrl,
      userData.email,
      customer.id
    );

    console.log(`✅ Created Stripe Checkout Session for user ${userId} to upgrade to ${tier}`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Checkout URL: ${session.url}`);

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
        tier,
        price: SUBSCRIPTION_TIERS[tier as SubscriptionTier].price,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating Stripe Checkout Session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/upgrade
 * 
 * Get available upgrade tiers and pricing
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid Firebase Auth token.' },
        { status: 401 }
      );
    }

    const firestore = getFirestoreInstance();

    // Get user from Firestore
    const userRef = doc(firestore, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnap.data() as FirestoreUser;
    const currentTier = userData.tier || 'free';

    // Return available tiers
    const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([key, config]) => ({
      id: key,
      name: config.name,
      tier: config.tier,
      price: config.price,
      priceFormatted: `$${(config.price / 100).toFixed(2)}`,
      features: config.features,
      isCurrent: currentTier === key,
    }));

    return NextResponse.json(
      {
        currentTier,
        tiers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching upgrade tiers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch upgrade tiers',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
