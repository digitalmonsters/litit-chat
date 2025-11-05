'use client';

/**
 * Upgrade Prompt Component
 * 
 * Displays upgrade prompt when trial expires
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow } from '@/lib/flame-transitions';

export interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  showTrialInfo?: boolean;
  trialDaysRemaining?: number;
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  message = 'Your free trial has expired. Upgrade to LIT+ to continue.',
  showTrialInfo = false,
  trialDaysRemaining,
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/upgrade');
    onClose();
  };

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
            variants={flameFadeIn}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <motion.h2
                  variants={flameGlow}
                  animate="animate"
                  className="text-2xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent"
                >
                  Upgrade to LIT+
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
                {/* Message */}
                <p className="text-sm text-gray-400">{message}</p>

                {/* Trial Info */}
                {showTrialInfo && trialDaysRemaining !== undefined && (
                  <div className="rounded-xl border border-[#FF5E3A]/30 bg-gradient-to-br from-[#FF5E3A]/10 to-[#FF9E57]/10 p-4">
                    <p className="text-sm text-gray-300">
                      {trialDaysRemaining > 0
                        ? `${trialDaysRemaining} day(s) remaining in your trial`
                        : 'Your trial has expired'}
                    </p>
                  </div>
                )}

                {/* Benefits */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">LIT+ Benefits:</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="text-[#FF5E3A]">✓</span>
                      Unlimited call duration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#FF5E3A]">✓</span>
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#FF5E3A]">✓</span>
                      Exclusive features
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={handleUpgrade}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full py-4 px-6 rounded-xl font-semibold',
                      'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
                      'hover:from-[#FF6E4A] hover:to-[#FFAE67]',
                      'transition-all duration-300'
                    )}
                  >
                    Upgrade Now
                  </motion.button>

                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 px-6 rounded-xl font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  >
                    Maybe Later
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

