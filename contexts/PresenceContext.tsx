'use client';

/**
 * Presence Context
 * 
 * Tracks user online/offline status and lastSeen
 * Maintains real-time presence updates via Firestore
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import type { FirestoreUser } from '@/lib/firestore-collections';

interface PresenceContextType {
  isOnline: boolean;
  lastSeen: Date | null;
  updatePresence: () => Promise<void>;
  setStatus: (status: 'online' | 'offline' | 'away' | 'busy') => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [presenceUnsubscribe, setPresenceUnsubscribe] = useState<Unsubscribe | null>(null);

  // Update presence status in Firestore
  const updatePresence = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);

      await updateDoc(userRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user?.uid]);

  // Set custom status
  const setStatus = useCallback(async (status: 'online' | 'offline' | 'away' | 'busy') => {
    if (!user?.uid) return;

    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);

      await updateDoc(userRef, {
        status,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting status:', error);
    }
  }, [user?.uid]);

  // Listen to current user's presence data
  useEffect(() => {
    if (!user?.uid) {
      setIsOnline(false);
      setLastSeen(null);
      return;
    }

    const db = getFirestoreInstance();
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data() as FirestoreUser;
          setIsOnline(userData.status === 'online');
          
          if (userData.lastSeen) {
            const lastSeenDate = userData.lastSeen.toDate ? userData.lastSeen.toDate() : new Date(userData.lastSeen);
            setLastSeen(lastSeenDate);
          }
        }
      },
      (error) => {
        console.error('Error listening to presence:', error);
      }
    );

    setPresenceUnsubscribe(() => unsubscribe);
    return () => unsubscribe();
  }, [user?.uid]);

  // Set online status on mount and update periodically
  useEffect(() => {
    if (!user?.uid) return;

    const userId = user.uid; // Capture uid for cleanup

    // Set online immediately
    updatePresence();

    // Update presence every 30 seconds
    const interval = setInterval(() => {
      updatePresence();
    }, 30000);

    // Set offline when leaving
    const handleBeforeUnload = () => {
      setStatus('offline');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStatus('away');
      } else {
        updatePresence();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Set offline on cleanup
      setStatus('offline').catch(console.error);
    };
  }, [user?.uid, updatePresence, setStatus]);

  return (
    <PresenceContext.Provider
      value={{
        isOnline,
        lastSeen,
        updatePresence,
        setStatus,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}

