'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import type { FirestoreMessage } from '@/lib/firestore-collections';

export interface UseRealtimeMessagesOptions {
  chatId: string;
  limit?: number;
  enabled?: boolean;
}

export interface UseRealtimeMessagesResult {
  messages: FirestoreMessage[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
}

/**
 * Hook for real-time Firestore message listening
 * Automatically subscribes to messages in a chat and updates in real-time
 */
export function useRealtimeMessages({
  chatId,
  limit: messageLimit = 50,
  enabled = true,
}: UseRealtimeMessagesOptions): UseRealtimeMessagesResult {
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!chatId || !enabled) {
      setLoading(false);
      return;
    }

    const db = getFirestoreInstance();
    const messagesRef = collection(
      db,
      `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`
    );

    // Query for recent messages
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(messageLimit)
    );

    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData: FirestoreMessage[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            chatId: chatId,
            senderId: data.senderId || '',
            content: data.content || '',
            timestamp: data.timestamp || Timestamp.now(),
            type: data.type || 'text',
            isLocked: data.isLocked || false,
            unlockedBy: data.unlockedBy,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
            attachments: data.attachments,
          } as FirestoreMessage);
        });

        // Reverse to show oldest first
        messagesData.reverse();

        setMessages(messagesData);
        setHasMore(messagesData.length >= messageLimit);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error listening to messages:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, messageLimit, enabled]);

  return {
    messages,
    loading,
    error,
    hasMore,
  };
}
