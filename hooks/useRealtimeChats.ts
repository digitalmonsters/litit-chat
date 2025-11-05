'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
}

export interface RealtimeChat {
  id: string;
  participants: ChatParticipant[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'video';
  };
  unreadCount: number;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface UseRealtimeChatsOptions {
  userId: string;
  enabled?: boolean;
}

export interface UseRealtimeChatsResult {
  chats: RealtimeChat[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for real-time Firestore chat list listening
 * Automatically subscribes to user's chats and updates in real-time
 */
export function useRealtimeChats({
  userId,
  enabled = true,
}: UseRealtimeChatsOptions): UseRealtimeChatsResult {
  const [chats, setChats] = useState<RealtimeChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      setLoading(false);
      return;
    }

    const db = getFirestoreInstance();
    const chatsRef = collection(db, COLLECTIONS.CHATS);

    // Query for chats where user is a participant
    const q = query(
      chatsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatsData: RealtimeChat[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          chatsData.push({
            id: doc.id,
            participants: data.participants || [],
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount?.[userId] || 0,
            updatedAt: data.updatedAt || Timestamp.now(),
            createdAt: data.createdAt || Timestamp.now(),
          });
        });

        setChats(chatsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error listening to chats:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, enabled]);

  return {
    chats,
    loading,
    error,
  };
}
