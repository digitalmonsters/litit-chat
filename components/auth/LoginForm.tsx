'use client';

/**
 * Login Form Component
 * 
 * Supports: Google, Apple, Facebook, Phone, Magic Link
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { flameSlideUp, flameFadeIn } from '@/lib/flame-transitions';
import { cn } from '@/lib/utils';

export interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
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
    } finally {
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
    } finally {
      setLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading('facebook');
    setError(null);
    try {
      await signInWithFacebook();
      router.push('/onboarding/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Facebook');
    } finally {
      setLoading(null);
    }
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
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(null);
    }
  };

  const handlePhoneSignIn = async () => {
    setError('Phone authentication coming soon');
    // TODO: Implement phone authentication
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameSlideUp}
      className={cn('w-full max-w-md mx-auto', className)}
    >
      <div className="bg-[#1E1E1E] rounded-2xl p-8 border border-[#FF5E3A]/20 shadow-2xl">
        <motion.div
          variants={flameFadeIn}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent mb-2">
            Welcome to Lit.it
          </h1>
          <p className="text-gray-400">Choose your sign-in method</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {magicLinkSent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
          >
            Check your email for the magic link!
          </motion.div>
        )}

        <div className="space-y-3">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-3"
          >
            {loading === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
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
                Continue with Google
              </>
            )}
          </Button>

          {/* Apple Sign In */}
          <Button
            onClick={handleAppleSignIn}
            disabled={loading !== null}
            className="w-full bg-black text-white hover:bg-gray-900 flex items-center justify-center gap-3"
          >
            {loading === 'apple' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </>
            )}
          </Button>

          {/* Facebook Sign In */}
          <Button
            onClick={handleFacebookSignIn}
            disabled={loading !== null}
            className="w-full bg-[#1877F2] text-white hover:bg-[#166FE5] flex items-center justify-center gap-3"
          >
            {loading === 'facebook' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1E1E1E] text-gray-400">or</span>
            </div>
          </div>

          {/* Magic Link */}
          {!magicLinkSent ? (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5E3A] transition-colors"
                required
              />
              <Button
                type="submit"
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white hover:from-[#FF6E4A] hover:to-[#FFAE67]"
              >
                {loading === 'magic' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>
          ) : (
            <Button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail('');
              }}
              className="w-full bg-gray-700 text-white hover:bg-gray-600"
            >
              Send Another Link
            </Button>
          )}

          {/* Phone Sign In (Coming Soon) */}
          <Button
            onClick={handlePhoneSignIn}
            disabled
            className="w-full bg-gray-800 text-gray-400 cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone Number (Coming Soon)
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

