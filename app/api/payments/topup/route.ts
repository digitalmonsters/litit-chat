import { NextRequest, NextResponse } from 'next/server';
import { createInvoice } from '@/lib/ghlPayments';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestorePayment, FirestoreUser } from '@/lib/firestore-collections';
import { getAuthenticatedUserId } from '@/lib/auth-server';

/**
 * POST /api/payments/topup
 * 
 * Generate GHL invoice for star purchase
 * 
 * Body:
 * {
 *   amount: number; // Amount in USD (in cents, e.g., 1000 = $10.00)
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
    const { amount } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number in cents (e.g., 1000 = $10.00)' },
        { status: 400 }
      );
    }

    // Minimum top-up amount: $5.00 (500 cents)
    if (amount < 500) {
      return NextResponse.json(
        { error: 'Minimum top-up amount is $5.00 (500 cents)' },
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

    // Calculate stars (1 cent = 1 star, so amount in cents = stars)
    const stars = amount; // 1 cent = 1 star
    const amountInDollars = amount / 100; // Convert cents to dollars for invoice

    // Create invoice in GHL
    const invoiceResponse = await createInvoice(
      {
        contactId: ghlContactId,
        items: [
          {
            name: `${stars} Stars`,
            quantity: 1,
            price: amountInDollars,
            description: `Top-up ${stars} stars for wallet`,
          },
        ],
        notes: `Top-up ${stars} stars for user ${userId}`,
        metadata: {
          userId,
          stars,
          type: 'wallet_topup',
        },
      },
      ghlLocationId
    );

    const ghlInvoice = invoiceResponse.invoice;

    // Create payment record in Firestore
    const paymentRef = doc(firestore, COLLECTIONS.PAYMENTS);
    const paymentData: Partial<FirestorePayment> = {
      id: paymentRef.id,
      userId,
      amount: amountInDollars,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'ghl',
      ghlTransactionId: ghlInvoice.id,
      ghlContactId,
      ghlLocationId,
      description: `Top-up ${stars} stars`,
      metadata: {
        ghlInvoiceData: ghlInvoice,
        type: 'wallet_topup',
        stars,
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(paymentRef, paymentData);

    console.log(`✅ Top-up ${stars} stars ($${amountInDollars.toFixed(2)}) for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        invoice: {
          id: paymentRef.id,
          ghlInvoiceId: ghlInvoice.id,
          status: 'pending',
          amount: amountInDollars,
          currency: 'USD',
          stars,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating top-up invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create top-up invoice',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

