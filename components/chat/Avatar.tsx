'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { userJoinSpring, userLeaveSpring } from '@/lib/flame-transitions';
import { getOptimizedImageSrc } from '@/lib/image-utils';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const statusSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-zinc-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarContent = src ? (
    <div className="relative h-full w-full">
      <Image
        src={getOptimizedImageSrc(src, { width: 128, height: 128 })}
        alt={alt || name || 'Avatar'}
        fill
        className="rounded-full object-cover"
        unoptimized={src.includes('bunnycdn.com') || src.includes('bunny.net')}
      />
    </div>
  ) : (
    <span className="flex h-full w-full items-center justify-center font-semibold text-white">
      {name ? getInitials(name) : '?'}
    </span>
  );

  return (
    <motion.div
      className={cn('relative inline-block', className)}
      variants={userJoinSpring}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57]',
          sizes[size]
        )}
      >
        {avatarContent}
      </div>
      {status && (
        <motion.span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-[#1E1E1E]',
            statusSizes[size],
            statusColors[status]
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  );
}

