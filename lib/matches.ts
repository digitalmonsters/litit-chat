/**
 * Match System Utilities
 * 
 * Handles likes, passes, and mutual match detection
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from './firebase';
import type { FirestoreLike, FirestoreMatch } from './firestore-collections';

// ============================================================================
// LIKE/PASS ACTIONS
// ============================================================================

/**
 * Like a user (swipe right)
 */
export async function likeUser(userId: string, targetUserId: string): Promise<{ match: boolean; matchId?: string }> {
  const db = getFirestoreInstance();
  const likeId = `${userId}_${targetUserId}`;
  
  // Create like document
  const likeRef = doc(db, COLLECTIONS.LIKES, likeId);
  await setDoc(likeRef, {
    id: likeId,
    userId,
    targetUserId,
    type: 'like',
    createdAt: Timestamp.now(),
  } as FirestoreLike);
  
  // Check if target user has liked this user (mutual match)
  const reverseLikeId = `${targetUserId}_${userId}`;
  const reverseLikeRef = doc(db, COLLECTIONS.LIKES, reverseLikeId);
  const reverseLikeSnap = await getDoc(reverseLikeRef);
  
  if (reverseLikeSnap.exists() && reverseLikeSnap.data().type === 'like') {
    // It's a match! Create match document
    const matchId = await createMatch(userId, targetUserId);
    return { match: true, matchId };
  }
  
  return { match: false };
}

/**
 * Pass on a user (swipe left)
 */
export async function passUser(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreInstance();
  const passId = `${userId}_${targetUserId}`;
  
  const passRef = doc(db, COLLECTIONS.LIKES, passId);
  await setDoc(passRef, {
    id: passId,
    userId,
    targetUserId,
    type: 'pass',
    createdAt: Timestamp.now(),
  } as FirestoreLike);
}

/**
 * Unlike a user
 */
export async function unlikeUser(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreInstance();
  const batch = writeBatch(db);
  
  // Delete like document
  const likeId = `${userId}_${targetUserId}`;
  const likeRef = doc(db, COLLECTIONS.LIKES, likeId);
  batch.delete(likeRef);
  
  // Check if there's a match and delete it
  const matchId = [userId, targetUserId].sort().join('_');
  const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
  const matchSnap = await getDoc(matchRef);
  
  if (matchSnap.exists()) {
    batch.update(matchRef, {
      status: 'unmatched',
      unmatchedAt: Timestamp.now(),
      unmatchedBy: userId,
    });
  }
  
  await batch.commit();
}

// ============================================================================
// MATCH MANAGEMENT
// ============================================================================

/**
 * Create a match between two users
 */
async function createMatch(userId1: string, userId2: string): Promise<string> {
  const db = getFirestoreInstance();
  const userIds = [userId1, userId2].sort() as [string, string];
  const matchId = userIds.join('_');
  
  const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
  await setDoc(matchRef, {
    id: matchId,
    userIds,
    status: 'active',
    createdAt: Timestamp.now(),
  } as FirestoreMatch);
  
  return matchId;
}

/**
 * Get all matches for a user
 */
export async function getUserMatches(userId: string): Promise<FirestoreMatch[]> {
  const db = getFirestoreInstance();
  const matchesRef = collection(db, COLLECTIONS.MATCHES);
  
  const q = query(
    matchesRef,
    where('userIds', 'array-contains', userId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FirestoreMatch);
}

/**
 * Check if two users are matched
 */
export async function areUsersMatched(userId1: string, userId2: string): Promise<boolean> {
  const db = getFirestoreInstance();
  const userIds = [userId1, userId2].sort();
  const matchId = userIds.join('_');
  
  const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
  const matchSnap = await getDoc(matchRef);
  
  return matchSnap.exists() && matchSnap.data().status === 'active';
}

/**
 * Unmatch two users
 */
export async function unmatchUsers(userId1: string, userId2: string, unmatchedBy: string): Promise<void> {
  const db = getFirestoreInstance();
  const userIds = [userId1, userId2].sort();
  const matchId = userIds.join('_');
  
  const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
  await setDoc(matchRef, {
    status: 'unmatched',
    unmatchedAt: Timestamp.now(),
    unmatchedBy,
  }, { merge: true });
}

// ============================================================================
// LIKE STATUS QUERIES
// ============================================================================

/**
 * Check if user has liked target
 */
export async function hasUserLiked(userId: string, targetUserId: string): Promise<boolean> {
  const db = getFirestoreInstance();
  const likeId = `${userId}_${targetUserId}`;
  const likeRef = doc(db, COLLECTIONS.LIKES, likeId);
  const likeSnap = await getDoc(likeRef);
  
  return likeSnap.exists() && likeSnap.data().type === 'like';
}

/**
 * Get users who liked the current user (for "Likes You" feature)
 */
export async function getUsersWhoLiked(userId: string, limitCount = 20): Promise<string[]> {
  const db = getFirestoreInstance();
  const likesRef = collection(db, COLLECTIONS.LIKES);
  
  const q = query(
    likesRef,
    where('targetUserId', '==', userId),
    where('type', '==', 'like'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().userId);
}

/**
 * Get liked user IDs (to filter from discover feed)
 */
export async function getLikedUserIds(userId: string): Promise<Set<string>> {
  const db = getFirestoreInstance();
  const likesRef = collection(db, COLLECTIONS.LIKES);
  
  const q = query(
    likesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const likedIds = new Set<string>();
  
  snapshot.docs.forEach(doc => {
    likedIds.add(doc.data().targetUserId);
  });
  
  return likedIds;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance string
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return 'Less than 1 mile away';
  } else if (miles < 10) {
    return `${Math.round(miles)} miles away`;
  } else {
    return `${Math.round(miles / 10) * 10}+ miles away`;
  }
}
