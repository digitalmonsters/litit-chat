import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import type { FirestoreLiveParty } from '@/lib/firestore-collections';
import {
  createTransactionAndDeductWallet,
  createTransaction,
  completeTransaction,
} from '@/lib/transactions';
import { getWallet } from '@/lib/wallet';
import { createPaymentOrder } from '@/lib/ghlPayments';

/**
 * POST /api/liveparties/viewer-fee
 * 
 * Bill per-minute viewer fee for LiveParty
 * Called periodically (e.g., every minute) while user is watching
 * 
 * Body:
 * {
 *   livePartyId: string;
 *   userId: string;
 *   minutesWatched: number; // Total minutes watched
 *   currency?: 'USD' | 'STARS'; // Default: 'STARS'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { livePartyId, userId, minutesWatched, currency = 'STARS' } = body;

    if (!livePartyId || !userId || minutesWatched === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: livePartyId, userId, minutesWatched' },
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

    // Check if party is live
    if (partyData.status !== 'live') {
      return NextResponse.json(
        { error: 'LiveParty is not live' },
        { status: 400 }
      );
    }

    // Check if viewer fee is enabled
    if (!partyData.viewerFeePerMinute || partyData.viewerFeePerMinute === 0) {
      return NextResponse.json(
        { error: 'Viewer fee not enabled for this LiveParty' },
        { status: 400 }
      );
    }

    // Check if user is a viewer
    if (!partyData.viewers.includes(userId)) {
      return NextResponse.json(
        { error: 'User is not a viewer of this LiveParty' },
        { status: 400 }
      );
    }

    // Get current minutes watched from party data
    const currentMinutes = partyData.viewerMinutes?.[userId] || 0;
    
    // Calculate new minutes to bill
    const newMinutes = Math.floor(minutesWatched);
    const minutesToBill = newMinutes - currentMinutes;

    if (minutesToBill <= 0) {
      return NextResponse.json({
        success: true,
        message: 'No new minutes to bill',
        minutesWatched: currentMinutes,
      });
    }

    // Calculate cost
    const totalCost = minutesToBill * partyData.viewerFeePerMinute;
    const viewerFeeCurrency = partyData.viewerFeeCurrency || currency;

    // Handle payment
    if (viewerFeeCurrency === 'STARS' || currency === 'STARS') {
      // Check wallet balance
      const wallet = await getWallet(userId);
      if (!wallet || wallet.stars < totalCost) {
        return NextResponse.json(
          { 
            error: 'Insufficient stars balance', 
            required: totalCost, 
            available: wallet?.stars || 0,
            minutesWatched: currentMinutes,
          },
          { status: 400 }
        );
      }

      // Create transaction and deduct from wallet
      const transaction = await createTransactionAndDeductWallet({
        userId,
        type: 'liveparty_viewer',
        amount: totalCost,
        currency: 'STARS',
        livePartyId,
        livePartyViewerMinutes: minutesToBill,
        livePartyViewerRate: partyData.viewerFeePerMinute,
        description: `Viewer fee for LiveParty ${livePartyId} - ${minutesToBill} minute(s)`,
      });

      // Complete transaction
      await completeTransaction(transaction.transaction.id);

      // Update LiveParty viewer minutes and revenue
      await updateDoc(partyRef, {
        [`viewerMinutes.${userId}`]: newMinutes,
        totalViewerRevenue: increment(totalCost),
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.transaction.id,
        minutesBilled: minutesToBill,
        totalCost,
        currency: 'STARS',
        totalMinutesWatched: newMinutes,
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
        type: 'liveparty_viewer',
        amount: totalCost,
        currency: 'USD',
        livePartyId,
        livePartyViewerMinutes: minutesToBill,
        livePartyViewerRate: partyData.viewerFeePerMinute,
        description: `Viewer fee for LiveParty ${livePartyId} - ${minutesToBill} minute(s)`,
        metadata: {},
      });

      // Create GHL payment order with transactionId in metadata
      const paymentOrder = await createPaymentOrder(
        {
          contactId: ghlContactId,
          amount: totalCost,
          currency: 'USD',
          description: `Viewer fee for LiveParty ${livePartyId} - ${minutesToBill} minute(s)`,
          metadata: {
            transactionId: transaction.id,
            type: 'liveparty_viewer',
            livePartyId,
            minutesToBill,
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

      // Update LiveParty viewer minutes (payment will be confirmed via webhook)
      await updateDoc(partyRef, {
        [`viewerMinutes.${userId}`]: newMinutes,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        ghlPaymentId: paymentOrder.payment.id,
        minutesBilled: minutesToBill,
        totalCost,
        currency: 'USD',
        totalMinutesWatched: newMinutes,
      });
    }
  } catch (error) {
    console.error('Error billing viewer fee:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to bill viewer fee',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

