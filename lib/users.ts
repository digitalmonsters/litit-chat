/**
 * Firestore Users Utilities
 * 
 * Functions for querying and fetching users from Firestore
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { getFirestoreInstance } from './firebase';
import { COLLECTIONS } from './firebase';
import type { FirestoreUser } from './firestore-collections';

/**
 * Get users who just joined (ordered by createdAt desc)
 */
export async function getRecentUsers(count: number = 20): Promise<FirestoreUser[]> {
  const db = getFirestoreInstance();
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  const q = query(
    usersRef,
    where('verified', '==', true),
    orderBy('createdAt', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreUser[];
}

/**
 * Get users who are online (lastSeen within 5 minutes)
 */
export async function getOnlineUsers(count: number = 20): Promise<FirestoreUser[]> {
  const db = getFirestoreInstance();
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  // Calculate 5 minutes ago
  const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
  
  const q = query(
    usersRef,
    where('verified', '==', true),
    where('lastSeen', '>=', fiveMinutesAgo),
    orderBy('lastSeen', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreUser[];
}

/**
 * Get popular users (by engagement - for now, just verified users)
 * TODO: Add actual engagement metrics (followers, messages, etc.)
 */
export async function getPopularUsers(count: number = 20): Promise<FirestoreUser[]> {
  const db = getFirestoreInstance();
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  // For now, return verified users ordered by updatedAt
  // In the future, this could be ordered by follower count, engagement, etc.
  const q = query(
    usersRef,
    where('verified', '==', true),
    orderBy('updatedAt', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreUser[];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<FirestoreUser | null> {
  const db = getFirestoreInstance();
  const { doc, getDoc } = await import('firebase/firestore');
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return {
    id: userSnap.id,
    ...userSnap.data(),
  } as FirestoreUser;
}

