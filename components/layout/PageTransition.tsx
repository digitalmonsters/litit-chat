'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { flameTransition } from '@/lib/flame-transitions';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page Transition Wrapper
 * 
 * Provides flame-themed transitions for route changes
 */
export default function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  return (
    <motion.div
      {...flameTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

