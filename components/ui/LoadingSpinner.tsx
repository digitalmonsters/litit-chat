'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'flame';
}

export default function LoadingSpinner({
  size = 'md',
  className,
  variant = 'default',
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (variant === 'flame') {
    return (
      <motion.div
        className={cn('relative', sizes[size], className)}
        animate={{
          rotate: 360,
          filter: [
            'drop-shadow(0 0 4px rgba(255, 94, 58, 0.5))',
            'drop-shadow(0 0 8px rgba(255, 158, 87, 0.5))',
            'drop-shadow(0 0 4px rgba(255, 94, 58, 0.5))',
          ],
        }}
        transition={{
          rotate: {
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          },
          filter: {
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          },
        }}
      >
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <defs>
            <linearGradient id="flame-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5E3A" />
              <stop offset="100%" stopColor="#FF9E57" />
            </linearGradient>
          </defs>
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="url(#flame-gradient)"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="url(#flame-gradient)"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <svg
      className={cn('animate-spin text-indigo-600', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}






