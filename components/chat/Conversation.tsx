'use client';

/**
 * Conversation Component
 * 
 * Real-time Firestore listener for messages in a chat
 */

import React, { useEffect, useState, useRef } from 'react';
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
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import UnlockModal from './UnlockModal';
import { flameStagger, flameStaggerItem } from '@/lib/flame-transitions';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import { cn } from '@/lib/utils';

export interface ConversationProps {
  chatId: string;
  className?: string;
}

const MESSAGES_PER_PAGE = 50;

export default function Conversation({ chatId, className }: ConversationProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<FirestoreMessage | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || data.timestamp || serverTimestamp(),
          } as FirestoreMessage);
        });

        // Reverse to show oldest first
        messagesData.reverse();
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
  }, [chatId, user]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

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

