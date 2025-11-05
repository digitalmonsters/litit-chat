'use client';

/**
 * Tip Modal Component
 * 
 * Modal for tipping stars or USD via GHL
 * Used in LiveParty and BattleMode
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow, flameSlideUp } from '@/lib/flame-transitions';

export interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName?: string;
  context: 'battle' | 'liveparty';
  contextId: string; // battleId or livePartyId
  onTipSuccess?: (amount: number, currency: 'USD' | 'STARS') => void;
}

export default function TipModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  context,
  contextId,
  onTipSuccess,
}: TipModalProps) {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [tipAmount, setTipAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'STARS'>('STARS');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const starsBalance = wallet?.stars || 0;
  const amount = parseFloat(tipAmount) || 0;
  const amountInCents = currency === 'USD' ? Math.round(amount * 100) : Math.round(amount);
  const hasEnoughStars = currency === 'STARS' ? starsBalance >= amountInCents : true;

  const presetAmounts = currency === 'STARS' 
    ? [100, 500, 1000, 5000] 
    : [1, 5, 10, 25]; // USD amounts

  const handleTip = async () => {
    if (!user) {
      setError('Please sign in to tip');
      return;
    }

    if (amount <= 0) {
      setError('Please enter a tip amount');
      return;
    }

    if (currency === 'STARS' && !hasEnoughStars) {
      setError(`Insufficient stars. You need ${amountInCents} but have ${starsBalance}.`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (context === 'battle') {
        // Tip battle host
        const response = await fetch('/api/battles/tip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            battleId: contextId,
            hostId: recipientId,
            userId: user.uid,
            amount: amountInCents,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to tip');
        }
      } else {
        // Tip LiveParty host
        const response = await fetch('/api/liveparties/tip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            livePartyId: contextId,
            hostId: recipientId,
            userId: user.uid,
            amount: amountInCents,
            currency,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to tip');
        }
      }

      onTipSuccess?.(amountInCents, currency);
      onClose();
      setTipAmount('');
    } catch (err) {
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
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <motion.h2
                  variants={flameFadeIn}
                  className="text-2xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent"
                >
                  Send Tip
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
                {recipientName && (
                  <p className="text-sm text-gray-400">
                    Tipping <span className="text-white font-semibold">{recipientName}</span>
                  </p>
                )}

                {/* Currency Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrency('STARS')}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        currency === 'STARS'
                          ? 'border-[#FF5E3A] bg-gradient-to-br from-[#FF5E3A]/20 to-[#FF9E57]/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">⭐</span>
                        <span className="font-semibold text-white">Stars</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {starsBalance} available
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        currency === 'USD'
                          ? 'border-[#FF5E3A] bg-gradient-to-br from-[#FF5E3A]/20 to-[#FF9E57]/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">💳</span>
                        <span className="font-semibold text-white">USD</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Via GHL
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Tip Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {currency === 'USD' ? '$' : '⭐'}
                    </span>
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder={currency === 'USD' ? '0.00' : '0'}
                      min="0"
                      step={currency === 'USD' ? '0.01' : '1'}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E3A]"
                    />
                  </div>

                  {/* Preset Amounts */}
                  <div className="flex gap-2 flex-wrap">
                    {presetAmounts.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTipAmount(preset.toString())}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white transition-colors"
                      >
                        {currency === 'USD' ? `$${preset}` : `⭐${preset}`}
                      </button>
                    ))}
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
                    disabled={processing || !hasEnoughStars || amount <= 0}
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
                        <span>Send Tip</span>
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

