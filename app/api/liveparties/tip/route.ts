import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { FirestoreLiveParty } from '@/lib/firestore-collections';
import {
  createTransactionAndDeductWallet,
  createTransaction,
  completeTransaction,
} from '@/lib/transactions';
import { getWallet } from '@/lib/wallet';
import { createPaymentOrder } from '@/lib/ghlPayments';

/**
 * POST /api/liveparties/tip
 * 
 * Tip host in LiveParty
 * 
 * Body:
 * {
 *   livePartyId: string;
 *   hostId: string;
 *   userId: string;
 *   amount: number; // Amount in stars or cents (USD)
 *   currency?: 'USD' | 'STARS'; // Default: 'STARS'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { livePartyId, hostId, userId, amount, currency = 'STARS' } = body;

    if (!livePartyId || !hostId || !userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: livePartyId, hostId, userId, amount' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Tip amount must be greater than 0' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Get LiveParty record
    const partyRef = doc(firestore, COLLECTIONS.LIVEPARTIES, livePartyId);
    const partySnap = await getDoc(partyRef);

    if (!partySnap.exists()) {
      return NextResponse.json(
        { error: 'LiveParty not found' },
        { status: 404 }
      );
    }

    const partyData = partySnap.data() as FirestoreLiveParty;

    // Verify host
    if (partyData.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Host not found in LiveParty' },
        { status: 400 }
      );
    }

    // Handle payment
    if (currency === 'STARS') {
      // Check wallet balance
      const wallet = await getWallet(userId);
      if (!wallet || wallet.stars < amount) {
        return NextResponse.json(
          { error: 'Insufficient stars balance', required: amount, available: wallet?.stars || 0 },
          { status: 400 }
        );
      }

      // Create transaction and deduct from wallet
      const transaction = await createTransactionAndDeductWallet({
        userId,
        type: 'liveparty_tip',
        amount,
        currency: 'STARS',
        livePartyId,
        description: `Tip to ${hostId} in LiveParty ${livePartyId}`,
        metadata: {
          hostId,
        },
      });

      // Complete transaction
      await completeTransaction(transaction.transaction.id);

      // Update LiveParty tips
      await updateDoc(partyRef, {
        totalTips: partyData.totalTips + amount,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.transaction.id,
        totalTips: partyData.totalTips + amount,
      });
    } else {
      // USD payment via GHL
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
        type: 'liveparty_tip',
        amount,
        currency: 'USD',
        livePartyId,
        description: `Tip to ${hostId} in LiveParty ${livePartyId}`,
        metadata: {
          hostId,
        },
      });

      // Create GHL payment order with transactionId in metadata
      const paymentOrder = await createPaymentOrder(
        {
          contactId: ghlContactId,
          amount,
          currency: 'USD',
          description: `Tip to ${hostId} in LiveParty ${livePartyId}`,
          metadata: {
            transactionId: transaction.id,
            type: 'liveparty_tip',
            livePartyId,
            hostId,
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

      // Update LiveParty tips (payment will be confirmed via webhook)
      await updateDoc(partyRef, {
        totalTips: partyData.totalTips + amount,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        ghlPaymentId: paymentOrder.payment.id,
      });
    }
  } catch (error) {
    console.error('Error sending tip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to send tip',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

