'use client';

/**
 * Unlock Modal Component
 * 
 * Payment modal for unlocking locked messages
 * Flame-themed with animated unlock effect
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow, flameSlideUp } from '@/lib/flame-transitions';

export interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  chatId: string;
  unlockPrice: number; // Price in cents
  currency?: string;
  onUnlockSuccess?: () => void;
}

export default function UnlockModal({
  isOpen,
  onClose,
  messageId,
  chatId,
  unlockPrice,
  currency = 'USD',
  onUnlockSuccess,
}: UnlockModalProps) {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [paymentMethod, setPaymentMethod] = useState<'stars' | 'card'>('stars');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceInDollars = (unlockPrice / 100).toFixed(2);
  const priceInStars = unlockPrice; // 1 cent = 1 star
  const starsBalance = wallet?.stars || 0;
  const hasEnoughStars = starsBalance >= priceInStars;

  const handleUnlock = async () => {
    if (!user) {
      setError('Please sign in to unlock');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'stars') {
        // Pay with stars
        if (!hasEnoughStars) {
          setError(`Insufficient stars. You need ${priceInStars} but have ${starsBalance}.`);
          setProcessing(false);
          return;
        }

        // Deduct stars and unlock message
        const response = await fetch('/api/payments/unlock-with-stars', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            messageId,
            chatId,
            amount: priceInStars,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to unlock with stars');
        }

        onUnlockSuccess?.();
        onClose();
      } else {
        // Pay with card (GHL or Stripe)
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            messageId,
            chatId,
            amount: unlockPrice,
            currency,
            description: `Unlock message ${messageId}`,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment');
        }

        const data = await response.json();
        
        // Payment will be processed via webhook
        // The webhook will handle unlocking the message
        onUnlockSuccess?.();
        onClose();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error unlocking message:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlock message');
    } finally {
      setProcessing(false);
    }
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
                  Unlock Content
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
                <p className="text-sm text-gray-400">
                  This content is locked. Pay to unlock and view it.
                </p>

                {/* Price Display */}
                <motion.div
                  variants={flameGlow}
                  animate="animate"
                  className="rounded-xl border border-[#FF5E3A]/30 bg-gradient-to-br from-[#FF5E3A]/10 to-[#FF9E57]/10 p-6 text-center"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent mb-2">
                    ${priceInDollars}
                  </div>
                  <div className="text-sm text-gray-400 mb-4">{currency}</div>
                  <div className="text-lg font-semibold text-[#FF9E57]">
                    or ⭐ {priceInStars} Stars
                  </div>
                </motion.div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setPaymentMethod('stars')}
                      disabled={!hasEnoughStars}
                      whileHover={{ scale: paymentMethod === 'stars' ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        paymentMethod === 'stars'
                          ? 'border-[#FF5E3A] bg-gradient-to-br from-[#FF5E3A]/20 to-[#FF9E57]/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600',
                        !hasEnoughStars && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">⭐</span>
                        <span className="font-semibold text-white">Pay with Stars</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {starsBalance} available
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      whileHover={{ scale: paymentMethod === 'card' ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        paymentMethod === 'card'
                          ? 'border-[#FF5E3A] bg-gradient-to-br from-[#FF5E3A]/20 to-[#FF9E57]/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">💳</span>
                        <span className="font-semibold text-white">Pay with Card</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Via GHL
                      </div>
                    </motion.button>
                  </div>

                  {paymentMethod === 'stars' && !hasEnoughStars && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-amber-400"
                    >
                      Insufficient stars. You need {priceInStars} but have {starsBalance}.
                    </motion.p>
                  )}
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
                    onClick={handleUnlock}
                    disabled={processing}
                    whileHover={{ scale: processing ? 1 : 1.02 }}
                    whileTap={{ scale: processing ? 1 : 0.98 }}
                    className={cn(
                      'w-full py-4 px-6 rounded-xl font-semibold',
                      'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
                      'hover:from-[#FF6E4A] hover:to-[#FFAE67]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all duration-300',
                      'flex items-center justify-center gap-2'
                    )}
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Unlock for ${priceInDollars}</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={onClose}
                    disabled={processing}
                    whileHover={{ scale: processing ? 1 : 1.02 }}
                    whileTap={{ scale: processing ? 1 : 0.98 }}
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
