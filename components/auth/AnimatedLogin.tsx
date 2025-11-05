'use client';

/**
 * Animated Login/Register Screen
 * 
 * Features:
 * - Ghost-flame motion animations
 * - Gradient background (#FF5E3A → #FF9E57)
 * - Glowing input focus borders
 * - Responsive layout (modal on desktop, full-screen on mobile)
 * - Ghost-flame pulsing loader
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import FlameLoader from '@/components/ui/FlameLoader';
import { flameSlideUp, flameFadeIn, flameGlow } from '@/lib/flame-transitions';
import { cn } from '@/lib/utils';

export interface AnimatedLoginProps {
  mode?: 'login' | 'register';
  className?: string;
}

export default function AnimatedLogin({ mode = 'login', className }: AnimatedLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { signInWithGoogle, signInWithApple, signInWithFacebook, sendMagicLink } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError(null);
    try {
      await signInWithGoogle();
      router.push('/onboarding/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    setError(null);
    try {
      await signInWithApple();
      router.push('/onboarding/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Apple');
      setLoading(null);
    }
  };

  const handlePhoneSignIn = async () => {
    setLoading('phone');
    setError(null);
    setError('Phone authentication coming soon');
    setLoading(null);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading('magic');
    setError(null);
    try {
      await sendMagicLink(email);
      setError(null);
      // Show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(null);
    }
  };

  // Animated input field component
  const AnimatedInput = ({
    type,
    placeholder,
    value,
    onChange,
    onFocus,
    onBlur,
    icon,
  }: {
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
    icon: React.ReactNode;
  }) => {
    const isFocused = focusedField === placeholder;
    
    return (
      <motion.div
        className="relative mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
          <motion.input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            className={cn(
              'w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm',
              'border-2 rounded-xl text-white placeholder-gray-400',
              'focus:outline-none transition-all duration-300',
              isFocused
                ? 'border-[#FF5E3A] shadow-[0_0_20px_rgba(255,94,58,0.5)]'
                : 'border-gray-700 hover:border-gray-600'
            )}
            disabled={loading !== null}
          />
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                boxShadow: '0 0 30px rgba(255, 94, 58, 0.6)',
              }}
            />
          )}
        </div>
      </motion.div>
    );
  };

  // Animated button component
  const AnimatedButton = ({
    onClick,
    icon,
    label,
    loadingState,
    variant = 'default',
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    loadingState: string | null;
    variant?: 'default' | 'google' | 'apple' | 'phone';
  }) => {
    const isLoading = loadingState === variant;
    const buttonClasses = {
      default: 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white hover:from-[#FF6E4A] hover:to-[#FFAE67]',
      google: 'bg-white text-gray-900 hover:bg-gray-100',
      apple: 'bg-black text-white hover:bg-gray-900',
      phone: 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700',
    };

    return (
      <motion.button
        onClick={onClick}
        disabled={loading !== null}
        className={cn(
          'w-full py-4 px-6 rounded-xl font-semibold',
          'flex items-center justify-center gap-3',
          'transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          buttonClasses[variant]
        )}
        whileHover={{ scale: loading === null ? 1.02 : 1 }}
        whileTap={{ scale: loading === null ? 0.98 : 1 }}
        variants={flameGlow}
        animate={isLoading ? 'animate' : {}}
      >
        {isLoading ? (
          <FlameLoader size="sm" />
        ) : (
          <>
            {icon}
            <span>{label}</span>
          </>
        )}
      </motion.button>
    );
  };

  return (
    <div className={cn(
      'min-h-screen w-full',
      'bg-gradient-to-br from-[#FF5E3A] via-[#FF7E4A] to-[#FF9E57]',
      'flex items-center justify-center p-4',
      'relative overflow-hidden',
      className
    )}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={flameSlideUp}
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-[#1E1E1E]/95 backdrop-blur-xl',
          'rounded-2xl p-8 md:p-10',
          'border border-white/10',
          'shadow-2xl',
          // Mobile: full screen effect
          'md:rounded-2xl',
          'h-auto md:h-auto'
        )}
      >
        {/* Header */}
        <motion.div
          variants={flameFadeIn}
          className="text-center mb-8"
        >
          <motion.div
            className="mb-4"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
          </motion.div>
          <p className="text-gray-400 text-sm md:text-base">
            {mode === 'login' 
              ? 'Sign in to continue to Lit.it' 
              : 'Join Lit.it and start connecting'}
          </p>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social login buttons */}
        <div className="space-y-3 mb-6">
          <AnimatedButton
            onClick={handleGoogleSignIn}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
            label="Continue with Google"
            loadingState={loading}
            variant="google"
          />

          <AnimatedButton
            onClick={handleAppleSignIn}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            }
            label="Continue with Apple"
            loadingState={loading}
            variant="apple"
          />

          <AnimatedButton
            onClick={handlePhoneSignIn}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
            label="Continue with Phone"
            loadingState={loading}
            variant="phone"
          />
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1E1E1E] text-gray-400">or</span>
          </div>
        </div>

        {/* Magic link form */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <AnimatedInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('Email')}
            onBlur={() => setFocusedField(null)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />

          <button
            type="submit"
            disabled={loading !== null}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-semibold',
              'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
              'hover:from-[#FF6E4A] hover:to-[#FFAE67]',
              'flex items-center justify-center gap-3',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading === 'magic' ? (
              <FlameLoader size="sm" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Send Magic Link</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <motion.div
          className="mt-6 text-center text-sm text-gray-400"
          variants={flameFadeIn}
        >
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/auth/register')}
                className="text-[#FF5E3A] hover:text-[#FF9E57] transition-colors font-semibold"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="text-[#FF5E3A] hover:text-[#FF9E57] transition-colors font-semibold"
              >
                Sign in
              </button>
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Full-screen loader overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1E1E1E]/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <FlameLoader size="lg" />
              <motion.p
                className="mt-6 text-white text-lg font-semibold"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Signing you in...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

