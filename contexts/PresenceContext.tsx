'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPresence {
  id: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Timestamp | null;
  isTyping?: boolean;
  currentChat?: string;
}

interface PresenceContextType {
  presenceMap: Map<string, UserPresence>;
  setUserStatus: (status: UserPresence['status']) => Promise<void>;
  setTypingStatus: (chatId: string, isTyping: boolean) => Promise<void>;
  getUserPresence: (userId: string) => UserPresence | undefined;
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());

  // Listen to all users' presence
  useEffect(() => {
    if (!user) return;

    const db = getFirestoreInstance();
    const usersRef = collection(db, COLLECTIONS.USERS);

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const newPresenceMap = new Map<string, UserPresence>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.presence) {
          newPresenceMap.set(doc.id, {
            id: doc.id,
            status: data.presence.status || 'offline',
            lastSeen: data.presence.lastSeen || null,
            isTyping: data.presence.isTyping || false,
            currentChat: data.presence.currentChat || '',
          });
        }
      });

      setPresenceMap(newPresenceMap);
    });

    return () => unsubscribe();
  }, [user]);

  // Update current user's presence on mount and activity
  useEffect(() => {
    if (!user) return;

    const updatePresence = async (status: UserPresence['status']) => {
      try {
        const db = getFirestoreInstance();
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);

        await updateDoc(userRef, {
          'presence.status': status,
          'presence.lastSeen': serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Set online on mount
    updatePresence('online');

    // Set offline on unmount
    return () => {
      updatePresence('offline');
    };
  }, [user]);

  // Handle visibility change
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      const status = document.hidden ? 'away' : 'online';
      await setUserStatus(status);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Set user status
  const setUserStatus = async (status: UserPresence['status']) => {
    if (!user) return;

    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);

      await updateDoc(userRef, {
        'presence.status': status,
        'presence.lastSeen': serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting user status:', error);
    }
  };

  // Set typing status
  const setTypingStatus = async (chatId: string, isTyping: boolean) => {
    if (!user) return;

    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);

      await updateDoc(userRef, {
        'presence.isTyping': isTyping,
        'presence.currentChat': isTyping ? chatId : '',
        'presence.lastSeen': serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  };

  // Get user presence
  const getUserPresence = (userId: string): UserPresence | undefined => {
    return presenceMap.get(userId);
  };

  // Check if user is online
  const isUserOnline = (userId: string): boolean => {
    const presence = presenceMap.get(userId);
    return presence?.status === 'online';
  };

  return (
    <PresenceContext.Provider
      value={{
        presenceMap,
        setUserStatus,
        setTypingStatus,
        getUserPresence,
        isUserOnline,
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
