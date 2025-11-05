'use client';

/**
 * Phone Authentication Component
 * 
 * Handles SMS verification code flow
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { flameFadeIn } from '@/lib/flame-transitions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export interface PhoneAuthProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function PhoneAuth({ onSuccess, onCancel, className }: PhoneAuthProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA
    const auth = getAuthInstance();
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try again.');
      },
    });

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = getAuthInstance();
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized');
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmation;
      setStep('code');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error sending code:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!confirmationResultRef.current) {
        throw new Error('No confirmation result');
      }

      await confirmationResultRef.current.confirm(verificationCode);
      
      // User will be created/updated via AuthContext onAuthStateChanged
      onSuccess?.();
      router.push('/onboarding/profile');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error verifying code:', err);
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('w-full space-y-4', className)}
    >
      {/* reCAPTCHA container (hidden) */}
      <div id="recaptcha-container" />

      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-gray-800 border-2 border-gray-700',
                  'text-white placeholder-gray-500',
                  'focus:outline-none focus:border-[#FF5E3A] focus:ring-2 focus:ring-[#FF5E3A]/20',
                  'transition-all'
                )}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-3">
              {onCancel && (
                <motion.button
                  onClick={onCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
              )}
              <motion.button
                onClick={handleSendCode}
                disabled={loading || !phoneNumber.trim()}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl font-semibold',
                  'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
                  'hover:from-[#FF6E4A] hover:to-[#FFAE67]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all'
                )}
              >
                {loading ? 'Sending...' : 'Send Code'}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-gray-800 border-2 border-gray-700',
                  'text-white placeholder-gray-500 text-center text-2xl tracking-widest',
                  'focus:outline-none focus:border-[#FF5E3A] focus:ring-2 focus:ring-[#FF5E3A]/20',
                  'transition-all'
                )}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-3">
              <motion.button
                onClick={() => {
                  setStep('phone');
                  setVerificationCode('');
                  setError(null);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Back
              </motion.button>
              <motion.button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl font-semibold',
                  'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
                  'hover:from-[#FF6E4A] hover:to-[#FFAE57]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all'
                )}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

