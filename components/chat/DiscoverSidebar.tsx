'use client';

/**
 * Discover Sidebar Component
 * 
 * Snapchat-style sidebar showing AI profiles as circular story bubbles
 * Displays avatars, online status, and allows clicking to view profile or start chat
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameStagger, flameStaggerItem } from '@/lib/flame-transitions';
import type { FirestoreUser } from '@/lib/firestore-collections';
import ProfileModal from '@/components/discover/ProfileModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export interface DiscoverSidebarProps {
  className?: string;
  onProfileClick?: (user: FirestoreUser) => void;
  maxProfiles?: number;
}

export default function DiscoverSidebar({
  className,
  onProfileClick,
  maxProfiles = 10,
}: DiscoverSidebarProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [aiProfiles, setAiProfiles] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<FirestoreUser | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchAIProfiles();
  }, [maxProfiles]);

  const fetchAIProfiles = async () => {
    try {
      const db = getFirestoreInstance();
      const usersRef = collection(db, COLLECTIONS.USERS);
      
      // Query for AI profiles
      const aiQuery = query(
        usersRef,
        where('isAI', '==', true),
        limit(maxProfiles)
      );

      const snapshot = await getDocs(aiQuery);
      const profiles: FirestoreUser[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as FirestoreUser));

      // Set all AI profiles as "online"
      const onlineProfiles = profiles.map(profile => ({
        ...profile,
        status: 'online' as const,
      }));

      setAiProfiles(onlineProfiles);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AI profiles:', error);
      setLoading(false);
    }
  };

  const handleProfileClick = (profile: FirestoreUser) => {
    setSelectedProfile(profile);
    setIsProfileModalOpen(true);
    onProfileClick?.(profile);
  };

  const handleMessage = async (userId: string) => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    try {
      // Check if chat already exists
      const db = getFirestoreInstance();
      const chatsRef = collection(db, COLLECTIONS.CHATS);
      const existingChatQuery = query(
        chatsRef,
        where('participantIds', 'array-contains', currentUser.uid)
      );
      
      const snapshot = await getDocs(existingChatQuery);
      const existingChat = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participantIds?.includes(userId);
      });

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
        setIsProfileModalOpen(false);
        return;
      }

      // Create new chat
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      const newChatRef = await addDoc(chatsRef, {
        participantIds: [currentUser.uid, userId],
        unreadCounts: {
          [currentUser.uid]: 0,
          [userId]: 0,
        },
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });

      router.push(`/chat/${newChatRef.id}`);
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="w-8 h-8 border-2 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (aiProfiles.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={flameFadeIn}
        className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
      >
        <div className="text-4xl mb-4">🔥</div>
        <p className="text-gray-400 text-sm">No profiles available</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={flameStagger}
        className={cn('flex flex-col gap-4 p-4 overflow-y-auto', className)}
      >
        {/* Header */}
        <motion.div variants={flameStaggerItem} className="mb-2">
          <h2 className="text-lg font-bold text-white mb-1">Discover</h2>
          <p className="text-xs text-gray-400">Chat with AI companions</p>
        </motion.div>

        {/* AI Profile Bubbles */}
        <div className="flex flex-col gap-3">
          {aiProfiles.map((profile) => (
            <motion.div
              key={profile.id}
              variants={flameStaggerItem}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleProfileClick(profile)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Story-style avatar bubble with gradient border */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] rounded-full p-[2px] animate-pulse">
                    <div className="w-full h-full bg-[#1E1E1E] rounded-full" />
                  </div>
                  <div className="relative w-14 h-14 rounded-full p-[3px] bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57]">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName || 'Profile'}
                        className="w-full h-full rounded-full object-cover border-2 border-[#1E1E1E]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center border-2 border-[#1E1E1E]">
                        <span className="text-white font-bold text-lg">
                          {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Online indicator */}
                  {profile.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1E1E1E] animate-pulse" />
                  )}
                </div>

                {/* Profile info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">
                    {profile.displayName}
                  </h3>
                  {profile.bio && (
                    <p className="text-xs text-gray-400 truncate">{profile.bio}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Profile Modal */}
      <ProfileModal
        user={selectedProfile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onMessage={handleMessage}
      />
    </>
  );
}
