'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';
import { formatTime } from '@/lib/utils';
import Avatar from './Avatar';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  className,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-2 px-4 py-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {showAvatar && !isOwn && (
        <Avatar
          src={message.senderAvatar}
          name={message.senderName}
          size="sm"
          className="flex-shrink-0"
        />
      )}
      <div
        className={cn(
          'flex flex-col gap-1',
          isOwn ? 'items-end' : 'items-start',
          showAvatar && !isOwn ? 'max-w-[70%]' : 'max-w-[80%]'
        )}
      >
        {!isOwn && (
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {message.senderName}
          </span>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2 shadow-sm',
            isOwn
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
          )}
        >
          <p className="break-words text-sm leading-relaxed">{message.content}</p>
          {message.isEdited && (
            <span className="ml-2 text-xs opacity-70">(edited)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showTimestamp && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatTime(message.timestamp)}
            </span>
          )}
          {isOwn && message.status && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {message.status === 'sending' && 'Sending...'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
              {message.status === 'failed' && '✗'}
            </span>
          )}
        </div>
      </div>
      {showAvatar && isOwn && <div className="h-8 w-8 flex-shrink-0" />}
    </div>
  );
}





