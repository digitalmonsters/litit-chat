/**
 * Realtime Messages Hook
 * 
 * Provides real-time Firestore listeners for chat messages
 * Triggers push notifications for background/offline users
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
import type { FirestoreMessage } from './firestore-collections';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/contexts/PresenceContext';

export interface UseRealtimeMessagesOptions {
  chatId: string;
  limitCount?: number;
  enablePushNotifications?: boolean;
}

/**
 * Hook to listen to messages in a chat with real-time updates
 * Triggers push notifications for new messages when user is offline/background
 */
export function useRealtimeMessages(options: UseRealtimeMessagesOptions) {
  const {
    chatId,
    limitCount = 50,
    enablePushNotifications = true,
  } = options;

  const { user } = useAuth();
  const { isOnline } = usePresence();
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isPageVisibleRef = useRef(true);

  // Track page visibility for push notification logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Send push notification for new message
  const sendPushNotification = useCallback(async (message: FirestoreMessage) => {
    if (!enablePushNotifications || !user) return;
    
    // Only send notification if:
    // 1. Message is not from current user
    // 2. User is offline or page is not visible
    if (message.senderId === user.uid) return;
    if (isOnline && isPageVisibleRef.current) return;

    try {
      // Get recipient user's FCM token from Firestore
      const db = getFirestoreInstance();
      const { doc, getDoc } = await import('firebase/firestore');
      const recipientRef = doc(db, COLLECTIONS.USERS, user.uid);
      const recipientSnap = await getDoc(recipientRef);

      if (!recipientSnap.exists()) return;

      const recipientData = recipientSnap.data();
      const fcmToken = recipientData?.fcmToken;

      if (!fcmToken) {
        console.log('No FCM token for user, skipping push notification');
        return;
      }

      // Get sender info for notification
      const senderRef = doc(db, COLLECTIONS.USERS, message.senderId);
      const senderSnap = await getDoc(senderRef);
      const senderName = senderSnap.exists() 
        ? senderSnap.data()?.displayName || 'Someone'
        : 'Someone';

      // Send push notification via API
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          title: senderName,
          bodyText: message.content || 'New message',
        }),
      });

      if (!response.ok) {
        console.error('Failed to send push notification:', await response.text());
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }, [enablePushNotifications, user, isOnline]);

  // Real-time listener for messages
  useEffect(() => {
    if (!chatId || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getFirestoreInstance();
    const messagesRef = collection(
      db,
      `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`
    );

    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData: FirestoreMessage[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || data.timestamp || Timestamp.now(),
          } as FirestoreMessage);
        });

        // Reverse to show oldest first
        messagesData.reverse();

        // Check for new messages and trigger push notifications
        if (messagesData.length > 0 && lastMessageIdRef.current) {
          const newMessages = messagesData.filter(
            (msg) => msg.id !== lastMessageIdRef.current && msg.timestamp
          );

          // Send push notifications for new messages
          newMessages.forEach((message) => {
            sendPushNotification(message);
          });
        }

        // Update last message ID
        if (messagesData.length > 0) {
          lastMessageIdRef.current = messagesData[messagesData.length - 1]?.id || null;
        }

        setMessages(messagesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error listening to messages:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, user, limitCount, sendPushNotification]);

  return { messages, loading, error };
}

