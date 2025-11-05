import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestoreCall } from '@/lib/firestore-collections';
import { getAuthenticatedUserId } from '@/lib/auth-server';
import { calculateCallCost, DEFAULT_RATE_PER_MINUTE_STARS } from '@/lib/call-billing';
import { spendStars } from '@/lib/wallet';
import { createInvoice } from '@/lib/ghlPayments';

/**
 * POST /api/call/end
 * 
 * Manually end a call and process billing
 * 
 * Body:
 * {
 *   callId: string;
 *   status: 'ended' | 'cancelled';
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
    const { callId, status = 'ended' } = body;

    if (!callId) {
      return NextResponse.json(
        { error: 'callId is required' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Get call record
    const callRef = doc(firestore, COLLECTIONS.CALLS, callId);
    const callSnap = await getDoc(callRef);

    if (!callSnap.exists()) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    const callData = callSnap.data() as FirestoreCall;

    // Verify user is a participant or host
    if (
      !callData.participantIds.includes(userId) &&
      callData.hostId !== userId &&
      callData.callerId !== userId
    ) {
      return NextResponse.json(
        { error: 'User is not a participant in this call' },
        { status: 403 }
      );
    }

    // Check if call is already ended
    if (callData.status === 'ended' || callData.status === 'cancelled') {
      return NextResponse.json(
        {
          success: true,
          call: {
            id: callId,
            status: callData.status,
            duration: callData.duration || 0,
            cost: callData.cost || 0,
          },
          message: 'Call already ended',
        },
        { status: 200 }
      );
    }

    // Calculate duration
    const startedAt = callData.startedAt?.toMillis() || Date.now();
    const endedAt = Date.now();
    const durationSeconds = Math.floor((endedAt - startedAt) / 1000);
    const durationMinutes = durationSeconds / 60;

    // Calculate cost
    const ratePerMinute = callData.ratePerMinute || DEFAULT_RATE_PER_MINUTE_STARS;
    const cost = calculateCallCost(durationSeconds, ratePerMinute);

    // Update call record
    await updateDoc(callRef, {
      status,
      endedAt: serverTimestamp() as Timestamp,
      duration: durationSeconds,
      cost,
      totalCost: cost,
      costCurrency: callData.costCurrency || 'STARS',
      updatedAt: serverTimestamp() as Timestamp,
    });

    console.log(
      `✅ Call ${callId} ended by user ${userId} (duration: ${durationSeconds}s, cost: ${cost})`
    );

    // Process billing if cost > 0
    let billingResult: { success: boolean; message: string; transactionId?: string } = {
      success: false,
      message: 'No billing required',
    };

    if (cost > 0 && callData.hostId) {
      try {
        const paymentCurrency = callData.costCurrency || 'STARS';
        const useWallet = paymentCurrency === 'STARS';

        if (useWallet) {
          // Deduct from wallet
          const result = await spendStars(
            callData.hostId,
            cost,
            `Call ${callId} - ${durationMinutes.toFixed(2)} minutes`
          );

          if (result.success) {
            await updateDoc(callRef, {
              paymentStatus: 'paid',
              transactionId: result.transactionId,
              updatedAt: serverTimestamp() as Timestamp,
            });
            billingResult = {
              success: true,
              message: `Wallet deduction successful: ${cost} stars`,
              transactionId: result.transactionId,
            };
            console.log(`✅ Wallet deduction successful for call ${callId}: ${cost} stars`);
          } else {
            // If wallet deduction fails, create GHL invoice
            const invoiceResult = await createGHLInvoiceForCall(
              callData.hostId,
              cost,
              callId,
              durationSeconds,
              durationMinutes
            );
            billingResult = {
              success: invoiceResult.success,
              message: invoiceResult.message,
              transactionId: invoiceResult.invoiceId,
            };
          }
        } else {
          // Create GHL invoice for USD payments
          const invoiceResult = await createGHLInvoiceForCall(
            callData.hostId,
            cost,
            callId,
            durationSeconds,
            durationMinutes
          );
          billingResult = {
            success: invoiceResult.success,
            message: invoiceResult.message,
            transactionId: invoiceResult.invoiceId,
          };
        }
      } catch (paymentError) {
        console.error(`❌ Error processing payment for call ${callId}:`, paymentError);
        billingResult = {
          success: false,
          message: `Payment processing failed: ${
            paymentError instanceof Error ? paymentError.message : 'Unknown error'
          }`,
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        call: {
          id: callId,
          status,
          duration: durationSeconds,
          durationMinutes: durationMinutes.toFixed(2),
          cost,
          costCurrency: callData.costCurrency || 'STARS',
          ratePerMinute,
        },
        billing: billingResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error ending call:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to end call',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create GHL invoice for call
 */
async function createGHLInvoiceForCall(
  userId: string,
  cost: number,
  callId: string,
  durationSeconds: number,
  durationMinutes: number
): Promise<{ success: boolean; message: string; invoiceId?: string }> {
  const firestore = getFirestoreInstance();

  try {
    // Get user to find GHL contact ID
    const userRef = doc(firestore, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error(`❌ User not found: ${userId}`);
      return { success: false, message: 'User not found' };
    }

    const userData = userSnap.data();
    const ghlContactId = userData.ghlId || userData.ghlContactId;
    const ghlLocationId = userData.ghlLocationId;

    if (!ghlContactId || !ghlLocationId) {
      console.error(`❌ GHL contact ID or location ID not found for user: ${userId}`);
      return { success: false, message: 'GHL contact ID or location ID not found' };
    }

    // Convert cost from cents to dollars
    const amountInDollars = cost / 100;

    // Create GHL invoice
    const invoiceResponse = await createInvoice(
      {
        contactId: ghlContactId,
        items: [
          {
            name: `Call ${callId}`,
            quantity: 1,
            price: amountInDollars,
            description: `Call duration: ${durationMinutes.toFixed(2)} minutes`,
          },
        ],
        notes: `Call ${callId} - ${durationMinutes.toFixed(2)} minutes`,
        metadata: {
          callId,
          duration: durationSeconds,
          type: 'call',
        },
      },
      ghlLocationId
    );

    // Update call with payment info
    const callRef = doc(firestore, COLLECTIONS.CALLS, callId);
    await updateDoc(callRef, {
      ghlInvoiceId: invoiceResponse.invoice.id,
      paymentStatus: 'pending',
      updatedAt: serverTimestamp() as Timestamp,
    });

    console.log(`✅ GHL invoice created for call ${callId}: ${invoiceResponse.invoice.id}`);
    return {
      success: true,
      message: `GHL invoice created: ${invoiceResponse.invoice.id}`,
      invoiceId: invoiceResponse.invoice.id,
    };
  } catch (error) {
    console.error(`❌ Error creating GHL invoice for call ${callId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create GHL invoice',
    };
  }
}
