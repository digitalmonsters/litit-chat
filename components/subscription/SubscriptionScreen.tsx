'use client';

/**
 * Subscription Screen Component
 * 
 * Displays LIT+ tiers with animated flame background
 * Flame-themed with animated transitions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow } from '@/lib/flame-transitions';
import Button from '@/components/ui/Button';

export interface SubscriptionScreenProps {
  className?: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  priceUnit: 'month' | 'year';
  features: string[];
  popular?: boolean;
  gradient: string;
}

const tiers: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceUnit: 'month',
    features: [
      'Basic messaging',
      'Up to 10 chats',
      'Standard support',
      'Limited storage',
    ],
    gradient: 'from-gray-700 to-gray-800',
  },
  {
    id: 'basic',
    name: 'LIT+ Basic',
    price: 9.99,
    priceUnit: 'month',
    features: [
      'Unlimited messaging',
      'Unlimited chats',
      'Priority support',
      '10GB storage',
      'Early access features',
    ],
    gradient: 'from-[#FF5E3A] to-[#FF7E5A]',
  },
  {
    id: 'premium',
    name: 'LIT+ Premium',
    price: 19.99,
    priceUnit: 'month',
    features: [
      'Everything in Basic',
      '100GB storage',
      'VIP support',
      'Exclusive content',
      'Advanced analytics',
      'Custom themes',
    ],
    popular: true,
    gradient: 'from-[#FF5E3A] to-[#FF9E57]',
  },
  {
    id: 'enterprise',
    name: 'LIT+ Enterprise',
    price: 99.99,
    priceUnit: 'month',
    features: [
      'Everything in Premium',
      'Unlimited storage',
      'Dedicated support',
      'Custom integrations',
      'API access',
      'SLA guarantee',
    ],
    gradient: 'from-[#FF9E57] to-[#FFBE77]',
  },
];

export default function SubscriptionScreen({ className }: SubscriptionScreenProps) {
  const { firestoreUser } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const currentTier = firestoreUser?.tier || 'free';

  const handleSubscribe = async (tierId: string) => {
    if (tierId === currentTier) return;

    setLoading(tierId);
    try {
      // Navigate to payment method selection
      window.location.href = `/subscription/checkout?tier=${tierId}`;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error subscribing:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden', className)}>
      {/* Animated Flame Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 0% 0%, rgba(255, 94, 58, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(255, 158, 87, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(255, 94, 58, 0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 0%, rgba(255, 94, 58, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 100% 0%, rgba(255, 158, 87, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 100%, rgba(255, 94, 58, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(255, 158, 87, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 0%, rgba(255, 158, 87, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 md:p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={flameFadeIn}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <motion.h1
              variants={flameFadeIn}
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent"
            >
              LIT+ Subscription
            </motion.h1>
            <motion.p
              variants={flameFadeIn}
              className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
              Choose the plan that's right for you. Upgrade or downgrade at any time.
            </motion.p>
          </div>

          {/* Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => {
              const isCurrent = tier.id === currentTier;
              const isPopular = tier.popular;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'relative overflow-hidden rounded-2xl p-6 border-2',
                    'bg-[#1E1E1E]',
                    isPopular
                      ? 'border-[#FF5E3A] shadow-lg shadow-[#FF5E3A]/20'
                      : 'border-gray-800',
                    isCurrent && 'ring-2 ring-[#FF5E3A]'
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-full text-xs font-semibold text-white"
                    >
                      Popular
                    </motion.div>
                  )}

                  {/* Current Badge */}
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 left-4 px-3 py-1 bg-gray-700 rounded-full text-xs font-semibold text-white"
                    >
                      Current
                    </motion.div>
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
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-4xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent">
                        ${tier.price}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        /{tier.priceUnit}
                      </span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + idx * 0.05 }}
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
                        </motion.li>
                      ))}
                    </ul>

                    {/* Subscribe Button */}
                    <motion.button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isCurrent || loading === tier.id}
                      whileHover={isCurrent ? {} : { scale: 1.02 }}
                      whileTap={isCurrent ? {} : { scale: 0.98 }}
                      className={cn(
                        'w-full py-3 px-4 rounded-xl font-semibold transition-all',
                        isCurrent
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : `bg-gradient-to-r ${tier.gradient} text-white hover:shadow-lg`,
                        loading === tier.id && 'opacity-50'
                      )}
                    >
                      {loading === tier.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : (
                        'Subscribe'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

