'use client';

/**
 * User Card Component
 * 
 * Displays user information with ghost-flame hover animation
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FirestoreUser } from '@/lib/firestore-collections';

export interface UserCardProps {
  user: FirestoreUser;
  onClick?: () => void;
  className?: string;
}

export default function UserCard({ user, onClick, className }: UserCardProps) {
  const [isOnline, setIsOnline] = React.useState(() => {
    if (user.status === 'online') return true;
    if (user.lastSeen) {
      return user.lastSeen.toMillis() > Date.now() - 5 * 60 * 1000;
    }
    return false;
  });

  React.useEffect(() => {
    if (user.status === 'online') {
      setIsOnline(true);
      return;
    }
    if (user.lastSeen) {
      setIsOnline(user.lastSeen.toMillis() > Date.now() - 5 * 60 * 1000);
    }
  }, [user.status, user.lastSeen]);

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        'relative bg-[#1E1E1E] rounded-xl overflow-hidden',
        'border border-gray-800 cursor-pointer',
        'hover:border-[#FF5E3A]/50 transition-all duration-300',
        className
      )}
      whileHover={{ 
        scale: 1.02,
        y: -4,
      }}
      whileTap={{ scale: 0.98 }}
      style={{ 
        willChange: 'transform',
        transform: 'translateZ(0)', // GPU acceleration
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Custom easing for smooth 60fps
      }}
    >
      {/* Ghost-flame hover effect with pulsing animation */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none rounded-xl"
        whileHover={{ 
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 94, 58, 0.4) 0%, rgba(255, 158, 87, 0.4) 100%)',
          willChange: 'opacity',
        }}
      />
      
      {/* Additional glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none rounded-xl"
        whileHover={{ 
          opacity: 0.15,
        }}
        style={{
          boxShadow: '0 0 40px rgba(255, 94, 58, 0.6)',
          willChange: 'opacity',
        }}
      />

      {/* Avatar */}
      <div className="relative aspect-square">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Online indicator */}
        {isOnline && (
          <motion.div
            className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1E1E1E]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}

        {/* Status badge */}
        {user.tier && user.tier !== 'free' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-full text-xs font-semibold text-white">
            {user.tier}
          </div>
        )}
      </div>

      {/* User info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-1">
          {user.displayName}
        </h3>
        
        {user.bio && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {user.bio}
          </p>
        )}

        {/* Location */}
        {user.location?.city && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{user.location.city}</span>
          </div>
        )}

        {/* Interests preview */}
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.interests.slice(0, 2).map((interest) => (
              <span
                key={interest}
                className="px-2 py-0.5 bg-gray-800 text-xs text-gray-300 rounded-full"
              >
                {interest}
              </span>
            ))}
            {user.interests.length > 2 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{user.interests.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
}
