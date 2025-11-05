'use client';

/**
 * Conversation Component
 * 
 * Real-time Firestore listener for messages in a chat
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  startAfter,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/contexts/PresenceContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import UnlockModal from './UnlockModal';
import { flameStagger, flameStaggerItem } from '@/lib/flame-transitions';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { useSocket, useChatSocket, markMessagesAsRead } from '@/lib/socket';

export interface ConversationProps {
  chatId: string;
  className?: string;
}

const MESSAGES_PER_PAGE = 50;

export default function Conversation({ chatId, className }: ConversationProps) {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<FirestoreMessage | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isPageVisibleRef = useRef(true);
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  const { socket, isConnected } = useSocket({
    userId: user?.uid || '',
    userName: user?.displayName || undefined,
    autoConnect: !!user?.uid,
  });

  // Track page visibility for push notification logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send push notification for new message
  const sendPushNotification = useCallback(async (message: FirestoreMessage) => {
    if (!user || message.senderId === user.uid) return;
    
    // Only send notification if user is offline or page is not visible
    if (isOnline && isPageVisibleRef.current) return;

    try {
      const db = getFirestoreInstance();
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
  }, [user, isOnline]);

  // Real-time listener for messages
  useEffect(() => {
    if (!chatId || !user) return;

    const db = getFirestoreInstance();
    const messagesRef = collection(
      db,
      `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`
    );

    // Query for recent messages
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData: FirestoreMessage[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          messagesData.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt || data.timestamp || serverTimestamp(),
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

        // Check if there are more messages
        setHasMore(snapshot.size === MESSAGES_PER_PAGE);

        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, user, isOnline, sendPushNotification]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Setup chat socket events (typing indicators, read receipts)
  useChatSocket(
    socket,
    chatId,
    {
      onTyping: (users) => {
        setTypingUsers((prev) => {
          // Merge new typing users, avoiding duplicates
          const newUsers = users.filter(
            (u) => !prev.some((p) => p.userId === u.userId)
          );
          return [...prev, ...newUsers];
        });
      },
      onStoppedTyping: (userId) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      },
      onMessageRead: (data) => {
        // Update message read status in local state
        setMessages((prev) =>
          prev.map((msg) => {
            if (data.messageIds.includes(msg.id)) {
              return {
                ...msg,
                readBy: {
                  ...(typeof msg.readBy === 'object' && !Array.isArray(msg.readBy)
                    ? msg.readBy
                    : {}),
                  [data.readBy]: new Date(data.timestamp),
                },
                status: 'read' as const,
              };
            }
            return msg;
          })
        );
      },
    }
  );

  // Mark messages as read when they're viewed
  useEffect(() => {
    if (!socket || !isConnected || !user || messages.length === 0) return;

    // Clear any existing timeout
    if (readTimeoutRef.current) {
      clearTimeout(readTimeoutRef.current);
    }

    // Get unread messages (messages not sent by current user and not read by current user)
    const unreadMessages = messages.filter((msg) => {
      if (msg.senderId === user.uid) return false; // Skip own messages
      
      const readBy = msg.readBy;
      if (!readBy) return true;
      
      if (Array.isArray(readBy)) {
        return !readBy.includes(user.uid);
      }
      
      if (typeof readBy === 'object') {
        return !(user.uid in readBy);
      }
      
      return true;
    });

    if (unreadMessages.length > 0) {
      // Mark messages as read after a short delay (user is viewing them)
      readTimeoutRef.current = setTimeout(() => {
        const messageIds = unreadMessages.map((msg) => msg.id);
        markMessagesAsRead(socket, chatId, messageIds);
      }, 1000);
    }

    return () => {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
    };
  }, [socket, isConnected, user, messages, chatId]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!hasMore || messages.length === 0) return;

    const db = getFirestoreInstance();
    const messagesRef = collection(
      db,
      `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`
    );

    const lastMessage = messages[0];
    const lastTimestamp = lastMessage.timestamp;

    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      startAfter(lastTimestamp),
      limit(MESSAGES_PER_PAGE)
    );

    const snapshot = await getDocs(q);
    const newMessages: FirestoreMessage[] = [];

    snapshot.forEach((doc) => {
      newMessages.push({
        id: doc.id,
        ...doc.data(),
      } as FirestoreMessage);
    });

    if (newMessages.length > 0) {
      newMessages.reverse();
      setMessages((prev) => [...newMessages, ...prev]);
      setHasMore(snapshot.size === MESSAGES_PER_PAGE);
    } else {
      setHasMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMoreMessages}
              className="text-sm text-[#FF5E3A] hover:text-[#FF9E57] transition-colors"
            >
              Load older messages
            </button>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial="hidden"
              animate="visible"
              variants={flameStaggerItem}
              layout
            >
              <MessageBubble
                message={message}
                isOwn={message.senderId === user?.uid}
                onUnlock={(msg) => {
                  // Only show unlock modal if message is locked and not already unlocked
                  const unlockedBy = msg.unlockedBy;
                  const isUnlocked = user && unlockedBy 
                    ? (Array.isArray(unlockedBy) 
                        ? unlockedBy.includes(user.uid)
                        : typeof unlockedBy === 'object' && user.uid in unlockedBy)
                    : false;
                  if (msg.isLocked && !isUnlocked && msg.unlockPrice) {
                    setSelectedMessage(msg);
                    setIsUnlockModalOpen(true);
                  }
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-800">
        <MessageInput chatId={chatId} />
      </div>

      {/* Unlock Modal */}
      {selectedMessage && (
        <UnlockModal
          isOpen={isUnlockModalOpen}
          onClose={() => {
            setIsUnlockModalOpen(false);
            setTimeout(() => setSelectedMessage(null), 300);
          }}
          messageId={selectedMessage.id}
          chatId={chatId}
          unlockPrice={selectedMessage.unlockPrice || 0}
          currency={selectedMessage.unlockCurrency || 'USD'}
          onUnlockSuccess={() => {
            // Message will be unlocked via webhook or direct update
            // Refresh will happen automatically via real-time listener
            setIsUnlockModalOpen(false);
            setSelectedMessage(null);
          }}
        />
      )}
    </div>
  );
}

