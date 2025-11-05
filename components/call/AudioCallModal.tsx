'use client';

/**
 * Audio Call Modal Component
 * 
 * Shows "Call by Phone" option when profile has phone and audioCallEnabled
 * Connects to /api/call/sip (SIP bridge)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameSlideUp } from '@/lib/flame-transitions';
import type { FirestoreUser } from '@/lib/firestore-collections';

export interface AudioCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FirestoreUser;
  className?: string;
}

export default function AudioCallModal({
  isOpen,
  onClose,
  profile,
  className,
}: AudioCallModalProps) {
  const { user } = useAuth();
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneNumber = typeof profile.metadata?.phone === 'string' ? profile.metadata.phone : undefined;
  const audioCallEnabled = profile.metadata?.audioCallEnabled !== false;

  const handleCall = async () => {
    if (!phoneNumber || !user) return;

    setCalling(true);
    setError(null);

    try {
      const response = await fetch('/api/call/sip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          targetUserId: profile.id,
          phoneNumber,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate call');
      }

      // Call initiated successfully
      onClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error initiating call:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate call');
    } finally {
      setCalling(false);
    }
  };

  if (!phoneNumber || !audioCallEnabled) {
    return null;
  }

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
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:max-w-md w-full md:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <motion.h2
                  variants={flameFadeIn}
                  className="text-2xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent"
                >
                  Call by Phone
                </motion.h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <motion.div variants={flameFadeIn} className="space-y-6">
                {/* Profile Info */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center mx-auto mb-4">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile?.displayName ?? 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {profile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {profile?.displayName ?? 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-400">{phoneNumber ?? ''}</p>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={handleCall}
                    disabled={calling}
                    whileHover={{ scale: calling ? 1 : 1.02 }}
                    whileTap={{ scale: calling ? 1 : 0.98 }}
                    className={cn(
                      'w-full py-4 px-6 rounded-xl font-semibold',
                      'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
                      'hover:from-[#FF6E4A] hover:to-[#FFAE67]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all duration-300',
                      'flex items-center justify-center gap-2'
                    )}
                  >
                    {calling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Calling...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>Call {profile?.displayName ?? 'User'}</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={onClose}
                    disabled={calling}
                    whileHover={{ scale: calling ? 1 : 1.02 }}
                    whileTap={{ scale: calling ? 1 : 0.98 }}
                    className="w-full py-3 px-6 rounded-xl font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
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
