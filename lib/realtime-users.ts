/**
 * Realtime Users Hook
 * 
 * Provides real-time Firestore listeners for users presence feed
 */

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from './firebase';
import type { FirestoreUser } from './firestore-collections';

export interface UseUsersPresenceOptions {
  filter?: 'all' | 'online' | 'recent';
  limitCount?: number;
  verifiedOnly?: boolean;
}

/**
 * Hook to listen to users collection with real-time updates
 */
export function useUsersPresence(options: UseUsersPresenceOptions = {}) {
  const {
    filter = 'all',
    limitCount = 50,
    verifiedOnly = true,
  } = options;

  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const db = getFirestoreInstance();
    const usersRef = collection(db, COLLECTIONS.USERS);

    let q;

    if (filter === 'online') {
      // Online users (lastSeen within 5 minutes)
      const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
      const conditions: any[] = [];
      
      if (verifiedOnly) {
        conditions.push(where('verified', '==', true));
      }
      
      conditions.push(
        where('lastSeen', '>=', fiveMinutesAgo),
        orderBy('lastSeen', 'desc'),
        limit(limitCount)
      );
      q = query(usersRef, ...conditions);
    } else if (filter === 'recent') {
      // Recently joined users
      const conditions: any[] = [];
      
      if (verifiedOnly) {
        conditions.push(where('verified', '==', true));
      }
      
      conditions.push(
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      q = query(usersRef, ...conditions);
    } else {
      // All users
      const conditions: any[] = [];
      
      if (verifiedOnly) {
        conditions.push(where('verified', '==', true));
      }
      
      conditions.push(orderBy('updatedAt', 'desc'), limit(limitCount));
      q = query(usersRef, ...conditions);
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData: FirestoreUser[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreUser[];

        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error listening to users:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filter, limitCount, verifiedOnly]);

  return { users, loading, error };
}

