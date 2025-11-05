'use client';

/**
 * Typing Indicator Component
 * 
 * Shows animated typing indicator
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export default function TypingIndicator({ userName, className }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn('flex items-center gap-2 px-4 py-2', className)}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      {userName && (
        <span className="text-sm text-gray-400">{userName} is typing...</span>
      )}
    </motion.div>
  );
}
