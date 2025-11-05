'use client';

/**
 * Payment Methods Component
 * 
 * Manage cards, Apple Pay, Google Pay
 * Flame-themed with animated transitions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow } from '@/lib/flame-transitions';
import Button from '@/components/ui/Button';

export interface PaymentMethodsProps {
  className?: string;
  onSelect?: (method: PaymentMethod) => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'apple' | 'google';
  name: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

export default function PaymentMethods({ className, onSelect }: PaymentMethodsProps) {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([
    {
      id: 'apple',
      type: 'apple',
      name: 'Apple Pay',
    },
    {
      id: 'google',
      type: 'google',
      name: 'Google Pay',
    },
  ]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);

  const handleAddCard = async () => {
    setShowAddCard(true);
    // TODO: Integrate with payment provider (Stripe, GHL, etc.)
  };

  const handleRemoveMethod = async (methodId: string) => {
    // TODO: Remove payment method
    setMethods(methods.filter((m) => m.id !== methodId));
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method.id);
    onSelect?.(method);
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
          <h1 className="text-3xl font-bold text-white mb-2">Payment Methods</h1>
          <p className="text-gray-400">
            Manage your payment methods for quick and secure transactions
          </p>
        </motion.div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          <AnimatePresence>
            {methods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative overflow-hidden rounded-xl p-4 border-2 cursor-pointer transition-all',
                  selectedMethod === method.id
                    ? 'border-[#FF5E3A] bg-gradient-to-br from-[#FF5E3A]/10 to-[#FF9E57]/10'
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                )}
                onClick={() => handleSelectMethod(method)}
              >
                {/* Animated background */}
                {selectedMethod === method.id && (
                  <motion.div
                    className="absolute inset-0 opacity-10"
                    animate={{
                      background: [
                        'radial-gradient(circle at 0% 0%, rgba(255, 94, 58, 0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 100% 100%, rgba(255, 158, 87, 0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 0% 0%, rgba(255, 94, 58, 0.3) 0%, transparent 50%)',
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                      {method.type === 'apple' && (
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                      )}
                      {method.type === 'google' && (
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      {method.type === 'card' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      )}
                    </div>

                    {/* Method Info */}
                    <div>
                      <div className="font-semibold text-white">{method.name}</div>
                      {method.last4 && (
                        <div className="text-sm text-gray-400">
                          •••• {method.last4} {method.brand && `(${method.brand})`}
                        </div>
                      )}
                      {method.expiryMonth && method.expiryYear && (
                        <div className="text-xs text-gray-500">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-[#FF5E3A]/20 text-[#FF5E3A] text-xs rounded-full">
                        Default
                      </span>
                    )}
                    {method.type === 'card' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMethod(method.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Card Button */}
        <motion.div variants={flameFadeIn}>
          <motion.button
            onClick={handleAddCard}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-semibold',
              'bg-gray-800 text-white border-2 border-gray-700',
              'hover:border-[#FF5E3A] hover:bg-gray-700',
              'transition-all duration-300',
              'flex items-center justify-center gap-2'
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Credit or Debit Card</span>
          </motion.button>
        </motion.div>

        {/* Info */}
        <motion.div variants={flameFadeIn} className="text-center">
          <p className="text-sm text-gray-500">
            Your payment information is encrypted and secure
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

