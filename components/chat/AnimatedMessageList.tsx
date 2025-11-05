'use client';

/**
 * Animated Message List Component
 * 
 * Message list with Framer Motion animations for send/receive
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import MessageBubble from './MessageBubble';
import { flameStagger, flameStaggerItem } from '@/lib/flame-transitions';

export interface AnimatedMessageListProps {
  messages: FirestoreMessage[];
  currentUserId: string;
  onUnlock?: (message: FirestoreMessage) => void;
  className?: string;
  showAvatars?: boolean;
  showTimestamps?: boolean;
}

/**
 * Enhanced message list with Framer Motion animations
 * - Stagger animation on initial load
 * - Slide-in animation for new messages
 * - Auto-scroll to bottom on new message
 */
export default function AnimatedMessageList({
  messages,
  currentUserId,
  onUnlock,
  className,
  showAvatars = true,
  showTimestamps = true,
}: AnimatedMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    // Only scroll if we have new messages
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom on mount
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  return (
    <div
      ref={messagesContainerRef}
      className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden',
        'scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent',
        className
      )}
    >
      <motion.div
        variants={flameStagger}
        initial="initial"
        animate="animate"
        className="flex flex-col space-y-2 p-4"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

            return (
              <motion.div
                key={message.id}
                variants={flameStaggerItem}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, y: -20 }}
                layout
                layoutId={message.id}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  },
                }}
              >
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar && showAvatars}
                  showTimestamp={showTimestamps}
                  onUnlock={onUnlock}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Invisible element for scroll anchor */}
        <div ref={messagesEndRef} className="h-0" />
      </motion.div>
    </div>
  );
}
