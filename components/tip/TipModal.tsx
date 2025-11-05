'use client';

/**
 * Tip Modal Component
 * 
 * Allows tipping using wallet stars or GHL payment
 * Includes floating hearts and stars rain animations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameSlideUp, flameGlow } from '@/lib/flame-transitions';

export interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  onSuccess?: (amount: number) => void;
  className?: string;
}

const PRESET_AMOUNTS = [100, 500, 1000, 5000]; // In cents ($1, $5, $10, $50)

export default function TipModal({
  isOpen,
  onClose,
  recipientId,
  onSuccess,
  className,
}: TipModalProps) {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [amount, setAmount] = useState(500); // Default $5
  const [paymentMethod, setPaymentMethod] = useState<'stars' | 'card'>('stars');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const starsBalance = wallet?.stars || 0;
  const amountInStars = amount; // 1 cent = 1 star
  const hasEnoughStars = starsBalance >= amountInStars;

  const handleTip = async () => {
    if (!user) {
      setError('Please sign in to tip');
      return;
    }

    if (paymentMethod === 'stars' && !hasEnoughStars) {
      setError(`Insufficient stars. You need ${amountInStars} but have ${starsBalance}.`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'stars') {
        // Pay with stars
        const response = await fetch('/api/payments/tip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            recipientId,
            amount,
            currency: 'stars',
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send tip');
        }
      } else {
        // Pay with card
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            recipientId,
            amount,
            currency: 'USD',
            description: `Tip to ${recipientId}`,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment');
        }
      }

      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onSuccess?.(amount);
        onClose();
      }, 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error sending tip:', err);
      setError(err instanceof Error ? err.message : 'Failed to send tip');
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
              {/* Celebration Animation */}
              <AnimatePresence>
                {showCelebration && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl"
                  >
                    {/* Floating Hearts */}
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, y: 0, x: 0 }}
                        animate={{
                          scale: [0, 1, 0],
                          y: -100,
                          x: (Math.random() - 0.5) * 200,
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.1,
                        }}
                        className="absolute text-4xl"
                      >
                        ❤️
                      </motion.div>
                    ))}
                    {/* Stars Rain */}
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, y: -50, x: (Math.random() - 0.5) * 400 }}
                        animate={{
                          scale: [0, 1, 0],
                          y: 400,
                        }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.05,
                        }}
                        className="absolute text-2xl"
                      >
                        ⭐
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-6xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent"
                    >
                      Thank You! 💫
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <motion.h2
                  variants={flameFadeIn}
                  className="text-2xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent"
                >
                  Send a Tip
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
                {/* Preset Amounts */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-3 block">
                    Select Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((preset) => (
                      <motion.button
                        key={preset}
                        onClick={() => setAmount(preset)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          'px-4 py-3 rounded-xl font-semibold transition-all',
                          amount === preset
                            ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        )}
                      >
                        ${(preset / 100).toFixed(0)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Custom Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      value={(amount / 100).toFixed(2)}
                      onChange={(e) => setAmount(Math.round(parseFloat(e.target.value) * 100))}
                      min="0.01"
                      step="0.01"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    or ⭐ {amount} Stars
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-3 block">
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
                    onClick={handleTip}
                    disabled={processing || (paymentMethod === 'stars' && !hasEnoughStars)}
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
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>⭐</span>
                        <span>Tip ${(amount / 100).toFixed(2)}</span>
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

