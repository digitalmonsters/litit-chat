/**
 * Transaction Utility Functions
 * 
 * Handles transactions for calls, battles, and LiveParty
 */

import { getFirestoreInstance, COLLECTIONS } from './firebase';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import type {
  FirestoreTransaction,
  CreateTransactionData,
} from './firestore-collections';
import { updateWalletBalance, spendStars } from './wallet';

/**
 * Create a transaction record
 */
export async function createTransaction(
  transactionData: CreateTransactionData
): Promise<FirestoreTransaction> {
  const firestore = getFirestoreInstance();
  const transactionRef = doc(firestore, COLLECTIONS.TRANSACTIONS);

  const transaction: Omit<FirestoreTransaction, 'id'> = {
    userId: transactionData.userId,
    type: transactionData.type,
    amount: transactionData.amount,
    currency: transactionData.currency,
    status: 'pending',
    callId: transactionData.callId,
    callDuration: transactionData.callDuration,
    callRate: transactionData.callRate,
    battleId: transactionData.battleId,
    battleHostId: transactionData.battleHostId,
    livePartyId: transactionData.livePartyId,
    livePartyEntryFee: transactionData.livePartyEntryFee,
    livePartyViewerMinutes: transactionData.livePartyViewerMinutes,
    livePartyViewerRate: transactionData.livePartyViewerRate,
    paymentId: transactionData.paymentId,
    description: transactionData.description,
    metadata: transactionData.metadata,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(transactionRef, transaction);

  return {
    id: transactionRef.id,
    ...transaction,
  } as FirestoreTransaction;
}

/**
 * Complete a transaction (mark as completed)
 */
export async function completeTransaction(
  transactionId: string,
  paymentId?: string,
  ghlTransactionId?: string
): Promise<void> {
  const firestore = getFirestoreInstance();
  const transactionRef = doc(firestore, COLLECTIONS.TRANSACTIONS, transactionId);

  await updateDoc(transactionRef, {
    status: 'completed',
    completedAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    ...(paymentId && { paymentId }),
    ...(ghlTransactionId && { ghlTransactionId }),
  });
}

/**
 * Fail a transaction
 */
export async function failTransaction(
  transactionId: string,
  reason?: string
): Promise<void> {
  const firestore = getFirestoreInstance();
  const transactionRef = doc(firestore, COLLECTIONS.TRANSACTIONS, transactionId);

  await updateDoc(transactionRef, {
    status: 'failed',
    updatedAt: serverTimestamp() as Timestamp,
    metadata: {
      failureReason: reason,
    },
  });
}

/**
 * Create transaction and deduct from wallet (atomic)
 */
export async function createTransactionAndDeductWallet(
  transactionData: CreateTransactionData
): Promise<{ transaction: FirestoreTransaction; walletUpdated: boolean }> {
  const firestore = getFirestoreInstance();

  return runTransaction(firestore, async (transaction) => {
    // Create transaction record
    const transactionRef = doc(firestore, COLLECTIONS.TRANSACTIONS);
    const transactionDoc: Omit<FirestoreTransaction, 'id'> = {
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency,
      status: 'pending',
      callId: transactionData.callId,
      callDuration: transactionData.callDuration,
      callRate: transactionData.callRate,
      battleId: transactionData.battleId,
      battleHostId: transactionData.battleHostId,
      livePartyId: transactionData.livePartyId,
      livePartyEntryFee: transactionData.livePartyEntryFee,
      livePartyViewerMinutes: transactionData.livePartyViewerMinutes,
      livePartyViewerRate: transactionData.livePartyViewerRate,
      paymentId: transactionData.paymentId,
      description: transactionData.description,
      metadata: transactionData.metadata,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    transaction.set(transactionRef, transactionDoc);

    // Deduct from wallet if currency is STARS
    let walletUpdated = false;
    if (transactionData.currency === 'STARS') {
      const result = await spendStars(transactionData.userId, transactionData.amount);
      if (!result.success) {
        throw new Error(result.error || 'Insufficient stars');
      }
      walletUpdated = true;
    }

    return {
      transaction: {
        id: transactionRef.id,
        ...transactionDoc,
      } as FirestoreTransaction,
      walletUpdated,
    };
  });
}

