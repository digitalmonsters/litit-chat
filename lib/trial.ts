/**
 * Trial Logic Utility Functions
 * 
 * Handles LIT+ trial logic for calls
 */

import { getFirestoreInstance, COLLECTIONS } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestoreUser } from './firestore-collections';

/**
 * Trial configuration
 */
export const TRIAL_CONFIG = {
  DURATION_DAYS: 3,
  MAX_CALL_MINUTES: 1, // 1 minute per call
  MAX_CALLS: Infinity, // Unlimited calls during trial
} as const;

/**
 * Check if user is in trial period
 */
export async function isUserInTrial(userId: string): Promise<boolean> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return false;
  }

  const userData = userSnap.data() as FirestoreUser;

  // Check if user has tier 'litplus' or is in trial
  if (userData.tier === 'litplus') {
    return false; // Already subscribed
  }

  // Check trial dates
  if (!userData.trialStartDate || !userData.trialEndDate) {
    return false;
  }

  const now = new Date();
  const trialEnd = userData.trialEndDate.toDate();

  return now < trialEnd;
}

/**
 * Check if call is eligible for free trial
 */
export async function isCallEligibleForTrial(
  userId: string,
  callDurationSeconds: number
): Promise<{ eligible: boolean; reason?: string }> {
  // Check if user is in trial
  const inTrial = await isUserInTrial(userId);
  if (!inTrial) {
    return { eligible: false, reason: 'Trial period expired or not active' };
  }

  // Check call duration (must be ≤ 1 minute)
  const callDurationMinutes = callDurationSeconds / 60;
  if (callDurationMinutes > TRIAL_CONFIG.MAX_CALL_MINUTES) {
    return {
      eligible: false,
      reason: `Call duration (${callDurationMinutes.toFixed(1)} min) exceeds trial limit (${TRIAL_CONFIG.MAX_CALL_MINUTES} min)`,
    };
  }

  // Check trial usage
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return { eligible: false, reason: 'User not found' };
  }

  const userData = userSnap.data() as FirestoreUser;
  const trialMinutesUsed =
    userData.metadata?.callTrialMinutesUsed || 0;
  const callMinutes = callDurationSeconds / 60;

  // Check if adding this call would exceed trial limits
  // (For now, we allow unlimited calls during trial, but each must be ≤ 1 min)
  // You can add total trial minutes limit here if needed

  return { eligible: true };
}

/**
 * Record trial call usage
 */
export async function recordTrialCallUsage(
  userId: string,
  callDurationSeconds: number
): Promise<void> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User not found');
  }

  const userData = userSnap.data() as FirestoreUser;
  const callMinutes = callDurationSeconds / 60;
  const currentMinutesUsed = userData.metadata?.callTrialMinutesUsed || 0;
  const currentCallsUsed = userData.metadata?.callTrialCallsUsed || 0;

  await updateDoc(userRef, {
    updatedAt: serverTimestamp(),
    metadata: {
      ...userData.metadata,
      callTrialMinutesUsed: currentMinutesUsed + callMinutes,
      callTrialCallsUsed: currentCallsUsed + 1,
    },
  });
}

/**
 * Initialize trial for user (call when user signs up or upgrades)
 */
export async function initializeTrial(userId: string): Promise<void> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User not found');
  }

  const userData = userSnap.data() as FirestoreUser;

  // Don't initialize if already has trial or is subscribed
  if (userData.trialStartDate || userData.tier === 'litplus') {
    return;
  }

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_CONFIG.DURATION_DAYS);

  await updateDoc(userRef, {
    trialStartDate: Timestamp.fromDate(now),
    trialEndDate: Timestamp.fromDate(trialEnd),
    trialUsed: false,
    updatedAt: serverTimestamp(),
    metadata: {
      ...userData.metadata,
      callTrialMinutesUsed: 0,
      callTrialCallsUsed: 0,
    },
  });
}

/**
 * Check if trial has expired and prompt upgrade
 */
export async function checkTrialExpiration(userId: string): Promise<{
  expired: boolean;
  shouldPromptUpgrade: boolean;
}> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return { expired: false, shouldPromptUpgrade: false };
  }

  const userData = userSnap.data() as FirestoreUser;

  // If already subscribed, no need to prompt
  if (userData.tier === 'litplus') {
    return { expired: false, shouldPromptUpgrade: false };
  }

  // Check if trial exists
  if (!userData.trialEndDate) {
    return { expired: false, shouldPromptUpgrade: false };
  }

  const now = new Date();
  const trialEnd = userData.trialEndDate.toDate();
  const expired = now >= trialEnd;

  return {
    expired,
    shouldPromptUpgrade: expired,
  };
}

