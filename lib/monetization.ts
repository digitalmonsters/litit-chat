/**
 * Monetization Utility Functions
 * 
 * Central utilities for monetization features
 */

import { getFirestoreInstance, COLLECTIONS } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, collection } from 'firebase/firestore';
import type { FirestoreUser, FirestoreTransaction } from './firestore-collections';
import { completeTransaction } from './transactions';

/**
 * Sync payment to transaction and wallet
 * Called when payment webhook confirms payment
 */
export async function syncPaymentToTransaction(
  paymentId: string,
  transactionId: string
): Promise<void> {
  const firestore = getFirestoreInstance();
  const transactionRef = doc(firestore, COLLECTIONS.TRANSACTIONS, transactionId);
  const transactionSnap = await getDoc(transactionRef);

  if (!transactionSnap.exists()) {
    console.warn(`⚠️ Transaction not found: ${transactionId}`);
    return;
  }

  const transactionData = transactionSnap.data() as FirestoreTransaction;

  // Update transaction with payment ID
  await updateDoc(transactionRef, {
    paymentId,
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log(`✅ Synced payment ${paymentId} to transaction ${transactionId}`);
}

/**
 * Get all transactions for a user
 */
export async function getUserTransactions(
  userId: string,
  limit: number = 50
): Promise<FirestoreTransaction[]> {
  const firestore = getFirestoreInstance();
  const transactionsRef = collection(firestore, COLLECTIONS.TRANSACTIONS);
  const transactionsQuery = query(
    transactionsRef,
    where('userId', '==', userId),
    // Note: orderBy would require an index
  );

  const snapshot = await getDocs(transactionsQuery);
  const transactions: FirestoreTransaction[] = [];

  snapshot.forEach((doc) => {
    transactions.push({
      id: doc.id,
      ...doc.data(),
    } as FirestoreTransaction);
  });

  // Sort by createdAt descending
  transactions.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });

  return transactions.slice(0, limit);
}

/**
 * Calculate total revenue for a user (as host)
 */
export async function calculateHostRevenue(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRevenue: number;
  totalTips: number;
  battleWins: number;
  livePartyRevenue: number;
}> {
  const firestore = getFirestoreInstance();
  const transactionsRef = collection(firestore, COLLECTIONS.TRANSACTIONS);

  // Get all transactions where user received money (tips, rewards, etc.)
  const tipsQuery = query(
    transactionsRef,
    where('metadata.hostId', '==', userId),
    where('status', '==', 'completed')
  );

  const tipsSnapshot = await getDocs(tipsQuery);

  let totalTips = 0;
  let battleWins = 0;
  let livePartyRevenue = 0;

  tipsSnapshot.forEach((doc) => {
    const transaction = doc.data() as FirestoreTransaction;
    const createdAt = transaction.createdAt?.toDate();

    // Filter by date range if provided
    if (startDate && createdAt && createdAt < startDate) return;
    if (endDate && createdAt && createdAt > endDate) return;

    if (transaction.type === 'battle_tip' || transaction.type === 'liveparty_tip') {
      totalTips += transaction.amount;
    } else if (transaction.type === 'battle_reward') {
      totalTips += transaction.amount;
      battleWins++;
    }
  });

  // Get LiveParty revenue (entry fees go to host)
  const livePartiesRef = collection(firestore, COLLECTIONS.LIVEPARTIES);
  const hostPartiesQuery = query(
    livePartiesRef,
    where('hostId', '==', userId)
  );

  const partiesSnapshot = await getDocs(hostPartiesQuery);
  partiesSnapshot.forEach((doc) => {
    const party = doc.data();
    const createdAt = party.createdAt?.toDate();

    if (startDate && createdAt && createdAt < startDate) return;
    if (endDate && createdAt && createdAt > endDate) return;

    livePartyRevenue += party.totalEntryRevenue || 0;
    livePartyRevenue += party.totalViewerRevenue || 0;
    livePartyRevenue += party.totalTips || 0;
  });

  return {
    totalRevenue: totalTips + livePartyRevenue,
    totalTips,
    battleWins,
    livePartyRevenue,
  };
}

