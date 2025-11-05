/**
 * Wallet Utility Functions
 * 
 * Handles wallet operations: create, get, update, and transaction management
 */

import { getFirestoreInstance, COLLECTIONS } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import type {
  FirestoreWallet,
  CreateWalletData,
  UpdateWalletData,
} from './firestore-collections';

/**
 * Conversion rate: 1 USD = 100 stars (1 cent = 1 star)
 */
export const STAR_CONVERSION_RATE = 100; // 1 USD = 100 stars

/**
 * Get or create wallet for a user
 */
export async function getOrCreateWallet(
  userId: string
): Promise<FirestoreWallet> {
  const firestore = getFirestoreInstance();
  const walletRef = doc(firestore, COLLECTIONS.WALLETS, userId);

  const walletSnap = await getDoc(walletRef);

  if (walletSnap.exists()) {
    return {
      id: walletSnap.id,
      ...walletSnap.data(),
    } as FirestoreWallet;
  }

  // Create new wallet
  const walletData: Omit<FirestoreWallet, 'id'> = {
    userId,
    stars: 0,
    usd: 0,
    totalEarned: 0,
    totalSpent: 0,
    totalUsdSpent: 0,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(walletRef, walletData);

  return {
    id: walletRef.id,
    ...walletData,
  } as FirestoreWallet;
}

/**
 * Get wallet by userId
 */
export async function getWallet(
  userId: string
): Promise<FirestoreWallet | null> {
  const firestore = getFirestoreInstance();
  const walletRef = doc(firestore, COLLECTIONS.WALLETS, userId);
  const walletSnap = await getDoc(walletRef);

  if (!walletSnap.exists()) {
    return null;
  }

  return {
    id: walletSnap.id,
    ...walletSnap.data(),
  } as FirestoreWallet;
}

/**
 * Update wallet balance (atomic transaction)
 */
export async function updateWalletBalance(
  userId: string,
  updateData: UpdateWalletData
): Promise<FirestoreWallet> {
  const firestore = getFirestoreInstance();
  const walletRef = doc(firestore, COLLECTIONS.WALLETS, userId);

  return runTransaction(firestore, async (transaction) => {
    const walletSnap = await transaction.get(walletRef);

    if (!walletSnap.exists()) {
      // Create wallet if it doesn't exist
      const newWallet: Omit<FirestoreWallet, 'id'> = {
        userId,
        stars: updateData.stars ?? 0,
        usd: updateData.usd ?? 0,
        totalEarned: updateData.totalEarned ?? 0,
        totalSpent: updateData.totalSpent ?? 0,
        totalUsdSpent: updateData.totalUsdSpent ?? 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastActivityAt: serverTimestamp() as Timestamp,
        metadata: updateData.metadata,
      };

      transaction.set(walletRef, newWallet);
      return {
        id: walletRef.id,
        ...newWallet,
      } as FirestoreWallet;
    }

    const currentData = walletSnap.data() as FirestoreWallet;
    const updatedData: Partial<FirestoreWallet> = {
      ...updateData,
      updatedAt: serverTimestamp() as Timestamp,
      lastActivityAt: serverTimestamp() as Timestamp,
    };

    // Merge with existing data
    if (updateData.stars !== undefined) {
      updatedData.stars = currentData.stars + updateData.stars;
    }
    if (updateData.usd !== undefined) {
      updatedData.usd = currentData.usd + updateData.usd;
    }
    if (updateData.totalEarned !== undefined) {
      updatedData.totalEarned = currentData.totalEarned + updateData.totalEarned;
    }
    if (updateData.totalSpent !== undefined) {
      updatedData.totalSpent = currentData.totalSpent + updateData.totalSpent;
    }
    if (updateData.totalUsdSpent !== undefined) {
      updatedData.totalUsdSpent =
        currentData.totalUsdSpent + updateData.totalUsdSpent;
    }

    transaction.update(walletRef, updatedData);

    return {
      ...currentData,
      ...updatedData,
    } as FirestoreWallet;
  });
}

/**
 * Spend stars from wallet
 */
export async function spendStars(
  userId: string,
  stars: number,
  description?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const wallet = await getWallet(userId);
    if (!wallet) {
      return {
        success: false,
        newBalance: 0,
        error: 'Wallet not found',
      };
    }

    if (wallet.stars < stars) {
      return {
        success: false,
        newBalance: wallet.stars,
        error: 'Insufficient stars balance',
      };
    }

    await updateWalletBalance(userId, {
      stars: -stars,
      totalSpent: stars,
    });

    const updatedWallet = await getWallet(userId);
    return {
      success: true,
      newBalance: updatedWallet?.stars ?? 0,
    };
  } catch (error) {
    console.error('Error spending stars:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add stars to wallet (from USD conversion or rewards)
 */
export async function addStars(
  userId: string,
  stars: number,
  description?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    await updateWalletBalance(userId, {
      stars,
      totalEarned: stars,
    });

    const wallet = await getWallet(userId);
    return {
      success: true,
      newBalance: wallet?.stars ?? 0,
    };
  } catch (error) {
    console.error('Error adding stars:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert USD to stars and add to wallet
 */
export async function convertUsdToStars(
  userId: string,
  usdAmount: number // in cents
): Promise<{ success: boolean; starsAdded: number; error?: string }> {
  try {
    const stars = Math.floor(usdAmount * STAR_CONVERSION_RATE); // 1 cent = 1 star

    await updateWalletBalance(userId, {
      stars,
      usd: -usdAmount, // Deduct USD
      totalEarned: stars,
    });

    return {
      success: true,
      starsAdded: stars,
    };
  } catch (error) {
    console.error('Error converting USD to stars:', error);
    return {
      success: false,
      starsAdded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert stars to USD (for withdrawal or refund)
 */
export async function convertStarsToUsd(
  userId: string,
  stars: number
): Promise<{ success: boolean; usdAmount: number; error?: string }> {
  try {
    const wallet = await getWallet(userId);
    if (!wallet) {
      return {
        success: false,
        usdAmount: 0,
        error: 'Wallet not found',
      };
    }

    if (wallet.stars < stars) {
      return {
        success: false,
        usdAmount: 0,
        error: 'Insufficient stars balance',
      };
    }

    const usdAmount = Math.floor(stars / STAR_CONVERSION_RATE); // 1 star = 0.01 USD

    await updateWalletBalance(userId, {
      stars: -stars,
      usd: usdAmount,
    });

    return {
      success: true,
      usdAmount,
    };
  } catch (error) {
    console.error('Error converting stars to USD:', error);
    return {
      success: false,
      usdAmount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

