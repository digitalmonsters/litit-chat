'use client';

/**
 * Tip Modal Component
 * 
 * Tip using wallet stars or GHL payment
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
  onTip: (amount: number) => void;
  recipientId: string;
  recipientName: string;
  className?: string;
}

const tipAmounts = [100, 500, 1000, 2500, 5000, 10000]; // In stars

export default function TipModal({
  isOpen,
  onClose,
  onTip,
  recipientId,
  recipientName,
  className,
}: TipModalProps) {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stars' | 'card'>('stars');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const starsBalance = wallet?.stars || 0;
  const amount = selectedAmount || parseInt(customAmount) || 0;
  const hasEnoughStars = paymentMethod === 'stars' ? starsBalance >= amount : true;

  const handleTip = async () => {
    if (amount <= 0) {
      setError('Please select or enter a tip amount');
      return;
    }

    if (paymentMethod === 'stars' && !hasEnoughStars) {
      setError(`Insufficient stars. You need ${amount} but have ${starsBalance}.`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'stars') {
        // Deduct stars and tip
        const response = await fetch('/api/payments/tip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.uid,
            recipientId,
            amount, // In stars
            method: 'stars',
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send tip');
        }

        onTip(amount);
        onClose();
      } else {
        // Pay with card via GHL
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.uid,
            recipientId,
            amount: amount, // Convert stars to cents (1 star = 1 cent)
            currency: 'USD',
            description: `Tip to ${recipientName}`,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment');
        }

        onTip(amount);
        onClose();
      }
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
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Tip to</p>
                  <p className="text-xl font-semibold text-white">{recipientName}</p>
                </div>

                {/* Quick Amounts */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-3 block">
                    Quick Amounts (Stars)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {tipAmounts.map((tipAmount) => (
                      <motion.button
                        key={tipAmount}
                        onClick={() => {
                          setSelectedAmount(tipAmount);
                          setCustomAmount('');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          'px-4 py-3 rounded-xl font-semibold transition-all',
                          selectedAmount === tipAmount
                            ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        )}
                      >
                        ⭐ {tipAmount.toLocaleString()}
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
                    <span className="text-2xl">⭐</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      placeholder="Enter amount"
                      min="1"
                      className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#FF5E3A]"
                    />
                  </div>
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
                      disabled={!hasEnoughStars && amount > 0}
                      whileHover={{ scale: paymentMethod === 'stars' ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        paymentMethod === 'stars'
                          ? 'border-[#FF5E3A] bg-gradient-to-br from-[#FF5E3A]/20 to-[#FF9E57]/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600',
                        !hasEnoughStars && amount > 0 && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">⭐</span>
                        <span className="font-semibold text-white">Pay with Stars</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {starsBalance.toLocaleString()} available
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

                  {paymentMethod === 'stars' && !hasEnoughStars && amount > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-amber-400 mt-2"
                    >
                      Insufficient stars. You need {amount} but have {starsBalance}.
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
                    onClick={handleTip}
                    disabled={processing || amount <= 0 || (paymentMethod === 'stars' && !hasEnoughStars)}
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
                        <span>Send ⭐ {amount > 0 ? amount.toLocaleString() : '0'}</span>
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

