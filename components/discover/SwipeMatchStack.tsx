'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeMatchCard from './SwipeMatchCard';
import MatchModal from './MatchModal';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { likeUser, passUser } from '@/lib/matches';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SwipeMatchStackProps {
  users: FirestoreUser[];
  onCardsExhausted?: () => void;
  className?: string;
}

const MAX_VISIBLE_CARDS = 3;

export default function SwipeMatchStack({
  users,
  onCardsExhausted,
  className,
}: SwipeMatchStackProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<FirestoreUser | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const visibleUsers = users.slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS);
  const hasMoreCards = currentIndex < users.length;

  useEffect(() => {
    if (!hasMoreCards && onCardsExhausted) {
      onCardsExhausted();
    }
  }, [hasMoreCards, onCardsExhausted]);

  const handleLike = async (user: FirestoreUser) => {
    if (!currentUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await likeUser(currentUser.uid, user.id);
      
      if (result.match) {
        setMatchedUser(user);
        setIsMatchModalOpen(true);
      }
      
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error('Error liking user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePass = async (user: FirestoreUser) => {
    if (!currentUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await passUser(currentUser.uid, user.id);
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error('Error passing user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProfileClick = (user: FirestoreUser) => {
    router.push(`/profile/${user.id}`);
  };

  const handleMessage = () => {
    if (matchedUser) {
      router.push(`/chat?userId=${matchedUser.id}`);
    }
  };

  const handleKeepSwiping = () => {
    setIsMatchModalOpen(false);
    setMatchedUser(null);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Please log in to see matches</p>
      </div>
    );
  }

  if (!hasMoreCards) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl mb-6">
          😔
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-4">No More Users</h3>
        <p className="text-gray-400 mb-6 max-w-md">
          You've seen everyone in your area! Check back later for new matches.
        </p>
        <button
          onClick={() => router.push('/discover')}
          className="px-6 py-3 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF5E3A]/50 transition-all"
        >
          Back to Discover
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative w-full h-full', className)}>
        <div className="relative w-full h-full max-w-2xl mx-auto">
          <AnimatePresence>
            {visibleUsers.map((user, index) => {
              const isTopCard = index === 0;
              const scale = 1 - index * 0.05;
              const y = index * 10;

              return (
                <motion.div
                  key={user.id}
                  className="absolute inset-0"
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale, y, opacity: 1, zIndex: MAX_VISIBLE_CARDS - index }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ pointerEvents: isTopCard ? 'auto' : 'none' }}
                >
                  <SwipeMatchCard
                    user={user}
                    onLike={handleLike}
                    onPass={handlePass}
                    onProfileClick={handleProfileClick}
                    className="w-full h-full"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {hasMoreCards && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
              <span className="text-white font-semibold">
                {currentIndex + 1} / {users.length}
              </span>
            </div>
          )}
        </div>

        <div className="hidden md:flex absolute bottom-8 left-8 gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">←</kbd>
            <span>Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">→</kbd>
            <span>Like</span>
          </div>
        </div>
      </div>

      {currentUser && matchedUser && (
        <MatchModal
          isOpen={isMatchModalOpen}
          currentUser={{
            id: currentUser.uid,
            displayName: currentUser.displayName || 'You',
            photoURL: currentUser.photoURL || '',
          } as FirestoreUser}
          matchedUser={matchedUser}
          onMessage={handleMessage}
          onKeepSwiping={handleKeepSwiping}
        />
      )}
    </>
  );
}
