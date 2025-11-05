'use client';

/**
 * Profile Modal Component
 * 
 * Detailed user profile view with hero image carousel
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Close icon SVG (replacing lucide-react)
const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
import { cn } from '@/lib/utils';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { flameSlideUp, flameFadeIn } from '@/lib/flame-transitions';

export interface ProfileModalProps {
  user: FirestoreUser | null;
  isOpen: boolean;
  onClose: () => void;
  onFollow?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onTip?: (userId: string) => void;
}

export default function ProfileModal({
  user,
  isOpen,
  onClose,
  onFollow,
  onMessage,
  onTip,
}: ProfileModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(false);

  const images = user
    ? [
        user.photoURL,
        // Add more images from user metadata if available
      ].filter(Boolean) as string[]
    : [];

  useEffect(() => {
    if (!user) {
      setIsOnline(false);
      return;
    }

    if (user.status === 'online') {
      setIsOnline(true);
      return;
    }

    if (user.lastSeen) {
      setIsOnline(user.lastSeen.toMillis() > Date.now() - 5 * 60 * 1000);
    } else {
      setIsOnline(false);
    }
  }, [user?.status, user?.lastSeen]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={flameSlideUp}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:max-w-2xl md:w-full md:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-gray-800">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>

              {/* Hero image carousel */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57]">
                {images.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        src={images[currentImageIndex]}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>

                    {/* Carousel controls */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Dots indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={cn(
                                'w-2 h-2 rounded-full transition-all',
                                index === currentImageIndex
                                  ? 'bg-white w-6'
                                  : 'bg-white/50 hover:bg-white/75'
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl font-bold text-white/20">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Online indicator */}
                {isOnline && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-white">Online</span>
                  </div>
                )}

                {/* Tier badge */}
                {user.tier && user.tier !== 'free' && (
                  <div className="absolute top-4 left-4 md:left-auto md:right-4 px-3 py-1 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-full text-xs font-semibold text-white">
                    {user.tier.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Name and basic info */}
                <motion.div variants={flameFadeIn} className="mb-4">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {user.displayName}
                  </h1>
                  
                  {user.bio && (
                    <p className="text-gray-300 leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                </motion.div>

                {/* Location */}
                {user.location && (
                  <motion.div
                    variants={flameFadeIn}
                    className="flex items-center gap-2 text-gray-400 mb-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {user.location.address || 
                       `${user.location.city || ''}${user.location.city && user.location.country ? ', ' : ''}${user.location.country || ''}`}
                    </span>
                  </motion.div>
                )}

                {/* Interests */}
                {user.interests && user.interests.length > 0 && (
                  <motion.div variants={flameFadeIn} className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                  variants={flameFadeIn}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <motion.button
                    onClick={() => onFollow?.(user.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white rounded-xl font-semibold hover:from-[#FF6E4A] hover:to-[#FFAE67] transition-all"
                  >
                    Follow
                  </motion.button>

                  <motion.button
                    onClick={() => onMessage?.(user.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 px-6 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Message
                  </motion.button>

                  <motion.button
                    onClick={() => onTip?.(user.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 px-6 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tip
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
