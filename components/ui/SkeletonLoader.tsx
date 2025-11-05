'use client';

/**
 * Skeleton Loader Component
 * 
 * Provides shimmer effect for loading states
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  children?: React.ReactNode;
}

const shimmerAnimation = {
  background: 'linear-gradient(90deg, #1E1E1E 0%, #2A2A2A 50%, #1E1E1E 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
};

export default function SkeletonLoader({
  className,
  variant = 'rectangular',
  width,
  height,
  children,
}: SkeletonLoaderProps) {
  const baseClasses = cn(
    'relative overflow-hidden',
    variant === 'circular' && 'rounded-full',
    variant === 'rounded' && 'rounded-lg',
    variant === 'rectangular' && 'rounded',
    className
  );

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '100%',
    ...shimmerAnimation,
  };

  return (
    <motion.div
      className={baseClasses}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 94, 58, 0.1), transparent)',
          width: '50%',
        }}
      />
      {children}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </motion.div>
  );
}

/**
 * Skeleton variants for common use cases
 */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          variant="rectangular"
          height={i === lines - 1 ? 16 : 20}
          width={i === lines - 1 ? '80%' : '100%'}
          className="rounded"
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <SkeletonLoader
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <div className="flex items-center gap-4">
        <SkeletonAvatar size={48} />
        <SkeletonText lines={2} className="flex-1" />
      </div>
      <SkeletonLoader variant="rectangular" height={200} className="rounded-lg" />
      <SkeletonText lines={1} />
    </div>
  );
}

