import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestoreCall } from '@/lib/firestore-collections';
import {
  createTransaction,
  createTransactionAndDeductWallet,
  completeTransaction,
} from '@/lib/transactions';
import {
  isCallEligibleForTrial,
  recordTrialCallUsage,
  checkTrialExpiration,
} from '@/lib/trial';
import { createPaymentOrder } from '@/lib/ghlPayments';
import { getWallet } from '@/lib/wallet';

/**
 * POST /api/calls/bill
 * 
 * Bill a call after it ends
 * 
 * Body:
 * {
 *   callId: string;
 *   duration: number; // Duration in seconds
 *   userId: string; // Caller ID
 *   receiverId: string;
 *   ratePerMinute?: number; // Optional: rate in cents (default: 100 = $1.00/min)
 *   currency?: 'USD' | 'STARS'; // Default: 'USD'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      callId,
      duration,
      userId,
      receiverId,
      ratePerMinute = 100, // Default: $1.00 per minute
      currency = 'USD',
    } = body;

    if (!callId || !duration || !userId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields: callId, duration, userId, receiverId' },
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

    // Check if already billed
    if (callData.paymentStatus === 'paid' || callData.paymentStatus === 'free_trial') {
      return NextResponse.json(
        { error: 'Call already billed' },
        { status: 400 }
      );
    }

    // Check trial eligibility
    const trialCheck = await isCallEligibleForTrial(userId, duration);
    const isTrialCall = trialCheck.eligible;

    if (isTrialCall) {
      // Record trial usage
      await recordTrialCallUsage(userId, duration);

      // Update call as free trial
      await updateDoc(callRef, {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration,
        paymentStatus: 'free_trial',
        isTrialCall: true,
        trialMinutesUsed: duration / 60,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        freeTrial: true,
        message: 'Call billed as free trial',
        trialInfo: {
          minutesUsed: duration / 60,
          maxMinutes: 1,
        },
      });
    }

    // Check trial expiration and prompt upgrade
    const trialExpiration = await checkTrialExpiration(userId);
    if (trialExpiration.expired || trialExpiration.shouldPromptUpgrade) {
      // Return upgrade prompt instead of billing
      return NextResponse.json({
        success: false,
        requiresUpgrade: true,
        message: 'Trial period expired. Please upgrade to LIT+ to continue making calls.',
        upgradeUrl: '/upgrade',
      }, { status: 402 }); // 402 Payment Required
    }

    // Calculate cost
    const durationMinutes = duration / 60;
    const totalCost = Math.ceil(durationMinutes * ratePerMinute); // Round up

    // Check if currency is STARS and user has enough
    if (currency === 'STARS') {
      const wallet = await getWallet(userId);
      if (!wallet || wallet.stars < totalCost) {
        return NextResponse.json(
          { error: 'Insufficient stars balance', required: totalCost, available: wallet?.stars || 0 },
          { status: 400 }
        );
      }

      // Create transaction and deduct from wallet
      const transaction = await createTransactionAndDeductWallet({
        userId,
        type: 'call',
        amount: totalCost,
        currency: 'STARS',
        callId,
        callDuration: duration,
        callRate: ratePerMinute,
        description: `Call to ${receiverId} - ${durationMinutes.toFixed(1)} minutes`,
      });

      // Complete transaction
      await completeTransaction(transaction.transaction.id);

      // Update call
      await updateDoc(callRef, {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration,
        totalCost,
        currency: 'STARS',
        paymentStatus: 'paid',
        transactionId: transaction.transaction.id,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.transaction.id,
        cost: totalCost,
        currency: 'STARS',
      });
    } else {
      // USD payment via GHL
      // Get user for GHL contact ID
      const userRef = doc(firestore, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userSnap.data();
      const ghlContactId = userData.ghlId || userData.ghlContactId;
      const ghlLocationId = userData.ghlLocationId;

      if (!ghlContactId || !ghlLocationId) {
        return NextResponse.json(
          { error: 'GHL contact ID or location ID not found' },
          { status: 400 }
        );
      }

      // Create transaction record first
      const transaction = await createTransaction({
        userId,
        type: 'call',
        amount: totalCost,
        currency: 'USD',
        callId,
        callDuration: duration,
        callRate: ratePerMinute,
        description: `Call to ${receiverId} - ${durationMinutes.toFixed(1)} minutes`,
        metadata: {
          receiverId,
        },
      });

      // Create GHL payment order with transactionId in metadata
      const paymentOrder = await createPaymentOrder(
        {
          contactId: ghlContactId,
          amount: totalCost,
          currency: 'USD',
          description: `Call to ${receiverId} - ${durationMinutes.toFixed(1)} minutes`,
          metadata: {
            transactionId: transaction.id,
            type: 'call',
            callId,
            callDuration: duration,
            callRate: ratePerMinute,
          },
        },
        ghlLocationId
      );

      // Update transaction with payment ID
      await updateDoc(doc(firestore, COLLECTIONS.TRANSACTIONS, transaction.id), {
        paymentId: paymentOrder.payment.id,
        metadata: {
          ...transaction.metadata,
          ghlTransactionId: paymentOrder.payment.id,
        },
        updatedAt: serverTimestamp(),
      });

      // Update call (payment will be confirmed via webhook)
      await updateDoc(callRef, {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration,
        totalCost,
        currency: 'USD',
        paymentStatus: 'pending',
        transactionId: transaction.id,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        ghlPaymentId: paymentOrder.payment.id,
        cost: totalCost,
        currency: 'USD',
        paymentUrl: paymentOrder.payment.paymentUrl, // If GHL provides payment URL
      });
    }
  } catch (error) {
    console.error('Error billing call:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to bill call',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

