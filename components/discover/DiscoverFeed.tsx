'use client';

/**
 * Discover Feed Component
 * 
 * Shows users in grid/carousel format with tabs
 * Real-time updates via Firestore listeners
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserCard from './UserCard';
import ProfileModal from './ProfileModal';
import SwipeableCardStack from './SwipeableCardStack';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { flameFadeIn, flameStagger, flameStaggerItem } from '@/lib/flame-transitions';
import { cn } from '@/lib/utils';
import { useUsersPresence } from '@/lib/realtime-users';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';

type TabType = 'recent' | 'online' | 'popular';

const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'recent', label: 'Who Just Joined' },
  { id: 'online', label: "Who's Online" },
  { id: 'popular', label: 'Popular' },
];

export default function DiscoverFeed() {
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use realtime users hook for instant updates
  const { users, loading } = useUsersPresence({
    filter: activeTab === 'online' ? 'online' : activeTab === 'recent' ? 'recent' : 'all',
    limitCount: 20,
    verifiedOnly: true,
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUserClick = (user: FirestoreUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing selected user for smooth exit animation
    setTimeout(() => {
      setSelectedUser(null);
    }, 300);
  };

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E]">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-[#1E1E1E] border-b border-gray-800">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative px-6 py-4 font-semibold text-sm transition-colors',
                'whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-[#FF5E3A]'
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <motion.div
            variants={flameStagger}
            initial="initial"
            animate="animate"
            className={cn(
              'grid gap-4',
              'md:grid-cols-2',
              'lg:grid-cols-3',
              'xl:grid-cols-3'
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                variants={flameStaggerItem}
                initial="initial"
                animate="animate"
              >
                <SkeletonCard />
              </motion.div>
            ))}
          </motion.div>
        ) : users.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={flameFadeIn}
            className="text-center py-12"
          >
            <p className="text-gray-400">No users found</p>
          </motion.div>
        ) : isMobile ? (
          // Mobile: Swipeable card stack
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 h-full"
            >
              <SwipeableCardStack
                users={users}
                onCardClick={handleUserClick}
                onSwipeAway={(user) => {
                  // eslint-disable-next-line no-console
                  console.log('Swiped away:', user.id);
                }}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          // Desktop: Grid layout (3 columns)
          <motion.div
            key={activeTab}
            variants={flameStagger}
            initial="initial"
            animate="animate"
            className={cn(
              'grid gap-4',
              // Tablet: 2 columns
              'md:grid-cols-2',
              // Desktop: 3 columns (as requested)
              'lg:grid-cols-3',
              // Large desktop: keep 3 columns
              'xl:grid-cols-3'
            )}
            style={{ willChange: 'transform, opacity' }}
          >
            <AnimatePresence mode="popLayout">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  layout
                  variants={flameStaggerItem}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <UserCard
                    user={user}
                    onClick={() => handleUserClick(user)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFollow={(userId) => {
          // eslint-disable-next-line no-console
          console.log('Follow user:', userId);
        }}
        onMessage={(userId) => {
          // eslint-disable-next-line no-console
          console.log('Message user:', userId);
        }}
        onTip={(userId) => {
          // eslint-disable-next-line no-console
          console.log('Tip user:', userId);
        }}
      />
    </div>
  );
}
