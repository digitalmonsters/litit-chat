'use client';

/**
 * Subscription Cancel Page
 * 
 * Shows message when user cancels Stripe Checkout
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-[#1E1E1E] rounded-3xl border border-gray-800 p-8 text-center"
      >
        {/* Cancel Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center"
        >
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.div>

        {/* Cancel Message */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          Checkout Cancelled
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6"
        >
          No worries! You can upgrade your plan anytime.
        </motion.p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => router.push('/chat')}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Return to Chat
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all"
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
