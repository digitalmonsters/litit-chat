'use client';

/**
 * Message Bubble Component
 * 
 * Displays message with support for locked media
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import LockedMessage from './LockedMessage';
import { flameFadeIn } from '@/lib/flame-transitions';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageBubbleProps {
  message: FirestoreMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onUnlock?: (message: FirestoreMessage) => void;
  className?: string;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  onUnlock,
  className,
}: MessageBubbleProps) {
  const { user } = useAuth();
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Check if message is locked and user hasn't unlocked it
  const isLocked = message.isLocked && !isOwn;
  const unlockedBy = message.unlockedBy;
  const isUnlocked = user && unlockedBy
    ? (Array.isArray(unlockedBy)
        ? unlockedBy.includes(user.uid)
        : typeof unlockedBy === 'object' && user.uid in unlockedBy)
    : false;
  const shouldShowLocked = isLocked && !isUnlocked;

  // Handle locked messages that haven't been unlocked
  if (shouldShowLocked) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={flameFadeIn}
        className={cn('flex', isOwn ? 'justify-end' : 'justify-start', className)}
      >
        <div className={cn('max-w-[80%]', isOwn ? 'md:max-w-[60%]' : 'md:max-w-[70%]')}>
          <LockedMessage
            message={message}
            onUnlock={() => onUnlock?.(message)}
          />
          {showTimestamp && (
            <p className="text-xs text-gray-500 mt-1 ml-2">
              {formatTime(message.timestamp)}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn(
        'flex items-end gap-2 px-4 py-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName ?? 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {message.senderName?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-1',
          isOwn ? 'items-end' : 'items-start',
          showAvatar && !isOwn ? 'max-w-[70%]' : 'max-w-[80%]'
        )}
      >
        {!isOwn && (
          <span className="text-xs font-medium text-gray-400">
            {message.senderName ?? 'Unknown'}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2 shadow-sm',
            isOwn
              ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white'
              : 'bg-gray-800 text-white'
          )}
        >
          {/* Text content */}
          {message.content && (
            <p className="break-words text-sm leading-relaxed">{message.content}</p>
          )}

          {/* Image attachment */}
          {message.attachments?.some((att) => att.type.startsWith('image/')) && (
            <div className="mt-2 space-y-2">
              {message.attachments
                .filter((att) => att.type.startsWith('image/'))
                .map((att, idx) => (
                  <img
                    key={idx}
                    src={att.url}
                    alt={att.name}
                    className="max-w-full rounded-lg"
                  />
                ))}
            </div>
          )}

          {/* Video attachment */}
          {message.attachments?.some((att) => att.type.startsWith('video/')) && (
            <div className="mt-2 space-y-2">
              {message.attachments
                .filter((att) => att.type.startsWith('video/'))
                .map((att, idx) => (
                  <video
                    key={idx}
                    src={att.url}
                    controls
                    className="max-w-full rounded-lg"
                  />
                ))}
            </div>
          )}

          {/* Audio attachment */}
          {message.attachments?.some((att) => att.type.startsWith('audio/')) && (
            <div className="mt-2 space-y-2">
              {message.attachments
                .filter((att) => att.type.startsWith('audio/'))
                .map((att, idx) => (
                  <audio key={idx} src={att.url} controls className="w-full" />
                ))}
            </div>
          )}

          {/* File attachment */}
          {message.attachments?.some(
            (att) =>
              !att.type.startsWith('image/') &&
              !att.type.startsWith('video/') &&
              !att.type.startsWith('audio/')
          ) && (
            <div className="mt-2 space-y-2">
              {message.attachments
                .filter(
                  (att) =>
                    !att.type.startsWith('image/') &&
                    !att.type.startsWith('video/') &&
                    !att.type.startsWith('audio/')
                )
                .map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    download={att.name}
                    className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{att.name}</span>
                  </a>
                ))}
            </div>
          )}

          {/* Edited indicator */}
          {message.isEdited && (
            <span className="ml-2 text-xs opacity-70">(edited)</span>
          )}
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center gap-2">
          {showTimestamp && (
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          )}
          {isOwn && message.status && (
            <span className="text-xs text-gray-500">
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
              {message.status === 'failed' && '✗'}
            </span>
          )}
        </div>
      </div>

      {/* Spacer for own messages */}
      {showAvatar && isOwn && <div className="h-8 w-8 flex-shrink-0" />}
    </motion.div>
  );
}
