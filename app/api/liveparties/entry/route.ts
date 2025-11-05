import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import type { FirestoreLiveParty } from '@/lib/firestore-collections';
import {
  createTransactionAndDeductWallet,
  createTransaction,
  completeTransaction,
} from '@/lib/transactions';
import { getWallet } from '@/lib/wallet';
import { createPaymentOrder } from '@/lib/ghlPayments';

/**
 * POST /api/liveparties/entry
 * 
 * Pay entry fee for LiveParty
 * 
 * Body:
 * {
 *   livePartyId: string;
 *   userId: string;
 *   currency?: 'USD' | 'STARS'; // Default: 'STARS'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { livePartyId, userId, currency = 'STARS' } = body;

    if (!livePartyId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: livePartyId, userId' },
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

    // Check if party is active
    if (partyData.status !== 'live' && partyData.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'LiveParty is not active' },
        { status: 400 }
      );
    }

    // Check if user already joined
    if (partyData.viewers.includes(userId)) {
      return NextResponse.json(
        { error: 'User already joined this LiveParty' },
        { status: 400 }
      );
    }

    const entryFee = partyData.entryFee;
    const entryFeeCurrency = partyData.entryFeeCurrency;

    // Handle payment based on requested currency
    if (currency === 'STARS' || entryFeeCurrency === 'STARS') {
      // Check wallet balance
      const wallet = await getWallet(userId);
      if (!wallet || wallet.stars < entryFee) {
        return NextResponse.json(
          { error: 'Insufficient stars balance', required: entryFee, available: wallet?.stars || 0 },
          { status: 400 }
        );
      }

      // Create transaction and deduct from wallet
      const transaction = await createTransactionAndDeductWallet({
        userId,
        type: 'liveparty_entry',
        amount: entryFee,
        currency: 'STARS',
        livePartyId,
        livePartyEntryFee: entryFee,
        description: `Entry fee for LiveParty ${livePartyId}`,
      });

      // Complete transaction
      await completeTransaction(transaction.transaction.id);

      // Add user to viewers and update revenue
      await updateDoc(partyRef, {
        viewers: arrayUnion(userId),
        totalEntryRevenue: partyData.totalEntryRevenue + entryFee,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.transaction.id,
        entryFee,
        currency: 'STARS',
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
        type: 'liveparty_entry',
        amount: entryFee,
        currency: 'USD',
        livePartyId,
        livePartyEntryFee: entryFee,
        description: `Entry fee for LiveParty ${livePartyId}`,
        metadata: {},
      });

      // Create GHL payment order with transactionId in metadata
      const paymentOrder = await createPaymentOrder(
        {
          contactId: ghlContactId,
          amount: entryFee,
          currency: 'USD',
          description: `Entry fee for LiveParty ${livePartyId}`,
          metadata: {
            transactionId: transaction.id,
            type: 'liveparty_entry',
            livePartyId,
          },
        },
        ghlLocationId
      );

      // Update transaction with payment ID
      await updateDoc(doc(firestore, COLLECTIONS.TRANSACTIONS, transaction.id), {
        paymentId: paymentOrder.payment.id,
        metadata: {
          ghlTransactionId: paymentOrder.payment.id,
        },
        updatedAt: serverTimestamp(),
      });

      // Add user to viewers (payment will be confirmed via webhook)
      await updateDoc(partyRef, {
        viewers: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        ghlPaymentId: paymentOrder.payment.id,
        entryFee,
        currency: 'USD',
      });
    }
  } catch (error) {
    console.error('Error processing LiveParty entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to process LiveParty entry',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

