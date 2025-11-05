'use client';

/**
 * Discover Feed Component
 * 
 * Shows users in grid/carousel format with tabs
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecentUsers, getOnlineUsers, getPopularUsers } from '@/lib/users';
import UserCard from './UserCard';
import ProfileModal from './ProfileModal';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { flameFadeIn } from '@/lib/flame-transitions';
import { cn } from '@/lib/utils';

type TabType = 'recent' | 'online' | 'popular';

const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'recent', label: 'Who Just Joined' },
  { id: 'online', label: "Who's Online" },
  { id: 'popular', label: 'Popular' },
];

export default function DiscoverFeed() {
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch users based on active tab
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let fetchedUsers: FirestoreUser[] = [];
        
        switch (activeTab) {
          case 'recent':
            fetchedUsers = await getRecentUsers(20);
            break;
          case 'online':
            fetchedUsers = await getOnlineUsers(20);
            break;
          case 'popular':
            fetchedUsers = await getPopularUsers(20);
            break;
        }
        
        setUsers(fetchedUsers);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [activeTab]);

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
          <div className="flex items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={flameFadeIn}
            className="text-center py-12"
          >
            <p className="text-gray-400">No users found</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'grid gap-4',
                // Mobile: 1 column (vertical swipe)
                'grid-cols-1',
                // Tablet: 2 columns
                'md:grid-cols-2',
                // Desktop: 3 columns
                'lg:grid-cols-3',
                // Large desktop: 4 columns
                'xl:grid-cols-4'
              )}
            >
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => handleUserClick(user)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
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
