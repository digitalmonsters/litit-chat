'use client';

/**
 * Auth Callback Page
 * 
 * Handles magic link and OAuth redirects
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isMagicLink } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { signInWithMagicLink } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = window.location.href;
        
        // Check if this is a magic link
        if (isMagicLink(url)) {
          const email = localStorage.getItem('litit-email-for-signin');
          if (!email) {
            setError('No email found. Please try signing in again.');
            setLoading(false);
            return;
          }

          await signInWithMagicLink(email, url);
          localStorage.removeItem('litit-email-for-signin');
          
          // Redirect will happen via AuthContext
          router.push('/onboarding/profile');
        } else {
          // OAuth redirect - AuthContext will handle this
          // Just wait a moment for auth state to update
          setTimeout(() => {
            router.push('/onboarding/profile');
          }, 1000);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, signInWithMagicLink]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF5E3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 text-red-400">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white rounded-lg hover:from-[#FF6E4A] hover:to-[#FFAE67] transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

