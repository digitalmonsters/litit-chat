'use client';

/**
 * Discover Grid Component
 * 
 * Enhanced grid view with prominent distance and interests display
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserCard from './UserCard';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { cn } from '@/lib/utils';

export interface DiscoverGridProps {
  users: FirestoreUser[];
  onUserClick: (user: FirestoreUser) => void;
  loading?: boolean;
  className?: string;
}

export default function DiscoverGrid({
  users,
  onUserClick,
  loading = false,
  className,
}: DiscoverGridProps) {
  if (loading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#1E1E1E] rounded-xl border border-gray-800 overflow-hidden animate-pulse"
          >
            <div className="aspect-square bg-gray-800" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-800 rounded w-3/4" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-800 rounded-full w-16" />
                <div className="h-6 bg-gray-800 rounded-full w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">👻</div>
        <p className="text-gray-400 text-lg">No users found</p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        layout
        className={cn(
          'grid gap-4',
          'grid-cols-1',
          'md:grid-cols-2',
          'lg:grid-cols-3',
          'xl:grid-cols-3',
          className
        )}
      >
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            <UserCard user={user} onClick={() => onUserClick(user)} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
