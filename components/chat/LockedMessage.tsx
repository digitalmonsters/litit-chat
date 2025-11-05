'use client';

/**
 * Locked Message Component
 * 
 * Displays blurred media with lock icon and price overlay
 * Opens UnlockModal on click
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import { flameFadeIn } from '@/lib/flame-transitions';

export interface LockedMessageProps {
  message: FirestoreMessage;
  onUnlock: () => void;
  className?: string;
}

export default function LockedMessage({
  message,
  onUnlock,
  className,
}: LockedMessageProps) {
  const attachment = message.attachments?.[0];
  const price = message.unlockPrice
    ? `$${(message.unlockPrice / 100).toFixed(2)}`
    : '$0.00';

  if (!attachment || !message.isLocked) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      onClick={onUnlock}
      className={cn(
        'relative cursor-pointer group',
        'rounded-xl overflow-hidden',
        'bg-gray-900 border-2 border-gray-700',
        'hover:border-[#FF5E3A]/50 transition-all duration-300',
        className
      )}
    >
      {/* Blurred media */}
      <div className="relative aspect-video bg-gray-800">
        {attachment.type.startsWith('image/') ? (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-full object-cover blur-md scale-110"
            draggable={false}
          />
        ) : attachment.type.startsWith('video/') ? (
          <video
            src={attachment.url}
            className="w-full h-full object-cover blur-md scale-110"
            muted
            loop
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Lock icon and price overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            {/* Lock icon with glow */}
            <div className="absolute inset-0 bg-[#FF5E3A] blur-xl opacity-50 rounded-full" />
            <svg
              className="w-16 h-16 text-[#FF5E3A] relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </motion.div>

          {/* Price badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-full"
          >
            <span className="text-white font-semibold text-lg">
              Unlock for {price}
            </span>
          </motion.div>

          {/* Tap hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-gray-300 text-sm"
          >
            Tap to unlock
          </motion.p>
        </div>

        {/* Flame burst effect on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 94, 58, 0.3) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0, 0.2, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />

        {/* Flame burst unlock animation */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          whileHover={{
            opacity: [0, 0.4, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(255, 94, 58, 0.6) 0%, rgba(255, 158, 87, 0.4) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* File info */}
      <div className="p-3 bg-gray-800/50 backdrop-blur-sm">
        <p className="text-sm text-gray-300 truncate">{attachment.name ?? 'Locked Content'}</p>
        <p className="text-xs text-gray-500">
          {attachment.size ? ((attachment.size / 1024).toFixed(1) + ' KB') : 'Size unknown'}
        </p>
      </div>
    </motion.div>
  );
}

