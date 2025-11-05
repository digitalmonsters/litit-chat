'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { matchCelebration, flameHeartsBurst } from '@/lib/flame-animations';
import { cn } from '@/lib/utils';

export interface MatchModalProps {
  isOpen: boolean;
  currentUser: FirestoreUser;
  matchedUser: FirestoreUser;
  onMessage: () => void;
  onKeepSwiping: () => void;
}

export default function MatchModal({
  isOpen,
  currentUser,
  matchedUser,
  onMessage,
  onKeepSwiping,
}: MatchModalProps) {
  const heartBursts = flameHeartsBurst(25);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg relative">
              <div className="absolute inset-0 pointer-events-none">
                {heartBursts.map((heart, i) => (
                  <motion.div
                    key={i}
                    initial={heart.initial}
                    animate={heart.animate}
                    transition={heart.transition as any}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <svg className="w-8 h-8 text-[#FF5E3A]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={matchCelebration}
                initial="initial"
                animate="animate"
                className="bg-[#1E1E1E] rounded-3xl overflow-hidden border-4 border-[#FF5E3A] shadow-2xl shadow-[#FF5E3A]/50"
              >
                <div className="relative bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] p-8 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-7xl mb-4"
                  >
                    🔥
                  </motion.div>
                  <h2 className="text-4xl font-black text-white mb-2">It's a Match!</h2>
                  <p className="text-white/90 text-lg">You and {matchedUser.displayName} liked each other</p>
                </div>

                <div className="relative flex items-center justify-center -mt-12 mb-8 px-8">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10"
                  >
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57]">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">{currentUser.displayName?.charAt(0)?.toUpperCase() ?? '?'}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="absolute z-20"
                  >
                    <div className="w-16 h-16 rounded-full bg-white shadow-2xl flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#FF5E3A]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10"
                  >
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57]">
                      {matchedUser.photoURL ? (
                        <img src={matchedUser.photoURL} alt={matchedUser.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">{matchedUser.displayName?.charAt(0)?.toUpperCase() ?? '?'}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                <div className="px-8 pb-8 flex flex-col gap-4">
                  <motion.button
                    onClick={onMessage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'w-full py-4 px-6 rounded-2xl font-bold text-lg text-white',
                      'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]',
                      'shadow-lg hover:shadow-[#FF5E3A]/50 transition-all'
                    )}
                  >
                    Send a Message
                  </motion.button>

                  <motion.button
                    onClick={onKeepSwiping}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 rounded-2xl font-semibold text-lg text-white/80 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    Keep Swiping
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
