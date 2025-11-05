'use client';

/**
 * Match Page - Hot or Not Swipe Interface
 * 
 * Tinder-style swipe cards for matching with users
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import SwipeMatchStack from '@/components/discover/SwipeMatchStack';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MatchPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    fetchPotentialMatches();
  }, [currentUser]);

  const fetchPotentialMatches = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const db = getFirestoreInstance();

      // Get users that the current user hasn't liked or passed yet
      const likesRef = collection(db, COLLECTIONS.LIKES);
      const likesQuery = query(
        likesRef,
        where('userId', '==', currentUser.uid)
      );
      const likesSnap = await getDocs(likesQuery);
      const interactedUserIds = new Set(likesSnap.docs.map(doc => doc.data().targetUserId));
      interactedUserIds.add(currentUser.uid);

      // Fetch potential matches
      const usersRef = collection(db, COLLECTIONS.USERS);
      const usersQuery = query(
        usersRef,
        where('verified', '==', true),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const usersSnap = await getDocs(usersQuery);
      const potentialMatches = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser))
        .filter(user => !interactedUserIds.has(user.id));

      setUsers(potentialMatches);
      setError(null);
    } catch (err) {
      console.error('Error fetching potential matches:', err);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardsExhausted = () => {
    fetchPotentialMatches();
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1E1E1E]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-400">Please log in to see matches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-[#1E1E1E] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-[#1E1E1E] to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/discover')}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent flex items-center gap-2">
            <svg className="w-7 h-7 text-[#FF5E3A]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            Hot or Not
          </h1>

          <button
            onClick={() => router.push('/discover')}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="absolute inset-0 pt-20 pb-4 px-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16"
            >
              <svg className="w-full h-full text-[#FF5E3A]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            </motion.div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl mb-6"
            >
              ⚠️
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-4">Oops!</h3>
            <p className="text-gray-400 mb-6 max-w-md">{error}</p>
            <button
              onClick={fetchPotentialMatches}
              className="px-6 py-3 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF5E3A]/50 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl mb-6"
            >
              🎉
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-4">You're All Caught Up!</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              You've seen everyone in your area. Check back later for new people to match with!
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF5E3A]/50 transition-all"
            >
              Back to Discover
            </button>
          </div>
        ) : (
          <SwipeMatchStack
            users={users}
            onCardsExhausted={handleCardsExhausted}
            className="h-full"
          />
        )}
      </div>

      {/* Flame particles background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#FF5E3A] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: '100%',
            }}
            animate={{
              y: [0, -1000],
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
