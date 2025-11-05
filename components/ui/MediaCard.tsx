'use client';

/**
 * Media Card Component
 * 
 * Lazy-loaded media card for Bunny CDN assets with next/image
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flameFadeScale } from '@/lib/flame-transitions';
import LoadingSpinner from './LoadingSpinner';

export interface MediaCardProps {
  src: string;
  alt?: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  locked?: boolean;
  blurred?: boolean;
  onClick?: () => void;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  priority?: boolean;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
};

/**
 * MediaCard with lazy loading for Bunny CDN
 * Supports images and videos with optional blur/lock overlay
 */
export default function MediaCard({
  src,
  alt = 'Media',
  type,
  thumbnailUrl,
  locked = false,
  blurred = false,
  onClick,
  className,
  aspectRatio = 'video',
  priority = false,
}: MediaCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const displaySrc = thumbnailUrl || src;

  return (
    <motion.div
      variants={flameFadeScale}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl bg-gray-900',
        aspectRatioClasses[aspectRatio],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Image/Thumbnail */}
      {!hasError && (
        <Image
          src={displaySrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={cn(
            'object-cover transition-all duration-300',
            isLoading && 'opacity-0 scale-95',
            !isLoading && 'opacity-100 scale-100',
            (blurred || locked) && 'blur-xl scale-110'
          )}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Loading spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <p className="text-gray-400 text-sm">Failed to load media</p>
        </div>
      )}

      {/* Video play button */}
      {type === 'video' && !locked && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </motion.div>
      )}

      {/* Locked overlay */}
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] rounded-full flex items-center justify-center"
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            <p className="text-white font-semibold">Unlock to view</p>
          </div>
        </motion.div>
      )}

      {/* Hover overlay for interactive cards */}
      {onClick && !locked && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        />
      )}
    </motion.div>
  );
}

/**
 * Media Grid
 * Grid layout for multiple media cards
 */
export function MediaGrid({
  children,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid w-full',
        `grid-cols-${columns.mobile || 2}`,
        `md:grid-cols-${columns.tablet || 3}`,
        `lg:grid-cols-${columns.desktop || 4}`,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}
