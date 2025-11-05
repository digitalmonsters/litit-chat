'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { flameStagger, flameStaggerItem, messageSendSpring } from '@/lib/flame-transitions';

export interface MessageListProps {
  messages: FirestoreMessage[];
  currentUserId: string;
  isTyping?: boolean;
  typingUser?: string;
  className?: string;
}

export default function MessageList({
  messages,
  currentUserId,
  isTyping = false,
  typingUser,
  className,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center',
          className
        )}
      >
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-y-auto',
        className
      )}
    >
      <motion.div
        className="flex-1 space-y-1 p-4"
        variants={flameStagger}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar =
              !isOwn &&
              (!prevMessage || prevMessage.senderId !== message.senderId);

            return (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  mass: 0.5,
                }}
              >
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTimestamp={
                    index === messages.length - 1 ||
                    (messages[index + 1]?.timestamp?.toMillis &&
                      message.timestamp?.toMillis &&
                      (messages[index + 1].timestamp?.toMillis() ?? 0) -
                        (message.timestamp?.toMillis() ?? 0) >
                        300000)
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isTyping && <TypingIndicator userName={typingUser} />}
        <div ref={messagesEndRef} />
      </motion.div>
    </div>
  );
}






