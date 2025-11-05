'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

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
      <div className="flex-1 space-y-1 p-4">
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showAvatar =
            !isOwn &&
            (!prevMessage || prevMessage.senderId !== message.senderId);

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              showTimestamp={
                index === messages.length - 1 ||
                (messages[index + 1]?.timestamp?.toMillis &&
                  message.timestamp?.toMillis &&
                  messages[index + 1].timestamp.toMillis() -
                    message.timestamp.toMillis() >
                    300000)
              }
            />
          );
        })}
        {isTyping && <TypingIndicator userName={typingUser} />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}






