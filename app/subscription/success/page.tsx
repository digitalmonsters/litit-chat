'use client';

/**
 * Subscription Success Page
 * 
 * Shows confirmation after successful Stripe Checkout
 */

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Countdown and redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/chat');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-[#1E1E1E] rounded-3xl border border-gray-800 p-8 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center"
        >
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>

        {/* Success Message */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          Upgrade Successful! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6"
        >
          Your subscription has been activated. Welcome to your new plan!
        </motion.p>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6 p-4 bg-gray-800/50 rounded-xl"
          >
            <p className="text-xs text-gray-500 mb-1">Session ID</p>
            <p className="text-xs text-gray-400 font-mono break-all">{sessionId}</p>
          </motion.div>
        )}

        {/* Countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500"
        >
          Redirecting in {countdown} seconds...
        </motion.p>

        {/* Manual Redirect Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => router.push('/chat')}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Go to Chat Now
        </motion.button>
      </motion.div>
    </div>
  );
}
