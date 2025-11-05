'use client';

/**
 * Swipeable Card Stack Component
 * 
 * Mobile-friendly swipeable cards for Discover Feed
 */

import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import UserCard from './UserCard';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { cn } from '@/lib/utils';

export interface SwipeableCardStackProps {
  users: FirestoreUser[];
  onCardClick: (user: FirestoreUser) => void;
  onSwipeAway?: (user: FirestoreUser) => void;
  className?: string;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

export default function SwipeableCardStack({
  users,
  onCardClick,
  onSwipeAway,
  className,
}: SwipeableCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const currentUser = users[currentIndex];
  const nextUser = users[currentIndex + 1];

  if (!currentUser) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-gray-400">No more users</p>
      </div>
    );
  }

  const handleSwipe = (info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeDistance = Math.abs(offset.x);
    const swipeVelocity = Math.abs(velocity.x);

    if (swipeDistance > SWIPE_THRESHOLD || swipeVelocity > SWIPE_VELOCITY_THRESHOLD) {
      const direction = offset.x > 0 ? 'right' : 'left';
      setDirection(direction);
      
      if (onSwipeAway) {
        onSwipeAway(currentUser);
      }

      // Move to next card
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setDirection(null);
      }, 300);
    }
  };

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Next card (preview) */}
      {nextUser && (
        <motion.div
          className="absolute inset-0 scale-95 opacity-50"
          style={{ zIndex: 0 }}
        >
          <UserCard user={nextUser} />
        </motion.div>
      )}

      {/* Current card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => handleSwipe(info)}
        animate={{
          x: direction === 'left' ? -1000 : direction === 'right' ? 1000 : 0,
          opacity: direction ? 0 : 1,
          rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{ zIndex: 1 }}
        className="cursor-grab active:cursor-grabbing"
      >
        <UserCard
          user={currentUser}
          onClick={() => onCardClick(currentUser)}
        />
      </motion.div>

      {/* Swipe indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {users.slice(0, Math.min(5, users.length)).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-1 rounded-full transition-all',
              index === currentIndex
                ? 'w-6 bg-[#FF5E3A]'
                : 'w-1 bg-gray-600'
            )}
          />
        ))}
      </div>
    </div>
  );
}

