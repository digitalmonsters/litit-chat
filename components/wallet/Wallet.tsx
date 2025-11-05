'use client';

/**
 * Wallet Component
 * 
 * Displays stars balance, USD balance, and Top-Up button
 * Flame-themed with animated transitions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow } from '@/lib/flame-transitions';
import Button from '@/components/ui/Button';

export interface WalletProps {
  className?: string;
}

export default function Wallet({ className }: WalletProps) {
  const { user } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const [loading, setLoading] = useState(false);

  // Get wallet balance from WalletContext or default to 0
  const starsBalance = wallet?.stars || 0;
  const usdBalance = wallet?.usd ? wallet.usd / 100 : 0; // Convert cents to dollars

  const handleTopUp = async () => {
    setLoading(true);
    try {
      // Navigate to payment methods or top-up flow
      window.location.href = '/wallet/top-up';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error initiating top-up:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('w-full max-w-2xl mx-auto p-4 md:p-6', className)}
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div variants={flameFadeIn}>
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-gray-400">
            Manage your balance and top up your account
          </p>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stars Balance */}
          <motion.div
            variants={flameGlow}
            animate="animate"
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF5E3A]/20 to-[#FF9E57]/20 border border-[#FF5E3A]/30 p-6"
          >
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  'radial-gradient(circle at 0% 0%, rgba(255, 94, 58, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 100% 100%, rgba(255, 158, 87, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 0% 0%, rgba(255, 94, 58, 0.3) 0%, transparent 50%)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⭐</span>
                <span className="text-sm font-medium text-gray-400">Stars</span>
              </div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-4xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent"
              >
                {starsBalance.toLocaleString()}
              </motion.div>
              <p className="text-xs text-gray-500 mt-2">
                1 Star = $0.01 USD
              </p>
            </div>
          </motion.div>

          {/* USD Balance */}
          <motion.div
            variants={flameGlow}
            animate="animate"
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💵</span>
                <span className="text-sm font-medium text-gray-400">USD</span>
              </div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-4xl font-bold text-white"
              >
                ${usdBalance.toFixed(2)}
              </motion.div>
              <p className="text-xs text-gray-500 mt-2">
                Available balance
              </p>
            </div>
          </motion.div>
        </div>

        {/* Top-Up Button */}
        <motion.div variants={flameFadeIn}>
          <motion.button
            onClick={handleTopUp}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-semibold',
              'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
              'hover:from-[#FF6E4A] hover:to-[#FFAE67]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-300',
              'flex items-center justify-center gap-2',
              'shadow-lg shadow-[#FF5E3A]/20'
            )}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Top Up</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={flameFadeIn} className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-[#FF5E3A]/50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📤</div>
              <div className="text-sm font-medium text-white">Send</div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-[#FF5E3A]/50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📥</div>
              <div className="text-sm font-medium text-white">Receive</div>
            </div>
          </motion.button>
        </motion.div>

        {/* Transaction History Link */}
        <motion.div variants={flameFadeIn}>
          <button className="w-full text-center text-sm text-gray-400 hover:text-[#FF5E3A] transition-colors">
            View Transaction History →
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

