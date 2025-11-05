'use client';

/**
 * Swipe Match Card Component
 * 
 * Tinder-style swipeable card with Like/Pass buttons
 * Includes distance, interests, and flame animations
 */

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { cn } from '@/lib/utils';
import { swipeCard, likePress } from '@/lib/flame-animations';

export interface SwipeMatchCardProps {
  user: FirestoreUser;
  onLike: (user: FirestoreUser) => void;
  onPass: (user: FirestoreUser) => void;
  onProfileClick: (user: FirestoreUser) => void;
  distance?: number; // Distance in miles
  className?: string;
}

const SWIPE_THRESHOLD = 150;

export default function SwipeMatchCard({
  user,
  onLike,
  onPass,
  onProfileClick,
  distance,
  className,
}: SwipeMatchCardProps) {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);
  
  // Like/Pass overlay opacity based on swipe
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500) {
      const direction = offset.x > 0 ? 'right' : 'left';
      setExitDirection(direction);
      
      setTimeout(() => {
        if (direction === 'right') {
          onLike(user);
        } else {
          onPass(user);
        }
      }, 300);
    } else {
      x.set(0);
    }
  };

  const handleLike = () => {
    setExitDirection('right');
    setTimeout(() => onLike(user), 300);
  };

  const handlePass = () => {
    setExitDirection('left');
    setTimeout(() => onPass(user), 300);
  };

  const isOnline = user.status === 'online' || 
    (user.lastSeen && user.lastSeen.toMillis() > Date.now() - 5 * 60 * 1000);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity }}
      animate={
        exitDirection === 'left'
          ? 'swipeLeft'
          : exitDirection === 'right'
          ? 'swipeRight'
          : 'center'
      }
      variants={swipeCard}
      className={cn(
        'absolute inset-0 cursor-grab active:cursor-grabbing',
        className
      )}
    >
      <div className="relative w-full h-full bg-[#1E1E1E] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
        {/* Main image */}
        <div className="relative w-full h-full">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center">
              <span className="text-9xl font-bold text-white/20">
                {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* PASS overlay (left swipe) */}
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute inset-0 bg-red-500/20 backdrop-blur-sm pointer-events-none"
          >
            <div className="absolute top-20 right-10 rotate-[-30deg]">
              <span className="text-8xl font-black text-red-500 border-8 border-red-500 px-8 py-4 rounded-2xl">
                PASS
              </span>
            </div>
          </motion.div>

          {/* LIKE overlay (right swipe) */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute inset-0 bg-[#FF5E3A]/20 backdrop-blur-sm pointer-events-none"
          >
            <div className="absolute top-20 left-10 rotate-[30deg]">
              <span className="text-8xl font-black text-[#FF5E3A] border-8 border-[#FF5E3A] px-8 py-4 rounded-2xl">
                LIKE
              </span>
            </div>
          </motion.div>

          {/* Online indicator */}
          {isOnline && (
            <div className="absolute top-6 left-6 px-4 py-2 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-white">Online</span>
            </div>
          )}

          {/* Tier badge */}
          {user.tier && user.tier !== 'free' && (
            <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-full">
              <span className="text-sm font-bold text-white uppercase">{user.tier}</span>
            </div>
          )}

          {/* User info at bottom */}
          <div className="absolute bottom-0 inset-x-0 p-6 pb-32">
            <button
              onClick={() => onProfileClick(user)}
              className="w-full text-left"
            >
              <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                {user.displayName}
                {user.verified && (
                  <svg className="w-8 h-8 text-[#FF5E3A]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </h2>

              {/* Distance and location */}
              {(distance !== undefined || user.location) && (
                <div className="flex items-center gap-2 text-white/90 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {distance !== undefined ? (
                    <span className="text-lg font-medium">
                      {distance < 1 ? 'Less than 1 mile away' : `${Math.round(distance)} miles away`}
                    </span>
                  ) : typeof user.location === 'string' ? (
                    <span className="text-lg font-medium">{user.location}</span>
                  ) : (
                    <span className="text-lg font-medium">{user.location?.city || user.location?.country}</span>
                  )}
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <p className="text-white/90 text-lg leading-relaxed mb-4 line-clamp-3">
                  {user.bio}
                </p>
              )}

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.interests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      className="px-4 py-2 bg-gradient-to-r from-[#FF5E3A]/20 to-[#FF9E57]/20 border border-[#FF5E3A]/40 text-white font-medium rounded-full backdrop-blur-sm"
                    >
                      {interest}
                    </span>
                  ))}
                  {user.interests.length > 5 && (
                    <span className="px-4 py-2 bg-white/10 text-white/80 font-medium rounded-full backdrop-blur-sm">
                      +{user.interests.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Action buttons at bottom */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 px-8">
          {/* Pass button */}
          <motion.button
            onClick={handlePass}
            variants={likePress}
            initial="initial"
            whileTap="tap"
            className={cn(
              'w-20 h-20 rounded-full bg-white shadow-2xl',
              'flex items-center justify-center',
              'hover:scale-110 transition-transform',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={isDragging}
          >
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          {/* Info button */}
          <motion.button
            onClick={() => onProfileClick(user)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.button>

          {/* Like button */}
          <motion.button
            onClick={handleLike}
            variants={likePress}
            initial="initial"
            whileTap="tap"
            className={cn(
              'w-20 h-20 rounded-full shadow-2xl',
              'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]',
              'flex items-center justify-center',
              'hover:scale-110 hover:shadow-[#FF5E3A]/50 transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={isDragging}
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
