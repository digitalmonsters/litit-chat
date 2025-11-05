'use client';

/**
 * UpgradeModal Component
 * 
 * Shows subscription tiers (Free, PRO, VIP) with features and upgrade options
 * Integrates with Stripe Checkout for payments
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  features: string[];
  popular?: boolean;
  gradient: string;
}

const TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceFormatted: '$0',
    features: [
      'Basic messaging',
      'Up to 10 chats',
      'Standard support',
      'Limited storage',
    ],
    gradient: 'from-gray-600 to-gray-700',
  },
  {
    id: 'PRO',
    name: 'PRO',
    price: 1999,
    priceFormatted: '$19.99',
    popular: true,
    features: [
      'Unlimited messaging',
      'Unlimited chats',
      'Priority support',
      '100GB storage',
      'Unlock paid content',
      'Early access features',
    ],
    gradient: 'from-[#FF5E3A] to-[#FF7E5A]',
  },
  {
    id: 'VIP',
    name: 'VIP',
    price: 4999,
    priceFormatted: '$49.99',
    features: [
      'Everything in PRO',
      'Unlimited storage',
      'VIP support 24/7',
      'Exclusive VIP content',
      'Custom themes',
      'Advanced analytics',
      'API access',
    ],
    gradient: 'from-[#FF9E57] to-[#FFBE77]',
  },
];

export default function UpgradeModal({ isOpen, onClose, className }: UpgradeModalProps) {
  const { user, firestoreUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTier = firestoreUser?.tier || 'free';

  const handleUpgrade = async (tierId: string) => {
    if (tierId === 'free' || tierId === currentTier) {
      return;
    }

    setLoading(tierId);
    setError(null);

    try {
      // Get Firebase Auth token
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call upgrade API
      const response = await fetch('/api/payments/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier: tierId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Error upgrading:', err);
      setError(err instanceof Error ? err.message : 'Failed to upgrade');
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-black/70 backdrop-blur-sm',
          className
        )}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Content */}
          <div className="bg-[#1E1E1E] rounded-3xl border border-gray-800 p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent">
                  Upgrade Your Plan
                </h2>
                <p className="text-gray-400 mt-2">
                  Choose the plan that&apos;s right for you
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-400"
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
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Current Plan Badge */}
            {currentTier && (
              <div className="mb-6 p-4 bg-[#FF5E3A]/10 border border-[#FF5E3A]/20 rounded-xl">
                <p className="text-white">
                  Current Plan:{' '}
                  <span className="font-bold text-[#FF5E3A]">
                    {currentTier.toUpperCase()}
                  </span>
                </p>
              </div>
            )}

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TIERS.map((tier, index) => {
                const isCurrent = tier.id === currentTier;
                const isPopular = tier.popular;
                const canUpgrade = tier.id !== 'free' && tier.id !== currentTier;

                return (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'relative overflow-hidden rounded-2xl p-6 border-2',
                      'bg-[#2A2A2A]',
                      isPopular
                        ? 'border-[#FF5E3A] shadow-lg shadow-[#FF5E3A]/20'
                        : 'border-gray-700',
                      isCurrent && 'ring-2 ring-[#FF5E3A]'
                    )}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-full text-xs font-semibold text-white">
                        Popular
                      </div>
                    )}

                    {/* Current Badge */}
                    {isCurrent && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-gray-700 rounded-full text-xs font-semibold text-white">
                        Current
                      </div>
                    )}

                    {/* Animated background */}
                    <motion.div
                      className={cn(
                        'absolute inset-0 opacity-10',
                        `bg-gradient-to-br ${tier.gradient}`
                      )}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.15, 0.1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />

                    <div className="relative z-10">
                      {/* Tier Name */}
                      <h3 className="text-2xl font-bold text-white mb-2 mt-8">
                        {tier.name}
                      </h3>

                      {/* Price */}
                      <div className="mb-6">
                        <span className="text-4xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent">
                          {tier.priceFormatted}
                        </span>
                        {tier.price > 0 && (
                          <span className="text-gray-400 text-sm ml-2">/month</span>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2"
                          >
                            <svg
                              className="w-5 h-5 text-[#FF5E3A] flex-shrink-0 mt-0.5"
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
                            <span className="text-sm text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Upgrade Button */}
                      <Button
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={!canUpgrade || loading === tier.id}
                        className={cn(
                          'w-full py-3',
                          isCurrent && 'opacity-50 cursor-not-allowed',
                          !canUpgrade && tier.id === 'free' && 'opacity-50 cursor-not-allowed'
                        )}
                        variant={canUpgrade ? 'primary' : 'secondary'}
                      >
                        {loading === tier.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : isCurrent ? (
                          'Current Plan'
                        ) : tier.id === 'free' ? (
                          'Free'
                        ) : (
                          'Upgrade Now'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-400">
              <p>All plans include a 7-day free trial. Cancel anytime.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
