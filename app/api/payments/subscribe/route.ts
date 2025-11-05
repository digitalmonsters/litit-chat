import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/ghlPayments';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestorePayment, FirestoreUser } from '@/lib/firestore-collections';
import { getAuthenticatedUserId } from '@/lib/auth-server';

/**
 * Subscription Plan Configuration
 */
const SUBSCRIPTION_PLANS: Record<string, {
  name: string;
  tier: FirestoreUser['tier'];
  amount: number;
  interval: 'monthly' | 'yearly';
}> = {
  basic: {
    name: 'Basic Plan',
    tier: 'basic',
    amount: 2000, // $20.00 in cents
    interval: 'monthly',
  },
  premium: {
    name: 'Premium Plan',
    tier: 'premium',
    amount: 5000, // $50.00 in cents
    interval: 'monthly',
  },
  enterprise: {
    name: 'Enterprise Plan',
    tier: 'enterprise',
    amount: 10000, // $100.00 in cents
    interval: 'monthly',
  },
};

/**
 * POST /api/payments/subscribe
 * 
 * Create a GHL subscription for the chosen plan
 * 
 * Body:
 * {
 *   plan: 'basic' | 'premium' | 'enterprise';
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
    const { plan } = body;

    // Validate plan
    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}` },
        { status: 400 }
      );
    }

    const planConfig = SUBSCRIPTION_PLANS[plan];
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
    const ghlContactId = userData.ghlId || userData.ghlContactId;
    const ghlLocationId = userData.ghlLocationId;

    if (!ghlContactId) {
      return NextResponse.json(
        { error: 'GHL contact ID not found. User must have ghlId or ghlContactId.' },
        { status: 400 }
      );
    }

    if (!ghlLocationId) {
      return NextResponse.json(
        { error: 'GHL location ID not found. Provide locationId or set user.ghlLocationId.' },
        { status: 400 }
      );
    }

    // Create subscription in GHL
    const subscriptionResponse = await createSubscription(
      {
        contactId: ghlContactId,
        planName: planConfig.name,
        amount: planConfig.amount,
        currency: 'USD',
        interval: planConfig.interval,
        description: `Subscription to ${planConfig.name}`,
        metadata: {
          userId,
          plan,
          tier: planConfig.tier,
          type: 'subscription',
        },
      },
      ghlLocationId
    );

    const ghlSubscription = subscriptionResponse.subscription;

    // Create payment record in Firestore
    const paymentRef = doc(firestore, COLLECTIONS.PAYMENTS);
    const paymentData: Partial<FirestorePayment> = {
      id: paymentRef.id,
      userId,
      amount: planConfig.amount,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'ghl',
      ghlTransactionId: ghlSubscription.id,
      ghlContactId,
      ghlLocationId,
      description: `Subscription to ${planConfig.name}`,
      metadata: {
        ghlSubscriptionData: ghlSubscription,
        type: 'subscription',
        plan,
        tier: planConfig.tier,
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(paymentRef, paymentData);

    // Update user with subscription info
    await updateDoc(userRef, {
      tier: planConfig.tier,
      updatedAt: serverTimestamp(),
      metadata: {
        ...userData.metadata,
        subscriptionId: ghlSubscription.id,
        subscriptionPlan: plan,
        subscriptionStatus: ghlSubscription.status,
      },
    });

    console.log(`✅ User ${userId} subscribed to ${plan} plan (subscription: ${ghlSubscription.id})`);

    return NextResponse.json(
      {
        success: true,
        subscription: {
          id: paymentRef.id,
          ghlSubscriptionId: ghlSubscription.id,
          plan,
          tier: planConfig.tier,
          status: ghlSubscription.status,
          amount: planConfig.amount,
          currency: 'USD',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create subscription',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

